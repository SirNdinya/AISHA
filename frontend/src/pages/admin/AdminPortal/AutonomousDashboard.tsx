import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    SimpleGrid,
    Badge,
    Icon,
    Table,
    Button,
    VStack,
    HStack,
    Spinner
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../store';
import InstitutionService from '../../../services/institutionService';
import {
    Users,
    Briefcase,
    FileCheck,
    BarChart,
    Activity,
    Shield,
    MessageSquare
} from 'lucide-react';
import './AdminPortal.css';

const AutonomousDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [placements, setPlacements] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [statsData, placementsData, studentsData] = await Promise.all([
                    InstitutionService.getStats(),
                    InstitutionService.getPlacements(),
                    InstitutionService.getStudents()
                ]);
                setStats(statsData);
                setPlacements(placementsData.slice(0, 5));
                setStudents(studentsData.data.slice(0, 5));
            } catch (error) {
                console.error("Dashboard load failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboard();
    }, [user]);

    if (isLoading) return <Flex h="50vh" align="center" justify="center"><Spinner color="purple.400" /></Flex>;

    return (
        <Box animation="slideUp 0.6s ease-out">
            {/* AI Welcome Header */}
            <Box
                className="glass-card"
                p={8}
                mb={8}
                borderRadius="24px"
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)"
                border="1px solid"
                borderColor="whiteAlpha.100"
            >
                <Flex direction={["column", "row"]} justify="space-between" align={["flex-start", "center"]} gap={6}>
                    <VStack align="flex-start" gap={1}>
                        <HStack>
                            <Icon as={Shield} color="blue.400" boxSize={5} />
                            <Badge colorScheme="blue" variant="subtle" borderRadius="full">Departmental Portal</Badge>
                        </HStack>
                        <Heading size="xl" fontWeight="black" letterSpacing="tight">
                            {stats?.departments?.[0]?.name ? `${stats.departments[0].name} Administration` : 'Department Administration'}
                        </Heading>
                        <Text color="gray.500">System management of student placements and evaluations for {stats?.departments?.[0]?.name || 'the department'}.</Text>
                    </VStack>
                    <Button
                        variant="outline"
                        borderColor="whiteAlpha.300"
                        color="white"
                        _hover={{ bg: "whiteAlpha.100" }}
                        borderRadius="xl"
                        px={6}
                        onClick={() => window.location.href = '/admin/chat'}
                    >
                        <Icon as={MessageSquare} mr={2} /> Support Chat
                    </Button>
                </Flex>
            </Box>

            {/* Department Specific Stats */}
            <SimpleGrid columns={[1, 2, 4]} gap={6} mb={8}>
                {[
                    { label: 'Total Students', value: stats?.overview?.total_enrolled || 0, icon: Users, color: 'blue.400' },
                    { label: 'Active Placements', value: stats?.overview?.success_placements || 0, icon: Briefcase, color: 'teal.400' },
                    { label: 'System Health', value: '100%', icon: Activity, color: 'green.400' },
                    { label: 'Pending Offers', value: stats?.overview?.pending_placements || 0, icon: FileCheck, color: 'blue.300' },
                ].map((stat, i) => (
                    <Box key={i} className="glass-card" p={6} borderRadius="20px">
                        <Flex align="center" gap={4}>
                            <Box p={3} borderRadius="15px" bg="rgba(167, 139, 250, 0.1)">
                                <Icon as={stat.icon} boxSize={6} color={stat.color} />
                            </Box>
                            <VStack align="flex-start" gap={0}>
                                <Text fontSize="xs" color="gray.500" fontWeight="medium">{stat.label}</Text>
                                <Text fontSize="2xl" fontWeight="bold">{stat.value}</Text>
                            </VStack>
                        </Flex>
                    </Box>
                ))}
            </SimpleGrid>

            {/* Data Nexus: Placements & Documents */}
            <SimpleGrid columns={[1, 1, 2]} gap={8}>
                {/* Placement Feed */}
                <Box className="glass-card" p={8} borderRadius="30px">
                    <Flex justify="space-between" align="center" mb={8}>
                        <VStack align="start" gap={0}>
                            <Heading size="md">Placement Management</Heading>
                            <Text fontSize="xs" color="gray.500">Real-time status of student opportunities</Text>
                        </VStack>
                        <Button variant="ghost" size="sm" color="blue.400" onClick={() => window.location.href = '/department/placements'}>View All</Button>
                    </Flex>

                    <Table.Root size="sm">
                        <Table.Header>
                            <Table.Row borderBottom="1px solid rgba(255,255,255,0.05)">
                                <Table.ColumnHeader color="gray.500">STUDENT</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">STATUS</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {placements.map((p, i) => (
                                <Table.Row key={i}>
                                    <Table.Cell py={4}>
                                        <Text fontWeight="bold" fontSize="sm">{p.first_name} {p.last_name}</Text>
                                        <Text fontSize="10px" color="gray.500">{p.company_name}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={p.status === 'ACCEPTED' ? 'teal' : 'purple'}
                                            variant="subtle"
                                            size="sm"
                                        >
                                            {p.status}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>

                {/* Document Hub Quick View */}
                <Box
                    className="glass-card"
                    p={8}
                    borderRadius="30px"
                    bg="linear-gradient(135deg, rgba(167, 139, 250, 0.05) 0%, rgba(45, 212, 191, 0.05) 100%)"
                >
                    <Flex justify="space-between" align="center" mb={8}>
                        <VStack align="start" gap={0}>
                            <Heading size="md">Document Hub</Heading>
                            <Text fontSize="xs" color="gray.500">Compliance and fulfillment status</Text>
                        </VStack>
                        <Button variant="ghost" size="sm" color="teal.400" onClick={() => window.location.href = '/department/documents'}>Manage Hub</Button>
                    </Flex>

                    <VStack gap={4} align="stretch">
                        <Box p={5} borderRadius="20px" bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.05)">
                            <Flex justify="space-between" align="center">
                                <HStack gap={3}>
                                    <Icon as={FileCheck} color="teal.400" />
                                    <Text fontWeight="medium">Standard Templates</Text>
                                </HStack>
                                <Badge colorPalette="teal">4 ACTIVE</Badge>
                            </Flex>
                        </Box>

                        <Box p={5} borderRadius="20px" bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.05)">
                            <Flex justify="space-between" align="center">
                                <HStack gap={3}>
                                    <Icon as={BarChart} color="blue.400" />
                                    <Text fontWeight="medium">Daily Progress</Text>
                                </HStack>
                                <Text fontWeight="bold">12 Entries</Text>
                            </Flex>
                        </Box>

                        <Button
                            mt={4}
                            h={14}
                            borderRadius="2xl"
                            bg="white"
                            color="black"
                            _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                            onClick={() => window.location.href = '/department/documents'}
                        >
                            Generate Manual Endorsement
                        </Button>
                    </VStack>
                </Box>
            </SimpleGrid>

            {/* Department Students List */}
            <Box className="glass-card" p={8} borderRadius="30px" mt={8}>
                <Flex justify="space-between" align="center" mb={6}>
                    <VStack align="start" gap={0}>
                        <Heading size="md">Local Student Node</Heading>
                        <Text fontSize="xs" color="gray.500">Administrators view of departmental enrollment</Text>
                    </VStack>
                    <Button variant="outline" size="sm" borderColor="whiteAlpha.200" onClick={() => window.location.href = '/department/students'}>Full Node View</Button>
                </Flex>

                <Table.Root variant="line" size="sm">
                    <Table.Header>
                        <Table.Row borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.ColumnHeader color="gray.500">STUDENT</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">ADMISSION #</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">COURSE</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">SYNC</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {students.length > 0 ? students.map((s, i) => (
                            <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }}>
                                <Table.Cell py={3}>
                                    <Text fontWeight="bold" fontSize="sm">{s.first_name} {s.last_name}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="xs" color="gray.400">{s.admission_number}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="xs">{s.course_of_study}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge colorPalette={s.sync_status === 'SYNCED' ? 'green' : 'orange'} size="sm" variant="subtle">
                                        {s.sync_status}
                                    </Badge>
                                </Table.Cell>
                            </Table.Row>
                        )) : (
                            <Table.Row>
                                <Table.Cell colSpan={4} textAlign="center" py={10}>
                                    <Text color="gray.500">No students found in this node.</Text>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>
    );
};

export default AutonomousDashboard;
