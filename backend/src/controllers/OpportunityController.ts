import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { BaseController } from './BaseController';

export class OpportunityController extends BaseController {
    constructor() {
        super('opportunities');
    }

    // Get opportunities specifically for the logged-in company
    getMyOpportunities = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // First get company ID from user ID
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });

            const companyId = companyRes.rows[0].id;

            const query = `
                SELECT o.*, d.name as department_name 
                FROM opportunities o
                LEFT JOIN company_departments d ON o.department_id = d.id
                WHERE o.company_id = $1 
                ORDER BY o.created_at DESC
            `;
            const result = await pool.query(query, [companyId]);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
            });
        } catch (error) {
            console.error('Error in getMyOpportunities:', error);
            next(error);
        }
    };

    createOpportunity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            // Get company ID
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;

            const {
                title, description, requirements, location,
                type, stipend_amount, duration_months,
                application_deadline, vacancies,
                auto_filter_config, scheduled_for,
                department_id,
                student_payment_required, student_payment_amount,
                start_date
            } = req.body;

            const query = `
                INSERT INTO opportunities (
                    company_id, title, description, requirements, location, 
                    type, stipend_amount, duration_months, 
                    application_deadline, vacancies,
                    auto_filter_config, scheduled_for,
                    department_id,
                    student_payment_required, student_payment_amount, start_date
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `;

            const values = [
                companyId,
                title || null,
                description || null,
                requirements || null,
                location || null,
                type || 'ATTACHMENT',
                stipend_amount || 0,
                duration_months || 3,
                application_deadline === '' || application_deadline === undefined ? null : application_deadline,
                vacancies || 1,
                auto_filter_config || {},
                scheduled_for === '' || scheduled_for === undefined ? null : scheduled_for,
                department_id === '' || department_id === undefined ? null : department_id,
                student_payment_required || false,
                student_payment_amount || 0,
                start_date === '' || start_date === undefined ? null : start_date
            ];

            const result = await pool.query(query, values);

            res.status(201).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            console.error('Error in createOpportunity:', error);
            next(error);
        }
    };

    updateOpportunity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;
            const oppId = req.params.id;

            // Verify ownership
            const existingOpp = await pool.query('SELECT id FROM opportunities WHERE id = $1 AND company_id = $2', [oppId, companyId]);
            if (existingOpp.rows.length === 0) {
                return res.status(404).json({ message: 'Opportunity not found or access denied' });
            }

            const {
                title, description, requirements, location,
                stipend_amount, application_deadline, vacancies,
                department_id, start_date, student_payment_required, student_payment_amount
            } = req.body;

            const query = `
                UPDATE opportunities 
                SET title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    requirements = COALESCE($3, requirements),
                    location = COALESCE($4, location),
                    stipend_amount = COALESCE($5, stipend_amount),
                    application_deadline = COALESCE($6, application_deadline),
                    vacancies = COALESCE($7, vacancies),
                    department_id = COALESCE($8, department_id),
                    start_date = COALESCE($9, start_date),
                    student_payment_required = COALESCE($10, student_payment_required),
                    student_payment_amount = COALESCE($11, student_payment_amount)
                WHERE id = $12 AND company_id = $13
                RETURNING *
            `;

            const values = [
                title || null,
                description || null,
                requirements || null,
                location || null,
                stipend_amount || 0,
                application_deadline === '' || application_deadline === undefined ? null : application_deadline,
                vacancies || 1,
                department_id === '' || department_id === undefined ? null : department_id,
                start_date === '' || start_date === undefined ? null : start_date,
                student_payment_required || false,
                student_payment_amount || 0,
                oppId,
                companyId
            ];

            const result = await pool.query(query, values);

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            console.error('Error in getMyOpportunities:', error);
            next(error);
        }
    };

    deleteOpportunity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
            if (companyRes.rows.length === 0) return res.status(404).json({ message: 'Company not found' });
            const companyId = companyRes.rows[0].id;
            const oppId = req.params.id;

            const existingOpp = await pool.query('SELECT id FROM opportunities WHERE id = $1 AND company_id = $2', [oppId, companyId]);
            if (existingOpp.rows.length === 0) {
                return res.status(404).json({ message: 'Opportunity not found or access denied' });
            }

            // We may need to delete related data or handle constraints. Assuming raw delete for now.
            await pool.query('DELETE FROM opportunities WHERE id = $1 AND company_id = $2', [oppId, companyId]);

            res.status(204).json({
                status: 'success',
                data: null
            });
        } catch (error) {
            console.error('Error in getMyOpportunities:', error);
            next(error);
        }
    };

    // Public search for students
    searchOpportunities = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Add filters for location, type, etc.
            const query = `
                SELECT o.*, c.name as company_name, c.logo_url, d.name as department_name
                FROM opportunities o
                JOIN companies c ON o.company_id = c.id
                LEFT JOIN company_departments d ON o.department_id = d.id
                WHERE o.status = 'OPEN' AND o.application_deadline > NOW()
                ORDER BY o.created_at DESC
            `;
            const result = await pool.query(query);

            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
            });
        } catch (error) {
            console.error('Error in getMyOpportunities:', error);
            next(error);
        }
    };

    // Generate opportunity from natural language prompt
    generateOpportunity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { prompt } = req.body;
            if (!prompt) return res.status(400).json({ status: 'error', message: 'Prompt is required' });

            const axios = require('axios');
            const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

            // We expect the AI service to have an endpoint that accepts a prompt and returns JSON
            const aiRes = await axios.post(`${aiUrl}/api/v1/generate/opportunity`, { prompt });

            res.status(200).json({
                status: 'success',
                data: aiRes.data.data
            });
        } catch (error: any) {
            console.error('AI Generation Error:', error.response?.data || error.message);
            res.status(500).json({ status: 'error', message: 'Failed to generate opportunity from AI service' });
        }
    };
}
