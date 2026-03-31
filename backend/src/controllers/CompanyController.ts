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
        // ... (existing updateProfile logic)
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

            // Real-time metrics
            const metricsRes = await pool.query(`
                SELECT 
                    COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as active_placements,
                    COUNT(*) as total_apps
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.id
                WHERE o.company_id = $1
            `, [companyId]);

            const { active_placements, total_apps } = metricsRes.rows[0];
            const efficiency = total_apps > 0 ? Math.round((active_placements / total_apps) * 100) : 0;

            res.status(200).json({
                status: 'success',
                data: {
                    demand_forecast: forecast,
                    skill_gaps: skillGaps,
                    efficiency_score: efficiency || 0,
                    active_placements: parseInt(active_placements) || 0
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

