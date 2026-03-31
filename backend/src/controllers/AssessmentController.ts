import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';
import { NotificationService } from '../services/NotificationService';

export class AssessmentController extends BaseController {
    constructor() {
        super('assessments');
    }

    proposeAssessment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { placement_id, proposed_date } = req.body;

            // Get institution ID
            const instRes = await pool.query('SELECT id FROM institutions WHERE user_id = $1', [userId]);
            if (instRes.rows.length === 0) return res.status(403).json({ message: 'Only institutions can propose assessments' });
            const institutionId = instRes.rows[0].id;

            // Verify placement and get company/student details
            const placementRes = await pool.query(`
                SELECT p.id, p.company_id, c.user_id as company_user_id, s.user_id as student_user_id, s.first_name, s.last_name
                FROM placements p
                JOIN companies c ON p.company_id = c.id
                JOIN students s ON p.student_id = s.id
                WHERE p.id = $1
            `, [placement_id]);

            if (placementRes.rows.length === 0) return res.status(404).json({ message: 'Placement not found' });
            const placement = placementRes.rows[0];

            const result = await pool.query(`
                INSERT INTO assessments (placement_id, institution_id, company_id, proposed_date, status)
                VALUES ($1, $2, $3, $4, 'PROPOSED')
                RETURNING *
            `, [placement_id, institutionId, placement.company_id, proposed_date]);

            const assessment = result.rows[0];

            // Notify Company
            await NotificationService.createNotification(
                placement.company_user_id,
                'New Assessment Proposed',
                `An assessment has been proposed for ${placement.first_name} ${placement.last_name} on ${new Date(proposed_date).toLocaleDateString()}. Please confirm or reschedule.`,
                'INFO',
                false,
                { type: 'ASSESSMENT_PROPOSED', assessmentId: assessment.id }
            );

            res.status(201).json({ status: 'success', data: assessment });
        } catch (error) { next(error); }
    };

    updateAssessmentStatus = async (req: Request, res: Response, next: NextFunction) => {
        // Companies use this to confirm or reject
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { status, confirmed_date } = req.body; // status: CONFIRMED, REJECTED, COMPLETED

            if (!['CONFIRMED', 'REJECTED', 'COMPLETED'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            // Verify company
            const compRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (compRes.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });
            const companyId = compRes.rows[0].id;

            const assessmentRes = await pool.query(`
                SELECT a.*, i.user_id as inst_user_id, s.user_id as student_user_id, s.first_name, s.last_name
                FROM assessments a
                JOIN institutions i ON a.institution_id = i.id
                JOIN placements p ON a.placement_id = p.id
                JOIN students s ON p.student_id = s.id
                WHERE a.id = $1 AND a.company_id = $2
            `, [id, companyId]);

            if (assessmentRes.rows.length === 0) return res.status(404).json({ message: 'Assessment not found' });
            const assessment = assessmentRes.rows[0];

            const result = await pool.query(`
                UPDATE assessments 
                SET status = $1, confirmed_date = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `, [status, confirmed_date || assessment.proposed_date, id]);

            const updated = result.rows[0];

            // Notify Institution
            await NotificationService.createNotification(
                assessment.inst_user_id,
                `Assessment ${status}`,
                `The company has ${status.toLowerCase()} the assessment for ${assessment.first_name} ${assessment.last_name}.`,
                status === 'CONFIRMED' ? 'SUCCESS' : (status === 'COMPLETED' ? 'SUCCESS' : 'WARNING'),
                false,
                { type: 'ASSESSMENT_UPDATE', assessmentId: id }
            );

            // Notify Student if confirmed
            if (status === 'CONFIRMED') {
                const confDate = new Date(updated.confirmed_date).toLocaleDateString();
                await NotificationService.createNotification(
                    assessment.student_user_id,
                    'Field Assessment Scheduled',
                    `Your field assessment has been confirmed for ${confDate}. Please ensure your logbook is up to date.`,
                    'INFO'
                );
            }

            res.status(200).json({ status: 'success', data: updated });
        } catch (error) { next(error); }
    };

    getAssessments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { role } = req.query; // Explicitly pass role from frontend, or infer from user table

            let query = `
                SELECT a.*, s.first_name, s.last_name, c.name as company_name, i.name as institution_name
                FROM assessments a
                JOIN placements p ON a.placement_id = p.id
                JOIN students s ON p.student_id = s.id
                JOIN companies c ON a.company_id = c.id
                JOIN institutions i ON a.institution_id = i.id
            `;
            const params: any[] = [userId];

            if (role === 'COMPANY') {
                query += ` WHERE a.company_id = (SELECT id FROM companies WHERE user_id = $1)`;
            } else if (role === 'INSTITUTION') {
                query += ` WHERE a.institution_id = (SELECT id FROM institutions WHERE user_id = $1)`;
            } else if (role === 'STUDENT') {
                query += ` WHERE p.student_id = (SELECT id FROM students WHERE user_id = $1)`;
            } else {
                return res.status(400).json({ message: 'Role parameter required (COMPANY, INSTITUTION, STUDENT)' });
            }

            query += ` ORDER BY a.updated_at DESC`;

            const result = await pool.query(query, params);
            res.status(200).json({ status: 'success', data: result.rows });
        } catch (error) { next(error); }
    };
}
