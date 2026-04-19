
import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, IconButton } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCompanyProfile } from '../../store/companySlice';
import type { RootState, AppDispatch } from '../../store';
import CompanySidebar from '../../pages/company/components/CompanySidebar';
import CompanyHeader from '../../pages/company/components/CompanyHeader';
import { WebSocketProvider } from '../../context/WebSocketContext';
import { logout } from '../../store/authSlice';
import AishaAssistant from '../common/AishaAssistant';
import UnifiedSidebar from './UnifiedSidebar';
import {
    LuLayoutDashboard, LuBriefcase, LuGrip,
    LuSettings, LuShield, LuCreditCard, LuX
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const companyNavItems = [
    { name: 'Dashboard', icon: LuLayoutDashboard, path: '/company/dashboard' },
    { name: 'Job Manager', icon: LuBriefcase, path: '/company/opportunities' },
    { name: 'Active Placements', icon: LuGrip, path: '/company/placements' },
    { name: 'Transactions', icon: LuCreditCard, path: '/company/transactions' },
    { name: 'Enterprise Settings', icon: LuSettings, path: '/company/settings' },
];

const CompanyLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            dispatch(fetchCompanyProfile());
        }
    }, [dispatch, isAuthenticated, user]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const sidebarWidth = isSidebarCollapsed ? '100px' : '300px';

    if (!isAuthenticated || !user) {
        return (
            <Flex h="100vh" align="center" justify="center" direction="column" gap={4} bg="var(--terminal-bg)">
                <Text color="white">Please log in to access the Enterprise Portal.</Text>
                <Button onClick={() => navigate('/login')} colorPalette="brand">Go to Login</Button>
            </Flex>
        );
    }

    return (
        <WebSocketProvider userId={user.id}>
            <Box minH="100vh" className="dashboard-container">
                {/* Desktop Sidebar */}
                <CompanySidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onLogout={handleLogout}
                />

                {/* Mobile Drawer */}
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
                                display={{ base: 'block', lg: 'none' }}
                            />
                            {/* Drawer Content */}
                            <MotionBox
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                position="fixed"
                                left={0}
                                top={0}
                                bottom={0}
                                w="280px"
                                bg="gray.900"
                                zIndex={2001}
                                display={{ base: 'block', lg: 'none' }}
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
                                    portalType="CORPORATE PORTAL"
                                    portalLogo={LuShield}
                                    navItems={companyNavItems}
                                    isCollapsed={false}
                                    onLogout={handleLogout}
                                    accentColor="orange"
                                    showToggle={false}
                                    isMobile={true}
                                />
                            </MotionBox>
                        </>
                    )}
                </AnimatePresence>

                <Box
                    flex="1"
                    ml={{ base: 0, lg: '20px' }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                    <CompanyHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
                    <Box
                        as="main"
                        p={{ base: 4, md: 8 }}
                        ml={{ base: 0, lg: sidebarWidth }}
                        w={{ base: 'full', lg: `calc(100% - ${sidebarWidth})` }}
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    >
                        <Outlet />
                    </Box>
                </Box>
                <AishaAssistant />
            </Box>
        </WebSocketProvider>
    );
};

export default CompanyLayout;
