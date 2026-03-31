import { io } from '../server';

export class RealtimeService {
    /**
     * Broadcast a message to a specific room or user
     */
    static emitToUser(userId: string, event: string, data: any) {
        if (io) {
            io.to(`user_${userId}`).emit(event, data);
        }
    }

    /**
     * Broadcast to a specific institution portal
     */
    static emitToInstitution(institutionId: string, event: string, data: any) {
        if (io) {
            io.to(`inst_${institutionId}`).emit(event, data);
        }
    }

    /**
     * General Broadcast
     */
    static broadcast(event: string, data: any) {
        if (io) {
            io.emit(event, data);
        }
    }
}
