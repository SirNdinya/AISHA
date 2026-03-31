import React, { useState, useEffect } from 'react';
import {
    Box, Heading, VStack, Textarea, Button, Text, HStack, Flex, Container, Icon,
    Spinner, DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody,
    DialogFooter, DialogActionTrigger, DialogCloseTrigger, DialogBackdrop, DialogPositioner
} from '@chakra-ui/react';
import { LuEye, LuDownload, LuArrowLeft, LuSparkles } from 'react-icons/lu';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentProfile } from '../../store/studentSlice';
import type { AppDispatch, RootState } from '../../store';
import StudentService from '../../services/studentService';
import { toaster } from '../../components/ui/toaster';
import CVPreview from './components/CVPreview';

const CVBuilder: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { profile } = useSelector((state: RootState) => state.student);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'INPUT' | 'PREVIEW'>('INPUT');
    const [generatedData, setGeneratedData] = useState<any>(null);

    useEffect(() => {
        if (!profile) {
            dispatch(fetchStudentProfile());
        } else if (profile.resume_text) {
            try {
                setGeneratedData(JSON.parse(profile.resume_text));
            } catch (e) {
                console.error("Failed to parse existing resume JSON");
            }
        }
    }, [profile, dispatch]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toaster.create({ title: "Please provide minimal info", type: "warning" });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await StudentService.generateAIResume(profile!.id, prompt);
            setGeneratedData(result);
            toaster.create({ title: "Resume Architected Successfully", type: "success" });
            setViewMode('PREVIEW');
        } catch (error) {
            toaster.create({ title: "Generation Failed", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!profile) return (
        <Flex h="80vh" align="center" justify="center">
            <Spinner color="cyan.500" size="xl" />
        </Flex>
    );

    return (
        <Container maxW="container.lg" py={10}>
            {viewMode === 'INPUT' ? (
                <VStack gap={12} align="center" py={10}>
                    {/* Minimalist Input UI */}
                    <VStack gap={4} textAlign="center">
                        <Icon as={LuSparkles} boxSize={12} color="cyan.400" />
                        <Heading size="2xl" color="white" fontWeight="black" letterSpacing="tight">
                            AISHA Resume Architect
                        </Heading>
                        <Text color="whiteAlpha.600" fontSize="md" maxW="2xl">
                            Tell me a little about yourself, your career goals, and any key achievements. 
                            I'll handle the professional formatting, skill extraction, and academic integration.
                        </Text>
                    </VStack>

                    <Box w="full" maxW="3xl" bg="whiteAlpha.50" p={8} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="2xl">
                        <Textarea
                            placeholder="e.g. I am a software engineering student passionate about full-stack development. I've worked on a few React projects and I'm looking for an internship in Nairobi..."
                            rows={8}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            bg="blackAlpha.400"
                            border="none"
                            color="white"
                            fontSize="lg"
                            _focus={{ boxShadow: "0 0 0 2px cyan.500" }}
                            resize="none"
                        />
                        <HStack justify="space-between" mt={8}>
                            <Button 
                                colorPalette="cyan" 
                                size="lg" 
                                px={10} 
                                loading={isGenerating}
                                onClick={handleGenerate}
                                borderRadius="full"
                            >
                                <LuSparkles /> GENERATE WITH AISHA
                            </Button>
                            
                            {generatedData && (
                                <Button 
                                    variant="ghost" 
                                    colorPalette="whiteAlpha" 
                                    size="lg" 
                                    onClick={() => setViewMode('PREVIEW')}
                                >
                                    <LuEye /> VIEW LAST GENERATED
                                </Button>
                            )}
                        </HStack>
                    </Box>

                    <Box py={10} textAlign="center">
                        <Text color="whiteAlpha.300" fontSize="xs" fontWeight="mono" letterSpacing="widest">
                            SOVEREIGN_AI_GENERATION_V2 // OLLAMA_LLAMA3_POWERED
                        </Text>
                    </Box>
                </VStack>
            ) : (
                <Box>
                    {/* Preview View */}
                    <HStack justify="space-between" mb={8}>
                        <Button variant="ghost" color="white" onClick={() => setViewMode('INPUT')}>
                            <LuArrowLeft /> BACK TO ARCHITECT
                        </Button>
                        <HStack>
                            <Button colorPalette="cyan" onClick={handlePrint}>
                                <LuDownload /> DOWNLOAD / PRINT PDF
                            </Button>
                        </HStack>
                    </HStack>

                    <Box maxW="900px" mx="auto">
                        <CVPreview data={generatedData} student={profile} />
                    </Box>
                </Box>
            )}
        </Container>
    );
};

export default CVBuilder;
