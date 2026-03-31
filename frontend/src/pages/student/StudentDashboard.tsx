import React, { useEffect } from 'react';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Heading,
    Button,
    IconButton,
    Input,
    Icon,
    Badge,
    Spinner,
    Container,
    Grid
} from '@chakra-ui/react';
import { Avatar } from "../../components/ui/avatar";
import { LuTarget, LuDownload, LuFileText, LuTrash2, LuShield, LuPlus, LuGraduationCap, LuSettings, LuBuilding2, LuBot, LuActivity, LuSparkles } from "react-icons/lu";
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
import ConfirmModal from '../../components/common/ConfirmModal';
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
        dashboardStats,
        matchIntelligence,
        academicRecords,
        applications,
        isLoading,
        isAcademicLoading,
        isMatchingLoading
    } = useSelector((state: RootState) => state.student);
    const { socket } = useSocket();
    const [isTranscriptOpen, setIsTranscriptOpen] = React.useState(false);
    const [isUploadingCert, setIsUploadingCert] = React.useState(false);
    const [certs, setCerts] = React.useState<any[]>([]);
    const [assignedDocs, setAssignedDocs] = React.useState<any[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [docIdToDelete, setDocIdToDelete] = React.useState<string | null>(null);
    const [viewingId, setViewingId] = React.useState<string | null>(null);

    const handleView = async (opportunityId: string) => {
        if (!opportunityId) return;
        setViewingId(opportunityId);
        try {
            const app = await StudentService.applyToOpportunity(opportunityId);
            navigate(`/student/attachments?expand=${app.id}`);
        } catch (error) {
            console.error("Failed to link opportunity", error);
            // Even if it fails (e.g. network), we still navigate because the portal will refresh
            navigate('/student/attachments');
        } finally {
            setViewingId(null);
        }
    };

    const fetchCertificates = React.useCallback(async () => {
        try {
            const docs = await StudentService.getMyDocuments();
            setCerts(docs.filter(d => d.type === 'CERTIFICATION' || d.type === 'CV'));
            setAssignedDocs(docs.filter(d => d.type !== 'CERTIFICATION' && d.type !== 'CV'));
        } catch (error) {
            console.error("Failed to fetch certifications", error);
        }
    }, []);


    const handleDownloadLetter = async (appId: string) => {
        try {
            const blob = await StudentService.downloadPlacementLetter(appId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Placement_Letter_${appId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.create({ title: "Letter Downloaded", type: "success" });
        } catch (error) {
            toaster.create({ title: "Download Failed", description: "Could not generate letter.", type: "error" });
        }
    };

    const handleDownloadNITA = async (appId: string) => {
        try {
            const blob = await StudentService.downloadNITAForm(appId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `NITA_Form_${appId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.create({ title: "NITA Form Downloaded", type: "success" });
        } catch (error) {
            toaster.create({ title: "Download Failed", description: "Could not generate NITA Form.", type: "error" });
        }
    };

    const handleViewInstitutionalDoc = async (appId: string, type: 'LETTER' | 'NITA') => {
        try {
            const blob = type === 'LETTER'
                ? await StudentService.downloadPlacementLetter(appId)
                : await StudentService.downloadNITAForm(appId);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Revoke after some time or on unmount
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (error) {
            toaster.create({ title: "View Failed", description: "Could not open document.", type: "error" });
        }
    };

    const handleDeleteDocument = (id: string) => {
        setDocIdToDelete(id);
        setIsConfirmOpen(true);
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

    const handleConfirmDelete = async () => {
        if (!docIdToDelete) return;
        try {
            await StudentService.deleteDocument(docIdToDelete);
            setCerts(prev => prev.filter(c => c.id !== docIdToDelete));
            toaster.create({ title: "Document Deleted", type: "success" });
        } catch (error) {
            toaster.create({ title: "Delete Failed", description: "Could not remove document.", type: "error" });
        } finally {
            setDocIdToDelete(null);
        }
    };

    const handleCertUpload = async (file: File) => {
        setIsUploadingCert(true);
        try {
            await StudentService.uploadDocument(file);
            toaster.create({ title: "Certificate Uploaded", description: "Your certification has been added to your profile.", type: "success" });
            fetchCertificates();
        } catch (error) {
            toaster.create({ title: "Upload Failed", type: "error" });
        } finally {
            setIsUploadingCert(false);
        }
    };

    useEffect(() => {
        dispatch(fetchStudentProfile());
        dispatch(fetchDashboardData());
        dispatch(fetchAcademicRecords());
        dispatch(fetchMatchIntelligence());
        fetchCertificates();
    }, [dispatch, fetchCertificates]);

    useEffect(() => {
        if (socket) {
            socket.on('PROFILE_UPDATED', () => {
                dispatch(fetchStudentProfile());
                dispatch(fetchDashboardData());
                dispatch(fetchAcademicRecords());
                dispatch(fetchMatchIntelligence());
                toaster.create({ title: "Profile Synced", description: "Identity updated in real-time.", type: "success" });
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
        progressText = "Synchronizing Institutional Records...";
        progressColor = "orange.400";
    } else if (isMatchingLoading) {
        progress = 75;
        progressText = "AISHA Neural Engine Evaluating Transcripts & Jobs...";
        progressColor = "cyan.400";
    } else if ((academicRecords || []).length > 0 && (matchIntelligence || []).length > 0) {
        progress = 100;
        progressText = "Optimization Complete & Dashboard Live";
        progressColor = "green.400";
    } else if ((academicRecords || []).length > 0) {
        progress = 85;
        progressText = "Records Validated. Waiting for Active Ops.";
        progressColor = "blue.400";
    } else {
        progress = 20;
        progressText = "Awaiting Verification";
        progressColor = "yellow.400";
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
                        <Text fontSize="xs" color="whiteAlpha.600">Synchronizing your records and placement status...</Text>
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
                                <Text color="whiteAlpha.600" fontSize="sm">Please synchronize your registration number to access your academic dashboard and AI matches.</Text>
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
        <Box className="glass-background" h="100vh" overflow="hidden" pt={6} display="flex" flexDirection="column">
            
            {/* Top Level Dynamic Progress Bar */}
            <Box w="100%" px={{ base: 4, lg: 8 }} mb={4} transition="all 0.3s ease">
                <Flex justify="space-between" align="center" mb={1}>
                    <HStack>
                        <Icon as={LuActivity} color={progressColor} boxSize={3} />
                        <Text fontSize="xs" color="whiteAlpha.800" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                            {progressText}
                        </Text>
                    </HStack>
                    <Text fontSize="xs" color={progressColor} fontWeight="black">
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

            <Container maxW="container.xl" flex="1" overflow="hidden" pb={4}>
                <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={4} h="full" overflow="hidden">

                    {/* Left Column: Academic & Skill Core */}
                    <VStack gap={3} align="stretch">
                        <MotionBox
                            className="glass-panel"
                            p={5}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ scale: 1.005 }}
                        >
                            <Flex justify="space-between" align="center" mb={4}>
                                <VStack align="start" gap={0}>
                                    <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">ACADEMIC_RECORDS</Heading>
                                    <Text fontSize="xs" color="cyan.400" fontWeight="bold">REGISTRY_SYNCHRONIZED</Text>
                                </VStack>
                                <Button size="xs" colorPalette="cyan" variant="outline" borderRadius="full" px={4} onClick={() => setIsTranscriptOpen(true)}>
                                    VIEW_ANALYSIS
                                </Button>
                            </Flex>

                            <VStack align="stretch" gap={2}>
                                 {isAcademicLoading && (academicRecords || []).length === 0 ? (
                                     <HStack py={4} justify="center" gap={4}>
                                         <Spinner size="xs" color="cyan.400" />
                                         <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">Syncing Registry...</Text>
                                     </HStack>
                                 ) : (academicRecords || []).length === 0 ? (
                                    <Text fontSize="xs" color="whiteAlpha.400" py={4} textAlign="center">No records found. Sync registry to view.</Text>
                                 ) : (
                                    (academicRecords || []).slice(0, 4).map((record: any) => (
                                        <Flex key={record.id} justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor="whiteAlpha.100">
                                            <VStack align="start" gap={0}>
                                                <Text fontSize="xs" color="white" fontWeight="bold">{record.unit_name}</Text>
                                                <Text fontSize="xs" color="whiteAlpha.500" fontWeight="mono">{record.unit_code} | SEM_{record.semester}</Text>
                                            </VStack>
                                            <Badge colorPalette={record.grade?.startsWith('A') ? 'green' : 'cyan'} variant="solid" px={2} py={0} borderRadius="md" fontSize="9px">
                                                {record.grade || 'N/A'} {record.mark ? `(${record.mark}%)` : ''}
                                            </Badge>
                                        </Flex>
                                    ))
                                )}
                            </VStack>
                        </MotionBox>

                        <MotionBox
                            className="glass-panel"
                            p={5}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ scale: 1.005 }}
                        >
                            <HStack justify="space-between" mb={4}>
                                <VStack align="start" gap={0}>
                                    <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">INSTITUTIONAL_DOCS</Heading>
                                    <Text fontSize="xs" color="orange.400" fontWeight="bold">OFFICIAL_RELEASED_RECORDS</Text>
                                </VStack>
                                <Icon as={LuShield} color="orange.400" boxSize={5} />
                            </HStack>
                            <VStack align="stretch" gap={2}>
                                {assignedDocs.length > 0 ? (
                                    assignedDocs.map((doc: any) => (
                                        <Box key={doc.id} p={2} bg="whiteAlpha.50" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
                                            <Flex justify="space-between" align="center">
                                                <VStack align="start" gap={0}>
                                                    <Text fontSize="xs" fontWeight="black" color="white" letterSpacing="widest">
                                                        {doc.type.replace(/_/g, ' ')}
                                                    </Text>
                                                    <Badge colorPalette={doc.status === 'PENDING' ? 'yellow' : 'green'} size="xs" variant="subtle">
                                                        {doc.status}
                                                    </Badge>
                                                </VStack>
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    colorPalette="blue"
                                                    onClick={() => {
                                                        if (!doc.file_url) {
                                                            toaster.create({ title: "No File", description: "Doc awaits upload or generation.", type: "info" });
                                                            return;
                                                        }
                                                        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').split('/api')[0];
                                                        window.open(`${baseUrl}${doc.file_url}`, '_blank');
                                                    }}
                                                >
                                                    VIEW
                                                </Button>
                                            </Flex>
                                        </Box>
                                    ))
                                ) : (
                                    <Text fontSize="xs" color="whiteAlpha.400" py={4} textAlign="center">No institutional documents assigned.</Text>
                                )}
                            </VStack>
                        </MotionBox>

                    </VStack>

                    {/* Right Column: AI Flow & Credentials */}
                    <VStack gap={3} align="stretch">
                        <MotionBox
                            className="glass-panel-accent"
                            p={5}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ scale: 1.005 }}
                        >
                            <HStack justify="space-between" mb={4}>
                                <VStack align="start" gap={0}>
                                    <Heading size="sm" color="blue.300" fontWeight="black" letterSpacing="widest">OPTIMAL_PLACEMENT</Heading>
                                    <Text fontSize="xs" color="blue.400" fontWeight="bold">BEST_OPPORTUNITY_IDENTIFIED</Text>
                                </VStack>
                                <Icon as={LuTarget} color="blue.400" boxSize={5} />
                            </HStack>

                            <VStack align="stretch" gap={3} maxH="350px" overflowY="auto"
                                css={{
                                    '&::-webkit-scrollbar': { width: '4px' },
                                    '&::-webkit-scrollbar-track': { width: '6px' },
                                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '24px' },
                                }}
                                pr={1}
                            >
                                 {isMatchingLoading && (matchIntelligence || []).length === 0 ? (
                                     <MotionBox 
                                        textAlign="center" 
                                        py={12} 
                                        px={4}
                                        border="2px dashed" 
                                        borderColor="cyan.600" 
                                        borderRadius="xl"
                                        bg="cyan.900"
                                        opacity={0.8}
                                        initial={{ opacity: 0.5, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1, borderColor: ["#00B5D8", "#3182CE", "#00B5D8"] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                     >
                                         <VStack gap={4}>
                                             <MotionBox
                                                 animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
                                                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                             >
                                                <Icon as={LuBot} boxSize={12} color="cyan.400" />
                                             </MotionBox>
                                             <Box height="24px" overflow="hidden">
                                                 <MotionBox
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5 }}
                                                 >
                                                    <Text 
                                                        fontSize="12px" 
                                                        color="cyan.100" 
                                                        fontWeight="bold" 
                                                        letterSpacing="wide"
                                                        css={{
                                                            overflow: "hidden",
                                                            borderRight: ".15em solid orange",
                                                            whiteSpace: "nowrap",
                                                            margin: "0 auto",
                                                            letterSpacing: ".15em",
                                                            animation: "typing 3.5s steps(40, end), blink-caret .75s step-end infinite"
                                                        }}
                                                    >
                                                        Hold on while we match you to the best opportunities...
                                                    </Text>
                                                 </MotionBox>
                                             </Box>
                                         </VStack>
                                     </MotionBox>
                                 ) : (matchIntelligence || []).length === 0 ? (
                                    <Box textAlign="center" py={6} border="1px dashed" borderColor="blue.900" borderRadius="xl">
                                        <Text fontSize="9px" color="whiteAlpha.500" letterSpacing="widest">NO MATCHES FOUND. UPDATE YOUR SKILLS.</Text>
                                    </Box>
                                 ) : (
                                    <>
                                        {/* Unified Premium Match Card (First Match) */}
                                        {matchIntelligence[0] && (
                                            <MotionBox
                                                p={6}
                                                mb={4}
                                                bgGradient="linear(to-br, cyan.900, blue.900)"
                                                borderRadius="3xl"
                                                border="2px solid"
                                                borderColor="cyan.500"
                                                pos="relative"
                                                overflow="hidden"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.6 }}
                                                boxShadow="0 0 30px rgba(0, 184, 212, 0.3)"
                                            >
                                                <Confetti />
                                                <VStack gap={4} align="stretch" pos="relative" zIndex={1}>
                                                    <HStack justify="space-between">
                                                        <Badge colorPalette="green" variant="solid" size="sm" borderRadius="full" px={3} animation="pulse 2s infinite">
                                                            MATCH CONFIRMED
                                                        </Badge>
                                                        <HStack gap={2}>
                                                            <Icon as={LuSparkles} color="yellow.400" />
                                                            <Text fontSize="xs" color="white" fontWeight="black" letterSpacing="widest">CONGRATULATIONS!</Text>
                                                            <Icon as={LuSparkles} color="yellow.400" />
                                                        </HStack>
                                                    </HStack>

                                                    <Flex gap={4} align="center">
                                                        <Avatar
                                                            size="lg"
                                                            border="3px solid"
                                                            borderColor="cyan.400"
                                                            src={`https://logo.clearbit.com/${matchIntelligence[0].company_name?.toLowerCase().replace(/\s+/g, '')}.com`}
                                                            portrayedIcon={<Icon as={LuBuilding2} color="cyan.400" boxSize={8} />}
                                                        />
                                                        <VStack align="start" gap={0} flex="1">
                                                            <Heading size="md" color="white" fontWeight="black" letterSpacing="tight">
                                                                {matchIntelligence[0].job_title}
                                                            </Heading>
                                                            <Text fontSize="sm" color="cyan.300" fontWeight="bold">
                                                                {matchIntelligence[0].company_name}
                                                            </Text>
                                                        </VStack>
                                                        <VStack align="end" gap={0}>
                                                            <Text fontSize="2xl" color="white" fontWeight="black">
                                                                {matchIntelligence[0].match_score > 100 ? 100 : matchIntelligence[0].match_score}%
                                                            </Text>
                                                            <Text fontSize="9px" color="cyan.400" fontWeight="bold" letterSpacing="1px">NEURAL_SYNC</Text>
                                                        </VStack>
                                                    </Flex>

                                                    <Box p={3} bg="blackAlpha.400" borderRadius="xl" borderLeft="4px solid" borderColor="cyan.400">
                                                        <Text fontSize="xs" color="whiteAlpha.900" fontStyle="italic" lineHeight="relaxed">
                                                            "{matchIntelligence[0].reasoning || "AISHA has detected a perfect alignment between your skill core and this corporate node."}"
                                                        </Text>
                                                    </Box>

                                                    <Button
                                                        w="full"
                                                        h="45px"
                                                        colorPalette="cyan"
                                                        variant="solid"
                                                        fontWeight="900"
                                                        letterSpacing="2px"
                                                        boxShadow="0 0 20px rgba(0, 184, 212, 0.4)"
                                                        _hover={{ transform: "translateY(-2px)", boxShadow: "0 0 30px rgba(0, 184, 212, 0.6)" }}
                                                        onClick={() => handleView(matchIntelligence[0].opportunity_id)}
                                                        loading={viewingId === matchIntelligence[0].opportunity_id}
                                                    >
                                                        INITIALIZE PLACEMENT VIEW
                                                    </Button>
                                                </VStack>
                                            </MotionBox>
                                        )}
                                    </>
                                 )}
                            </VStack>
                        </MotionBox>

                        <MotionBox
                            className="glass-panel"
                            p={5}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            whileHover={{ scale: 1.005 }}
                        >
                            <HStack justify="space-between" mb={4}>
                                <VStack align="start" gap={0}>
                                    <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">CERTIFICATIONS</Heading>
                                    <Text fontSize="xs" color="purple.400" fontWeight="bold">VERIFIED_RECORDS</Text>
                                </VStack>
                                <HStack gap={2}>
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        id="cert-upload"
                                        display="none"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleCertUpload(file);
                                        }}
                                    />
                                    <label htmlFor="cert-upload" style={{ cursor: 'pointer' }}>
                                        <Button
                                            as="span"
                                            size="xs"
                                            variant="ghost"
                                            colorPalette="purple"
                                            border="1px solid"
                                            borderColor="purple.900"
                                            loading={isUploadingCert}
                                        >
                                            <LuPlus size={10} style={{ marginRight: '4px' }} /> UPLOAD
                                        </Button>
                                    </label>
                                    <Icon as={LuShield} color="purple.400" boxSize={5} />
                                </HStack>
                            </HStack>
                            <VStack align="stretch" gap={3}>
                                {certs.length > 0 ? (
                                    certs.map((cert: any) => (
                                        <Box key={cert.id} p={3} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                                            <Flex justify="space-between" align="center">
                                                <VStack align="start" gap={0}>
                                                    <Text fontSize="xs" fontWeight="black" color="white" letterSpacing="widest" lineClamp={1}>
                                                        {cert.type === 'CV' ? 'PROFESSIONAL CV' : 'CERTIFICATION'}
                                                    </Text>
                                                    <Text fontSize="10px" color="whiteAlpha.600" lineClamp={1}>
                                                        {cert.file_url.split('/').pop()}
                                                    </Text>
                                                </VStack>
                                                 <HStack gap={1}>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        colorPalette="purple"
                                                         onClick={() => {
                                                            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').split('/api')[0];
                                                            window.open(`${baseUrl}${cert.file_url}`, '_blank');
                                                        }}
                                                    >
                                                        VIEW
                                                    </Button>
                                                    <IconButton
                                                        aria-label="Delete"
                                                        size="xs"
                                                        variant="ghost"
                                                        colorPalette="red"
                                                        onClick={() => handleDeleteDocument(cert.id)}
                                                    >
                                                        <LuTrash2 size={12} />
                                                    </IconButton>
                                                </HStack>
                                            </Flex>
                                        </Box>
                                    ))
                                ) : (
                                    <Box p={6} textAlign="center" border="1px dashed" borderColor="whiteAlpha.200" borderRadius="xl">
                                        <Text fontSize="xs" color="whiteAlpha.400" letterSpacing="widest">NO_DOCUMENTS_UPLOADED</Text>
                                    </Box>
                                )}
                            </VStack>
                        </MotionBox>
                    </VStack>
                </Grid>
            </Container>

            <Toaster />
            <TranscriptModal isOpen={isTranscriptOpen} onClose={() => setIsTranscriptOpen(false)} />
            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={handleConfirmDelete}
                title="Delete Document"
                description="Are you sure you want to delete this certification? This action cannot be undone."
                confirmText="Delete"
                confirmColor="red.500"
            />
        </Box >
    );
};

export default StudentDashboard;
