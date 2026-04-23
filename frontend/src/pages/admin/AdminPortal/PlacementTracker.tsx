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
    Button,
    Input
} from '@chakra-ui/react';
import {
    Search,
    Calendar,
    Briefcase,
    CheckCircle2,
    ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toaster } from '../../../components/ui/toaster';
import InstitutionService from '../../../services/institutionService';
import apiClient from '../../../services/apiClient';
import './AdminPortal.css';

const PlacementTracker: React.FC = () => {
    const navigate = useNavigate();
    const [placements, setPlacements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchPlacements = async () => {
            try {
                // The InstitutionService.getPlacements should return the joined placed users.
                const data = await InstitutionService.getPlacements();
                
                // Group to prevent duplicates (same logic as company if a student was matched multiple times)
                const uniqueDict: Record<string, any> = {};
                for (const p of data) {
                    if (!uniqueDict[p.student_id] || new Date(p.created_at) > new Date(uniqueDict[p.student_id].created_at)) {
                        uniqueDict[p.student_id] = p;
                    }
                }
                const dedupedGroup = Object.values(uniqueDict);
                setPlacements(dedupedGroup);
            } catch (error) {
                console.error("Failed to fetch placements", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlacements();
    }, []);

    const filteredPlacements = placements.filter(p =>
        p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSetDate = async (placementId: string, type: 'first' | 'second', dateValue: string | null) => {
        try {
            await apiClient.patch(`/placements/${placementId}/assessment-dates`, {
                [type === 'first' ? 'first_assessment_date' : 'second_assessment_date']: dateValue
            });
            setPlacements(prev => prev.map(p => p.placement_id === placementId ? { ...p, [type === 'first' ? 'first_assessment_date' : 'second_assessment_date']: dateValue } : p));
            toaster.create({ title: 'Assessment Date Updated', type: 'success' });
        } catch (error: any) {
            console.error("Failed setting assessment date:", error);
            toaster.create({ title: 'Update Failed', description: error.response?.data?.message || 'Failed to update date', type: 'error' });
        }
    };

    const activeCount = placements.length; // Active count mirrors whatever remains in the array
    
    // Status Logic mirroring Company Placements 
    const getDynamicStatus = (placement: any) => {
        const today = new Date();
        const start = new Date(placement.start_date);
        const end = new Date(placement.end_date);
        
        if (today < start) return { label: 'Waiting Reporting', color: 'amber' };
        if (today > end) return { label: 'Completed', color: 'purple' };
        return { label: 'Ongoing', color: 'teal' };
    };

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={8}>
                <Box>
                    <Heading size="lg" fontWeight="bold" color="#F8FAFC">Placement Tracker</Heading>
                    <Text color="var(--terminal-accent)">Monitor your department's active student industrial attachments</Text>
                </Box>
            </Flex>

            {/* Quick Stats */}
            <SimpleGrid columns={[1, 3]} gap={6} mb={8}>
                {[
                    { label: 'Total Assessed Placements', count: activeCount, icon: Briefcase, color: 'teal.400' },
                    { label: 'Completed Attachments', count: placements.filter(p => getDynamicStatus(p).label === 'Completed').length, icon: CheckCircle2, color: 'purple.400' },
                    { label: 'System Monitored Students', count: placements.length, icon: Calendar, color: 'amber.400' },
                ].map((stat, i) => (
                    <Box key={i} className="glass-card" bg="var(--terminal-card)" p={5} borderRadius="16px" display="flex" alignItems="center" gap={4} border="1px solid" borderColor="var(--terminal-border)">
                        <Box p={3} borderRadius="12px" bg="rgba(56, 189, 248, 0.1)">
                            <Icon as={stat.icon || Briefcase} boxSize={6} color="var(--terminal-accent)" />
                        </Box>
                        <Box>
                            <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="medium">{stat.label}</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="#F8FAFC">{stat.count}</Text>
                        </Box>
                    </Box>
                ))}
            </SimpleGrid>

            {/* Main Tracker Table */}
            <Box className="glass-card" bg="var(--terminal-card)" p={6} borderRadius="20px" border="1px solid" borderColor="var(--terminal-border)">
                <Flex justify="space-between" mb={6}>
                    <Box maxW="400px" position="relative" display="flex" alignItems="center">
                        <Search color="gray" size={18} style={{ position: 'absolute', left: 12 }} />
                        <Input
                            pl={10}
                            placeholder="Filter by company or student..."
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="var(--terminal-border)"
                            borderRadius="12px"
                            color="#F8FAFC"
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
                                <Table.ColumnHeader color="var(--terminal-accent)">STUDENT</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">HOST COMPANY</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">PERIOD</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" w="150px" textTransform="uppercase">1st Assessment</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" w="150px" textTransform="uppercase">2nd Assessment</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)">STATUS</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" textAlign="right">ACTION</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredPlacements.map((item, i) => {
                                const statusObj = getDynamicStatus(item);
                                return (
                                    <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }}>
                                        <Table.Cell py={4}>
                                            <HStack gap={3}>
                                                <AvatarRoot size="xs">
                                                    <AvatarFallback name={`${item.first_name} ${item.last_name}`} />
                                                </AvatarRoot>
                                                <Text fontWeight="bold" color="#F8FAFC">{item.first_name} {item.last_name}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell color="gray.300">
                                            <VStack align="start" gap={0}>
                                                <Text color="#F8FAFC">{item.company_name}</Text>
                                                <Text fontSize="xs" color="var(--terminal-accent)">{item.role}</Text>
                                            </VStack>
                                        </Table.Cell>
                                        <Table.Cell color="whiteAlpha.800" fontSize="sm">
                                            <HStack gap={2} color="whiteAlpha.800" fontSize="sm">
                                                <Icon as={Calendar} boxSize={4} />
                                                <Text>{item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'} - {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell color="slate.600" fontSize="sm">
                                            <Input 
                                                type="date" 
                                                size="xs" 
                                                bg="rgba(255,255,255,0.05)" 
                                                border="none" 
                                                borderRadius="md" 
                                                min={item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : undefined}
                                                value={item.first_assessment_date ? new Date(item.first_assessment_date).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleSetDate(item.placement_id, 'first', e.target.value || null)}
                                            />
                                        </Table.Cell>
                                        <Table.Cell color="slate.600" fontSize="sm">
                                            <Input 
                                                type="date" 
                                                size="xs" 
                                                bg="rgba(255,255,255,0.05)" 
                                                border="none" 
                                                borderRadius="md" 
                                                min={
                                                    item.first_assessment_date 
                                                        ? new Date(item.first_assessment_date).toISOString().split('T')[0] 
                                                        : (item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : undefined)
                                                }
                                                value={item.second_assessment_date ? new Date(item.second_assessment_date).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleSetDate(item.placement_id, 'second', e.target.value || null)}
                                            />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                colorPalette={statusObj.color}
                                                variant="subtle"
                                                borderRadius="full"
                                                px={2}
                                            >
                                                {statusObj.label}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell textAlign="right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                color="var(--terminal-accent)"
                                                onClick={() => navigate(`/department/logbooks?student_id=${item.student_id}`)}
                                            >
                                                <Icon as={ClipboardCheck} mr={1} /> Assess
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Box>
    );
};

export default PlacementTracker;
