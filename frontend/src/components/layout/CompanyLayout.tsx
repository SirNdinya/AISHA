
import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCompanyProfile } from '../../store/companySlice';
import type { RootState, AppDispatch } from '../../store';
import CompanySidebar from '../../pages/company/components/CompanySidebar';
import CompanyHeader from '../../pages/company/components/CompanyHeader';
import {
    DrawerRoot,
    DrawerBackdrop,
    DrawerContent,
    DrawerBody,
    DrawerCloseTrigger,
} from '@chakra-ui/react';
import { WebSocketProvider } from '../../context/WebSocketContext';
import { logout } from '../../store/authSlice';
import AishaAssistant from '../common/AishaAssistant';

const CompanyLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
            <Box minH="100vh" display="flex">
                <Box display={{ base: "none", lg: "block" }}>
                    <CompanySidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        onLogout={handleLogout}
                    />
                </Box>

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
                            <CompanySidebar
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
                    ml={{ base: 0, lg: "20px" }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    display="flex"
                    flexDirection="column"
                >
                    <CompanyHeader onMenuClick={() => setIsMobileNavOpen(true)} />
                    <Box
                        as="main"
                        p={{ base: 4, md: 8 }}
                        ml={{ base: 0, lg: sidebarWidth }}
                        w={{ base: "full", lg: `calc(100% - ${sidebarWidth})` }}
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        flex="1"
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
