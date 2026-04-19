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

    if (isLoading) return <Flex h="50vh" align="center" justify="center"><Spinner color="brand.500" /></Flex>;

    const departments = analytics?.departments || [];
    const totalStudents = analytics?.overview?.total_enrolled || 0;
    const totalDepartments = analytics?.overview?.department_count || 0;

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="xl" fontWeight="black" letterSpacing="tight" color="#F8FAFC">Institutional Overview</Heading>
                    <Text color="var(--terminal-accent)" fontSize="md">Monitoring departmental nodes and database student populations.</Text>
                </Box>
                <Button
                    bg="var(--terminal-accent)"
                    color="black"
                    px={6}
                    h={12}
                    borderRadius="xl"
                    _hover={{ transform: "translateY(-2px)", shadow: "lg", bg: "var(--terminal-accent)", opacity: 0.9 }}
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
                        <Box p={3} borderRadius="15px" bg="whiteAlpha.100">
                            <Icon as={Building2} boxSize={6} color="var(--terminal-accent)" />
                        </Box>
                    </Flex>
                    <VStack align="start" gap={0}>
                        <Text color="whiteAlpha.600" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Total Departmental Nodes</Text>
                        <Heading size="3xl" fontWeight="black" color="#F8FAFC">{totalDepartments}</Heading>
                    </VStack>
                </Box>

                <Box className="glass-card" p={8} borderRadius="30px">
                    <Flex justify="space-between" align="center" mb={4}>
                        <Box p={3} borderRadius="15px" bg="whiteAlpha.100">
                            <Icon as={Users} boxSize={6} color="teal.300" />
                        </Box>
                    </Flex>
                    <VStack align="start" gap={0}>
                        <Text color="whiteAlpha.600" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Database Student Count</Text>
                        <Heading size="3xl" fontWeight="black" color="#F8FAFC">{totalStudents}</Heading>
                    </VStack>
                </Box>

                <Box className="glass-card" p={8} borderRadius="30px" border="1px dashed" borderColor="var(--terminal-border)">
                    <VStack h="full" justify="center" align="center" gap={4}>
                        <Icon as={BarChart3} boxSize={10} color="whiteAlpha.400" />
                        <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">Institutional Health is <Text as="span" color="var(--terminal-accent)" fontWeight="bold">Stable</Text><br/>All schema nodes are synced.</Text>
                    </VStack>
                </Box>
            </SimpleGrid>

            {/* Departmental Data Table */}
            <Box className="glass-card" p={8} borderRadius="30px">
                <Flex justify="space-between" align="center" mb={8}>
                    <VStack align="start" gap={1}>
                        <Heading size="md" color="#F8FAFC">Departmental Student Statistics</Heading>
                        <Text fontSize="xs" color="whiteAlpha.600">Live counts retrieved from institutional database schemas.</Text>
                    </VStack>
                    <Badge variant="subtle" colorPalette="cyan" px={3} py={1} borderRadius="full" bg="whiteAlpha.100" color="var(--terminal-accent)">
                        DATABASE SYNC: ACTIVE
                    </Badge>
                </Flex>

                <Table.Root variant="line" size="lg">
                    <Table.Header borderBottom="1px solid" borderColor="var(--terminal-border)">
                        <Table.Row>
                            <Table.ColumnHeader color="var(--terminal-accent)">NODE NAME</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)">DATABASE PIN</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" textAlign="center">STUDENT POPULATION</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" textAlign="right">MANAGEMENT</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {departments.map((dept: any, i: number) => (
                            <Table.Row key={i} _hover={{ bg: "whiteAlpha.50" }} transition="0.2s">
                                <Table.Cell py={6}>
                                    <HStack gap={4}>
                                        <Box p={2} borderRadius="10px" bg="whiteAlpha.100">
                                            <Icon as={Building2} boxSize={4} color="var(--terminal-accent)" />
                                        </Box>
                                        <Text fontWeight="bold" fontSize="md" color="#F8FAFC">{dept.name}</Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge colorPalette="gray" variant="outline" borderColor="whiteAlpha.200" color="whiteAlpha.700" letterSpacing="tighter">{dept.code}</Badge>
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                    <Text fontWeight="black" fontSize="lg" color="#F8FAFC">{dept.student_count}</Text>
                                    <Text fontSize="10px" color="whiteAlpha.600" mt={-1}>ENROLLED</Text>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="var(--terminal-accent)"
                                        _hover={{ bg: "whiteAlpha.100" }}
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
                        <Icon as={Search} boxSize={10} color="slate.600" />
                        <Text color="slate.600">No departmental nodes detected in the database.</Text>
                    </VStack>
                )}
            </Box>
        </Box>
    );
};

export default AnalyticsOverview;
