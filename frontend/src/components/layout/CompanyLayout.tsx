
import React, { useState } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import CompanySidebar from '../../pages/company/components/CompanySidebar';
import CompanyHeader from '../../pages/company/components/CompanyHeader';
import { WebSocketProvider } from '../../context/WebSocketContext';
import AishaAssistant from '../common/AishaAssistant';
import BroadcastBanner from '../common/BroadcastBanner';
import '../../styles/AIDashboardTheme.css';

const CompanyLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const sidebarWidth = isSidebarCollapsed ? '100px' : '300px';

    if (!isAuthenticated || !user) {
        return (
            <Flex h="100vh" align="center" justify="center" direction="column" gap={4} bg="#0F172A">
                <Text color="white">Please log in to access the Enterprise Portal.</Text>
                <Button onClick={() => navigate('/login')} colorPalette="blue">Go to Login</Button>
            </Flex>
        );
    }

    return (
        <WebSocketProvider userId={user.id}>
            <Box className="glass-background" minH="100vh">
                <BroadcastBanner system="COMPANY" />
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
