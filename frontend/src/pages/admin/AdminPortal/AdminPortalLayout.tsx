import React, { useState } from 'react';
import { Box, Flex, Icon, Text, VStack, IconButton, Image, Heading } from '@chakra-ui/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../../store';
import NotificationCenter from '../../../components/common/NotificationCenter';
import { logout } from '../../../store/authSlice';
import AishaAssistant from '../../../components/common/AishaAssistant';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    LogOut,
    Home
} from 'lucide-react';
import { LuPanelLeftClose, LuPanelLeftOpen, LuMenu, LuX } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const navItems = [
    { name: 'Home Hub', path: '/', icon: Home },
    { name: 'Institutional Overview', path: '/institution/dashboard', icon: LayoutDashboard, roles: ['INSTITUTION'] },
    { name: 'Departments', path: '/institution/departments', icon: Users, roles: ['INSTITUTION'] },
    { name: 'Dashboard', deptPath: '/department/dashboard', icon: LayoutDashboard, roles: ['DEPARTMENT_ADMIN'] },
    { name: 'Placement Hub', deptPath: '/department/placements', icon: Briefcase, roles: ['DEPARTMENT_ADMIN'] },
    { name: 'Settings', path: '/institution/settings', deptPath: '/department/settings', icon: Settings },
];

