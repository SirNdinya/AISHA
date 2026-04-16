import React from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Card, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaBuilding, FaUniversity, FaUserShield } from 'react-icons/fa';

interface PortalOption {
    title: string;
    description: string;
    icon: any;
    color: string;
    path: string;
}

const portals: PortalOption[] = [
    {
        title: 'Student Portal',
        description: 'Dashboard, attachment management, and profile synchronization',
        icon: FaGraduationCap,
        color: 'indigo.500',
        path: '/login?portal=student'
    },
    {
        title: 'Company Portal',
        description: 'Post opportunities, manage placements, and corporate profile',
        icon: FaBuilding,
        color: 'green.500',
        path: '/login?portal=company'
    },
    {
        title: 'Institution Portal',
        description: 'Oversee students, manage partnerships, and track placements',
        icon: FaUniversity,
        color: 'purple.500',
        path: '/login?portal=institution'
    },
    {
        title: 'Admin Portal',
        description: 'System-wide configuration, user management, and core security',
        icon: FaUserShield,
        color: 'red.500',
        path: '/login?portal=admin'
    }
];

const PortalSelector: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box
            minH="100vh"
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={8}
            overflow="hidden"
        >
            {/* Premium Background Layer */}
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgImage="url('/landing-bg.png')"
                bgSize="cover"
                bgPosition="center"
                zIndex={-1}
                _after={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bg: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            <VStack gap={10} maxW="1200px" w="full" zIndex={1}>
                <VStack gap={3} textAlign="center" color="white">
                    <Heading 
                        size="4xl" 
                        fontWeight="black" 
                        letterSpacing="tighter"
                        bgGradient="to-r" 
                        gradientFrom="indigo.400" 
                        gradientTo="blue.300"
                        bgClip="text"
                    >
                        AISHA
                    </Heading>
                    <Text fontSize="2xl" fontWeight="bold" opacity={0.9}>
                        Student Attachment Placement System
                    </Text>
                    <Box 
                        px={4} 
                        py={1} 
                        borderRadius="full" 
                        bg="whiteAlpha.200" 
                        border="1px solid" 
                        borderColor="whiteAlpha.300"
                    >
                        <Text fontSize="sm" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                            Central Hub Deployment
                        </Text>
                    </Box>
                </VStack>

                <Box
                    display="grid"
                    gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                    gap={6}
                    w="full"
                >
                    {portals.map((portal) => (
                        <Card.Root
                            key={portal.title}
                            p={6}
                            cursor="pointer"
                            transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                            bg="whiteAlpha.100"
                            backdropFilter="blur(16px)"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            _hover={{
                                transform: 'translateY(-12px)',
                                bg: 'whiteAlpha.200',
                                borderColor: portal.color,
                                boxShadow: `0 20px 40px -10px var(--chakra-colors-${portal.color.split('.')[0]}-900)`
                            }}
                            onClick={() => navigate(portal.path)}
                        >
                            <Card.Body>
                                <VStack align="start" gap={5}>
                                    <Box
                                        p={4}
                                        borderRadius="2xl"
                                        bg={`${portal.color.split('.')[0]}.500`}
                                        boxShadow={`0 8px 16px -4px var(--chakra-colors-${portal.color.split('.')[0]}-500)`}
                                    >
                                        <Icon fontSize="3xl" color="white">
                                            <portal.icon />
                                        </Icon>
                                    </Box>

                                    <VStack align="start" gap={1}>
                                        <Heading size="md" color="white" fontWeight="black">
                                            {portal.title}
                                        </Heading>
                                        <Text fontSize="sm" color="whiteAlpha.700" fontWeight="medium" lineHeight="short">
                                            {portal.description}
                                        </Text>
                                    </VStack>

                                    <Button
                                        colorPalette={portal.color.split('.')[0]}
                                        variant="solid"
                                        w="full"
                                        borderRadius="xl"
                                        fontWeight="bold"
                                        mt={2}
                                        _hover={{
                                            transform: 'scale(1.05)',
                                        }}
                                    >
                                        Login to Portal
                                    </Button>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    ))}
                </Box>

                <HStack gap={10} pt={4}>
                    <Text fontSize="sm" color="whiteAlpha.600" fontWeight="bold">
                        © 2026 AISHA Intelligence
                    </Text>
                    <Box h="1px" w="100px" bg="whiteAlpha.300" />
                    <Text fontSize="sm" color="whiteAlpha.600" fontWeight="bold">
                        Secure AI Deployment
                    </Text>
                </HStack>
            </VStack>
        </Box>
    );
};

export default PortalSelector;
