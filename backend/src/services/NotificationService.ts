import pool from '../config/database';
import { createClient } from 'redis';
import { RealtimeService } from './RealtimeService';

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
});

if (process.env.NODE_ENV !== 'test') {
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.connect().catch(console.error);
}

export class NotificationService {

    /**
     * Create a notification for a user.
     * @param userId The recipient's user ID.
     * @param title Short title.
     * @param message Detailed message.
     * @param type 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
     */
    static async createNotification(
        userId: string,
        title: string,
        message: string,
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO',
        isAi: boolean = false,
        aiMetadata: any = {}
    ) {
        const query = `
            INSERT INTO notifications (user_id, title, message, type, is_read, is_ai, ai_metadata)
            VALUES ($1, $2, $3, $4, false, $5, $6)
            RETURNING id
        `;
        await pool.query(query, [userId, title, message, type, isAi, aiMetadata]);

        if (process.env.NODE_ENV === 'test' || !redisClient.isOpen) return;

        // Publish to Redis for AI/ML services (Real-time broadcasting)
        try {
            const eventPayload = {
                type: 'NOTIFICATION_CREATED',
                student_id: userId,
                title,
                message,
                notification_type: type,
                timestamp: new Date().toISOString()
            };

            await redisClient.publish('student_events', JSON.stringify(eventPayload));

            // Real-time broadcast to connected clients
            RealtimeService.emitToUser(userId, 'notification', eventPayload);

        } catch (redisError) {
            console.error('Failed to publish notification:', redisError);
        }
    }

    /**
     * Helper to notify all admins (e.g., system alerts)
     */
    static async notifyAdmins(title: string, message: string) {
        const adminQuery = `SELECT id FROM users WHERE role = 'ADMIN'`;
        const admins = await pool.query(adminQuery);

        for (const admin of admins.rows) {
            await this.createNotification(admin.id, title, message, 'WARNING');
        }
    }

    /**
     * Notify student about application status change
     */
    static async notifyApplicationStatus(studentId: string, status: string, companyName: string) {
        const title = `Application ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`;
        const message = `Your application for ${companyName} has been ${status.toLowerCase()}.`;
        const type = status === 'ACCEPTED' ? 'SUCCESS' : 'INFO';
        await this.createNotification(studentId, title, message, type);
    }

    /**
     * Notify company about new application
     */
    static async notifyNewApplication(companyUserId: string, studentName: string) {
        await this.createNotification(
            companyUserId,
            'New Application Received',
            `${studentName} has applied for your internship opportunity.`,
            'SUCCESS'
        );
    }

    /**
     * Notify relevant party about new document upload
     */
    static async notifyDocumentUpload(userId: string, docType: string) {
        const typeName = docType.replace(/_/g, ' ').toLowerCase();
        await this.createNotification(
            userId,
            'Document Uploaded',
            `A new ${typeName} has been uploaded and is ready for review.`,
            'INFO'
        );
    }

    /**
     * Notify student about required payment for an opportunity
     */
    static async notifyPaymentRequired(studentUserId: string, amount: number, opportunityTitle: string, opportunityId: string) {
        await this.createNotification(
            studentUserId,
            'Payment Required',
            `To finalize your placement for "${opportunityTitle}", a stipend payment of KES ${amount} is required.`,
            'WARNING',
            false,
            { type: 'PAYMENT_REQUIRED', amount, opportunityId }
        );
    }
}
