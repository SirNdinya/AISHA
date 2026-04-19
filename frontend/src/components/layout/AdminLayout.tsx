import React, { useState } from 'react';
import {
    Box, Flex, Heading, HStack, Button, Text, IconButton, VStack
} from '@chakra-ui/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '../common/ThemeToggle';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { LuMenu, LuX, LuShieldCheck, LuLayoutDashboard, LuHouse, LuLogOut } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const AdminLayout: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            {/* Top Navigation Bar */}
            <Box
                as="nav"
                bg="var(--terminal-card)"
                px={{ base: 4, md: 8 }}
                py={4}
                shadow="md"
                borderBottom="1px solid"
                borderColor="var(--terminal-border)"
                position="sticky"
                top={0}
                zIndex={1100}
            >
                <Flex justify="space-between" align="center">
                    <HStack gap={3}>
                        {/* Mobile hamburger */}
                        <IconButton
                            aria-label="Open menu"
                            variant="ghost"
                            color="white"
                            display={{ base: 'flex', md: 'none' }}
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <LuMenu size={22} />
                        </IconButton>
                        <HStack gap={2}>
                            <LuShieldCheck size={20} color="var(--terminal-accent)" />
                            <Heading size="md">SAPS Admin</Heading>
                        </HStack>
                    </HStack>

                    {/* Desktop links */}
                    <HStack gap={6} display={{ base: 'none', md: 'flex' }}>
                        <Link to="/">Home Hub</Link>
                        <Link to="/admin/dashboard">Dashboard</Link>
                        <ThemeToggle />
                        <HStack>
                            <Text fontSize="sm" fontWeight="bold">{user.firstName} (Admin)</Text>
                            <Button size="sm" colorPalette="red" variant="solid" onClick={handleLogout}>
                                Sign Out
                            </Button>
                        </HStack>
                    </HStack>

                    {/* Mobile: show user name */}
                    <Text fontSize="sm" fontWeight="bold" display={{ base: 'flex', md: 'none' }}>
                        {user.firstName}
                    </Text>
                </Flex>
            </Box>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
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
                        />
                        <MotionBox
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            position="fixed"
                            left={0} top={0} bottom={0}
                            w="260px"
                            bg="var(--terminal-card)"
                            borderRight="1px solid"
                            borderColor="var(--terminal-border)"
                            zIndex={2001}
                            boxShadow="2xl"
                        >
                            <Box position="absolute" top={4} right={4}>
                                <IconButton
                                    aria-label="Close menu"
                                    variant="ghost"
                                    color="white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LuX />
                                </IconButton>
                            </Box>
                            <VStack align="stretch" gap={2} p={6} pt={16}>
                                <HStack gap={3} mb={4}>
                                    <LuShieldCheck size={22} color="var(--terminal-accent)" />
                                    <Heading size="md">SAPS Admin</Heading>
                                </HStack>
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                                    <HStack py={3} px={4} borderRadius="12px" _hover={{ bg: 'whiteAlpha.100' }} gap={3}>
                                        <LuHouse size={18} /><Text>Home Hub</Text>
                                    </HStack>
                                </Link>
                                <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                    <HStack py={3} px={4} borderRadius="12px" _hover={{ bg: 'whiteAlpha.100' }} gap={3}>
                                        <LuLayoutDashboard size={18} /><Text>Dashboard</Text>
                                    </HStack>
                                </Link>
                                <Box mt={4}><ThemeToggle /></Box>
                                <HStack
                                    py={3} px={4} borderRadius="12px" cursor="pointer"
                                    color="red.400" _hover={{ bg: 'red.900/20' }} gap={3}
                                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                    mt={4}
                                >
                                    <LuLogOut size={18} />
                                    <Text fontWeight="bold">Sign Out</Text>
                                </HStack>
                            </VStack>
                        </MotionBox>
                    </>
                )}
            </AnimatePresence>

            <Box flex="1" bg="transparent" p={{ base: 4, md: 6 }}>
                <Outlet />
            </Box>
        </Flex>
    );
};

export default AdminLayout;
