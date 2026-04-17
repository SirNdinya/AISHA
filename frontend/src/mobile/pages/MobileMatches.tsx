
import { Box, VStack, Heading, Text, Flex, Icon, Badge, Button, HStack } from '@chakra-ui/react';
import { Building2, MapPin, Briefcase } from 'lucide-react';

const MobileMatches: React.FC = () => {
    return (
        <VStack gap={6} align="stretch">
            <Box>
                <Heading size="lg" fontWeight="black">Career Matches</Heading>
                <Text color="gray.400" fontSize="sm">AI-curated opportunities for you.</Text>
            </Box>

            <VStack gap={4}>
                <MatchCard 
                    company="CloudScale AI" 
                    role="Frontend Intern" 
                    location="Nairobi (Remote)" 
                    match="98%"
                />
                <MatchCard 
                    company="DataFlow" 
                    role="Data Analyst" 
                    location="Mombasa" 
                    match="92%"
                />
                <MatchCard 
                    company="Nexus Tech" 
                    role="Software Engineer" 
                    location="Nairobi" 
                    match="85%"
                />
            </VStack>
        </VStack>
    );
};

const MatchCard = ({ company, role, location, match }: any) => (
    <Box p={5} bg="rgba(255,255,255,0.03)" borderRadius="2xl" border="1px solid rgba(255,255,255,0.05)">
        <Flex justify="space-between" align="start" mb={4}>
            <VStack align="start" gap={1}>
                <Heading size="sm" color="white">{role}</Heading>
                <HStack gap={2}>
                    <Icon as={Building2} boxSize={3} color="gray.500" />
                    <Text fontSize="xs" color="gray.400">{company}</Text>
                </HStack>
            </VStack>
            <Badge colorPalette="purple" variant="outline" borderRadius="full">{match} Match</Badge>
        </Flex>
        <VStack align="stretch" gap={3}>
            <HStack gap={4}>
                <HStack gap={1}>
                    <Icon as={MapPin} boxSize={3} color="gray.500" />
                    <Text fontSize="10px" color="gray.500">{location}</Text>
                </HStack>
                <HStack gap={1}>
                    <Icon as={Briefcase} boxSize={3} color="gray.500" />
                    <Text fontSize="10px" color="gray.500">Full-time</Text>
                </HStack>
            </HStack>
            <Button w="full" colorPalette="indigo" size="sm" mt={2} borderRadius="xl">Quick Apply</Button>
        </VStack>
    </Box>
);

export default MobileMatches;
