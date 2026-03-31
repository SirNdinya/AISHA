import apiClient from './apiClient';

export type ChatMessage = {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender_name?: string;
    receiver_name?: string;
    application_id?: string;
    opportunity_id?: string;
}

export const messageService = {
    sendMessage: async (data: { receiver_id: string; content: string; opportunity_id?: string; application_id?: string }) => {
        const response = await apiClient.post('/messages/send', data);
        return response.data;
    },

    getConversation: async (params: { otherId?: string; appId?: string }) => {
        const response = await apiClient.get('/messages/conversation', { params });
        return response.data;
    }
};
