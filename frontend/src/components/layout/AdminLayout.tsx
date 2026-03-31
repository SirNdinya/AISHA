import React from 'react';
import { Box, Flex, Heading, HStack, Button, Text } from '@chakra-ui/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '../common/ThemeToggle';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import BroadcastBanner from '../common/BroadcastBanner';

const AdminLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    if (!isAuthenticated || !user) {
        return (
            <Flex h="100vh" align="center" justify="center" direction="column" gap={4}>
                <Text>Please log in to access the Admin Panel.</Text>
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </Flex>
        );
    }

    return (
        <Flex direction="column" minH="100vh">
            <BroadcastBanner system="ADMIN" />
            <Box as="nav" bg="gray.800" color="white" px={8} py={4} shadow="md">
                <Flex justify="space-between" align="center">
                    <Heading size="md">SAPS Admin</Heading>
                    <HStack gap={6}>
                        <Link to="/admin/dashboard">Dashboard</Link>
                        <ThemeToggle />
                        <HStack>
                            <Text fontSize="sm" fontWeight="bold">{user.firstName} (Admin)</Text>
                            <Button size="sm" colorPalette="red" variant="solid" onClick={handleLogout}>Logout</Button>
                        </HStack>
                    </HStack>
                </Flex>
            </Box>
            <Box flex="1" bg="gray.900" color="white" p={6}>
                <Outlet />
            </Box>
        </Flex>
    );
};

export default AdminLayout;
