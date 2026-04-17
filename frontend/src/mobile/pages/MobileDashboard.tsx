
import React from 'react';
import { Box, VStack, Heading, Text, SimpleGrid, Card, Icon, Flex, Badge } from '@chakra-ui/react';
import { LuZap, LuClock, LuCheckCircle, LuStar } from 'react-icons/lu';

const MobileDashboard: React.FC = () => {
    return (
        <VStack gap={6} align="stretch" py={2}>
            <Box>
                <Heading size="lg" fontWeight="black" mb={1}>Welcome, Student</Heading>
                <Text color="gray.400" fontSize="sm">Your AI-powered career journey starts here.</Text>
            </Box>

            {/* Quick Stats */}
            <SimpleGrid columns={2} gap={4}>
                <StatCard icon={LuStar} label="AI Score" value="84%" color="purple.400" />
                <StatCard icon={LuZap} label="Matches" value="12" color="teal.400" />
            </SimpleGrid>

            {/* Main Action Card */}
            <Card.Root bg="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" border="none" p={6} borderRadius="2xl" boxShadow="0 20px 40px rgba(79, 70, 229, 0.3)">
                <VStack align="start" gap={4}>
                    <Badge colorPalette="white" variant="subtle" borderRadius="full" px={3}>URGENT</Badge>
                    <Heading size="md" color="white" fontWeight="bold">Transcript Analysis Ready</Heading>
                    <Text color="whiteAlpha.800" fontSize="sm">Our AI has identified 4 high-value opportunities based on your latest results.</Text>
                    <Flex w="full" bg="whiteAlpha.200" py={3} borderRadius="xl" justify="center" align="center" cursor="pointer" _hover={{ bg: "whiteAlpha.300" }}>
                        <Text fontWeight="bold" fontSize="sm" color="white">VIEW ANALYSIS</Text>
                    </Flex>
                </VStack>
            </Card.Root>

            {/* Recent Activity */}
            <VStack align="stretch" gap={4}>
                <Heading size="sm" fontWeight="bold">Recent Updates</Heading>
                <ActivityItem icon={LuCheckCircle} title="Application Viewed" time="2h ago" desc="TechFlow Inc. viewed your profile." />
                <ActivityItem icon={LuClock} title="Deadline Approaching" time="5h ago" desc="FinTech Hub posting expires in 4 days." />
            </VStack>
        </VStack>
    );
};

const StatCard = ({ icon, label, value, color }: any) => (
    <Card.Root bg="rgba(255, 255, 255, 0.03)" border="1px solid rgba(255,255,255,0.05)" p={4} borderRadius="xl">
        <Icon as={icon} color={color} boxSize={5} mb={2} />
        <Text fontSize="2xl" fontWeight="black" color="white">{value}</Text>
        <Text fontSize="xs" color="gray.500">{label}</Text>
    </Card.Root>
);

const ActivityItem = ({ icon, title, time, desc }: any) => (
    <Flex gap={4} p={4} bg="rgba(255,255,255,0.02)" borderRadius="xl" border="1px solid rgba(255,255,255,0.05)">
        <Box p={2} borderRadius="lg" bg="rgba(255,255,255,0.05)">
            <Icon as={icon} boxSize={5} color="gray.400" />
        </Box>
        <VStack align="start" gap={0} flex={1}>
            <Flex justify="space-between" w="full">
                <Text fontWeight="bold" fontSize="sm">{title}</Text>
                <Text fontSize="10px" color="gray.600">{time}</Text>
            </Flex>
            <Text fontSize="xs" color="gray.400" lineClamp={1}>{desc}</Text>
        </VStack>
    </Flex>
);

export default MobileDashboard;
