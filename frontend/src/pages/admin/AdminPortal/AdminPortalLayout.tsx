import React, { useState } from 'react';
import { Box, Flex, Icon, Text, VStack, IconButton, Image, Heading } from '@chakra-ui/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../../store';
import NotificationCenter from '../../../components/common/NotificationCenter';
import { logout } from '../../../store/authSlice';
import AishaAssistant from '../../../components/common/AishaAssistant';
import BroadcastBanner from '../../../components/common/BroadcastBanner';
import {
    LayoutDashboard,
    Users,
    FileText,
    Briefcase,
    Settings,
    LogOut,
    Menu,
    X,
    MessageSquare
} from 'lucide-react';

const navItems = [
    { name: 'Analytics', path: '/institution/dashboard', icon: LayoutDashboard, roles: ['INSTITUTION'] },
    { name: 'Dashboard', deptPath: '/department/dashboard', icon: LayoutDashboard, roles: ['DEPARTMENT_ADMIN'] },
    { name: 'Communications', path: '/institution/chat', deptPath: '/department/chat', icon: MessageSquare, roles: ['INSTITUTION', 'DEPARTMENT_ADMIN'] },
    { name: 'Departments', path: '/institution/departments', icon: Users, roles: ['INSTITUTION'] },
    { name: 'Student Node', deptPath: '/department/students', icon: Users, roles: ['DEPARTMENT_ADMIN'] },
    { name: 'Document Hub', deptPath: '/department/documents', icon: FileText, roles: ['DEPARTMENT_ADMIN'] },
    { name: 'Logbook Hub', path: '/institution/logbooks', deptPath: '/department/logbooks', icon: FileText },
    { name: 'Placement Hub', path: '/institution/placements', deptPath: '/department/placements', icon: Briefcase },
    { name: 'Settings', path: '/institution/settings', deptPath: '/department/settings', icon: Settings },
];

const AdminPortalLayout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <Flex minH="100vh" bg="#0d1117" color="white" overflow="hidden">
            {/* Sidebar */}
            <Box
                as="nav"
                w={isSidebarOpen ? "260px" : "80px"}
                className="sidebar-glass"
                transition="width 0.3s ease"
                position="relative"
                zIndex={20}
            >
                <VStack h="full" py={8} px={4} gap={8} align="stretch">
                    {/* Logo */}
                    <Flex align="center" px={2} h="40px">
                        <Box
                            w="40px"
                            h="40px"
                            borderRadius="10px"
                            bg="linear-gradient(135deg, #a78bfa 0%, #2dd4bf 100%)"
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
                                        bg={isActive ? "rgba(167, 139, 250, 0.15)" : "transparent"}
                                        color={isActive ? "#a78bfa" : "gray.400"}
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
                            color="gray.400"
                            _hover={{ bg: "rgba(239, 68, 68, 0.1)", color: "red.400" }}
                            onClick={handleLogout}
                        >
                            <Icon as={LogOut} boxSize={5} mr={isSidebarOpen ? 4 : 0} />
                            {isSidebarOpen && <Text fontWeight="medium">Logout</Text>}
                        </Flex>
                    </Box>
                </VStack>
            </Box>

            {/* Main Content */}
            <Box flex="1" h="100vh" overflowY="auto" position="relative">
                <BroadcastBanner system="INSTITUTION" />
                {/* Top bar */}
                <Flex
                    h="70px"
                    align="center"
                    justify="space-between"
                    px={8}
                    position="sticky"
                    top={0}
                    zIndex={10}
                    className="sidebar-glass"
                    backdropFilter="blur(10px)"
                >
                    <IconButton
                        aria-label="Toggle Sidebar"
                        variant="ghost"
                        color="gray.400"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </IconButton>

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
                                border="2px solid rgba(167, 139, 250, 0.3)"
                            >
                                <Image src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.email || 'Admin'}&background=805ad5&color=fff`} />
                            </Box>
                        </Flex>
                    </Flex>
                </Flex>

                {/* Content Area */}
                <Box p={8}>
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
