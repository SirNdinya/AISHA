import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Define message types
interface WebSocketMessage {
    type: string;
    payload?: any;
    content?: string;
    sender_id?: string;
    receiver_id?: string;
    [key: string]: any;
}

interface WebSocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    sendMessage: (message: WebSocketMessage) => void;
    lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Props for the provider
interface WebSocketProviderProps {
    children: ReactNode;
    userId: string; // We'll pass the logged-in user ID here
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, userId }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Connect to the AI Services WebSocket
        // Defaulting to localhost:8001 as per docker-compose
        const wsUrl = `ws://localhost:8001/ws/${userId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            // Optional: Implement reconnect logic here
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message Received:', data);
                setLastMessage(data);
            } catch (e) {
                console.warn('Received non-JSON message:', event.data);
            }
        };

        setSocket(ws);

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [userId]);

    const sendMessage = (message: WebSocketMessage) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected. Message not sent.');
        }
    };

    return (
        <WebSocketContext.Provider value={{ socket, isConnected, sendMessage, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
