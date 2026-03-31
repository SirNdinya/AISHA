import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Heading, Text, VStack, HStack, Card, Badge,
    Button, Icon, Flex, Spinner,
    Input, Textarea, SimpleGrid, IconButton, Table
} from '@chakra-ui/react';
import { Switch } from '../../components/ui/switch';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanyOpportunities, postOpportunity, updateOpportunityAction, deleteOpportunityAction } from '../../store/companySlice';
import type { AppDispatch, RootState } from '../../store';
import type { CreateOpportunityDto } from '../../types/company';
import { useNavigate } from 'react-router-dom';
import CompanyService from '../../services/companyService';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
    LuPlus, LuX, LuBriefcase, LuClock, LuCoins, LuMapPin, LuZap, LuShield, LuPen, LuTrash,
    LuSearch, LuFilter, LuRotateCcw
} from 'react-icons/lu';

const OpportunityManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { opportunities, isLoading } = useSelector((state: RootState) => state.company);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStipend, setFilterStipend] = useState(''); // 'paid' | 'unpaid' | ''
    const [filterStudentFee, setFilterStudentFee] = useState(''); // 'yes' | 'no' | ''
    const [filterLocation, setFilterLocation] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = searchQuery || filterDepartment || filterStipend || filterStudentFee || filterLocation || filterStatus;

    const clearAllFilters = () => {
        setSearchQuery('');
        setFilterDepartment('');
        setFilterStipend('');
        setFilterStudentFee('');
        setFilterLocation('');
        setFilterStatus('');
    };

    // Derived filtered list
    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(opp => {
            // Text search across title, description, requirements
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesText = (
                    (opp.title || '').toLowerCase().includes(q) ||
                    (opp.description || '').toLowerCase().includes(q) ||
                    (opp.requirements || '').toLowerCase().includes(q) ||
                    (opp.department_name || '').toLowerCase().includes(q)
                );
                if (!matchesText) return false;
            }
            // Department filter
            if (filterDepartment && opp.department_id !== filterDepartment) return false;
            // Stipend filter
            if (filterStipend === 'paid' && (!opp.stipend_amount || opp.stipend_amount <= 0)) return false;
            if (filterStipend === 'unpaid' && opp.stipend_amount && opp.stipend_amount > 0) return false;
            // Student fee filter
            if (filterStudentFee === 'yes' && !opp.student_payment_required) return false;
            if (filterStudentFee === 'no' && opp.student_payment_required) return false;
            // Location filter
            if (filterLocation && opp.location !== filterLocation) return false;
            // Status filter
            if (filterStatus && opp.status !== filterStatus) return false;
            return true;
        });
    }, [opportunities, searchQuery, filterDepartment, filterStipend, filterStudentFee, filterLocation, filterStatus]);

    // Form State
    const [departments, setDepartments] = useState<any[]>([]);
    const [formData, setFormData] = useState<CreateOpportunityDto>({
        title: '',
        description: '',
        requirements: '',
        location: '',
        type: 'ATTACHMENT', // Hardcoded implicitly per requirements
        vacancies: 1,
        application_deadline: '',
        start_date: '',
        stipend_amount: 0,
        duration_months: 3,
        auto_accept: false,
        department_id: '',
        student_payment_required: false,
        student_payment_amount: 0
    });
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        dispatch(fetchCompanyOpportunities());
        CompanyService.getCompanyDepartments().then(setDepartments);
    }, [dispatch]);

    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreateOrUpdate = async () => {
        setCreateError(null);
        const submissionData = {
            ...formData,
            stipend_amount: isPaid ? formData.stipend_amount : 0
        };

        let result;
        if (isEditMode && editingId) {
            result = await dispatch(updateOpportunityAction({ id: editingId, data: submissionData }));
        } else {
            result = await dispatch(postOpportunity(submissionData));
        }

        if (postOpportunity.fulfilled.match(result) || updateOpportunityAction.fulfilled.match(result)) {
            setIsOpen(false);
            // Re-fetch to ensure list is in sync with server
            dispatch(fetchCompanyOpportunities());
            resetForm();
        } else {
            setCreateError((result.payload as string) || `Failed to ${isEditMode ? 'update' : 'create'} opportunity. Please try again.`);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            requirements: '',
            location: '',
            type: 'ATTACHMENT',
            vacancies: 1,
            application_deadline: '',
            start_date: '',
            stipend_amount: 0,
            duration_months: 3,
            auto_accept: false,
            department_id: '',
            student_payment_required: false,
            student_payment_amount: 0
        });
        setIsPaid(false);
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleEditClick = (opp: any) => {
        setFormData({
            title: opp.title || '',
            description: opp.description || '',
            requirements: opp.requirements || '',
            location: opp.location || '',
            type: opp.type || 'ATTACHMENT',
            vacancies: opp.vacancies || 1,
            application_deadline: opp.application_deadline ? new Date(opp.application_deadline).toISOString().split('T')[0] : '',
            start_date: opp.start_date || '',
            stipend_amount: opp.stipend_amount || 0,
            duration_months: opp.duration_months || 3,
            auto_accept: opp.auto_accept || false,
            department_id: opp.department_id || '',
            student_payment_required: opp.student_payment_required || false,
            student_payment_amount: opp.student_payment_amount || 0
        });
        setIsPaid(opp.stipend_amount > 0);
        setIsEditMode(true);
        setEditingId(opp.id);
        setIsOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setOpportunityToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (opportunityToDelete) {
            await dispatch(deleteOpportunityAction(opportunityToDelete));
            dispatch(fetchCompanyOpportunities());
            setOpportunityToDelete(null);
        }
    };

    return (
        <Box animation="slideUp 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="3xl" fontWeight="extrabold" letterSpacing="tight" className="glow-text-cyan" color="white">
                        Opportunities Nexus
                    </Heading>
                    <Text color="gray.400" fontSize="lg" mt={2}>
                        Synthesize and manage your organization's attachment requirements.
                    </Text>
                </Box>
                <Button
                    colorPalette="cyan"
                    size="lg"
                    rounded="xl"
                    onClick={() => {
                        resetForm();
                        setIsOpen(true);
                    }}
                    boxShadow="0 0 20px rgba(0, 200, 255, 0.4)"
                    _hover={{ transform: 'translateY(-2px)' }}
                >
                    <LuPlus style={{ marginRight: '8px' }} /> Initialize Posting
                </Button>
            </Flex>

            {/* Search & Filter Bar */}
            <Box mb={6}>
                {/* Search Row */}
                <Flex gap={3} mb={3}>
                    <Box position="relative" flex={1}>
                        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                            <LuSearch color="#63b3ed" size={16} />
                        </Box>
                        <Input
                            placeholder="Search by title, description, requirements, department..."
                            bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                            pl={10} rounded="xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            _placeholder={{ color: 'gray.500' }}
                        />
                    </Box>
                    <Button
                        variant={showFilters ? 'solid' : 'outline'}
                        colorPalette="cyan"
                        rounded="xl"
                        onClick={() => setShowFilters(!showFilters)}
                        minW="120px"
                    >
                        <LuFilter style={{ marginRight: '6px' }} /> Filters
                        {hasActiveFilters && (
                            <Badge ml={2} colorPalette="orange" variant="solid" borderRadius="full" fontSize="10px">
                                !
                            </Badge>
                        )}
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            color="gray.400"
                            rounded="xl"
                            onClick={clearAllFilters}
                            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                        >
                            <LuRotateCcw style={{ marginRight: '6px' }} /> Clear
                        </Button>
                    )}
                </Flex>

                {/* Expandable Filter Row */}
                {showFilters && (
                    <SimpleGrid
                        columns={{ base: 2, md: 3, lg: 5 }}
                        gap={3}
                        p={4}
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        rounded="xl"
                        animation="slideDown 0.2s ease-out"
                    >
                        <Box>
                            <Text color="gray.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Department</Text>
                            <select
                                style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '13px' }}
                                value={filterDepartment}
                                onChange={e => setFilterDepartment(e.target.value)}
                            >
                                <option value="" style={{ background: '#1a202c' }}>All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id} style={{ background: '#1a202c' }}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </Box>
                        <Box>
                            <Text color="gray.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Stipend</Text>
                            <select
                                style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '13px' }}
                                value={filterStipend}
                                onChange={e => setFilterStipend(e.target.value)}
                            >
                                <option value="" style={{ background: '#1a202c' }}>All</option>
                                <option value="paid" style={{ background: '#1a202c' }}>Paid (With Stipend)</option>
                                <option value="unpaid" style={{ background: '#1a202c' }}>Unpaid</option>
                            </select>
                        </Box>
                        <Box>
                            <Text color="gray.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Student Fee</Text>
                            <select
                                style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '13px' }}
                                value={filterStudentFee}
                                onChange={e => setFilterStudentFee(e.target.value)}
                            >
                                <option value="" style={{ background: '#1a202c' }}>All</option>
                                <option value="yes" style={{ background: '#1a202c' }}>Fee Required</option>
                                <option value="no" style={{ background: '#1a202c' }}>No Fee</option>
                            </select>
                        </Box>
                        <Box>
                            <Text color="gray.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Location</Text>
                            <select
                                style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '13px' }}
                                value={filterLocation}
                                onChange={e => setFilterLocation(e.target.value)}
                            >
                                <option value="" style={{ background: '#1a202c' }}>All Locations</option>
                                <option value="Nairobi" style={{ background: '#1a202c' }}>Nairobi</option>
                                <option value="Mombasa" style={{ background: '#1a202c' }}>Mombasa</option>
                                <option value="Kisumu" style={{ background: '#1a202c' }}>Kisumu</option>
                            </select>
                        </Box>
                        <Box>
                            <Text color="gray.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Status</Text>
                            <select
                                style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '13px' }}
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="" style={{ background: '#1a202c' }}>All Statuses</option>
                                <option value="OPEN" style={{ background: '#1a202c' }}>Open</option>
                                <option value="CLOSED" style={{ background: '#1a202c' }}>Closed</option>
                                <option value="FILLED" style={{ background: '#1a202c' }}>Filled</option>
                            </select>
                        </Box>
                    </SimpleGrid>
                )}

                {/* Results count */}
                {opportunities.length > 0 && (
                    <Flex justify="space-between" align="center" mt={3}>
                        <Text color="gray.500" fontSize="xs">
                            Showing <Text as="span" color="cyan.400" fontWeight="bold">{filteredOpportunities.length}</Text> of {opportunities.length} postings
                            {hasActiveFilters && ' (filtered)'}
                        </Text>
                    </Flex>
                )}
            </Box>

            {/* List of Opportunities */}
            {isLoading && opportunities.length === 0 ? (
                <Flex h="40vh" align="center" justify="center"><Spinner color="cyan.500" /></Flex>
            ) : opportunities.length === 0 ? (
                <VStack py={20} gap={4}>
                    <Icon as={LuBriefcase} boxSize={16} opacity={0.1} color="white" />
                    <Text color="gray.500" fontSize="xl">No active talent requirements detected.</Text>
                </VStack>
            ) : filteredOpportunities.length === 0 ? (
                <VStack py={16} gap={4}>
                    <Icon as={LuSearch} boxSize={12} opacity={0.15} color="white" />
                    <Text color="gray.500" fontSize="lg">No postings match your current filters.</Text>
                    <Button size="sm" variant="outline" colorPalette="cyan" onClick={clearAllFilters}>
                        Clear All Filters
                    </Button>
                </VStack>
            ) : (
                <Box overflowX="auto" bg="whiteAlpha.50" rounded="xl" border="1px solid" borderColor="whiteAlpha.100" p={2}>
                    <Table.Root variant="line" size="md">
                        <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.Row>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">DESIGNATION</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">DEPARTMENT</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">LOCATION</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">STIPEND</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">FEE</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">START DATE</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px">STATUS</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px" textAlign="center">TOTAL SLOTS</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px" textAlign="center">REMAINING</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontSize="11px" textAlign="right">ACTIONS</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredOpportunities.map(opp => {
                                const remaining = (opp.vacancies || 0) - (opp.applicant_count || 0);
                                return (
                                <Table.Row key={opp.id} _hover={{ bg: "rgba(255,255,255,0.02)" }}>
                                    <Table.Cell py={4}>
                                        <VStack align="start" gap={1}>
                                            <Text color="white" fontWeight="bold">{opp.title}</Text>
                                            <Badge colorPalette="cyan" variant="subtle" size="sm">{opp.type}</Badge>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell color="gray.300">
                                        <Text fontWeight="medium">{opp.department_name || 'N/A'}</Text>
                                    </Table.Cell>
                                    <Table.Cell color="gray.300">
                                        <HStack>
                                            <Icon as={LuMapPin} color="cyan.400" />
                                            <Text>{opp.location || 'Unspecified'}</Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell color="gray.300">
                                        <HStack>
                                            <Icon as={LuCoins} color="yellow.400" />
                                            <Text fontWeight="bold" color="white">
                                                {opp.stipend_amount && opp.stipend_amount > 0 
                                                    ? `KES ${opp.stipend_amount.toLocaleString()}` 
                                                    : 'Unpaid'}
                                            </Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {opp.student_payment_required ? (
                                            <Badge colorPalette="orange" variant="outline">
                                                KES {opp.student_payment_amount?.toLocaleString() || 0}
                                            </Badge>
                                        ) : (
                                            <Text color="gray.600" fontSize="xs">None</Text>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell color="gray.300" fontWeight="mono" fontSize="sm">
                                        {opp.start_date || <Text color="gray.600">N/A</Text>}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge colorPalette={opp.status === 'OPEN' ? 'green' : 'gray'}>{opp.status}</Badge>
                                    </Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <Badge colorPalette="blue" size="md">{opp.vacancies || '∞'}</Badge>
                                    </Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <Badge colorPalette={remaining > 0 ? "orange" : "gray"} size="md">
                                            {remaining > 0 ? remaining : 0}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <HStack justify="flex-end" gap={2}>
                                            <IconButton
                                                size="sm" variant="ghost" colorPalette="blue"
                                                onClick={() => handleEditClick(opp)}
                                                aria-label="Edit Opportunity"
                                            >
                                                <LuPen />
                                            </IconButton>
                                            <IconButton
                                                size="sm" variant="ghost" colorPalette="red"
                                                onClick={() => handleDeleteClick(opp.id)}
                                                aria-label="Delete Opportunity"
                                            >
                                                <LuTrash />
                                            </IconButton>
                                            <Button
                                                size="sm"
                                                variant="subtle"
                                                colorPalette="cyan"
                                                rounded="lg"
                                                onClick={() => navigate(`/company/opportunities/${opp.id}/applicants`)}
                                            >
                                                Manage Pipeline
                                            </Button>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            )})}
                        </Table.Body>
                    </Table.Root>
                </Box>
            )}

            {/* Create Opportunity Modeless Overlay */}
            {isOpen && (
                <Box
                    pos="fixed" top={0} left={0} w="full" h="full" bg="blackAlpha.800"
                    display="flex" justifyContent="center" alignItems="center" zIndex={1000}
                    backdropFilter="blur(10px)"
                    p={4}
                >
                    <Box
                        className="glass-panel" bg="gray.900" p={8} borderRadius="3xl"
                        w={{ base: "full", md: "800px" }} shadow="2xl" maxH="95vh"
                        overflowY="auto" border="1px solid" borderColor="whiteAlpha.200"
                    >
                        <Flex justify="space-between" align="center" mb={10}>
                            <Box>
                                <HStack>
                                    <Icon as={LuZap} color="cyan.400" />
                                    <Heading size="xl" color="white">{isEditMode ? 'Update Requirement' : 'Post New Requirement'}</Heading>
                                </HStack>
                                <Text color="gray.400" mt={1}>Define the specific parameters for your next student attachment.</Text>
                            </Box>
                            <IconButton
                                aria-label="Close"
                                variant="ghost"
                                color="whiteAlpha.600"
                                _hover={{ color: "white", bg: "whiteAlpha.100" }}
                                rounded="full"
                                onClick={() => setIsOpen(false)}
                            >
                                <LuX />
                            </IconButton>
                        </Flex>

                        <VStack gap={8} align="stretch">
                            <Box>
                                <Text color="cyan.400" fontSize="xs" fontWeight="bold" mb={3} letterSpacing="widest">CORE CONFIGURATION</Text>
                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>DESIGNATION</Text>
                                        <Input
                                            placeholder="e.g. Frontend Engineering Intern"
                                            bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>DEPARTMENT</Text>
                                        <select
                                            style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }}
                                            value={formData.department_id}
                                            onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                        >
                                            <option value="" style={{ background: '#1a202c' }}>Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id} style={{ background: '#1a202c' }}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Box>
                                </SimpleGrid>
                            </Box>

                            <Box>
                                <Text color="cyan.400" fontSize="xs" fontWeight="bold" mb={3} letterSpacing="widest">SPECIFICATIONS</Text>
                                <VStack gap={4} align="stretch">
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>ROLE DESCRIPTION</Text>
                                        <Textarea
                                            placeholder="Define responsibilities..."
                                            rows={4} bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>CORE REQUIREMENTS</Text>
                                        <Textarea
                                            placeholder="Defined skills/competencies..."
                                            rows={2} bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                            value={formData.requirements}
                                            onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                        />
                                    </Box>
                                </VStack>
                            </Box>

                            <Box>
                                <Text color="cyan.400" fontSize="xs" fontWeight="bold" mb={3} letterSpacing="widest">PARAMETERS</Text>
                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>LOCATION</Text>
                                        <select
                                            style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }}
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        >
                                            <option value="" style={{ background: '#1a202c' }}>Select Location</option>
                                            <option value="Nairobi" style={{ background: '#1a202c' }}>Nairobi</option>
                                            <option value="Mombasa" style={{ background: '#1a202c' }}>Mombasa</option>
                                            <option value="Kisumu" style={{ background: '#1a202c' }}>Kisumu</option>
                                        </select>
                                    </Box>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>POSSIBLE START DATE</Text>
                                        <Input
                                            type="date" bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                            value={formData.start_date || ''}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>DURATION</Text>
                                        <Input
                                            type="text" bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="gray.400"
                                            value="3 Months"
                                            readOnly
                                            cursor="not-allowed"
                                        />
                                    </Box>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>SLOTS AVAILABLE</Text>
                                        <Input
                                            type="number" bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                            value={formData.vacancies || ''}
                                            onChange={e => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 0 })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2}>APPLICATION SCAN DEADLINE</Text>
                                        <Input
                                            type="date" bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                            value={formData.application_deadline}
                                            onChange={e => setFormData({ ...formData, application_deadline: e.target.value })}
                                        />
                                    </Box>
                                </SimpleGrid>
                            </Box>

                             <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Box bg="whiteAlpha.50" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                    <Flex justify="space-between" align="center">
                                        <Box>
                                            <HStack>
                                                <Icon as={LuCoins} color="yellow.400" />
                                                <Text fontWeight="bold" color="white">Financial Stipend</Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Provide a monthly allowance to the student.</Text>
                                        </Box>
                                        <Switch
                                            colorPalette="cyan"
                                            checked={isPaid}
                                            onCheckedChange={(details: { checked: boolean }) => setIsPaid(details.checked)}
                                        />
                                    </Flex>
                                    {isPaid && (
                                        <Box mt={4}>
                                            <Text color="gray.500" fontSize="xs" mb={2}>STIPEND AMOUNT (KES / Month)</Text>
                                            <Input
                                                type="number" bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                                value={formData.stipend_amount || ''}
                                                onChange={e => setFormData({ ...formData, stipend_amount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                <Box bg="whiteAlpha.50" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                    <Flex justify="space-between" align="center">
                                        <Box>
                                            <HStack>
                                                <Icon as={LuShield} color="orange.400" />
                                                <Text fontWeight="bold" color="white">Student Fee</Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" mt={1}>Mandatory stipend/insurance fee for the student.</Text>
                                        </Box>
                                        <Switch
                                            colorPalette="orange"
                                            checked={formData.student_payment_required}
                                            onCheckedChange={(details: { checked: boolean }) => setFormData({ ...formData, student_payment_required: details.checked })}
                                        />
                                    </Flex>
                                    {formData.student_payment_required && (
                                        <Box mt={4}>
                                            <Text color="gray.500" fontSize="xs" mb={2}>PAYMENT AMOUNT (KES)</Text>
                                            <Input
                                                type="number" bg="whiteAlpha.50" borderColor="whiteAlpha.200" color="white"
                                                value={formData.student_payment_amount || ''}
                                                onChange={e => setFormData({ ...formData, student_payment_amount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </SimpleGrid>

                            {createError && (
                                <Box p={3} bg="red.900" borderRadius="xl" border="1px solid" borderColor="red.700">
                                    <Text color="red.300" fontSize="sm">{createError}</Text>
                                </Box>
                            )}

                            <Flex gap={4} pt={6}>
                                <Button flex={1} variant="ghost" color="white" onClick={() => setIsOpen(false)}>Abort</Button>
                                <Button
                                    flex={2} colorPalette="cyan" rounded="xl" h={12}
                                    onClick={handleCreateOrUpdate}
                                    disabled={!formData.title || !formData.description || !formData.location || !formData.department_id}
                                >
                                    {isEditMode ? 'Save Updates' : 'Publish Posting'}
                                </Button>
                            </Flex>
                        </VStack>
                    </Box>
                </Box>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setOpportunityToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Opportunity"
                description="Are you sure you want to delete this opportunity? This action cannot be undone and will remove the job posting out of the system entirely."
                confirmText="Delete Posting"
                confirmColor="red.500"
            />
        </Box>
    );
};

export default OpportunityManager;
