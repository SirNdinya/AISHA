import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Flex,
    Table,
    Badge,
    Button,
    Input,
    Icon,
    HStack,
    VStack,
    IconButton,
    Spinner
} from '@chakra-ui/react';
import {
    Search,
    RefreshCw,
    ArrowRightLeft,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    ExternalLink
} from 'lucide-react';
import InstitutionService from '../../../services/institutionService';
import './AdminPortal.css';

const StudentSyncManager: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSyncStatus();
    }, []);

    const fetchSyncStatus = async () => {
        setIsLoading(true);
        try {
            const data = await InstitutionService.getSyncStatus();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch sync status", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncAll = async () => {
        setRefreshing(true);
        try {
            // Simulate/Trigger Global Sync if endpoint exists or just refresh status
            await fetchSyncStatus();
        } finally {
            setRefreshing(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        synced: students.filter(s => s.sync_status === 'SYNCED').length,
        pending: students.filter(s => s.sync_status === 'PENDING').length,
        failed: students.filter(s => s.sync_status === 'FAILED').length
    };

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={8}>
                <Box>
                    <Heading size="lg" fontWeight="bold" color="#F8FAFC">Student Profile Manager</Heading>
                    <Text color="var(--terminal-accent)">Autonomous synchronization with institutional records</Text>
                </Box>
                <HStack gap={4}>
                    <Button
                        bg="brand.50"
                        color="brand.600"
                        _hover={{ bg: "brand.100" }}
                        onClick={handleSyncAll}
                        loading={isRefreshing}
                    >
                        <Icon as={RefreshCw} className={isRefreshing ? "animate-spin" : ""} mr={2} />
                        Force Global Sync
                    </Button>
                </HStack>
            </Flex>

            {/* Filter Bar */}
            <Box className="glass-card" p={4} borderRadius="16px" mb={6}>
                <Flex gap={4}>
                    <Box maxW="400px" position="relative" display="flex" alignItems="center">
                        <Search color="gray" size={18} style={{ position: 'absolute', left: 12 }} />
                        <Input
                            pl={10}
                            placeholder="Search by name or admission number..."
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="var(--terminal-border)"
                            borderRadius="12px"
                            color="#F8FAFC"
                            _placeholder={{ color: "whiteAlpha.400" }}
                            _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Box>
                    <HStack gap={2}>
                        <Badge px={3} py={1} borderRadius="full" bg="teal.50" color="teal.600">Registered ({students.filter(s => s.registration_status === 'REGISTERED').length})</Badge>
                        <Badge px={3} py={1} borderRadius="full" bg="brand.50" color="brand.600">Synced ({stats.synced})</Badge>
                    </HStack>
                </Flex>
            </Box>

            {/* Students Table */}
            <Box className="glass-card" p={6} borderRadius="20px">
                {isLoading ? (
                    <Flex justify="center" py={20}><Spinner color="purple.400" /></Flex>
                ) : (
                    <Table.Root>
                        <Table.Header borderBottom="1px solid" borderColor="var(--terminal-border)">
                            <Table.Row>
                                <Table.ColumnHeader color="var(--terminal-accent)">Reg. Number</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">Full Name</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">Course / Year</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">Registration</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">Sync Status</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" textAlign="right">Actions</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredStudents.map((student, i) => (
                                <Table.Row key={i} _hover={{ bg: "whiteAlpha.50" }} transition="0.2s">
                                    <Table.Cell fontWeight="bold" color="#F8FAFC">{student.admission_number}</Table.Cell>
                                    <Table.Cell color="whiteAlpha.800">{student.full_name || `${student.first_name} ${student.last_name}`}</Table.Cell>
                                    <Table.Cell>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.900">{student.course_of_study}</Text>
                                            <Text fontSize="xs" color="whiteAlpha.600">Year {student.current_year || '?'}</Text>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={student.registration_status === 'REGISTERED' ? 'teal' : 'gray'}
                                            variant="subtle"
                                            size="sm"
                                        >
                                            {student.registration_status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex align="center" gap={2}>
                                            <Icon
                                                as={student.sync_status === 'SYNCED' ? CheckCircle2 : student.sync_status === 'FAILED' ? AlertCircle : RefreshCw}
                                                color={student.sync_status === 'SYNCED' ? "teal.500" : student.sync_status === 'FAILED' ? "red.500" : "gray.400"}
                                                boxSize={4}
                                            />
                                            <Text fontSize="xs" fontWeight="bold" color={student.sync_status ? 'whiteAlpha.900' : 'whiteAlpha.500'}>
                                                {student.sync_status || 'NOT SYNCED'}
                                            </Text>
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <IconButton
                                            aria-label="Show Analysis"
                                            size="sm"
                                            variant="ghost"
                                            color="whiteAlpha.600"
                                            _hover={{ color: "var(--terminal-accent)", bg: "whiteAlpha.100" }}
                                        >
                                            <ExternalLink size={16} />
                                        </IconButton>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Box>
    );
};

export default StudentSyncManager;
