import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    GridItem,
    SimpleGrid,
    Badge,
    VStack,
    Flex,
    Heading,
    Text,
    Icon,
    Table,
    Spinner,
    AvatarRoot,
    AvatarFallback
} from '@chakra-ui/react';
import {
    Users,
    Briefcase,
    FileCheck,
    ArrowUpRight,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import InstitutionService from '../../../services/institutionService';
import './AdminPortal.css';

const AnalyticsOverview: React.FC = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [placements, setPlacements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsData, placementsData] = await Promise.all([
                    InstitutionService.getAnalytics(),
                    InstitutionService.getPlacements()
                ]);
                setAnalytics(analyticsData);
                setPlacements(placementsData);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <Flex h="50vh" align="center" justify="center"><Spinner color="purple.400" /></Flex>;

    const stats = [
        { label: 'Total Enrolled', value: analytics?.overview?.total_enrolled || 0, icon: Users, color: 'blue.400' },
        { label: 'Active Applications', value: analytics?.overview?.total_applications || 0, icon: Activity, color: 'teal.400' },
        { label: 'Placed Students', value: analytics?.overview?.success_placements || 0, icon: Briefcase, color: 'blue.500' },
        { label: 'Pending Offers', value: analytics?.overview?.pending_placements || 0, icon: FileCheck, color: 'cyan.400' },
    ];

    const pieData = (analytics?.departments || []).map((d: any, i: number) => ({
        name: d.name,
        value: parseInt(d.placed_count) || 0,
        color: ['#a78bfa', '#2dd4bf', '#f59e0b', '#ec4899'][i % 4]
    }));

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="flex-end" mb={8}>
                <Box>
                    <Heading size="lg" fontWeight="black" letterSpacing="tight">Institutional Dashboard</Heading>
                    <Text color="gray.500">System-wide monitoring of departmental data and placements.</Text>
                </Box>
            </Flex>

            {/* Stats Cards */}
            <SimpleGrid columns={[1, 2, 4]} gap={6} mb={8}>
                {stats.map((stat, i) => (
                    <Box key={i} className="glass-card stats-card-bg" p={6} borderRadius="20px">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Box p={2} borderRadius="12px" bg="rgba(167, 139, 250, 0.1)">
                                <Icon as={stat.icon} boxSize={6} color={stat.color} />
                            </Box>
                        </Flex>
                        <Box>
                            <Text color="gray.500" fontWeight="medium" fontSize="sm">{stat.label}</Text>
                            <Text fontSize="3xl" fontWeight="bold" color="white">{stat.value}</Text>
                        </Box>
                    </Box>
                ))}
            </SimpleGrid>

            <Grid templateColumns={["1fr", "1fr", "repeat(3, 1fr)"]} gap={6} mb={8}>
                <GridItem colSpan={2} className="glass-card" p={6} borderRadius="20px">
                    <Heading size="md" mb={6}>Placements by Department</Heading>
                    <Box h="300px" w="full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.departments || []}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3182ce" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="code" stroke="rgba(255,255,255,0.3)" fontSize={12} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(13, 17, 23, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="placed_count" stroke="#a78bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </GridItem>

                <GridItem colSpan={1} className="glass-card" p={6} borderRadius="20px">
                    <Heading size="md" mb={6}>Placement Success</Heading>
                    <Box h="200px" display="flex" alignItems="center" justifyContent="center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                    <VStack align="stretch" gap={2} mt={4}>
                        {pieData.map((item: any) => (
                            <Flex key={item.name} justify="space-between" align="center" fontSize="sm">
                                <Flex align="center" gap={2}>
                                    <Box w="10px" h="10px" borderRadius="full" bg={item.color} />
                                    <Text color="gray.400" truncate maxW="150px">{item.name}</Text>
                                </Flex>
                                <Text fontWeight="bold">{item.value}</Text>
                            </Flex>
                        ))}
                    </VStack>
                </GridItem>
            </Grid>

            {/* Recent Placements Table */}
            <Box className="glass-card" p={6} borderRadius="20px">
                <Flex justify="space-between" align="center" mb={6}>
                    <Heading size="md">Live Placement Feed</Heading>
                    <Badge colorPalette="teal" variant="outline" borderRadius="full" px={3}>
                        Live Data
                    </Badge>
                </Flex>
                <Table.Root size="sm">
                    <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                        <Table.Row>
                            <Table.ColumnHeader color="gray.500">Student</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">Company</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">Role</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500" textAlign="right">Status</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {placements.slice(0, 10).map((p, i) => (
                            <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }} transition="0.2s">
                                <Table.Cell py={4}>
                                    <Flex align="center" gap={3}>
                                        <AvatarRoot size="xs">
                                            <AvatarFallback name={`${p.first_name} ${p.last_name}`} />
                                        </AvatarRoot>
                                        <Text fontWeight="medium">{p.first_name} {p.last_name}</Text>
                                    </Flex>
                                </Table.Cell>
                                <Table.Cell color="gray.400">{p.company_name}</Table.Cell>
                                <Table.Cell color="gray.400">{p.role}</Table.Cell>
                                <Table.Cell textAlign="right">
                                    <Badge
                                        colorPalette={p.status === 'ACCEPTED' ? 'teal' : p.status === 'OFFERED' ? 'purple' : 'gray'}
                                        variant="subtle"
                                        borderRadius="full"
                                        fontSize="10px"
                                        px={2}
                                    >
                                        {p.status}
                                    </Badge>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>
    );
};

export default AnalyticsOverview;
