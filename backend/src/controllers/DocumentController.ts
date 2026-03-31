import { Request, Response } from 'express';
import pool from '../config/database';
import { DocumentAutoFillService } from '../services/DocumentAutoFillService';
import path from 'path';

export class DocumentController {

    /**
     * Trigger auto-generation for a student (Manual trigger or hook)
     */
    async generateForStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.body as any;
            const result = await DocumentController.generateForStudentSync(studentId);
            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            console.error('Generation Error:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async generateForStudentSync(studentId: string) {
        // 1. Fetch Student, Department, Institution
        const dataRes = await pool.query(
            `SELECT s.*, d.name as dept_name, d.user_id as dept_admin_id, i.name as inst_name 
             FROM students s
             JOIN departments d ON s.department_id = d.id
             JOIN institutions i ON s.institution_id = i.id
             WHERE s.id = $1`,
            [studentId]
        );

        if (dataRes.rows.length === 0) {
            throw new Error('Student data not found for fulfillment');
        }

        const studentData = dataRes.rows[0];

        // 2. Generate PDF
        const docResult = await DocumentAutoFillService.generateStudentDocument(
            'OFFICIAL RECOMMENDATION LETTER',
            studentData,
            { name: studentData.dept_name, user_id: studentData.dept_admin_id },
            { name: studentData.inst_name }
        );

        // 3. Save to Document Hub
        const hubRes = await pool.query(
            `INSERT INTO document_hub (owner_id, type, file_url, digital_signature, is_auto_generated, status, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                studentData.user_id,
                'RECOMMENDATION_LETTER',
                `/uploads/documents/${docResult.filename}`,
                docResult.signature,
                true,
                'VERIFIED',
                JSON.stringify({ generatedAt: new Date().toISOString() })
            ]
        );

        return hubRes.rows[0];
    }


    // --- Legacy / Compatibility Methods ---
    async downloadPlacementLetter(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;
            
            // 1. Fetch application, student, and institution data
            const dataRes = await pool.query(
                `SELECT a.*, s.first_name, s.last_name, s.admission_number, s.id as student_id,
                        d.name as dept_name, d.user_id as dept_admin_id, i.name as inst_name,
                        o.title as job_title, c.name as company_name
                 FROM applications a
                 JOIN students s ON a.student_id = s.id
                 JOIN departments d ON s.department_id = d.id
                 JOIN institutions i ON s.institution_id = i.id
                 JOIN opportunities o ON a.opportunity_id = o.id
                 JOIN companies c ON o.company_id = c.id
                 WHERE a.id = $1`,
                [applicationId]
            );

            if (dataRes.rows.length === 0) {
                return res.status(404).json({ message: 'Application node not found' });
            }

            const data = dataRes.rows[0];

            // 2. Generate PDF
            const docResult = await DocumentAutoFillService.generateStudentDocument(
                'OFFICIAL ATTACHMENT ACCEPTANCE',
                data,
                { name: data.dept_name, user_id: data.dept_admin_id },
                { name: data.inst_name }
            );

            // 3. Serve PDF
            const filePath = path.resolve(docResult.filePath);
            res.download(filePath, `Acceptance_Letter_${data.company_name}.pdf`);
        } catch (error: any) {
            console.error('Letter Generation Error:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async downloadNITAForm(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;
            
            const dataRes = await pool.query(
                `SELECT a.*, s.first_name, s.last_name, s.admission_number, i.name as inst_name
                 FROM applications a
                 JOIN students s ON a.student_id = s.id
                 JOIN institutions i ON s.institution_id = i.id
                 WHERE a.id = $1`,
                [applicationId]
            );

            if (dataRes.rows.length === 0) {
                return res.status(404).json({ message: 'Application node not found' });
            }

            const data = dataRes.rows[0];

            // For NITA, we use a slightly different title or template logic if available.
            // Reusing DocumentAutoFillService for consistency.
            const docResult = await DocumentAutoFillService.generateStudentDocument(
                'NITA INDUSTRIAL ATTACHMENT FORM (CONSOLIDATED)',
                data,
                { name: 'Directorate of Industrial Training', user_id: 'SYSTEM' },
                { name: data.inst_name }
            );

            res.download(path.resolve(docResult.filePath), `NITA_Form_${data.admission_number}.pdf`);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async uploadDocument(req: Request, res: Response) {
        try {
            const user: any = (req as any).user;
            const { type, metadata } = req.body as any;
            const file = (req as any).file;

            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            if (file.mimetype !== 'application/pdf') {
                return res.status(400).json({ message: 'Only PDF documents are allowed' });
            }

            const fileUrl = `/uploads/documents/${file.filename}`;

            const result = await pool.query(
                `INSERT INTO document_hub (owner_id, type, file_url, status, is_auto_generated, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [user.id, type, fileUrl, 'PENDING', false, metadata || '{}']
            );

            // Notify user about successful upload (Self-notification as confirmation)
            try {
                const { NotificationService } = require('../services/NotificationService');
                await NotificationService.notifyDocumentUpload(user.id, type);
            } catch (notifyError) {
                console.error('Failed to send upload notification:', notifyError);
            }

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getMyDocuments(req: Request, res: Response) {
        try {
            const user: any = (req as any).user;
            const result = await pool.query(
                'SELECT * FROM document_hub WHERE owner_id = $1 ORDER BY created_at DESC',
                [user.id]
            );
            res.json({ success: true, data: result.rows });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPlacementDocuments(req: Request, res: Response) {
        try {
            const { placementId } = req.params;

            // Get the student's user_id for this placement
            const studentRes = await pool.query(
                'SELECT user_id FROM students s JOIN placements p ON s.id = p.student_id WHERE p.id = $1',
                [placementId]
            );

            if (studentRes.rows.length === 0) {
                return res.status(404).json({ message: 'Placement student not found' });
            }

            const userId = studentRes.rows[0].user_id;
            const result = await pool.query(
                'SELECT * FROM document_hub WHERE owner_id = $1 ORDER BY created_at DESC',
                [userId]
            );

            res.json({ success: true, data: result.rows });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async signDocument(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;
            const user: any = (req as any).user;
            const { SignatureService } = require('../services/SignatureService');
            const sig = SignatureService.signDocument(applicationId, user.id, user.role);
            res.json({ success: true, signature: sig });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }


    async deleteDocument(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user: any = (req as any).user;

            // Delete from document_hub if the owner_id matches the authenticated user
            const result = await pool.query(
                `DELETE FROM document_hub WHERE id = $1 AND owner_id = $2 RETURNING *`,
                [id, user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Document not found or unauthorized' });
            }

            res.json({ success: true, message: 'Document removed successfully' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
