import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Heading, Text, VStack, Input, Button, 
    Textarea, Image, Circle, Icon, Flex, Grid, Card, HStack,
    Separator
} from '@chakra-ui/react';
import { LuUpload, LuSave, LuBuilding2, LuFileText, LuSparkles, LuInfo } from 'react-icons/lu';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanyProfile, updateCompanyProfile } from '../../store/companySlice';
import type { AppDispatch, RootState } from '../../store';
import { Toaster, toaster } from '../../components/ui/toaster';
import CompanyService from '../../services/companyService';

// Helper: resolve relative backend media URLs (e.g. /uploads/...) to absolute
const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

const CompanySettings: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { profile, isLoading } = useSelector((state: RootState) => state.company);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website: '',
        profile_picture_url: '',
        acceptance_letter_requirements: '',
        description: '',
        receiving_phone_number: '',
        representative_phone: ''
    });

    const [isUploading, setIsUploading] = useState(false);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchCompanyProfile());
    }, [dispatch]);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                industry: profile.industry || '',
                website: profile.website || '',
                profile_picture_url: profile.profile_picture_url || '',
                acceptance_letter_requirements: profile.acceptance_letter_requirements || '',
                description: profile.description || '',
                receiving_phone_number: profile.receiving_phone_number || '',
                representative_phone: profile.representative_phone || ''
            });
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            await dispatch(updateCompanyProfile(formData)).unwrap();
            toaster.create({ 
                title: 'Changes Saved Successfully', 
                description: 'Your company profile and placement protocols are now synchronized.',
                type: 'success' 
            });
        } catch (error) {
            toaster.create({ 
                title: 'Save Process Failed', 
                description: 'There was a problem updating your profile. Technical node mismatch.', 
                type: 'error' 
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Immediate Local Preview
        const previewUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(previewUrl);
        setIsUploading(true);

        try {
            const result = await CompanyService.uploadProfilePicture(file);
            setFormData(prev => ({ ...prev, profile_picture_url: result.profile_picture_url }));
            
            // Sync with central state
            await dispatch(fetchCompanyProfile()).unwrap();
            
            toaster.create({ 
                title: 'Logo Uploaded', 
                description: 'Your corporate identity has been synchronized.',
                type: 'success' 
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Check your connection and try again.';
            toaster.create({ 
                title: 'Upload Failed', 
                description: errorMessage,
                type: 'error' 
            });
            // Revert local preview on failure if necessary, but usually fine to keep until re-try
        } finally {
            setIsUploading(false);
        }
    };

    const displayImageUrl = localPreviewUrl || getMediaUrl(formData.profile_picture_url) || `https://logo.clearbit.com/${formData.name?.toLowerCase().replace(/\s+/g, '')}.com`;

    return (
        <Box bg="var(--terminal-bg)" minH="100vh" p={8} animation="fadeIn 0.5s ease-out">
            <Heading mb={1} color="#F8FAFC">Company Settings</Heading>
            <Text color="var(--terminal-accent)" mb={8}>Manage your company profile and information students see during placement.</Text>

            <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={8}>
                <VStack align="stretch" gap={6}>
                    <Card.Root bg="var(--terminal-card)" borderColor="var(--terminal-border)" borderRadius="2xl">
                        <Card.Body p={8}>
                            <VStack align="stretch" gap={6}>
                                <HStack borderBottom="1px solid" borderColor="var(--terminal-border)" pb={4} justify="space-between">
                                    <HStack>
                                        <Icon as={LuBuilding2} color="var(--terminal-accent)" />
                                        <Heading size="md" color="#F8FAFC">General Information</Heading>
                                    </HStack>
                                </HStack>

                                <Grid templateColumns="1fr 1fr" gap={6}>
                                    <Box gridColumn="span 2">
                                        <Text mb={2} fontSize="sm" color="whiteAlpha.600">Company Name</Text>
                                        <Input 
                                            value={formData.name} 
                                            bg="whiteAlpha.50"
                                            color="whiteAlpha.900" 
                                            borderColor="var(--terminal-border)"
                                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                            placeholder="Enter company name"
                                        />
                                    </Box>
                                    <Box>
                                        <Text mb={2} fontSize="sm" color="whiteAlpha.600">Industry</Text>
                                        <Input 
                                            value={formData.industry} 
                                            bg="whiteAlpha.50"
                                            color="whiteAlpha.900" 
                                            borderColor="var(--terminal-border)"
                                            onChange={(e) => setFormData({...formData, industry: e.target.value})} 
                                            placeholder="e.g. Technology, Finance"
                                        />
                                    </Box>
                                    <Box>
                                        <Text mb={2} fontSize="sm" color="whiteAlpha.600">Website</Text>
                                        <Input 
                                            value={formData.website} 
                                            bg="whiteAlpha.50"
                                            color="whiteAlpha.900" 
                                            borderColor="var(--terminal-border)"
                                            onChange={(e) => setFormData({...formData, website: e.target.value})} 
                                            placeholder="https://www.example.com" 
                                        />
                                    </Box>
                                    <Box>
                                        <Text mb={2} fontSize="sm" color="whiteAlpha.600">Receiving Phone (M-Pesa)</Text>
                                        <Input 
                                            value={formData.receiving_phone_number} 
                                            bg="whiteAlpha.50"
                                            color="whiteAlpha.900" 
                                            borderColor="var(--terminal-border)"
                                            onChange={(e) => setFormData({...formData, receiving_phone_number: e.target.value})} 
                                            placeholder="0712345678" 
                                        />
                                    </Box>
                                    <Box>
                                        <Text mb={2} fontSize="sm" color="whiteAlpha.600">Representative Phone</Text>
                                        <Input 
                                            value={formData.representative_phone} 
                                            bg="whiteAlpha.50"
                                            color="whiteAlpha.900" 
                                            borderColor="var(--terminal-border)"
                                            onChange={(e) => setFormData({...formData, representative_phone: e.target.value})} 
                                            placeholder="0712345678" 
                                        />
                                    </Box>
                                </Grid>

                                <Box>
                                    <Text mb={2} fontSize="sm" color="whiteAlpha.600">Description</Text>
                                    <Textarea 
                                        rows={4} 
                                        bg="whiteAlpha.50"
                                        color="whiteAlpha.900" 
                                        borderColor="var(--terminal-border)"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Tell students about your company..."
                                    />
                                </Box>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root bg="var(--terminal-card)" borderColor="var(--terminal-border)" borderRadius="2xl">
                        <Card.Body p={8}>
                            <VStack align="stretch" gap={6}>
                                <HStack borderBottom="1px solid" borderColor="var(--terminal-border)" pb={4} justify="space-between">
                                    <HStack>
                                        <Icon as={LuFileText} color="purple.300" />
                                        <Heading size="md" color="#F8FAFC">Acceptance Letter Details</Heading>
                                    </HStack>
                                    <Icon as={LuSparkles} color="yellow.400" />
                                </HStack>

                                <Box>
                                    <Text mb={2} fontSize="sm" color="whiteAlpha.600">Specific Requirements & Instructions</Text>
                                    <Box p={4} bg="whiteAlpha.50" borderRadius="xl" mb={4} border="1px solid" borderColor="var(--terminal-border)">
                                        <HStack align="start" gap={3}>
                                            <Icon as={LuInfo} color="var(--terminal-accent)" mt={1} />
                                            <Text fontSize="xs" color="whiteAlpha.800">
                                                Accepted students will receive a professional PDF letter. Specify any unique requirements or induction details below.
                                            </Text>
                                        </HStack>
                                    </Box>
                                    <Textarea 
                                        rows={6} 
                                        bg="whiteAlpha.50"
                                        color="whiteAlpha.900" 
                                        borderColor="var(--terminal-border)"
                                        value={formData.acceptance_letter_requirements} 
                                        onChange={(e) => setFormData({...formData, acceptance_letter_requirements: e.target.value})} 
                                        placeholder="e.g. Carry a valid ID, report at 8 AM, etc." 
                                        fontSize="sm"
                                        lineHeight="tall"
                                    />
                                </Box>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Button 
                        size="lg" 
                        bg="var(--terminal-accent)"
                        color="black"
                        onClick={handleSave} 
                        fontWeight="bold"
                        _hover={{ bg: "var(--terminal-accent)", opacity: 0.9 }}
                    >
                        <LuSave /> Save Changes
                    </Button>
                </VStack>

                <VStack align="stretch" gap={6}>
                    <Card.Root bg="var(--terminal-card)" borderColor="var(--terminal-border)" borderRadius="2xl">
                        <Card.Body p={8} textAlign="center">
                            <VStack gap={6}>
                                <Heading size="sm" color="#F8FAFC" alignSelf="start">Company Logo</Heading>
                                <Circle 
                                    size="200px" 
                                    bg="white" 
                                    border="4px solid" 
                                    borderColor={isUploading ? "yellow.400" : "var(--terminal-accent)"} 
                                    overflow="hidden"
                                    boxShadow="0 0 40px rgba(56, 189, 248, 0.2)"
                                    position="relative"
                                >
                                    <Image 
                                        src={displayImageUrl} 
                                        w="100%" h="100%" objectFit="cover"
                                        fallbackSrc="https://via.placeholder.com/200?text=Logo"
                                        opacity={isUploading ? 0.5 : 1}
                                        transition="opacity 0.2s"
                                    />
                                    {isUploading && (
                                        <Box position="absolute" top="0" left="0" w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
                                            <Icon as={LuSparkles} color="yellow.400" size="40px" animation="pulse 1.5s infinite" />
                                        </Box>
                                    )}
                                </Circle>
                                
                                <VStack w="full" gap={2}>
                                    <Button 
                                        bg="var(--terminal-accent)"
                                        color="black"
                                        w="full" 
                                        size="md" 
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <LuUpload /> Upload Logo
                                    </Button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        accept="image/*" 
                                        onChange={handleFileUpload} 
                                    />
                                    <Text fontSize="10px" color="whiteAlpha.500">Max size: 20MB. Format: PNG or JPG.</Text>
                                </VStack>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Box p={6} border="1px solid" borderColor="var(--terminal-border)" bg="whiteAlpha.50" borderRadius="2xl">
                        <Text fontSize="xs" color="whiteAlpha.800" lineHeight="tall">
                            Your logo and requirements will be included in the official acceptance letter generated for students.
                        </Text>
                    </Box>
                </VStack>
            </Grid>
            <Toaster />
        </Box>
    );
};

export default CompanySettings;
