
import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCompanyProfile } from '../../store/companySlice';
import type { RootState, AppDispatch } from '../../store';
import CompanySidebar from '../../pages/company/components/CompanySidebar';
import CompanyHeader from '../../pages/company/components/CompanyHeader';
import { WebSocketProvider } from '../../context/WebSocketContext';
import AishaAssistant from '../common/AishaAssistant';

const CompanyLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            dispatch(fetchCompanyProfile());
        }
    }, [dispatch, isAuthenticated, user]);

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
            <Box minH="100vh">
                <CompanySidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                <Box
                    flex="1"
                    ml={{ base: 0, lg: "20px" }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                    <CompanyHeader />
                    <Box
                        as="main"
                        p={8}
                        ml={{ base: 0, lg: sidebarWidth }}
                        w={{ base: "full", lg: `calc(100% - ${sidebarWidth})` }}
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
