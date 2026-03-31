import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class LearningController extends BaseController {
    constructor() {
        super('learning_resources');
    }

    // Get all resources
    getAllResources = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query('SELECT * FROM learning_resources ORDER BY created_at DESC');
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    // Get recommended resources based on student skills
    getRecommended = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Get Student Skills
            const studentRes = await pool.query('SELECT skills FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });

            const skills = studentRes.rows[0].skills || [];

            if (skills.length === 0) {
                // Return general resources if no skills
                return this.getAllResources(req, res, next);
            }

            // Find resources that match skills (Overlap)
            const query = `
                SELECT * FROM learning_resources 
                WHERE skills_covered && $1
                ORDER BY created_at DESC
            `;

            const result = await pool.query(query, [skills]);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
                message: result.rows.length === 0 ? 'No specific recommendations found. Try adding more skills.' : 'Recommended resources based on your skills.'
            });

        } catch (error) {
            next(error);
        }
    };
}
