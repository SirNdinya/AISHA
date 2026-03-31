
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class PlacementController extends BaseController {
    constructor() {
        super('placements');
    }

    // Get active placements for the logged-in company
    getMyPlacements = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Get company ID
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;

            const query = `
                SELECT p.*, s.first_name, s.last_name, s.course_of_study, o.title as job_title,
                       d.name as department_name, sup.name as supervisor_name
                FROM placements p
                JOIN students s ON p.student_id = s.id
                JOIN opportunities o ON p.opportunity_id = o.id
                LEFT JOIN company_departments d ON p.department_id = d.id
                LEFT JOIN company_supervisors sup ON p.supervisor_id = sup.id
                WHERE p.company_id = $1
                ORDER BY p.created_at DESC
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

    // Update feedback for a placement
    submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params; // Placement ID
            const { feedback } = req.body;
            const userId = (req as any).user?.id;

            // Verify ownership
            const ownershipQuery = `
                SELECT p.id FROM placements p
                JOIN companies c ON p.company_id = c.id
                WHERE p.id = $1 AND c.user_id = $2
            `;
            const ownershipRes = await pool.query(ownershipQuery, [id, userId]);
            if (ownershipRes.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });

            const query = `
                UPDATE placements 
                SET feedback = $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING *
            `;
            const result = await pool.query(query, [JSON.stringify(feedback), id]);

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };

    // Generate Certificate (Mocking logic for now)
    generateCertificate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id;

            // Verify ownership
            const ownershipQuery = `
                SELECT p.id, s.first_name, s.last_name, o.title as job_title, c.name as company_name
                FROM placements p
                JOIN students s ON p.student_id = s.id
                JOIN opportunities o ON p.opportunity_id = o.id
                JOIN companies c ON p.company_id = c.id
                WHERE p.id = $1 AND c.user_id = $2
            `;
            const ownershipRes = await pool.query(ownershipQuery, [id, userId]);
            if (ownershipRes.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });

            const data = ownershipRes.rows[0];
            const certUrl = `https://storage.aisha.io/certs/${id}.pdf`; // Mock URL

            const query = `
                UPDATE placements 
                SET certificate_url = $1, status = 'COMPLETED', updated_at = NOW() 
                WHERE id = $2 
                RETURNING *
            `;
            await pool.query(query, [certUrl, id]);

            res.status(200).json({
                status: 'success',
                message: 'Certificate generated successfully',
                data: { certificate_url: certUrl }
            });
        } catch (error) {
            next(error);
        }
    };

    // Submit a supervisory assessment
    submitAssessment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { placement_id, assessment_date, comments, digital_signature, assessor_type } = req.body;
            const userId = (req as any).user?.id;

            const query = `
                INSERT INTO assessments (placement_id, assessor_id, assessor_type, assessment_date, comments, digital_signature, is_signed)
                VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                RETURNING *
            `;
            const result = await pool.query(query, [
                placement_id,
                userId,
                assessor_type,
                assessment_date,
                comments,
                digital_signature
            ]);

            // Notify Student about the assessment
            const { NotificationService } = require('../services/NotificationService');
            const studentUserRes = await pool.query(
                'SELECT user_id FROM students s JOIN placements p ON s.id = p.student_id WHERE p.id = $1',
                [placement_id]
            );
            if (studentUserRes.rows.length > 0) {
                await NotificationService.createNotification(
                    studentUserRes.rows[0].user_id,
                    'New Assessment Available',
                    `A new ${assessor_type.toLowerCase()} assessment has been recorded for your placement.`,
                    'SUCCESS'
                );
            }

            res.status(201).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };

    // Get assessments for a placement
    getAssessments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params; // placement_id
            const query = `
                SELECT a.*, (SELECT first_name || ' ' || last_name FROM users WHERE id = a.assessor_id) as assessor_name
                FROM assessments a
                WHERE a.placement_id = $1
                ORDER BY a.assessment_date DESC
            `;
            const result = await pool.query(query, [id]);

            res.status(200).json({
                status: 'success',
                data: result.rows,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get list of student contacts for a company (based on placements)
    getStudentContacts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const query = `
                SELECT DISTINCT s.user_id as id, s.first_name || ' ' || s.last_name as name, 'STUDENT' as type
                FROM placements p
                JOIN students s ON p.student_id = s.id
                JOIN companies c ON p.company_id = c.id
                WHERE c.user_id = $1
            `;
            const result = await pool.query(query, [userId]);
            res.status(200).json({ status: 'success', data: result.rows });
        } catch (error) {
            next(error);
        }
    };

    // Get weekly logbook entries for a placement or for own placement (student)
    getWeeklyLogbooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const userRole = (req as any).user?.role;
            const { placement_id, week_number } = req.query;

            let query = `
                SELECT l.*, s.first_name, s.last_name 
                FROM weekly_logbook_entries l
                JOIN students s ON l.student_id = s.id
                WHERE 1=1
            `;
            const params: any[] = [];

            if (userRole === 'STUDENT') {
                query += ` AND l.student_id = (SELECT id FROM students WHERE user_id = $${params.length + 1})`;
                params.push(userId);
            } else if (placement_id) {
                query += ` AND l.placement_id = $${params.length + 1}`;
                params.push(placement_id);
            }

            if (week_number) {
                query += ` AND l.week_number = $${params.length + 1}`;
                params.push(week_number);
            }

            query += ' ORDER BY l.week_number ASC';

            const result = await pool.query(query, params);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
            });
        } catch (error) {
            next(error);
        }
    };

    // Save or submit a weekly logbook entry
    saveWeeklyLogbook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const {
                week_number, start_date, end_date,
                monday_description, tuesday_description, wednesday_description,
                thursday_description, friday_description, saturday_description,
                weekly_summary, is_submitting
            } = req.body;

            // Get student and active placement
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;

            const placementRes = await pool.query(
                "SELECT id FROM placements WHERE student_id = $1 AND status = 'ACTIVE' LIMIT 1",
                [studentId]
            );
            const placementId = placementRes.rows[0]?.id || null;

            const existingRes = await pool.query(
                "SELECT id FROM weekly_logbook_entries WHERE placement_id = $1 AND week_number = $2",
                [placementId, week_number]
            );

            let status = is_submitting ? 'PENDING_INDUSTRY' : 'DRAFT';
            let studentSignatureDate = is_submitting ? new Date() : null;

            let result;
            if (existingRes.rows.length > 0) {
                // Update
                const query = `
                    UPDATE weekly_logbook_entries
                    SET monday_description = $1, tuesday_description = $2, wednesday_description = $3,
                        thursday_description = $4, friday_description = $5, saturday_description = $6,
                        weekly_summary = $7, status = $8, student_signature_date = COALESCE(student_signature_date, $9),
                        updated_at = NOW()
                    WHERE id = $10
                    RETURNING *
                `;
                result = await pool.query(query, [
                    monday_description, tuesday_description, wednesday_description,
                    thursday_description, friday_description, saturday_description,
                    weekly_summary, status, studentSignatureDate, existingRes.rows[0].id
                ]);
            } else {
                // Insert
                const query = `
                    INSERT INTO weekly_logbook_entries (
                        student_id, placement_id, week_number, start_date, end_date,
                        monday_description, tuesday_description, wednesday_description,
                        thursday_description, friday_description, saturday_description,
                        weekly_summary, status, student_signature_date
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *
                `;
                result = await pool.query(query, [
                    studentId, placementId, week_number, start_date, end_date,
                    monday_description, tuesday_description, wednesday_description,
                    thursday_description, friday_description, saturday_description,
                    weekly_summary, status, studentSignatureDate
                ]);
            }

            res.status(201).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };

    // Supervisor sign logbook
    signWeeklyLogbook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const userRole = (req as any).user?.role; // 'COMPANY' or 'INSTITUTION' (or ADMIN)
            const { logbook_id, comments } = req.body;

            const logbookRes = await pool.query("SELECT * FROM weekly_logbook_entries WHERE id = $1", [logbook_id]);
            if (logbookRes.rows.length === 0) return res.status(404).json({ message: 'Logbook entry not found' });
            const logbook = logbookRes.rows[0];

            let query = '';
            let params = [];

            if (userRole === 'COMPANY' || userRole === 'SUPERVISOR') { // Adjust based on exact roles
                if (logbook.status !== 'PENDING_INDUSTRY') {
                    return res.status(400).json({ message: 'Logbook is not waiting for industry supervisor signature.' });
                }
                query = `
                    UPDATE weekly_logbook_entries
                    SET industry_supervisor_comments = $1, 
                        industry_supervisor_signature_date = NOW(),
                        status = 'PENDING_UNIVERSITY',
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING *
                `;
                params = [comments, logbook_id];
            } else if (userRole === 'INSTITUTION' || userRole === 'ADMIN') {
                if (logbook.status !== 'PENDING_UNIVERSITY') {
                    return res.status(400).json({ message: 'Logbook is not waiting for university supervisor signature.' });
                }
                query = `
                    UPDATE weekly_logbook_entries
                    SET university_supervisor_comments = $1, 
                        university_supervisor_signature_date = NOW(),
                        status = 'COMPLETED',
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING *
                `;
                params = [comments, logbook_id];
            } else {
                return res.status(403).json({ message: 'Forbidden' });
            }

            const result = await pool.query(query, params);

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };

    // Export weekly logbook to PDF mimicking physical documents
    exportWeeklyLogbookToPDF = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const userRole = (req as any).user?.role;
            const { placement_id, week_number } = req.query;

            let entriesQuery = `
                SELECT l.*, s.first_name, s.last_name, s.admission_number, i.name as institution_name
                FROM weekly_logbook_entries l
                JOIN students s ON l.student_id = s.id
                LEFT JOIN institutions i ON s.institution_id = i.id
                WHERE 1=1
            `;
            const params: any[] = [];

            if (userRole === 'STUDENT') {
                entriesQuery += ` AND l.student_id = (SELECT id FROM students WHERE user_id = $${params.length + 1})`;
                params.push(userId);
            } else if (placement_id) {
                entriesQuery += ` AND l.placement_id = $${params.length + 1}`;
                params.push(placement_id);
            }
            
            if (week_number) {
                entriesQuery += ` AND l.week_number = $${params.length + 1}`;
                params.push(week_number);
            }

            entriesQuery += ' ORDER BY l.week_number ASC';

            const entriesRes = await pool.query(entriesQuery, params);
            const entries = entriesRes.rows;

            if (entries.length === 0) {
                return res.status(404).json({ message: 'No entries found for export' });
            }

            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let filename = `Logbook_${entries[0].first_name}_${entries[0].last_name}.pdf`;

            res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
            res.setHeader('Content-type', 'application/pdf');

            doc.pipe(res);

            entries.forEach((entry: any, index: number) => {
                if (index > 0) doc.addPage();
                
                const studentRegNo = entry.admission_number || 'N/A';
                const studentName = `${entry.first_name} ${entry.last_name}`;
                
                // --- PAGE 1: WEEKLY PROGRESS CHART ---
                doc.fontSize(16).font('Helvetica-Bold').text('WEEKLY PROGRESS CHART', { align: 'center' });
                doc.moveDown(2);
                
                doc.fontSize(12).font('Helvetica');
                doc.text(`WEEK ${entry.week_number}`, { align: 'right' });
                doc.moveDown();
                
                const startDateStr = new Date(entry.start_date).toLocaleDateString();
                const endDateStr = new Date(entry.end_date).toLocaleDateString();
                doc.text(`DATE: From: ${startDateStr}     To: ${endDateStr}`);
                doc.moveDown();

                // Table Header
                let y = doc.y;
                doc.rect(50, y, 500, 30).stroke();
                doc.font('Helvetica-Bold');
                doc.text('DAY & DATE', 55, y + 10, { width: 100 });
                doc.text('DESCRIPTION OF WORK DONE', 160, y + 10, { width: 250 });
                doc.text('Industry Supervisor Signature', 415, y + 10, { width: 130 });
                y += 30;

                doc.font('Helvetica');
                const days = [
                    { name: 'MONDAY', desc: entry.monday_description },
                    { name: 'TUESDAY', desc: entry.tuesday_description },
                    { name: 'WEDNESDAY', desc: entry.wednesday_description },
                    { name: 'THURSDAY', desc: entry.thursday_description },
                    { name: 'FRIDAY', desc: entry.friday_description }
                ];
                
                days.forEach(day => {
                    const rowHeight = 70;
                    doc.rect(50, y, 500, rowHeight).stroke();
                    
                    // Column Lines
                    doc.moveTo(155, y).lineTo(155, y + rowHeight).stroke();
                    doc.moveTo(410, y).lineTo(410, y + rowHeight).stroke();
                    
                    doc.font('Helvetica-Bold').text(day.name, 55, y + 10);
                    doc.font('Helvetica').text('DATE:_________________', 55, y + 30);
                    doc.text(day.desc || '', 160, y + 5, { width: 240, height: rowHeight - 10 });
                    
                    y += rowHeight;
                });

                doc.moveDown(2);
                doc.text(`REGN NO: ${studentRegNo}`, 50, doc.y, { continued: true });
                doc.text(`SIGN: ${entry.student_signature_date ? 'Student Signed' : '_________'} `, { align: 'right' });

                // --- PAGE 2: TRAINEE'S WEEKLY REPORT ---
                doc.addPage();
                
                // Saturday Row Fragment
                const rowHeight = 70;
                y = doc.y;
                doc.rect(50, y, 500, rowHeight).stroke();
                doc.moveTo(155, y).lineTo(155, y + rowHeight).stroke();
                doc.moveTo(410, y).lineTo(410, y + rowHeight).stroke();
                
                doc.font('Helvetica-Bold').text('SATURDAY', 55, y + 10);
                doc.font('Helvetica').text('DATE:_________________', 55, y + 30);
                doc.text(entry.saturday_description || '', 160, y + 5, { width: 240, height: rowHeight - 10 });
                
                doc.moveDown(2);
                
                doc.fontSize(14).font('Helvetica-Bold').text("TRAINEE'S WEEKLY REPORT");
                doc.fontSize(10).font('Helvetica').text('(A summary of the whole week, sketches/diagrams may be attached where necessary)');
                doc.moveDown();
                
                // Huge text box
                const summaryY = doc.y;
                doc.rect(50, summaryY, 500, 400).stroke();
                doc.text(entry.weekly_summary || '', 55, summaryY + 10, { width: 490 });
                
                doc.text(`REGN NO: ${studentRegNo}`, 50, doc.page.height - 100, { continued: true });
                doc.text('SIGN: _________', { align: 'right' });

                // --- PAGE 3: WEEKLY CONFIRMATION BY SUPERVISORS ---
                doc.addPage();
                doc.fontSize(16).font('Helvetica-Bold').text('WEEKLY CONFIRMATION BY SUPERVISORS', { align: 'center' });
                doc.moveDown(3);
                
                doc.fontSize(12).font('Helvetica-Bold').text('Comments by industry-based supervisor:');
                doc.font('Helvetica').text(entry.industry_supervisor_comments || '____________________________________________________\n____________________________________________________\n____________________________________________________');
                doc.moveDown(2);
                
                doc.text('Name of supervisor: ___________________');
                let sig = entry.industry_supervisor_signature_date ? 'Signed Digitally' : '___________';
                let dt = entry.industry_supervisor_signature_date ? new Date(entry.industry_supervisor_signature_date).toLocaleDateString() : '___________';
                doc.text(`Supervisor's signature: ${sig}          Date: ${dt}`);
                
                doc.moveDown(3);
                
                doc.font('Helvetica-Bold').text('Comments by the assessing University supervisor:');
                doc.font('Helvetica').text(entry.university_supervisor_comments || '____________________________________________________\n____________________________________________________\n____________________________________________________');
                doc.moveDown(2);
                
                doc.text('Name of supervisor: ___________________');
                sig = entry.university_supervisor_signature_date ? 'Signed Digitally' : '___________';
                dt = entry.university_supervisor_signature_date ? new Date(entry.university_supervisor_signature_date).toLocaleDateString() : '___________';
                doc.text(`Supervisor's signature: ${sig}          Date: ${dt}`);
                
                doc.text(`REGN NO: ${studentRegNo}`, 50, doc.page.height - 100, { continued: true });
                doc.text(`SIGN: ${entry.student_signature_date ? 'Student Signed' : '_________'}`, { align: 'right' });
            });

            doc.end();
        } catch (error) {
            next(error);
        }
    }

    // Get list of host company contacts for a student (based on placements)
    getHostContacts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const query = `
                SELECT DISTINCT c.user_id as id, c.name, 'COMPANY' as type
                FROM placements p
                JOIN students s ON p.student_id = s.id
                JOIN companies c ON p.company_id = c.id
                WHERE s.user_id = $1
            `;
            const result = await pool.query(query, [userId]);
            res.status(200).json({ status: 'success', data: result.rows });
        } catch (error) {
            next(error);
        }
    };

    // Update placement details (department, supervisor)
    updatePlacement = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { department_id, supervisor_id, status } = req.body;
            const userId = (req as any).user?.id;

            // Verify ownership
            const ownershipQuery = `
                SELECT p.id FROM placements p
                JOIN companies c ON p.company_id = c.id
                WHERE p.id = $1 AND c.user_id = $2
            `;
            const ownershipRes = await pool.query(ownershipQuery, [id, userId]);
            if (ownershipRes.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });

            const query = `
                UPDATE placements 
                SET department_id = COALESCE($1, department_id),
                    supervisor_id = COALESCE($2, supervisor_id),
                    status = COALESCE($3, status),
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `;
            const result = await pool.query(query, [department_id, supervisor_id, status, id]);

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };
}
