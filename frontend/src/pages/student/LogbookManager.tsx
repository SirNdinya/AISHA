import React, { useState, useEffect } from 'react';
import {
    Box, Heading, Text, VStack, HStack,
    Button, Icon, Flex, Spinner,
    Container, Badge, Card,
    Input, Grid, Textarea, Select
} from '@chakra-ui/react';
import {
    LuCheck, LuArrowLeft, LuDownload,
    LuSave, LuCalendar
} from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { toaster } from '../../components/ui/toaster';

const LogbookManager: React.FC = () => {
    const navigate = useNavigate();
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Logbook State
    const [allWeeks, setAllWeeks] = useState<any[]>([]);
    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
    
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
                // Initialize Week 1 with current date as start_date (Monday)
                const today = new Date();
                const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // Adjust when day is Sunday
                const monday = new Date(today.setDate(diff));
                const saturday = new Date(monday);
                saturday.setDate(monday.getDate() + 5);
                
                setEntry({
                    ...entry,
                    week_number: 1,
                    start_date: monday.toISOString().split('T')[0],
                    end_date: saturday.toISOString().split('T')[0]
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
            newStart.setDate(newStart.getDate() + 2); // Monday
            let newEnd = new Date(newStart);
            newEnd.setDate(newEnd.getDate() + 5); // Saturday
            
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
            const res = await apiClient.post('/placements/logbook', payload);
            
            if (isSubmitting) {
                toaster.create({ title: 'Logbook Signed & Submitted', type: 'success' });
            } else {
                toaster.create({ title: 'Draft Saved Successfully', type: 'success' });
            }
            
            // Refresh data
            const resData = await apiClient.get('/placements/logbook');
            setAllWeeks(resData.data.data);
            loadWeekData(resData.data.data, selectedWeekNum);
        } catch (error) {
            toaster.create({ title: 'Sync Failed', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            toaster.create({ title: 'Generating PDF...', type: 'info' });
            // Download the specific week or all? Let's just download the specific week
            const response = await apiClient.get(`/placements/logbook/export?week_number=${selectedWeekNum}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Logbook_Week_${selectedWeekNum}.pdf`);
            document.body.appendChild(link);
            link.click();
            toaster.create({ title: 'Export Successful', type: 'success' });
        } catch (error) {
            toaster.create({ title: 'Export Failed', type: 'error' });
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        setEntry({ ...entry, [field]: value });
    };
    
    // Auto-calculate dates for fields
    const getFormattedDateForDay = (dayOffset: number) => {
        if (!entry.start_date) return '';
        const d = new Date(entry.start_date);
        d.setDate(d.getDate() + dayOffset);
        return d.toLocaleDateString();
    };

    if (isLoading) return <Flex h="60vh" align="center" justify="center"><Spinner color="blue.400" /></Flex>;

    const isReadOnly = entry.status !== 'DRAFT';

    return (
        <Box bg="gray.50" minH="100vh" pb={12}>
            {/* Top Ribbon / Header */}
            <Box bg="white" borderBottom="1px solid" borderColor="gray.200" position="sticky" top={0} zIndex={100} py={3} boxShadow="sm">
                <Container maxW="container.lg">
                    <Flex justify="space-between" align="center">
                        <HStack gap={4}>
                            <Button
                                aria-label="Back"
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                            >
                                <LuArrowLeft /> Back
                            </Button>
                            <VStack align="start" gap={0}>
                                <Heading size="md" color="gray.800">Logbook Manager</Heading>
                                <HStack>
                                    <Text fontSize="xs" color="gray.500">Record your weekly attachment progress</Text>
                                    <Badge colorPalette={entry.status === 'DRAFT' ? 'gray' : entry.status === 'COMPLETED' ? 'green' : 'orange'} size="xs">
                                        {entry.status}
                                    </Badge>
                                </HStack>
                            </VStack>
                        </HStack>
                        <HStack gap={3}>
                            <Button size="sm" variant="outline" onClick={() => handleSave(false)} loading={isSaving} disabled={isReadOnly}>
                                <LuSave /> Save Draft
                            </Button>
                            <Button size="sm" colorPalette="blue" onClick={() => handleSave(true)} loading={isSaving} disabled={isReadOnly}>
                                <LuCheck /> Sign & Submit
                            </Button>
                            <Button size="sm" variant="surface" colorPalette="gray" onClick={handleDownloadPDF}>
                                <LuDownload /> Export PDF
                            </Button>
                        </HStack>
                    </Flex>
                </Container>
            </Box>

            <Container maxW="container.lg" pt={8}>
                <Grid templateColumns={{ base: "1fr", lg: "1fr 4fr" }} gap={8} alignItems="start">

                    {/* Left Sidebar: Week Selector */}
                    <Box bg="white" p={4} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200">
                        <HStack mb={4}>
                            <Icon as={LuCalendar} color="blue.500" />
                            <Heading size="xs">WEEKS</Heading>
                        </HStack>
                        <VStack align="stretch" gap={2}>
                            {[...Array(12).keys()].map(i => {
                                const w = i + 1;
                                const weekData = allWeeks.find(week => week.week_number === w);
                                const isActive = selectedWeekNum === w;
                                return (
                                    <Button 
                                        key={w} 
                                        variant={isActive ? "solid" : "ghost"}
                                        colorPalette={isActive ? "blue" : "gray"}
                                        justifyContent="space-between"
                                        onClick={() => loadWeekData(allWeeks, w)}
                                        size="sm"
                                        w="full"
                                    >
                                        Week {w}
                                        {weekData && <Badge size="xs" colorPalette={weekData.status === 'COMPLETED' ? 'green' : 'orange'}>{weekData.status.substring(0,1)}</Badge>}
                                    </Button>
                                );
                            })}
                        </VStack>
                    </Box>

                    {/* Main Logbook Area */}
                    <VStack gap={6} align="stretch">
                        
                        {/* Weekly Progress Chart */}
                        <Box bg="white" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                            <Box bg="blue.600" color="white" p={4} textAlign="center">
                                <Heading size="md">WEEKLY PROGRESS CHART</Heading>
                            </Box>
                            
                            <Box p={6}>
                                <Flex justify="space-between" mb={6}>
                                    <HStack>
                                        <Text fontWeight="bold" color="gray.600">DATE: From:</Text>
                                        <Input type="date" size="sm" w="150px" value={entry.start_date} onChange={e => handleFieldChange('start_date', e.target.value)} disabled={isReadOnly} />
                                        <Text fontWeight="bold" color="gray.600">To:</Text>
                                        <Input type="date" size="sm" w="150px" value={entry.end_date} onChange={e => handleFieldChange('end_date', e.target.value)} disabled={isReadOnly} />
                                    </HStack>
                                    <Heading size="sm" color="blue.600">WEEK {entry.week_number}</Heading>
                                </Flex>

                                <Box border="1px solid" borderColor="gray.300" borderRadius="md" overflow="hidden">
                                    {/* Table Header */}
                                    <Grid templateColumns="120px 1fr 150px" bg="gray.100" borderBottom="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700" p={3}>
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
                                                <Text fontWeight="bold" fontSize="sm">{row.day}</Text>
                                                <Text fontSize="xs" color="gray.500">{getFormattedDateForDay(row.offset)}</Text>
                                            </VStack>
                                            <Box p={2} borderRight="1px solid" borderColor="gray.200">
                                                <Textarea 
                                                    value={entry[row.key]} 
                                                    onChange={(e) => handleFieldChange(row.key, e.target.value)}
                                                    placeholder="Enter details here..."
                                                    variant="unstyled"
                                                    resize="none"
                                                    minH="80px"
                                                    size="sm"
                                                    disabled={isReadOnly}
                                                />
                                            </Box>
                                            <Flex align="center" justify="center" p={3} opacity={0.3} bg="gray.50">
                                                <Text fontSize="xs" fontStyle="italic">Signed digitally</Text>
                                            </Flex>
                                        </Grid>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Trainee's Weekly Report */}
                        <Box bg="white" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                            <Box bg="blue.600" color="white" p={4} textAlign="center">
                                <Heading size="md">TRAINEE'S WEEKLY REPORT</Heading>
                                <Text fontSize="xs" opacity={0.8}>(A summary of the whole week, sketches/diagrams may be attached where necessary)</Text>
                            </Box>
                            
                            <Box p={6}>
                                <Grid templateColumns="120px 1fr" gap={4} mb={6}>
                                    <VStack align="start" justify="center" p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                        <Text fontWeight="bold" fontSize="sm">SATURDAY</Text>
                                        <Text fontSize="xs" color="gray.500">{getFormattedDateForDay(5)}</Text>
                                    </VStack>
                                    <Textarea 
                                        value={entry.saturday_description} 
                                        onChange={(e) => handleFieldChange('saturday_description', e.target.value)}
                                        placeholder="Saturday activities (if any)..."
                                        minH="80px"
                                        disabled={isReadOnly}
                                    />
                                </Grid>

                                <Box>
                                    <Text fontWeight="bold" mb={2} color="gray.700">Weekly Summary:</Text>
                                    <Textarea 
                                        value={entry.weekly_summary} 
                                        onChange={(e) => handleFieldChange('weekly_summary', e.target.value)}
                                        placeholder="Provide a comprehensive summary of the week's accomplishments and challenges..."
                                        minH="200px"
                                        disabled={isReadOnly}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Supervisor Confirmations (Read Only for Student) */}
                        <Box bg="white" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                            <Box bg="gray.800" color="white" p={4} textAlign="center">
                                <Heading size="md">WEEKLY CONFIRMATION BY SUPERVISORS</Heading>
                            </Box>
                            
                            <Box p={6}>
                                <VStack gap={6} align="stretch">
                                    <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                        <Text fontWeight="bold" color="blue.800" mb={2}>Comments by Industry-based Supervisor:</Text>
                                        <Text p={3} bg="white" minH="80px" borderRadius="sm" fontStyle={entry.industry_supervisor_comments ? "normal" : "italic"} color={entry.industry_supervisor_comments ? "gray.800" : "gray.400"}>
                                            {entry.industry_supervisor_comments || "Pending evaluation..."}
                                        </Text>
                                        <HStack justify="space-between" mt={4}>
                                            <Badge colorPalette={entry.industry_supervisor_signature_date ? "green" : "gray"}>
                                                {entry.industry_supervisor_signature_date ? "SIGNED DIGITALLY" : "PENDING SIGNATURE"}
                                            </Badge>
                                            {entry.industry_supervisor_signature_date && <Text fontSize="xs">Date: {new Date(entry.industry_supervisor_signature_date).toLocaleString()}</Text>}
                                        </HStack>
                                    </Box>

                                    <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                        <Text fontWeight="bold" color="purple.800" mb={2}>Comments by Assessing University Supervisor:</Text>
                                        <Text p={3} bg="white" minH="80px" borderRadius="sm" fontStyle={entry.university_supervisor_comments ? "normal" : "italic"} color={entry.university_supervisor_comments ? "gray.800" : "gray.400"}>
                                            {entry.university_supervisor_comments || "Pending evaluation..."}
                                        </Text>
                                        <HStack justify="space-between" mt={4}>
                                            <Badge colorPalette={entry.university_supervisor_signature_date ? "green" : "gray"}>
                                                {entry.university_supervisor_signature_date ? "SIGNED DIGITALLY" : "PENDING SIGNATURE"}
                                            </Badge>
                                            {entry.university_supervisor_signature_date && <Text fontSize="xs">Date: {new Date(entry.university_supervisor_signature_date).toLocaleString()}</Text>}
                                        </HStack>
                                    </Box>
                                </VStack>
                            </Box>
                        </Box>

                    </VStack>
                </Grid>
            </Container>
        </Box>
    );
};

export default LogbookManager;
