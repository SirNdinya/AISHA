import React, { useState } from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Card, Icon, Container, SimpleGrid, Link, Input, Textarea, Image, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBuilding, FaUniversity, FaUserShield, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhone, FaPaperPlane, FaArrowRight, FaCheckCircle, FaPlayCircle } from 'react-icons/fa';
import axios from 'axios';
import apiClient from '../services/apiClient';
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseTrigger } from '../components/ui/dialog';
import { Tooltip } from '../components/ui/tooltip';

import AishaAssistant from '../components/common/AishaAssistant';
import ThemeSwitcher from '../components/common/ThemeSwitcher';

interface PortalOption {
    title: string;
    description: string;
    icon: any;
    color: string;
    path: string;
}

const portals: PortalOption[] = [
    {
        title: 'Student Portal',
        description: 'Dashboard, attachment management, and profile synchronization',
        icon: FaGraduationCap,
        color: 'cyan.500',
        path: '/login?portal=student'
    },
    {
        title: 'Company Portal',
        description: 'Post opportunities, manage placements, and corporate profile',
        icon: FaBuilding,
        color: 'green.500',
        path: '/login?portal=company'
    },
    {
        title: 'Institution Portal',
        description: 'Oversee students, manage partnerships, and track placements',
        icon: FaUniversity,
        color: 'fuchsia.500',
        path: '/login?portal=institution'
    },
    {
        title: 'Admin Portal',
        description: 'System-wide configuration, user management, and core security',
        icon: FaUserShield,
        color: 'red.500',
        path: '/login?portal=admin'
    }
];

