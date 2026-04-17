
import React from 'react';
import { Box, VStack, Heading, Text, Flex, Icon, Avatar, Button, HStack, Separator } from '@chakra-ui/react';
import { User, Settings, Shield, LogOut, ChevronRight } from 'lucide-react';

const MobileProfile: React.FC = () => {
    return (
        <VStack gap={6} align="stretch">
            <Box textAlign="center" py={4}>
                <Avatar.Root size="2xl" mb={4} mx="auto" border="2px solid" borderColor="indigo.500">
                    <Avatar.Fallback name="Student Name" />
                </Avatar.Root>
                <Heading size="lg" fontWeight="black">Brian Ndinya</Heading>
                <Text color="gray.400" fontSize="sm">saps.std.2024.001</Text>
            </Box>

            <VStack gap={2} align="stretch">
                <MenuOption icon={User} label="Personal Information" />
                <MenuOption icon={Shield} label="Security & Password" />
                <MenuOption icon={Settings} label="Preferences" />
                <Separator my={2} borderColor="whiteAlpha.100" />
                <MenuOption icon={LogOut} label="Log Out" color="red.400" />
            </VStack>

            <Box p={6} borderRadius="2xl" bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.05)">
                <VStack align="start" gap={2}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="widest">SYSTEM STATUS</Text>
                    <HStack w="full" justify="space-between">
                        <Text fontSize="sm">Network Latency</Text>
                        <Badge colorPalette="green">Excellent</Badge>
                    </HStack>
                    <HStack w="full" justify="space-between">
                        <Text fontSize="sm">Build Version</Text>
                        <Text fontSize="xs" color="gray.600">v2.4.12-mobile</Text>
                    </HStack>
                </VStack>
            </Box>
        </VStack>
    );
};

const MenuOption = ({ icon, label, color = "white" }: any) => (
    <Flex p={4} bg="rgba(255,255,255,0.02)" borderRadius="xl" align="center" justify="space-between" cursor="pointer" _hover={{ bg: "whiteAlpha.100" }}>
        <HStack gap={3}>
            <Icon as={icon} color={color} boxSize={5} />
            <Text fontWeight="medium" color={color} fontSize="sm">{label}</Text>
        </HStack>
        <Icon as={ChevronRight} color="gray.600" />
    </Flex>
);

export default MobileProfile;
