
import React, { useEffect, useState } from 'react';
import {
    Box, Grid, Heading, Text, VStack, Card, Badge,
    Flex, Spinner, HStack, Icon, Separator, Button
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanyProfile, fetchCompanyOpportunities, fetchCompanyAnalytics } from '../../store/companySlice';
import type { AppDispatch, RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
    LuActivity, LuUsers, LuBriefcase,
    LuShield, LuArrowRight, LuZap, LuShieldCheck, LuBrainCircuit,
    LuCalendar, LuCheck, LuX
} from 'react-icons/lu';
import apiClient from '../../services/apiClient';
import { toaster } from '../../components/ui/toaster';

const CompanyDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { profile, opportunities, analytics, isLoading } = useSelector((state: RootState) => state.company);
    const { user } = useSelector((state: RootState) => state.auth);
    const [assessments, setAssessments] = useState<any[]>([]);

    const fetchAssessments = async () => {
        try {
            const res = await apiClient.get('/assessments');
            setAssessments(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        dispatch(fetchCompanyProfile());
        dispatch(fetchCompanyOpportunities());
        dispatch(fetchCompanyAnalytics());
        fetchAssessments();
    }, [dispatch]);

    const handleAssessmentAction = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/assessments/${id}/status`, { status });
            toaster.create({ title: `Assessment ${status}`, type: 'success' });
            fetchAssessments();
        } catch (error) {
            toaster.create({ title: 'Action failed', type: 'error' });
        }
    };

    if (isLoading && !analytics) {
        return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" color="blue.500" /></Flex>;
    }

    const activeOpps = opportunities.filter(o => o.status === 'OPEN');
    const totalApplicants = opportunities.reduce((acc, o) => acc + (o.applicant_count || 0), 0);

    return (
        <Box animation="fadeIn 0.8s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="3xl" fontWeight="black" letterSpacing="tight" color="white">
                        {profile ? profile.name : 'Corporate Hub'}
                    </Heading>
                    <HStack mt={2}>
                        <Text color="gray.400" fontSize="lg">Welcome back, {user?.firstName}. Operating from {profile?.location || 'Headquarters'}. System Status:</Text>
                        <Badge colorPalette="green" variant="subtle" px={3} borderRadius="full">STABLE</Badge>
                    </HStack>
                </Box>
                <HStack gap={4}>
                    <Button variant="outline" borderColor="whiteAlpha.200" color="white" rounded="full" size="sm">
                        <Icon as={LuShieldCheck} mr={2} /> Encrypted Session
                    </Button>
                </HStack>
            </Flex>

            {/* Top Metrics Grid */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6} mb={10}>
                {[
                    { label: 'Live Opportunties', val: activeOpps.length, icon: LuBriefcase, color: 'blue' },
                    { label: 'Total Applicants', val: totalApplicants, icon: LuUsers, color: 'purple' },
                    { label: 'Platform Usage', val: 'High', icon: LuActivity, color: 'cyan' },
                    { label: 'Active Placements', val: analytics?.active_placements || 0, icon: LuShield, color: 'teal' }
                ].map((stat, i) => (
                    <Card.Root key={i} className="glass-panel" border="1px solid" borderColor="whiteAlpha.100" bg="whiteAlpha.50">
                        <Card.Body py={6}>
                            <Flex justify="space-between" align="center">
                                <Box>
                                    <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="widest">{stat.label}</Text>
                                    <Heading size="2xl" mt={2} color="white">{stat.val}</Heading>
                                </Box>
                                <Icon as={stat.icon} boxSize={10} color={`${stat.color}.400`} opacity={0.3} />
                            </Flex>
                        </Card.Body>
                    </Card.Root>
                ))}
            </Grid>

            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={10}>
                {/* Operational Insights Section */}
                <VStack align="stretch" gap={8}>
                    <Card.Root className="glass-panel" bg="whiteAlpha.50" borderColor="whiteAlpha.100">
                        <Card.Body p={8}>
                            <Flex justify="space-between" align="center" mb={6}>
                                <Box>
                                    <Heading size="lg" color="white">Recent Activity</Heading>
                                    <Text fontSize="sm" color="gray.500">Summary of latest system interactions</Text>
                                </Box>
                                <Icon as={LuActivity} color="blue.400" boxSize={6} />
                            </Flex>
                            <VStack align="stretch" gap={4}>
                                {[
                                    { text: "New assessment submitted for John Doe", time: "2h ago" },
                                    { text: "Logbook entry verified for Jane Smith", time: "5h ago" },
                                    { text: "New internship opportunity posted", time: "Yesterday" }
                                ].map((act, i) => (
                                    <HStack key={i} justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="xl">
                                        <Text fontSize="sm" color="whiteAlpha.800">{act.text}</Text>
                                        <Text fontSize="xs" color="gray.500">{act.time}</Text>
                                    </HStack>
                                ))}
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root className="glass-panel" bg="whiteAlpha.50" borderColor="whiteAlpha.100">
                        <Card.Body p={8}>
                            <Flex justify="space-between" align="center" mb={6}>
                                <Heading size="lg" color="white">Assessment Coordination</Heading>
                                <Icon as={LuCalendar} color="purple.400" boxSize={6} />
                            </Flex>
                            <VStack align="stretch" gap={4}>
                                {assessments.length === 0 ? (
                                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>No pending site visit requests.</Text>
                                ) : assessments.map((assessment: any) => (
                                    <Box key={assessment.id} p={4} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor={assessment.status === 'PROPOSED' ? 'orange.500' : 'green.500'}>
                                        <HStack justify="space-between" mb={2}>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold" color="white">{assessment.placement?.first_name} {assessment.placement?.last_name}</Text>
                                                <Text fontSize="xs" color="gray.400">{assessment.institution?.name}</Text>
                                            </VStack>
                                            <Badge colorPalette={assessment.status === 'PROPOSED' ? 'orange' : 'green'}>{assessment.status}</Badge>
                                        </HStack>
                                        <Text fontSize="sm" color="whiteAlpha.800" mb={3}>
                                            Proposed Date: {new Date(assessment.proposed_date).toLocaleDateString()}
                                        </Text>
                                        {assessment.status === 'PROPOSED' && (
                                            <HStack>
                                                <Button size="xs" colorPalette="green" onClick={() => handleAssessmentAction(assessment.id, 'CONFIRMED')}><LuCheck /> Confirm</Button>
                                                <Button size="xs" colorPalette="red" variant="outline" onClick={() => handleAssessmentAction(assessment.id, 'CANCELED')}><LuX /> Reject</Button>
                                            </HStack>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </VStack>

                {/* System Insights Section */}
                <VStack align="stretch" gap={8}>
                    <Card.Root bg="blue.950" border="1px solid" borderColor="blue.500" borderRadius="3xl" overflow="hidden">
                        <Box p={8} position="relative">
                            <Icon as={LuBrainCircuit} position="absolute" right="-20px" top="-20px" boxSize="150px" opacity={0.05} color="blue.400" />
                            <HStack mb={6}>
                                <Icon as={LuZap} color="yellow.400" />
                                <Heading size="md" color="white" letterSpacing="widest">OPERATIONAL INSIGHTS</Heading>
                            </HStack>
                            <VStack align="stretch" gap={6}>
                                <Box bg="whiteAlpha.50" p={5} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                    <Text fontSize="sm" fontWeight="bold" color="blue.300">Pending Assessments</Text>
                                    <Text fontSize="xs" color="gray.400" mt={2}>You have 5 students awaiting final evaluation. Complete these to issue certificates.</Text>
                                    <Button size="xs" colorPalette="blue" mt={4} variant="solid" rounded="lg" onClick={() => navigate('/company/placements')}>Review Now</Button>
                                </Box>
                                <Box bg="whiteAlpha.50" p={5} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                    <Text fontSize="sm" fontWeight="bold" color="purple.300">Unread Student Messages</Text>
                                    <Text fontSize="xs" color="gray.400" mt={2}>3 candidates have responded to your interview invites.</Text>
                                </Box>
                                <Separator borderColor="whiteAlpha.100" />
                                <Button variant="ghost" color="whiteAlpha.800" size="sm" justifyContent="space-between" _hover={{ bg: 'whiteAlpha.100', color: 'white' }}>
                                    Full Operations Report <LuArrowRight />
                                </Button>
                            </VStack>
                        </Box>
                    </Card.Root>

                    <Box>
                        <Heading size="md" mb={6} color="whiteAlpha.800">Operational Quick-Nexus</Heading>
                        <VStack gap={4} align="stretch">
                            {opportunities.slice(0, 3).map(opp => (
                                <Card.Root
                                    key={opp.id}
                                    className="glass-panel"
                                    bg="whiteAlpha.50"
                                    borderColor="whiteAlpha.100"
                                    _hover={{ borderColor: 'blue.400', bg: 'whiteAlpha.100', transform: 'translateX(4px)' }}
                                    transition="0.3s"
                                    cursor="pointer"
                                    onClick={() => navigate(`/company/opportunities/${opp.id}/applicants`)}
                                >
                                    <Card.Body p={5}>
                                        <Flex justify="space-between" align="center">
                                            <VStack align="start" gap={1}>
                                                <Text fontWeight="bold" fontSize="sm" color="white">{opp.title}</Text>
                                                <Text fontSize="10px" color="gray.500" fontWeight="bold">ID: {opp.id.substring(0, 8)} | {opp.vacancies} VACANCIES REMAINING</Text>
                                            </VStack>
                                            <Badge colorPalette={opp.status === 'OPEN' ? 'green' : 'gray'} variant="solid" borderRadius="full" px={3}>{opp.status}</Badge>
                                        </Flex>
                                    </Card.Body>
                                </Card.Root>
                            ))}
                        </VStack>
                    </Box>
                </VStack>
            </Grid>
        </Box>
    );
};

export default CompanyDashboard;
