
import React from 'react';
import { Box, VStack, HStack, Text, Icon, Flex, Separator, IconButton } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import {
    LuLayoutDashboard,
    LuBriefcase,
    LuUser,
    LuPanelLeftOpen,
    LuPanelLeftClose,
    LuGraduationCap,
    LuActivity,
    LuFileText,
    LuSettings
} from 'react-icons/lu';

const navItems = [
    { name: 'Dashboard', icon: LuLayoutDashboard, path: '/student/dashboard' },
    { name: 'My Placement', icon: LuBriefcase, path: '/student/attachments' },
    { name: 'Profile', icon: LuUser, path: '/student/profile' },
    { name: 'Logbook', icon: LuFileText, path: '/student/logbook' },
    { name: 'Settings', icon: LuSettings, path: '/student/settings' },
];

interface StudentSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ isCollapsed, onToggle, onLogout }) => {
    return (
        <Box
            w={isCollapsed ? '80px' : '280px'}
            h="full"
            className="glass-panel"
            position="relative"
            m="0"
            borderRadius={{ base: "0", lg: "24px" }}
            p={isCollapsed ? 3 : 6}
            zIndex={100}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            overflow="hidden"
        >
            <VStack align="stretch" gap={isCollapsed ? 4 : 8} h="full">
                {/* Logo Section */}
                <Flex align="center" gap={3} px={isCollapsed ? 0 : 2} justify={isCollapsed ? 'center' : 'flex-start'}>
                    <Box
                        bg="cyan.600"
                        p={2}
                        borderRadius="xl"
                        boxShadow="0 0 15px rgba(0, 184, 212, 0.3)"
                        flexShrink={0}
                    >
                        <Icon as={LuGraduationCap} color="white" boxSize={6} />
                    </Box>
                    {!isCollapsed && (
                        <VStack align="flex-start" gap={0}>
                            <Text fontWeight="extrabold" fontSize="2xl" letterSpacing="tight" color="whiteAlpha.900">
                                AISHA
                            </Text>
                            <Text fontSize="10px" fontWeight="bold" color="cyan.400" mt="-1">
                                STUDENT PORTAL
                            </Text>
                        </VStack>
                    )}
                </Flex>

                <Separator opacity={0.1} />

                {/* Toggle Button */}
                <Flex justify={isCollapsed ? 'center' : 'flex-end'} px={isCollapsed ? 0 : 1}>
                    <IconButton
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        variant="ghost"
                        color="white"
                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                        size="sm"
                        rounded="lg"
                        onClick={onToggle}
                    >
                        {isCollapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
                    </IconButton>
                </Flex>

                {/* Navigation Items */}
                <VStack align="stretch" gap={2} flex="1" overflowY="auto" className="hide-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            style={({ isActive }) => ({
                                textDecoration: 'none',
                                background: isActive ? 'rgba(0, 184, 212, 0.1)' : 'transparent',
                                borderRadius: '12px',
                                transition: '0.2s'
                            })}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <HStack
                                px={isCollapsed ? 0 : 4}
                                py={3}
                                gap={3}
                                color="whiteAlpha.800"
                                opacity={0.8}
                                _hover={{ opacity: 1, bg: 'whiteAlpha.100', color: 'white' }}
                                borderRadius="12px"
                                justify={isCollapsed ? 'center' : 'flex-start'}
                            >
                                <Icon as={item.icon} boxSize={5} flexShrink={0} />
                                {!isCollapsed && (
                                    <Text fontWeight="medium" fontSize="md" whiteSpace="nowrap">{item.name}</Text>
                                )}
                            </HStack>
                        </NavLink>
                    ))}
                </VStack>

                {/* Bottom Card */}


                <Separator opacity={0.1} />

                {/* Logout Section */}
                <Box px={isCollapsed ? 0 : 2} pb={2}>
                    <HStack
                        px={isCollapsed ? 0 : 4}
                        py={3}
                        gap={3}
                        color="red.400"
                        cursor="pointer"
                        _hover={{ bg: 'red.900/20', color: 'red.300' }}
                        borderRadius="12px"
                        justify={isCollapsed ? 'center' : 'flex-start'}
                        onClick={onLogout}
                    >
                        <Icon as={LuActivity} transform="rotate(45deg)" boxSize={5} flexShrink={0} />
                        {!isCollapsed && (
                            <Text fontWeight="black" fontSize="sm" letterSpacing="widest">SIGN OUT</Text>
                        )}
                    </HStack>
                </Box>
            </VStack>
        </Box>
    );
};

export default StudentSidebar;
