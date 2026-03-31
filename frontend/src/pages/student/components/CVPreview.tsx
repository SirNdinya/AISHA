import React from 'react';
import { Box, VStack, HStack, Text, Heading, Badge, Separator, SimpleGrid, Icon, Flex } from '@chakra-ui/react';
import { Avatar } from "../../../components/ui/avatar";
import { LuMail, LuPhone, LuMapPin, LuBriefcase, LuCode, LuGraduationCap } from 'react-icons/lu';

interface CVPreviewProps {
    data: {
        summary: string;
        experience: any[];
        projects: any[];
        skills: string[];
    };
    student: any;
}

const CVPreview: React.FC<CVPreviewProps> = ({ data, student }) => {
    return (
        <Box bg="white" color="black" p={10} shadow="xl" borderRadius="sm" id="cv-to-print" minH="1100px">
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <Flex justify="space-between" align="center" borderBottom="3px solid" borderColor="blue.800" pb={6}>
                    <VStack align="start" gap={1}>
                        <Heading size="3xl" fontWeight="black" textTransform="uppercase" letterSpacing="widest" color="blue.900">
                            {student?.first_name} {student?.last_name}
                        </Heading>
                        <Text color="blue.600" fontSize="md" fontWeight="bold">
                            {student?.course_of_study || 'Student Engineer'}
                        </Text>
                        <HStack gap={4} mt={2}>
                            <HStack gap={1}>
                                <Icon as={LuMail} boxSize={3} color="blue.600" />
                                <Text fontSize="xs" fontWeight="medium">{student?.email || 'email@example.com'}</Text>
                            </HStack>
                            <HStack gap={1}>
                                <Icon as={LuPhone} boxSize={3} color="blue.600" />
                                <Text fontSize="xs" fontWeight="medium">{student?.phone_number || 'N/A'}</Text>
                            </HStack>
                            <HStack gap={1}>
                                <Icon as={LuMapPin} boxSize={3} color="blue.600" />
                                <Text fontSize="xs" fontWeight="medium">{student?.preferred_locations?.[0] || 'Kenya'}</Text>
                            </HStack>
                        </HStack>
                    </VStack>

                    <Avatar 
                        size="2xl" 
                        src={student?.profile_picture_url || ""} 
                        name={`${student?.first_name} ${student?.last_name}`}
                        border="2px solid"
                        borderColor="blue.800"
                        shape="square"
                        borderRadius="md"
                    />
                </Flex>

                {/* Summary */}
                <Box>
                    <HStack mb={2}>
                        <Icon as={LuBriefcase} boxSize={4} color="blue.800" />
                        <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="blue.800">Professional Summary</Heading>
                    </HStack>
                    <Text fontSize="sm" textAlign="justify" lineHeight="relaxed" color="gray.800">
                        {data.summary}
                    </Text>
                    <Separator mt={4} borderColor="gray.200" />
                </Box>

                {/* Experience */}
                {data.experience?.length > 0 && (
                    <Box>
                        <HStack mb={4}>
                            <Icon as={LuBriefcase} boxSize={4} color="blue.800" />
                            <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="blue.800">Experience & Internships</Heading>
                        </HStack>
                        <VStack align="stretch" gap={4}>
                            {data.experience.map((exp, i) => (
                                <Box key={i}>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold" fontSize="sm" color="gray.900">{exp.role}</Text>
                                        <Text fontSize="xs" color="gray.500" fontWeight="bold">{exp.dates}</Text>
                                    </HStack>
                                    <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={1}>{exp.company}</Text>
                                    <Text fontSize="xs" color="gray.700" lineHeight="tall">{exp.description}</Text>
                                </Box>
                            ))}
                        </VStack>
                        <Separator mt={6} borderColor="gray.200" />
                    </Box>
                )}

                {/* Projects */}
                {data.projects?.length > 0 && (
                    <Box>
                        <HStack mb={4}>
                            <Icon as={LuCode} boxSize={4} color="blue.800" />
                            <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="blue.800">Academic & Personal Projects</Heading>
                        </HStack>
                        <VStack align="stretch" gap={4}>
                            {data.projects.map((proj, i) => (
                                <Box key={i}>
                                    <HStack justify="space-between" mb={1}>
                                        <Text fontWeight="bold" fontSize="sm" color="gray.900">{proj.title}</Text>
                                        <Text fontSize="xs" fontWeight="black" color="blue.700" textTransform="uppercase" letterSpacing="tighter">{proj.technologies}</Text>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.700" lineHeight="tall">{proj.description}</Text>
                                </Box>
                            ))}
                        </VStack>
                        <Separator mt={6} borderColor="gray.200" />
                    </Box>
                )}

                {/* Skills */}
                <Box>
                    <HStack mb={3}>
                        <Icon as={LuCode} boxSize={4} color="blue.800" />
                        <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="blue.800">Core Competencies</Heading>
                    </HStack>
                    <HStack wrap="wrap" gap={2}>
                        {data.skills?.map((skill, i) => (
                            <Badge key={i} variant="surface" colorPalette="blue" px={3} py={1} borderRadius="sm" textTransform="none" fontWeight="bold">
                                {skill}
                            </Badge>
                        ))}
                    </HStack>
                    <Separator mt={6} borderColor="gray.200" />
                </Box>

                {/* Education */}
                <Box>
                    <HStack mb={3}>
                        <Icon as={LuGraduationCap} boxSize={4} color="blue.800" />
                        <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="blue.800">Education</Heading>
                    </HStack>
                    <HStack justify="space-between">
                        <VStack align="start" gap={0}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.900">{student?.institution_name || 'Technical University of Kenya'}</Text>
                            <Text fontSize="xs" color="blue.700" fontWeight="bold">{student?.course_of_study}</Text>
                        </VStack>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">Graduating: 2026</Text>
                    </HStack>
                </Box>
            </VStack>
        </Box>
    );
};

export default CVPreview;
