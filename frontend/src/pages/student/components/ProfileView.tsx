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
                            borderColor="indigo.400"
                            src={getMediaUrl(student.profile_picture_url)}
                            name={`${student.first_name} ${student.last_name}`}
                        />
                        <VStack align="start" gap={1}>
                            <HStack gap={3}>
                                <Heading size="xl" color="white" fontWeight="bold">
                                    {student.first_name} {student.last_name}
                                </Heading>
                            </HStack>
                            <Text fontSize="sm" color="var(--terminal-accent)" fontWeight="black" textTransform="uppercase" letterSpacing="widest">
                                {student.course_of_study || ''}
                            </Text>
                            <HStack gap={2} mt={2}>
                                <Icon as={LuTarget} color="var(--terminal-accent)" size="sm" />
                                <Text fontSize="xs" color="#F8FAFC" fontWeight="black">{student.institution_name}</Text>
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
                        <Heading size="xs" color="var(--terminal-accent)" mb={4} textTransform="uppercase" letterSpacing="widest" fontWeight="black">Contact Information</Heading>
                        <VStack align="start" gap={4}>
                            <Box w="full">
                                <Text fontSize="9px" color="var(--terminal-accent)" textTransform="uppercase" fontWeight="black">Email Address</Text>
                                <Text color="white" fontSize="sm" fontWeight="bold">{student.email}</Text>
                            </Box>
                            <Box w="full">
                                <Text fontSize="9px" color="var(--terminal-accent)" textTransform="uppercase" fontWeight="black">Full Name</Text>
                                <Text color="white" fontSize="sm" fontWeight="bold">{student.first_name} {student.last_name}</Text>
                            </Box>
                            {student.course_of_study && (
                                <Box w="full">
                                    <Text fontSize="9px" color="var(--terminal-accent)" textTransform="uppercase" fontWeight="black">Department</Text>
                                    <Text color="white" fontSize="sm" fontWeight="bold">{student.course_of_study}</Text>
                                </Box>
                            )}
                        </VStack>
                    </Box>

                    <Box className="terminal-card" p={6}>
                        <Heading size="xs" color="var(--terminal-accent)" mb={4} textTransform="uppercase" letterSpacing="widest" fontWeight="black">Institutional Records</Heading>
                        <VStack align="start" gap={4}>
                            <Box w="full">
                                <Text fontSize="9px" color="var(--terminal-accent)" textTransform="uppercase" fontWeight="black">Institutional ID</Text>
                                <Text color="white" fontSize="sm" fontWeight="bold">{student.admission_number}</Text>
                            </Box>
                        </VStack>
                    </Box>
                </VStack>

                {/* Right Column: Skills, Interests */}
                <VStack gap={6} align="stretch">
                    <Box className="terminal-card" p={6}>
                        <HStack justify="space-between" mb={4}>
                            <Heading size="xs" color="var(--terminal-accent)" textTransform="uppercase" letterSpacing="widest" fontWeight="black">Professional Skills</Heading>
                            <Icon as={LuZap} color="var(--terminal-accent)" />
                        </HStack>
                        <Flex wrap="wrap" gap={3}>
                            {student.skills && student.skills.length > 0 ? (
                                student.skills.map((skill, idx) => (
                                    <Badge key={idx} colorPalette="brand" variant="solid" size="md" fontWeight="black">{skill}</Badge>
                                ))
                            ) : (
                                <Text color="whiteAlpha.400" fontSize="xs" fontStyle="italic">Waiting for skill injection...</Text>
                            )}
                        </Flex>
                    </Box>

                    <Box className="terminal-card" p={6}>
                        <HStack justify="space-between" mb={4}>
                            <Heading size="xs" color="var(--terminal-accent)" textTransform="uppercase" letterSpacing="widest" fontWeight="black">Interests & Domains</Heading>
                            <Icon as={LuActivity} color="var(--terminal-accent)" />
                        </HStack>
                        <Flex wrap="wrap" gap={3}>
                            {student.interests && student.interests.length > 0 ? (
                                student.interests.map((interest, idx) => (
                                    <Badge key={idx} colorPalette="brand" variant="solid" size="sm" fontWeight="black">{interest}</Badge>
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
