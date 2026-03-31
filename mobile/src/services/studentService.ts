import apiClient from './authService';

const studentService = {
    getDashboardStats: async () => {
        const response = await apiClient.get('/students/dashboard-stats');
        return response.data.data;
    },
    getOpportunities: async () => {
        const response = await apiClient.get('/opportunities');
        return response.data.data;
    }
};

export default studentService;
