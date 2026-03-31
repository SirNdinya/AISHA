import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Flex,
    SimpleGrid,
    Icon,
    Table,
    Badge,
    VStack,
    HStack,
    Spinner,
    AvatarRoot,
    AvatarFallback,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogBackdrop,
    DialogPositioner,
    Button,
    Input
} from '@chakra-ui/react';
import {
    Search,
    Calendar,
    Briefcase,
    CheckCircle2,
    ClipboardCheck,
    Check,
    FileText,
    ExternalLink
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import InstitutionService from '../../../services/institutionService';
import './AdminPortal.css';

const PlacementTracker: React.FC = () => {
    const [placements, setPlacements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
    const [studentDocs, setStudentDocs] = useState<any[]>([]);
    const [isDocsOpen, setIsDocsOpen] = useState(false);

    useEffect(() => {
        const fetchPlacements = async () => {
            try {
                const data = await InstitutionService.getPlacements();
                setPlacements(data);
            } catch (error) {
                console.error("Failed to fetch placements", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlacements();
    }, []);

    const fetchAssessments = async (id: string) => {
        try {
            const response = await InstitutionService.getAssessments(id);
            setAssessments(response.data);
        } catch (error) {
            console.error("Failed to fetch assessments", error);
        }
    };

    const handleViewAssessments = (placement: any) => {
        setSelectedPlacement(placement);
        fetchAssessments(placement.id);
        setIsAssessmentOpen(true);
    };

    const handleViewDocs = async (placement: any) => {
        setSelectedPlacement(placement);
        setIsDocsOpen(true);
        try {
            const res = await apiClient.get(`/documents/placement/${placement.id}`);
            setStudentDocs(res.data.data);
        } catch (error) {
            console.error('Docs fetch failed', error);
        }
    };

    const filteredPlacements = placements.filter(p =>
        p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = placements.filter(p => p.status === 'ACCEPTED').length;
    const completedCount = placements.filter(p => p.status === 'COMPLETED').length;

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={8}>
                <Box>
                    <Heading size="lg" fontWeight="bold">Placement Tracker</Heading>
                    <Text color="gray.500">Monitor student internships and industrial attachments</Text>
                </Box>
            </Flex>

            {/* Quick Stats */}
            <SimpleGrid columns={[1, 3]} gap={6} mb={8}>
                {[
                    { label: 'Active Placements', count: activeCount, icon: Briefcase, color: 'teal.400' },
                    { label: 'Completed', count: completedCount, icon: CheckCircle2, color: 'purple.400' },
                    { label: 'Total Managed', count: placements.length, icon: Calendar, color: 'amber.400' },
                ].map((stat, i) => (
                    <Box key={i} className="glass-card" p={5} borderRadius="16px" display="flex" alignItems="center" gap={4}>
                        <Box p={3} borderRadius="12px" bg="rgba(167, 139, 250, 0.1)">
                            <Icon as={stat.icon || Briefcase} boxSize={6} color={stat.color} />
                        </Box>
                        <Box>
                            <Text color="gray.500" fontSize="xs" fontWeight="medium">{stat.label}</Text>
                            <Text fontSize="2xl" fontWeight="bold">{stat.count}</Text>
                        </Box>
                    </Box>
                ))}
            </SimpleGrid>

            {/* Main Tracker Table */}
            <Box className="glass-card" p={6} borderRadius="20px">
                <Flex justify="space-between" mb={6}>
                    <Box maxW="400px" position="relative" display="flex" alignItems="center">
                        <Search color="gray" size={18} style={{ position: 'absolute', left: 12 }} />
                        <Input
                            pl={10}
                            placeholder="Filter by company or student..."
                            bg="rgba(255,255,255,0.05)"
                            border="none"
                            borderRadius="12px"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Box>
                </Flex>

                {isLoading ? (
                    <Flex justify="center" py={20}><Spinner color="purple.400" /></Flex>
                ) : (
                    <Table.Root>
                        <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.Row>
                                <Table.ColumnHeader color="gray.500">Student</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Host Company</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Role</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">Status</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500" textAlign="right">Action</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredPlacements.map((item, i) => (
                                <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }}>
                                    <Table.Cell py={4}>
                                        <HStack gap={3}>
                                            <AvatarRoot size="xs">
                                                <AvatarFallback name={`${item.first_name} ${item.last_name}`} />
                                            </AvatarRoot>
                                            <Text fontWeight="medium">{item.first_name} {item.last_name}</Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell color="gray.300">
                                        <VStack align="start" gap={0}>
                                            <Text>{item.company_name}</Text>
                                            <Text fontSize="10px" color="gray.500">{item.location}</Text>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell color="gray.400" fontSize="sm">{item.role}</Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={item.status === 'COMPLETED' ? 'teal' : item.status === 'ACCEPTED' ? 'purple' : 'amber'}
                                            variant="subtle"
                                            borderRadius="full"
                                            px={2}
                                        >
                                            {item.status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            color="blue.400"
                                            onClick={() => handleViewAssessments(item)}
                                        >
                                            <Icon as={ClipboardCheck} mr={1} /> Assess
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            color="purple.400"
                                            onClick={() => handleViewDocs(item)}
                                        >
                                            <Icon as={FileText} mr={1} /> Docs
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>

            {/* Assessment Modal */}
            <DialogRoot open={isAssessmentOpen} onOpenChange={(e: any) => setIsAssessmentOpen(e.open)} size="lg">
                <DialogPositioner>
                    <DialogBackdrop />
                    <DialogContent bg="#0d1117" border="1px solid" borderColor="whiteAlpha.200" borderRadius="24px">
                        <DialogHeader>
                            <DialogTitle color="white">Supervisory Assessments</DialogTitle>
                            <Text fontSize="xs" color="gray.500">
                                {selectedPlacement?.first_name} {selectedPlacement?.last_name} @ {selectedPlacement?.company_name}
                            </Text>
                        </DialogHeader>
                        <DialogBody>
                            <VStack gap={4} align="stretch" py={4}>
                                {assessments.length === 0 ? (
                                    <Box textAlign="center" py={10}>
                                        <Icon as={ClipboardCheck} boxSize={10} color="whiteAlpha.100" mb={4} />
                                        <Text color="gray.500">No assessments recorded yet.</Text>
                                    </Box>
                                ) : (
                                    assessments.map((a, i) => (
                                        <Box key={i} p={5} borderRadius="xl" bg="whiteAlpha.50" border="1px solid" borderColor="whiteAlpha.100">
                                            <Flex justify="space-between" mb={3}>
                                                <Badge colorScheme={a.assessor_type === 'COMPANY' ? 'blue' : 'teal'}>
                                                    {a.assessor_type} SUPERVISOR
                                                </Badge>
                                                <Text fontSize="xs" color="gray.500">{new Date(a.assessment_date).toLocaleDateString()}</Text>
                                            </Flex>
                                            <Text color="gray.300" fontSize="sm" mb={4}>{a.comments}</Text>
                                            <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor="whiteAlpha.100">
                                                <HStack>
                                                    <Icon as={Check} color="green.400" boxSize={3} />
                                                    <Text fontSize="10px" color="green.400" fontWeight="bold">DIGITALLY SIGNED</Text>
                                                </HStack>
                                                <Text fontSize="10px" color="gray.500" fontStyle="italic">{a.digital_signature}</Text>
                                            </Flex>
                                        </Box>
                                    ))
                                )}
                            </VStack>
                        </DialogBody>
                        <DialogFooter borderTop="1px solid" borderColor="whiteAlpha.100">
                            <DialogActionTrigger asChild>
                                <Button variant="ghost" color="white">Close</Button>
                            </DialogActionTrigger>
                            <Button bg="blue.500" color="white" borderRadius="xl">Add Verification</Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>

            {/* Document Viewer Modal */}
            <DialogRoot open={isDocsOpen} onOpenChange={(e: any) => setIsDocsOpen(e.open)} size="md">
                <DialogPositioner>
                    <DialogBackdrop />
                    <DialogContent bg="#0d1117" border="1px solid" borderColor="whiteAlpha.200" borderRadius="24px">
                        <DialogHeader>
                            <DialogTitle color="white">Student Document Vault</DialogTitle>
                            <Text fontSize="xs" color="gray.500">Documents submitted by {selectedPlacement?.first_name}</Text>
                        </DialogHeader>
                        <DialogBody>
                            <VStack gap={3} align="stretch" py={4}>
                                {studentDocs.length === 0 ? (
                                    <Box textAlign="center" py={10}>
                                        <Icon as={FileText} boxSize={10} color="whiteAlpha.100" mb={4} />
                                        <Text color="gray.500">No documents uploaded by student.</Text>
                                    </Box>
                                ) : (
                                    studentDocs.map((doc, i) => (
                                        <HStack key={i} p={4} borderRadius="xl" bg="whiteAlpha.50" justify="space-between">
                                            <HStack gap={3}>
                                                <Icon as={FileText} color="purple.400" />
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="sm">{doc.type.replace(/_/g, ' ')}</Text>
                                                    <Text fontSize="10px" color="gray.500">Status: {doc.status}</Text>
                                                </Box>
                                            </HStack>
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                colorPalette="purple"
                                                onClick={() => window.open(doc.file_url)}
                                            >
                                                <ExternalLink size={12} style={{ marginRight: '4px' }} /> View
                                            </Button>
                                        </HStack>
                                    ))
                                )}
                            </VStack>
                        </DialogBody>
                        <DialogFooter borderTop="1px solid" borderColor="whiteAlpha.100">
                            <DialogActionTrigger asChild>
                                <Button variant="ghost" color="white" onClick={() => setIsDocsOpen(false)}>Close</Button>
                            </DialogActionTrigger>
                        </DialogFooter>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>
        </Box>
    );
};

export default PlacementTracker;
