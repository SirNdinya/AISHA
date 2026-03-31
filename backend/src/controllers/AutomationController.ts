import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class AutomationController extends BaseController {
    constructor() {
        super('automation');
    }

    /**
     * Trigger Auto-Matching for a specific student.
     * Logic:
     * 1. Check if student has 'auto_apply_enabled'.
     * 2. Find OPEN opportunities where skills_required overlaps with student.skills.
     * 3. If overlap > 0 (or some threshold), auto-create application.
     */
    runAutoMatch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Get Student ID first to pass to service
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
            const studentId = studentRes.rows[0].id;

            const { AutomationService } = require('../services/AutomationService');
            const result = await AutomationService.runAutoMatch(studentId, userId);

            res.status(200).json({
                status: 'success',
                message: result.message,
                matches_found: result.matches_found,
                applied_job_ids: result.applied_ids
            });

        } catch (error) {
            next(error);
        }
    };

    /**
     * Toggle Auto-Apply Setting
     */
    toggleAutoApply = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { enabled } = req.body;

            const result = await pool.query(
                'UPDATE students SET auto_apply_enabled = $1 WHERE user_id = $2 RETURNING auto_apply_enabled',
                [enabled, userId]
            );

            if (result.rows.length === 0) return res.status(404).json({ message: 'Student not found' });

            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });

        } catch (error) {
            next(error);
        }
    };
}
