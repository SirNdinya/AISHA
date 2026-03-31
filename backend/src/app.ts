import express, { Application, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool from './config/database';

dotenv.config();

const app: Application = express();

import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import { companyRouter, opportunityRouter } from './routes/companyRoutes';
import applicationRoutes from './routes/applicationRoutes';
import automationRoutes from './routes/automationRoutes';
import institutionRoutes from './routes/institutionRoutes';
import adminRoutes from './routes/adminRoutes';
import documentRoutes from './routes/documentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import learningRoutes from './routes/learningRoutes';
import messageRoutes from './routes/messageRoutes';
import placementRoutes from './routes/placementRoutes';
import publicRoutes from './routes/publicRoutes';
import aiRoutes from './routes/aiRoutes';
import assessmentRoutes from './routes/assessmentRoutes';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Allow cross-origin loading of profile pictures and other uploaded media
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static('uploads'));


// Routes
const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/students', studentRoutes);
v1Router.use('/companies', companyRouter);
v1Router.use('/opportunities', opportunityRouter);
v1Router.use('/applications', applicationRoutes);
v1Router.use('/automation', automationRoutes);
v1Router.use('/institutions', institutionRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/documents', documentRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/learning', learningRoutes);
v1Router.use('/messages', messageRoutes);
v1Router.use('/placements', placementRoutes);
v1Router.use('/public', publicRoutes);
v1Router.use('/ai', aiRoutes);
v1Router.use('/assessments', assessmentRoutes);

app.use('/api/v1', v1Router);
app.use('/api', v1Router);

// Health Check Routes
v1Router.get('/health', async (req: Request, res: Response) => {
    const health: any = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        services: {
            database: { status: 'UNKNOWN' },
            redis: { status: 'UNKNOWN' },
            ai_service: { status: 'UNKNOWN' }
        }
    };

    try {
        await pool.query('SELECT 1');
        health.services.database.status = 'UP';
    } catch (err: any) {
        health.services.database.status = 'DOWN';
        health.services.database.error = err.message;
        health.status = 'DEGRADED';
    }

    try {
        const { createClient } = require('redis');
        const client = createClient({
            url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
        });
        await client.connect();
        await client.ping();
        await client.quit();
        health.services.redis.status = 'UP';
    } catch (err: any) {
        health.services.redis.status = 'DOWN';
        health.services.redis.error = err.message;
        health.status = 'DEGRADED';
    }

    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
        const aiRes = await axios.get(`${aiUrl}/health`, { timeout: 2000 });
        health.services.ai_service.status = aiRes.data.status === 'healthy' ? 'UP' : 'DEGRADED';
    } catch (err: any) {
        health.services.ai_service.status = 'DOWN';
        health.services.ai_service.error = err.message;
        health.status = 'DEGRADED';
    }

    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'SAPS API Gateway is running',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', async (req: Request, res: Response) => {
    res.redirect('/api/v1/health');
});

app.get('/health/db', async (req: Request, res: Response) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'UP', message: 'Database connection successful' });
    } catch (err: any) {
        res.status(500).json({ status: 'DOWN', message: 'Database connection failed', error: err.message });
    }
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
