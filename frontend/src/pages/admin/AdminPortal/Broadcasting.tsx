import React from 'react';
import { Box, Heading, Text, VStack, Container } from '@chakra-ui/react';
import './AdminPortal.css';

const DepartmentDashboard: React.FC = () => {
    return (
        <Box animation="fadeIn 0.5s ease-out" minH="80vh">
            <Container maxW="container.xl" py={10}>
                <VStack align="start" gap={6}>
                    <Box>
                        <Heading size="lg" fontWeight="bold">Departmental Dashboard</Heading>
                        <Text color="gray.500">Welcome to your department's management portal.</Text>
                    </Box>

                    <Box className="glass-card" p={8} borderRadius="20px" w="100%">
                        <VStack gap={4} align="center" justify="center" minH="400px">
                            <Heading size="md" color="whiteAlpha.800">No active broadcasts</Heading>
                            <Text color="gray.500">Use the Placement Hub to track and assess your students.</Text>
                        </VStack>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default DepartmentDashboard;
