import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class DepartmentController extends BaseController {
    constructor() {
        super('departments');
    }

    /**
     * Create a new department with an admin profile
     */
    createDepartment = async (req: Request, res: Response, next: NextFunction) => {
        const client = await pool.connect();
        try {
            const { institution_id, name, code, description, email, password } = req.body;

            await client.query('BEGIN');

            // 1. Create User Profile for Department Admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userRes = await client.query(`
                INSERT INTO users (email, password_hash, role, is_verified)
                VALUES ($1, $2, 'DEPARTMENT_ADMIN', TRUE)
                RETURNING id
            `, [email, hashedPassword]);

            const userId = userRes.rows[0].id;

            // 2. Create Department
            const deptRes = await client.query(`
                INSERT INTO departments (institution_id, user_id, name, code, description)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [institution_id, userId, name, code, description]);

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                data: deptRes.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    };

    /**
     * Get departments for a specific institution
     */
    getByInstitution = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const institutionId = req.params.institutionId || (req as any).user?.institution_id;

            const result = await pool.query(`
                SELECT d.*, u.email as admin_email, u.is_active,
                       (SELECT COUNT(*) FROM students s WHERE s.department_id = d.id) as student_count,
                       (SELECT COUNT(*) FROM students s 
                        JOIN applications a ON s.id = a.student_id 
                        WHERE s.department_id = d.id AND a.status = 'ACCEPTED') as placed_count
                FROM departments d
                LEFT JOIN users u ON d.user_id = u.id
                WHERE d.institution_id = $1
            `, [institutionId]);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Autonomous Dashboard Metadata Update (AI/ML trigger)
     */
    updateMetadata = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { metadata } = req.body;

            const result = await pool.query(
                'UPDATE departments SET metadata = metadata || $1 WHERE id = $2 RETURNING *',
                [JSON.stringify(metadata), id]
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
     * Assign an administrator to an existing department
     */
    assignAdmin = async (req: Request, res: Response, next: NextFunction) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { email, password } = req.body;

            await client.query('BEGIN');

            // 1. Check if department exists
            const deptCheck = await client.query('SELECT user_id FROM departments WHERE id = $1', [id]);
            if (deptCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Department not found' });
            }

            // 2. Create User Profile for Department Admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Check if user already exists
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            let userId;

            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].id;
                await client.query(
                    "UPDATE users SET role = 'DEPARTMENT_ADMIN', password_hash = $1, is_verified = TRUE WHERE id = $2",
                    [hashedPassword, userId]
                );
            } else {
                const userRes = await client.query(`
                    INSERT INTO users (email, password_hash, role, is_verified)
                    VALUES ($1, $2, 'DEPARTMENT_ADMIN', TRUE)
                    RETURNING id
                `, [email, hashedPassword]);
                userId = userRes.rows[0].id;
            }

            // 3. Link User to Department
            const updatedDept = await client.query(`
                UPDATE departments 
                SET user_id = $1 
                WHERE id = $2 
                RETURNING *
            `, [userId, id]);

            await client.query('COMMIT');

            res.status(200).json({
                status: 'success',
                data: updatedDept.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    };

    /**
     * Activate/Deactivate a department admin account
     */
    toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            // Get user_id from department
            const deptRes = await pool.query('SELECT user_id FROM departments WHERE id = $1', [id]);
            if (deptRes.rows.length === 0 || !deptRes.rows[0].user_id) {
                return res.status(404).json({ message: 'Department admin not found' });
            }

            const userId = deptRes.rows[0].user_id;

            await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);

            res.status(200).json({
                status: 'success',
                message: `Account ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all departments
     */
    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query('SELECT id, name, code, institution_id FROM departments ORDER BY name ASC');
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };
}
