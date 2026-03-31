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
                    <Heading size="lg" fontWeight="bold">Student Profile Manager</Heading>
                    <Text color="gray.500">Autonomous synchronization with institutional records</Text>
                </Box>
                <HStack gap={4}>
                    <Button
                        bg="rgba(167, 139, 250, 0.2)"
                        color="#a78bfa"
                        _hover={{ bg: "rgba(167, 139, 250, 0.3)" }}
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
                            bg="rgba(255,255,255,0.05)"
                            border="none"
                            borderRadius="12px"
                            _focus={{ bg: "rgba(255,255,255,0.08)", ring: 1, ringColor: "purple.400" }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Box>
                    <HStack gap={2}>
                        <Badge px={3} py={1} borderRadius="full" bg="rgba(45, 212, 191, 0.1)" color="teal.400">Registered ({students.filter(s => s.registration_status === 'REGISTERED').length})</Badge>
                        <Badge px={3} py={1} borderRadius="full" bg="rgba(167, 139, 250, 0.1)" color="purple.400">Synced ({stats.synced})</Badge>
                    </HStack>
                </Flex>
            </Box>

            {/* Students Table */}
            <Box className="glass-card" p={6} borderRadius="20px">
                {isLoading ? (
                    <Flex justify="center" py={20}><Spinner color="purple.400" /></Flex>
                ) : (
                    <Table.Root>
                        <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.Row>
                                <Table.ColumnHeader color="gray.500">Reg. Number</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Full Name</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Course / Year</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Registration</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Sync Status</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500" textAlign="right">Actions</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredStudents.map((student, i) => (
                                <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }} transition="0.2s">
                                    <Table.Cell fontWeight="bold" color="gray.300">{student.admission_number}</Table.Cell>
                                    <Table.Cell>{student.full_name || `${student.first_name} ${student.last_name}`}</Table.Cell>
                                    <Table.Cell>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="sm" fontWeight="medium">{student.course_of_study}</Text>
                                            <Text fontSize="xs" color="gray.500">Year {student.current_year || '?'}</Text>
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
                                                color={student.sync_status === 'SYNCED' ? "teal.400" : student.sync_status === 'FAILED' ? "red.400" : "rgba(255,255,255,0.2)"}
                                                boxSize={4}
                                            />
                                            <Text fontSize="xs" fontWeight="bold" color={student.sync_status ? 'white' : 'gray.600'}>
                                                {student.sync_status || 'NOT SYNCED'}
                                            </Text>
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <IconButton
                                            aria-label="View Details"
                                            size="sm"
                                            variant="ghost"
                                            color="gray.400"
                                            _hover={{ color: "purple.400", bg: "rgba(167, 139, 250, 0.1)" }}
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
