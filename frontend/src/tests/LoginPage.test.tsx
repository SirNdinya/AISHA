import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import LoginPage from '../pages/auth/LoginPage';
import apiClient from '../services/apiClient';
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../theme';

// Mock apiClient
vi.mock('../services/apiClient');

// Create test store
const createTestStore = () => configureStore({
    reducer: { auth: authReducer }
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('LoginPage', () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
        vi.clearAllMocks();
        // Reset import.meta.env
        (import.meta.env as any).VITE_PORTAL = '';
    });

    it('renders login form correctly with default placeholder', () => {
        render(
            <ChakraProvider value={system}>
                <Provider store={store}>
                    <MemoryRouter>
                        <LoginPage />
                    </MemoryRouter>
                </Provider>
            </ChakraProvider>
        );
        expect(screen.getByRole('heading', { name: /Student Portal/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login to Account/i })).toBeInTheDocument();
    });

    it('renders with correct placeholder for student portal', () => {
        (import.meta.env as any).VITE_PORTAL = 'student';
        render(
            <ChakraProvider value={system}>
                <Provider store={store}>
                    <MemoryRouter>
                        <LoginPage />
                    </MemoryRouter>
                </Provider>
            </ChakraProvider>
        );
        expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        const mockUser = { id: 1, email: 'test@example.com', role: 'STUDENT' };
        const mockToken = 'fake-jwt-token';

        // Mock API response structure matching AuthController + Axios
        // Start call returns promise that resolves to object with 'data'
        (apiClient.post as any).mockResolvedValue({
            data: {
                status: 'success',
                token: mockToken,
                user: mockUser
            }
        });

        render(
            <ChakraProvider value={system}>
                <Provider store={store}>
                    <MemoryRouter initialEntries={['/login?portal=student']}>
                        <LoginPage />
                    </MemoryRouter>
                </Provider>
            </ChakraProvider>
        );

        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Login to Account/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123',
                role: 'STUDENT'
            });
        });
    });

    it('handles failed login with error message', async () => {
        const errorMessage = 'Invalid credentials';
        (apiClient.post as any).mockRejectedValue({
            response: {
                data: { message: errorMessage }
            }
        });

        render(
            <ChakraProvider value={system}>
                <Provider store={store}>
                    <MemoryRouter>
                        <LoginPage />
                    </MemoryRouter>
                </Provider>
            </ChakraProvider>
        );

        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Login to Account/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });
});
