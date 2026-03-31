import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Flex, Heading, Text, Badge, Button,
    Container, VStack, HStack, Icon, Grid,
    Circle, Image, Stack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
    LuActivity, LuMapPin, LuCpu, LuShieldCheck, 
    LuMessageSquare, LuDownload, LuInfo, LuBuilding2, 
    LuCalendar, LuGlobe, LuChevronLeft, LuSparkles,
    LuFileText
} from "react-icons/lu";
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyApplications } from '../../store/studentSlice';
import type { AppDispatch, RootState } from '../../store';
import { Toaster, toaster } from '../../components/ui/toaster';
import StudentService from '../../services/studentService';
import ChatWidget from '../../components/Chat/ChatWidget';
import './LogbookStyles.css'; // Reusing some glass styles

const MotionBox = motion.create(Box);

const RedesignedPlacement: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { applications, profile, isLoading } = useSelector((state: RootState) => state.student);
    const { user } = useSelector((state: RootState) => state.auth);
    const [searchParams] = useSearchParams();
    const [activeChat, setActiveChat] = useState<{ targetId: string, name: string, appId: string } | null>(null);

    const expandId = searchParams.get('expand');
    
    useEffect(() => {
        dispatch(fetchMyApplications());
    }, [dispatch]);

    // Determine target application: explicitly expanded OR most recently accepted OR newest pending match
    const targetApp = applications.find(a => a.id === expandId) || 
                      applications.find(a => a.status === 'ACCEPTED') || 
                      applications[0];

    if (isLoading && applications.length === 0) {
        return (
            <Flex h="80vh" align="center" justify="center">
                <VStack gap={4}>
                    <Box className="loader-pulse" />
                    <Text color="cyan.400" fontWeight="black" letterSpacing="widest">SYNCHRONIZING_PLACEMENT_NODE...</Text>
                </VStack>
            </Flex>
        );
    }

    if (!targetApp) {
        return (
            <Container maxW="container.md" pt={20}>
                <VStack gap={8} textAlign="center" className="glass-panel" p={12}>
                    <Icon as={LuActivity} boxSize={16} color="whiteAlpha.200" />
                    <VStack gap={2}>
                        <Heading size="lg" color="white" fontWeight="black">NO_PLACEMENT_FOUND</Heading>
                        <Text color="whiteAlpha.600">The neural engine has not detected an active placement link for your profile yet.</Text>
                    </VStack>
                    <Button colorPalette="cyan" variant="outline" onClick={() => navigate('/student/dashboard')}>
                        RETURN TO DASHBOARD
                    </Button>
                </VStack>
            </Container>
        );
    }

    const handleDownloadLetter = async (appId: string) => {
        try {
            const blob = await StudentService.downloadPlacementLetter(appId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Acceptance_Letter_${targetApp.company_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.create({ title: "Letter Downloaded", type: "success" });
        } catch (error) {
            toaster.create({ title: "Download Failed", description: "Acceptance node not yet generated.", type: "error" });
        }
    };

    return (
        <Container maxW="container.xl" pb={10} pt={4}>
            <Toaster />
            <VStack gap={6} align="stretch">
                
                {/* Navigation & Header */}
                <Flex justify="space-between" align="center">
                    <Button 
                        variant="ghost" 
                        colorPalette="cyan" 
                        onClick={() => navigate('/student/dashboard')}
                        fontWeight="black"
                        fontSize="xs"
                    >
                        <Icon as={LuChevronLeft} /> BACK TO TERMINAL
                    </Button>
                    <HStack gap={3}>
                        <Badge colorPalette="cyan" variant="solid" px={3} borderRadius="full">PLACEMENT_ID: {targetApp.id.split('-')[0].toUpperCase()}</Badge>
                        <Badge colorPalette={targetApp.status === 'ACCEPTED' ? 'green' : 'blue'} variant="subtle" px={3} borderRadius="full">
                            STATUS: {targetApp.status}
                        </Badge>
                    </HStack>
                </Flex>

                {/* Main Hero Section */}
                <MotionBox
                    className="glass-panel"
                    borderRadius="3xl"
                    overflow="hidden"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    pos="relative"
                    bg="rgba(10, 15, 30, 0.7)"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    {/* Background Accent */}
                    <Box 
                        pos="absolute" top="-50px" right="-50px" w="300px" h="300px" 
                        bg="cyan.600" borderRadius="full" filter="blur(100px)" opacity="0.1"
                    />

                    <Grid templateColumns={{ base: "1fr", lg: "1fr 1.5fr" }} gap={0}>
                        {/* Company Visuals */}
                        <Box p={8} bg="whiteAlpha.50" borderRight="1px solid" borderColor="whiteAlpha.100">
                            <VStack align="center" gap={6}>
                                <Circle 
                                    size="200px" 
                                    bg="white" 
                                    border="4px solid" 
                                    borderColor="cyan.500"
                                    boxShadow="0 0 40px rgba(0, 184, 212, 0.2)"
                                    overflow="hidden"
                                >
                                    <Image 
                                        src={`https://logo.clearbit.com/${targetApp.company_name?.toLowerCase().replace(/\s+/g, '')}.com`}
                                        w="70%"
                                        h="70%"
                                        objectFit="contain"
                                    />
                                </Circle>
                                <VStack gap={1} textAlign="center">
                                    <Heading size="xl" color="white" fontWeight="black" letterSpacing="tighter">
                                        {targetApp.company_name}
                                    </Heading>
                                    <HStack color="cyan.400">
                                        <Icon as={LuMapPin} />
                                        <Text fontWeight="bold" fontSize="sm">{targetApp.location || 'Global Headquarters'}</Text>
                                    </HStack>
                                </VStack>
                                <Stack direction="row" gap={3} w="full">
                                    <Button flex="1" size="sm" variant="outline" colorPalette="cyan"><Icon as={LuGlobe} /> WEBSITE</Button>
                                    <Button 
                                        flex="1" 
                                        size="sm" 
                                        colorPalette="blue" 
                                        onClick={() => setActiveChat({
                                            targetId: (targetApp as any).company_user_id || (targetApp as any).company_id || '',
                                            name: targetApp.company_name || 'Corporate Node',
                                            appId: targetApp.id
                                        })}
                                    >
                                        <Icon as={LuMessageSquare} /> CHAT
                                    </Button>
                                </Stack>
                            </VStack>
                        </Box>

                        {/* Match Details */}
                        <Box p={8}>
                            <VStack align="start" gap={8}>
                                <Box>
                                    <HStack mb={2} gap={2}>
                                        <Badge colorPalette="cyan" variant="solid" fontSize="10px" px={2} borderRadius="md">VITAL_PLACEMENT</Badge>
                                        <Icon as={LuShieldCheck} color="green.400" />
                                    </HStack>
                                    <Heading size="2xl" color="white" fontWeight="black" lineHeight="1">{targetApp.job_title}</Heading>
                                </Box>

                                <Grid templateColumns="1fr 1fr" gap={6} w="full">
                                    <HStack gap={4} p={4} bg="whiteAlpha.50" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                        <Circle bg="cyan.950" size={10}><Icon as={LuCalendar} color="cyan.400" /></Circle>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="10px" color="whiteAlpha.500" fontWeight="black">DURATION</Text>
                                            <Text color="white" fontWeight="bold">3 Months</Text>
                                        </VStack>
                                    </HStack>
                                    <HStack gap={4} p={4} bg="whiteAlpha.50" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                                        <Circle bg="purple.950" size={10}><Icon as={LuCpu} color="purple.400" /></Circle>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="10px" color="whiteAlpha.500" fontWeight="black">MATCH_ACCURACY</Text>
                                            <Text color="white" fontWeight="bold">{targetApp.match_score}%</Text>
                                        </VStack>
                                    </HStack>
                                </Grid>

                                <Box w="full" p={6} bgGradient="linear(to-r, cyan.900, transparent)" borderRadius="2xl" border="1px solid" borderColor="cyan.800">
                                    <HStack mb={3}>
                                        <Icon as={LuSparkles} color="yellow.400" />
                                        <Text fontSize="xs" fontWeight="black" letterSpacing="2px" color="yellow.400">AISHA NEURAL REASONING</Text>
                                    </HStack>
                                    <Text color="whiteAlpha.900" fontStyle="italic" lineHeight="relaxed">
                                        "{targetApp.match_reason || targetApp.match_reasoning || `Highly optimized node detected. Your academic performance in ${profile?.course_of_study || 'relevant units'} matches perfectly with ${targetApp.company_name}'s technical infrastructure.`}"
                                    </Text>
                                </Box>
                            </VStack>
                        </Box>
                    </Grid>
                </MotionBox>

                {/* Detailed Info & Documentation */}
                <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={6}>
                    <VStack gap={6} align="stretch">
                        <Box className="glass-panel" p={8} borderRadius="3xl">
                            <VStack align="start" gap={6}>
                                <HStack borderBottom="1px solid" borderColor="whiteAlpha.100" pb={2} w="full">
                                    <Icon as={LuInfo} color="cyan.400" />
                                    <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">PLACEMENT_SPECIFICATIONS</Heading>
                                </HStack>
                                <Text color="whiteAlpha.800" lineHeight="tall">
                                    {targetApp.description || `This high-impact placement at ${targetApp.company_name} involves direct immersion into ${targetApp.job_title} workflows. You will collaborate with engineering leads to solve technical challenges, contribute to institutional reporting, and develop enterprise-grade skillsets.`}
                                </Text>
                                <VStack align="start" gap={3} w="full">
                                    <Text fontSize="xs" fontWeight="black" color="cyan.400">CRITICAL_REQUIREMENTS</Text>
                                    <HStack wrap="wrap" gap={2}>
                                        {(typeof targetApp.requirements === 'string' ? targetApp.requirements.split(',') : (targetApp.requirements || ["Technical Proficiency", "Collaboration", "System Design"])).map((req: string, i: number) => (
                                            <Badge key={i} size="sm" variant="outline" colorPalette="cyan" textTransform="none">
                                                {req.trim()}
                                            </Badge>
                                        ))}
                                    </HStack>
                                </VStack>
                            </VStack>
                        </Box>

                        <Box className="glass-panel" p={8} borderRadius="3xl">
                            <VStack align="start" gap={6}>
                                <HStack borderBottom="1px solid" borderColor="whiteAlpha.100" pb={2} w="full">
                                    <Icon as={LuShieldCheck} color="green.400" />
                                    <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">OFFICIAL_SYNCHRONIZATION</Heading>
                                </HStack>
                                <Grid templateColumns="1fr 1fr" gap={8} w="full">
                                    <VStack align="start" gap={1}>
                                        <Text fontSize="10px" color="whiteAlpha.400" fontWeight="black">EXPECTED_START</Text>
                                        <Text color="white" fontWeight="bold">TBD (Estimated Start 2026)</Text>
                                    </VStack>
                                    <VStack align="start" gap={1}>
                                        <Text fontSize="10px" color="whiteAlpha.400" fontWeight="black">STIPEND_STATUS</Text>
                                        <Badge colorPalette={targetApp.requires_stipend ? "green" : "gray"} variant="subtle">
                                            {targetApp.requires_stipend ? "KES 15,000 / mo" : "UNPAID_VOLUNTEER"}
                                        </Badge>
                                    </VStack>
                                </Grid>
                            </VStack>
                        </Box>
                    </VStack>

                    {/* Sidebar: Documents & Actions */}
                    <VStack gap={6} align="stretch">
                        <Box className="glass-panel" p={8} borderRadius="3xl" bg="rgba(0, 184, 212, 0.05)">
                            <VStack align="start" gap={6}>
                                <HStack borderBottom="1px solid" borderColor="cyan.800" pb={2} w="full">
                                    <Icon as={LuFileText} color="cyan.400" />
                                    <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">DOC_CENTER</Heading>
                                </HStack>
                                
                                <VStack align="stretch" gap={4} w="full">
                                    <Box p={5} bg="blackAlpha.400" borderRadius="2xl" border="1px dashed" borderColor="cyan.600">
                                        <VStack gap={4} align="center">
                                            <Circle size={12} bg="cyan.950" border="1px solid" borderColor="cyan.800">
                                                <Icon as={LuFileText} color="cyan.400" boxSize={6} />
                                            </Circle>
                                            <VStack gap={0} textAlign="center">
                                                <Text fontSize="sm" color="white" fontWeight="black">ACCEPTANCE_LETTER</Text>
                                                <Text fontSize="10px" color="whiteAlpha.400">PDF Document • 245 KB</Text>
                                            </VStack>
                                            <HStack gap={3} w="full">
                                                <Button size="xs" flex="1" disabled>VIEW</Button>
                                                <Button 
                                                    size="xs" 
                                                    flex="1" 
                                                    colorPalette="cyan" 
                                                    onClick={() => handleDownloadLetter(targetApp.id)}
                                                >
                                                    <Icon as={LuDownload} /> DOWNLOAD
                                                </Button>
                                            </HStack>
                                            <Text fontSize="10px" color="yellow.400" fontStyle="italic">Note: Official PDF will be sent by host company once protocol complete.</Text>
                                        </VStack>
                                    </Box>

                                    <Button 
                                        variant="outline" 
                                        colorPalette="purple" 
                                        w="full" 
                                        onClick={() => toaster.create({ title: "In Preparation", description: "The NITA node is currently being processed by the institution.", type: "info" })}
                                    >
                                        <Icon as={LuShieldCheck} /> DOWNLOAD_NITA_FORM
                                    </Button>
                                </VStack>
                            </VStack>
                        </Box>

                        <Box p={6} border="1px solid" borderColor="blue.900" borderRadius="2xl" textAlign="center">
                            <VStack gap={2}>
                                <Icon as={LuSparkles} color="cyan.400" boxSize={8} className="float-animation" />
                                <Text fontSize="xs" color="whiteAlpha.500" fontWeight="bold">PLACEMENT_SECURITY_VERIFIED_BY_AISHA</Text>
                            </VStack>
                        </Box>
                    </VStack>
                </Grid>
            </VStack>

            {activeChat && user && (
                <ChatWidget
                    currentUserId={user.id}
                    targetUserId={activeChat.targetId}
                    targetUserName={activeChat.name}
                    applicationId={activeChat.appId}
                    contextTitle={`Sync Hub: ${activeChat.name}`}
                />
            )}
        </Container>
    );
};

export default RedesignedPlacement;
