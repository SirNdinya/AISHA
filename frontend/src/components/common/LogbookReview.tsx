import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Heading, Text, VStack, HStack,
    Button, Flex, Spinner,
    Container, Badge, AvatarRoot, AvatarFallback,
    Input, Grid, Textarea, Icon
} from '@chakra-ui/react';
import {
    LuCheck, LuArrowLeft, LuDownload, LuPen
} from 'react-icons/lu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { toaster } from '../../components/ui/toaster';

interface LogbookReviewProps {
    role: 'COMPANY' | 'INSTITUTION';
}

const LogbookReview: React.FC<LogbookReviewProps> = ({ role }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentIdParam = searchParams.get('student_id');

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Logbook State
    const [placementDetail, setPlacementDetail] = useState<any>(null);
    const [allWeeks, setAllWeeks] = useState<any[]>([]);
    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
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
    
    // Export State
    const [isExporting, setIsExporting] = useState(false);

    // Comments State
    const [currentComment, setCurrentComment] = useState('');
    const commentSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!studentIdParam) {
            navigate(-1);
            return;
        }
        fetchData();
    }, [studentIdParam]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // First get the placement mapping to find placement_id from student_id
            const res = await apiClient.get(role === 'COMPANY' ? '/placements/my-placements' : '/placements/all');
            const placements = res.data.data;
            const placement = placements.find((p: any) => p.student_id === studentIdParam);

            if (!placement) {
                toaster.create({ title: "Student logbook not found", type: 'error' });
                navigate(-1);
                return;
            }

            setPlacementDetail(placement);

            // Fetch logbooks
            await fetchLogbooks(placement.id, placement.start_date);

        } catch (error) {
            console.error('Fetch error:', error);
            toaster.create({ title: 'Failed to load logbooks', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLogbooks = async (placementId: string, placementStartDate: string) => {
        try {
            const res = await apiClient.get(`/placements/logbook?placement_id=${placementId}`);
            const data = res.data.data;
            setAllWeeks(data);
            
            if (data.length > 0) {
                const maxWeek = Math.max(...data.map((d: any) => d.week_number));
                loadWeekData(data, maxWeek);
            } else {
                const pStartDateStr = placementStartDate || new Date().toISOString();
                const today = new Date(pStartDateStr);
                const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // Monday
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
        } catch(error) {
            console.error(error);
        }
    };

    const loadWeekData = (data: any[], weekNum: number) => {
        setSelectedWeekNum(weekNum);
        const existingWeek = data.find(d => d.week_number === weekNum);
        if (existingWeek) {
            setEntry(existingWeek);
            if (role === 'COMPANY') {
                setCurrentComment(existingWeek.industry_supervisor_comments || '');
            } else {
                setCurrentComment(existingWeek.university_supervisor_comments || '');
            }
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
            setCurrentComment('');
        }
    };

    const handleSignLogbook = async () => {
        if (!entry || !entry.id) {
            toaster.create({ title: 'Student has not initialized this week yet.', type: 'warning'});
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.post('/placements/logbook/sign', {
                logbook_id: entry.id,
                comments: currentComment || ''
            });
            toaster.create({ title: 'Logbook Signed Successfully', type: 'success' });
            if (placementDetail) fetchLogbooks(placementDetail.id, placementDetail.start_date);
        } catch (error: any) {
            toaster.create({ 
                title: 'Signature Failed', 
                description: error.response?.data?.message || 'Action restricted',
                type: 'error' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCommentChange = (value: string) => {
        setCurrentComment(value);
        if (!entry || !entry.id) return;
        
        if (commentSaveTimeout.current) clearTimeout(commentSaveTimeout.current);
        commentSaveTimeout.current = setTimeout(async () => {
            try {
                await apiClient.post('/placements/logbook/draft-comment', {
                    logbook_id: entry.id,
                    comments: value
                });
            } catch (error) {
                console.error("Autosave comment failed:", error);
            }
        }, 1500);
    };

    const handleDownloadPDF = async (mode: 'current' | 'all' | 'range', start?: number, end?: number) => {
        try {
            setIsExporting(true);
            let query = `?placement_id=${placementDetail?.id}&`;
            if (mode === 'current') query += `week_number=${selectedWeekNum}`;
            else if (mode === 'range' && start && end) query += `start_week=${start}&end_week=${end}`;
            
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

    return (
        <Box bg="gray.50" minH="100vh" pb={12}>
            {/* Top Ribbon / Header / SAME AS LOGBOOKMANAGER */}
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
                                <Heading size="md" color="slate.900">Supervisory Dashboard</Heading>
                                <HStack>
                                    <Text fontSize="xs" color="slate.500">Logbook Manager (Read-Only)</Text>
                                    <Badge colorPalette={entry.status === 'ARCHIVED' ? 'green' : entry.status === 'DRAFT' ? 'gray' : 'orange'} size="xs" variant="solid" px={2} borderRadius="full">
                                        {entry.status === 'ARCHIVED' ? 'VERIFIED ARCHIVE' : entry.status}
                                    </Badge>
                                </HStack>
                            </VStack>
                        </HStack>
                        <HStack gap={3}>
                            <HStack gap={1} bg="gray.100" p={1} borderRadius="md" border="1px solid" borderColor="gray.200">
                                <Button 
                                    size="xs" 
                                    variant="subtle" 
                                    colorPalette="indigo" 
                                    color="indigo.700"
                                    onClick={() => handleDownloadPDF('current')}
                                    disabled={isExporting || entry.status === 'DRAFT'}
                                >
                                    <LuDownload /> Week {selectedWeekNum}
                                </Button>
                                <Box w="1px" h="15px" bg="gray.300" />
                                <Button 
                                    size="xs" 
                                    variant="subtle" 
                                    colorPalette="purple" 
                                    color="purple.700"
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
                                <Box w="1px" h="15px" bg="gray.300" />
                                <Button 
                                    size="xs" 
                                    variant="subtle" 
                                    colorPalette="green" 
                                    color="green.700"
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
                        <Box bg="white" borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="gray.200" overflow="hidden" position="relative">
                            {entry.status === 'ARCHIVED' && (
                                <Box 
                                    position="absolute" 
                                    top="15px" 
                                    right="-40px" 
                                    bg="green.500" 
                                    color="white" 
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
                            <Box bg={entry.status === 'ARCHIVED' ? "green.600" : "indigo.600"} color="white" p={4}>
                                <Flex justify="space-between" align="center">
                                    <HStack gap={3}>
                                        <AvatarRoot size="md">
                                            <AvatarFallback name={`${placementDetail?.first_name} ${placementDetail?.last_name}`} />
                                        </AvatarRoot>
                                        <VStack align="start" gap={0}>
                                            <Heading size="md">{entry.status === 'ARCHIVED' ? "VERIFIED LOGBOOK ARCHIVE" : "WEEKLY PROGRESS CHART"}</Heading>
                                            <HStack gap={4} mt={1}>
                                                <Text fontSize="xs" fontWeight="bold" opacity={0.9}>
                                                    STUDENT: {placementDetail?.first_name} {placementDetail?.last_name}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </HStack>
                                    <Box px={3} py={1} borderRadius="md" bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300">
                                        <Text fontSize="xs" fontWeight="black">OFFICIAL RECORD</Text>
                                    </Box>
                                </Flex>
                            </Box>
                            
                            <Box p={6}>
                                <Flex justify="space-between" mb={6}>
                                    <HStack>
                                        <Text fontWeight="bold" color="slate.600">DATE: From:</Text>
                                        <Input type="date" size="sm" w="150px" color="#0F172A" bg="white" value={entry.start_date.split('T')[0]} readOnly disabled />
                                        <Text fontWeight="bold" color="slate.600">To:</Text>
                                        <Input type="date" size="sm" w="150px" color="#0F172A" bg="white" value={entry.end_date.split('T')[0]} readOnly disabled />
                                    </HStack>
                                    <Heading size="sm" color="indigo.600">WEEK {entry.week_number}</Heading>
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
                                            <Box p={2} borderRight="1px solid" borderColor="gray.300">
                                                <Textarea 
                                                    value={entry[row.key] || ''} 
                                                    readOnly 
                                                    resize="none"
                                                    minH="80px"
                                                    size="md"
                                                    color="black"
                                                    bg="white"
                                                    _readOnly={{ bg: "transparent", cursor: "default", borderColor: "transparent" }}
                                                />
                                            </Box>
                                            <Flex align="center" justify="center" p={3} opacity={entry.industry_supervisor_signature_date ? 1 : 0.3} bg={entry.industry_supervisor_signature_date ? "green.50" : "white"}>
                                                {entry.industry_supervisor_signature_date ? (
                                                    <VStack gap={0} textAlign="center">
                                                        <Icon as={LuCheck} color="green.600" boxSize={5} />
                                                        <Text fontSize="xs" color="green.700" fontWeight="bold">Signed</Text>
                                                    </VStack>
                                                ) : (
                                                    <Text fontSize="xs" fontStyle="italic" color="gray.400">Unsigned</Text>
                                                )}
                                            </Flex>
                                        </Grid>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Trainee's Weekly Report */}
                        <Box bg="white" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                            <Box bg="indigo.600" color="white" p={4} textAlign="center">
                                <Heading size="md">TRAINEE'S WEEKLY REPORT</Heading>
                                <Text fontSize="xs" opacity={0.8}>(A summary of the whole week, sketches/diagrams may be attached where necessary)</Text>
                            </Box>
                            
                            <Box p={6}>
                                <Box>
                                    <Text fontWeight="bold" mb={2} color="slate.800">Weekly Summary:</Text>
                                    <Textarea 
                                        value={entry.weekly_summary || ''} 
                                        readOnly 
                                        minH="150px"
                                        size="md"
                                        color="black !important"
                                        css={{ WebkitTextFillColor: 'black', fontWeight: 'bold', fontSize: '15px' }}
                                        _readOnly={{ bg: "transparent", cursor: "default", borderColor: "transparent" }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Supervisor Confirmations */}
                        <Box bg="white" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                            <Box bg="gray.800" color="white" p={4} textAlign="center">
                                <Heading size="md">WEEKLY CONFIRMATION BY SUPERVISORS</Heading>
                            </Box>
                            
                            <Box p={6}>
                                <VStack gap={6} align="stretch">
                                    <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                        <Text fontWeight="bold" color="indigo.800" mb={2}>Comments by Industry-based Supervisor:</Text>
                                        
                                        {role === 'COMPANY' ? (
                                            <VStack align="stretch" gap={3}>
                                                <Textarea 
                                                    placeholder="Type your feedback and evaluation of the student's week here..."
                                                    value={currentComment}
                                                    onChange={(e) => handleCommentChange(e.target.value)}
                                                    bg="white"
                                                    minH="100px"
                                                    size="md"
                                                    color="black !important"
                                                    css={{ WebkitTextFillColor: 'black', fontWeight: 'bold', fontSize: '15px' }}
                                                    _focus={{ bg: "white", borderColor: "indigo.500" }}
                                                />
                                                <Flex justify="flex-end">
                                                    <Button colorPalette="indigo" onClick={handleSignLogbook} loading={isSaving}>
                                                        <LuPen /> Digitally Sign & Approve
                                                    </Button>
                                                </Flex>
                                            </VStack>
                                        ) : (
                                            <Box>
                                                <Text p={3} bg="white" minH="80px" borderRadius="sm" border="1px solid" borderColor="gray.100" fontStyle={entry.industry_supervisor_comments ? "normal" : "italic"} color={entry.industry_supervisor_comments ? "gray.800" : "gray.400"}>
                                                    {entry.industry_supervisor_comments || "Pending evaluation..."}
                                                </Text>
                                                <HStack justify="space-between" mt={4}>
                                                    <Badge colorPalette={entry.industry_supervisor_signature_date ? "green" : "gray"}>
                                                        {entry.industry_supervisor_signature_date ? "SIGNED DIGITALLY" : "PENDING SIGNATURE"}
                                                    </Badge>
                                                    {entry.industry_supervisor_signature_date && <Text fontSize="xs">Date: {new Date(entry.industry_supervisor_signature_date).toLocaleString()}</Text>}
                                                </HStack>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                        <Text fontWeight="bold" color="purple.800" mb={2}>Comments by Assessing University Supervisor:</Text>
                                        
                                        {role === 'INSTITUTION' ? (
                                            <VStack align="stretch" gap={3}>
                                                <Textarea 
                                                    placeholder="Type your feedback and evaluation of the student's week here..."
                                                    value={currentComment}
                                                    onChange={(e) => handleCommentChange(e.target.value)}
                                                    bg="white"
                                                    minH="100px"
                                                    size="md"
                                                    color="black !important"
                                                    css={{ WebkitTextFillColor: 'black', fontWeight: 'bold', fontSize: '15px' }}
                                                    _focus={{ bg: "white", borderColor: "purple.500" }}
                                                />
                                                <Flex justify="flex-end">
                                                    <Button colorPalette="purple" onClick={handleSignLogbook} loading={isSaving}>
                                                        <LuPen /> Digitally Sign & Approve
                                                    </Button>
                                                </Flex>
                                            </VStack>
                                        ) : (
                                            <Box>
                                                <Text p={3} bg="white" minH="80px" borderRadius="sm" border="1px solid" borderColor="gray.100" fontStyle={entry.university_supervisor_comments ? "normal" : "italic"} color={entry.university_supervisor_comments ? "gray.800" : "gray.400"}>
                                                    {entry.university_supervisor_comments || "Pending evaluation..."}
                                                </Text>
                                                <HStack justify="space-between" mt={4}>
                                                    <Badge colorPalette={entry.university_supervisor_signature_date ? "green" : "gray"}>
                                                        {entry.university_supervisor_signature_date ? "SIGNED DIGITALLY" : "PENDING SIGNATURE"}
                                                    </Badge>
                                                    {entry.university_supervisor_signature_date && <Text fontSize="xs">Date: {new Date(entry.university_supervisor_signature_date).toLocaleString()}</Text>}
                                                </HStack>
                                            </Box>
                                        )}
                                    </Box>
                                </VStack>
                            </Box>
                        </Box>

                    </VStack>
                    
                    {/* Horizontal Week Navigator */}
                    {/* Just like LogbookManager but we only show what's strictly available or the next drafted week */}
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
                                        _hover={{ bg: isActive ? "indigo.500" : "blackAlpha.100" }}
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

export default LogbookReview;
