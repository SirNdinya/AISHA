import React from 'react';
import { Box, Flex, Heading, Text, Badge, Grid, VStack, Icon, HStack } from '@chakra-ui/react';
import { Avatar } from "../../../components/ui/avatar";
import { LuZap, LuActivity, LuTarget } from "react-icons/lu";
import type { Student } from '../../../types/student';
const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

interface ProfileViewProps {
    student: Student;
}

const ProfileView: React.FC<ProfileViewProps> = ({ student }) => {
    if (!student) return null;
    return (
        <VStack gap={6} align="stretch">
            {/* Header Section */}
            <Box className="terminal-card" p={8}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                    <HStack gap={6}>
                        <Avatar
                            size="2xl"
                            border="4px solid"
                            borderColor="cyan.400"
                            src={getMediaUrl(student.profile_picture_url)}
                            name={`${student.first_name} ${student.last_name}`}
                        />
                        <VStack align="start" gap={1}>
                            <HStack gap={3}>
                                <Heading size="xl" color="white" fontWeight="bold">
                                    {student.first_name} {student.last_name}
                                </Heading>
                                <Badge colorPalette="cyan" variant="outline" size="xs">OFFICIAL_PROFILE</Badge>
                            </HStack>
                            <Text fontSize="sm" color="cyan.400" fontWeight="mono" textTransform="uppercase" letterSpacing="widest">
                                {student.course_of_study || '[NODE_UNASSIGNED]'}
                            </Text>
                            <HStack gap={2} mt={2}>
                                <Icon as={LuTarget} color="whiteAlpha.400" size="sm" />
                                <Text fontSize="xs" color="whiteAlpha.600">{student.institution_name || '[INSTITUTION_SYNC_PENDING]'}</Text>
                            </HStack>
                        </VStack>
                    </HStack>
                </Flex>
            </Box>

            {/* Content Grid */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>

                {/* Left Column: Contact & Basic Info */}
                <VStack gap={6} align="stretch">
                    <Box className="terminal-card" p={6}>
                        <Heading size="xs" color="whiteAlpha.700" mb={4} textTransform="uppercase" letterSpacing="widest">Contact Information</Heading>
                        <VStack align="start" gap={4}>
                            <Box w="full">
                                <Text fontSize="9px" color="cyan.400" textTransform="uppercase" fontWeight="bold">Email Node</Text>
                                <Text color="white" fontSize="sm" fontWeight="mono">{student.email || 'N/A'}</Text>
                            </Box>
                            <Box w="full">
                                <Text fontSize="9px" color="cyan.400" textTransform="uppercase" fontWeight="bold">Voice Terminal</Text>
                                <Text color="white" fontSize="sm" fontWeight="mono">{student.phone_number || 'N/A'}</Text>
                            </Box>
                            <Box w="full">
                                <Text fontSize="9px" color="cyan.400" textTransform="uppercase" fontWeight="bold">Fiscal Interface (M-Pesa)</Text>
                                <Text color="white" fontSize="sm" fontWeight="mono">{student.mpesa_number || 'N/A'}</Text>
                            </Box>
                        </VStack>
                    </Box>

                    <Box className="terminal-card" p={6}>
                        <Heading size="xs" color="whiteAlpha.700" mb={4} textTransform="uppercase" letterSpacing="widest">Institutional Records</Heading>
                        <VStack align="start" gap={4}>
                            <Box w="full">
                                <Text fontSize="9px" color="cyan.400" textTransform="uppercase" fontWeight="bold">Institutional ID</Text>
                                <Text color="white" fontSize="sm" fontWeight="mono">{student.admission_number || 'UNASSIGNED'}</Text>
                            </Box>
                        </VStack>
                    </Box>
                </VStack>

                {/* Right Column: Skills, Interests, CV */}
                <VStack gap={6} align="stretch">
                    <Box className="terminal-card" p={6}>
                        <HStack justify="space-between" mb={4}>
                            <Heading size="xs" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="widest">Professional Skills</Heading>
                            <Icon as={LuZap} color="cyan.400" />
                        </HStack>
                        <Flex wrap="wrap" gap={3}>
                            {student.skills && student.skills.length > 0 ? (
                                student.skills.map((skill, idx) => (
                                    <Badge key={idx} colorPalette="cyan" variant="surface" size="md" fontWeight="mono">{skill}</Badge>
                                ))
                            ) : (
                                <Text color="whiteAlpha.400" fontSize="xs" fontStyle="italic">Waiting for skill injection...</Text>
                            )}
                        </Flex>
                    </Box>

                    <Box className="terminal-card" p={6}>
                        <HStack justify="space-between" mb={4}>
                            <Heading size="xs" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="widest">Interests & Domains</Heading>
                            <Icon as={LuActivity} color="cyan.400" />
                        </HStack>
                        <Flex wrap="wrap" gap={3}>
                            {student.interests && student.interests.length > 0 ? (
                                student.interests.map((interest, idx) => (
                                    <Badge key={idx} colorPalette="whiteAlpha" variant="outline" size="sm">{interest}</Badge>
                                ))
                            ) : (
                                <Text color="whiteAlpha.400" fontSize="xs" fontStyle="italic">No interests indexed.</Text>
                            )}
                        </Flex>
                    </Box>
                </VStack>
            </Grid>
        </VStack>
    );
};

export default ProfileView;
