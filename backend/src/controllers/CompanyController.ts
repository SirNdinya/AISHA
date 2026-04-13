import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class CompanyController extends BaseController {
    constructor() {
        super('companies');
    }

    getProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }

            const query = `
                SELECT c.*, u.email, u.phone_number 
                FROM companies c
                JOIN users u ON c.user_id = u.id
                WHERE c.user_id = $1
            `;

            const result = await pool.query(query, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Company profile not found',
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });

        } catch (error) {
            next(error);
        }
    };

    updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { name, industry, description, website, logo_url, profile_picture_url, acceptance_letter_template, acceptance_letter_requirements } = req.body;

            const query = `
                UPDATE companies 
                SET name = COALESCE($1, name),
                    industry = COALESCE($2, industry),
                    description = COALESCE($3, description),
                    website = COALESCE($4, website),
                    logo_url = COALESCE($5, logo_url),
                    profile_picture_url = COALESCE($6, profile_picture_url),
                    acceptance_letter_template = COALESCE($7, acceptance_letter_template),
                    acceptance_letter_requirements = COALESCE($8, acceptance_letter_requirements)
                WHERE user_id = $9
                RETURNING *
            `;

            const result = await pool.query(query, [
                name, industry, description, website, logo_url, profile_picture_url, acceptance_letter_template, acceptance_letter_requirements, userId
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Company profile not found' });
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };

    uploadProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'No file uploaded' });
            }

            const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

            const query = `
                UPDATE companies 
                SET profile_picture_url = $1,
                    logo_url = COALESCE(logo_url, $1)
                WHERE user_id = $2
                RETURNING *
            `;

            const result = await pool.query(query, [profilePictureUrl, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Company profile not found' });
            }

            res.status(200).json({
                status: 'success',
                message: 'Profile picture uploaded successfully',
                data: {
                    profile_picture_url: profilePictureUrl
                }
            });

        } catch (error) {
            next(error);
        }
    };

    getTalentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;

            const { CompanyService } = require('../services/CompanyService');

            const [forecast, skillGaps] = await Promise.all([
                CompanyService.getDemandForecast(companyId),
                CompanyService.getSkillGapAnalysis(companyId)
            ]);

            const metricsRes = await pool.query(`
                SELECT 
                    (SELECT COUNT(DISTINCT student_id) FROM placements WHERE company_id = $1 AND status = 'ACTIVE') as active_placements,
                    (SELECT COUNT(*) FROM applications a JOIN opportunities o ON a.opportunity_id = o.id WHERE o.company_id = $1 AND a.status = 'PENDING') as pending_applicants,
                    COUNT(*) as total_apps
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.id
                WHERE o.company_id = $1
            `, [companyId]);

            const { active_placements, pending_applicants, total_apps } = metricsRes.rows[0];
            const efficiency = total_apps > 0 ? Math.round((active_placements / total_apps) * 100) : 0;

            const recentActivitiesRes = await pool.query(`
                WITH placement_history AS (
                    SELECT 
                        p.id,
                        p.student_id,
                        p.status,
                        p.created_at,
                        LAG(p.status) OVER (PARTITION BY p.student_id ORDER BY p.created_at ASC, p.id ASC) as prev_status,
                        s.first_name,
                        s.last_name
                    FROM placements p
                    JOIN students s ON p.student_id = s.id
                    WHERE p.company_id = $1
                )
                SELECT 
                    first_name,
                    last_name,
                    status,
                    prev_status,
                    created_at as time
                FROM placement_history
                WHERE prev_status IS NULL OR prev_status != status
                ORDER BY created_at DESC, id DESC
                LIMIT 5
            `, [companyId]);
            
            const recent_activities = recentActivitiesRes.rows.map((row: any) => {
                const name = `${row.first_name} ${row.last_name}`;
                const description = row.prev_status 
                    ? `Placement Updated: ${name} (${row.prev_status} → ${row.status})`
                    : `New Placement Match: ${name} (${row.status})`;
                
                return {
                    description,
                    time: new Date(row.time).toLocaleDateString() + ' ' + new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            });

            res.status(200).json({
                status: 'success',
                data: {
                    demand_forecast: forecast,
                    skill_gaps: skillGaps,
                    efficiency_score: efficiency || 0,
                    active_placements: parseInt(active_placements) || 0,
                    pending_applicants: parseInt(pending_applicants) || 0,
                    recent_activities
                }
            });
        } catch (error) {
            next(error);
        }
    };

    // --- Department Management ---
    getDepartments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = await this.getCompanyId(req);
            const result = await pool.query('SELECT * FROM company_departments WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
            res.status(200).json({ status: 'success', data: result.rows });
        } catch (error) { next(error); }
    };

    createDepartment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = await this.getCompanyId(req);
            const { name, description } = req.body;
            const result = await pool.query(
                'INSERT INTO company_departments (company_id, name, description) VALUES ($1, $2, $3) RETURNING *',
                [companyId, name, description]
            );
            res.status(201).json({ status: 'success', data: result.rows[0] });
        } catch (error) { next(error); }
    };

    deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = await this.getCompanyId(req);
            await pool.query('DELETE FROM company_departments WHERE id = $1 AND company_id = $2', [req.params.id, companyId]);
            res.status(204).send();
        } catch (error) { next(error); }
    };

    // --- Supervisor Management ---
    getSupervisors = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = await this.getCompanyId(req);
            const result = await pool.query(`
                SELECT cs.*, cd.name as department_name 
                FROM company_supervisors cs
                LEFT JOIN company_departments cd ON cs.department_id = cd.id
                WHERE cs.company_id = $1 ORDER BY cs.created_at DESC
            `, [companyId]);
            res.status(200).json({ status: 'success', data: result.rows });
        } catch (error) { next(error); }
    };

    createSupervisor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = await this.getCompanyId(req);
            const { name, email, phone, department_id } = req.body;
            const result = await pool.query(
                `INSERT INTO company_supervisors (company_id, department_id, name, email, phone) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [companyId, department_id || null, name, email, phone]
            );
            res.status(201).json({ status: 'success', data: result.rows[0] });
        } catch (error) { next(error); }
    };

    deleteSupervisor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = await this.getCompanyId(req);
            await pool.query('DELETE FROM company_supervisors WHERE id = $1 AND company_id = $2', [req.params.id, companyId]);
            res.status(204).send();
        } catch (error) { next(error); }
    };

    private async getCompanyId(req: Request): Promise<string> {
        const userId = (req as any).user?.id;
        const res = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
        if (res.rows.length === 0) throw new Error('Company not found');
        return res.rows[0].id;
    }
}

