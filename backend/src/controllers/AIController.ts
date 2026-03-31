import { Request, Response } from 'express';
import pool from '../config/database';
import { AIService } from '../services/AIService';

export class AIController {
    /**
     * Handle AI chat interactions
     */
    static async chat(req: Request, res: Response) {
        const { message, history } = req.body;
        const userId = (req as any).user?.id;

        if (!message) {
            return res.status(400).json({ status: 'error', message: 'Message is required' });
        }

        try {
            // 1. Store user message
            await pool.query(
                'INSERT INTO ai_conversations (user_id, role, content) VALUES ($1, $2, $3)',
                [userId, 'user', message]
            );

            // 2. Get response from AI Service
            const aiResponse = await AIService.chat(userId, message, history || []);

            // 3. Store AI response
            if (aiResponse && aiResponse.content) {
                await pool.query(
                    'INSERT INTO ai_conversations (user_id, role, content) VALUES ($1, $2, $3)',
                    [userId, 'assistant', aiResponse.content]
                );
            }

            res.json({
                status: 'success',
                data: aiResponse
            });
        } catch (error: any) {
            console.error('AI Chat Controller Error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    /**
     * Get chat history for the user
     */
    static async getHistory(req: Request, res: Response) {
        const userId = (req as any).user?.id;

        try {
            const result = await pool.query(
                'SELECT role, content, created_at FROM ai_conversations WHERE user_id = $1 ORDER BY created_at ASC LIMIT 50',
                [userId]
            );

            res.json({
                status: 'success',
                data: result.rows
            });
        } catch (error: any) {
            console.error('AI History Controller Error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    /**
     * Clear chat history
     */
    static async clearHistory(req: Request, res: Response) {
        const userId = (req as any).user?.id;

        try {
            await pool.query('DELETE FROM ai_conversations WHERE user_id = $1', [userId]);
            res.json({ status: 'success', message: 'Chat history cleared' });
        } catch (error: any) {
            console.error('AI Clear History Error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
}
