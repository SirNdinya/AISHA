import apiClient from './apiClient';

export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

export const aiService = {
    /**
     * Send a message to AISHA chat
     */
    chat: async (message: string, history: AIMessage[] = []) => {
        try {
            const response = await apiClient.post('/ai/chat', { message, history });
            return response.data;
        } catch (error) {
            console.error('Frontend AI Chat Error:', error);
            throw error;
        }
    },

    /**
     * Fetch chat history with AISHA
     */
    getHistory: async () => {
        try {
            const response = await apiClient.get('/ai/history');
            return response.data;
        } catch (error) {
            console.error('Frontend AI History Error:', error);
            throw error;
        }
    },

    /**
     * Clear AISHA chat history
     */
    clearHistory: async () => {
        try {
            const response = await apiClient.delete('/ai/history');
            return response.data;
        } catch (error) {
            console.error('Frontend AI Clear Error:', error);
            throw error;
        }
    }
};
