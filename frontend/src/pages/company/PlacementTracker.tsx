
import React, { useEffect, useState } from 'react';
import {
    Box, Heading, Text, VStack, HStack, Card, Badge,
    Button, Icon, Flex, Spinner, Table,
    DialogRoot, DialogContent, DialogHeader,
    DialogTitle, DialogBody, DialogFooter, DialogActionTrigger,
    DialogBackdrop, DialogPositioner,
    Textarea, SimpleGrid
} from '@chakra-ui/react';
import { AvatarRoot, AvatarFallback } from '@chakra-ui/react';
import { toaster } from '../../components/ui/toaster';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlacements } from '../../store/companySlice';
import CompanyService from '../../services/companyService';
import type { AppDispatch, RootState } from '../../store';
import DocumentUpload from '../../components/common/DocumentUpload';
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
    const { placements, isLoading } = useSelector((state: RootState) => state.company);
    const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
    const [assessment, setAssessment] = useState({
        assessment_date: new Date().toISOString().split('T')[0],
        comments: '',
        digital_signature: '',
        assessor_type: 'COMPANY'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingDocs, setExistingDocs] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageData, setManageData] = useState({
        department_id: '',
        supervisor_id: ''
    });

    useEffect(() => {
        dispatch(fetchPlacements());
        fetchMetadata();
    }, [dispatch]);

    const fetchMetadata = async () => {
        try {
            const [deps, sups] = await Promise.all([
                CompanyService.getCompanyDepartments(),
                CompanyService.getSupervisors()
            ]);
            setDepartments(deps);
            setSupervisors(sups);
        } catch (error) {
            console.error('Failed to fetch metadata', error);
        }
    };

    useEffect(() => {
        if (selectedPlacement) {
            fetchDocs(selectedPlacement.id);
        }
    }, [selectedPlacement]);

    const fetchDocs = async (placementId: string) => {
        try {
            const res = await apiClient.get(`/documents/placement/${placementId}`);
            setExistingDocs(res.data.data);
        } catch (error) {
            console.error('Failed to fetch docs', error);
        }
    };

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

    const handleGenerateCert = async (id: string) => {
        try {
            await CompanyService.generateCertificate(id);
            toaster.create({
                title: 'Certificate Generated',
                description: 'Digital credential issued.',
                type: 'success'
            });
            dispatch(fetchPlacements());
        } catch (error) {
            toaster.create({ title: 'Generation Failed', type: 'error' });
        }
    };

    const handleUpdatePlacement = async () => {
        if (!selectedPlacement) return;
        setIsSubmitting(true);
        try {
            await CompanyService.updatePlacement(selectedPlacement.id, manageData);
            toaster.create({
                title: 'Placement Updated',
                description: 'Department and supervisor assigned.',
                type: 'success'
            });
            dispatch(fetchPlacements());
            setIsManageOpen(false);
            setSelectedPlacement(null);
        } catch (error) {
            toaster.create({ title: 'Update Failed', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && placements.length === 0) {
        return <Flex h="60vh" align="center" justify="center"><Spinner color="blue.500" /></Flex>;
    }

    return (
        <Box animation="slideUp 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="3xl" fontWeight="extrabold" letterSpacing="tight" color="white">
                        Placement Management
                    </Heading>
                    <Text color="gray.400" fontSize="lg" mt={2}>
                        Track active student attachments, verify logbooks, and record assessments.
                    </Text>
                </Box>
                <HStack gap={4}>
                    <Button variant="outline" borderColor="whiteAlpha.300" color="white" rounded="full">
                        <Icon as={LuFileText} mr={2} /> Export Report
                    </Button>
                </HStack>
            </Flex>

            {/* Placement List */}
            <Card.Root className="glass-panel" p={0} overflow="hidden" bg="whiteAlpha.50" borderColor="whiteAlpha.100">
                <Table.Root variant="line">
                    <Table.Header bg="whiteAlpha.50">
                        <Table.Row borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.ColumnHeader color="gray.400">STUDENT / COURSE</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">ASSIGNED ROLE</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">PERIOD</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400" textAlign="right">ACTIONS</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {placements.map((p) => (
                            <Table.Row key={p.id} _hover={{ bg: "whiteAlpha.50" }} transition="0.2s" borderBottom="1px solid rgba(255,255,255,0.05)">
                                <Table.Cell>
                                    <HStack gap={3}>
                                        <AvatarRoot size="sm">
                                            <AvatarFallback name={p.first_name + ' ' + p.last_name} />
                                        </AvatarRoot>
                                        <Box>
                                            <Text fontWeight="bold" color="white">{p.first_name} {p.last_name}</Text>
                                            <Text fontSize="xs" color="gray.500">{p.course_of_study}</Text>
                                            {p.department_name && (
                                                <Text fontSize="10px" color="blue.400" fontWeight="bold">
                                                    Dept: {p.department_name}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <VStack align="flex-start" gap={0}>
                                        <Text fontWeight="medium" color="whiteAlpha.900">{p.job_title}</Text>
                                        <Text fontSize="xs" color="whiteAlpha.600">
                                            Supervisor: {p.supervisor_name || 'Unassigned'}
                                        </Text>
                                    </VStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <HStack gap={2} color="gray.400" fontSize="sm">
                                        <Icon as={LuCalendar} />
                                        <Text>{new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}</Text>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorPalette={p.status === 'ACTIVE' ? 'blue' : 'green'}
                                        variant="outline"
                                        borderRadius="full"
                                        px={3}
                                    >
                                        {p.status}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <HStack justify="flex-end" gap={2}>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            color="blue.300"
                                            onClick={() => {
                                                setSelectedPlacement(p);
                                                setManageData({
                                                    department_id: p.department_id || '',
                                                    supervisor_id: p.supervisor_id || ''
                                                });
                                                setIsManageOpen(true);
                                            }}
                                        >
                                            <LuPen size={14} style={{ marginRight: '4px' }} /> Manage
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            color="blue.300"
                                            onClick={() => setSelectedPlacement(p)}
                                        >
                                            <Icon as={LuClipboardCheck} boxSize={4} /> Assess
                                        </Button>
                                        {p.status === 'COMPLETED' ? (
                                            <Button size="sm" colorPalette="green" variant="subtle" rounded="xl">
                                                <LuTrophy style={{ marginRight: '4px' }} /> View Cert
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                colorPalette="blue"
                                                variant="subtle"
                                                rounded="xl"
                                                onClick={() => handleGenerateCert(p.id)}
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                        {placements.length === 0 && (
                            <Table.Row>
                                <Table.Cell colSpan={5} py={20} textAlign="center">
                                    <VStack gap={4}>
                                        <Icon as={LuShield} boxSize={12} opacity={0.2} color="white" />
                                        <Text color="gray.500">No active student placements detected.</Text>
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
                    <DialogContent className="glass-panel" color="white" borderRadius="2xl" bg="gray.900" border="1px solid" borderColor="whiteAlpha.200">
                        <DialogHeader>
                            <DialogTitle color="white">Supervisory Assessment: {selectedPlacement?.first_name}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <VStack gap={6} align="stretch" py={4}>
                                <SimpleGrid columns={2} gap={4}>
                                    <Box>
                                        <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.300">Assessment Date</Text>
                                        <input
                                            type="date"
                                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                            value={assessment.assessment_date}
                                            onChange={(e) => setAssessment({ ...assessment, assessment_date: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.300">Assessor Role</Text>
                                        <Badge colorPalette="green" variant="subtle" p={2} borderRadius="lg" w="full" textAlign="center">COMPANY SUPERVISOR</Badge>
                                    </Box>
                                </SimpleGrid>
                                <Box>
                                    <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.300">Evaluation & Comments</Text>
                                    <Textarea
                                        placeholder="Note student performance, discipline, and technical growth..."
                                        rows={4}
                                        bg="whiteAlpha.100"
                                        borderColor="whiteAlpha.200"
                                        _focus={{ borderColor: 'blue.500', bg: 'whiteAlpha.200' }}
                                        value={assessment.comments}
                                        onChange={(e) => setAssessment({ ...assessment, comments: e.target.value })}
                                        color="white"
                                    />
                                </Box>
                                <Box>
                                    <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.300">Digital Signature (Print Full Name)</Text>
                                    <HStack>
                                        <Icon as={LuPen} color="blue.400" />
                                        <input
                                            placeholder="Enter your name to sign"
                                            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                            value={assessment.digital_signature}
                                            onChange={(e) => setAssessment({ ...assessment, digital_signature: e.target.value })}
                                        />
                                    </HStack>
                                </Box>

                                <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={4}>
                                    <Text mb={4} fontSize="sm" fontWeight="bold" color="blue.300">Final Acceptance Letter (Upload Signed Copy)</Text>
                                    <DocumentUpload
                                        type="ACCEPTANCE_LETTER"
                                        label="Upload PDF / Image"
                                        onUploadSuccess={() => fetchDocs(selectedPlacement.id)}
                                        metadata={{ placement_id: selectedPlacement?.id }}
                                    />
                                    {existingDocs.filter(d => d.type === 'ACCEPTANCE_LETTER').length > 0 && (
                                        <HStack mt={3} p={2} bg="whiteAlpha.50" borderRadius="md" justify="space-between">
                                            <HStack gap={2}>
                                                <Icon as={LuCheck} color="green.400" />
                                                <Text fontSize="xs">Document Uploaded</Text>
                                            </HStack>
                                            <Button size="xs" variant="ghost" colorPalette="blue" onClick={() => window.open(existingDocs.find(d => d.type === 'ACCEPTANCE_LETTER').file_url)}>
                                                View
                                            </Button>
                                        </HStack>
                                    )}
                                </Box>
                            </VStack>
                        </DialogBody>
                        <DialogFooter borderTop="1px solid" borderColor="whiteAlpha.100" pt={4}>
                            <DialogActionTrigger asChild>
                                <Button variant="ghost" color="white" onClick={() => setSelectedPlacement(null)}>Discard</Button>
                            </DialogActionTrigger>
                            <Button
                                colorPalette="blue"
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

            {/* Manage Placement Modal */}
            <DialogRoot
                open={isManageOpen}
                onOpenChange={(e) => !e.open && setIsManageOpen(false)}
                size="md"
            >
                <DialogBackdrop />
                <DialogPositioner>
                    <DialogContent className="glass-panel" color="white" borderRadius="2xl" bg="gray.900" border="1px solid" borderColor="whiteAlpha.200">
                        <DialogHeader>
                            <DialogTitle color="white">Manage Placement: {selectedPlacement?.first_name}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <VStack gap={6} align="stretch" py={4}>
                                <Box>
                                    <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.300">Assign Department</Text>
                                    <select
                                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                        value={manageData.department_id}
                                        onChange={(e) => setManageData({ ...manageData, department_id: e.target.value })}
                                    >
                                        <option value="" style={{ background: '#1A202C' }}>Select Department</option>
                                        {departments.map((d: any) => (
                                            <option key={d.id} value={d.id} style={{ background: '#1A202C' }}>{d.name}</option>
                                        ))}
                                    </select>
                                </Box>
                                <Box>
                                    <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.300">Assign Supervisor</Text>
                                    <select
                                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                        value={manageData.supervisor_id}
                                        onChange={(e) => setManageData({ ...manageData, supervisor_id: e.target.value })}
                                    >
                                        <option value="" style={{ background: '#1A202C' }}>Select Supervisor</option>
                                        {supervisors.map((s: any) => (
                                            <option key={s.id} value={s.id} style={{ background: '#1A202C' }}>{s.name}</option>
                                        ))}
                                    </select>
                                </Box>
                            </VStack>
                        </DialogBody>
                        <DialogFooter borderTop="1px solid" borderColor="whiteAlpha.100" pt={4}>
                            <DialogActionTrigger asChild>
                                <Button variant="ghost" color="white" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                            </DialogActionTrigger>
                            <Button
                                colorPalette="blue"
                                rounded="xl"
                                loading={isSubmitting}
                                onClick={handleUpdatePlacement}
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>
        </Box>
    );
};

export default CompanyPlacementTracker;
