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

export const deleteNotifications = createAsyncThunk(
    'notifications/delete',
    async (idOrIds: string | string[]) => {
        await NotificationService.deleteNotifications(idOrIds);
        return idOrIds;
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

        builder.addCase(deleteNotifications.fulfilled, (state, action) => {
            const idOrIds = action.payload;
            if (idOrIds === 'all') {
                state.notifications = [];
                state.unreadCount = 0;
            } else if (Array.isArray(idOrIds)) {
                state.notifications = state.notifications.filter(n => !idOrIds.includes(n.id));
                state.unreadCount = state.notifications.filter(n => !n.is_read).length;
            } else {
                state.notifications = state.notifications.filter(n => n.id !== idOrIds);
                state.unreadCount = state.notifications.filter(n => !n.is_read).length;
            }
        });
    },
});

export default notificationSlice.reducer;
