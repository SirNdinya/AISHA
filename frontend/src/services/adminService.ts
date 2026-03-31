import apiClient from './apiClient';

export interface User {
    id: string;
    email: string;
    role: string;
    is_verified: boolean;
    created_at: string;
}

interface ApiResponse<T> {
    status: 'success' | 'error';
    data: T;
}

const AdminService = {
    // Get Unverified
    getUnverifiedUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<ApiResponse<User[]>>('/admin/users/unverified');
        return response.data.data;
    },

    // Verify User
    verifyUser: async (userId: string): Promise<User> => {
        const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/verify`, {});
        return response.data.data;
    }
};

export default AdminService;