const AdminPortalLayout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <Flex minH="100vh" bg="var(--terminal-bg)" color="#F8FAFC" overflow="hidden">
            {/* Desktop Sidebar */}
            <Box
                as="nav"
                w={isSidebarOpen ? '260px' : '80px'}
                className="sidebar-glass"
                transition="width 0.3s ease"
                position="relative"
                zIndex={20}
                display={{ base: 'none', lg: 'block' }}
                flexShrink={0}
            >
                <VStack h="full" py={8} px={4} gap={8} align="stretch">
                    {/* Logo */}
                    <Flex align="center" px={2} h="40px">
                        <Box
                            w="40px"
                            h="40px"
                            borderRadius="10px"
                            bg="linear-gradient(135deg, var(--terminal-accent) 0%, #2dd4bf 100%)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            mr={isSidebarOpen ? 3 : 0}
                        >
                            <Box w="20px" h="20px" bg="white" borderRadius="4px" />
                        </Box>
                        {isSidebarOpen && (
                            <Heading size="md" className="gradient-text" fontWeight="bold">
                                AISHA
                            </Heading>
                        )}
                    </Flex>

                    {/* Toggle Button */}
                    <Flex justify={isSidebarOpen ? 'flex-end' : 'center'} px={isSidebarOpen ? 1 : 0}>
                        <IconButton
                            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                            variant="ghost"
                            color="whiteAlpha.500"
                            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                            size="sm"
                            rounded="lg"
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <LuPanelLeftClose /> : <LuPanelLeftOpen />}
                        </IconButton>
                    </Flex>

                    {/* Nav Links */}
                    <VStack gap={2} align="stretch">
                        {navItems.filter(item => {
                            if (!item.roles) return true;
                            const userRole = (user?.role || '').toUpperCase();
                            return item.roles.some(r => r.toUpperCase() === userRole);
                        }).map((item) => {
                            const userRole = (user?.role || '').toUpperCase();
                            const targetPath = (userRole === 'DEPARTMENT_ADMIN' && item.deptPath ? item.deptPath : item.path) || '/';
                            const isActive = location.pathname === targetPath;
                            return (
                                <NavLink key={item.name} to={targetPath}>
                                    <Flex
                                        align="center"
                                        p={3}
                                        borderRadius="12px"
                                        transition="all 0.2s"
                                        bg={isActive ? "rgba(56, 189, 248, 0.15)" : "transparent"}
                                        color={isActive ? "var(--terminal-accent)" : "gray.400"}
                                        _hover={{ bg: "rgba(255, 255, 255, 0.05)", color: "white" }}
                                    >
                                        <Icon as={item.icon} boxSize={5} mr={isSidebarOpen ? 4 : 0} />
                                        {isSidebarOpen && <Text fontWeight="medium">{item.name}</Text>}
                                    </Flex>
                                </NavLink>
                            );
                        })}
                    </VStack>

                    {/* Footer / Logout */}
                    <Box mt="auto" px={2}>
                        <Flex
                            align="center"
                            p={3}
                            borderRadius="12px"
                            cursor="pointer"
                            color="red.400"
                            _hover={{ bg: "rgba(239, 68, 68, 0.1)", color: "red.300" }}
                            onClick={handleLogout}
                        >
                            <Icon as={LogOut} boxSize={5} mr={isSidebarOpen ? 4 : 0} />
                            {isSidebarOpen && <Text fontWeight="medium">Sign Out</Text>}
                        </Flex>
                    </Box>
                </VStack>
            </Box>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <MotionBox
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            position="fixed"
                            inset={0}
                            bg="blackAlpha.700"
                            backdropFilter="blur(4px)"
                            zIndex={2000}
                            display={{ base: 'block', lg: 'none' }}
                        />
                        <MotionBox
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            position="fixed"
                            left={0} top={0} bottom={0}
                            w="260px"
                            className="sidebar-glass"
                            zIndex={2001}
                            display={{ base: 'block', lg: 'none' }}
                            boxShadow="2xl"
                        >
                            {/* Close Button */}
                            <Box position="absolute" top={4} right={4} zIndex={2002}>
                                <IconButton
                                    aria-label="Close menu"
                                    variant="ghost"
                                    color="white"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LuX />
                                </IconButton>
                            </Box>
                            {/* Drawer Nav — same content as sidebar */}
                            <VStack h="full" py={8} px={4} gap={8} align="stretch">
                                <Flex align="center" px={2} h="40px">
                                    <Box w="40px" h="40px" borderRadius="10px" bg="linear-gradient(135deg, var(--terminal-accent) 0%, #2dd4bf 100%)" display="flex" alignItems="center" justifyContent="center" mr={3}>
                                        <Box w="20px" h="20px" bg="white" borderRadius="4px" />
                                    </Box>
                                    <Heading size="md" className="gradient-text" fontWeight="bold">AISHA</Heading>
                                </Flex>
                                <VStack gap={2} align="stretch">
                                    {navItems.filter(item => {
                                        if (!item.roles) return true;
                                        const userRole = (user?.role || '').toUpperCase();
                                        return item.roles.some(r => r.toUpperCase() === userRole);
                                    }).map((item) => {
                                        const userRole = (user?.role || '').toUpperCase();
                                        const targetPath = (userRole === 'DEPARTMENT_ADMIN' && item.deptPath ? item.deptPath : item.path) || '/';
                                        const isActive = location.pathname === targetPath;
                                        return (
                                            <NavLink key={item.name} to={targetPath} onClick={() => setMobileMenuOpen(false)}>
                                                <Flex align="center" p={3} borderRadius="12px" transition="all 0.2s"
                                                    bg={isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent'}
                                                    color={isActive ? 'var(--terminal-accent)' : 'gray.400'}
                                                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                >
                                                    <Icon as={item.icon} boxSize={5} mr={4} />
                                                    <Text fontWeight="medium">{item.name}</Text>
                                                </Flex>
                                            </NavLink>
                                        );
                                    })}
                                </VStack>
                                <Box mt="auto" px={2}>
                                    <Flex align="center" p={3} borderRadius="12px" cursor="pointer" color="red.400"
                                        _hover={{ bg: 'rgba(239,68,68,0.1)', color: 'red.300' }}
                                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                                    >
                                        <Icon as={LogOut} boxSize={5} mr={4} />
                                        <Text fontWeight="medium">Sign Out</Text>
                                    </Flex>
                                </Box>
                            </VStack>
                        </MotionBox>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <Box flex="1" h="100vh" overflowY="auto" position="relative">
                {/* Top bar */}
                <Flex
                    h="70px"
                    align="center"
                    justify="space-between"
                    px={{ base: 4, md: 8 }}
                    position="sticky"
                    top={0}
                    zIndex={1100}
                    className="sidebar-glass"
                    backdropFilter="blur(10px)"
                >
                    {/* Mobile hamburger */}
                    <IconButton
                        aria-label="Open navigation"
                        variant="ghost"
                        color="white"
                        display={{ base: 'flex', lg: 'none' }}
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <LuMenu size={24} />
                    </IconButton>
                    <Box display={{ base: 'none', lg: 'block' }} />

                    <Flex align="center" gap={6}>
                        <NotificationCenter />
                        <Flex align="center" gap={3}>
                            <Box textAlign="right" display={["none", "block"]}>
                                <Text fontSize="sm" fontWeight="bold">
                                    {user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.email?.split('@')[0] || 'Admin')}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {user?.role === 'INSTITUTION' ? 'Institution Registrar' : 'Department Admin'}
                                </Text>
                            </Box>
                            <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                overflow="hidden"
                                border="2px solid var(--terminal-accent)"
                            >
                                <Image src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.email || 'Admin'}&background=805ad5&color=fff`} />
                            </Box>
                        </Flex>
                    </Flex>
                </Flex>

                {/* Content Area */}
                <Box p={{ base: 4, md: 8 }}>
                    <Outlet />
                </Box>

                {/* Decorative Background Elements */}
                <Box
                    position="absolute"
                    top="-100px"
                    right="-100px"
                    w="400px"
                    h="400px"
                    bg="rgba(128, 90, 213, 0.1)"
                    filter="blur(100px)"
                    zIndex={-1}
                    borderRadius="full"
                />
                <Box
                    position="absolute"
                    bottom="10%"
                    left="10%"
                    w="300px"
                    h="300px"
                    bg="rgba(45, 212, 191, 0.05)"
                    filter="blur(80px)"
                    zIndex={-1}
                    borderRadius="full"
                />
                <AishaAssistant />
            </Box>
        </Flex>
    );
};

export default AdminPortalLayout;
