import { Box, Heading, Text, Button, VStack, HStack, Card, Icon, Container, SimpleGrid, Link, Input, Textarea, IconButton, DrawerRoot, DrawerBackdrop, DrawerContent, DrawerBody, DrawerCloseTrigger } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaGraduationCap, FaBuilding, FaUniversity, FaUserShield, FaLinkedin, FaTwitter, FaGithub, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { LuMenu, LuRocket } from 'react-icons/lu';

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
        color: 'indigo.500',
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
        color: 'purple.500',
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToPortals = () => {
        const element = document.getElementById('portals');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Box bg="gray.900" color="white" minH="100vh">
            {/* Sticky Navigation Bar */}
            <Box
                as="nav"
                position="fixed"
                top={0}
                w="full"
                zIndex={100}
                backdropFilter="blur(16px)"
                bg="rgba(15, 23, 42, 0.6)"
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
                px={6}
                py={4}
            >
                <Container maxW="container.xl">
                    <HStack justify="space-between" align="center">
                        <HStack gap={2}>
                            <Box w="32px" h="32px" bg="indigo.500" borderRadius="8px" display="flex" alignItems="center" justifyContent="center">
                                <LuRocket color="white" size={18} />
                            </Box>
                            <Heading size="md" fontWeight="black" letterSpacing="tight">AISHA</Heading>
                        </HStack>

                        <HStack gap={8} display={{ base: "none", lg: "flex" }}>
                            <Link href="#hero" color="whiteAlpha.700" fontWeight="medium" _hover={{ color: "indigo.400" }}>Home</Link>
                            <Link href="#about" color="whiteAlpha.700" fontWeight="medium" _hover={{ color: "indigo.400" }}>About</Link>
                            <Link href="#portals" color="whiteAlpha.700" fontWeight="medium" _hover={{ color: "indigo.400" }}>Portals</Link>
                            <Link href="#contact" color="whiteAlpha.700" fontWeight="medium" _hover={{ color: "indigo.400" }}>Contact</Link>
                        </HStack>

                        <HStack gap={4}>
                            <Button
                                variant="subtle"
                                colorPalette="indigo"
                                size="sm"
                                display={{ base: "none", md: "flex" }}
                                onClick={() => window.open('https://aisha.saps.ke', '_blank')}
                            >
                                Documentation
                            </Button>
                            <IconButton
                                aria-label="Open Menu"
                                display={{ base: "flex", lg: "none" }}
                                variant="ghost"
                                color="white"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <LuMenu size={24} />
                            </IconButton>
                        </HStack>
                    </HStack>
                </Container>
            </Box>

            {/* Mobile Nav Drawer */}
            <DrawerRoot
                open={isMobileMenuOpen}
                onOpenChange={(e) => setIsMobileMenuOpen(e.open)}
                placement="start"
                size="full"
            >
                <DrawerBackdrop />
                <DrawerContent bg="rgba(10, 11, 20, 0.95)" backdropFilter="blur(20px)">
                    <DrawerBody display="flex" flexDirection="column" p={8}>
                        <VStack gap={8} align="start" mt={12}>
                            <Link href="#hero" fontSize="2xl" fontWeight="bold" color="white" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                            <Link href="#about" fontSize="2xl" fontWeight="bold" color="white" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                            <Link href="#portals" fontSize="2xl" fontWeight="bold" color="white" onClick={() => setIsMobileMenuOpen(false)}>Portals</Link>
                            <Link href="#contact" fontSize="2xl" fontWeight="bold" color="white" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
                        </VStack>
                        <Box mt="auto" pb={8}>
                            <Button
                                w="full"
                                colorPalette="indigo"
                                size="lg"
                                onClick={() => {
                                    window.open('https://aisha.saps.ke', '_blank');
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Documentation
                            </Button>
                        </Box>
                    </DrawerBody>
                    <DrawerCloseTrigger color="white" top="6" right="6" />
                </DrawerContent>
            </DrawerRoot>

            {/* Hero Section */}
            <Box id="hero" pt={32} pb={20} position="relative" overflow="hidden">
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundImage="url('/landing-bg.png')"
                    backgroundSize="cover"
                    backgroundPosition="center"
                    zIndex={-1}
                    _after={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bg: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.95))',
                        backdropFilter: 'blur(4px)'
                    }}
                />
                
                <Container maxW="container.lg" textAlign="center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <VStack gap={6}>
                            <Box 
                                px={4} 
                                py={1.5} 
                                borderRadius="full" 
                                bg="whiteAlpha.100" 
                                border="1px solid" 
                                borderColor="whiteAlpha.300"
                            >
                                <Text fontSize="xs" fontWeight="black" letterSpacing="widest" textTransform="uppercase" color="indigo.300">
                                    Next-Gen Attachment Ecosystem
                                </Text>
                            </Box>
                            <Heading 
                                size="4xl" 
                                fontSize={{ base: '4xl', md: '6xl' }}
                                fontWeight="black" 
                                letterSpacing="tighter"
                                lineHeight="shorter"
                            >
                                Bridging Talent and <br />
                                <Text as="span" bgGradient="to-r" gradientFrom="indigo.400" gradientTo="blue.300" bgClip="text">
                                    Industry Opportunities
                                </Text>
                            </Heading>
                            <Text fontSize={{ base: 'md', md: 'xl' }} color="whiteAlpha.800" maxW="2xl">
                                AISHA is the unified platform connecting students, institutions, and companies. 
                                Streamlining attachments with AI-driven matching and secure verification.
                            </Text>
                            <HStack gap={4} pt={4}>
                                <Button size="lg" colorPalette="indigo" px={10} borderRadius="full" fontWeight="black" onClick={scrollToPortals}>
                                    Explore Portals
                                </Button>
                                <Button size="lg" variant="outline" borderColor="whiteAlpha.400" _hover={{ bg: 'whiteAlpha.100' }} px={10} borderRadius="full" fontWeight="black">
                                    Learn More
                                </Button>
                            </HStack>
                        </VStack>
                    </motion.div>
                </Container>
            </Box>

            {/* About Section */}
            <Box id="about" py={24} bg="rgba(15, 23, 42, 0.5)">
                <Container maxW="container.xl">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={20} alignItems="center">
                        <VStack align="start" gap={6}>
                            <Heading size="2xl" fontWeight="black">What is AISHA?</Heading>
                            <Text fontSize="lg" color="whiteAlpha.700">
                                AISHA stands for Advanced Intelligent Student-Industry Hub & Accelerator. 
                                Our mission is to modernize the internship and attachment lifecycle through a 
                                centralized digital ecosystem that ensures transparency, efficiency, and growth for all parties.
                            </Text>
                            <VStack align="start" gap={4}>
                                <HStack gap={4}>
                                    <Box p={2} borderRadius="lg" bg="indigo.500"><Icon as={FaGraduationCap} /></Box>
                                    <Text fontWeight="bold">Empowering Students with global visibility</Text>
                                </HStack>
                                <HStack gap={4}>
                                    <Box p={2} borderRadius="lg" bg="green.500"><Icon as={FaBuilding} /></Box>
                                    <Text fontWeight="bold">Connecting Companies with top-tier talent</Text>
                                </HStack>
                                <HStack gap={4}>
                                    <Box p={2} borderRadius="lg" bg="purple.500"><Icon as={FaUniversity} /></Box>
                                    <Text fontWeight="bold">Assisting Institutions in success tracking</Text>
                                </HStack>
                            </VStack>
                        </VStack>
                        <Box position="relative">
                            <Box
                                boxSize={{ base: '300px', lg: '450px' }}
                                bgGradient="to-br"
                                gradientFrom="indigo.500"
                                gradientTo="purple.600"
                                borderRadius="3xl"
                                transform="rotate(6deg)"
                                opacity={0.2}
                                position="absolute"
                                top={0}
                                right={0}
                            />
                            <Box
                                p={8}
                                bg="whiteAlpha.100"
                                backdropFilter="blur(20px)"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                borderRadius="3xl"
                                position="relative"
                                zIndex={1}
                            >
                                <VStack align="start" gap={4}>
                                    <Box p={3} borderRadius="2xl" bg="indigo.600" boxShadow="xl">
                                        <Icon as={FaUserShield} fontSize="3xl" />
                                    </Box>
                                    <Heading size="lg" fontWeight="black">Secure & Verified</Heading>
                                    <Text color="whiteAlpha.800">
                                        Every profile, institution, and company on AISHA is manually verified and monitored 
                                        to ensure the highest standards of data integrity and professional conduct.
                                    </Text>
                                </VStack>
                            </Box>
                        </Box>
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Portals Section (Redesigned Cards) */}
            <Box id="portals" py={24} position="relative">
                <Container maxW="container.xl">
                    <VStack gap={12}>
                        <VStack gap={4} textAlign="center">
                            <Heading size="2xl" fontWeight="black">Choose Your Gateway</Heading>
                            <Text color="whiteAlpha.600" fontSize="lg" maxW="2xl">
                                Access specialized tools and dashboards tailored to your role in the ecosystem.
                            </Text>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} w="full">
                            {portals.map((portal) => (
                                <Card.Root
                                    key={portal.title}
                                    p={6}
                                    cursor="pointer"
                                    bg="whiteAlpha.50"
                                    backdropFilter="blur(16px)"
                                    border="1px solid"
                                    borderColor="whiteAlpha.100"
                                    transition="all 0.3s"
                                    _hover={{
                                        transform: 'translateY(-10px)',
                                        bg: 'whiteAlpha.100',
                                        borderColor: portal.color,
                                        boxShadow: `0 15px 30px -10px var(--chakra-colors-${portal.color.split('.')[0]}-900)`
                                    }}
                                    onClick={() => navigate(portal.path)}
                                >
                                    <Card.Body>
                                        <VStack align="start" gap={5}>
                                            <Box
                                                p={4}
                                                borderRadius="2xl"
                                                bg={`${portal.color.split('.')[0]}.500`}
                                                boxShadow={`0 8px 16px -4px var(--chakra-colors-${portal.color.split('.')[0]}-500)`}
                                            >
                                                <Icon fontSize="3xl" color="white">
                                                    <portal.icon />
                                                </Icon>
                                            </Box>
                                            <VStack align="start" gap={1}>
                                                <Heading size="md" color="white" fontWeight="black">{portal.title}</Heading>
                                                <Text fontSize="sm" color="whiteAlpha.600" fontWeight="medium">{portal.description}</Text>
                                            </VStack>
                                            <Button
                                                variant="subtle"
                                                colorPalette={portal.color.split('.')[0]}
                                                w="full"
                                                borderRadius="xl"
                                                fontWeight="bold"
                                            >
                                                Enter Portal
                                            </Button>
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            ))}
                        </SimpleGrid>
                    </VStack>
                </Container>
            </Box>

            {/* Contact Section */}
            <Box id="contact" py={24} bg="gray.800">
                <Container maxW="container.xl">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={20}>
                        <VStack align="start" gap={8}>
                            <VStack align="start" gap={4}>
                                <Heading size="2xl" fontWeight="black">Get in Touch</Heading>
                                <Text color="whiteAlpha.700" fontSize="lg">
                                    Have questions about the AISHA platform? We're here to help you get integrated.
                                </Text>
                            </VStack>
                            
                            <VStack align="start" gap={6} w="full">
                                <HStack gap={6}>
                                    <Box boxSize="50px" borderRadius="full" bg="whiteAlpha.100" display="flex" alignItems="center" justifyContent="center">
                                        <Icon as={FaEnvelope} color="indigo.400" />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="bold">Email Us</Text>
                                        <Text color="whiteAlpha.600">contact@aisha.io</Text>
                                    </VStack>
                                </HStack>
                                <HStack gap={6}>
                                    <Box boxSize="50px" borderRadius="full" bg="whiteAlpha.100" display="flex" alignItems="center" justifyContent="center">
                                        <Icon as={FaMapMarkerAlt} color="indigo.400" />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="bold">Our Headquarters</Text>
                                        <Text color="whiteAlpha.600">Innovation Hub, Nairobi</Text>
                                    </VStack>
                                </HStack>
                                <HStack gap={6}>
                                    <Box boxSize="50px" borderRadius="full" bg="whiteAlpha.100" display="flex" alignItems="center" justifyContent="center">
                                        <Icon as={FaPhone} color="indigo.400" />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="bold">Call Support</Text>
                                        <Text color="whiteAlpha.600">+254 700 000 000</Text>
                                    </VStack>
                                </HStack>
                            </VStack>

                            <HStack gap={4}>
                                <Button boxSize="50px" borderRadius="full" variant="subtle"><Icon as={FaLinkedin} /></Button>
                                <Button boxSize="50px" borderRadius="full" variant="subtle"><Icon as={FaTwitter} /></Button>
                                <Button boxSize="50px" borderRadius="full" variant="subtle"><Icon as={FaGithub} /></Button>
                            </HStack>
                        </VStack>

                        <Box bg="whiteAlpha.50" p={8} borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.100">
                            <VStack gap={4}>
                                <Input placeholder="Your Name" variant="subtle" bg="whiteAlpha.100" border="none" _focus={{ bg: 'whiteAlpha.200' }} />
                                <Input placeholder="Email Address" variant="subtle" bg="whiteAlpha.100" border="none" _focus={{ bg: 'whiteAlpha.200' }} />
                                <Input placeholder="Subject" variant="subtle" bg="whiteAlpha.100" border="none" _focus={{ bg: 'whiteAlpha.200' }} />
                                <Textarea placeholder="How can we help?" variant="subtle" bg="whiteAlpha.100" border="none" h="150px" _focus={{ bg: 'whiteAlpha.200' }} />
                                <Button colorPalette="indigo" w="full" size="lg" fontWeight="black" borderRadius="xl">Send Message</Button>
                            </VStack>
                        </Box>
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Footer */}
            <Box py={10} borderTop="1px solid" borderColor="whiteAlpha.100">
                <Container maxW="container.xl">
                    <VStack gap={6}>
                        <HStack w="full" justify="space-between" flexDir={{ base: 'column', md: 'row' }} gap={4}>
                            <HStack gap={2}>
                                <Box boxSize="30px" bgGradient="to-br" gradientFrom="indigo.500" gradientTo="blue.600" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                                    <Text fontWeight="black" fontSize="sm">A</Text>
                                </Box>
                                <Heading size="sm" fontWeight="black" letterSpacing="widest">AISHA</Heading>
                            </HStack>
                            <HStack gap={8}>
                                <Link color="whiteAlpha.600" fontSize="xs">Privacy Policy</Link>
                                <Link color="whiteAlpha.600" fontSize="xs">Terms of Service</Link>
                                <Link color="whiteAlpha.600" fontSize="xs">Cookie Settings</Link>
                            </HStack>
                        </HStack>
                        <Text fontSize="xs" color="whiteAlpha.400" fontWeight="bold">
                            © 2026 AISHA Intelligence | Secure AI-Powered Placement Ecosystem
                        </Text>
                    </VStack>
                </Container>
            </Box>
        </Box>
    );
};

export default PortalSelector;
