// Triggering restart for env changes
import app from './app';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import path from 'path';
import { AutomationService } from './services/AutomationService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 3000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_user', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their personal room`);
    });

    socket.on('join_institution', (instId: string) => {
        socket.join(`inst_${instId}`);
        console.log(`Institution ${instId} joined its room`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`
  ################################################
  🚀  Server listening on port: ${PORT}
  ################################################
  `);

        // Automation Jobs
        console.log('⏰ Scheduling Automation Jobs...');
        AutomationService.expireOldOffers(); // Run once on startup
        setInterval(() => {
            AutomationService.expireOldOffers();
        }, 1000 * 60 * 60); // Run every 1 hour
    });
}

export { io };
