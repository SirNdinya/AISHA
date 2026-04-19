import React, { useState } from 'react';
import {
    Box, Flex, Heading, HStack, Button, Text, IconButton, VStack
} from '@chakra-ui/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '../common/ThemeToggle';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { LuMenu, LuX, LuBuilding2, LuLayoutDashboard, LuHouse, LuLogOut } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const InstitutionLayout: React.FC = () => {
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
                <Text>Please log in to access the Institution Portal.</Text>
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </Flex>
        );
    }

    return (
        <Flex direction="column" minH="100vh">
            {/* Top Navigation */}
            <Box
                as="nav"
                bg="white"
                px={{ base: 4, md: 8 }}
                py={4}
                shadow="sm"
                borderBottom="1px solid"
                borderColor="gray.100"
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
                            color="purple.600"
                            display={{ base: 'flex', md: 'none' }}
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <LuMenu size={22} />
                        </IconButton>
                        <HStack gap={2}>
                            <LuBuilding2 size={20} color="#6B46C1" />
                            <Heading size="md" color="purple.600">SAPS Institution</Heading>
                        </HStack>
                    </HStack>

                    {/* Desktop links */}
                    <HStack gap={6} display={{ base: 'none', md: 'flex' }}>
                        <Link to="/institution/dashboard">Dashboard</Link>
                        <ThemeToggle />
                        <HStack>
                            <Text fontSize="sm" fontWeight="bold">{user.firstName} (Coordinator)</Text>
                            <Button size="sm" variant="outline" colorPalette="red" onClick={handleLogout}>
                                Sign out
                            </Button>
                        </HStack>
                    </HStack>

                    {/* Mobile: show user name */}
                    <Text fontSize="sm" fontWeight="bold" color="purple.700" display={{ base: 'flex', md: 'none' }}>
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
                            bg="blackAlpha.600"
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
                            bg="white"
                            borderRight="1px solid"
                            borderColor="gray.200"
                            zIndex={2001}
                            boxShadow="2xl"
                        >
                            <Box position="absolute" top={4} right={4}>
                                <IconButton
                                    aria-label="Close menu"
                                    variant="ghost"
                                    color="gray.600"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LuX />
                                </IconButton>
                            </Box>
                            <VStack align="stretch" gap={2} p={6} pt={16}>
                                <HStack gap={3} mb={4}>
                                    <LuBuilding2 size={22} color="#6B46C1" />
                                    <Heading size="md" color="purple.600">Institution</Heading>
                                </HStack>
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                                    <HStack py={3} px={4} borderRadius="12px" _hover={{ bg: 'gray.100' }} gap={3} color="gray.700">
                                        <LuHouse size={18} /><Text>Home Hub</Text>
                                    </HStack>
                                </Link>
                                <Link to="/institution/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                    <HStack py={3} px={4} borderRadius="12px" _hover={{ bg: 'gray.100' }} gap={3} color="gray.700">
                                        <LuLayoutDashboard size={18} /><Text>Dashboard</Text>
                                    </HStack>
                                </Link>
                                <Box mt={4}><ThemeToggle /></Box>
                                <HStack
                                    py={3} px={4} borderRadius="12px" cursor="pointer"
                                    color="red.500" _hover={{ bg: 'red.50' }} gap={3}
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

            <Box flex="1" bg="gray.50" p={{ base: 4, md: 6 }}>
                <Outlet />
            </Box>
        </Flex>
    );
};

export default InstitutionLayout;
