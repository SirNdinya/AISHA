import React, { useEffect, useState, useMemo } from 'react';
import {
    Button, Icon, Flex, Spinner,
    Input, Textarea, SimpleGrid, IconButton, Table,
    DialogRoot, DialogContent, DialogHeader, DialogTitle,
    DialogBody, DialogFooter, DialogPositioner,
    HStack, Box, Text, Badge, VStack,
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
    LuSearch, LuFilter, LuRotateCcw, LuChevronDown, LuChevronUp, LuChevronLeft, LuChevronRight
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
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
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
        setCurrentPage(1);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredOpportunities]);

    const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
    const paginatedOpportunities = filteredOpportunities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

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
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4} mb={10}>
                <Box>
                    <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="extrabold" letterSpacing="tight" color="#F8FAFC">
                        Opportunities Nexus
                    </Text>
                    <Text color="var(--terminal-accent)" fontSize={{ base: "md", md: "lg" }} mt={2}>
                        Synthesize and manage your organization's attachment requirements.
                    </Text>
                </Box>
                <Button
                    colorPalette="indigo"
                    size="lg"
                    rounded="xl"
                    w={{ base: "full", md: "auto" }}
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
                            bg="var(--terminal-card)" borderColor="var(--terminal-border)" color="#F8FAFC"
                            pl={10} rounded="xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            _placeholder={{ color: 'whiteAlpha.400' }}
                        />
                    </Box>
                    <Button
                        variant={showFilters ? 'solid' : 'outline'}
                        colorPalette="indigo"
                        rounded="xl"
                        onClick={() => setShowFilters(!showFilters)}
                        minW="120px"
                    >
                        <LuFilter style={{ marginRight: '6px' }} /> Filters
                        {hasActiveFilters && (
                            <Badge ml={2} colorPalette="indigo" variant="solid" borderRadius="full" fontSize="10px">
                                !
                            </Badge>
                        )}
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            color="whiteAlpha.600"
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
                        bg="var(--terminal-card)"
                        border="1px solid"
                        borderColor="var(--terminal-border)"
                        rounded="xl"
                        animation="slideDown 0.2s ease-out"
                    >
                        <Box>
                            <Text color="whiteAlpha.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Department</Text>
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
                            <Text color="whiteAlpha.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Stipend</Text>
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
                            <Text color="whiteAlpha.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Student Fee</Text>
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
                            <Text color="whiteAlpha.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Location</Text>
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
                            <Text color="whiteAlpha.500" fontSize="10px" mb={1} textTransform="uppercase" letterSpacing="wider">Status</Text>
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
                        <Text color="whiteAlpha.600" fontSize="xs">
                            Showing <Text as="span" color="var(--terminal-accent)" fontWeight="bold">{filteredOpportunities.length}</Text> of {opportunities.length} postings
                            {hasActiveFilters && ' (filtered)'}
                        </Text>
                    </Flex>
                )}
            </Box>

            {/* List of Opportunities */}
            {isLoading && opportunities.length === 0 ? (
                <Flex h="40vh" align="center" justify="center"><Spinner color="indigo.500" /></Flex>
            ) : opportunities.length === 0 ? (
                <VStack py={20} gap={4}>
                    <Icon as={LuBriefcase} boxSize={16} opacity={0.1} color="slate.900" />
                    <Text color="slate.600" fontSize="xl">No active talent requirements detected.</Text>
                </VStack>
            ) : filteredOpportunities.length === 0 ? (
                <VStack py={16} gap={4}>
                    <Icon as={LuSearch} boxSize={12} opacity={0.15} color="slate.900" />
                    <Text color="slate.600" fontSize="lg">No postings match your current filters.</Text>
                    <Button size="sm" variant="outline" colorPalette="indigo" onClick={clearAllFilters}>
                        Clear All Filters
                    </Button>
                </VStack>
            ) : (
                <Box overflowX="auto" bg="var(--terminal-card)" rounded="xl" border="1px solid" borderColor="var(--terminal-border)" p={2}>
                    <Table.Root variant="line" size="md">
                        <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.Row>
                                <Table.ColumnHeader color="var(--terminal-accent)" fontSize="11px">DESIGNATION</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" fontSize="11px" display={{ base: "none", md: "table-cell" }}>DETAILS</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" fontSize="11px" display={{ base: "none", lg: "table-cell" }}>FINANCIALS</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" fontSize="11px" textAlign="center">CAPACITY</Table.ColumnHeader>
                                <Table.ColumnHeader color="var(--terminal-accent)" fontSize="11px" textAlign="right">ACTIONS</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {paginatedOpportunities.map(opp => {
                                const remaining = (opp.vacancies || 0) - (opp.applicant_count || 0);
                                const isExpanded = expandedRow === opp.id;
                                return (
                                <React.Fragment key={opp.id}>
                                <Table.Row _hover={{ bg: "rgba(255,255,255,0.02)" }} cursor="pointer" onClick={() => toggleRow(opp.id)}>
                                    <Table.Cell py={4}>
                                        <VStack align="start" gap={1}>
                                            <HStack>
                                                <Text color="#F8FAFC" fontWeight="bold">{opp.title}</Text>
                                                <Badge colorPalette={opp.status === 'OPEN' ? 'green' : 'gray'} size="sm">{opp.status}</Badge>
                                            </HStack>
                                            <HStack mt={1}>
                                                <Badge colorPalette="indigo" variant="subtle" size="sm" bg="whiteAlpha.100" color="indigo.300">{opp.type}</Badge>
                                                <Text fontSize="xs" color="whiteAlpha.600">{opp.department_name || 'N/A'}</Text>
                                            </HStack>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell color="whiteAlpha.700" display={{ base: "none", md: "table-cell" }}>
                                        <VStack align="start" gap={1}>
                                            <HStack>
                                                <Icon as={LuMapPin} color="var(--terminal-accent)" />
                                                <Text fontSize="sm">{opp.location || 'Unspecified'}</Text>
                                            </HStack>
                                            <HStack>
                                                <Icon as={LuClock} color="whiteAlpha.600" />
                                                <Text fontSize="xs" color="whiteAlpha.600">{opp.start_date || 'N/A'}</Text>
                                            </HStack>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell color="whiteAlpha.700" display={{ base: "none", lg: "table-cell" }}>
                                        <VStack align="start" gap={1}>
                                            <HStack>
                                                <Icon as={LuCoins} color="yellow.400" />
                                                <Text fontSize="sm" fontWeight="bold" color="#F8FAFC">
                                                    {opp.stipend_amount && opp.stipend_amount > 0 
                                                        ? `KES ${opp.stipend_amount.toLocaleString()}` 
                                                        : 'Unpaid'}
                                                </Text>
                                            </HStack>
                                            {opp.student_payment_required ? (
                                                <Badge colorPalette="indigo" variant="outline" size="xs">
                                                    Fee: KES {opp.student_payment_amount?.toLocaleString() || 0}
                                                </Badge>
                                            ) : (
                                                <Text color="whiteAlpha.600" fontSize="xs">No Fee</Text>
                                            )}
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <VStack gap={1} align="center">
                                            <Badge colorPalette={remaining > 0 ? "orange" : "gray"} size="md">
                                                {remaining > 0 ? remaining : 0} left
                                            </Badge>
                                            <Text fontSize="xs" color="whiteAlpha.600">of {opp.vacancies || '∞'} total</Text>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <HStack justify="flex-end" gap={2}>
                                            <IconButton
                                                size="sm" variant="ghost" color="whiteAlpha.700"
                                                onClick={(e) => { e.stopPropagation(); toggleRow(opp.id); }}
                                                aria-label="Toggle Details"
                                            >
                                                {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                                            </IconButton>
                                            <IconButton
                                                size="sm" variant="ghost" colorPalette="indigo"
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(opp); }}
                                                aria-label="Edit Opportunity"
                                            >
                                                <LuPen />
                                            </IconButton>
                                            <IconButton
                                                size="sm" variant="ghost" colorPalette="red"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(opp.id); }}
                                                aria-label="Delete Opportunity"
                                            >
                                                <LuTrash />
                                            </IconButton>
                                            <Button
                                                size="sm"
                                                variant="subtle"
                                                colorPalette="indigo"
                                                rounded="lg"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/company/opportunities/${opp.id}/applicants`); }}
                                            >
                                                Manage Pipeline
                                            </Button>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                                {isExpanded && (
                                    <Table.Row bg="whiteAlpha.50">
                                        <Table.Cell colSpan={5} p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
                                            <VStack align="stretch" gap={4}>
                                                <Box>
                                                    <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold">DESCRIPTION</Text>
                                                    <Text color="whiteAlpha.900" fontSize="sm" mt={1} whiteSpace="pre-wrap">{opp.description || 'No description provided.'}</Text>
                                                </Box>
                                                <Box>
                                                    <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold">REQUIREMENTS</Text>
                                                    <Text color="whiteAlpha.900" fontSize="sm" mt={1} whiteSpace="pre-wrap">{opp.requirements || 'No requirements specified.'}</Text>
                                                </Box>
                                            </VStack>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                                </React.Fragment>
                            )})}
                        </Table.Body>
                    </Table.Root>
                    {totalPages > 1 && (
                        <Flex justify="space-between" align="center" mt={4} p={2}>
                            <Text color="whiteAlpha.500" fontSize="sm">
                                Page <Text as="span" color="var(--terminal-accent)">{currentPage}</Text> of {totalPages}
                            </Text>
                            <HStack>
                                <IconButton
                                    size="sm" variant="outline" colorPalette="indigo"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    aria-label="Previous Page"
                                >
                                    <LuChevronLeft />
                                </IconButton>
                                <IconButton
                                    size="sm" variant="outline" colorPalette="indigo"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    aria-label="Next Page"
                                >
                                    <LuChevronRight />
                                </IconButton>
                            </HStack>
                        </Flex>
                    )}
                </Box>
            )}

            <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)} size="xl">
                <DialogBackdrop backdropFilter="blur(12px)" bg="rgba(0,0,0,0.6)" />
                <DialogPositioner>
                    <DialogContent
                        bg="#020617"
                        color="white"
                        borderRadius="3xl"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        p={{ base: 4, md: 8 }}
                        mx={{ base: 4, md: 0 }}
                        boxShadow="0 25px 80px rgba(0,0,0,0.8)"
                        maxH="90vh"
                        overflowY="auto"
                    >
                        <DialogHeader>
                            <DialogTitle fontSize="2xl" fontWeight="black" color="#F8FAFC">
                                <HStack gap={3}>
                                    <Icon as={LuZap} color="var(--terminal-accent)" />
                                    <Text>{isEditMode ? 'Update Requirement' : 'Post New Requirement'}</Text>
                                </HStack>
                            </DialogTitle>
                            <Text color="whiteAlpha.600" mt={2} fontSize="sm">
                                Define the specific parameters for your next student attachment.
                            </Text>
                        </DialogHeader>

                        <DialogBody>
                            <VStack gap={8} align="stretch" mt={6}>
                                <Box>
                                    <Text color="indigo.400" fontSize="xs" fontWeight="bold" mb={3} letterSpacing="widest">CORE CONFIGURATION</Text>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>DESIGNATION</Text>
                                            <Input
                                                placeholder="e.g. Frontend Engineering Intern"
                                                bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="#F8FAFC"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </Box>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>DEPARTMENT</Text>
                                            <select
                                                style={{ width: '100%', height: '40px', padding: '0 10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }}
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
                                    <Text color="indigo.400" fontSize="xs" fontWeight="bold" mb={3} letterSpacing="widest">SPECIFICATIONS</Text>
                                    <VStack gap={4} align="stretch">
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>ROLE DESCRIPTION</Text>
                                            <Textarea
                                                placeholder="Define responsibilities..."
                                                rows={4} bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="#F8FAFC"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </Box>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>CORE REQUIREMENTS</Text>
                                            <Textarea
                                                placeholder="Defined skills/competencies..."
                                                rows={2} bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="white"
                                                value={formData.requirements}
                                                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                                _placeholder={{ color: "whiteAlpha.400" }}
                                            />
                                        </Box>
                                    </VStack>
                                </Box>

                                <Box>
                                    <Text color="indigo.400" fontSize="xs" fontWeight="bold" mb={3} letterSpacing="widest">PARAMETERS</Text>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>LOCATION</Text>
                                            <select
                                                style={{ width: '100%', height: '40px', padding: '0 10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }}
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
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>POSSIBLE START DATE</Text>
                                            <Input
                                                type="date" bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="white"
                                                value={formData.start_date || ''}
                                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                        </Box>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>DURATION</Text>
                                            <Input
                                                type="text" bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="white"
                                                value="3 Months"
                                                readOnly
                                                disabled
                                            />
                                        </Box>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>SLOTS AVAILABLE</Text>
                                            <Input
                                                type="number" bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="white"
                                                value={formData.vacancies || ''}
                                                onChange={e => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 0 })}
                                            />
                                        </Box>
                                        <Box>
                                            <Text color="whiteAlpha.600" fontSize="xs" mb={2}>APPLICATION SCAN DEADLINE</Text>
                                            <Input
                                                type="date" bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="white"
                                                value={formData.application_deadline}
                                                onChange={e => setFormData({ ...formData, application_deadline: e.target.value })}
                                            />
                                        </Box>
                                    </SimpleGrid>
                                </Box>

                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                    <Box bg="whiteAlpha.50" p={6} borderRadius="2xl" border="1px solid" borderColor="var(--terminal-border)">
                                        <Flex justify="space-between" align="center">
                                            <Box>
                                                <HStack>
                                                    <Icon as={LuCoins} color="yellow.400" />
                                                    <Text fontWeight="bold" color="#F8FAFC">Financial Stipend</Text>
                                                </HStack>
                                                <Text fontSize="xs" color="whiteAlpha.600" mt={1}>Provide a monthly allowance.</Text>
                                            </Box>
                                            <Switch
                                                colorPalette="indigo"
                                                checked={isPaid}
                                                onCheckedChange={(details: { checked: boolean }) => setIsPaid(details.checked)}
                                            />
                                        </Flex>
                                        {isPaid && (
                                            <Box mt={4}>
                                                <Text color="whiteAlpha.600" fontSize="xs" mb={2}>STIPEND AMOUNT (KES / Month)</Text>
                                                <Input
                                                    type="number" bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="white"
                                                    value={formData.stipend_amount || ''}
                                                    onChange={e => setFormData({ ...formData, stipend_amount: parseFloat(e.target.value) || 0 })}
                                                />
                                            </Box>
                                        )}
                                    </Box>

                                    <Box bg="whiteAlpha.50" p={6} borderRadius="2xl" border="1px solid" borderColor="var(--terminal-border)">
                                        <Flex justify="space-between" align="center">
                                            <Box>
                                                <HStack>
                                                    <Icon as={LuShield} color="var(--terminal-accent)" />
                                                    <Text fontWeight="bold" color="#F8FAFC">Student Fee</Text>
                                                </HStack>
                                                <Text fontSize="xs" color="whiteAlpha.600" mt={1}>Stipend/insurance fee.</Text>
                                            </Box>
                                            <Switch
                                                colorPalette="indigo"
                                                checked={formData.student_payment_required}
                                                onCheckedChange={(details: { checked: boolean }) => setFormData({ ...formData, student_payment_required: details.checked })}
                                            />
                                        </Flex>
                                        {formData.student_payment_required && (
                                            <Box mt={4}>
                                                <Text color="whiteAlpha.600" fontSize="xs" mb={2}>PAYMENT AMOUNT (KES)</Text>
                                                <Input
                                                    type="number" bg="whiteAlpha.50" borderColor="var(--terminal-border)" color="#F8FAFC"
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
                            </VStack>
                        </DialogBody>

                        <DialogFooter gap={4} mt={8}>
                            <Button variant="ghost" color="#F8FAFC" _hover={{ bg: "whiteAlpha.100" }} onClick={() => setIsOpen(false)}>Abort</Button>
                            <Button
                                flex={1} colorPalette="indigo" rounded="xl" h={12}
                                onClick={handleCreateOrUpdate}
                                disabled={!formData.title || !formData.description || !formData.location || !formData.department_id}
                            >
                                {isEditMode ? 'Save Updates' : 'Publish Posting'}
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger asChild>
                            <IconButton
                                variant="ghost"
                                size="sm"
                                position="absolute"
                                top={4}
                                right={4}
                                color="whiteAlpha.400"
                                _hover={{ color: "white" }}
                                onClick={() => setIsOpen(false)}
                            >
                                <LuX />
                            </IconButton>
                        </DialogCloseTrigger>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>

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
