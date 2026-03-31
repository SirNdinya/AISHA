
import React from 'react';
import { Box, VStack, HStack, Text, Icon, Flex, Badge, Separator, IconButton } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import {
    LuLayoutDashboard,
    LuBriefcase,
    LuUsers,
    LuGrip,
    LuSettings,
    LuShield,
    LuActivity,
    LuMessageSquare,
    LuFileText,
    LuPanelLeftClose,
    LuPanelLeftOpen
} from 'react-icons/lu';

const navItems = [
    { name: 'Dashboard', icon: LuLayoutDashboard, path: '/company/dashboard' },
    { name: 'Structure & Staff', icon: LuUsers, path: '/company/structure' },
    { name: 'Communications', icon: LuMessageSquare, path: '/company/chat' },
    { name: 'Job Manager', icon: LuBriefcase, path: '/company/opportunities' },
    { name: 'Applicant Pipeline', icon: LuUsers, path: '/company/applicants' },
    { name: 'Active Placements', icon: LuGrip, path: '/company/placements' },
    { name: 'Logbook Reviews', icon: LuFileText, path: '/company/logbooks' },
    { name: 'Enterprise Settings', icon: LuSettings, path: '/company/settings' },
];

interface CompanySidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const CompanySidebar: React.FC<CompanySidebarProps> = ({ isCollapsed, onToggle }) => {
    return (
        <Box
            w={isCollapsed ? '80px' : '280px'}
            h="100vh"
            className="glass-panel"
            position="fixed"
            left="4"
            top="4"
            bottom="4"
            m="0"
            borderRadius="24px"
            p={isCollapsed ? 3 : 6}
            zIndex={10}
            display={{ base: "none", lg: "block" }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            overflow="hidden"
        >
            <VStack align="stretch" gap={isCollapsed ? 4 : 8} h="full">
                {/* Logo Section */}
                <Flex align="center" gap={3} px={isCollapsed ? 0 : 2} justify={isCollapsed ? 'center' : 'flex-start'}>
                    <Box
                        bg="blue.600"
                        p={2}
                        borderRadius="xl"
                        boxShadow="0 0 15px rgba(49, 130, 206, 0.3)"
                        flexShrink={0}
                    >
                        <Icon as={LuShield} color="white" boxSize={6} />
                    </Box>
                    {!isCollapsed && (
                        <VStack align="flex-start" gap={0}>
                            <Text fontWeight="extrabold" fontSize="xl" letterSpacing="tight" color="white">
                                AISHA
                            </Text>
                            <Text fontSize="10px" fontWeight="bold" color="blue.400" mt="-1">
                                CORPORATE PORTAL
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
                        color="whiteAlpha.500"
                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                        size="sm"
                        rounded="lg"
                        onClick={onToggle}
                    >
                        {isCollapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
                    </IconButton>
                </Flex>

                {/* Navigation Items */}
                <VStack align="stretch" gap={2} flex="1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            style={({ isActive }) => ({
                                textDecoration: 'none',
                                background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                borderRadius: '12px',
                                transition: '0.2s'
                            })}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <HStack
                                px={isCollapsed ? 0 : 4}
                                py={3}
                                gap={3}
                                color="white"
                                opacity={0.8}
                                _hover={{ opacity: 1, bg: 'whiteAlpha.100' }}
                                borderRadius="12px"
                                justify={isCollapsed ? 'center' : 'flex-start'}
                            >
                                <Icon as={item.icon} boxSize={5} flexShrink={0} />
                                {!isCollapsed && (
                                    <Text fontWeight="medium" fontSize="sm" whiteSpace="nowrap">{item.name}</Text>
                                )}
                            </HStack>
                        </NavLink>
                    ))}
                </VStack>

                {/* Bottom Card */}
                {!isCollapsed ? (
                    <Box
                        className="glass-panel-accent"
                        p={4}
                        borderRadius="2xl"
                        position="relative"
                        overflow="hidden"
                    >
                        <Icon as={LuActivity} position="absolute" right="-10px" bottom="-10px" boxSize="60px" opacity={0.1} />
                        <HStack mb={2}>
                            <Badge colorPalette="green" size="xs" variant="subtle">SYSTEM LIVE</Badge>
                            <Text fontSize="10px" fontWeight="bold">STABLE</Text>
                        </HStack>
                        <Text fontSize="xs" color="blue.100" opacity={0.8}>
                            Monitoring active placements and pending assessments.
                        </Text>
                    </Box>
                ) : (
                    <Flex justify="center">
                        <Box
                            w={3} h={3}
                            borderRadius="full"
                            bg="green.400"
                            boxShadow="0 0 8px rgba(72, 187, 120, 0.6)"
                            title="System Live - Stable"
                        />
                    </Flex>
                )}
            </VStack>
        </Box>
    );
};

export default CompanySidebar;
