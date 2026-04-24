
import React from 'react';
import { Box, VStack, HStack, Text, Icon, Flex, Separator, IconButton, Image } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import {
    LuPanelLeftOpen,
    LuPanelLeftClose,
    LuActivity,
    LuGlobe
} from 'react-icons/lu';

export interface NavItem {
    name: string;
    icon: React.ElementType;
    path: string;
}

interface UnifiedSidebarProps {
    portalName: string;
    portalType: string;
    navItems: NavItem[];
    isCollapsed: boolean;
    onToggle?: () => void;
    onLogout: () => void;
    accentColor: string;
    showToggle?: boolean;
    isMobile?: boolean;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
    portalName,
    portalType,
    navItems,
    isCollapsed,
    onToggle,
    onLogout,
    accentColor,
    showToggle = true,
    isMobile = false
}) => {
    const sidebarContent = (
        <VStack align="stretch" gap={isCollapsed ? 4 : 8} h="full">
            {/* Logo Section */}
            <Flex align="center" gap={3} px={isCollapsed ? 0 : 2} justify={isCollapsed ? 'center' : 'flex-start'}>
                <Box
                    bg="white"
                    p={1}
                    borderRadius="xl"
                    boxShadow="0 0 20px rgba(0, 184, 212, 0.4)"
                    flexShrink={0}
                >
                    <Image src="/aisha-logo.png" alt="AISHA Logo" boxSize={8} borderRadius="lg" />
                </Box>
                {(!isCollapsed || isMobile) && (
                    <VStack align="flex-start" gap={0}>
                        <Text fontWeight="extrabold" fontSize="2xl" letterSpacing="tight" color="whiteAlpha.900">
                            {portalName}
                        </Text>
                        <Text fontSize="10px" fontWeight="bold" color={`${accentColor}.400`} mt="-1">
                            {portalType}
                        </Text>
                    </VStack>
                )}
            </Flex>

            <Separator opacity={0.1} />

            {/* Toggle Button (Hidden on Mobile) */}
            {showToggle && !isMobile && (
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
            )}

            {/* Navigation Items */}
            <VStack align="stretch" gap={2} flex="1" overflowY="auto" className="hide-scrollbar">
                <NavLink
                    to="/"
                    style={({ isActive }) => ({
                        textDecoration: 'none',
                        background: isActive ? `rgba(${accentColor === 'cyan' ? '0, 184, 212' : accentColor === 'orange' ? '255, 107, 0' : '167, 139, 250'}, 0.1)` : 'transparent',
                        borderRadius: '12px',
                        transition: '0.2s'
                    })}
                    title={isCollapsed && !isMobile ? "Home Hub" : undefined}
                >
                    <HStack
                        px={(isCollapsed && !isMobile) ? 0 : 4}
                        py={3}
                        gap={3}
                        color="whiteAlpha.800"
                        opacity={0.8}
                        _hover={{ opacity: 1, bg: 'whiteAlpha.100', color: 'white' }}
                        borderRadius="12px"
                        justify={(isCollapsed && !isMobile) ? 'center' : 'flex-start'}
                    >
                        <Icon as={LuGlobe} boxSize={5} flexShrink={0} />
                        {(!isCollapsed || isMobile) && (
                            <Text fontWeight="medium" fontSize="md" whiteSpace="nowrap">Home Hub</Text>
                        )}
                    </HStack>
                </NavLink>

                <Separator opacity={0.1} mb={2} />

                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        style={({ isActive }) => ({
                            textDecoration: 'none',
                            background: isActive ? `rgba(${accentColor === 'cyan' ? '0, 184, 212' : accentColor === 'orange' ? '255, 107, 0' : '167, 139, 250'}, 0.1)` : 'transparent',
                            borderRadius: '12px',
                            transition: '0.2s'
                        })}
                        title={isCollapsed && !isMobile ? item.name : undefined}
                    >
                        <HStack
                            px={(isCollapsed && !isMobile) ? 0 : 4}
                            py={3}
                            gap={3}
                            color="whiteAlpha.800"
                            opacity={0.8}
                            _hover={{ opacity: 1, bg: 'whiteAlpha.100', color: 'white' }}
                            borderRadius="12px"
                            justify={(isCollapsed && !isMobile) ? 'center' : 'flex-start'}
                        >
                            <Icon as={item.icon} boxSize={5} flexShrink={0} />
                            {(!isCollapsed || isMobile) && (
                                <Text fontWeight="medium" fontSize="md" whiteSpace="nowrap">{item.name}</Text>
                            )}
                        </HStack>
                    </NavLink>
                ))}
            </VStack>

            <Separator opacity={0.1} />

            {/* Logout Section */}
            <Box px={(isCollapsed && !isMobile) ? 0 : 2} pb={2}>
                <HStack
                    px={(isCollapsed && !isMobile) ? 0 : 4}
                    py={3}
                    gap={3}
                    color="red.400"
                    cursor="pointer"
                    _hover={{ bg: 'red.900/20', color: 'red.300' }}
                    borderRadius="12px"
                    justify={(isCollapsed && !isMobile) ? 'center' : 'flex-start'}
                    onClick={onLogout}
                >
                    <Icon as={LuActivity} transform="rotate(45deg)" boxSize={5} flexShrink={0} />
                    {(!isCollapsed || isMobile) && (
                        <Text fontWeight="black" fontSize="sm" letterSpacing="widest">SIGN OUT</Text>
                    )}
                </HStack>
            </Box>
        </VStack>
    );

    if (isMobile) {
        return (
            <Box h="full" p={6}>
                {sidebarContent}
            </Box>
        );
    }

    return (
        <Box
            w={isCollapsed ? '80px' : '280px'}
            h="calc(100vh - 32px)"
            className="glass-panel"
            position="fixed"
            left="4"
            top="4"
            bottom="4"
            m="0"
            borderRadius="24px"
            p={isCollapsed ? 3 : 6}
            zIndex={100}
            display={{ base: "none", lg: "block" }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            overflow="hidden"
        >
            {sidebarContent}
        </Box>
    );
};

export default UnifiedSidebar;
