import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';
import { NotificationService } from '../services/NotificationService';
import { RealtimeService } from '../services/RealtimeService';

export class ApplicationController extends BaseController {
    constructor() {
        super('applications');
    }

    // Student applies for an opportunity
    apply = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { opportunity_id } = req.body;

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;

            // Check if already applied
            const checkRes = await pool.query(
                'SELECT id FROM applications WHERE student_id = $1 AND opportunity_id = $2',
                [studentId, opportunity_id]
            );

            if (checkRes.rows.length > 0) {
                return res.status(200).json({ 
                    status: 'success', 
                    message: 'Application already exists', 
                    data: checkRes.rows[0] 
                });
            }

            // Create Application
            // TODO: In Phase 2.2, we will add AI Match Score calculation here
            const query = `
                INSERT INTO applications (student_id, opportunity_id, status, match_score)
                VALUES ($1, $2, 'PENDING', 0)
                RETURNING *
            `;
            const result = await pool.query(query, [studentId, opportunity_id]);

            // 3. Trigger Autonomous Review (System Pilot)
            const { AutomationService } = require('../services/AutomationService');
            await AutomationService.runAutonomousReview(opportunity_id);

            // 4. Notify Company
            const compUserRes = await pool.query('SELECT user_id FROM companies WHERE id = (SELECT company_id FROM opportunities WHERE id = $1)', [opportunity_id]);
            if (compUserRes.rows.length > 0) {
                const studentName = (await pool.query('SELECT first_name, last_name FROM students WHERE id = $1', [studentId])).rows[0];
                await NotificationService.notifyNewApplication(compUserRes.rows[0].user_id, `${studentName.first_name} ${studentName.last_name}`);
            }

            res.status(201).json({
                status: 'success',
                message: 'Application submitted successfully',
                data: result.rows[0],
            });

        } catch (error) {
            next(error);
        }
    };

    // Get all applications for the logged-in student
    getMyApplications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;

            const query = `
                SELECT 
                    a.*, 
                    o.title as job_title, 
                    o.location, 
                    o.requirements, 
                    o.description, 
                    o.match_reasoning,
                    c.name as company_name, 
                    c.logo_url
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
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
                SELECT a.*, s.first_name, s.last_name, s.course_of_study, s.cv_url, s.resume_text, s.skills, s.user_id as student_user_id
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
                    // 1. Decrement Vacancies
                    await client.query(
                        'UPDATE opportunities SET vacancies = vacancies - 1 WHERE id = $1 AND vacancies > 0',
                        [app.opportunity_id]
                    );

                    // 2. Create Placement Record
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

                    // 3. Trigger Payment Notification if required
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
                const { NotificationService } = require('../services/NotificationService');
                const { MessageService } = require('../services/MessageService');

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
                    RealtimeService.emitToInstitution(instId, 'placement_decision', {
                        application_id: id,
                        student_id: app.student_id,
                        decision: decision,
                        job_title: app.job_title,
                        timestamp: new Date().toISOString()
                    });
                }

                // Send automatic message with feedback
                if (feedback) {
                    await MessageService.sendMessage(userId, app.company_user_id, `Response to Offer: ${decision}. ${feedback}`, {
                        appId: id
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
}
