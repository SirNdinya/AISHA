import pool from '../config/database';
import { RealtimeService } from './RealtimeService';
import { NotificationService } from './NotificationService';
import axios from 'axios';

export class MessageService {
    /**
     * Send a message between two users
     */
    static async sendMessage(senderId: string, receiverId: string, content: string, context?: { oppId?: string, appId?: string, isAi?: boolean, aiMetadata?: any }) {
        const query = `
            INSERT INTO messages (sender_id, receiver_id, content, opportunity_id, application_id, is_ai, ai_metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await pool.query(query, [
            senderId,
            receiverId,
            content,
            context?.oppId || null,
            context?.appId || null,
            context?.isAi || false,
            context?.aiMetadata || {}
        ]);

        const message = result.rows[0];

        // 1. Emit Real-time via Socket.io
        RealtimeService.emitToUser(receiverId, 'new_message', {
            ...message,
            sender_name: await this.getSenderName(senderId)
        });

        // 2. Trigger Notification if receiver is not active (simplified)
        await NotificationService.createNotification(
            receiverId,
            'New Message Received',
            content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            'INFO'
        );

        return message;
    }

    /**
     * Retrieve conversation history between two users or within a context
     */
    static async getMessages(userId: string, otherId?: string, appId?: string) {
        let query = `
            SELECT m.*, 
                   u_s.first_name as sender_name, 
                   u_r.first_name as receiver_name
            FROM messages m
            JOIN users u_s ON m.sender_id = u_s.id
            JOIN users u_r ON m.receiver_id = u_r.id
            WHERE (m.sender_id = $1 OR m.receiver_id = $1)
        `;
        const params: any[] = [userId];

        if (otherId) {
            query += ` AND (m.sender_id = $2 OR m.receiver_id = $2)`;
            params.push(otherId);
        } else if (appId) {
            query += ` AND m.application_id = $2`;
            params.push(appId);
        }

        query += ` ORDER BY m.created_at ASC`;
        const result = await pool.query(query, params);
        return result.rows;
    }

    private static async getSenderName(id: string) {
        const res = await pool.query('SELECT first_name FROM users WHERE id = $1', [id]);
        return res.rows[0]?.first_name || 'System';
    }

    /**
     * AI Analysis of chat context
     */
    static async analyzeChatContext(applicationId?: string, opportunityId?: string) {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
        try {
            const response = await axios.get(`${aiServiceUrl}/api/chat/analyze-context`, {
                params: {
                    application_id: applicationId,
                    opportunity_id: opportunityId
                }
            });
            return response.data;
        } catch (error) {
            console.error('AI Context Analysis Error:', error);
            return { ai_insight: 'AI Analysis currently unavailable.' };
        }
    }

    /**
     * AI Suggested response
     */
    static async suggestChatResponse(query: string, context: any) {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
        try {
            const response = await axios.post(`${aiServiceUrl}/api/chat/suggest-response`, {
                query,
                context
            });
            return response.data;
        } catch (error) {
            console.error('AI Response Suggestion Error:', error);
            return { suggested_draft: 'Unable to generate suggestion at this time.' };
        }
    }
}
