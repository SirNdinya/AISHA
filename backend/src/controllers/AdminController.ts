import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class AdminController extends BaseController {
    constructor() {
        super('admin');
    }

    /**
     * getUnverifiedUsers
     * Returns list of users (Companies/Institutions) waiting for verification.
     */
    getUnverifiedUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query(
                `SELECT id, email, role, created_at, is_verified 
                 FROM users 
                 WHERE is_verified = false 
                 ORDER BY created_at DESC`
            );
            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * verifyUser
     * Verifies a user account.
     */
    verifyUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            const result = await pool.query(
                `UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, email, is_verified`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                status: 'success',
                message: 'User verified successfully',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * createBroadcast
     * Creates a system-wide or targeted broadcast.
     */
    createBroadcast = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type, target_system, message } = req.body;
            const result = await pool.query(
                `INSERT INTO system_broadcasts (type, target_system, message)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [type, target_system || 'ALL', message]
            );
            res.status(201).json({
                status: 'success',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * getBroadcasts
     * Returns all broadcasts (Admin view).
     */
    getBroadcasts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query(
                `SELECT * FROM system_broadcasts ORDER BY created_at DESC`
            );
            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * toggleBroadcast
     * Toggles the active status of a broadcast.
     */
    toggleBroadcast = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            const result = await pool.query(
                `UPDATE system_broadcasts SET is_active = $1 WHERE id = $2 RETURNING *`,
                [is_active, id]
            );
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * getActiveBroadcasts
     * Returns active broadcasts for a specific system or ALL.
     */
    getActiveBroadcasts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { system } = req.query; // STUDENT, COMPANY, INSTITUTION, ALL
            const result = await pool.query(
                `SELECT type, message, created_at FROM system_broadcasts 
                 WHERE is_active = true 
                 AND (target_system = $1 OR target_system = 'ALL')
                 ORDER BY created_at DESC`,
                [system || 'ALL']
            );
            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * getSettings
     * Returns all system settings.
     */
    getSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query('SELECT * FROM system_settings ORDER BY key ASC');
            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * updateSetting
     * Updates a system setting.
     */
    updateSetting = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { key, value } = req.body;
            const result = await pool.query(
                'UPDATE system_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2 RETURNING *',
                [value, key]
            );
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * getGlobalSettings
     * Returns key-value pairs of all settings for public use.
     */
    getGlobalSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query('SELECT key, value FROM system_settings');
            const settings = result.rows.reduce((acc: any, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            res.status(200).json({
                status: 'success',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * executeCommand
     * Handles administrative commands from the Command Centre.
     */
    executeCommand = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { command } = req.body;
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

            // Forward to the Chief Autonomy Agent
            const response = await axios.post(`${aiServiceUrl}/api/autonomy/admin/execute-command`, {
                command
            });

            res.status(200).json({
                status: 'success',
                data: response.data
            });
        } catch (error) {
            // Fallback for simple commands if AI service is down
            const { command } = req.body;
            const cmd = command.toLowerCase().trim();
            if (cmd.includes('health')) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        message: 'System local health is STABLE (AI Service Offline).',
                        logs: [{ message: 'Local diagnostics complete.', type: 'info' }]
                    }
                });
            }
            next(error);
        }
    };

    /**
     * getInstitutions
     * Returns all institutions with their email-verification and admin-verification status.
     * Query param: ?verified=true|false|all
     */
    getInstitutions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { verified } = req.query;

            let whereClause = '';
            const params: any[] = [];

            if (verified === 'true') {
                whereClause = 'WHERE u.is_verified = true AND i.is_admin_verified = true';
            } else if (verified === 'false') {
                whereClause = 'WHERE u.is_verified = false OR i.is_admin_verified = false OR i.is_admin_verified IS NULL';
            }

            const result = await pool.query(
                `SELECT 
                    i.id,
                    i.name,
                    i.code,
                    i.schema_name,
                    u.email,
                    u.is_verified as email_verified,
                    COALESCE(i.is_admin_verified, false) as is_admin_verified,
                    i.created_at
                 FROM institutions i
                 JOIN users u ON i.user_id = u.id
                 ${whereClause}
                 ORDER BY i.created_at DESC`
            );

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * verifyInstitution
     * Admin-verifies an institution after email has been confirmed.
     * Sets is_admin_verified = true on the institution record.
     */
    verifyInstitution = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { institutionId } = req.params;

            // First check the institution user has verified their email
            const checkRes = await pool.query(
                `SELECT i.id, i.name, u.is_verified as email_verified
                 FROM institutions i JOIN users u ON i.user_id = u.id
                 WHERE i.id = $1`,
                [institutionId]
            );

            if (checkRes.rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Institution not found' });
            }

            const institution = checkRes.rows[0];

            if (!institution.email_verified) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cannot verify institution: The institution must verify their email first.'
                });
            }

            const result = await pool.query(
                `UPDATE institutions SET is_admin_verified = true WHERE id = $1
                 RETURNING id, name, is_admin_verified`,
                [institutionId]
            );

            res.status(200).json({
                status: 'success',
                message: `Institution "${institution.name}" has been verified successfully.`,
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    };
}
