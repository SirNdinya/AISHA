import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AdminService, { type User } from '../services/adminService';

interface AdminState {
    users: User[]; // Unverified users
    isLoading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    users: [],
    isLoading: false,
    error: null,
};

// Thunks
export const fetchUnverifiedUsers = createAsyncThunk(
    'admin/fetchUnverified',
    async (_, { rejectWithValue }) => {
        try {
            return await AdminService.getUnverifiedUsers();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const verifyUser = createAsyncThunk(
    'admin/verifyUser',
    async (userId: string, { rejectWithValue }) => {
        try {
            return await AdminService.verifyUser(userId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Verification failed');
        }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchUnverifiedUsers.pending, (state) => { state.isLoading = true; });
        builder.addCase(fetchUnverifiedUsers.fulfilled, (state, action) => {
            state.isLoading = false;
            state.users = action.payload;
        });

        builder.addCase(verifyUser.fulfilled, (state, action) => {
            // Remove verified user from list
            state.users = state.users.filter(u => u.id !== action.payload.id);
        });
    },
});

export default adminSlice.reducer;
