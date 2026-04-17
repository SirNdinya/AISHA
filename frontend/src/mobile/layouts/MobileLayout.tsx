
import React from 'react';
import { Box, Flex, VStack, Text, Heading, Icon, Container, HStack } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, User, Bell, Menu, Rocket } from 'lucide-react';

const MobileLayout: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box minH="100vh" bg="#0a0b14" color="white" display="flex" flexDirection="column">
            {/* Header */}
            <Flex h="60px" px={4} align="center" justify="space-between" borderBottom="1px solid rgba(255,255,255,0.05)" position="sticky" top={0} zIndex={10} bg="rgba(10, 11, 20, 0.8)" backdropFilter="blur(16px)">
                <HStack gap={2}>
                    <Icon as={Rocket} boxSize={5} color="indigo.400" />
                    <Heading size="sm" fontWeight="black">AISHA GO</Heading>
                </HStack>
                <Icon as={Bell} boxSize={5} />
            </Flex>

            {/* Main Content */}
            <Box flex={1} overflowY="auto" pb="80px">
                <Container maxW="full" py={4}>
                    <Outlet />
                </Container>
            </Box>

            {/* Bottom Tab Bar */}
            <Flex h="70px" bg="rgba(255, 255, 255, 0.03)" backdropFilter="blur(24px)" borderTop="1px solid rgba(255,255,255,0.05)" position="fixed" bottom={0} left={0} right={0} justify="space-around" align="center" px={4} zIndex={10}>
                <TabItem icon={Home} label="Home" onClick={() => navigate('/mobile/dashboard')} isActive />
                <TabItem icon={Rocket} label="Matches" onClick={() => navigate('/mobile/matches')} />
                <TabItem icon={Bell} label="Alerts" onClick={() => navigate('/mobile/alerts')} />
                <TabItem icon={User} label="Profile" onClick={() => navigate('/mobile/profile')} />
            </Flex>
        </Box>
    );
};

const TabItem = ({ icon, label, onClick, isActive = false }: any) => (
    <VStack gap={1} onClick={onClick} cursor="pointer" opacity={isActive ? 1 : 0.5} transition="0.2s">
        <Icon as={icon} boxSize={5} color={isActive ? "indigo.400" : "white"} />
        <Text fontSize="10px" fontWeight="bold">{label}</Text>
    </VStack>
);

export default MobileLayout;
