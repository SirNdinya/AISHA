import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Separator, Textarea,
    DialogRoot, DialogContent, DialogHeader, DialogTitle,
    DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger,
    DialogBackdrop, DialogPositioner,
    Box, VStack, Heading, Text, Flex, Icon, Button, Input, SimpleGrid, chakra
} from '@chakra-ui/react';
import {
    LuUser, LuTarget, LuFilter, LuDownload, LuZap,
    LuShieldCheck, LuCamera, LuMapPin, LuBriefcase, LuSettings, LuTrash2, LuTriangleAlert
} from "react-icons/lu";

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { updateStudentProfile, fetchStudentProfile, clearInstitutionalData, clearMatchData, fetchMyApplications } from '../../store/studentSlice';
import { logout } from '../../store/authSlice';
import StudentService from '../../services/studentService';
import { Toaster, toaster } from '../../components/ui/toaster';
import { Avatar } from "../../components/ui/avatar";
import { Checkbox } from "../../components/ui/checkbox";
// Tabs and Switch components are handled by explicit Root imports above

// Helper: resolve relative backend media URLs (e.g. /uploads/...) to absolute
const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

const CAREER_PATHS = ['Cyber Security', 'Software Engineering', 'System Administration'];
const SKILLS_BY_PATH: Record<string, string[]> = {
    'Cyber Security': ['Python', 'Bash', 'Wireshark', 'Metasploit', 'Nmap', 'Burp Suite', 'C/C++', 'Linux Administration', 'Cryptography', 'SIEM Tools', 'Reconnaissance'],
    'Software Engineering': ['React', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS/Azure', 'Git/GitHub', 'CI/CD'],
    'System Administration': ['Linux Server', 'Windows Server', 'Bash/PowerShell', 'Active Directory', 'Networking', 'Ansible/Terraform', 'VMware', 'System Monitoring', 'Cloud Management']
};
const INTERESTS_BY_PATH: Record<string, string[]> = {
    'Cyber Security': ['Penetration Testing', 'Network Security', 'Cryptography', 'Incident Response', 'Cloud Security'],
    'Software Engineering': ['Frontend Development', 'Backend Engineering', 'Mobile App Dev', 'DevOps', 'API Design'],
    'System Administration': ['Linux Admin', 'Windows Server', 'Network Admin', 'Active Directory', 'IT Support']
};
const LOCATIONS = ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru'];

const StudentSettings: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { profile, applications } = useSelector((state: RootState) => state.student);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [settings, setSettings] = useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        career_path: profile?.course_of_study || '',
        fields_of_interest: profile?.interests || ([] as string[]),
        skills: profile?.skills || ([] as string[]),
        preferred_locations: profile?.preferred_locations?.join(', ') || '',
        requires_stipend: profile?.requires_stipend || false,
        auto_apply: profile?.auto_apply_enabled || false,
        admission_number: profile?.admission_number || '',
        placement_duration: profile?.placement_duration || 3
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const [isPreferencesLocked, setIsPreferencesLocked] = useState(false);

    useEffect(() => {
        dispatch(fetchMyApplications());
    }, [dispatch]);

    useEffect(() => {
        const activeApp = applications.find(a => a.placement_status === 'ACTIVE' || a.status === 'ACCEPTED' || a.status === 'OFFERED');
        if (activeApp) {
            const matchTime = new Date(activeApp.applied_at || activeApp.created_at || new Date()).getTime();
            const diff = (matchTime + (24 * 60 * 60 * 1000)) - Date.now();
            setIsPreferencesLocked(diff <= 0);
        } else {
            setIsPreferencesLocked(false);
        }
    }, [applications]);

    const handleSync = async () => {
        if (!settings.admission_number) return;
        setIsSyncing(true);
        try {
            const updatedProfile = await StudentService.syncProfile(settings.admission_number);
            setSettings(prev => ({
                ...prev,
                first_name: updatedProfile.first_name,
                last_name: updatedProfile.last_name,
                admission_number: updatedProfile.admission_number
                // career_path is left manual as per user feedback
            }));
            // Also refresh profile in store
            dispatch(fetchStudentProfile());
            toaster.create({
                title: "Profile Synchronized",
                description: "Your institutional record has been linked successfully.",
                type: "success"
            });
        } catch (error: any) {
            console.error('Sync failed:', error);
            const errorMessage = error.response?.data?.message || "Could not find registration number in institution database.";
            toaster.create({
                title: "Sync Failed",
                description: errorMessage,
                type: "error"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Real-Time Sync Logic
    useEffect(() => {
        if (!settings.admission_number) {
            dispatch(clearInstitutionalData());
            setSettings(prev => ({ ...prev, first_name: '', last_name: '' }));
            return;
        }

        const debounceTimer = setTimeout(() => {
            handleSync();
        }, 800); // 800ms debounce for typing

        return () => clearTimeout(debounceTimer);
    }, [settings.admission_number]);

    // Populate settings when profile is loaded
    useEffect(() => {
        if (profile) {
            setSettings({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                career_path: profile.career_path || profile.course_of_study || '',
                fields_of_interest: profile.interests || ([] as string[]),
                skills: profile.skills || ([] as string[]),
                preferred_locations: profile.preferred_locations?.join(', ') || '',
                requires_stipend: profile.requires_stipend || false,
                auto_apply: profile.auto_apply_enabled || false,
                admission_number: profile.admission_number || '',
                placement_duration: profile.placement_duration || 3
            });
        }
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        const updateData = {
            first_name: settings.first_name,
            last_name: settings.last_name,
            course_of_study: profile?.course_of_study || '', // Keep institutional course
            career_path: settings.career_path,
            interests: settings.fields_of_interest,
            skills: settings.skills,
            preferred_locations: settings.preferred_locations.split(',').map((i: string) => i.trim()).filter((i: string) => i !== ''),
            requires_stipend: settings.requires_stipend,
            placement_duration: settings.placement_duration
        };

        // Check if preferences changed to clear matches and show animations
        const preferencesChanged =
            settings.career_path !== profile?.career_path ||
            JSON.stringify(settings.fields_of_interest) !== JSON.stringify(profile?.interests) ||
            JSON.stringify(settings.skills) !== JSON.stringify(profile?.skills) ||
            settings.preferred_locations !== profile?.preferred_locations?.join(', ');

        if (preferencesChanged) {
            dispatch(clearMatchData());
        }

        await dispatch(updateStudentProfile(updateData));
        setIsSaving(false);
        toaster.create({ title: "Preferences Saved", description: "Your matching criteria have been updated.", type: "success" });
    };

    const handleDownloadSummary = () => {
        const summary = {
            profile: profile,
            timestamp: new Date().toISOString(),
            status: "ACTIVE_PROFILE_SYNC"
        };
        const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_summary_${profile?.last_name || 'user'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    const availableInterests = INTERESTS_BY_PATH[settings.career_path] || [];
    const availableSkills = SKILLS_BY_PATH[settings.career_path] || [];

    return (
        <>
            <Container maxW="container.xl" py={8}>
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8}>
                    {/* Column 1: Core Profile & Identity */}
                    <VStack align="stretch" gap={6}>
                        <Box className="terminal-card" p={6}>
                            <VStack gap={4} align="center">
                                <Box pos="relative">
                                    <Avatar
                                        size="2xl"
                                        border="4px solid"
                                        borderColor={isUploadingPhoto ? "yellow.400" : "cyan.400"}
                                        src={getMediaUrl(profile?.profile_picture_url)}
                                        name={`${profile?.first_name} ${profile?.last_name}`}
                                    />
                                    <input
                                        type="file"
                                        id="profile-upload"
                                        hidden
                                        accept="image/*"
                                        onChange={async (e) => {
                                            if (!e.target.files?.[0]) return;
                                            setIsUploadingPhoto(true);
                                            try {
                                                await StudentService.uploadProfilePicture(e.target.files[0]);
                                                await dispatch(fetchStudentProfile());
                                                toaster.create({
                                                    title: "Photo Updated",
                                                    description: "Your profile picture has been uploaded successfully.",
                                                    type: "success"
                                                });
                                            } catch (err) {
                                                toaster.create({
                                                    title: "Upload Failed",
                                                    description: "Could not upload your photo. Please try again.",
                                                    type: "error"
                                                });
                                            } finally {
                                                setIsUploadingPhoto(false);
                                                // Reset input so same file can be re-selected
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <chakra.label
                                        htmlFor="profile-upload"
                                        pos="absolute"
                                        bottom={0}
                                        right={0}
                                        bg={isUploadingPhoto ? "yellow.500" : "cyan.500"}
                                        color="white"
                                        p={1.5}
                                        borderRadius="full"
                                        cursor={isUploadingPhoto ? "not-allowed" : "pointer"}
                                        shadow="lg"
                                        _hover={{ bg: isUploadingPhoto ? "yellow.500" : "cyan.600" }}
                                        pointerEvents={isUploadingPhoto ? "none" : "auto"}
                                    >
                                        <LuCamera size={14} />
                                    </chakra.label>
                                </Box>
                                <VStack gap={1}>
                                    <Heading size="md" color="white">{profile?.first_name} {profile?.last_name}</Heading>
                                    <Text fontSize="xs" color="whiteAlpha.500">{profile?.admission_number}</Text>
                                </VStack>
                            </VStack>

                            <Separator my={6} borderColor="whiteAlpha.100" />

                            <VStack align="stretch" gap={4}>
                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.500" mb={1} textTransform="uppercase">Institutional Identity</Text>
                                    <Flex gap={2}>
                                        <Input
                                            placeholder="Registration Number (e.g. COM/0001)"
                                            size="sm"
                                            bg="whiteAlpha.50"
                                            borderColor="cyan.800"
                                            color="white"
                                            value={settings.admission_number}
                                            onChange={(e) => setSettings({ ...settings, admission_number: e.target.value })}
                                        />
                                        <Button
                                            size="sm"
                                            colorPalette="cyan"
                                            variant="outline"
                                            onClick={handleSync}
                                            loading={isSyncing}
                                            fontSize="10px"
                                        >
                                            UPDATE PROFILE
                                        </Button>
                                    </Flex>
                                </Box>

                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.500" mb={1} textTransform="uppercase">Personal Identity</Text>
                                    <SimpleGrid columns={2} gap={3}>
                                        <Input
                                            placeholder="First Name"
                                            size="sm"
                                            bg="whiteAlpha.50"
                                            borderColor="whiteAlpha.200"
                                            color={profile?.sync_status === 'SYNCED' ? "whiteAlpha.600" : "white"}
                                            value={settings.first_name}
                                            onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                                            readOnly={profile?.sync_status === 'SYNCED'}
                                        />
                                        <Input
                                            placeholder="Last Name"
                                            size="sm"
                                            bg="whiteAlpha.50"
                                            borderColor="whiteAlpha.200"
                                            color={profile?.sync_status === 'SYNCED' ? "whiteAlpha.600" : "white"}
                                            value={settings.last_name}
                                            onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                                            readOnly={profile?.sync_status === 'SYNCED'}
                                        />
                                    </SimpleGrid>
                                </Box>

                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.500" mb={1} textTransform="uppercase">Target Career Path</Text>
                                    <chakra.select
                                        fontSize="sm"
                                        bg="whiteAlpha.100"
                                        borderColor="whiteAlpha.200"
                                        color="whiteAlpha.600"
                                        p={2}
                                        borderRadius="md"
                                        w="100%"
                                        border="1px solid"
                                        value={settings.career_path}
                                        onChange={(e: any) => setSettings({ ...settings, career_path: e.target.value, fields_of_interest: [], skills: [] })}
                                        disabled={isPreferencesLocked}
                                    >
                                        <option value="" style={{ background: '#1a202c' }}>Select Career Path</option>
                                        {CAREER_PATHS.map(path => (
                                            <option key={path} value={path} style={{ background: '#1a202c' }}>{path}</option>
                                        ))}
                                    </chakra.select>
                                </Box>

                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.500" mb={1} textTransform="uppercase">Placement Duration</Text>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        colorPalette="cyan"
                                        borderColor="cyan.400"
                                        color="white"
                                        w="100%"
                                        cursor="default"
                                        _hover={{ bg: "cyan.600" }}
                                    >
                                        3 Months
                                    </Button>
                                </Box>
                            </VStack>
                        </Box>

                    </VStack>

                    {/* Column 2 & 3: Matching Preferences */}
                    <VStack align="stretch" gap={8} gridColumn={{ lg: "span 2" }}>
                        <Box className="terminal-card" p={8}>
                            <Flex justify="space-between" align="center" mb={6}>
                                <VStack align="start" gap={1}>
                                    <Heading size="sm" color="white" textTransform="uppercase" letterSpacing="widest">Matching Preferences</Heading>
                                    <Text fontSize="xs" color="whiteAlpha.500">Fine-tune how the matching engine prioritizes opportunities</Text>
                                </VStack>
                                <Icon as={LuFilter} color="cyan.400" size="lg" />
                            </Flex>

                            <VStack align="stretch" gap={6}>
                                {isPreferencesLocked && (
                                    <Box p={3} bg="red.900/40" border="1px solid" borderColor="red.500/50" borderRadius="xl">
                                        <Text color="red.400" fontSize="sm" fontWeight="bold">
                                            <Icon as={LuTriangleAlert} mr={2} />
                                            Preferences Locked
                                        </Text>
                                        <Text color="whiteAlpha.800" fontSize="xs" mt={1}>
                                            Your match age has exceeded 24 hours. Your matching preferences and skills are now finalized and cannot be modified.
                                        </Text>
                                    </Box>
                                )}

                                <Box opacity={isPreferencesLocked ? 0.6 : 1} pointerEvents={isPreferencesLocked ? 'none' : 'auto'}>
                                    <Flex mb={4} gap={2} alignItems="center">
                                        <Icon as={LuTarget} color="cyan.400" size="sm" />
                                        <Text fontSize="sm" fontWeight="bold" color="white" textTransform="uppercase" letterSpacing="widest">Interest Areas</Text>
                                    </Flex>
                                    {!settings.career_path ? (
                                        <Text fontSize="xs" color="whiteAlpha.500">Please select a Target Career Path first.</Text>
                                    ) : (
                                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
                                            {availableInterests.map((interest: string) => {
                                                const isSelected = settings.fields_of_interest.includes(interest);
                                                return (
                                                    <Box
                                                        key={interest}
                                                        p={3}
                                                        borderRadius="lg"
                                                        bg={isSelected ? "cyan.900/20" : "whiteAlpha.50"}
                                                        border="1px solid"
                                                        borderColor={isSelected ? "cyan.500/40" : "whiteAlpha.100"}
                                                        transition="all 0.2s"
                                                        _hover={{ borderColor: "cyan.500/60", bg: "whiteAlpha.100" }}
                                                    >
                                                        <Checkbox
                                                            colorPalette="cyan"
                                                            checked={isSelected}
                                                            onCheckedChange={(e) => {
                                                                let newInterests = [...settings.fields_of_interest];
                                                                if (!e.checked) {
                                                                    newInterests = newInterests.filter(i => i !== interest);
                                                                } else {
                                                                    newInterests.push(interest);
                                                                }
                                                                setSettings({ ...settings, fields_of_interest: newInterests });
                                                            }}
                                                        >
                                                            <Text fontSize="xs" color="whiteAlpha.800" fontWeight={isSelected ? "bold" : "medium"}>
                                                                {interest}
                                                            </Text>
                                                        </Checkbox>
                                                    </Box>
                                                );
                                            })}
                                        </SimpleGrid>
                                    )}
                                    <Text fontSize="10px" color="whiteAlpha.400" mt={4}>* These keywords influence your placement matches. Select multiple areas of interest.</Text>
                                </Box>

                                <Separator opacity={0.1} my={2} />

                                <Box opacity={isPreferencesLocked ? 0.6 : 1} pointerEvents={isPreferencesLocked ? 'none' : 'auto'}>
                                    <Flex mb={4} gap={2} alignItems="center">
                                        <Icon as={LuZap} color="cyan.400" size="sm" />
                                        <Text fontSize="sm" fontWeight="bold" color="white" textTransform="uppercase" letterSpacing="widest">Professional Skills</Text>
                                    </Flex>
                                    {!settings.career_path ? (
                                        <Text fontSize="xs" color="whiteAlpha.500">Please select a Target Career Path first.</Text>
                                    ) : (
                                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
                                            {availableSkills.map((skill: string) => {
                                                const isSelected = settings.skills.includes(skill);
                                                return (
                                                    <Box
                                                        key={skill}
                                                        p={3}
                                                        borderRadius="lg"
                                                        bg={isSelected ? "cyan.900/20" : "whiteAlpha.50"}
                                                        border="1px solid"
                                                        borderColor={isSelected ? "cyan.500/40" : "whiteAlpha.100"}
                                                        transition="all 0.2s"
                                                        _hover={{ borderColor: "cyan.500/60", bg: "whiteAlpha.100" }}
                                                    >
                                                        <Checkbox
                                                            colorPalette="cyan"
                                                            checked={isSelected}
                                                            onCheckedChange={(e) => {
                                                                let newSkills = [...settings.skills];
                                                                if (!e.checked) {
                                                                    newSkills = newSkills.filter(s => s !== skill);
                                                                } else {
                                                                    newSkills.push(skill);
                                                                }
                                                                setSettings({ ...settings, skills: newSkills });
                                                            }}
                                                        >
                                                            <Text fontSize="xs" color="whiteAlpha.800" fontWeight={isSelected ? "bold" : "medium"}>
                                                                {skill}
                                                            </Text>
                                                        </Checkbox>
                                                    </Box>
                                                );
                                            })}
                                        </SimpleGrid>
                                    )}
                                    <Text fontSize="10px" color="whiteAlpha.400" mt={4}>* Select all technical skills relevant to your career path.</Text>
                                </Box>

                                <Box>
                                    <Flex mb={2} gap={2} alignItems="center">
                                        <Icon as={LuMapPin} color="cyan.400" size="sm" />
                                        <Text fontSize="xs" fontWeight="bold" color="white" textTransform="uppercase">Preferred Regions</Text>
                                    </Flex>
                                    <chakra.select
                                        bg="whiteAlpha.50"
                                        borderColor="whiteAlpha.100"
                                        color="white"
                                        fontSize="xs"
                                        p={2}
                                        borderRadius="md"
                                        w="100%"
                                        border="1px solid"
                                        value={settings.preferred_locations}
                                        onChange={(e: any) => setSettings({ ...settings, preferred_locations: e.target.value })}
                                    >
                                        <option value="" style={{ background: '#1a202c' }}>Select Preferred Region</option>
                                        {LOCATIONS.map((loc: string) => (
                                            <option key={loc} value={loc} style={{ background: '#1a202c' }}>{loc}</option>
                                        ))}
                                    </chakra.select>
                                </Box>
                            </VStack>

                            <Separator my={8} borderColor="whiteAlpha.100" />

                            <Flex justify="space-between" align="center">
                                <Button
                                    variant="ghost"
                                    colorPalette="whiteAlpha"
                                    size="sm"
                                    onClick={handleDownloadSummary}
                                >
                                    <LuDownload /> Download Dashboard Summary (.JSON)
                                </Button>
                                <Flex gap={4}>
                                    <Button variant="ghost" colorPalette="whiteAlpha" size="sm" onClick={() => window.history.back()}>Cancel</Button>
                                    <Button
                                        colorPalette="cyan"
                                        size="sm"
                                        px={8}
                                        onClick={handleSave}
                                        loading={isSaving}
                                    >
                                        SAVE CHANGES
                                    </Button>
                                </Flex>
                            </Flex>
                        </Box>
                    </VStack>
                </SimpleGrid>
            </Container>

            <Toaster />
        </>
    );
};

export default StudentSettings;