const PortalSelector: React.FC = () => {
    const navigate = useNavigate();
    
    // Contact form state
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const scrollToPortals = () => {
        const element = document.getElementById('portals');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFormSubmit = async () => {
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            setErrorMessage('All fields are required.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            await apiClient.post('/public/contact', formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            console.error('Contact submit error', error);
            setStatus('error');
            setErrorMessage(error.response?.data?.error || 'Failed to send message. Please try again.');
        }
    };

    return (
        <Box bg="#050505" color="white" minH="100vh" position="relative" overflowX="hidden">
            {/* Background Grid Overlay */}
            <Box 
                position="absolute" 
                top={0} 
                left={0} 
                right={0} 
                bottom={0} 
                zIndex={0} 
                opacity={0.03}
                pointerEvents="none"
                backgroundImage="radial-gradient(circle, white 1px, transparent 1px)"
                backgroundSize="40px 40px"
            />

            {/* Sticky Navigation Bar */}
            <Box
                as="nav"
                position="fixed"
                top={0}
                w="full"
                zIndex={100}
                backdropFilter="blur(24px) saturate(180%)"
                backgroundColor="rgba(5, 5, 5, 0.75)"
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
                transition="all 0.3s ease"
            >
                <Container maxW="container.xl" py={4}>
                    <HStack justify="space-between">
                        <HStack gap={3}>
                            <Image 
                                src="/aisha-logo.png" 
                                alt="AISHA Logo" 
                                boxSize="45px" 
                                borderRadius="xl"
                                objectFit="cover"
                                boxShadow="0 0 15px rgba(34, 211, 238, 0.4)"
                            />
                            <Heading size="lg" fontWeight="900" letterSpacing="tight" bgGradient="to-r" gradientFrom="white" gradientTo="whiteAlpha.700" bgClip="text">
                                AISHA
                            </Heading>
                        </HStack>
                        <HStack gap={8} display={{ base: 'none', md: 'flex' }}>
                            <Link href="#hero" fontWeight="600" fontSize="sm" color="whiteAlpha.800" _hover={{ color: 'cyan.400' }}>Home</Link>
                            <Link href="#about" fontWeight="600" fontSize="sm" color="whiteAlpha.800" _hover={{ color: 'cyan.400' }}>About</Link>
                            <Link href="#portals" fontWeight="600" fontSize="sm" color="whiteAlpha.800" _hover={{ color: 'cyan.400' }}>Portals</Link>
                            <Link href="#contact" fontWeight="600" fontSize="sm" color="whiteAlpha.800" _hover={{ color: 'cyan.400' }}>Contact</Link>
                        </HStack>
                        <HStack gap={4}>
                            <ThemeSwitcher />
                            <Button
                                colorPalette="cyan"
                                size="md"
                                borderRadius="full"
                                px={6}
                                fontWeight="bold"
                                onClick={scrollToPortals}
                                boxShadow="0 4px 14px 0 rgba(6, 182, 212, 0.39)"
                                _hover={{ transform: 'translateY(-2px)', boxShadow: "0 6px 20px rgba(6, 182, 212, 0.5)" }}
                                transition="all 0.2s"
                            >
                                Get Started
                            </Button>
                        </HStack>
                    </HStack>
                </Container>
            </Box>

            {/* Hero Section */}
            <Box id="hero" pt={40} pb={24} position="relative" overflow="hidden">
                <Box
                    position="absolute"
                    top="-20%"
                    left="-10%"
                    w="70%"
                    h="70%"
                    bgGradient="radial(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)"
                    zIndex={0}
                    filter="blur(120px)"
                />
                <Box
                    position="absolute"
                    bottom="-20%"
                    right="-10%"
                    w="70%"
                    h="70%"
                    bgGradient="radial(circle, rgba(217, 70, 239, 0.12) 0%, transparent 70%)"
                    zIndex={0}
                    filter="blur(120px)"
                />
                
                <Container maxW="container.lg" textAlign="center" position="relative" zIndex={1}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <VStack gap={8}>
                            <Heading 
                                size="4xl" 
                                fontSize={{ base: '5xl', md: '8xl' }}
                                fontWeight="900" 
                                letterSpacing="tighter"
                                lineHeight="0.95"
                            >
                                Connect Talent With <br />
                                <Box as="span" position="relative" display="inline-block">
                                    <Text 
                                        as="span" 
                                        bgGradient="to-r" 
                                        gradientFrom="cyan.300" 
                                        gradientTo="pink.300" 
                                        bgClip="text"
                                        color="transparent"
                                    >
                                        Limitless Potential
                                    </Text>
                                    <Box 
                                        position="absolute" 
                                        bottom="0" 
                                        left="0" 
                                        w="full" 
                                        h="8px" 
                                        bgGradient="to-r" 
                                        gradientFrom="cyan.500" 
                                        gradientTo="pink.500" 
                                        borderRadius="full"
                                        opacity="0.3"
                                        filter="blur(10px)"
                                    />
                                </Box>
                            </Heading>
                            <Text fontSize={{ base: 'lg', md: '2xl' }} color="whiteAlpha.700" maxW="3xl" lineHeight="1.6" fontWeight="400" letterSpacing="tight">
                                AISHA is an AI-powered platform designed to seamlessly bridge the gap between ambitious students, top-tier institutions, and industry-leading companies.
                            </Text>
                            <HStack gap={6} pt={6}>
                                <Button 
                                    size="xl" 
                                    colorPalette="cyan" 
                                    px={14} 
                                    py={8}
                                    borderRadius="full" 
                                    fontWeight="900" 
                                    fontSize="xl"
                                    onClick={scrollToPortals}
                                    boxShadow="0 0 30px rgba(6, 182, 212, 0.3)"
                                    _hover={{ transform: 'scale(1.05)', boxShadow: "0 0 50px rgba(6, 182, 212, 0.5)" }}
                                    transition="all 0.3s ease-in-out"
                                >
                                    Explore Portals
                                </Button>
                            </HStack>
                        </VStack>
                    </motion.div>
                </Container>
            </Box>

            {/* System Walkthrough Section */}
            <Box id="walkthrough" py={24} position="relative" borderTop="1px solid" borderColor="whiteAlpha.100">
                <Container maxW="container.xl">
                    <VStack gap={16}>
                        <VStack gap={5} textAlign="center">
                            <Heading size="3xl" fontWeight="900" letterSpacing="tight">Comprehensive Student Guide</Heading>
                            <Text color="whiteAlpha.600" fontSize="xl" maxW="2xl">
                                Master the Student Portal with this step-by-step breakdown. From adjusting AI preferences to managing your daily logbook.
                            </Text>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={10} w="full">
                            {[
                                { step: '01', title: 'Account Registration', desc: 'Create your secure profile on the platform using your academic details.' },
                                { step: '02', title: 'Verify Account', desc: 'Complete the email verification process to activate your profile and unlock portal access.' },
                                { step: '03', title: 'Profile & Preferences', desc: 'Update your matching preferences and skill sets to receive highly targeted attachments.' },
                                { step: '04', title: 'My Placement', desc: 'View your designated AI-matched placement. You have a strict 24-hour window to review, or edit your preferences to get new matches.' },
                                { step: '05', title: 'Acceptance Letters', desc: 'Once a placement is finalized, view and download your official Acceptance Letter directly from the "My Placement" tab.' },
                                { step: '06', title: 'Manage Logbooks', desc: 'After your attachment commences, use the "Logbook" tab to submit your daily activities and track weekly supervisor signatures.' }
                            ].map((item) => (
                                <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: parseInt(item.step) * 0.1 }}>
                                    <Box bg="rgba(15, 23, 42, 0.4)" p={8} h="full" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.100" _hover={{ borderColor: 'cyan.500', transform: 'translateY(-5px)', bg: 'rgba(15, 23, 42, 0.6)', boxShadow: '0 10px 30px rgba(6, 182, 212, 0.1)' }} transition="all 0.3s">
                                        <VStack align="start" gap={5}>
                                            <Box boxSize="50px" borderRadius="xl" bg="cyan.500" bgGradient="to-br" gradientFrom="cyan.400" gradientTo="blue.500" display="flex" alignItems="center" justifyContent="center" boxShadow="0 10px 20px rgba(6, 182, 212, 0.3)">
                                                <Text fontWeight="black" color="white" fontSize="lg">{item.step}</Text>
                                            </Box>
                                            <VStack align="start" gap={2}>
                                                <Text fontWeight="bold" fontSize="2xl" color="white">{item.title}</Text>
                                                <Text color="whiteAlpha.700" fontSize="md" lineHeight="1.6">{item.desc}</Text>
                                            </VStack>
                                        </VStack>
                                    </Box>
                                </motion.div>
                            ))}
                        </SimpleGrid>
                        
                        <Button mt={8} colorPalette="cyan" size="xl" px={10} py={6} borderRadius="full" fontWeight="bold" boxShadow="0 0 20px rgba(6, 182, 212, 0.3)" onClick={() => { const el = document.getElementById('portals'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
                            Explore Portals
                        </Button>
                    </VStack>
                </Container>
            </Box>

            {/* About Section */}
            <Box id="about" py={24} bg="whiteAlpha.50" position="relative" overflow="hidden">
                <Container maxW="container.xl" position="relative" zIndex={1}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={20} alignItems="center">
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                            <VStack align="start" gap={8}>
                                <Heading size="3xl" fontWeight="900" letterSpacing="tight">Redefining Growth</Heading>
                                <Text fontSize="xl" color="whiteAlpha.700" lineHeight="1.8">
                                    Our mission is to modernize the internship and attachment lifecycle through a 
                                    centralized digital ecosystem that ensures transparency, efficiency, and profound opportunities for all parties involved.
                                </Text>
                                <VStack align="start" gap={6} w="full">
                                    <Box bg="whiteAlpha.50" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" w="full" _hover={{ bg: "whiteAlpha.100", borderColor: "cyan.400", boxShadow: "0 0 20px rgba(6, 182, 212, 0.2)" }} transition="all 0.3s">
                                        <HStack gap={4}>
                                            <Box p={3} borderRadius="xl" bgGradient="to-br" gradientFrom="cyan.500" gradientTo="blue.600" boxShadow="lg"><Icon as={FaGraduationCap} color="white" fontSize="xl" /></Box>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="black" fontSize="lg">Empowering Students</Text>
                                                <Text color="whiteAlpha.600" fontSize="sm">Global visibility & intelligent matching</Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                    <Box bg="whiteAlpha.50" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" w="full" _hover={{ bg: "whiteAlpha.100", borderColor: "green.500" }} transition="all 0.3s">
                                        <HStack gap={4}>
                                            <Box p={3} borderRadius="xl" bgGradient="to-br" gradientFrom="green.400" gradientTo="teal.500" boxShadow="lg"><Icon as={FaBuilding} color="white" fontSize="xl" /></Box>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold" fontSize="lg">Connecting Companies</Text>
                                                <Text color="whiteAlpha.600" fontSize="sm">Streamlined hiring & top-tier talent</Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                </VStack>
                            </VStack>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                            <Box position="relative">
                                <Box
                                    boxSize={{ base: '300px', lg: '450px' }}
                                    bgGradient="to-br"
                                    gradientFrom="cyan.500"
                                    gradientTo="fuchsia.600"
                                    borderRadius="3xl"
                                    transform="rotate(6deg)"
                                    opacity={0.15}
                                    position="absolute"
                                    top={0}
                                    right={0}
                                    filter="blur(20px)"
                                />
                                <Box
                                    p={10}
                                    bg="rgba(15, 23, 42, 0.6)"
                                    backdropFilter="blur(20px)"
                                    border="1px solid"
                                    borderColor="whiteAlpha.300"
                                    borderRadius="3xl"
                                    position="relative"
                                    zIndex={1}
                                    boxShadow="2xl"
                                >
                                    <VStack align="start" gap={6}>
                                        <Box p={4} borderRadius="2xl" bgGradient="to-br" gradientFrom="cyan.500" gradientTo="fuchsia.500" boxShadow="0 10px 20px rgba(34, 211, 238, 0.4)">
                                            <Icon as={FaUserShield} fontSize="4xl" color="white" />
                                        </Box>
                                        <VStack align="start" gap={3}>
                                            <Heading size="xl" fontWeight="900">Secure & Verified</Heading>
                                            <Text color="whiteAlpha.800" fontSize="lg" lineHeight="1.7">
                                                Security is in our DNA. Every profile, institution, and company on AISHA is manually verified and monitored 
                                                to ensure the highest standards of data integrity and professional conduct. We use modern encryption to keep your data safe.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                </Box>
                            </Box>
                        </motion.div>
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Portals Section */}
            <Box id="portals" py={32} position="relative">
                <Box position="absolute" top="10%" left="50%" transform="translateX(-50%)" w="80%" h="60%" bg="cyan.900" opacity={0.1} filter="blur(120px)" borderRadius="full" zIndex={0} />
                <Container maxW="container.xl" position="relative" zIndex={1}>
                    <VStack gap={16}>
                        <VStack gap={5} textAlign="center">
                            <Heading size="3xl" fontWeight="900" letterSpacing="tight">Choose Your Gateway</Heading>
                            <Text color="whiteAlpha.600" fontSize="xl" maxW="2xl">
                                Access specialized tools and dashboards tailored exclusively to your role in the ecosystem.
                            </Text>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={8} w="full">
                            {portals.map((portal, index) => (
                                <motion.div 
                                    key={portal.title} 
                                    initial={{ opacity: 0, y: 20 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    viewport={{ once: true }} 
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Card.Root
                                        p={8}
                                        cursor="pointer"
                                        bg="rgba(15, 23, 42, 0.4)"
                                        backdropFilter="blur(20px)"
                                        border="1px solid"
                                        borderColor="whiteAlpha.100"
                                        borderRadius="3xl"
                                        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                                        h="full"
                                        _hover={{
                                            transform: 'translateY(-12px)',
                                            bg: 'rgba(15, 23, 42, 0.7)',
                                            borderColor: portal.color,
                                            boxShadow: `0 30px 60px -12px rgba(6, 182, 212, 0.25)`
                                        }}
                                        onClick={() => navigate(portal.path)}
                                    >
                                        <Card.Body h="full" display="flex" flexDirection="column">
                                            <VStack align="start" gap={6} flex="1" w="full">
                                                <Box
                                                    p={5}
                                                    borderRadius="2xl"
                                                    bg={`${portal.color.split('.')[0]}.500`}
                                                    bgGradient={`to-br`}
                                                    gradientFrom={`${portal.color.split('.')[0]}.400`}
                                                    gradientTo={`${portal.color.split('.')[0]}.600`}
                                                    boxShadow={`0 10px 20px -5px var(--chakra-colors-${portal.color.split('.')[0]}-500)`}
                                                >
                                                    <Icon fontSize="3xl" color="white">
                                                        <portal.icon />
                                                    </Icon>
                                                </Box>
                                                <VStack align="start" gap={3} flex="1">
                                                    <Heading size="lg" color="white" fontWeight="900">{portal.title}</Heading>
                                                    <Text fontSize="md" color="whiteAlpha.600" lineHeight="1.6">{portal.description}</Text>
                                                </VStack>
                                                <Button 
                                                    w="full" 
                                                    mt={2}
                                                    colorPalette={portal.color.split('.')[0]} 
                                                    variant="subtle" 
                                                    fontWeight="bold" 
                                                    borderRadius="xl"
                                                    pointerEvents="none"
                                                >
                                                    Enter Portal <Icon as={FaArrowRight} ml={2} />
                                                </Button>
                                            </VStack>
                                        </Card.Body>
                                    </Card.Root>
                                </motion.div>
                            ))}
                        </SimpleGrid>
                    </VStack>
                </Container>
            </Box>

            {/* Contact Section */}
            <Box id="contact" py={32} bg="blackAlpha.600" borderTop="1px solid" borderColor="whiteAlpha.100">
                <Container maxW="container.xl">
                    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={20}>
                        <VStack align="start" gap={10}>
                            <VStack align="start" gap={5}>
                                <Heading size="3xl" fontWeight="900" letterSpacing="tight">Get in Touch</Heading>
                                <Text color="whiteAlpha.700" fontSize="xl" lineHeight="1.6">
                                    Have questions about the AISHA platform? We're here to help you get integrated seamlessly.
                                </Text>
                            </VStack>
                            
                            <VStack align="start" gap={8} w="full">
                                <Tooltip content="Click to view map" showArrow>
                                    <Link 
                                        href="https://www.google.com/maps/search/?api=1&query=Masinde+Muliro+University+Kakamega"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        _hover={{ textDecoration: 'none' }}
                                        w="full"
                                        display="block"
                                    >
                                        <HStack gap={6} _hover={{ opacity: 0.8 }} transition="opacity 0.2s">
                                            <Box boxSize="60px" borderRadius="2xl" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" display="flex" alignItems="center" justifyContent="center">
                                                <Icon as={FaMapMarkerAlt} color="fuchsia.400" fontSize="2xl" />
                                            </Box>
                                            <VStack align="start" gap={1}>
                                                <Text fontWeight="black" fontSize="lg">MMUST-Kakamega</Text>
                                                <Text color="whiteAlpha.600" fontSize="md">Masinde Muliro University</Text>
                                            </VStack>
                                        </HStack>
                                    </Link>
                                </Tooltip>
                                <HStack gap={6}>
                                    <Box boxSize="60px" borderRadius="2xl" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" display="flex" alignItems="center" justifyContent="center">
                                        <Icon as={FaPhone} color="cyan.400" fontSize="2xl" />
                                    </Box>
                                    <VStack align="start" gap={1}>
                                        <Text fontWeight="black" fontSize="lg">Call Support</Text>
                                        <Text color="whiteAlpha.600" fontSize="md">+254 794 987 200</Text>
                                    </VStack>
                                </HStack>
                            </VStack>

                            <VStack align="start" gap={3} w="full" pt={6}>
                                <Text fontWeight="bold" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="widest" fontSize="sm">Chat directly</Text>
                                <HStack>
                                    <Button 
                                        asChild
                                        colorPalette="green" 
                                        size="xl" 
                                        borderRadius="full" 
                                        px={8} 
                                        boxShadow="0 4px 15px rgba(34, 197, 94, 0.4)"
                                        _hover={{ transform: 'translateY(-2px)' }}
                                    >
                                        <a 
                                            href="https://wa.me/254794987200"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Icon as={FaWhatsapp} mr={3} /> WhatsApp
                                        </a>
                                    </Button>
                                </HStack>
                            </VStack>
                        </VStack>

                        <Box 
                            bg="rgba(15, 23, 42, 0.8)" 
                            p={10} 
                            borderRadius="3xl" 
                            border="1px solid" 
                            borderColor="whiteAlpha.200"
                            boxShadow="2xl"
                            backdropFilter="blur(20px)"
                        >
                            <VStack gap={6} align="stretch">
                                <Heading size="lg" fontWeight="800" mb={2}>Send a Message</Heading>
                                
                                {status === 'success' && (
                                    <Box p={4} bg="green.500" color="white" borderRadius="xl" fontWeight="bold" textAlign="center">
                                        Your message has been sent successfully! Our team will get back to you shortly.
                                    </Box>
                                )}
                                
                                {status === 'error' && (
                                    <Box p={4} bg="red.500" color="white" borderRadius="xl" fontWeight="bold" textAlign="center">
                                        {errorMessage}
                                    </Box>
                                )}

                                <Input 
                                    placeholder="Your Name" 
                                    variant="subtle" 
                                    size="lg"
                                    bg="whiteAlpha.100" 
                                    border="1px solid" 
                                    borderColor="transparent"
                                    _focus={{ bg: 'whiteAlpha.200', borderColor: 'cyan.400' }} 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                                <Input 
                                    placeholder="Email Address" 
                                    variant="subtle" 
                                    size="lg"
                                    bg="whiteAlpha.100" 
                                    border="1px solid" 
                                    borderColor="transparent"
                                    _focus={{ bg: 'whiteAlpha.200', borderColor: 'cyan.400' }} 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                <Input 
                                    placeholder="Subject" 
                                    variant="subtle" 
                                    size="lg"
                                    bg="whiteAlpha.100" 
                                    border="1px solid" 
                                    borderColor="transparent"
                                    _focus={{ bg: 'whiteAlpha.200', borderColor: 'cyan.400' }} 
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                                <Textarea 
                                    placeholder="How can we help?" 
                                    variant="subtle" 
                                    bg="whiteAlpha.100" 
                                    border="1px solid" 
                                    borderColor="transparent"
                                    h="150px" 
                                    resize="none"
                                    py={4}
                                    _focus={{ bg: 'whiteAlpha.200', borderColor: 'cyan.400' }} 
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                />
                                <Button 
                                    colorPalette="cyan" 
                                    w="full" 
                                    size="xl" 
                                    fontWeight="900" 
                                    borderRadius="xl"
                                    onClick={handleFormSubmit}
                                    disabled={status === 'loading'}
                                    mt={2}
                                >
                                    {status === 'loading' ? <Spinner size="sm" mr={3} /> : <Icon as={FaPaperPlane} mr={3} />}
                                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                                </Button>
                            </VStack>
                        </Box>
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Footer */}
            <Box py={12} bg="black" borderTop="1px solid" borderColor="whiteAlpha.100">
                <Container maxW="container.xl">
                    <VStack gap={8}>
                        <HStack w="full" justify="space-between" flexDir={{ base: 'column', md: 'row' }} gap={6}>
                            <HStack gap={3}>
                                <Image src="/aisha-logo.png" boxSize="35px" borderRadius="lg" />
                                <Heading size="md" fontWeight="900" letterSpacing="widest">AISHA</Heading>
                            </HStack>
                            <HStack gap={10}>
                                <Link color="whiteAlpha.600" fontSize="sm" fontWeight="bold" _hover={{ color: "white" }}>Privacy Policy</Link>
                                <Link color="whiteAlpha.600" fontSize="sm" fontWeight="bold" _hover={{ color: "white" }}>Terms of Service</Link>
                                <Link color="whiteAlpha.600" fontSize="sm" fontWeight="bold" _hover={{ color: "white" }}>Cookie Settings</Link>
                            </HStack>
                        </HStack>
                        <Box w="full" h="1px" bg="whiteAlpha.100" />
                        <HStack w="full" justify="space-between" flexDir={{ base: 'column', md: 'row' }}>
                            <Text fontSize="sm" color="whiteAlpha.500" fontWeight="medium">
                                © {new Date().getFullYear()} AISHA Intelligence. All rights reserved.
                            </Text>
                            <Text fontSize="sm" color="whiteAlpha.500">
                                Crafted with precision and <Box as="span" color="red.500">♥</Box> for the future.
                            </Text>
                        </HStack>
                    </VStack>
                </Container>
            </Box>
            <AishaAssistant />
        </Box>
    );
};

export default PortalSelector;
