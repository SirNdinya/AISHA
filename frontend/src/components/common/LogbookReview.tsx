import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, Text, Heading, Flex,
    Icon, Spinner, Badge, Button, Container,
    SimpleGrid, Grid, Textarea, Separator
} from '@chakra-ui/react';
import { Avatar } from '../ui/avatar';
import { LuTriangleAlert, LuCircleCheck, LuPen } from 'react-icons/lu';
import apiClient from '../../services/apiClient';
import { toaster } from '../../components/ui/toaster';

interface LogbookReviewProps {
    role: 'COMPANY' | 'INSTITUTION';
}

const LogbookReview: React.FC<LogbookReviewProps> = ({ role }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigning, setIsSigning] = useState(false);
    const [comments, setComments] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchEntries(selectedStudent);
        }
    }, [selectedStudent]);

    const fetchStudents = async () => {
        try {
            const res = await apiClient.get(role === 'COMPANY' ? '/placements/my-placements' : '/placements/all');
            const data = res.data.data;

            const uniqueStudents = data.map((p: any) => ({
                id: p.student_id,
                name: `${p.first_name} ${p.last_name}`,
                placement_id: p.id
            }));
            setStudents(uniqueStudents);
            if (uniqueStudents.length > 0) setSelectedStudent(uniqueStudents[0].id);
        } catch (error) {
            console.error('Fetch students error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEntries = async (studentId: string) => {
        setIsLoading(true);
        try {
            const student = students.find(s => s.id === studentId);
            const res = await apiClient.get(`/placements/logbook?placement_id=${student?.placement_id}`);
            setEntries(res.data.data);
            
            // Initialize empty comments for entries
            const initialComments: { [key: string]: string } = {};
            res.data.data.forEach((e: any) => {
                initialComments[e.id] = '';
            });
            setComments(initialComments);
        } catch (error) {
            console.error('Fetch entries error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignLogbook = async (logbookId: string) => {
        setIsSigning(true);
        try {
            await apiClient.post('/placements/logbook/sign', {
                logbook_id: logbookId,
                comments: comments[logbookId] || ''
            });
            toaster.create({ title: 'Logbook Signed Successfully', type: 'success' });
            if (selectedStudent) fetchEntries(selectedStudent);
        } catch (error: any) {
            toaster.create({ 
                title: 'Signature Failed', 
                description: error.response?.data?.message || 'An error occurred',
                type: 'error' 
            });
        } finally {
            setIsSigning(false);
        }
    };

    const canSign = (entry: any) => {
        if (role === 'COMPANY') return entry.status === 'PENDING_INDUSTRY';
        if (role === 'INSTITUTION') return entry.status === 'PENDING_UNIVERSITY';
        return false;
    };

    const formatDayDate = (startDate: string, offset: number) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + offset);
        return d.toLocaleDateString();
    };

    if (isLoading && students.length === 0) return <Flex h="60vh" align="center" justify="center"><Spinner color="purple.400" /></Flex>;

    return (
        <Box p={8}>
            <Container maxW="container.xl">
                <Flex justify="space-between" align="center" mb={10}>
                    <VStack align="start" gap={0}>
                        <Heading size="xl" color="white" fontWeight="black">Logbook Verification Hub</Heading>
                        <Text color="gray.500">Review and verify student weekly logbooks.</Text>
                    </VStack>
                    <HStack>
                        <Badge colorPalette="purple" variant="outline" size="sm">AGENT_MONITORING_ACTIVE</Badge>
                    </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 1, lg: 4 }} gap={8}>
                    {/* Student List */}
                    <Box gridColumn="span 1" className="glass-panel" p={6}>
                        <Heading size="xs" color="gray.500" mb={4} textTransform="uppercase">Active Placements</Heading>
                        <VStack align="stretch" gap={3}>
                            {students.map(s => (
                                <Box
                                    key={s.id}
                                    p={3}
                                    borderRadius="xl"
                                    bg={selectedStudent === s.id ? "whiteAlpha.100" : "transparent"}
                                    border="1px solid"
                                    borderColor={selectedStudent === s.id ? "purple.500" : "transparent"}
                                    cursor="pointer"
                                    onClick={() => setSelectedStudent(s.id)}
                                    _hover={{ bg: "whiteAlpha.50" }}
                                >
                                    <HStack gap={3}>
                                        <Avatar.Root size="xs">
                                            <Avatar.Fallback name={s.name} />
                                        </Avatar.Root>
                                        <Text fontSize="sm" fontWeight="bold" color="white" truncate>{s.name}</Text>
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    </Box>

                    {/* Entries View */}
                    <Box gridColumn={{ lg: "span 3" }}>
                        {selectedStudent ? (
                            <VStack gap={6} align="stretch">
                                {entries.length === 0 ? (
                                    <Box className="glass-panel" p={12} textAlign="center">
                                        <Text color="gray.500">No logbook data received from this transmitter.</Text>
                                    </Box>
                                ) : (
                                    entries.map(entry => {
                                        const isSignable = canSign(entry);
                                        return (
                                        <Box key={entry.id} className="glass-panel" p={0} overflow="hidden">
                                            {/* Header */}
                                            <Flex justify="space-between" align="center" p={4} bg="whiteAlpha.100" borderBottom="1px solid" borderColor="whiteAlpha.200">
                                                <HStack gap={4}>
                                                    <Box textAlign="center" minW="60px" p={2} bg="blackAlpha.300" borderRadius="md">
                                                        <Text fontSize="xs" color="gray.400" textTransform="uppercase">WEEK</Text>
                                                        <Text fontSize="lg" fontWeight="black" color="purple.400">{entry.week_number}</Text>
                                                    </Box>
                                                    <VStack align="start" gap={0}>
                                                        <Text fontWeight="bold" color="white" fontSize="sm">
                                                            {new Date(entry.start_date).toLocaleDateString()} - {new Date(entry.end_date).toLocaleDateString()}
                                                        </Text>
                                                        <Badge size="xs" colorPalette={entry.status === 'COMPLETED' ? 'green' : entry.status === 'DRAFT' ? 'gray' : 'orange'}>
                                                            {entry.status}
                                                        </Badge>
                                                    </VStack>
                                                </HStack>
                                            </Flex>

                                            <Box p={6}>
                                                {/* Week Days Table */}
                                                <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" mb={6} overflow="hidden">
                                                    <Grid templateColumns="100px 1fr" bg="blackAlpha.400" borderBottom="1px solid" borderColor="whiteAlpha.200" p={2}>
                                                        <Text fontSize="xs" fontWeight="bold" color="gray.400">DAY</Text>
                                                        <Text fontSize="xs" fontWeight="bold" color="gray.400">DESCRIPTION</Text>
                                                    </Grid>
                                                    {[
                                                        { day: 'Mon', key: 'monday_description', offset: 0 },
                                                        { day: 'Tue', key: 'tuesday_description', offset: 1 },
                                                        { day: 'Wed', key: 'wednesday_description', offset: 2 },
                                                        { day: 'Thu', key: 'thursday_description', offset: 3 },
                                                        { day: 'Fri', key: 'friday_description', offset: 4 },
                                                        { day: 'Sat', key: 'saturday_description', offset: 5 },
                                                    ].map((row, idx) => (
                                                        <Grid key={row.day} templateColumns="100px 1fr" borderBottom={idx < 5 ? "1px solid" : "none"} borderColor="whiteAlpha.100" bg="whiteAlpha.50">
                                                            <VStack align="start" p={3} borderRight="1px solid" borderColor="whiteAlpha.200">
                                                                <Text fontSize="sm" fontWeight="bold" color="gray.300">{row.day}</Text>
                                                                <Text fontSize="2xs" color="gray.500">{formatDayDate(entry.start_date, row.offset)}</Text>
                                                            </VStack>
                                                            <Box p={3}>
                                                                <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                                                                    {entry[row.key] || <Text as="span" fontStyle="italic" color="gray.500">No entry recorded.</Text>}
                                                                </Text>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Box>

                                                {/* Weekly Summary */}
                                                <Box mb={6}>
                                                    <Text fontSize="xs" fontWeight="bold" color="purple.400" mb={2}>TRAINEE'S WEEKLY REPORT & SUMMARY</Text>
                                                    <Box p={4} bg="blackAlpha.300" borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
                                                        <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                                                            {entry.weekly_summary || "No summary provided."}
                                                        </Text>
                                                    </Box>
                                                </Box>

                                                <Separator mb={6} borderColor="whiteAlpha.200" />

                                                {/* Signature Action Area */}
                                                <Box p={5} bg={isSignable ? "purple.900/20" : "blackAlpha.200"} borderRadius="lg" border="1px solid" borderColor={isSignable ? "purple.500/50" : "whiteAlpha.100"}>
                                                    <Heading size="sm" color={isSignable ? "purple.300" : "gray.400"} mb={4}>Supervisor Review</Heading>
                                                    
                                                    {/* Existing Comments */}
                                                    <VStack align="stretch" gap={3} mb={isSignable ? 4 : 0}>
                                                        {entry.industry_supervisor_comments && (
                                                            <Box p={3} bg="whiteAlpha.50" borderRadius="md">
                                                                <Text fontSize="xs" fontWeight="bold" color="blue.300" mb={1}>Industry Supervisor:</Text>
                                                                <Text fontSize="sm" color="gray.300">{entry.industry_supervisor_comments}</Text>
                                                            </Box>
                                                        )}
                                                        {entry.university_supervisor_comments && (
                                                            <Box p={3} bg="whiteAlpha.50" borderRadius="md">
                                                                <Text fontSize="xs" fontWeight="bold" color="purple.300" mb={1}>University Supervisor:</Text>
                                                                <Text fontSize="sm" color="gray.300">{entry.university_supervisor_comments}</Text>
                                                            </Box>
                                                        )}
                                                    </VStack>

                                                    {/* Sign Form */}
                                                    {isSignable && (
                                                        <VStack align="stretch" gap={3}>
                                                            <Textarea 
                                                                placeholder="Add your comments and feedback here before signing..."
                                                                value={comments[entry.id]}
                                                                onChange={(e) => setComments({...comments, [entry.id]: e.target.value})}
                                                                size="sm"
                                                                bg="blackAlpha.400"
                                                                borderColor="whiteAlpha.300"
                                                                _hover={{ borderColor: "purple.400" }}
                                                                _focus={{ borderColor: "purple.400", boxShadow: "none" }}
                                                                color="white"
                                                            />
                                                            <Flex justify="flex-end">
                                                                <Button 
                                                                    colorPalette="purple" 
                                                                    size="sm" 
                                                                    onClick={() => handleSignLogbook(entry.id)} 
                                                                    loading={isSigning}
                                                                >
                                                                    <LuPen /> Digitally Sign & Approve
                                                                </Button>
                                                            </Flex>
                                                        </VStack>
                                                    )}
                                                    
                                                    {!isSignable && (
                                                        <Flex align="center" justify="center" p={2}>
                                                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                                                {entry.status === 'COMPLETED' 
                                                                    ? "Logbook has been fully signed and approved." 
                                                                    : entry.status === 'DRAFT' 
                                                                        ? "Student has not submitted this logbook yet."
                                                                        : `Waiting on ${entry.status === 'PENDING_INDUSTRY' ? 'Industry' : 'University'} Supervisor to sign.`}
                                                            </Text>
                                                        </Flex>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    )})
                                )}
                            </VStack>
                        ) : (
                            <Flex h="40vh" align="center" justify="center" className="glass-panel">
                                <Text color="gray.500">Select a student terminal to begin verification.</Text>
                            </Flex>
                        )}
                    </Box>
                </SimpleGrid>
            </Container>
        </Box>
    );
};

export default LogbookReview;
