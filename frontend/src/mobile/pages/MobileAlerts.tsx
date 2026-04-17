
import React from 'react';
import { Box, VStack, Heading, Text, Flex, Icon, Circle } from '@chakra-ui/react';
import { LuBell, LuInfo, LuCheckCircle, LuAlertTriangle } from 'react-icons/lu';

const MobileAlerts: React.FC = () => {
    return (
        <VStack gap={6} align="stretch">
            <Box>
                <Heading size="lg" fontWeight="black">Notifications</Heading>
                <Text color="gray.400" fontSize="sm">Stay updated with your activities.</Text>
            </Box>

            <VStack gap={4} align="stretch">
                <AlertItem 
                    icon={LuCheckCircle} 
                    color="green.400" 
                    title="Profile Verified" 
                    desc="Your academic records have been verified by MMUST." 
                    time="1h ago"
                />
                <AlertItem 
                    icon={LuInfo} 
                    color="blue.400" 
                    title="New Match" 
                    desc="A new high-priority match has been found for you." 
                    time="3h ago"
                />
                <AlertItem 
                    icon={LuAlertTriangle} 
                    color="yellow.400" 
                    title="Action Required" 
                    desc="Please upload your missing logbook entries for week 12." 
                    time="Yesterday"
                />
            </VStack>
        </VStack>
    );
};

const AlertItem = ({ icon, color, title, desc, time }: any) => (
    <Flex p={4} gap={4} borderRadius="2xl" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)">
        <Circle size="40px" bg="rgba(255,255,255,0.05)">
            <Icon as={icon} color={color} boxSize={5} />
        </Circle>
        <VStack align="start" gap={1} flex={1}>
            <Flex justify="space-between" w="full">
                <Text fontWeight="bold" fontSize="sm">{title}</Text>
                <Text fontSize="10px" color="gray.600">{time}</Text>
            </Flex>
            <Text fontSize="xs" color="gray.400">{desc}</Text>
        </VStack>
    </Flex>
);

export default MobileAlerts;
