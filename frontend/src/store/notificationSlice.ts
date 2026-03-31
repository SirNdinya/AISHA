import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import NotificationService, { type Notification } from '../services/notificationService';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async () => {
        return await NotificationService.getMyNotifications();
    }
);

export const markNotificationsRead = createAsyncThunk(
    'notifications/markRead',
    async (id: string = 'all') => {
        await NotificationService.markAsRead(id);
        return id;
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchNotifications.fulfilled, (state, action) => {
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter(n => !n.is_read).length;
        });

        builder.addCase(markNotificationsRead.fulfilled, (state, action) => {
            if (action.payload === 'all') {
                state.notifications.forEach(n => n.is_read = true);
                state.unreadCount = 0;
            } else {
                const n = state.notifications.find(n => n.id === action.payload);
                if (n && !n.is_read) {
                    n.is_read = true;
                    state.unreadCount--;
                }
            }
        });
    },
});

export default notificationSlice.reducer;
