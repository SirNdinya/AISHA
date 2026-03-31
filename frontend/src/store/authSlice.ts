import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Define strict types matching DB Enums
export type UserRole = 'STUDENT' | 'COMPANY' | 'INSTITUTION' | 'ADMIN' | 'DEPARTMENT_ADMIN';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    institutionId?: string;
    departmentId?: string;
    institutionName?: string;
    institutionCode?: string;
    institutionAdminId?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const getUserFromStorage = (): User | null => {
    try {
        const storedUser = localStorage.getItem('saps_user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        return null;
    }
};

const initialState: AuthState = {
    user: getUserFromStorage(),
    token: localStorage.getItem('saps_token'),
    isAuthenticated: !!localStorage.getItem('saps_token'),
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.error = null;
            localStorage.setItem('saps_token', action.payload.token);
            localStorage.setItem('saps_user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('saps_token');
            localStorage.removeItem('saps_user');
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                localStorage.setItem('saps_user', JSON.stringify(state.user));
            }
        }
    },
});

export const { setCredentials, logout, setLoading, setError, updateUser } = authSlice.actions;
export default authSlice.reducer;
