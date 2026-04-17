import React, { useState } from 'react';
import { Box, Flex, Heading, HStack, Button, Text, VStack } from '@chakra-ui/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '../common/ThemeToggle';
import {
    DrawerRoot,
    DrawerBackdrop,
    DrawerContent,
    DrawerBody,
    DrawerCloseTrigger,
    IconButton
} from '@chakra-ui/react';
import { LuMenu } from 'react-icons/lu';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';

const AdminLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
            <Box as="nav" bg="var(--terminal-card)" px={{ base: 4, md: 8 }} py={4} shadow="md" borderBottom="1px solid" borderColor="var(--terminal-border)" pos="sticky" top={0} zIndex={1100}>
                <Flex justify="space-between" align="center">
                    <HStack gap={4}>
                        <IconButton
                            aria-label="Open Menu"
                            display={{ base: "flex", md: "none" }}
                            variant="ghost"
                            color="white"
                            onClick={() => setIsMobileNavOpen(true)}
                            size="sm"
                        >
                            <LuMenu size={24} />
                        </IconButton>
                        <Heading size="md">SAPS Admin</Heading>
                    </HStack>
                    
                    <HStack gap={6}>
                        <HStack gap={6} display={{ base: "none", md: "flex" }}>
                            <Link to="/admin/dashboard">Dashboard</Link>
                            <ThemeToggle />
                        </HStack>
                        <HStack>
                            <Text fontSize="sm" fontWeight="bold" display={{ base: "none", sm: "block" }}>{user.firstName}</Text>
                            <Button size="sm" colorPalette="red" variant="solid" onClick={handleLogout}>Sign Out</Button>
                        </HStack>
                    </HStack>
                </Flex>
            </Box>

            {/* Mobile Drawer */}
            <DrawerRoot
                open={isMobileNavOpen}
                onOpenChange={(e) => setIsMobileNavOpen(e.open)}
                placement="start"
                size="xs"
            >
                <DrawerBackdrop />
                <DrawerContent bg="var(--terminal-bg)">
                    <DrawerBody p={6}>
                        <VStack align="stretch" gap={6}>
                            <Heading size="md" mb={4}>SAPS Admin</Heading>
                            <Link to="/admin/dashboard" onClick={() => setIsMobileNavOpen(false)}>
                                <HStack gap={3} p={2} _hover={{ bg: "whiteAlpha.100" }} borderRadius="md">
                                    <Text fontWeight="medium">Dashboard</Text>
                                </HStack>
                            </Link>
                            <Flex align="center" justify="space-between" p={2}>
                                <Text fontWeight="medium">Theme</Text>
                                <ThemeToggle />
                            </Flex>
                            <Box mt="auto">
                                <Button w="full" colorPalette="red" onClick={handleLogout}>Sign Out</Button>
                            </Box>
                        </VStack>
                    </DrawerBody>
                    <DrawerCloseTrigger color="white" top="6" right="6" />
                </DrawerContent>
            </DrawerRoot>

            <Box flex="1" bg="transparent" p={{ base: 4, md: 6 }}>
                <Outlet />
            </Box>
        </Flex>
    );
};

export default AdminLayout;
