import React from 'react';
import { Box, Flex, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { Link, Outlet } from 'react-router-dom';

// Public Landing Page Component
export const LandingPage: React.FC = () => {
    return (
        <Flex direction="column" minH="100vh" bg="brand.900" color="white" justify="center" align="center" px={4}>
            <VStack gap={8} textAlign="center" maxW="800px">
                <Box>
                    <Heading size="4xl" mb={4} letterSpacing="tight">AISHA</Heading>
                    <Text fontSize="2xl" color="brand.100" fontWeight="medium">
                        The Intelligent Student Acceptance & Placement System
                    </Text>
                    <Text mt={6} color="brand.200" fontSize="lg" opacity={0.8}>
                        Streamlining internships and attachments through AI-driven matching and secure management.
                    </Text>
                </Box>

                <Flex gap={6} mt={8}>
                    <Link to="/login">
                        <Button colorPalette="blue" size="xl" variant="solid" px={12} h="60px" fontSize="lg">
                            Get Started
                        </Button>
                    </Link>
                </Flex>

                <Box mt={12} pt={12} borderTop="1px solid" borderColor="whiteAlpha.200" w="full">
                    <Flex gap={12} justify="center" opacity={0.6} fontSize="sm">
                        <Text>Students</Text>
                        <Text>Companies</Text>
                        <Text>Institutions</Text>
                    </Flex>
                </Box>
            </VStack>
        </Flex>
    );
};

// Simple Layout for Public Pages (About, etc)
const PublicLayout: React.FC = () => {
    return (
        <Box>
            <Outlet />
        </Box>
    );
};

export default PublicLayout;
