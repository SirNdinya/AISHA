import apiClient from './apiClient';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    is_read: boolean;
    created_at: string;
    ai_metadata?: any;
}

interface ApiResponse<T> {
    status: 'success' | 'error';
    data: T;
}

const NotificationService = {
    getMyNotifications: async (): Promise<Notification[]> => {
        const response = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
        return response.data.data;
    },

    markAsRead: async (id: string = 'all'): Promise<void> => {
        await apiClient.patch(`/notifications/${id}/read`, {});
    },
    deleteNotifications: async (idOrIds: string | string[]): Promise<void> => {
        if (typeof idOrIds === 'string') {
            await apiClient.delete(`/notifications/${idOrIds}`);
        } else {
            await apiClient.delete('/notifications', { data: { ids: idOrIds } });
        }
    }
};

export default NotificationService;
