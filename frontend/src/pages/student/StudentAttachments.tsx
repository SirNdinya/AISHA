
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Flex, Heading, Text, Badge, Button,
    Container, VStack, HStack, Icon, Grid,
    Circle, Image
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    LuActivity, LuMapPin, LuCpu, LuShieldCheck,
    LuBuilding2, LuDownload, LuCalendar,
    LuChevronLeft, LuSparkles, LuFileText, LuWallet,
    LuZap, LuEye, LuClock, LuDollarSign, LuSmartphone
} from "react-icons/lu";
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyApplications, fetchDashboardData } from '../../store/studentSlice';
import type { AppDispatch, RootState } from '../../store';
import { Toaster, toaster } from '../../components/ui/toaster';
import StudentService from '../../services/studentService';
import apiClient from '../../services/apiClient';
import MpesaPaymentModal from '../../components/common/MpesaPaymentModal';
import './LogbookStyles.css';

const MotionBox = motion.create(Box);

const RedesignedPlacement: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { applications, profile, isLoading, isMatchingLoading, dashboardStats, error } = useSelector((state: RootState) => state.student);
    const [searchParams] = useSearchParams();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const expandId = searchParams.get('expand');

    useEffect(() => {
        dispatch(fetchMyApplications());
        dispatch(fetchDashboardData());
    }, [dispatch]);

    const isMatchingActive = isMatchingLoading || dashboardStats?.active_scanning;
    const targetApp = applications.find(a => a.id === expandId) ||
        applications.find(a => a.placement_status === 'ACTIVE') ||
        applications.find(a => a.status === 'ACCEPTED' && a.placement_status !== 'REPLACED') ||
        applications.find(a => a.status === 'OFFERED') ||
        applications[0];

    const [preferenceTimeLeft, setPreferenceTimeLeft] = useState<string>('');
    const [isPreferencesLocked, setIsPreferencesLocked] = useState(false);
    const [showPreferenceBanner, setShowPreferenceBanner] = useState(false);

    useEffect(() => {
        if (!targetApp) return;
        const isLockableMatch = targetApp.status === 'ACCEPTED' || targetApp.placement_status === 'ACTIVE' || targetApp.status === 'OFFERED';
        if (!isLockableMatch) {
            setShowPreferenceBanner(false);
            return;
        }

        const matchTime = new Date(targetApp.applied_at || targetApp.created_at || new Date()).getTime();
        const lockTime = matchTime + (24 * 60 * 60 * 1000); // 24 hours

        setShowPreferenceBanner(true);

        const updateTimer = () => {
            const now = Date.now();
            const diff = lockTime - now;

            if (diff <= 0) {
                setIsPreferencesLocked(true);
                setPreferenceTimeLeft('Preferences Locked');
            } else {
                setIsPreferencesLocked(false);
                const hrs = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setPreferenceTimeLeft(`${hrs}h ${mins}m ${secs}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetApp]);

    const isSyncing = isLoading || (expandId && !targetApp && !applications.find(a => a.id === expandId));

    // === GUARD SCREENS (unchanged logic) ===
    if (error) {
        return (
            <Flex h="80vh" align="center" justify="center">
                <VStack gap={4} textAlign="center" className="glass-panel" p={12} border="1px solid" borderColor="red.500/30">
                    <Icon as={LuShieldCheck} boxSize={12} color="red.400" />
                    <VStack gap={1}>
                        <Heading size="md" color="#F8FAFC" fontWeight="black">SECURE SYNC OFFLINE</Heading>
                        <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold">Synchronization with institutional records failed.</Text>
                    </VStack>
                    <Button mt={4} size="sm" colorPalette="red" variant="outline" onClick={() => dispatch(fetchDashboardData())}>
                        RETRY SYNC
                    </Button>
                </VStack>
            </Flex>
        );
    }
    if (isSyncing || (isLoading && applications.length === 0)) {
        return (
            <Flex h="80vh" align="center" justify="center">
                <VStack gap={5}>
                    <Image 
                        src="/aisha-logo.png" 
                        boxSize="60px" 
                        borderRadius="xl"
                        className="float-animation"
                        filter="drop-shadow(0 0 20px rgba(99, 102, 241, 0.6))"
                    />
                    <Text color="indigo.400" fontWeight="black" letterSpacing="widest" fontSize="xs">INITIALIZING SECURE PROTOCOLS...</Text>
                </VStack>
            </Flex>
        );
    }
    if (isMatchingActive) {
        return (
            <Container maxW="container.md" pt={20}>
                <VStack gap={8} textAlign="center" className="glass-panel" p={12} border="1px solid" borderColor="indigo.500/30">
                    <Box pos="relative" className="float-animation">
                        <Image 
                            src="/aisha-logo.png" 
                            boxSize="80px" 
                            borderRadius="xl"
                            filter="drop-shadow(0 0 40px rgba(99, 102, 241, 0.8))"
                        />
                        <Circle pos="absolute" top="-4" right="-4" size="8" bg="indigo.500" animation="ping 2s infinite" opacity="0.6" />
                    </Box>
                    <VStack gap={2}>
                        <Heading size="lg" color="#F8FAFC" fontWeight="black" letterSpacing="tight">DEEP MATCHING IN PROGRESS</Heading>
                        <Text color="#F8FAFC" fontSize="sm" fontWeight="bold">
                            AISHA is analyzing institutional records and corporate requirements to secure your optimal placement.
                        </Text>
                    </VStack>
                    <HStack gap={4}>
                        <Box h="2px" w="100px" bgGradient="linear(to-r, transparent, indigo.500, transparent)" />
                        <Text fontSize="10px" color="indigo.400" fontWeight="black" letterSpacing="widest">AI ANALYSIS ACTIVE</Text>
                        <Box h="2px" w="100px" bgGradient="linear(to-r, transparent, indigo.500, transparent)" />
                    </HStack>
                </VStack>
            </Container>
        );
    }
    if (!targetApp) {
        return (
            <Container maxW="container.md" pt={20}>
                <VStack gap={8} textAlign="center" className="glass-panel" p={12}>
                    <Icon as={LuActivity} boxSize={16} color="whiteAlpha.200" />
                    <VStack gap={2}>
                        <Heading size="lg" color="#F8FAFC" fontWeight="black">NO ATTACHMENT ASSIGNED</Heading>
                        <Text color="#F8FAFC" fontWeight="bold">You haven't been matched or assigned to any attachment opportunities yet.</Text>
                    </VStack>
                    <Button colorPalette="indigo" variant="outline" onClick={() => navigate('/student/dashboard')}>
                        Check Dashboard
                    </Button>
                </VStack>
            </Container>
        );
    }

    // === HELPERS ===
    const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api(.*)?$/, '');
    const getMediaUrl = (url?: string | null): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BACKEND_URL}${url}`;
    };

    const handleDownloadLetter = async (appId: string) => {
        setIsDownloading(true);
        try {
            const response = await apiClient.get(`/applications/download-acceptance-letter/${appId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Acceptance_Letter_${targetApp.company_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Wait before cleanup to ensure the browser has initiated the download
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
            }, 10000); // 10s is plenty of time for any browser to start the download

            toaster.create({ title: "Letter Downloaded", description: "Your official acceptance PDF is ready.", type: "success" });
        } catch (error) {
            toaster.create({ title: "Download Failed", description: "Acceptance letter is not yet available.", type: "error" });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleViewLetter = async (appId: string) => {
        // Create the window reference immediately in the synchronous path
        let newTab: Window | null = null;
        try {
            newTab = window.open('about:blank', '_blank');
        } catch (e) {
            console.error('Failed to open new tab:', e);
        }

        if (!newTab) {
            toaster.create({ 
                title: "Pop-up Blocked", 
                description: "Please allow pop-ups for this site to view the letter.", 
                type: "error" 
            });
            return;
        }

        // Show a temporary loading message in the new tab
        try {
            newTab.document.write(`
                <html>
                    <head>
                        <title>Loading Acceptance Letter...</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body style="background: #020617; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; width: 100%; font-family: sans-serif; margin: 0; padding: 20px; box-sizing: border-box;">
                        <div style="text-align: center; max-width: 400px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <img src="${window.location.origin}/aisha-logo.png" alt="AISHA Loading..." style="width: 70px; height: 70px; border-radius: 12px; margin-bottom: 30px; animation: aishaPulse 2s infinite ease-in-out; filter: drop-shadow(0 0 25px rgba(99, 102, 241, 0.8));" />
                            <h1 style="font-weight: 900; font-size: 1.2rem; letter-spacing: 0.1em; margin-bottom: 12px; color: #f8fafc; text-align: center;">AISHA IS GENERATING YOUR LETTER...</h1>
                            <p style="color: #94a3b8; font-size: 0.9rem; font-weight: 500; text-align: center;">Please wait while we secure your document.</p>
                        </div>
                        <style>
                            @keyframes aishaPulse { 
                                0%, 100% { transform: scale(1); opacity: 1; } 
                                50% { transform: scale(1.1); opacity: 0.8; filter: drop-shadow(0 0 40px rgba(99, 102, 241, 1)); } 
                            }
                        </style>
                    </body>
                </html>
            `);
        } catch (e) {
            // Some browsers might restrict document.write on cross-origin or for other reasons
            console.warn('Could not write to new tab document:', e);
        }

        setIsViewing(true);
        try {
            const response = await apiClient.get(`/applications/download-acceptance-letter/${appId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            
            if (newTab && !newTab.closed) {
                newTab.location.href = url;
                // Revoke URL after a delay to ensure it's loaded
                setTimeout(() => window.URL.revokeObjectURL(url), 5000);
            } else {
                // If window was closed by user, just clean up
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            if (newTab && !newTab.closed) newTab.close();
            toaster.create({ title: "View Failed", description: "Acceptance letter cannot be viewed at this time.", type: "error" });
        } finally {
            setIsViewing(false);
        }
    };

    const handleOfferResponse = async (decision: 'ACCEPTED' | 'DECLINED') => {
        try {
            await StudentService.respondToOffer(targetApp.id, decision);
            toaster.create({ title: `Offer ${decision}`, type: "success" });
            dispatch(fetchMyApplications());
        } catch (error) {
            toaster.create({ title: "Response Failed", description: "Could not process offer response", type: "error" });
        }
    };



    const startDateStr = targetApp.start_date
        ? new Date(targetApp.start_date).toLocaleDateString()
        : (targetApp.applied_at ? new Date(targetApp.applied_at).toLocaleDateString() : 'TBD');

    const isAccepted = targetApp.status === 'ACCEPTED';

    // ================================================================
    // MAIN RENDER — Clean, consolidated single-page layout
    // ================================================================
    return (
        <Container maxW="container.md" pb={12} pt={4} overflowX="hidden">
            <Toaster />
            <VStack gap={5} align="stretch">

                {/* ── TOP BAR ── */}
                <Flex justify="space-between" align="center">
                    <Button variant="ghost" color="var(--terminal-accent)" onClick={() => navigate('/student/dashboard')} fontWeight="black" fontSize="xs" _hover={{ bg: "whiteAlpha.100" }}>
                        <Icon as={LuChevronLeft} /> DASHBOARD
                    </Button>
                    <HStack gap={2}>

                    </HStack>
                </Flex>

                {/* ── HERO — Company + Role + Key Stats ── */}
                <MotionBox
                    className="glass-panel"
                    borderRadius="2xl"
                    overflow="hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    pos="relative"
                    bg="var(--terminal-card)"
                    border="1px solid"
                    borderColor="var(--terminal-border)"
                >
                    <Box pos="absolute" top="-60px" right="-60px" w="250px" h="250px" bg="indigo.600" borderRadius="full" filter="blur(120px)" opacity="0.08" />

                    <Box p={{ base: 5, md: 7 }}>
                        {/* Company Identity Row */}
                        <Flex gap={4} align="center" mb={5} direction={{ base: 'column', sm: 'row' }} flexWrap="wrap">
                            <Circle
                                size="70px" bg="white"
                                border="3px solid" borderColor="indigo.500"
                                boxShadow="0 0 30px rgba(0, 184, 212, 0.15)"
                                overflow="hidden" flexShrink={0}
                            >
                                <Image
                                    src={getMediaUrl(targetApp.profile_picture_url || targetApp.logo_url) || `https://logo.clearbit.com/${targetApp.company_name?.toLowerCase().replace(/\s+/g, '')}.com`}
                                    w="100%" h="100%" objectFit="cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/placeholder-company.png";
                                    }}
                                />
                            </Circle>
                            <Box flex="1" minW={0} textAlign={{ base: 'center', sm: 'left' }}>
                                <Heading size="lg" color="#F8FAFC" fontWeight="black" lineHeight="1.1" mb={1} wordBreak="break-word">
                                    {targetApp.job_title}
                                </Heading>
                                <HStack gap={2} justify={{ base: 'center', sm: 'flex-start' }} flexWrap="wrap">
                                    <HStack gap={1} color="var(--terminal-accent)">
                                        <Icon as={LuBuilding2} boxSize={3.5} />
                                        <Text fontWeight="black" fontSize="sm">{targetApp.company_name}</Text>
                                    </HStack>
                                    {targetApp.location && (
                                        <HStack gap={1} color="#F8FAFC">
                                            <Icon as={LuMapPin} boxSize={3.5} />
                                            <Text fontSize="sm" fontWeight="bold">{targetApp.location}</Text>
                                        </HStack>
                                    )}
                                </HStack>
                            </Box>
                            {/* Quick Actions */}
                        </Flex>

                        {/* Key Stats Row — 4 compact metrics */}
                        <Grid templateColumns="1fr 1fr" gap={2}>
                            <HStack gap={3} p={3} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="var(--terminal-border)">
                                <Circle bg="indigo.500/10" size={9}><Icon as={LuCpu} color="var(--terminal-accent)" boxSize={4} /></Circle>
                                <VStack align="start" gap={0}>
                                    <Text fontSize="9px" color="var(--terminal-accent)" fontWeight="black" letterSpacing="wider">MATCH</Text>
                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">{targetApp.match_score}%</Text>
                                </VStack>
                            </HStack>
                            <HStack gap={3} p={3} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.300">
                                <Circle bg="indigo.500/10" size={9}><Icon as={LuClock} color="var(--terminal-accent)" boxSize={4} /></Circle>
                                <VStack align="start" gap={0}>
                                    <Text fontSize="9px" color="var(--terminal-accent)" fontWeight="black" letterSpacing="wider">DURATION</Text>
                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">3 Months</Text>
                                </VStack>
                            </HStack>
                            <HStack gap={3} p={3} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.300">
                                <Circle bg="green.500/10" size={9}><Icon as={LuCalendar} color="green.400" boxSize={4} /></Circle>
                                <VStack align="start" gap={0}>
                                    <Text fontSize="9px" color="var(--terminal-accent)" fontWeight="black" letterSpacing="wider">STARTS</Text>
                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">{startDateStr}</Text>
                                </VStack>
                            </HStack>
                            <HStack gap={3} p={3} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.300">
                                <Circle bg="purple.500/10" size={9}><Icon as={LuDollarSign} color="purple.400" boxSize={4} /></Circle>
                                <VStack align="start" gap={0}>
                                    <Text fontSize="9px" color="var(--terminal-accent)" fontWeight="black" letterSpacing="wider">STIPEND</Text>
                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">
                                        {targetApp.stipend_amount && targetApp.stipend_amount > 0 ? `KES ${targetApp.stipend_amount.toLocaleString()}/mo` : 'Unpaid'}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Grid>
                    </Box>

                    {/* Match Analysis — inline strip at bottom of hero */}
                    <Box px={{ base: 6, md: 8 }} py={4} bg="whiteAlpha.30" borderTop="1px solid" borderColor="whiteAlpha.50">
                        <HStack gap={2} mb={1.5}>
                            <Icon as={LuSparkles} color="yellow.400" boxSize={3.5} />
                            <Text fontSize="10px" fontWeight="black" letterSpacing="2px" color="yellow.400">AI MATCH ANALYSIS</Text>
                        </HStack>
                        <Text color="#F8FAFC" fontSize="sm" fontStyle="italic" lineHeight="relaxed" fontWeight="bold">
                            "{targetApp.match_reasoning || targetApp.match_reason || `Your academic profile and skill set in ${profile?.course_of_study || 'relevant units'} align well with the requirements for this position at ${targetApp.company_name}.`}"
                        </Text>
                    </Box>
                </MotionBox>

                {/* ── PREFERENCE CHANGE BANNER ── */}
                {showPreferenceBanner && (
                    <MotionBox
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                        p={4} borderRadius="xl"
                        bg={isPreferencesLocked ? "red.900/40" : "indigo.900/40"}
                        border="1px solid"
                        borderColor={isPreferencesLocked ? "red.500/50" : "indigo.400/50"}
                    >
                        <Flex justify="space-between" align="center" gap={4} direction={{ base: 'column', sm: 'row' }}>
                            <HStack gap={3}>
                                <Circle size={10} bg={isPreferencesLocked ? "red.500/20" : "indigo.500/20"}>
                                    <Icon as={LuClock} color={isPreferencesLocked ? "red.400" : "indigo.400"} boxSize={5} />
                                </Circle>
                                <VStack align="start" gap={0}>
                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">
                                        {isPreferencesLocked ? "PREFERENCES LOCKED" : "PREFERENCE EDIT WINDOW"}
                                    </Text>
                                    <Text color="whiteAlpha.600" fontSize="xs">
                                        {isPreferencesLocked
                                            ? "Your 24-hour window has expired. Your match is now finalized and preferences cannot be changed."
                                            : "You can still change your profile preferences (skills, career path) to get a new match before time runs out."}
                                    </Text>
                                </VStack>
                            </HStack>
                            {!isPreferencesLocked && (
                                <HStack gap={2} flexShrink={0} bg="blackAlpha.30" p={2} borderRadius="xl" border="1px solid" borderColor="var(--terminal-border)">
                                    <Text color="var(--terminal-accent)" fontWeight="black" fontSize="lg" fontFamily="monospace" minW="120px" textAlign="center">
                                        {preferenceTimeLeft}
                                    </Text>
                                </HStack>
                            )}
                        </Flex>
                    </MotionBox>
                )}

                {/* ── OFFER ACTION BANNER (only if OFFERED) ── */}
                {targetApp.status === 'OFFERED' && (
                    <MotionBox
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
                        p={5} borderRadius="xl" bg="indigo.900/60" border="1px solid" borderColor="indigo.500/50"
                    >
                        <Flex justify="space-between" align="center" gap={4} direction={{ base: 'column', sm: 'row' }}>
                            <HStack gap={3}>
                                <Circle size={10} bg="indigo.500/20"><Icon as={LuShieldCheck} color="indigo.400" boxSize={5} /></Circle>
                                <VStack align="start" gap={0}>
                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">OFFER ACTION REQUIRED</Text>
                                    <Text color="whiteAlpha.600" fontSize="xs">The company has extended a formal offer. Please confirm your decision.</Text>
                                </VStack>
                            </HStack>
                            <HStack gap={2} flexShrink={0}>
                                <Button size="sm" colorPalette="green" onClick={() => handleOfferResponse('ACCEPTED')} borderRadius="lg">
                                    <Icon as={LuShieldCheck} /> Accept
                                </Button>
                                <Button size="sm" variant="outline" colorPalette="red" onClick={() => handleOfferResponse('DECLINED')} borderRadius="lg">
                                    Decline
                                </Button>
                            </HStack>
                        </Flex>
                    </MotionBox>
                )}

                {/* ── CONTENT AREA — Two columns on desktop ── */}
                <Grid templateColumns="1fr" gap={4}>

                    {/* LEFT — Description & Requirements */}
                    <MotionBox
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                        className="glass-panel" p={{ base: 6, md: 7 }} borderRadius="2xl"
                    >
                        <VStack align="start" gap={5}>
                            <Text fontSize="10px" fontWeight="black" letterSpacing="widest" color="var(--terminal-accent)">PLACEMENT OVERVIEW</Text>
                            <Text color="whiteAlpha.900" lineHeight="tall" fontSize="sm">
                                {targetApp.description || `This placement at ${targetApp.company_name} involves direct immersion into ${targetApp.job_title} workflows. You will collaborate with team leads to solve technical challenges, contribute to projects, and develop enterprise-grade skillsets.`}
                            </Text>

                            {/* Requirements Tags */}
                            <Box w="full">
                                <Text fontSize="10px" fontWeight="black" letterSpacing="wider" color="var(--terminal-accent)" mb={2}>REQUIREMENTS</Text>
                                <Flex wrap="wrap" gap={2}>
                                    {(typeof targetApp.requirements === 'string' ? targetApp.requirements.split(',') : (targetApp.requirements || ["Technical Proficiency", "Collaboration", "System Design"])).map((req: string, i: number) => (
                                        <Badge 
                                            key={i} 
                                            size="sm" 
                                            variant="solid" 
                                            colorPalette="brand" 
                                            textTransform="none" 
                                            borderRadius="lg" 
                                            px={2.5} 
                                            py={0.5} 
                                            fontWeight="black"
                                            whiteSpace="normal"
                                            textAlign="left"
                                            maxW="full"
                                        >
                                            {req.trim()}
                                        </Badge>
                                    ))}
                                </Flex>
                            </Box>
                        </VStack>
                    </MotionBox>

                    {/* RIGHT — Actions column */}
                    <VStack gap={4} align="stretch">

                        {/* Acceptance Letter — compact inline strip, NOT a card */}
                        <MotionBox
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
                            p={4} borderRadius="xl" bg="whiteAlpha.50" border="1px solid" borderColor="var(--terminal-border)"
                        >
                            <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
                                <HStack gap={3} minW={0}>
                                    <Icon as={LuFileText} color="var(--terminal-accent)" boxSize={5} flexShrink={0} />
                                    <VStack align="start" gap={0}>
                                        <Text color="#F8FAFC" fontWeight="black" fontSize="sm">Acceptance Letter</Text>
                                        <Text color="var(--terminal-accent)" fontSize="10px" fontWeight="black">
                                            {isAccepted ? 'PDF ready for download' : 'Available after acceptance'}
                                        </Text>
                                    </VStack>
                                </HStack>
                                <HStack gap={2} flexShrink={0}>
                                    <Button
                                        size="xs" variant="solid" colorPalette="brand"
                                        onClick={() => handleViewLetter(targetApp.id)}
                                        borderRadius="lg" cursor="pointer"
                                        loading={isViewing}
                                    >
                                        <Icon as={LuEye} /> View
                                    </Button>
                                    <Button
                                        size="xs" colorPalette="brand" variant="solid" fontWeight="black"
                                        onClick={() => handleDownloadLetter(targetApp.id)}
                                        borderRadius="lg" cursor="pointer"
                                        loading={isDownloading}
                                    >
                                        <Icon as={LuDownload} /> Download
                                    </Button>
                                </HStack>
                            </Flex>
                        </MotionBox>

                        {/* Scheduled Assessments */}
                        <MotionBox
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}
                            p={4} borderRadius="xl" bg="indigo.500/5" border="1px solid" borderColor="indigo.500/30"
                        >
                            <VStack align="stretch" gap={3}>
                                <HStack gap={3}>
                                    <Icon as={LuCalendar} color="var(--terminal-accent)" boxSize={5} />
                                    <VStack align="start" gap={0}>
                                        <Text color="#F8FAFC" fontWeight="black" fontSize="sm">Scheduled Assessments</Text>
                                        <Text color="var(--terminal-accent)" fontSize="10px" fontWeight="black">University Supervisor Visits</Text>
                                    </VStack>
                                </HStack>
                                <Flex justify="space-between" align="center" bg="whiteAlpha.100" p={2} borderRadius="md" mt={2}>
                                    <Text fontSize="12px" color="#F8FAFC" fontWeight="black">1st Assessment:</Text>
                                    <Badge colorPalette={targetApp.first_assessment_date ? "cyan" : "gray"} variant="solid" size="sm" px={2} borderRadius="md" fontWeight="black">
                                        {targetApp.first_assessment_date ? new Date(targetApp.first_assessment_date).toLocaleDateString() : 'Pending Schedule'}
                                    </Badge>
                                </Flex>
                                <Flex justify="space-between" align="center" bg="whiteAlpha.100" p={2} borderRadius="md">
                                    <Text fontSize="12px" color="#F8FAFC" fontWeight="black">2nd Assessment:</Text>
                                    <Badge colorPalette={targetApp.second_assessment_date ? "purple" : "gray"} variant="solid" size="sm" px={2} borderRadius="md">
                                        {targetApp.second_assessment_date ? new Date(targetApp.second_assessment_date).toLocaleDateString() : 'Pending Schedule'}
                                    </Badge>
                                </Flex>
                            </VStack>
                        </MotionBox>

                        {/* Financial — compact strip */}
                        <MotionBox
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                            p={4} borderRadius="xl"
                            bg={targetApp.student_payment_required && !targetApp.is_paid ? "orange.500/5" : "green.500/5"}
                            border="1px solid"
                            borderColor={targetApp.student_payment_required && !targetApp.is_paid ? "orange.500/30" : "green.500/30"}
                        >
                            {targetApp.student_payment_required ? (
                                targetApp.is_paid ? (
                                    <Flex align="center" justify="space-between">
                                        <HStack gap={3}>
                                            <Circle size={8} bg="green.500/20">
                                                <Icon as={LuShieldCheck} color="green.400" />
                                            </Circle>
                                            <VStack align="start" gap={0}>
                                                <Text color="green.400" fontWeight="black" fontSize="sm">Placement Fee Paid</Text>
                                                <Text color="whiteAlpha.400" fontSize="10px">Payment verified via M-Pesa</Text>
                                            </VStack>
                                        </HStack>
                                        <Badge colorPalette="green" variant="solid" size="sm" borderRadius="md">COMPLETED</Badge>
                                    </Flex>
                                ) : (
                                    <VStack align="stretch" gap={3}>
                                        <Flex justify="space-between" align="center">
                                            <HStack gap={3}>
                                                <Icon as={LuWallet} color="var(--terminal-accent)" boxSize={5} />
                                                <VStack align="start" gap={0}>
                                                    <Text color="#F8FAFC" fontWeight="black" fontSize="sm">Placement Fee Required</Text>
                                                    <Text color="var(--terminal-accent)" fontSize="10px" fontWeight="black">Institutional insurance & administration</Text>
                                                </VStack>
                                            </HStack>
                                            <Text color="#F8FAFC" fontWeight="black" fontSize="md">KES {targetApp.student_payment_amount?.toLocaleString()}</Text>
                                        </Flex>
                                        <Button
                                            w="full" colorPalette="green" size="sm"
                                            onClick={() => setIsPaymentModalOpen(true)} fontWeight="black" borderRadius="lg"
                                            bg="#4FB13C" _hover={{ bg: "#43a032" }}
                                        >
                                            <Icon as={LuSmartphone} /> PAY VIA M-PESA
                                        </Button>
                                    </VStack>
                                )
                            ) : (
                                <Flex align="center" gap={3}>
                                    <Icon as={LuShieldCheck} color="green.400" boxSize={5} />
                                    <VStack align="start" gap={0}>
                                        <Text color="green.400" fontWeight="bold" fontSize="sm">No Fee Required</Text>
                                        <Text color="whiteAlpha.400" fontSize="10px">This placement is fully sponsored</Text>
                                    </VStack>
                                </Flex>
                            )}
                        </MotionBox>

                        {/* Verified footer stamp — subtle, not a card */}
                        <Flex align="center" justify="center" gap={2} py={3} opacity={0.4}>
                            <Icon as={LuSparkles} color="var(--terminal-accent)" boxSize={3.5} />
                            <Text fontSize="10px" color="var(--terminal-accent)" fontWeight="black" letterSpacing="wider">VERIFIED BY AISHA</Text>
                        </Flex>
                    </VStack>
                </Grid>
            </VStack>

            {targetApp && (
                <MpesaPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    amount={targetApp.student_payment_amount || 0}
                    opportunityId={targetApp.opportunity_id}
                    onSuccess={() => {
                        setIsPaymentModalOpen(false);
                        dispatch(fetchMyApplications());
                    }}
                />
            )}
        </Container>
    );
};

export default RedesignedPlacement;
