import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';
import { NotificationService } from '../services/NotificationService';
import { RealtimeService } from '../services/RealtimeService';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

export class ApplicationController extends BaseController {
    constructor() {
        super('applications');
    }

    // Student applies for an opportunity
    apply = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { opportunity_id, match_score, match_reason } = req.body;
            
            console.log(`[DEBUG] Apply Attempt - User: ${userId}, Opp: ${opportunity_id}, Score: ${match_score}`);

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) {
                console.warn(`[DEBUG] Apply Failed - No student profile for user ${userId}`);
                return res.status(404).json({ message: 'Student profile not found' });
            }
            const studentId = studentRes.rows[0].id;
            console.log(`[DEBUG] Apply Proceeding - Student: ${studentId}`);

            // Check if already applied
            const checkRes = await pool.query(
                'SELECT id FROM applications WHERE student_id = $1 AND opportunity_id = $2',
                [studentId, opportunity_id]
            );

            if (checkRes.rows.length > 0) {
                console.log(`[DEBUG] Apply - Application already exists for student ${studentId}`);
                return res.status(200).json({ 
                    status: 'success', 
                    message: 'Application already exists', 
                    data: checkRes.rows[0] 
                });
            }

            // Create Application
            const query = `
                INSERT INTO applications (student_id, opportunity_id, status, match_score, match_reason)
                VALUES ($1, $2, 'PENDING', $3, $4)
                RETURNING *
            `;
            const result = await pool.query(query, [studentId, opportunity_id, match_score || 0, match_reason || '']);
            console.log(`[DEBUG] Apply Success - New Application: ${result.rows[0].id}`);

            res.status(201).json({
                status: 'success',
                message: 'Application submitted successfully',
                data: result.rows[0],
            });

        } catch (error) {
            console.error(`[DEBUG] Apply Error:`, error);
            next(error);
        }
    };

    // Get all applications for the logged-in student
    getMyApplications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            console.log(`[DEBUG] GetMyApplications - User: ${userId}`);

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) {
                console.warn(`[DEBUG] GetMyApplications Failed - No student profile for user ${userId}`);
                return res.status(404).json({ message: 'Student profile not found' });
            }
            const studentId = studentRes.rows[0].id;

            const query = `
                SELECT 
                    a.*, 
                    o.title as job_title, 
                    o.location, 
                    o.requirements, 
                    o.description, 
                    o.student_payment_required,
                    o.student_payment_amount,
                    o.stipend_amount,
                    c.name as company_name, 
                    c.logo_url,
                    c.profile_picture_url,
                    c.acceptance_letter_template,
                    c.acceptance_letter_requirements,
                    p.first_assessment_date,
                    p.second_assessment_date,
                    p.status as placement_status,
                    EXISTS (
                        SELECT 1 FROM payments pay 
                        WHERE pay.student_id = a.student_id 
                        AND pay.opportunity_id = a.opportunity_id 
                        AND pay.status = 'COMPLETED'
                    ) as is_paid
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                LEFT JOIN placements p ON p.application_id = a.id
                WHERE a.student_id = $1
                ORDER BY a.applied_at DESC
            `;
            const result = await pool.query(query, [studentId]);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
            });

        } catch (error) {
            next(error);
        }
    };


    // Get all applicants for the logged-in company (across all jobs)
    getAllApplicants = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Get company ID
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;

            const query = `
                SELECT 
                    a.*, 
                    s.first_name, s.last_name, s.course_of_study, s.skills,
                    o.title as job_title
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN opportunities o ON a.opportunity_id = o.id
                WHERE o.company_id = $1
                ORDER BY a.match_score DESC, a.applied_at DESC
            `;
            const result = await pool.query(query, [companyId]);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get applicants for a specific opportunity (Company View)
    getApplicants = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { opportunityId } = req.params;

            // Verify Company owns the opportunity
            // Verify Company owns the opportunity
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;

            // Get Opportunity Config
            const oppCheck = await pool.query('SELECT id, auto_filter_config FROM opportunities WHERE id = $1 AND company_id = $2', [opportunityId, companyId]);
            if (oppCheck.rows.length === 0) return res.status(403).json({ message: 'Unauthorized access to this opportunity' });

            const filterConfig = oppCheck.rows[0].auto_filter_config || {};

            // Fetch Applicants with Student Details
            const query = `
                SELECT a.*, s.first_name, s.last_name, s.course_of_study, s.skills, s.user_id as student_user_id
                FROM applications a
                JOIN students s ON a.student_id = s.id
                WHERE a.opportunity_id = $1
                ORDER BY a.match_score DESC
            `;
            const result = await pool.query(query, [opportunityId]);

            let applicants = result.rows;

            // Apply Auto-Filtering (Skill Index)
            if (filterConfig.min_skill_index) {
                const minSkillIndex = parseInt(filterConfig.min_skill_index);
                applicants = applicants.filter((app: any) => {
                    const skillScore = (app.skills?.length || 0) * 10; // Simple proxy
                    return skillScore >= minSkillIndex;
                });
            }

            // Could add more filters here (e.g. skills mandatory match)

            res.status(200).json({
                status: 'success',
                results: applicants.length,
                data: applicants,
            });

        } catch (error) {
            next(error);
        }
    };

    // Update Application Status (Accept/Reject)
    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params; // Application ID
            const { status } = req.body; // OFFERED, REJECTED, REVIEW

            if (!['PENDING', 'REVIEW', 'ACCEPTED', 'REJECTED', 'OFFERED'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            // Ownership Check: Ensure the company admin owns the opportunity related to this application
            const ownershipQuery = `
                SELECT a.id, s.institution_id, s.first_name, s.last_name, o.title as job_title
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN students s ON a.student_id = s.id
                WHERE a.id = $1 AND o.company_id = (SELECT id FROM companies WHERE user_id = $2)
            `;
            const ownerRes = await pool.query(ownershipQuery, [id, (req as any).user.id]);
            if (ownerRes.rows.length === 0) return res.status(403).json({ message: 'Unauthorized: You do not manage this application' });

            let query = `
                UPDATE applications 
                SET status = $1 
                WHERE id = $2 
                RETURNING *
            `;

            if (status === 'OFFERED') {
                query = `
                    UPDATE applications 
                    SET status = $1, offer_expires_at = NOW() + INTERVAL '2 days'
                    WHERE id = $2 
                    RETURNING *
                `;
            }

            const result = await pool.query(query, [status, id]);

            if (result.rows.length === 0) return res.status(404).json({ message: 'Application not found' });

            const application = result.rows[0];
            const appData = ownerRes.rows[0];

            // Notify Institution
            const instId = appData.institution_id;
            const studentName = `${appData.first_name} ${appData.last_name}`;

            // Real-time update for Institution Dashboard
            RealtimeService.emitToInstitution(instId, 'placement_update', {
                application_id: application.id,
                student_name: studentName,
                status: status,
                job_title: appData.job_title,
                timestamp: new Date().toISOString()
            });

            // Create persistent notification for institution admins
            const instUserRes = await pool.query('SELECT user_id FROM institutions WHERE id = $1', [instId]);
            if (instUserRes.rows.length > 0) {
                await NotificationService.createNotification(
                    instUserRes.rows[0].user_id,
                    'Placement Update',
                    `${studentName} application for ${appData.job_title} has been ${status.toLowerCase()}.`,
                    (status === 'ACCEPTED' || status === 'OFFERED') ? 'SUCCESS' : 'INFO'
                );
            }

            // Notify Student
            const studUserRes = await pool.query('SELECT user_id FROM students WHERE id = (SELECT student_id FROM applications WHERE id = $1)', [id]);
            if (studUserRes.rows.length > 0) {
                await NotificationService.notifyApplicationStatus(studUserRes.rows[0].user_id, status, ownerRes.rows[0].company_name || 'Host Company');
            }

            res.status(200).json({
                status: 'success',
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

    respondToOffer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { decision, feedback } = req.body; // decision: 'ACCEPTED' or 'DECLINED'

            if (!['ACCEPTED', 'DECLINED'].includes(decision)) {
                return res.status(400).json({ status: 'error', message: 'Invalid decision. Use ACCEPTED or DECLINED.' });
            }

            // Verify ownership and current status
            const checkQuery = `
                SELECT a.*, o.title as job_title, c.user_id as company_user_id 
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                WHERE a.id = $1 AND s.user_id = $2
            `;
            const checkRes = await pool.query(checkQuery, [id, userId]);

            if (checkRes.rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Offer not found or unauthorized' });
            }

            const app = checkRes.rows[0];
            if (app.status !== 'OFFERED') {
                return res.status(400).json({ status: 'error', message: `Cannot respond to application with status: ${app.status}` });
            }

            // Update status within a transaction if accepted
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Update Application Status
                const updateQuery = 'UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
                const result = await client.query(updateQuery, [decision, id]);
                const updatedApp = result.rows[0];

                if (decision === 'ACCEPTED') {
                    // 1. Check if the student already has active placements
                    const existingPlacementRes = await client.query(
                        `SELECT p.id, a.opportunity_id, p.application_id 
                         FROM placements p 
                         JOIN applications a ON p.application_id = a.id 
                         WHERE p.student_id = $1 AND p.status = 'ACTIVE'`,
                        [app.student_id]
                    );

                    if (existingPlacementRes.rows.length > 0) {
                        for (const oldPlacement of existingPlacementRes.rows) {
                            // Release old slots
                            await client.query(
                                'UPDATE opportunities SET vacancies = vacancies + 1 WHERE id = $1',
                                [oldPlacement.opportunity_id]
                            );

                            // Archive old placement completely
                            await client.query(
                                "DELETE FROM placements WHERE id = $1",
                                [oldPlacement.id]
                            );
                            
                            // Delete old application completely to erase traces
                            if (oldPlacement.application_id) {
                                await client.query(
                                    "DELETE FROM applications WHERE id = $1",
                                    [oldPlacement.application_id]
                                );
                            }

                            console.log(`[PLACEMENT] Released student ${app.student_id} from old opportunity ${oldPlacement.opportunity_id} (Purged)`);
                        }
                    }

                    // 2. Decrement Vacancies for the new opportunity
                    await client.query(
                        'UPDATE opportunities SET vacancies = vacancies - 1 WHERE id = $1 AND vacancies > 0',
                        [app.opportunity_id]
                    );

                    // 3. Create Placement Record
                    const durationMonths = app.duration_months || 3;
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(startDate.getMonth() + durationMonths);

                    await client.query(`
                        INSERT INTO placements (
                            application_id, student_id, opportunity_id, company_id, 
                            start_date, end_date, status
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
                    `, [id, app.student_id, app.opportunity_id, app.company_id, startDate, endDate]);

                    // 4. Trigger Payment Notification if required
                    const oppRes = await client.query(
                        'SELECT title, student_payment_required, student_payment_amount FROM opportunities WHERE id = $1',
                        [app.opportunity_id]
                    );
                    const opportunity = oppRes.rows[0];

                    if (opportunity.student_payment_required && opportunity.student_payment_amount > 0) {
                        const { NotificationService } = require('../services/NotificationService');
                        await NotificationService.notifyPaymentRequired(
                            userId,
                            opportunity.student_payment_amount,
                            opportunity.title,
                            app.opportunity_id
                        );
                    }
                }

                await client.query('COMMIT');

                // Notify Company
                // Notify Company
                const { NotificationService } = require('../services/NotificationService');

                const title = decision === 'ACCEPTED' ? 'Offer Accepted!' : 'Offer Declined';
                const msg = `Candidate has ${decision.toLowerCase()} your offer for ${app.job_title}.${feedback ? ` Feedback: ${feedback}` : ''}`;

                await NotificationService.createNotification(app.company_user_id, title, msg, decision === 'ACCEPTED' ? 'SUCCESS' : 'WARNING');

                // Notify Student of their own action (persistent record)
                const studentNotificationTitle = decision === 'ACCEPTED' ? 'Placement Confirmed!' : 'Offer Declined';
                const studentNotificationMsg = decision === 'ACCEPTED' 
                    ? `You have successfully accepted the offer for ${app.job_title} at ${app.company_name || 'the host company'}. Your attachment slot is now secured.`
                    : `You have declined the offer for ${app.job_title} at ${app.company_name || 'the host company'}.`;
                
                await NotificationService.createNotification(userId, studentNotificationTitle, studentNotificationMsg, decision === 'ACCEPTED' ? 'SUCCESS' : 'INFO');

                // Notify Institution of student's decision
                const instRes = await client.query('SELECT institution_id FROM students WHERE user_id = $1', [userId]);
                if (instRes.rows.length > 0) {
                    const instId = instRes.rows[0].institution_id;
                    const { RealtimeService } = require('../services/RealtimeService');
                    RealtimeService.emitToInstitution(instId, 'placement_decision', {
                        application_id: id,
                        student_id: app.student_id,
                        decision: decision,
                        job_title: app.job_title,
                        timestamp: new Date().toISOString()
                    });
                }

                res.status(200).json({
                    status: 'success',
                    data: updatedApp
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            next(error);
        }
    };

    downloadAcceptanceLetter = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params; // Application ID
            const userId = (req as any).user.id;

            // Comprehensive query: pull ALL dynamic data for the letter
            const query = `
                SELECT 
                    a.id as app_id, a.status, a.match_reason, a.applied_at,
                    s.first_name, s.last_name, s.admission_number, s.course_of_study,
                    i.name as institution_name, i.code as institution_code,
                    c.name as company_name, c.logo_url, c.profile_picture_url, c.location as company_location, 
                    c.acceptance_letter_requirements, c.representative_phone,
                    o.title as job_title, o.description as job_description, o.location as job_location,
                    o.requirements as job_requirements, o.duration_months, o.start_date as opp_start_date,
                    p.start_date as placement_start, p.end_date as placement_end,
                    cs.name as supervisor_name, cs.email as supervisor_email,
                    cd.name as department_name
                FROM applications a
                JOIN students s ON a.student_id = s.id
                LEFT JOIN institutions i ON s.institution_id = i.id
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                LEFT JOIN placements p ON a.id = p.application_id
                LEFT JOIN company_supervisors cs ON p.supervisor_id = cs.id
                LEFT JOIN company_departments cd ON COALESCE(p.department_id, o.department_id) = cd.id
                WHERE a.id = $1 AND (s.user_id = $2 OR c.user_id = $2)
            `;
            const result = await pool.query(query, [id, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Application not found or unauthorized.' });
            }

            const d = result.rows[0];
            
            if (d.status !== 'ACCEPTED') {
                 return res.status(403).json({ message: 'Acceptance letter is only available for accepted placements.' });
            }

            // Resolve dates
            const startDate = d.placement_start || d.opp_start_date || d.applied_at;
            const startStr = startDate ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To Be Confirmed';
            const endStr = d.placement_end ? new Date(d.placement_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
            const durationStr = d.duration_months ? `${d.duration_months} month${d.duration_months > 1 ? 's' : ''}` : '3 months';
            const refNo = `AISHA/ATT/${d.app_id.split('-')[0].toUpperCase()}/${new Date().getFullYear()}`;

            const doc = new PDFDocument({ margin: 55, size: 'A4' });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Acceptance_Letter_${d.last_name}_${d.first_name}.pdf`);
            doc.pipe(res);

            // ============================================================
            // HEADER — Company Branding
            // ============================================================
            let logoRendered = false;
            const logoPath = d.profile_picture_url || d.logo_url;
            
            if (logoPath) {
                try {
                    if (logoPath.startsWith('http')) {
                        // Remote logo from Cloud Storage
                        const response = await axios.get(logoPath, { responseType: 'arraybuffer' });
                        const logoBuffer = Buffer.from(response.data, 'utf-8');
                        doc.image(logoBuffer, 55, 40, { width: 65 });
                        logoRendered = true;
                    } else if (logoPath.startsWith('/uploads')) {
                        // Local logo (fallback for existing records or dev)
                        const relPath = logoPath.startsWith('/') ? logoPath.substring(1) : logoPath;
                        const fullPath = path.join(__dirname, '../../', relPath);
                        if (fs.existsSync(fullPath)) {
                            doc.image(fullPath, 55, 40, { width: 65 });
                            logoRendered = true;
                        }
                    }
                } catch (e) {
                    console.error('Logo render error:', e);
                }
            }

            const headerX = logoRendered ? 135 : 55;
            doc.fillColor('#0f2b46')
               .fontSize(22)
               .font('Helvetica-Bold')
               .text(d.company_name.toUpperCase(), headerX, 45);
            
            const companyAddr = d.job_location || d.company_location || '';
            if (companyAddr) {
                doc.fillColor('#4a5568')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(companyAddr, headerX, 72);
            }

            // Divider
            doc.strokeColor('#1a73e8').lineWidth(2)
               .moveTo(55, 100).lineTo(540, 100).stroke();
            doc.strokeColor('#e2e8f0').lineWidth(0.5)
               .moveTo(55, 103).lineTo(540, 103).stroke();

            // ============================================================
            // DATE & REFERENCE
            // ============================================================
            doc.moveDown(1.5);
            const dateY = 118;
            doc.fillColor('#2d3748').fontSize(10).font('Helvetica')
               .text(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 55, dateY)
               .text(`Ref: ${refNo}`, 55, dateY + 15);

            // ============================================================
            // ADDRESSEE
            // ============================================================
            doc.moveDown(1.5);
            const addrY = dateY + 45;
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#2d3748')
               .text(`${d.first_name} ${d.last_name}`, 55, addrY);
            doc.font('Helvetica').fontSize(10);
            if (d.admission_number) doc.text(`Reg. No: ${d.admission_number}`);
            if (d.course_of_study) doc.text(`${d.course_of_study}`);
            if (d.institution_name) doc.text(`${d.institution_name}`);

            // ============================================================
            // SUBJECT LINE
            // ============================================================
            doc.moveDown(1.5);
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f2b46')
               .text('RE: ACCEPTANCE FOR INDUSTRIAL ATTACHMENT', { underline: true });

            // ============================================================
            // BODY — Paragraph 1: Acceptance confirmation
            // ============================================================
            doc.moveDown(1);
            doc.font('Helvetica').fontSize(10.5).fillColor('#2d3748');

            const dearLine = `Dear ${d.first_name},`;
            doc.text(dearLine).moveDown(0.7);

            let bodyPara1 = `Following your application, we are pleased to inform you that ${d.company_name} has accepted you for an industrial attachment position as a **${d.job_title}**`;
            if (d.department_name) bodyPara1 += ` in the ${d.department_name} department`;
            bodyPara1 += `.`;

            // Render with inline bold for job title
            const parts1 = bodyPara1.split('**');
            let inline = false;
            parts1.forEach((part: string, index: number) => {
                const isLast = index === parts1.length - 1;
                if (inline) {
                    doc.font('Helvetica-Bold').text(part, { continued: !isLast });
                } else {
                    doc.font('Helvetica').text(part, { continued: !isLast });
                }
                inline = !inline;
            });
            doc.moveDown(0.5);

            // Body — Paragraph 2: Dates
            let bodyPara2 = `Your attachment is scheduled to commence on ${startStr}`;
            if (endStr) bodyPara2 += ` and conclude on ${endStr}`;
            bodyPara2 += `, for a total duration of ${durationStr}.`;
            if (d.supervisor_name) {
                bodyPara2 += ` You will report to ${d.supervisor_name}`;
                if (d.supervisor_email) bodyPara2 += ` (${d.supervisor_email})`;
                bodyPara2 += ` who will serve as your industrial supervisor.`;
            }
            doc.font('Helvetica').text(bodyPara2, { align: 'justify', lineGap: 4 });
            doc.moveDown(0.8);

            // ============================================================
            // PLACEMENT DETAILS TABLE
            // ============================================================
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f2b46')
               .text('PLACEMENT DETAILS');
            doc.moveDown(0.3);

            const tableData: [string, string][] = [
                ['Position', d.job_title],
                ['Department', d.department_name || 'General'],
                ['Location', d.job_location || d.company_location || 'Company Headquarters'],
                ['Duration', durationStr],
                ['Commencement Date', startStr],
            ];
            if (endStr) tableData.push(['End Date', endStr]);
            if (d.supervisor_name) tableData.push(['Supervisor', d.supervisor_name]);

            const tableStartY = doc.y;
            const col1X = 60;
            const col2X = 220;
            const rowH = 20;

            if (doc.y + (tableData.length * rowH) + 50 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }

            // Table header background
            doc.rect(col1X - 5, doc.y, 480, rowH).fill('#0f2b46');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
               .text('Detail', col1X, doc.y + 5)
               .text('Information', col2X, doc.y + 5);
            
            let currentTableY = doc.y - 5;

            tableData.forEach((row, idx) => {
                const y = currentTableY + rowH * (idx + 1);
                const bgColor = idx % 2 === 0 ? '#f7fafc' : '#edf2f7';
                doc.rect(col1X - 5, y, 480, rowH).fill(bgColor);
                doc.fillColor('#2d3748').fontSize(9)
                   .font('Helvetica-Bold').text(row[0], col1X, y + 5)
                   .font('Helvetica').text(row[1], col2X, y + 5);
            });

            // Reset the X coordinates back to the left margin before continuing normal text flow
            doc.x = 55;
            doc.y = currentTableY + rowH * (tableData.length + 1) + 15;

            // ============================================================
            // REQUIREMENTS & INSTRUCTIONS
            // ============================================================
            const reqs = d.job_requirements;
            const docReqs = d.acceptance_letter_requirements;

            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f2b46')
               .text('REQUIREMENTS & INSTRUCTIONS');
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(10).fillColor('#2d3748');

            doc.text('Please ensure you report with the following items:', { lineGap: 3, indent: 0 });
            
            const reqItems = docReqs && docReqs.trim() ? docReqs.split(/[,\n]/)
                .map((r: string) => r.replace(/^\d+[\.\)]\s*/, '').trim())
                .filter((r: string) => r.length > 0) : [];
            
            // Explicitly force the letter as a requirement
            reqItems.push('A printed copy of this Acceptance Letter');

            reqItems.forEach((item: string) => {
                doc.text(`• ${item}`, { indent: 15, lineGap: 3 });
            });
            doc.moveDown(0.3);

            if (reqs && reqs.trim()) {
                doc.font('Helvetica-Bold').text('Job Requirements:', { lineGap: 3, indent: 0 });
                doc.font('Helvetica');
                const jobReqItems = reqs.split(/[,\n]/)
                    .map((r: string) => r.replace(/^\d+[\.\)]\s*/, '').trim())
                    .filter((r: string) => r.length > 0);

                if (jobReqItems.length > 1) {
                    jobReqItems.forEach((item: string, i: number) => {
                        doc.text(`${i + 1}. ${item}`, { indent: 15, lineGap: 3 });
                    });
                } else {
                    doc.text(reqs.trim(), { align: 'justify', lineGap: 3 });
                }
            }
            doc.moveDown(0.5);

            // ============================================================
            // CLOSING
            // ============================================================
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10.5).fillColor('#2d3748')
               .text('We look forward to welcoming you and trust that this attachment will provide you with valuable professional experience. Please report to our offices on the commencement date indicated above.', { align: 'justify', lineGap: 4 });

            doc.moveDown(0.5);
            doc.text('Please do not hesitate to contact us should you require any further information.', { align: 'justify', lineGap: 4 });

            // ============================================================
            // SIGNATURE BLOCK
            // ============================================================
            doc.moveDown(2);
            if (doc.y + 80 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }
            const startY = doc.y;

            // Company Signature
            doc.text('Yours faithfully,', 55, startY);
            
            doc.strokeColor('#2d3748').lineWidth(0.5)
               .moveTo(55, startY + 40).lineTo(250, startY + 40).stroke();
               
            doc.font('Helvetica-Bold').fontSize(10)
               .text('Human Resources Manager', 55, startY + 45);
            doc.font('Helvetica').fontSize(10)
               .text(d.company_name, 55, startY + 58);
            if (companyAddr) doc.text(companyAddr, 55, startY + 71);
            if (d.representative_phone) {
                const phoneY = companyAddr ? startY + 84 : startY + 71;
                doc.text(`Contact: ${d.representative_phone}`, 55, phoneY);
            }

            // Student Signature
            doc.font('Helvetica').text('Accepted By (Student):', 300, startY);
            
            doc.strokeColor('#2d3748').lineWidth(0.5)
               .moveTo(300, startY + 40).lineTo(540, startY + 40).stroke();
               
            doc.font('Helvetica').fontSize(10)
               .text('Signature & Date', 300, startY + 45);
            doc.text(`${d.first_name} ${d.last_name}`, 300, startY + 58);


            // ============================================================
            // FOOTER — System stamp
            // ============================================================
            doc.page.margins.bottom = 0; // Disable bottom margin for footer
            const footerY = doc.page.height - 40;
            doc.strokeColor('#e2e8f0').lineWidth(0.5)
               .moveTo(55, footerY).lineTo(540, footerY).stroke();
            doc.fillColor('#a0aec0').fontSize(7).font('Helvetica')
               .text('This letter was generated by AISHA', 55, footerY + 5, { align: 'center', lineBreak: false })
               .text(`Ref: ${refNo}`, 55, footerY + 15, { align: 'center', lineBreak: false });

            doc.end();

        } catch (error) {
            next(error);
        }
    };
}
