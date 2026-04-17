
import React, { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import {
    DrawerRoot,
    DrawerBackdrop,
    DrawerContent,
    DrawerBody,
    DrawerCloseTrigger,
} from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { WebSocketProvider } from '../../context/WebSocketContext';
import StudentHeader from '../../pages/student/components/StudentHeader';
import StudentSidebar from '../../pages/student/components/StudentSidebar';
import AishaAssistant from '../common/AishaAssistant';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { fetchStudentProfile } from '../../store/studentSlice';
import '../../pages/student/DashboardTheme.css';

const StudentLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            dispatch(fetchStudentProfile());
        }
    }, [dispatch, isAuthenticated, user]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (!isAuthenticated || !user) {
        return (
            <Box className="dashboard-container" minH="100vh" bg="transparent">
                <Box w="full" h="full">
                    <Outlet />
                </Box>
            </Box>
        );
    }

    const sidebarWidth = isSidebarCollapsed ? '100px' : '320px';

    return (
        <WebSocketProvider userId={user.id}>
            <Box className="dashboard-container" h="100vh" bg="transparent" overflow="hidden" display="flex" flexDirection="column">

                <StudentSidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onLogout={handleLogout}
                />

                {/* Mobile Drawer */}
                <DrawerRoot
                    open={isMobileNavOpen}
                    onOpenChange={(e) => setIsMobileNavOpen(e.open)}
                    placement="start"
                    size="xs"
                >
                    <DrawerBackdrop />
                    <DrawerContent bg="transparent" border="none" boxShadow="none">
                        <DrawerBody p={0} bg="transparent">
                            <StudentSidebar
                                isCollapsed={false}
                                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                onLogout={handleLogout}
                            />
                        </DrawerBody>
                        <DrawerCloseTrigger color="white" top="6" right="6" />
                    </DrawerContent>
                </DrawerRoot>

                <Box
                    flex="1"
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    ml={{ base: 0, lg: sidebarWidth }}
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                >
                    <StudentHeader onMenuClick={() => setIsMobileNavOpen(true)} />
                    <Box as="main" p={{ base: 2, lg: 4 }} pt={0} flex={1} overflowY="auto" className="custom-scrollbar">
                        <Outlet />
                    </Box>
                </Box>

                <AishaAssistant />
            </Box>
        </WebSocketProvider>
    );
};

export default StudentLayout;
