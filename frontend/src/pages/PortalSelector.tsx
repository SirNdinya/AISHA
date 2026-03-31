import React from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Card, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaBuilding, FaUniversity } from 'react-icons/fa';

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
        color: 'blue.500',
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
    }
];

const PortalSelector: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box
            minH="100vh"
            bg="gray.50"
            _dark={{ bg: 'gray.900' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={8}
        >
            <VStack gap={8} maxW="1200px" w="full">
                <VStack gap={2} textAlign="center">
                    <Heading size="2xl" color="blue.600" _dark={{ color: 'blue.400' }}>
                        AISHA
                    </Heading>
                    <Text fontSize="xl" color="gray.600" _dark={{ color: 'gray.400' }}>
                        Student Attachment Placement System
                    </Text>
                    <Text fontSize="md" color="gray.500" _dark={{ color: 'gray.500' }}>
                        Select your portal to continue
                    </Text>
                </VStack>

                <Box
                    display="grid"
                    gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                    gap={6}
                    w="full"
                >
                    {portals.map((portal) => (
                        <Card.Root
                            key={portal.title}
                            p={6}
                            cursor="pointer"
                            transition="all 0.3s"
                            _hover={{
                                transform: 'translateY(-4px)',
                                shadow: 'xl',
                                borderColor: portal.color
                            }}
                            borderWidth="2px"
                            borderColor="transparent"
                            onClick={() => navigate(portal.path)}
                        >
                            <Card.Body>
                                <VStack align="start" gap={4}>
                                    <HStack gap={3}>
                                        <Box
                                            p={3}
                                            borderRadius="lg"
                                            bg={`${portal.color.split('.')[0]}.100`}
                                            _dark={{ bg: `${portal.color.split('.')[0]}.900` }}
                                        >
                                            <Icon fontSize="2xl" color={portal.color}>
                                                <portal.icon />
                                            </Icon>
                                        </Box>
                                        <Heading size="lg">{portal.title}</Heading>
                                    </HStack>

                                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                                        {portal.description}
                                    </Text>

                                    <Box w="full" pt={2}>
                                        <Button
                                            colorPalette={portal.color.split('.')[0]}
                                            w="full"
                                            size="lg"
                                        >
                                            Access Portal
                                        </Button>
                                    </Box>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    ))}
                </Box>

                <Text fontSize="sm" color="gray.500" textAlign="center">
                    © 2026 AISHA - Powered by AI & Blockchain Technology
                </Text>
            </VStack>
        </Box>
    );
};

export default PortalSelector;
