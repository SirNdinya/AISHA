
import React, { useState, useEffect } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { WebSocketProvider } from '../../context/WebSocketContext';
import StudentHeader from '../../pages/student/components/StudentHeader';
import UnifiedSidebar from './UnifiedSidebar';
import AishaAssistant from '../common/AishaAssistant';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { fetchStudentProfile } from '../../store/studentSlice';
import {
    LuLayoutDashboard,
    LuBriefcase,
    LuUser,
    LuFileText,
    LuSettings,
    LuGraduationCap,
    LuX
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import '../../pages/student/DashboardTheme.css';

const MotionBox = motion(Box);

const navItems = [
    { name: 'Dashboard', icon: LuLayoutDashboard, path: '/student/dashboard' },
    { name: 'My Placement', icon: LuBriefcase, path: '/student/attachments' },
    { name: 'Profile', icon: LuUser, path: '/student/profile' },
    { name: 'Logbook', icon: LuFileText, path: '/student/logbook' },
    { name: 'Settings', icon: LuSettings, path: '/student/settings' },
];

const StudentLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                
                {/* Desktop Sidebar */}
                <UnifiedSidebar
                    portalName="AISHA"
                    portalType="STUDENT PORTAL"
                    portalLogo={LuGraduationCap}
                    navItems={navItems}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onLogout={handleLogout}
                    accentColor="cyan"
                />

                {/* Mobile Sidebar (Drawer) */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <MotionBox
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                position="fixed"
                                inset={0}
                                bg="blackAlpha.700"
                                backdropFilter="blur(4px)"
                                zIndex={2000}
                                display={{ base: "block", lg: "none" }}
                            />
                            {/* Drawer Content */}
                            <MotionBox
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                position="fixed"
                                left={0}
                                top={0}
                                bottom={0}
                                w="280px"
                                bg="gray.900"
                                zIndex={2001}
                                display={{ base: "block", lg: "none" }}
                                boxShadow="2xl"
                            >
                                <Box position="absolute" top={4} right={4} zIndex={2002}>
                                    <IconButton
                                        aria-label="Close menu"
                                        variant="ghost"
                                        color="white"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <LuX />
                                    </IconButton>
                                </Box>
                                <UnifiedSidebar
                                    portalName="AISHA"
                                    portalType="STUDENT PORTAL"
                                    portalLogo={LuGraduationCap}
                                    navItems={navItems}
                                    isCollapsed={false}
                                    onLogout={handleLogout}
                                    accentColor="cyan"
                                    showToggle={false}
                                    isMobile={true}
                                />
                            </MotionBox>
                        </>
                    )}
                </AnimatePresence>

                <Box
                    flex="1"
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    ml={{ base: 0, lg: sidebarWidth }}
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                >
                    <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
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
