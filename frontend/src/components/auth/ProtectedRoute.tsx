import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { type UserRole } from '../../store/authSlice';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    // Recover user from localStorage if we have a token but no user in Redux (Page Refresh handling)
    // In a real app, we might want to dispatch a 'fetchMe' thunk here if user is missing but token exists.
    // For now, let's assume if we are authenticated, we should have a user or we should logout.

    if (!isAuthenticated) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user) {
        // Fallback: Try to get from localStorage or redirect to login to re-hydrate
        const storedUser = localStorage.getItem('saps_user');
        if (storedUser) {
            // In a real scenario we'd dispatch(setUser(JSON.parse(storedUser))) here, 
            // but 'render' is not the place for side-effects. 
            // Ideally App.tsx or a dedicated auth provider handles hydration.
            // For this specific fix, let's assume if Redux lost it, we must redirect to login to safely re-hydrate.
            console.warn('ProtectedRoute: User missing in Redux but found in localStorage. Redirecting to login.');
            return <Navigate to="/login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Normalize roles for comparison
    const userRole = user.role.toUpperCase();
    const allowed = allowedRoles?.map(r => r.toUpperCase());

    if (allowed && !allowed.includes(userRole)) {
        console.warn(`ProtectedRoute: Access denied. User role '${userRole}' not in [${allowed.join(', ')}]`);

        // Handle Admin's special access if needed, or just strict role check
        if (userRole === 'ADMIN') {
            return <>{children}</>;
        }

        // Redirect unauthorized users to their own dashboard or home
        const dashboardMap: Record<string, string> = {
            'STUDENT': '/student/dashboard',
            'COMPANY': '/company/dashboard',
            'INSTITUTION': '/institution/dashboard',
            'ADMIN': '/admin/dashboard',
            'DEPARTMENT_ADMIN': '/department/dashboard'
        };

        return <Navigate to={dashboardMap[userRole] || '/login'} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
