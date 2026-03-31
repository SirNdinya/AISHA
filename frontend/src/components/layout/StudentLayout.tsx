
import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { WebSocketProvider } from '../../context/WebSocketContext';
import StudentHeader from '../../pages/student/components/StudentHeader';
import StudentSidebar from '../../pages/student/components/StudentSidebar';
import AishaAssistant from '../common/AishaAssistant';
import BroadcastBanner from '../common/BroadcastBanner';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import '../../pages/student/DashboardTheme.css';

const StudentLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (!isAuthenticated || !user) {
        return (
            <Box className="dashboard-container" minH="100vh" bg="#0F172A">
                <Box w="full" h="full">
                    <Outlet />
                </Box>
            </Box>
        );
    }

    const sidebarWidth = isSidebarCollapsed ? '100px' : '320px';

    return (
        <WebSocketProvider userId={user.id}>
            <Box className="dashboard-container" minH="100vh" bg="#0F172A" overflowX="hidden">
                <BroadcastBanner system="STUDENT" />
                
                <StudentSidebar 
                    isCollapsed={isSidebarCollapsed} 
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onLogout={handleLogout}
                />

                <Box 
                    flex="1" 
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    ml={{ base: 0, lg: sidebarWidth }}
                >
                    <StudentHeader />
                    <Box as="main" p={{ base: 4, lg: 8 }} pt={0}>
                        <Outlet />
                    </Box>
                </Box>

                <AishaAssistant />
            </Box>
        </WebSocketProvider>
    );
};

export default StudentLayout;
