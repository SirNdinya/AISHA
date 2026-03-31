import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class NotificationController extends BaseController {
    constructor() {
        super('notifications');
    }

    getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            const result = await pool.query(
                `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
                [userId]
            );

            res.status(200).json({
                status: 'success',
                data: result.rows
            });

        } catch (error) {
            next(error);
        }
    };

    markAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { id } = req.params; // 'all' or specific UUID

            if (id === 'all') {
                await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
            } else {
                await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
            }

            res.status(200).json({ status: 'success', message: 'Marked as read' });

        } catch (error) {
            next(error);
        }
    };
}
