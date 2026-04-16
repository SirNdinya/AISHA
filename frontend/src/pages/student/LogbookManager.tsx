import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Heading, Text, VStack, HStack,
    Button, Flex, Spinner,
    Container, Badge,
    Input, Grid, Textarea
} from '@chakra-ui/react';
import {
    LuCheck, LuArrowLeft, LuDownload,
    LuSave
} from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { toaster } from '../../components/ui/toaster';
import type { RootState } from '../../store';

const LogbookManager: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useSelector((state: RootState) => state.student);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Logbook State
    const [allWeeks, setAllWeeks] = useState<any[]>([]);
    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
    
    // Export State
    const [isExporting, setIsExporting] = useState(false);
    
    // Current Draft State
    const [entry, setEntry] = useState<any>({
        week_number: 1,
        start_date: '',
        end_date: '',
        monday_description: '',
        tuesday_description: '',
        wednesday_description: '',
        thursday_description: '',
        friday_description: '',
        saturday_description: '',
        weekly_summary: '',
        status: 'DRAFT'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/placements/logbook');
            const data = res.data.data;
            setAllWeeks(data);
            
            // If data exists, pick the most recent or week 1
            if (data.length > 0) {
                const maxWeek = Math.max(...data.map((d: any) => d.week_number));
                loadWeekData(data, maxWeek);
            } else {
                const pStartDateStr = res.data.placement_start_date || new Date().toISOString();
                const today = new Date(pStartDateStr);
                const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // Adjust when day is Sunday
                const monday = new Date(today.setDate(diff));
                const friday = new Date(monday);
                friday.setDate(monday.getDate() + 4);
                
                setEntry({
                    ...entry,
                    week_number: 1,
                    start_date: monday.toISOString().split('T')[0],
                    end_date: friday.toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toaster.create({ title: 'Failed to load logbooks', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const loadWeekData = (data: any[], weekNum: number) => {
        setSelectedWeekNum(weekNum);
        const existingWeek = data.find(d => d.week_number === weekNum);
        if (existingWeek) {
            setEntry(existingWeek);
        } else {
            // Predict what start date should be if they add a new week
            const lastWeek = data.reduce((prev, current) => (prev.week_number > current.week_number) ? prev : current, { week_number: 0, end_date: new Date() });
            let newStart = new Date(lastWeek.end_date);
            newStart.setDate(newStart.getDate() + 3); // Monday (Since end_date is Friday, +3 is Monday)
            let newEnd = new Date(newStart);
            newEnd.setDate(newEnd.getDate() + 4); // Friday
            
            setEntry({
                week_number: weekNum,
                start_date: newStart.toISOString().split('T')[0],
                end_date: newEnd.toISOString().split('T')[0],
                monday_description: '',
                tuesday_description: '',
                wednesday_description: '',
                thursday_description: '',
                friday_description: '',
                saturday_description: '',
                weekly_summary: '',
                status: 'DRAFT'
            });
        }
    };

    const handleSave = async (isSubmitting: boolean = false) => {
        setIsSaving(true);
        try {
            const payload = {
                ...entry,
                is_submitting: isSubmitting
            };
            await apiClient.post('/placements/logbook', payload);
            
            if (isSubmitting) {
                toaster.create({ title: 'Logbook Confirmed & Sent', type: 'success' });
            } else {
                toaster.create({ title: 'Draft Saved Successfully', type: 'success' });
            }
            
            // Refresh data
            const resData = await apiClient.get('/placements/logbook');
            setAllWeeks(resData.data.data);
            loadWeekData(resData.data.data, selectedWeekNum);
        } catch (error) {
            toaster.create({ title: 'Update Failed', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        const newEntry = { ...entry, [field]: value };
        setEntry(newEntry);

        if (newEntry.status === 'DRAFT' || !newEntry.status) {
            if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
            autoSaveTimeout.current = setTimeout(() => {
                executeAutoSave(newEntry);
            }, 1000);
        }
    };

    const executeAutoSave = async (payloadToSave: any) => {
        setIsAutoSaving(true);
        try {
            const payload = { ...payloadToSave, is_submitting: false };
            await apiClient.post('/placements/logbook', payload);
        } catch (error) {
            console.error('Autosave failed:', error);
        } finally {
            setIsAutoSaving(false);
        }
    };

    const handleDownloadPDF = async (mode: 'current' | 'all' | 'range', start?: number, end?: number) => {
        try {
            setIsExporting(true);
            let query = '';
            if (mode === 'current') query = `?week_number=${selectedWeekNum}`;
            else if (mode === 'range' && start && end) query = `?start_week=${start}&end_week=${end}`;
            
            const response = await apiClient.get(`/placements/logbook/export${query}`, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = mode === 'current' ? `Logbook_Week_${selectedWeekNum}.pdf` : `Full_Logbook_Archive.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            toaster.create({ title: 'Export Successful', type: 'success' });
        } catch (error) {
            toaster.create({ title: 'Export Failed', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };


    const getFormattedDateForDay = (dayOffset: number) => {
        if (!entry.start_date) return '';
        const d = new Date(entry.start_date);
        d.setDate(d.getDate() + dayOffset);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        const dateStr = d.toLocaleDateString(undefined, options);
        
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        
        return isToday ? `${dateStr} (Today)` : dateStr;
    };

    if (isLoading) return <Flex h="60vh" align="center" justify="center"><Spinner color="indigo.400" /></Flex>;

    const isReadOnly = entry.status !== 'DRAFT';

    return (
        <Box bg="var(--terminal-bg)" minH="101vh" pb={12}>
            {/* Top Ribbon / Header */}
            <Box bg="var(--terminal-card)" borderBottom="1px solid" borderColor="var(--terminal-border)" position="sticky" top={0} zIndex={100} py={3} boxShadow="sm">
                <Container maxW="container.lg">
                    <Flex justify="space-between" align="center">
                        <HStack gap={4}>
                            <Button
                                variant="ghost"
                                color="#F8FAFC"
                                _hover={{ bg: "whiteAlpha.100" }}
                                size="sm"
                                onClick={() => navigate(-1)}
                            >
                                <LuArrowLeft /> Back
                            </Button>
                            <VStack align="start" gap={0}>
                                <Heading size="md" color="#F8FAFC" fontWeight="black">Logbook Manager</Heading>
                                <HStack>
                                    <Text fontSize="xs" color="var(--terminal-accent)">Record your weekly attachment progress</Text>
                                    <Badge colorPalette={entry.status === 'ARCHIVED' ? 'green' : entry.status === 'DRAFT' ? 'gray' : 'orange'} size="xs" variant="solid" px={2} borderRadius="full">
                                        {entry.status === 'ARCHIVED' ? 'VERIFIED ARCHIVE' : entry.status}
                                    </Badge>
                                </HStack>
                            </VStack>
                        </HStack>
                        <HStack gap={3}>
                            <Button size="sm" variant="outline" color="whiteAlpha.700" borderColor="var(--terminal-border)" _hover={{ bg: "whiteAlpha.100" }} onClick={() => handleSave(false)} loading={isSaving} disabled={isReadOnly}>
                                <LuSave /> Save Draft
                            </Button>
                            <Button size="sm" bg="var(--terminal-accent)" color="black" fontWeight="bold" onClick={() => handleSave(true)} loading={isSaving} disabled={isReadOnly}>
                                <LuCheck /> Confirm & Send
                            </Button>
                            <HStack gap={1} bg="whiteAlpha.50" p={1} borderRadius="md" border="1px solid" borderColor="var(--terminal-border)">
                                <Button 
                                    size="xs" 
                                    variant="subtle" 
                                    colorPalette="cyan" 
                                    onClick={() => handleDownloadPDF('current')}
                                    disabled={isExporting || entry.status === 'DRAFT'}
                                >
                                    <LuDownload /> Week {selectedWeekNum}
                                </Button>
                                <Box w="1px" h="15px" bg="whiteAlpha.100" />
                                <Button 
                                    size="xs" 
                                    variant="subtle" 
                                    colorPalette="purple" 
                                    onClick={() => {
                                        const r = window.prompt("Enter range (e.g. 1-4):");
                                        if (r && r.includes('-')) {
                                            const [s, e] = r.split('-').map(Number);
                                            handleDownloadPDF('range', s, e);
                                        }
                                    }}
                                    disabled={isExporting || allWeeks.length === 0}
                                >
                                    <LuDownload /> Range
                                </Button>
                                <Box w="1px" h="15px" bg="whiteAlpha.100" />
                                <Button 
                                    size="xs" 
                                    variant="subtle" 
                                    colorPalette="green" 
                                    onClick={() => handleDownloadPDF('all')}
                                    disabled={isExporting || allWeeks.length === 0}
                                >
                                    <LuDownload /> Full Archive
                                </Button>
                            </HStack>
                        </HStack>
                    </Flex>
                </Container>
            </Box>

            <Container maxW="container.lg" pt={8}>
                <VStack gap={8} alignItems="stretch">

                    {/* Main Logbook Area */}
                    <VStack gap={6} align="stretch">
                        
                        {/* Weekly Progress Chart */}
                        <Box bg="white" color="slate.900" borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="gray.200" overflow="hidden" position="relative">
                            {entry.status === 'ARCHIVED' && (
                                <Box 
                                    position="absolute" 
                                    top="15px" 
                                    right="-40px" 
                                    bg="green.500" 
                                    color="black" 
                                    px={12} 
                                    py={1} 
                                    transform="rotate(45deg)" 
                                    fontSize="xs" 
                                    fontWeight="black"
                                    zIndex={10}
                                    boxShadow="md"
                                >
                                    ARCHIVED
                                </Box>
                            )}
                            <Box bg="var(--terminal-accent)" color="black" p={4}>
                                <Flex justify="space-between" align="center">
                                    <VStack align="start" gap={0}>
                                        <Heading size="md" fontWeight="black">{entry.status === 'ARCHIVED' ? "VERIFIED LOGBOOK ARCHIVE" : "WEEKLY PROGRESS CHART"}</Heading>
                                        <HStack gap={4} mt={1}>
                                            <Text fontSize="xs" fontWeight="bold" opacity={0.9}>
                                                STUDENT: {profile?.first_name} {profile?.last_name}
                                            </Text>
                                            <Text fontSize="xs" fontWeight="bold" opacity={0.9}>
                                                REG NO: {profile?.admission_number}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <Box px={3} py={1} borderRadius="md" bg="blackAlpha.200" border="1px solid" borderColor="blackAlpha.300">
                                        <Text fontSize="xs" fontWeight="black">OFFICIAL RECORD</Text>
                                    </Box>
                                </Flex>
                            </Box>
                            
                            <Box p={6}>
                                <Flex justify="space-between" mb={6}>
                                    <HStack>
                                        <Text fontWeight="bold" color="black">DATE: From:</Text>
                                        <Input type="date" size="sm" w="150px" bg="gray.50" color="#0F172A" borderColor="gray.200" value={entry.start_date} onChange={e => handleFieldChange('start_date', e.target.value)} disabled={isReadOnly} />
                                        <Text fontWeight="bold" color="black">To:</Text>
                                        <Input type="date" size="sm" w="150px" bg="white" color="#0F172A" value={entry.end_date} onChange={e => handleFieldChange('end_date', e.target.value)} disabled={isReadOnly} />
                                    </HStack>
                                    <Heading size="sm" color="var(--terminal-accent)" fontWeight="black">WEEK {entry.week_number}</Heading>
                                </Flex>

                                <Box bg="white" border="1px solid" borderColor="gray.300" borderRadius="md" overflow="hidden" boxShadow="sm">
                                    {/* Table Header */}
                                    <Grid templateColumns="120px 1fr 150px" bg="gray.100" borderBottom="2px solid" borderColor="gray.300" fontWeight="bold" color="black" p={3}>
                                        <Text>DAY & DATE</Text>
                                        <Text>DESCRIPTION OF WORK DONE</Text>
                                        <Text fontSize="xs" textAlign="center">Industry Supervisor Signature</Text>
                                    </Grid>

                                    {/* Monday-Friday Rows */}
                                    {[
                                        { day: 'MONDAY', key: 'monday_description', offset: 0 },
                                        { day: 'TUESDAY', key: 'tuesday_description', offset: 1 },
                                        { day: 'WEDNESDAY', key: 'wednesday_description', offset: 2 },
                                        { day: 'THURSDAY', key: 'thursday_description', offset: 3 },
                                        { day: 'FRIDAY', key: 'friday_description', offset: 4 },
                                    ].map((row, idx) => (
                                        <Grid key={row.day} templateColumns="120px 1fr 150px" borderBottom={idx < 4 ? "1px solid" : "none"} borderColor="gray.200">
                                            <VStack align="start" justify="center" p={3} borderRight="1px solid" borderColor="gray.200" bg="gray.50">
                                                <Text fontWeight="black" fontSize="sm" color="black">{row.day}</Text>
                                                <Text fontSize="xs" color="gray.600">{getFormattedDateForDay(row.offset)}</Text>
                                            </VStack>
                                            <Box p={2} borderRight="1px solid" borderColor="gray.200">
                                                <Textarea 
                                                    value={entry[row.key]} 
                                                    onChange={(e) => handleFieldChange(row.key, e.target.value)}
                                                    placeholder="Enter details here..."
                                                    resize="none"
                                                    minH="80px"
                                                    size="md"
                                                    color="black"
                                                    bg="white"
                                                    _focus={{ bg: "gray.50", borderColor: "indigo.500" }}
                                                    _readOnly={{ bg: "transparent", cursor: "default", opacity: 1, borderColor: "transparent" }}
                                                    readOnly={isReadOnly}
                                                />
                                            </Box>
                                            <Flex align="center" justify="center" p={3} bg="white">
                                                <Text fontSize="xs" fontStyle="italic" color="gray.400">Signed digitally</Text>
                                            </Flex>
                                        </Grid>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Trainee's Weekly Report */}
                        <Box bg="white" color="slate.900" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                            <Box bg="var(--terminal-accent)" color="black" p={4} textAlign="center">
                                <Heading size="md" fontWeight="black">TRAINEE'S WEEKLY REPORT</Heading>
                                <Text fontSize="xs" opacity={0.8} fontWeight="bold">(A summary of the whole week, sketches/diagrams may be attached where necessary)</Text>
                            </Box>
                            
                            <Box p={6}>
                                <Box>
                                    <Text fontWeight="bold" mb={2} color="var(--terminal-accent)">Weekly Summary:</Text>
                                    <Textarea 
                                        value={entry.weekly_summary} 
                                        onChange={(e) => handleFieldChange('weekly_summary', e.target.value)}
                                        placeholder="Provide a comprehensive summary of the week's accomplishments and challenges..."
                                        minH="200px"
                                        size="md"
                                        color="#0F172A"
                                        bg="gray.50"
                                        borderColor="gray.200"
                                        _focus={{ bg: "white", borderColor: "indigo.500" }}
                                        _readOnly={{ bg: "transparent", cursor: "default", opacity: 1, borderColor: "transparent" }}
                                        readOnly={isReadOnly}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Supervisor Confirmations (Read Only for Student) */}
                        <Box bg="var(--terminal-card)" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="var(--terminal-border)" overflow="hidden">
                            <Box bg="whiteAlpha.50" color="var(--terminal-accent)" p={4} textAlign="center">
                                <Heading size="md" fontWeight="black">WEEKLY CONFIRMATION BY SUPERVISORS</Heading>
                            </Box>
                            
                            <Box p={6}>
                                <VStack gap={6} align="stretch">
                                    <Box p={4} bg="whiteAlpha.50" borderRadius="md" border="1px solid" borderColor="var(--terminal-border)">
                                        <Text fontWeight="bold" color="var(--terminal-accent)" mb={2}>Comments by Industry-based Supervisor:</Text>
                                        <Text p={3} bg="blackAlpha.200" minH="80px" borderRadius="sm" fontStyle={entry.industry_supervisor_comments ? "normal" : "italic"} color={entry.industry_supervisor_comments ? "#F8FAFC" : "whiteAlpha.400"}>
                                            {entry.industry_supervisor_comments || "Pending evaluation..."}
                                        </Text>
                                        <HStack justify="space-between" mt={4}>
                                            <Badge colorPalette={entry.industry_supervisor_signature_date ? "green" : "gray"} variant="solid">
                                                {entry.industry_supervisor_signature_date ? "SIGNED DIGITALLY" : "PENDING SIGNATURE"}
                                            </Badge>
                                            {entry.industry_supervisor_signature_date && <Text fontSize="xs" color="whiteAlpha.600">Date: {new Date(entry.industry_supervisor_signature_date).toLocaleString()}</Text>}
                                        </HStack>
                                    </Box>

                                    <Box p={4} bg="whiteAlpha.50" borderRadius="md" border="1px solid" borderColor="var(--terminal-border)">
                                        <Text fontWeight="bold" color="purple.400" mb={2}>Comments by Assessing University Supervisor:</Text>
                                        <Text p={3} bg="blackAlpha.200" minH="80px" borderRadius="sm" fontStyle={entry.university_supervisor_comments ? "normal" : "italic"} color={entry.university_supervisor_comments ? "#F8FAFC" : "whiteAlpha.400"}>
                                            {entry.university_supervisor_comments || "Pending evaluation..."}
                                        </Text>
                                        <HStack justify="space-between" mt={4}>
                                            <Badge colorPalette={entry.university_supervisor_signature_date ? "green" : "gray"} variant="solid">
                                                {entry.university_supervisor_signature_date ? "SIGNED DIGITALLY" : "PENDING SIGNATURE"}
                                            </Badge>
                                            {entry.university_supervisor_signature_date && <Text fontSize="xs" color="whiteAlpha.600">Date: {new Date(entry.university_supervisor_signature_date).toLocaleString()}</Text>}
                                        </HStack>
                                    </Box>
                                </VStack>
                            </Box>
                        </Box>

                    </VStack>
                    
                    {/* Horizontal Week Navigator */}
                    <Flex justify="center" mt={6} pb={6}>
                        <HStack gap={2} wrap="wrap">
                            {[...Array(12).keys()].map(i => {
                                const w = i + 1;
                                const weekData = allWeeks.find(week => week.week_number === w);
                                
                                // Auto-extend the week count 
                                const maxWeekDataObj = allWeeks.length > 0 ? allWeeks.reduce((prev, current) => (prev.week_number > current.week_number) ? prev : current) : null;
                                const maxWeek = maxWeekDataObj ? maxWeekDataObj.week_number : 1;
                                const shouldAllowNext = maxWeekDataObj && (maxWeekDataObj.status === 'COMPLETED' || maxWeekDataObj.status === 'SUBMITTED');
                                
                                const isAccessible = w <= maxWeek + (shouldAllowNext ? 1 : 0);
                                
                                if (!isAccessible) return null;

                                const isActive = selectedWeekNum === w;
                                return (
                                    <Button
                                        key={w}
                                        variant={isActive ? "solid" : "ghost"}
                                        colorPalette={isActive ? "orange" : weekData?.status === 'COMPLETED' ? "green" : "gray"}
                                        onClick={() => loadWeekData(allWeeks, w)}
                                        size="xs"
                                        borderRadius="full"
                                        px={4}
                                        fontWeight="black"
                                        shadow={isActive ? "md" : "none"}
                                        _hover={{ bg: isActive ? "var(--terminal-accent)" : "whiteAlpha.100" }}
                                    >
                                        WEEK {w}
                                    </Button>
                                );
                            })}
                        </HStack>
                    </Flex>
                </VStack>
            </Container>
        </Box>
    );
};

export default LogbookManager;
