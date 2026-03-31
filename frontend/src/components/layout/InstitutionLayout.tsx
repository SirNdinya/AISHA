import React from 'react';
import { Box, Flex, Heading, HStack, Button, Text } from '@chakra-ui/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '../common/ThemeToggle';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';

const InstitutionLayout: React.FC = () => {
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
                <Text>Please log in to access the Institution Portal.</Text>
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </Flex>
        );
    }

    return (
        <Flex direction="column" minH="100vh">
            <Box as="nav" bg="white" px={8} py={4} shadow="sm" borderBottom="1px solid" borderColor="gray.100">
                <Flex justify="space-between" align="center">
                    <Heading size="md" color="purple.600">SAPS Institution</Heading>
                    <HStack gap={6}>
                        <Link to="/institution/dashboard">Dashboard</Link>
                        <ThemeToggle />
                        <HStack>
                            <Text fontSize="sm" fontWeight="bold">{user.firstName} (Coordinator)</Text>
                            <Button size="sm" variant="outline" onClick={handleLogout}>Logout</Button>
                        </HStack>
                    </HStack>
                </Flex>
            </Box>
            <Box flex="1" bg="gray.50" p={6}>
                <Outlet />
            </Box>
        </Flex>
    );
};

export default InstitutionLayout;
