import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode; userId?: string; institutionId?: string }> = ({ children, userId, institutionId }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

        newSocket.on('connect', () => {
            console.log('Socket.io connected');
            setIsConnected(true);
            newSocket.emit('join_user', userId);
            if (institutionId) {
                newSocket.emit('join_institution', institutionId);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Socket.io disconnected');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [userId, institutionId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
