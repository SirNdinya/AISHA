import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import companyReducer from './companySlice';
import studentReducer from './studentSlice';
import institutionReducer from './institutionSlice';
import adminReducer from './adminSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        company: companyReducer,
        student: studentReducer,
        institution: institutionReducer,
        admin: adminReducer,
        notifications: notificationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
