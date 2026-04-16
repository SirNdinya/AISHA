
import React, { useEffect, useState } from 'react';
import {
    Box, Heading, Text, VStack, HStack, Card, Badge,
    Button, Icon, Flex, Spinner, Table,
    DialogRoot, DialogContent, DialogHeader,
    DialogTitle, DialogBody, DialogFooter, DialogActionTrigger,
    DialogBackdrop, DialogPositioner,
    Textarea, SimpleGrid
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AvatarRoot, AvatarFallback } from '@chakra-ui/react';
import { toaster } from '../../components/ui/toaster';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlacements } from '../../store/companySlice';
import CompanyService from '../../services/companyService';
import type { AppDispatch, RootState } from '../../store';
import apiClient from '../../services/apiClient';
import {
    LuCalendar,
    LuTrophy,
    LuShield,
    LuClipboardCheck,
    LuPen,
    LuFileText,
    LuCheck
} from 'react-icons/lu';

const CompanyPlacementTracker: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { placements, isLoading } = useSelector((state: RootState) => state.company);
    const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
    const [assessment, setAssessment] = useState({
        assessment_date: new Date().toISOString().split('T')[0],
        comments: '',
        digital_signature: '',
        assessor_type: 'COMPANY'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        dispatch(fetchPlacements());
    }, [dispatch]);

    useEffect(() => {
        if (!selectedPlacement) {
            setAssessment({
                assessment_date: new Date().toISOString().split('T')[0],
                comments: '',
                digital_signature: '',
                assessor_type: 'COMPANY'
            });
        }
    }, [selectedPlacement]);

    const handleSubmitAssessment = async () => {
        if (!selectedPlacement || !assessment.digital_signature) {
            toaster.create({ title: 'Signature Required', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            await CompanyService.submitAssessment({
                placement_id: selectedPlacement.id,
                ...assessment
            });
            toaster.create({
                title: 'Assessment Recorded',
                description: 'Supervisory evaluation synced successfully.',
                type: 'success'
            });
            dispatch(fetchPlacements());
            setSelectedPlacement(null);
        } catch (error) {
            toaster.create({ title: 'Submission Failed', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };



    if (isLoading && placements.length === 0) {
        return <Flex h="60vh" align="center" justify="center"><Spinner color="indigo.500" /></Flex>;
    }

    const uniquePlacementsMap = new Map();
    placements.forEach(p => {
        if (!uniquePlacementsMap.has(p.student_id)) {
            uniquePlacementsMap.set(p.student_id, p);
        }
    });
    const uniquePlacements = Array.from(uniquePlacementsMap.values());

    const getStatusText = (startDateStr: string) => {
        const today = new Date();
        const start = new Date(startDateStr);
        if (start > today) return "Waiting Reporting";
        return "Ongoing";
    };

    return (
        <Box animation="slideUp 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="3xl" fontWeight="extrabold" letterSpacing="tight" color="#F8FAFC">
                        Placement Management
                    </Heading>
                    <Text color="var(--terminal-accent)" fontSize="lg" mt={2}>
                        Track active student attachments, verify logbooks, and record assessments.
                    </Text>
                </Box>
                <HStack gap={4}>
                    <Button variant="outline" borderColor="whiteAlpha.300" color="#F8FAFC" rounded="full">
                        <Icon as={LuFileText} mr={2} /> Export Report
                    </Button>
                </HStack>
            </Flex>

            {/* Placement List */}
            <Card.Root className="glass-panel" p={0} overflow="hidden" bg="var(--terminal-card)" borderColor="var(--terminal-border)">
                <Table.Root variant="line">
                    <Table.Header bg="var(--terminal-card)">
                        <Table.Row borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.ColumnHeader color="var(--terminal-accent)">STUDENT / COURSE</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)">ASSIGNED ROLE</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)">DEPARTMENT</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)">AI SCORE</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)">PERIOD</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" w="130px">1ST ASSESSMENT</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" w="130px">2ND ASSESSMENT</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)">STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" textAlign="right">ACTIONS</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {uniquePlacements.map((p: any) => (
                            <Table.Row key={p.id} _hover={{ bg: "rgba(255,255,255,0.02)" }} transition="0.2s" borderBottom="1px solid rgba(255,255,255,0.05)">
                                <Table.Cell>
                                    <HStack gap={3}>
                                        <AvatarRoot size="sm">
                                            <AvatarFallback name={p.first_name + ' ' + p.last_name} />
                                        </AvatarRoot>
                                        <Box>
                                            <Text fontWeight="bold" color="#F8FAFC">{p.first_name} {p.last_name}</Text>
                                            <Text fontSize="xs" color="var(--terminal-accent)">{p.course_of_study}</Text>
                                        </Box>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontWeight="medium" color="whiteAlpha.900">{p.job_title}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontWeight="medium" color="whiteAlpha.900">{p.department_name || 'General'}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    {p.match_score ? (
                                        <VStack align="flex-start" gap={1}>
                                            <Text fontWeight="black" fontSize="lg" color="indigo.400" letterSpacing="tighter">{p.match_score}%</Text>
                                        </VStack>
                                    ) : (
                                        <Text color="var(--terminal-accent)" fontSize="xs">N/A</Text>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <HStack gap={2} color="var(--terminal-accent)" fontSize="sm">
                                        <Icon as={LuCalendar} />
                                        <Text>{new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}</Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell color="var(--terminal-accent)" fontSize="xs">
                                    <Text>{p.first_assessment_date ? new Date(p.first_assessment_date).toLocaleDateString() : 'Not Set'}</Text>
                                </Table.Cell>
                                <Table.Cell color="var(--terminal-accent)" fontSize="xs">
                                    <Text>{p.second_assessment_date ? new Date(p.second_assessment_date).toLocaleDateString() : 'Not Set'}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorPalette={getStatusText(p.start_date) === 'Ongoing' ? 'orange' : 'orange'}
                                        variant="outline"
                                        borderRadius="full"
                                        px={3}
                                    >
                                        {getStatusText(p.start_date)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <HStack justify="flex-end" gap={2}>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            color="indigo.300"
                                            onClick={() => navigate(`/company/logbooks?student_id=${p.student_id}`)}
                                        >
                                            <Icon as={LuClipboardCheck} boxSize={4} /> Assess
                                        </Button>
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                        {placements.length === 0 && (
                            <Table.Row>
                                <Table.Cell colSpan={6} py={20} textAlign="center">
                                    <VStack gap={4}>
                                        <Icon as={LuShield} boxSize={12} opacity={0.2} color="#F8FAFC" />
                                        <Text color="var(--terminal-accent)">No active student placements detected.</Text>
                                    </VStack>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table.Root>
            </Card.Root>

            {/* Feedback Modal */}
            <DialogRoot
                open={!!selectedPlacement}
                onOpenChange={(e) => !e.open && setSelectedPlacement(null)}
                size="md"
            >
                <DialogBackdrop />
                <DialogPositioner>
                    <DialogContent className="glass-panel" color="#F8FAFC" borderRadius="2xl" bg="transparent" border="1px solid" borderColor="whiteAlpha.200">
                        <DialogHeader>
                            <DialogTitle color="#F8FAFC">Supervisory Assessment: {selectedPlacement?.first_name}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <VStack gap={6} align="stretch" py={4}>
                                <SimpleGrid columns={2} gap={4}>
                                    <Box>
                                        <Text mb={2} fontSize="sm" fontWeight="bold" color="indigo.300">Assessment Date</Text>
                                        <input
                                            type="date"
                                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                            value={assessment.assessment_date}
                                            onChange={(e) => setAssessment({ ...assessment, assessment_date: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text mb={2} fontSize="sm" fontWeight="bold" color="indigo.300">Assessor Role</Text>
                                        <Badge colorPalette="green" variant="subtle" p={2} borderRadius="lg" w="full" textAlign="center">COMPANY SUPERVISOR</Badge>
                                    </Box>
                                </SimpleGrid>
                                <Box>
                                    <Text mb={2} fontSize="sm" fontWeight="bold" color="indigo.300">Evaluation & Comments</Text>
                                    <Textarea
                                        placeholder="Note student performance, discipline, and technical growth..."
                                        rows={4}
                                        bg="whiteAlpha.50"
                                        borderColor="whiteAlpha.200"
                                        _focus={{ borderColor: 'indigo.500', bg: 'whiteAlpha.200' }}
                                        value={assessment.comments}
                                        onChange={(e) => setAssessment({ ...assessment, comments: e.target.value })}
                                        color="#F8FAFC"
                                    />
                                </Box>
                                <Box>
                                    <Text mb={2} fontSize="sm" fontWeight="bold" color="indigo.300">Digital Signature (Print Full Name)</Text>
                                    <HStack>
                                        <Icon as={LuPen} color="indigo.400" />
                                        <input
                                            placeholder="Enter your name to sign"
                                            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                            value={assessment.digital_signature}
                                            onChange={(e) => setAssessment({ ...assessment, digital_signature: e.target.value })}
                                        />
                                    </HStack>
                                </Box>

                            </VStack>
                        </DialogBody>
                        <DialogFooter borderTop="1px solid" borderColor="var(--terminal-border)" pt={4}>
                            <DialogActionTrigger asChild>
                                <Button variant="ghost" color="#F8FAFC" onClick={() => setSelectedPlacement(null)}>Discard</Button>
                            </DialogActionTrigger>
                            <Button
                                colorPalette="indigo"
                                rounded="xl"
                                loading={isSubmitting}
                                onClick={handleSubmitAssessment}
                            >
                                Submit Assessment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>


        </Box>
    );
};

export default CompanyPlacementTracker;
