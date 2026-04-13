import React, { useEffect } from 'react';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Heading,
    Button,
    Icon,
    Badge,
    Spinner,
    Container,
    Grid
} from '@chakra-ui/react';
import { Avatar } from "../../components/ui/avatar";
import { LuTarget, LuGraduationCap, LuSettings, LuBuilding2, LuBot, LuActivity, LuSparkles } from "react-icons/lu";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchStudentProfile,
    fetchDashboardData,
    fetchAcademicRecords,
    fetchMatchIntelligence,
    clearMatchData
} from '../../store/studentSlice';
import type { AppDispatch, RootState } from '../../store';

import { useSocket } from '../../context/SocketContext';
import './DashboardTheme.css';
import TranscriptModal from './components/TranscriptModal';
import StudentService from '../../services/studentService';
import { Toaster, toaster } from '../../components/ui/toaster';

const MotionBox = motion.create(Box);

const Confetti: React.FC = () => {
    const particles = Array.from({ length: 12 });
    return (
        <Box pos="absolute" inset={0} overflow="hidden" pointerEvents="none">
            {particles.map((_, i) => (
                <MotionBox
                    key={i}
                    pos="absolute"
                    bg={['cyan.400', 'blue.400', 'purple.400', 'yellow.400'][i % 4]}
                    w="4px"
                    h="4px"
                    borderRadius="full"
                    initial={{ 
                        x: "50%", 
                        y: "50%", 
                        scale: 0,
                        opacity: 1 
                    }}
                    animate={{ 
                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                        y: `${50 + (Math.random() - 0.5) * 100}%`,
                        scale: [0, 1.5, 0],
                        opacity: [1, 1, 0]
                    }}
                    transition={{ 
                        duration: 2 + Math.random(), 
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut"
                    }}
                />
            ))}
        </Box>
    );
};

const StudentDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const {
        profile,
        matchIntelligence,
        academicRecords,
        isLoading,
        isAcademicLoading,
        isMatchingLoading,
        dashboardStats,
        error
    } = useSelector((state: RootState) => state.student);
    const { socket } = useSocket();
    const [isTranscriptOpen, setIsTranscriptOpen] = React.useState(false);

    const [viewingId, setViewingId] = React.useState<string | null>(null);

    const handleView = async (opportunityId: string, matchScore?: number, matchReason?: string) => {
        if (!opportunityId) return;
        setViewingId(opportunityId);
        try {
            const app = await StudentService.applyToOpportunity(opportunityId, matchScore, matchReason);
            navigate(`/student/attachments?expand=${app.id}`);
        } catch (error) {
            console.error("Failed to link opportunity", error);
            // Even if it fails (e.g. network), we still navigate because the portal will refresh
            navigate('/student/attachments');
        } finally {
            setViewingId(null);
        }
    };

    // Helper: resolve relative backend media URLs (e.g. /uploads/...) to absolute
    const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
        .replace(/\/api(.*)?$/, '');
    const getMediaUrl = (url?: string | null): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BACKEND_URL}${url}`;
    };






    // Real-time update on registration number change
    useEffect(() => {
        if (profile?.admission_number) {
            dispatch(clearMatchData());
            const timer = setTimeout(() => {
                dispatch(fetchMatchIntelligence());
                dispatch(fetchAcademicRecords());
                dispatch(fetchDashboardData());
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [profile?.admission_number, dispatch]);



    useEffect(() => {
        dispatch(fetchStudentProfile());
        dispatch(fetchDashboardData());
        dispatch(fetchAcademicRecords());
        dispatch(fetchMatchIntelligence());
    }, [dispatch]);

    useEffect(() => {
        if (socket) {
            socket.on('PROFILE_UPDATED', () => {
                dispatch(fetchStudentProfile());
                dispatch(fetchDashboardData());
                dispatch(fetchAcademicRecords());
                dispatch(fetchMatchIntelligence());
                toaster.create({ title: "Profile Updated", description: "Your information has been updated in real-time.", type: "success" });
            });

            socket.on('ANALYSIS_COMPLETE', () => {
                dispatch(fetchStudentProfile()); // To get academic_analysis
                dispatch(fetchDashboardData());
                toaster.create({ title: "Analysis Ready", description: "AI Academic insights are now available.", type: "success" });
            });

            socket.on('automation_update', (data: any) => {
                if (data.type === 'MATCH_FOUND') {
                    dispatch(fetchMatchIntelligence());
                }
            });

            return () => {
                socket.off('automation_update');
                socket.off('PROFILE_UPDATED');
                socket.off('ANALYSIS_COMPLETE');
            };
        }
    }, [socket, dispatch]);

    // Calculate Dynamic Progress
    let progress = 0;
    let progressText = "Initializing...";
    let progressColor = "gray.500";
    
    if (!profile?.admission_number) {
        progress = 10;
        progressText = "Registration Pending";
        progressColor = "red.400";
    } else if (isAcademicLoading) {
        progress = 40;
        progressText = "Loading Institutional Records...";
        progressColor = "orange.400";
    } else if (isMatchingLoading) {
        progress = 75;
        progressText = "Analyzing Matches & Opportunities...";
        progressColor = "cyan.400";
    } else if ((academicRecords || []).length > 0 && (matchIntelligence || []).length > 0) {
        progress = 100;
        progressText = "Dashboard Ready";
        progressColor = "green.400";
    } else if ((academicRecords || []).length > 0) {
        progress = 85;
        progressText = "Records Verified. Awaiting Opportunities.";
        progressColor = "blue.400";
    } else {
        progress = 20;
        progressText = "Awaiting Verification";
        progressColor = "yellow.400";
    }


    const isMatchingActive = isMatchingLoading || dashboardStats?.active_scanning;

    if (error) {
        return (
            <Box className="glass-background" h="100vh">
                <Flex h="100%" align="center" justify="center" direction="column" gap={6}>
                    <Icon as={LuActivity} color="red.400" boxSize={12} />
                    <VStack gap={1} textAlign="center">
                        <Text fontWeight="black" color="white" textTransform="uppercase" letterSpacing="widest">SECURE SYNC OFFLINE</Text>
                        <Text fontSize="xs" color="whiteAlpha.600">Institutional synchronization failed. Dashboard access is currently restricted.</Text>
                        <Button mt={4} size="sm" colorPalette="red" variant="outline" onClick={() => dispatch(fetchDashboardData())}>
                            RETRY SYNC
                        </Button>
                    </VStack>
                </Flex>
            </Box>
        );
    }

    // Change loading condition to not block the whole page if profile is already there
    if (isLoading && !profile) {
        return (
            <Box className="glass-background" h="100vh">
                <Flex h="100%" align="center" justify="center" direction="column" gap={8}>
                    <Box pos="relative">
                        <Spinner size="xl" borderWidth="4px" color="cyan.400" />
                        <MotionBox
                            pos="absolute" top="-10px" left="-10px" right="-10px" bottom="-10px"
                            borderRadius="full" border="2px solid" borderColor="cyan.400" opacity={0.3}
                            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </Box>
                    <VStack gap={1} textAlign="center">
                        <Text fontWeight="bold" color="white" textTransform="uppercase" letterSpacing="widest">Loading Dashboard</Text>
                        <Text fontSize="xs" color="whiteAlpha.600">Retrieving your records and placement status...</Text>
                    </VStack>
                </Flex>
            </Box>
        );
    }


    if (!profile?.admission_number) {
        return (
            <Box className="glass-background" minH="100vh" pb={12} pt={8}>
                <Container maxW="container.xl">
                    <MotionBox
                        className="glass-panel"
                        p={8}
                        textAlign="center"
                        border="1px dashed"
                        borderColor="cyan.800"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <VStack gap={6}>
                            <Icon as={LuGraduationCap} w={12} h={12} color="cyan.400" className="float-animation" />
                            <VStack gap={2}>
                                <Heading size="md" color="white" textTransform="uppercase" letterSpacing="widest">Profile incomplete</Heading>
                                <Text color="whiteAlpha.600" fontSize="sm">Please provide your registration number to access your academic dashboard and matching opportunities.</Text>
                            </VStack>
                            <Button
                                colorPalette="blue"
                                variant="ghost"
                                onClick={() => navigate('/student/settings')}
                            >
                                <Icon as={LuSettings} mr={2} /> COMPLETE PROFILE
                            </Button>
                        </VStack>
                    </MotionBox>
                </Container>
            </Box>
        );
    }

    return (
        <Box className="glass-background" minH="100%" display="flex" flexDirection="column">
            
            {/* Top Level Dynamic Progress Bar */}
            <Box w="100%" px={{ base: 4, lg: 8 }} mb={1} transition="all 0.3s ease">
                <Flex justify="space-between" align="center" mb={1}>
                    <HStack>
                        <Icon as={LuActivity} color={progressColor} boxSize={3} />
                        <Text fontSize="sm" color="whiteAlpha.800" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                            {progressText}
                        </Text>
                    </HStack>
                    <Text fontSize="md" color={progressColor} fontWeight="black">
                        {progress}%
                    </Text>
                </Flex>
                <Box w="100%" h="4px" bg="whiteAlpha.100" borderRadius="full" overflow="hidden">
                    <MotionBox
                        h="100%"
                        bg={progressColor}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        boxShadow={`0 0 10px ${progressColor}`}
                    />
                </Box>
            </Box>

            <Container maxW="container.xl" pt={1} pb={8}>
                <Grid 
                    templateColumns={{ base: "1fr", lg: "1fr 1.2fr" }} 
                    gap={4} 
                >
                    {/* Left Column: Academic & Skill Core */}
                    <VStack gap={4} align="stretch">
                        <MotionBox
                            className="glass-panel"
                            p={5}
                            display="flex"
                            flexDirection="column"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ scale: 1.002 }}
                        >
                            <Flex justify="space-between" align="center" mb={4}>
                                <VStack align="start" gap={0}>
                                    <Heading size="md" color="white" fontWeight="black" letterSpacing="widest">ACADEMIC RECORDS</Heading>
                                    <Text fontSize="sm" color="cyan.400" fontWeight="bold">VERIFIED RECORDS</Text>
                                </VStack>
                            </Flex>

                            <VStack align="stretch" gap={2} flex={1} overflowY="auto" pr={2} className="custom-scrollbar">
                                 {isAcademicLoading && (academicRecords || []).length === 0 ? (
                                     <HStack py={8} justify="center" gap={4}>
                                         <Spinner size="sm" color="cyan.400" />
                                         <Text fontSize="xs" color="whiteAlpha.400">Loading Records...</Text>
                                     </HStack>
                                 ) : (academicRecords || []).length === 0 ? (
                                    <Flex flex={1} align="center" justify="center" direction="column" gap={2}>
                                        <Icon as={LuGraduationCap} color="whiteAlpha.200" boxSize={10} />
                                        <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">No records found. Update profile to load.</Text>
                                    </Flex>
                                 ) : (
                                    (academicRecords || []).slice(0, 4).map((record: any) => (
                                        <Flex key={record.id} justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="whiteAlpha.100">
                                            <VStack align="start" gap={0}>
                                                <Text fontSize="md" color="white" fontWeight="bold">{record.unit_name}</Text>
                                                <Text fontSize="xs" color="whiteAlpha.500" fontWeight="mono" letterSpacing="wide">{record.unit_code} | SEMEST_{record.semester}</Text>
                                            </VStack>
                                            <Badge colorPalette={record.grade?.startsWith('A') ? 'green' : 'cyan'} variant="solid" px={3} py={1} borderRadius="md" fontSize="sm" fontWeight="black">
                                                {record.grade || 'N/A'} {record.mark ? `(${record.mark}%)` : ''}
                                            </Badge>
                                        </Flex>
                                    ))
                                 )}
                                 {(academicRecords || []).length > 4 && (
                                     <Text fontSize="10px" color="whiteAlpha.300" textAlign="center" mt={2} letterSpacing="widest">
                                         + {(academicRecords || []).length - 4} MORE_UNITS_IN_FULL_RECORDS
                                     </Text>
                                 )}
                            </VStack>
                            
                            <Flex justify="center" mt={4}>
                                <Button size="xs" colorPalette="cyan" variant="outline" borderRadius="full" px={6} onClick={() => setIsTranscriptOpen(true)}>
                                    SHOW ANALYSIS
                                </Button>
                            </Flex>
                        </MotionBox>
                    </VStack>

                    {/* Right Column: AI Flow & Optimal Placement */}
                    <VStack gap={4} align="stretch">
                        <MotionBox
                            className="glass-panel-accent"
                            p={6}
                            display="flex"
                            flexDirection="column"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ scale: 1.002 }}
                        >
                            <HStack justify="space-between" mb={6}>
                                <VStack align="start" gap={0}>
                                    <Heading size="lg" color="blue.300" fontWeight="black" letterSpacing="widest">TOP RECOMMENDATION</Heading>
                                    <Text fontSize="sm" color="blue.400" fontWeight="bold">MATCH RESULT</Text>
                                </VStack>
                                <Icon as={LuTarget} color="blue.400" boxSize={6} />
                            </HStack>

                            <Box flex={1} overflowY="auto" pr={2} className="custom-scrollbar">
                                 {isMatchingActive && (!matchIntelligence || matchIntelligence.length === 0 || matchIntelligence[0].status !== 'ACCEPTED') ? (
                                     <Flex flex={1} align="center" justify="center" py={12}>
                                         <VStack gap={4}>
                                             <MotionBox
                                                 animate={{ rotate: 360 }}
                                                 transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                             >
                                                <Icon as={LuBot} boxSize={16} color="cyan.400" />
                                             </MotionBox>
                                             <Text fontSize="xs" color="cyan.100" fontWeight="bold" letterSpacing="widest">
                                                 AI MATCH ANALYSIS ACTIVE...
                                             </Text>
                                         </VStack>
                                     </Flex>
                                 ) : (matchIntelligence || []).length === 0 ? (
                                    <Flex flex={1} align="center" justify="center" border="1px dashed" borderColor="blue.900" borderRadius="2xl" p={8}>
                                        <Text fontSize="10px" color="whiteAlpha.400" textAlign="center" letterSpacing="widest">NO MATCHES FOUND YET. UPDATE YOUR PROFILE.</Text>
                                    </Flex>
                                 ) : (
                                    <VStack gap={6} align="stretch">
                                        {/* Unified Premium Match Card */}
                                        {matchIntelligence[0] && (
                                            <MotionBox
                                                p={8}
                                                bgGradient="linear(to-br, rgba(0, 181, 216, 0.1), rgba(49, 130, 206, 0.1))"
                                                borderRadius="3xl"
                                                border="2px solid"
                                                borderColor="cyan.500"
                                                pos="relative"
                                                overflow="hidden"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.6 }}
                                                boxShadow="0 0 40px rgba(0, 184, 212, 0.2)"
                                            >
                                                <Confetti />
                                                <VStack gap={6} align="stretch" pos="relative" zIndex={1}>
                                                    <HStack justify="space-between">
                                                        <Badge 
                                                            colorPalette={
                                                                matchIntelligence[0].status === 'ACCEPTED' ? 'green' : 
                                                                matchIntelligence[0].status === 'OFFERED' ? 'purple' : 
                                                                matchIntelligence[0].status === 'PENDING' ? 'blue' : 'cyan'
                                                            } 
                                                            variant="solid" 
                                                            size="sm" 
                                                            borderRadius="full" 
                                                            px={4} 
                                                            animation={matchIntelligence[0].status === 'OFFERED' ? 'pulse 2s infinite' : 'none'}
                                                        >
                                                            {
                                                                matchIntelligence[0].status === 'ACCEPTED' ? 'PLACEMENT CONFIRMED' : 
                                                                matchIntelligence[0].status === 'OFFERED' ? 'OFFER RECEIVED!' : 
                                                                matchIntelligence[0].status === 'PENDING' ? 'APPLICATION PENDING' : 'TOP AI MATCH'
                                                            }
                                                        </Badge>
                                                        <HStack gap={2}>
                                                            <Icon as={LuSparkles} color="yellow.400" size="xs" />
                                                            <Text fontSize="10px" color="white" fontWeight="black" letterSpacing="widest">OPTIMIZED</Text>
                                                        </HStack>
                                                    </HStack>

                                                    <Flex gap={5} align="center">
                                                        <Avatar
                                                            size="xl"
                                                            border="3px solid"
                                                            borderColor="cyan.400"
                                                            src={
                                                                matchIntelligence[0].profile_picture_url 
                                                                ? getMediaUrl(matchIntelligence[0].profile_picture_url)
                                                                : matchIntelligence[0].logo_url
                                                                ? getMediaUrl(matchIntelligence[0].logo_url)
                                                                : `https://logo.clearbit.com/${matchIntelligence[0].company_name?.toLowerCase().replace(/\s+/g, '')}.com`
                                                             }
                                                            portrayedIcon={<Icon as={LuBuilding2} color="cyan.400" boxSize={10} />}
                                                        />
                                                        <VStack align="start" gap={1} flex="1">
                                                            <Heading size="lg" color="white" fontWeight="black" letterSpacing="tight">
                                                                {matchIntelligence[0].job_title}
                                                            </Heading>
                                                            <Text fontSize="sm" color="cyan.300" fontWeight="black" letterSpacing="widest">
                                                                {matchIntelligence[0].company_name}
                                                            </Text>
                                                        </VStack>
                                                        <VStack align="end" gap={0}>
                                                            <Text fontSize="3xl" color="white" fontWeight="black" lineHeight={1}>
                                                                {matchIntelligence[0].match_score > 100 ? 100 : matchIntelligence[0].match_score}%
                                                            </Text>
                                                            <Text fontSize="9px" color="cyan.400" fontWeight="black" letterSpacing="2px">MATCH SCORE</Text>
                                                        </VStack>
                                                    </Flex>

                                                    <Box p={4} bg="whiteAlpha.100" borderRadius="2xl" borderLeft="4px solid" borderColor="cyan.400" backdropFilter="blur(10px)">
                                                        <Text fontSize="sm" color="whiteAlpha.900" fontStyle="italic" lineHeight="relaxed">
                                                            "{matchIntelligence[0].reasoning || matchIntelligence[0].match_reason || "Analyzing requirements and profile alignment..."}"
                                                        </Text>
                                                    </Box>

                                                    <Button
                                                        w="full"
                                                        h="54px"
                                                        colorPalette="cyan"
                                                        variant="solid"
                                                        fontWeight="900"
                                                        letterSpacing="2px"
                                                        borderRadius="2xl"
                                                        boxShadow="0 10px 20px rgba(0, 184, 212, 0.3)"
                                                        _hover={{ transform: "translateY(-2px)", boxShadow: "0 15px 30px rgba(0, 184, 212, 0.5)" }}
                                                        onClick={() => handleView(
                                                            matchIntelligence[0].opportunity_id, 
                                                            matchIntelligence[0].match_score, 
                                                            matchIntelligence[0].reasoning
                                                        )}
                                                        loading={viewingId === matchIntelligence[0].opportunity_id}
                                                    >
                                                        {
                                                            matchIntelligence[0].status === 'ACCEPTED' ? 'View Placement' : 
                                                            matchIntelligence[0].status === 'OFFERED' ? 'Respond to Offer' : 
                                                            matchIntelligence[0].status === 'PENDING' ? 'View Application' : 'Open Match'
                                                        }
                                                    </Button>
                                                </VStack>
                                            </MotionBox>
                                        )}
                                    </VStack>
                                 )}
                            </Box>
                        </MotionBox>
                    </VStack>
                </Grid>
            </Container>

            <Toaster />
            <TranscriptModal isOpen={isTranscriptOpen} onClose={() => setIsTranscriptOpen(false)} />
        </Box >
    );
};

export default StudentDashboard;
