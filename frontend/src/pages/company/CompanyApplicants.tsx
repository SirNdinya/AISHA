
import React, { useEffect, useState } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Badge,
    Table,
    Button,
    Spinner,
    HStack,
    IconButton,
    Popover,
    VStack,
    Icon,
    Card,
    AvatarRoot,
    AvatarFallback
} from '@chakra-ui/react';
import { Switch } from '../../components/ui/switch';
import { Tooltip } from '../../components/ui/tooltip';
import {
    LuInfo,
    LuShieldCheck,
    LuBrainCircuit,
    LuMessageCircle,
    LuChevronLeft,
    LuZap,
    LuFileSearch
} from 'react-icons/lu';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApplicants, updateApplicantStatus } from '../../store/companySlice';
import type { AppDispatch, RootState } from '../../store';
import ChatWidget from '../../components/Chat/ChatWidget';

const CompanyApplicants: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Opportunity ID
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { applicants, isLoading } = useSelector((state: RootState) => state.company);
    const { user } = useSelector((state: RootState) => state.auth);
    const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        if (id) {
            dispatch(fetchApplicants(id));
        }
    }, [dispatch, id]);

    const handleStatusChange = (appId: string, newStatus: string) => {
        dispatch(updateApplicantStatus({ id: appId, status: newStatus }));
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const variants: Record<string, { color: string, label: string }> = {
            'ACCEPTED': { color: 'green', label: 'Accepted' },
            'REJECTED': { color: 'red', label: 'Rejected' },
            'PENDING': { color: 'blue', label: 'Pending' },
            'REVIEW': { color: 'orange', label: 'Under Review' },
            'OFFERED': { color: 'purple', label: 'Decision Pending' },
            'DECLINED': { color: 'gray', label: 'Declined' }
        };
        const config = variants[status] || { color: 'gray', label: status };
        return (
            <Badge variant="subtle" colorPalette={config.color} size="md" px={3} borderRadius="md">
                {config.label}
            </Badge>
        );
    };

    if (isLoading && applicants.length === 0) return <Flex h="60vh" align="center" justify="center"><Spinner size="xl" color="blue.500" /></Flex>;

    return (
        <Box animation="slideUp 0.5s ease-out">
            <Flex mb={10} align="center" justify="space-between" flexWrap="wrap" gap={6}>
                <HStack gap={6}>
                    <IconButton
                        aria-label="Back"
                        variant="ghost"
                        color="whiteAlpha.600"
                        _hover={{ bg: "whiteAlpha.100", color: "white" }}
                        rounded="full"
                        onClick={() => navigate('/company/opportunities')}
                    >
                        <LuChevronLeft />
                    </IconButton>
                    <Box>
                        <Heading size="3xl" fontWeight="black" color="white" letterSpacing="tight">Candidate Pipeline</Heading>
                        <Text color="gray.400" mt={1}>Direct cognitive matching results for this opportunity node.</Text>
                    </Box>
                </HStack>

                <Card.Root className="glass-panel" variant="subtle" bg="whiteAlpha.50" borderColor="whiteAlpha.100" p={2}>
                    <Card.Body>
                        <Flex align="center" gap={6}>
                            <HStack>
                                <Icon as={LuBrainCircuit} color="blue.400" />
                                <Box>
                                    <Text fontSize="xs" fontWeight="bold" color="white">Autonomous Review</Text>
                                    <Text fontSize="10px" color="gray.500">Auto-accept matches &gt; 85%</Text>
                                </Box>
                            </HStack>
                            <Switch colorPalette="blue" size="sm" defaultChecked onCheckedChange={(details: { checked: boolean }) => console.log(details.checked)} />
                        </Flex>
                    </Card.Body>
                </Card.Root>
            </Flex>

            <Card.Root className="glass-panel" p={0} overflow="hidden" bg="whiteAlpha.50" borderColor="whiteAlpha.100">
                <Table.Root variant="line">
                    <Table.Header bg="whiteAlpha.50">
                        <Table.Row borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.ColumnHeader color="gray.400">CANDIDATE / IDENTITY</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">AI MATCH SCORE</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">SOVEREIGN VERIFICATION</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400" textAlign="right">nexus_ops</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {applicants.map(app => (
                            <Table.Row key={app.id} _hover={{ bg: "whiteAlpha.50" }} transition="all 0.2s" borderBottom="1px solid rgba(255,255,255,0.05)">
                                <Table.Cell>
                                    <HStack gap={3}>
                                        <AvatarRoot size="sm">
                                            <AvatarFallback name={`${app.first_name} ${app.last_name}`} />
                                        </AvatarRoot>
                                        <Box>
                                            <Text fontWeight="bold" color="white">{app.first_name} {app.last_name}</Text>
                                            <Text fontSize="xs" color="gray.500">{app.course_of_study}</Text>
                                        </Box>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <HStack gap={3}>
                                        <VStack align="flex-start" gap={1}>
                                            <Badge
                                                size="xs"
                                                colorPalette={app.match_score > 85 ? 'blue' : 'gray'}
                                                variant="solid"
                                                borderRadius="full"
                                                px={2}
                                            >
                                                SOVEREIGN_{app.match_score > 85 ? 'ALPHA' : 'NODE'}
                                            </Badge>
                                            <Text fontWeight="black" fontSize="2xl" color="blue.400" letterSpacing="tighter">{app.match_score}%</Text>
                                        </VStack>
                                        <Popover.Root>
                                            <Popover.Trigger asChild>
                                                <IconButton aria-label="Match Reason" variant="ghost" size="xs" color="gray.500" _hover={{ color: "blue.400" }}><LuInfo /></IconButton>
                                            </Popover.Trigger>
                                            <Popover.Content bg="gray.900" borderColor="whiteAlpha.200" p={4} borderRadius="xl" boxShadow="2xl">
                                                <HStack mb={2}>
                                                    <Icon as={LuZap} color="yellow.400" size="xs" />
                                                    <Text fontSize="xs" fontWeight="bold" color="white">Match Rationale</Text>
                                                </HStack>
                                                <Text fontSize="xs" color="gray.400" lineHeight="tall">{app.match_reason || "Analyzed against top requirements."}</Text>
                                            </Popover.Content>
                                        </Popover.Root>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <VStack align="flex-start" gap={2}>
                                        <HStack gap={2}>
                                            <Icon as={LuShieldCheck} color="green.400" boxSize={4} />
                                            <Text fontSize="xs" fontWeight="bold" color="whiteAlpha.800">DOCS_VALID</Text>
                                        </HStack>
                                        <Badge size="xs" colorPalette="purple" variant="outline" borderRadius="full">SIG_VERIFIED</Badge>
                                    </VStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <StatusBadge status={app.status} />
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <HStack justify="flex-end" gap={2}>
                                        {app.status === 'PENDING' && (
                                            <Button size="xs" colorPalette="blue" rounded="lg" onClick={() => handleStatusChange(app.id, 'OFFERED')}>Send Offer</Button>
                                        )}
                                        {app.status !== 'REJECTED' && app.status !== ('DECLINED' as any) && (
                                            <Button size="xs" colorPalette="red" variant="ghost" rounded="lg" onClick={() => handleStatusChange(app.id, 'REJECTED')}>Reject</Button>
                                        )}
                                        <Tooltip content="Direct Neuro-Link">
                                            <IconButton
                                                aria-label="Message Candidate"
                                                size="sm"
                                                variant="subtle"
                                                colorPalette="blue"
                                                rounded="lg"
                                                onClick={() => app.student_user_id && setActiveChat({ id: app.student_user_id, name: `${app.first_name} ${app.last_name}` })}
                                            >
                                                <LuMessageCircle />
                                            </IconButton>
                                        </Tooltip>
                                        <Button size="xs" variant="ghost" color="whiteAlpha.600" _hover={{ color: "white" }}>
                                            <LuFileSearch style={{ marginRight: '4px' }} /> CV
                                        </Button>
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
                {applicants.length === 0 && (
                    <VStack py={20} gap={4}>
                        <Icon as={LuFileSearch} boxSize={12} opacity={0.1} color="white" />
                        <Text color="gray.500">No candidate entities detected in this pipeline yet.</Text>
                    </VStack>
                )}
            </Card.Root>

            {activeChat && (
                <ChatWidget
                    currentUserId={user?.id || ''}
                    targetUserId={activeChat.id}
                    targetUserName={activeChat.name}
                    applicationId={applicants.find(a => a.student_user_id === activeChat.id)?.id}
                    contextTitle="Candidate Neuro-Link"
                />
            )}
        </Box>
    );
};

export default CompanyApplicants;
