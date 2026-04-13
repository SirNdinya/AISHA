import React, { useState, useEffect } from 'react';
import {
    Box,
    SimpleGrid,
    Badge,
    VStack,
    Flex,
    Heading,
    Text,
    Icon,
    Table,
    Spinner,
    Button,
    HStack,
    Separator
} from '@chakra-ui/react';
import {
    Users,
    Building2,
    Plus,
    BarChart3,
    ArrowRight,
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InstitutionService from '../../../services/institutionService';
import './AdminPortal.css';

const AnalyticsOverview: React.FC = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await InstitutionService.getAnalytics();
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <Flex h="50vh" align="center" justify="center"><Spinner color="purple.400" /></Flex>;

    const departments = analytics?.departments || [];
    const totalStudents = analytics?.overview?.total_enrolled || 0;
    const totalDepartments = analytics?.overview?.department_count || 0;

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="xl" fontWeight="black" letterSpacing="tight">Institutional Overview</Heading>
                    <Text color="gray.500" fontSize="md">Monitoring departmental nodes and database student populations.</Text>
                </Box>
                <Button
                    bg="linear-gradient(135deg, #a78bfa 0%, #2dd4bf 100%)"
                    color="white"
                    px={6}
                    h={12}
                    borderRadius="xl"
                    _hover={{ transform: "translateY(-2px)", shadow: "0 10px 20px -10px rgba(167, 139, 250, 0.5)" }}
                    transition="all 0.2s"
                    onClick={() => navigate('/institution/departments')}
                >
                    <HStack gap={2}>
                        <Icon as={Plus} boxSize={5} />
                        <Text fontWeight="bold">Provision New Node</Text>
                    </HStack>
                </Button>
            </Flex>

            {/* Core Infrastructure Stats */}
            <SimpleGrid columns={[1, 1, 3]} gap={8} mb={10}>
                <Box className="glass-card" p={8} borderRadius="30px">
                    <Flex justify="space-between" align="center" mb={4}>
                        <Box p={3} borderRadius="15px" bg="rgba(167, 139, 250, 0.1)">
                            <Icon as={Building2} boxSize={6} color="purple.400" />
                        </Box>
                    </Flex>
                    <VStack align="start" gap={0}>
                        <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Total Departmental Nodes</Text>
                        <Heading size="3xl" fontWeight="black">{totalDepartments}</Heading>
                    </VStack>
                </Box>

                <Box className="glass-card" p={8} borderRadius="30px">
                    <Flex justify="space-between" align="center" mb={4}>
                        <Box p={3} borderRadius="15px" bg="rgba(45, 212, 191, 0.1)">
                            <Icon as={Users} boxSize={6} color="teal.400" />
                        </Box>
                    </Flex>
                    <VStack align="start" gap={0}>
                        <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Database Student Count</Text>
                        <Heading size="3xl" fontWeight="black">{totalStudents}</Heading>
                    </VStack>
                </Box>

                <Box className="glass-card" p={8} borderRadius="30px" border="1px dashed rgba(255,255,255,0.1)">
                    <VStack h="full" justify="center" align="center" gap={4}>
                        <Icon as={BarChart3} boxSize={10} color="gray.600" />
                        <Text color="gray.500" fontSize="sm" textAlign="center">Institutional Health is <b>Stable</b><br/>All schema nodes are synced.</Text>
                    </VStack>
                </Box>
            </SimpleGrid>

            {/* Departmental Data Table */}
            <Box className="glass-card" p={8} borderRadius="30px">
                <Flex justify="space-between" align="center" mb={8}>
                    <VStack align="start" gap={1}>
                        <Heading size="md">Departmental Student Statistics</Heading>
                        <Text fontSize="xs" color="gray.500">Live counts retrieved from institutional database schemas.</Text>
                    </VStack>
                    <Badge variant="subtle" colorPalette="purple" px={3} py={1} borderRadius="full">
                        DATABASE SYNC: ACTIVE
                    </Badge>
                </Flex>

                <Table.Root variant="line" size="lg">
                    <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                        <Table.Row>
                            <Table.ColumnHeader color="gray.500">NODE NAME</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">DATABASE PIN</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500" textAlign="center">STUDENT POPULATION</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500" textAlign="right">MANAGEMENT</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {departments.map((dept: any, i: number) => (
                            <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }} transition="0.2s">
                                <Table.Cell py={6}>
                                    <HStack gap={4}>
                                        <Box p={2} borderRadius="10px" bg="rgba(167, 139, 250, 0.05)">
                                            <Icon as={Building2} boxSize={4} color="purple.400" />
                                        </Box>
                                        <Text fontWeight="bold" fontSize="md">{dept.name}</Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge colorPalette="gray" variant="outline" letterSpacing="tighter">{dept.code}</Badge>
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                    <Text fontWeight="black" fontSize="lg" color="white">{dept.student_count}</Text>
                                    <Text fontSize="10px" color="gray.600" mt={-1}>ENROLLED</Text>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="purple.400"
                                        _hover={{ bg: "rgba(167, 139, 250, 0.1)" }}
                                        onClick={() => navigate('/institution/departments')}
                                    >
                                        <HStack gap={1}>
                                            <Text fontSize="xs">Configure Node</Text>
                                            <Icon as={ArrowRight} boxSize={3} />
                                        </HStack>
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>

                {departments.length === 0 && (
                    <VStack py={20} gap={4}>
                        <Icon as={Search} boxSize={10} color="gray.600" />
                        <Text color="gray.500">No departmental nodes detected in the database.</Text>
                    </VStack>
                )}
            </Box>
        </Box>
    );
};

export default AnalyticsOverview;
