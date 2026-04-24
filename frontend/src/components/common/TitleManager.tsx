import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TitleManager: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = 'AISHA - Home';

        if (path.startsWith('/student')) {
            title = 'AISHA - Student';
        } else if (path.startsWith('/institution') || path.startsWith('/department')) {
            title = 'AISHA - Institution';
        } else if (path.startsWith('/company')) {
            title = 'AISHA - Company';
        } else if (path.startsWith('/admin')) {
            title = 'AISHA - Admin';
        } else if (path === '/' || path === '/login' || path === '/register' || path === '/portal-selector') {
            title = 'AISHA - Home';
        }

        document.title = title;
    }, [location]);

    return null;
};

export default TitleManager;
