import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/MessageService';
import { BaseController } from './BaseController';

export class MessageController extends BaseController {
    constructor() {
        super('messages');
    }

    send = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const senderId = (req as any).user.id;
            const { receiver_id, content, opportunity_id, application_id, is_ai, ai_metadata } = req.body;

            if (!receiver_id || !content) {
                return res.status(400).json({ status: 'error', message: 'Receiver and content are required' });
            }

            const message = await MessageService.sendMessage(senderId, receiver_id, content, {
                oppId: opportunity_id,
                appId: application_id,
                isAi: is_ai,
                aiMetadata: ai_metadata
            });

            res.status(201).json({
                status: 'success',
                data: message
            });
        } catch (error) {
            next(error);
        }
    };

    getConversation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { otherId, appId } = req.query;

            const messages = await MessageService.getMessages(
                userId,
                otherId as string,
                appId as string
            );

            res.status(200).json({
                status: 'success',
                data: messages
            });
        } catch (error) {
            next(error);
        }
    };

    analyzeContext = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { application_id, opportunity_id } = req.query;
            const insight = await MessageService.analyzeChatContext(
                application_id as string,
                opportunity_id as string
            );

            res.status(200).json({
                status: 'success',
                data: insight
            });
        } catch (error) {
            next(error);
        }
    };

    suggestResponse = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { query, context } = req.body;
            const suggestion = await MessageService.suggestChatResponse(query, context);

            res.status(200).json({
                status: 'success',
                data: suggestion
            });
        } catch (error) {
            next(error);
        }
    };
}
