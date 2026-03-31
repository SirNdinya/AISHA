import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom';
import App from '../App';
import React from 'react';

// Mock window.matchMedia
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

// Mock import.meta.env. 
// Since import.meta is read-only, we might need a different approach if vi.stubEnv doesn't work.
// But let's try to define a getter for it if we can, or just rely on vi.stubEnv which sets process.env 
// and hope vite-env mechanism picks it up.
// A common workaround in Vitest for import.meta.env is:
Object.defineProperty(import.meta, 'env', {
    value: { VITE_PORTAL: '' },
    writable: true,
});


// Mock child components
vi.mock('../pages/auth/LoginPage', () => ({
    default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../pages/PortalSelector', () => ({
    default: () => <div data-testid="portal-selector">Portal Selector</div>
}));

vi.mock('../components/layout/StudentLayout', () => ({
    default: () => <div data-testid="student-layout">Student Layout</div>
}));

vi.mock('../components/layout/CompanyLayout', () => ({
    default: () => <div data-testid="company-layout">Company Layout</div>
}));

vi.mock('../components/layout/InstitutionLayout', () => ({
    default: () => <div data-testid="institution-layout">Institution Layout</div>
}));

vi.mock('../components/layout/AdminLayout', () => ({
    default: () => <div data-testid="admin-layout">Admin Layout</div>
}));

vi.mock('../components/layout/PublicLayout', () => ({
    default: () => <div data-testid="public-layout">Public Layout <Outlet /></div>,
    LandingPage: () => <div data-testid="landing-page">Landing Page</div>
}));

vi.mock('../components/auth/ProtectedRoute', () => ({
    default: ({ children }: any) => <>{children}</>
}));

describe('Portal Routing Logic', () => {

    beforeEach(() => {
        vi.resetModules();
        // Reset the env var
        (import.meta.env as any).VITE_PORTAL = '';
    });

    it('renders PublicLayout and redirects to Login when VITE_PORTAL is empty', async () => {
        (import.meta.env as any).VITE_PORTAL = '';

        render(<App />);

        await waitFor(() => {
            expect(screen.getByTestId('public-layout')).toBeInTheDocument();
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
        });
    });

    it('redirects root to login when VITE_PORTAL is student', async () => {
        (import.meta.env as any).VITE_PORTAL = 'student';

        render(<App />);

        // Should not show Portal Selector
        expect(screen.queryByTestId('portal-selector')).not.toBeInTheDocument();

        // Should show Login Page (because of <Route path="/" element={<Navigate to="/login" ... />}>)
        // Note: The redirection happens inside App, which uses <Router>. 
        // Wait, App uses <Router> (BrowserRouter). Testing Library `render` works but ideally we should wrap in MemoryRouter if App didn't have one.
        // App has <Router>, so it uses browser history. In test environment (jsdom), this is fine.

        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
        });
    });

    it('redirects root to login when VITE_PORTAL is company', async () => {
        (import.meta.env as any).VITE_PORTAL = 'company';

        render(<App />);

        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('portal-selector')).not.toBeInTheDocument();
    });

});
