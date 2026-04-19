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
    LuActivity, LuBriefcase,
    LuShield, LuZap, LuBrainCircuit,
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
        return <Flex h="100vh" align="center" justify="center" bg="var(--terminal-bg)"><Spinner size="xl" color="var(--terminal-accent)" /></Flex>;
    }

    const activeOpps = opportunities.filter(o => o.status === 'OPEN');

    return (
        <Box animation="fadeIn 0.8s ease-out">
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4} mb={10}>
                <Box>
                    <Heading size={{ base: "xl", md: "3xl" }} fontWeight="black" letterSpacing="tight" color="#F8FAFC">
                        {profile ? profile.name : 'Corporate Hub'}
                    </Heading>
                    <HStack mt={2}>
                        <Text color="var(--terminal-accent)" fontSize={{ base: "md", md: "lg" }} fontWeight="bold">Welcome back, {user?.firstName}. Operating from {profile?.address || 'Headquarters'}.</Text>
                    </HStack>
                </Box>
                <HStack gap={4}>

                </HStack>
            </Flex>

            {/* Top Metrics Grid */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={10}>
                {[
                    { label: 'Active Opportunities', val: activeOpps.length, icon: LuBriefcase, color: 'orange' },
                    { label: 'Active Placements', val: analytics?.active_placements || 0, icon: LuShield, color: 'teal' }
                ].map((stat, i) => (
                    <Card.Root 
                        key={i} 
                        className="glass-panel" 
                        border="1px solid" 
                        bg="var(--terminal-card)"
                        borderColor="var(--terminal-border)"
                        cursor="default"
                        _hover={{}}
                        transition="all 0.2s"
                    >
                        <Card.Body py={6}>
                            <Flex justify="space-between" align="center">
                                <Box>
                                    <Text fontSize="xs" color="var(--terminal-accent)" fontWeight="bold" letterSpacing="widest">{stat.label}</Text>
                                    <Heading size="2xl" mt={2} color="#F8FAFC">{stat.val}</Heading>
                                </Box>
                                <Icon as={stat.icon} boxSize={10} color={`${stat.color}.400`} opacity={0.3} />
                            </Flex>
                        </Card.Body>
                    </Card.Root>
                ))}
            </Grid>

            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={{ base: 6, lg: 10 }}>
                {/* Operational Insights Section */}
                <VStack align="stretch" gap={8}>
                    <Card.Root className="terminal-card" bg="var(--terminal-card)" borderColor="var(--terminal-border)">
                        <Card.Body p={8}>
                            <Flex direction={{ base: "row", sm: "row" }} justify="space-between" align="center" mb={6}>
                                <Box>
                                    <Heading size={{ base: "md", md: "lg" }} color="#F8FAFC">Recent Activity</Heading>
                                    <Text fontSize="xs" color="var(--terminal-accent)">Summary of latest system interactions</Text>
                                </Box>
                                <Icon as={LuActivity} color="var(--terminal-accent)" boxSize={6} />
                            </Flex>
                            <VStack align="stretch" gap={4}>
                                {analytics?.recent_activities && analytics.recent_activities.length > 0 ? (
                                    analytics.recent_activities.map((act: any, i: number) => (
                                        <HStack key={i} justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="xl">
                                            <Text fontSize="sm" color="whiteAlpha.900">{act.description || act.text}</Text>
                                            <Text fontSize="xs" color="whiteAlpha.500">{act.time}</Text>
                                        </HStack>
                                    ))
                                ) : (
                                    <Text fontSize="sm" color="whiteAlpha.500" textAlign="center" py={4}>No recent activity</Text>
                                )}
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root className="terminal-card" bg="var(--terminal-card)" borderColor="var(--terminal-border)">
                        <Card.Body p={8}>
                            <Flex justify="space-between" align="center" mb={6}>
                                <Heading size={{ base: "md", md: "lg" }} color="#F8FAFC">Assessment Coordination</Heading>
                                <Icon as={LuCalendar} color="var(--terminal-accent)" boxSize={6} />
                            </Flex>
                            <VStack align="stretch" gap={4}>
                                {(() => {
                                    const oneWeekFromNow = new Date();
                                    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
                                    
                                    const upcomingAssessments = assessments.filter((a: any) => {
                                        const proposed = new Date(a.proposed_date);
                                        return proposed <= oneWeekFromNow && a.status !== 'COMPLETED';
                                    });

                                    if (upcomingAssessments.length === 0) {
                                        return <Text fontSize="sm" color="whiteAlpha.600" textAlign="center" py={4}>No upcoming assessments in the next 7 days.</Text>;
                                    }

                                    return upcomingAssessments.map((assessment: any) => (
                                        <Box key={assessment.id} p={4} bg="var(--terminal-card)" borderRadius="xl" border="1px solid" borderColor={assessment.status === 'PROPOSED' ? 'var(--terminal-accent)' : 'green.500'}>
                                            <HStack justify="space-between" mb={2}>
                                                <VStack align="start" gap={0}>
                                                    <Text fontWeight="bold" color="#F8FAFC">{assessment.placement?.first_name} {assessment.placement?.last_name}</Text>
                                                    <Text fontSize="xs" color="whiteAlpha.600">{assessment.institution?.name}</Text>
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
                                    ));
                                })()}
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </VStack>

                {/* System Insights Section */}
                <VStack align="stretch" gap={8}>
                    <Card.Root bg="var(--terminal-card)" border="1px solid" borderColor="var(--terminal-border)" borderRadius="3xl" overflow="hidden">
                        <Box p={8} position="relative">
                            <Icon as={LuBrainCircuit} position="absolute" right="-20px" top="-20px" boxSize="150px" opacity={0.05} color="brand.400" />
                            <HStack mb={6}>
                                <Icon as={LuZap} color="yellow.400" />
                                <Heading size="md" color="#F8FAFC" letterSpacing="widest">OPERATIONAL SYNERGY</Heading>
                            </HStack>
                            <VStack align="stretch" gap={6}>
                                <Box bg="whiteAlpha.50" p={5} borderRadius="2xl" border="1px solid" borderColor="var(--terminal-border)">
                                    <Text fontSize="sm" fontWeight="bold" color="var(--terminal-accent)">Pending Assessments</Text>
                                    <Text fontSize="xs" color="whiteAlpha.800" mt={2}>You have {assessments.filter((a: any) => a.status === 'PROPOSED').length} students awaiting final evaluation. Complete these to issue certificates.</Text>
                                    <Button size="xs" bg="var(--terminal-accent)" color="black" mt={4} variant="solid" rounded="lg" onClick={() => navigate('/company/placements')}>Review Now</Button>
                                </Box>
                                <Separator borderColor="whiteAlpha.100" />

                            </VStack>
                        </Box>
                    </Card.Root>

                    <Box>
                        <Heading size="md" mb={6} color="#F8FAFC">Operational Quick-Nexus</Heading>
                        <VStack gap={4} align="stretch">
                            {opportunities.slice(0, 3).map(opp => (
                                <Card.Root
                                    key={opp.id}
                                    className="glass-panel"
                                    bg="var(--terminal-card)"
                                    borderColor="var(--terminal-border)"
                                    _hover={{ borderColor: 'var(--terminal-accent)', bg: 'whiteAlpha.100', transform: 'translateX(4px)' }}
                                    transition="0.3s"
                                    cursor="pointer"
                                    onClick={() => navigate('/company/placements')}
                                >
                                    <Card.Body p={5}>
                                        <Flex justify="space-between" align="center">
                                            <VStack align="start" gap={1}>
                                                <Text fontWeight="bold" fontSize="sm" color="#F8FAFC">{opp.title}</Text>
                                                <Text fontSize="10px" color="var(--terminal-accent)" fontWeight="bold">{opp.vacancies} VACANCIES REMAINING</Text>
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
