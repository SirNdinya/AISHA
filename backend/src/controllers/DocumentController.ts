import { Request, Response } from 'express';
import pool from '../config/database';
import path from 'path';

export class DocumentController {




    // --- Legacy / Compatibility Methods ---


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
                 if (type !== 'CERTIFICATION') {
                    await NotificationService.notifyDocumentUpload(user.id, type);
                 }
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
