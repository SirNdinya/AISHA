import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3000/api'; // Standard Android Emulator loopback for localhost

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to requests
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (credentials: any) => {
        const response = await apiClient.post('/auth/login', credentials);
        if (response.data.token) {
            await AsyncStorage.setItem('userToken', response.data.token);
        }
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('userToken');
    },

    getProfile: async () => {
        const response = await apiClient.get('/student/profile');
        return response.data;
    },
};

export default apiClient;
