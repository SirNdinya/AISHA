import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class InstitutionPortalController extends BaseController {
    constructor() {
        super('institutions');
    }

    /**
     * Get Analytics Overview for the Institution
     * Fetches combined data from public and tenant schema
     */
    getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const institutionId = (req as any).user?.institution_id || req.params.id;

            // 1. Get Institution Info & Schema
            const instRes = await pool.query('SELECT schema_name, code as institution_code, email_template FROM institutions WHERE id = $1', [institutionId]);
            if (instRes.rows.length === 0) return res.status(404).json({ message: 'Institution not found' });

            const { schema_name: schemaName, institution_code: institutionCode, email_template: emailTemplate } = instRes.rows[0];

            // 2. Fetch Aggregated Stats
            const isDeptAdmin = (req as any).user?.role === 'DEPARTMENT_ADMIN';
            const deptId = (req as any).user?.department_id;

            const statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM students WHERE institution_id = $1 ${isDeptAdmin ? 'AND department_id = $2' : ''}) as total_enrolled,
                    (SELECT COUNT(*) FROM students s JOIN applications a ON s.id = a.student_id WHERE s.institution_id = $1 ${isDeptAdmin ? 'AND s.department_id = $2' : ''}) as total_applications,
                    (SELECT COUNT(*) FROM students s JOIN applications a ON s.id = a.student_id WHERE s.institution_id = $1 AND a.status = 'ACCEPTED' ${isDeptAdmin ? 'AND s.department_id = $2' : ''}) as success_placements,
                    (SELECT COUNT(*) FROM students s JOIN applications a ON s.id = a.student_id WHERE s.institution_id = $1 AND a.status = 'PENDING' ${isDeptAdmin ? 'AND s.department_id = $2' : ''}) as pending_placements,
                    (SELECT COUNT(*) FROM departments WHERE institution_id = $1) as department_count
            `;

            const stats = await pool.query(statsQuery, isDeptAdmin ? [institutionId, deptId] : [institutionId]);

            // 3. Fetch Departmental Breakdown
            const deptBreakdown = await pool.query(`
                SELECT d.name, d.code,
                       (SELECT COUNT(*) FROM students s WHERE s.department_id = d.id) as student_count,
                       (SELECT COUNT(*) FROM students s JOIN applications a ON s.id = a.student_id WHERE s.department_id = d.id AND a.status = 'ACCEPTED') as placed_count
                FROM departments d
                WHERE d.institution_id = $1 ${isDeptAdmin ? 'AND d.id = $2' : ''}
            `, isDeptAdmin ? [institutionId, deptId] : [institutionId]);

            res.status(200).json({
                status: 'success',
                data: {
                    overview: {
                        ...stats.rows[0],
                        institution_code: institutionCode,
                        email_template: emailTemplate
                    },
                    departments: deptBreakdown.rows,
                    institution_id: institutionId,
                    schema: schemaName
                }
            });

        } catch (error) {
            next(error);
        }
    };

    /**
     * Student Manager - List all students within the institutional isolation
     */
    getStudents = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const institutionId = (req as any).user?.institution_id || req.params.id;

            // Get schema name
            const instRes = await pool.query('SELECT schema_name FROM institutions WHERE id = $1', [institutionId]);
            const schemaName = instRes.rows[0]?.schema_name;

            if (!schemaName) {
                return res.status(400).json({ message: 'Institutional schema not initialized' });
            }

            // Fetch from isolated schema
            const query = `SELECT * FROM ${schemaName}.student_records ORDER BY created_at DESC`;
            const result = await pool.query(query);

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
     * Integrated Student Sync status - ENHANCED with metadata
     */
    getSyncStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const institutionId = (req as any).user?.institution_id || req.params.id;
            const isDeptAdmin = (req as any).user?.role === 'DEPARTMENT_ADMIN';
            const deptId = (req as any).user?.department_id;

            // 1. Get schema and department context
            const instRes = await pool.query('SELECT schema_name FROM institutions WHERE id = $1', [institutionId]);
            const schemaName = instRes.rows[0]?.schema_name;
            if (!schemaName) return res.status(400).json({ message: 'Institutional schema not initialized' });

            let deptName = null;
            if (isDeptAdmin) {
                const deptRes = await pool.query('SELECT name FROM departments WHERE id = $1', [deptId]);
                deptName = deptRes.rows[0]?.name;
            }

            // 2. Fetch all records from institutional schema joined with platform registration
            const query = `
                SELECT 
                    ir.id as institutional_id,
                    ir.reg_number as admission_number, 
                    ir.full_name, 
                    ir.course as course_of_study,
                    ir.year_of_study as current_year,
                    s.id as platform_id,
                    s.sync_status,
                    s.last_sync_at,
                    CASE WHEN s.user_id IS NOT NULL THEN 'REGISTERED' ELSE 'UNREGISTERED' END as registration_status,
                    d.name as department_name
                FROM ${schemaName}.student_records ir
                LEFT JOIN students s ON ir.reg_number = s.admission_number AND s.institution_id = $1
                LEFT JOIN departments d ON s.department_id = d.id
                WHERE 1=1
                ${isDeptAdmin ? 'AND ir.course ILIKE $2' : ''}
                ORDER BY ir.reg_number ASC
            `;
            const result = await pool.query(query, isDeptAdmin ? [institutionId, `%${deptName}%`] : [institutionId]);

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update Institutional / Admin Settings
     */
    updateSettings = async (req: Request, res: Response, next: NextFunction) => {
        const client = await pool.connect();
        try {
            const userId = (req as any).user?.id;
            const institutionId = (req as any).user?.institution_id;
            const { firstName, lastName, institutionName } = req.body;

            await client.query('BEGIN');

            // 1. Update User Profile
            if (firstName || lastName) {
                await client.query(`
                    UPDATE users 
                    SET first_name = COALESCE($1, first_name), 
                        last_name = COALESCE($2, last_name)
                    WHERE id = $3
                `, [firstName, lastName, userId]);
            }

            // 2. Update Institution Profile
            if (institutionName) {
                await client.query(`
                    UPDATE institutions 
                    SET name = $1
                    WHERE id = $2
                `, [institutionName, institutionId]);
            }

            await client.query('COMMIT');

            res.status(200).json({
                status: 'success',
                message: 'Settings updated successfully'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    };

    /**
     * Placement Tracker - List all placements for students in the institution
     */
    getPlacements = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const institutionId = (req as any).user?.institution_id || req.params.id;

            const isDeptAdmin = (req as any).user?.role === 'DEPARTMENT_ADMIN';
            const deptId = (req as any).user?.department_id;

            const query = `
                SELECT 
                    a.id,
                    s.first_name, 
                    s.last_name, 
                    o.title as role,
                    c.name as company_name,
                    c.location,
                    a.status,
                    a.applied_at as start_date
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                WHERE s.institution_id = $1 AND a.status IN ('ACCEPTED', 'OFFERED', 'COMPLETED')
                ${isDeptAdmin ? 'AND s.department_id = $2' : ''}
                ORDER BY a.updated_at DESC
            `;
            const result = await pool.query(query, isDeptAdmin ? [institutionId, deptId] : [institutionId]);

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Document Hub - List all documents related to placements in the institution
     */
    getDocuments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const institutionId = (req as any).user?.institution_id || req.params.id;

            const isDeptAdmin = (req as any).user?.role === 'DEPARTMENT_ADMIN';
            const deptId = (req as any).user?.department_id;

            const query = `
                SELECT 
                    a.id,
                    'Placement Letter' as type,
                    s.first_name || ' ' || s.last_name as student_name,
                    'AUTO' as mode,
                    95 as score,
                    CASE 
                        WHEN a.status = 'ACCEPTED' THEN 'VERIFIED'
                        WHEN a.status = 'OFFERED' THEN 'PENDING'
                        ELSE 'FLAGGED'
                    END as status
                FROM applications a
                JOIN students s ON a.student_id = s.id
                WHERE s.institution_id = $1 AND a.status IN ('ACCEPTED', 'OFFERED')
                ${isDeptAdmin ? 'AND s.department_id = $2' : ''}
                ORDER BY a.updated_at DESC
            `;
            const result = await pool.query(query, isDeptAdmin ? [institutionId, deptId] : [institutionId]);

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };
}
