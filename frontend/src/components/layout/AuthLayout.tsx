import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, VStack, Icon, Text, useToken, HStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import AuthBackground from '../auth/AuthBackground';
import { FaCheckCircle, FaRocket, FaShieldAlt, FaStar, FaBrain, FaChartLine, FaRobot, FaLock } from 'react-icons/fa';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    portal?: string | null;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, portal }) => {

    const getThemeColor = () => {
        switch (portal) {
            case 'student': return 'blue.500';
            case 'company': return 'purple.500';
            case 'institution': return 'green.500';
            case 'admin': return 'red.500';
            default: return 'brand.500';
        }
    };

    const themeColor = getThemeColor();
    const [tokenColor] = useToken('colors', [themeColor]);

    const marketingContent = {
        student: [
            { icon: FaRocket, title: "Guaranteed Attachments", desc: "Get matched with top-tier companies globally." },
            { icon: FaBrain, title: "AI Career Pathing", desc: "Discover your true potential with neural insights." },
            { icon: FaCheckCircle, title: "Industry Verified", desc: "Your skills, certified by AI-driven validation." },
            { icon: FaStar, title: "Be Digitally Placed", desc: "Start your professional journey with confidence." },
            { icon: FaRocket, title: "Register to Simplify Your Career", desc: "The fastest way to land your dream role." },
            { icon: FaChartLine, title: "Resume Optimization", desc: "AI-driven refinement for maximum impact." }
        ],
        company: [
            { icon: FaStar, title: "AI-Ranked Talent", desc: "Find the perfect fit using advanced neural matching." },
            { icon: FaChartLine, title: "Hiring Velocity", desc: "Reduce time-to-hire by 60% with AI automation." },
            { icon: FaShieldAlt, title: "Verified Skills", desc: "Hire with confidence via deep-skill verification." },
            { icon: FaRobot, title: "Login to Discover Top Talent", desc: "Your next superstar is just a neural match away." },
            { icon: FaBrain, title: "Automated Shortlisting", desc: "Let AI handle the initial screening for you." },
            { icon: FaCheckCircle, title: "Digital Recruitment", desc: "Modernize your hiring pipeline today." }
        ],
        institution: [
            { icon: FaChartLine, title: "Success Tracking", desc: "Monitor student career growth in real-time." },
            { icon: FaCheckCircle, title: "Placements Made Easy", desc: "Automate the management of student attachment programs." },
            { icon: FaBrain, title: "Curriculum Insights", desc: "Align programs with market demand using AI data." },
            { icon: FaRocket, title: "Register to Simplify Management", desc: "Centralize your institutional workflows." },
            { icon: FaStar, title: "Empower Your Students", desc: "Provide them with the best career opportunities." },
            { icon: FaCheckCircle, title: "Be Digitally Integrated", desc: "The future of academic management is here." }
        ],
        admin: [
            { icon: FaRobot, title: "Neural Oversight", desc: "Monitor global system health and neural processing." },
            { icon: FaShieldAlt, title: "Sovereign Security", desc: "Advanced data protection and access control." },
            { icon: FaStar, title: "System Analytics", desc: "Real-time insights across all platform portals." },
            { icon: FaChartLine, title: "Total Control", desc: "Manage every aspect of the AISHA ecosystem." },
            { icon: FaLock, title: "Login to Manage Global Operations", desc: "Secure access to the core system." },
            { icon: FaShieldAlt, title: "Data Integrity Guaranteed", desc: "Ensuring the highest standards of data safety." }
        ]
    };

    const currentContent = marketingContent[portal as keyof typeof marketingContent] || marketingContent.student;

    // Fixed Neural Hub Logic
    const hubRef = useRef<HTMLDivElement>(null);
    const satelliteRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [lineCoords, setLineCoords] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } }[]>([]);

    useEffect(() => {
        const updateCoords = () => {
            if (!hubRef.current) return;
            const hubRect = hubRef.current.getBoundingClientRect();
            const hubCenter = {
                x: hubRect.left + hubRect.width / 2,
                y: hubRect.top + hubRect.height / 2
            };

            const targetYOffsets = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

            const newCoords = satelliteRefs.current.map((sat, i) => {
                if (!sat) return null;
                const rect = sat.getBoundingClientRect();
                const isLeft = rect.left < hubCenter.x;

                return {
                    start: {
                        x: isLeft ? rect.right : rect.left,
                        y: rect.top + rect.height / 2
                    },
                    end: {
                        x: hubCenter.x + (isLeft ? -hubRect.width / 2 : hubRect.width / 2),
                        y: hubRect.top + (hubRect.height * targetYOffsets[i])
                    }
                };
            }).filter(Boolean) as { start: { x: number, y: number }, end: { x: number, y: number } }[];

            setLineCoords(newCoords);
        };

        const timeoutId = setTimeout(updateCoords, 100);
        window.addEventListener('resize', updateCoords);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateCoords);
        };
    }, [portal]);

    const satellitePositions = [
        { top: "15%", left: "5%" },
        { top: "50%", left: "2%", transform: "translateY(-50%)" },
        { bottom: "15%", left: "5%" },
        { top: "15%", right: "5%" },
        { top: "50%", right: "2%", transform: "translateY(-50%)" },
        { bottom: "15%", right: "5%" },
    ];

    return (
        <Flex
            minH="100vh"
            h="100vh"
            w="full"
            maxW="100vw"
            position="relative"
            bg="gray.900"
            overflow="hidden"
            align="center"
            justify="center"
        >
            <AuthBackground themeColor={themeColor} portal={portal} />

            {/* Neural Connections Layer */}
            <Box position="absolute" top={0} left={0} w="full" h="full" pointerEvents="none" zIndex={1} display={{ base: 'none', lg: 'block' }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {lineCoords.map((line, i) => {
                        const isStraight = i === 1 || i === 4;
                        const controlOffset = 80;
                        const isLeft = line.start.x < line.end.x;

                        const d = isStraight
                            ? `M ${line.start.x} ${line.start.y} L ${line.end.x} ${line.end.y}`
                            : `M ${line.start.x} ${line.start.y} C ${line.start.x + (isLeft ? controlOffset : -controlOffset)} ${line.start.y}, ${line.end.x + (isLeft ? -controlOffset : controlOffset)} ${line.end.y}, ${line.end.x} ${line.end.y}`;

                        return (
                            <motion.path
                                key={i}
                                d={d}
                                stroke={tokenColor}
                                strokeWidth="2"
                                fill="transparent"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.4 }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                                style={{ filter: 'drop-shadow(0 0 10px ' + tokenColor + ')' }}
                            />
                        );
                    })}
                </svg>
            </Box>

            {/* Satellite Nodes */}
            <Box position="absolute" top={0} left={0} w="full" h="full" pointerEvents="none" zIndex={2} display={{ base: 'none', lg: 'block' }}>
                {currentContent.map((item, i) => (
                    <Box
                        key={i}
                        ref={(el: HTMLDivElement | null) => { satelliteRefs.current[i] = el; }}
                        position="absolute"
                        {...satellitePositions[i]}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                        >
                            <Box
                                bg="whiteAlpha.100"
                                backdropFilter="blur(25px)"
                                p={4}
                                borderRadius="2xl"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                w="280px"
                                boxShadow="2xl"
                            >
                                <HStack gap={3}>
                                    <Box p={2} borderRadius="xl" bg={`${themeColor.split('.')[0]}.500`} boxShadow={`0 0 15px var(--chakra-colors-${themeColor.split('.')[0]}-500)`}>
                                        <Icon as={item.icon} color="white" fontSize="lg" />
                                    </Box>
                                    <VStack align="flex-start" gap={0}>
                                        <Text color="white" fontWeight="black" fontSize="sm" letterSpacing="tight">
                                            {item.title}
                                        </Text>
                                        <Text color="whiteAlpha.700" fontSize="xs" fontWeight="medium" maxW="180px" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.desc}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Box>
                        </motion.div>
                    </Box>
                ))}
            </Box>

            {/* Central Hub Container */}
            <Box
                ref={hubRef}
                position="relative"
                zIndex={3}
                w="full"
                maxW="md"
                p={{ base: 4, md: 0 }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        boxShadow: `0 0 80px -10px var(--chakra-colors-${themeColor.split('.')[0]}-500)`
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </Box>
        </Flex>
    );
};

export default AuthLayout;
