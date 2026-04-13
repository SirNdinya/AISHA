import React, { useEffect, useState } from 'react';
import {
    Box, Text, VStack, HStack, Heading, Icon, Badge, Button,
    Spinner, Flex, Separator, SimpleGrid
} from '@chakra-ui/react';
import {
    DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody,
    DialogFooter, DialogActionTrigger, DialogCloseTrigger,
    DialogBackdrop, DialogPositioner
} from '@chakra-ui/react'; // Ensure consistency
import {
    TableRoot, TableHeader, TableRow, TableColumnHeader,
    TableBody, TableCell
} from '@chakra-ui/react'; // Correct component patterns
import { LuBookOpen, LuDownload, LuZap, LuTrendingUp, LuCircleCheck } from "react-icons/lu";
import StudentService from '../../../services/studentService';
import MarkdownText from '../../../components/common/MarkdownText';

interface TranscriptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ student?: any, records: any[], analysis: any } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await StudentService.getTranscriptReport();
            setData(result || { student: null, records: [], analysis: { gpa: 0, insights: '', recommendation: '' } });
        } catch (error) {
            console.error('Failed to fetch transcript:', error);
            setData({ student: null, records: [], analysis: { gpa: 0, insights: 'Analysis not available.', recommendation: 'Please try again later.' } });

        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            await StudentService.downloadTranscriptReport();
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    // Group records by Academic Year and Semester - Safe handling
    const groupedRecords = (data?.records || []).reduce((acc: any, record: any) => {
        const key = `${record.academic_year || 'Unknown'} - ${record.semester || 'Unknown'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(record);
        return acc;
    }, {});

    return (
        <DialogRoot open={isOpen} onOpenChange={onClose} size="xl" scrollBehavior="inside">
            <DialogBackdrop />
            <DialogPositioner>
                <DialogContent bg="white" color="black" border="1px solid" borderColor="gray.200" boxShadow="0 10px 30px rgba(0,0,0,0.15)">
                    <DialogHeader borderBottom="1px solid" borderColor="gray.100">
                        <HStack justify="space-between" w="full">
                            <HStack>
                                <Icon as={LuBookOpen} color="blue.600" />
                                <DialogTitle color="black" fontWeight="black" letterSpacing="widest">
                                    ACADEMIC TRANSCRIPT FEEDBACK
                                </DialogTitle>
                            </HStack>
                            <DialogCloseTrigger color="gray.400" _hover={{ color: "black" }} />
                        </HStack>
                    </DialogHeader>

                    <DialogBody py={6}>
                        {loading ? (
                            <Flex justify="center" align="center" py={12}>
                                <VStack gap={4}>
                                    <Spinner size="xl" color="blue.600" />
                                    <Text color="blue.600" fontSize="xs" fontWeight="bold">SEQUENCING RECORDS...</Text>
                                </VStack>
                            </Flex>
                        ) : data && data.records?.length > 0 ? (
                            <VStack align="stretch" gap={8}>
                                {/* Student Information Section */}
                                {data.student && (
                                    <Box bg="gray.50" p={6} rounded="xl" border="1px solid" borderColor="gray.100" borderLeft="6px solid" borderLeftColor="blue.600">
                                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                                            <VStack align="start" gap={1}>
                                                <Text color="blue.600" fontSize="10px" fontWeight="black" letterSpacing="widest">STUDENT NAME</Text>
                                                <Text color="black" fontSize="md" fontWeight="bold" textTransform="uppercase">
                                                    {data.student.first_name} {data.student.last_name}
                                                </Text>
                                            </VStack>
                                            <VStack align="start" gap={1}>
                                                <Text color="blue.600" fontSize="10px" fontWeight="black" letterSpacing="widest">REGISTRATION NO</Text>
                                                <Text color="black" fontSize="md" fontWeight="bold">
                                                    {data.student.admission_number || 'N/A'}
                                                </Text>
                                            </VStack>
                                            <VStack align="start" gap={1}>
                                                <Text color="blue.600" fontSize="10px" fontWeight="black" letterSpacing="widest">INSTITUTION</Text>
                                                <Text color="black" fontSize="md" fontWeight="semibold">
                                                    {data.student.institution_name || 'N/A'}
                                                </Text>
                                            </VStack>
                                        </SimpleGrid>
                                    </Box>
                                )}

                                {/* AI Skill Analysis Section */}
                                <Box bg="blue.50" p={6} rounded="xl" border="1px solid" borderColor="blue.100" borderLeft="6px solid" borderLeftColor="blue.400">
                                    <HStack mb={4}>
                                        <Icon as={LuZap} color="blue.600" />
                                        <Heading size="xs" color="blue.900" textTransform="uppercase" letterSpacing="widest" fontWeight="black">
                                            Skills & Transcript Feedback
                                        </Heading>
                                    </HStack>
                                    {!data.analysis || !data.analysis.insights || data.analysis.insights.includes('{') ? (
                                        <VStack align="start" gap={4} py={2}>
                                            <HStack gap={4}>
                                                <Spinner size="xs" color="blue.600" />
                                                <Text color="blue.700" fontSize="xs" fontWeight="bold" fontStyle="italic">
                                                    {data.analysis?.insights?.includes('{') ? 'STALE DATA DETECTED. RE-CALIBRATING...' : 'STREAMS SYNCHRONIZED. ANALYZING PERFORMANCE NODES...'}
                                                </Text>
                                            </HStack>
                                            <Button 
                                                size="xs" 
                                                variant="outline" 
                                                colorPalette="blue" 
                                                onClick={() => {
                                                    if (data.student?.admission_number) {
                                                        StudentService.syncProfile(data.student.admission_number).then(() => fetchData());
                                                    }
                                                }}
                                            >
                                                FORCE NEURAL RE-SYNC
                                            </Button>
                                        </VStack>
                                    ) : (
                                        <VStack align="stretch" gap={4}>
                                            <MarkdownText 
                                                content={data.analysis?.insights} 
                                                color="blue.900" 
                                                fontSize="sm" 
                                                lineHeight="tall" 
                                                fontWeight="medium" 
                                            />
                                            <Box bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="blue.200" boxShadow="sm">
                                                <HStack mb={2}>
                                                    <Icon as={LuTrendingUp} color="green.600" size="sm" />
                                                    <Text color="green.700" fontSize="10px" fontWeight="black" letterSpacing="widest">OFFICIAL RECOMMENDATION</Text>
                                                </HStack>
                                                <Text color="blue.900" fontSize="sm" fontWeight="bold" lineHeight="relaxed">
                                                    {data.analysis?.recommendation}
                                                </Text>
                                            </Box>
                                        </VStack>
                                    )}
                                </Box>

                                {/* Grouped Transcript View */}
                                <VStack align="stretch" gap={10}>
                                    {Object.keys(groupedRecords).map((period) => (
                                        <Box key={period}>
                                            <Flex mb={4} justify="space-between" align="center">
                                                <Heading size="xs" color="gray.400" textTransform="uppercase" letterSpacing="widest" fontWeight="black">
                                                    {period}
                                                </Heading>
                                                <Badge colorPalette="blue" variant="subtle" size="sm" borderRadius="md" px={3}>
                                                    {groupedRecords[period].length} UNITS_DETECTED
                                                </Badge>
                                            </Flex>
                                            <TableRoot size="sm" variant="line" colorPalette="blue">
                                                <TableHeader bg="gray.50">
                                                    <TableRow borderBottom="2px solid" borderColor="gray.200">
                                                        <TableColumnHeader color="gray.600" py={3} fontWeight="black" fontSize="10px">UNIT CODE</TableColumnHeader>
                                                        <TableColumnHeader color="gray.600" py={3} fontWeight="black" fontSize="10px">UNIT NAME</TableColumnHeader>
                                                        <TableColumnHeader color="gray.600" py={3} fontWeight="black" fontSize="10px" textAlign="center">MARK</TableColumnHeader>
                                                        <TableColumnHeader color="gray.600" py={3} fontWeight="black" fontSize="10px" textAlign="center">GRADE</TableColumnHeader>
                                                        <TableColumnHeader color="gray.600" py={3} fontWeight="black" fontSize="10px" textAlign="right">VERIFICATION</TableColumnHeader>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {groupedRecords[period].map((record: any, idx: number) => (
                                                        <TableRow key={idx} _hover={{ bg: "gray.50" }} transition="all 0.2s" borderBottom="1px solid" borderColor="gray.100">
                                                            <TableCell color="blue.700" fontWeight="black" fontSize="xs">{record.unit_code}</TableCell>
                                                            <TableCell color="black" fontSize="sm" fontWeight="semibold">{record.unit_name}</TableCell>
                                                            <TableCell textAlign="center" color="gray.600" fontWeight="bold">
                                                                {record.mark !== null && record.mark !== undefined ? `${record.mark}%` : 'N/A'}
                                                            </TableCell>
                                                            <TableCell textAlign="center">
                                                                <Badge colorPalette={record.grade?.startsWith('A') ? 'green' : 'blue'} variant="solid" px={3} borderRadius="md">
                                                                    {record.grade || 'N/A'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell textAlign="right">
                                                                <Icon as={LuCircleCheck} color="green.600" size="sm" />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </TableRoot>
                                        </Box>
                                    ))}
                                </VStack>
                            </VStack>
                        ) : (
                            <VStack py={20} gap={6}>
                                <Text color="gray.400" textAlign="center" fontWeight="bold" letterSpacing="widest">NO SYNC RECORDS FOUND</Text>
                                <Button variant="outline" size="sm" colorPalette="blue" onClick={fetchData} borderRadius="full" px={8}>
                                    RE-INITIALIZE SCAN
                                </Button>
                            </VStack>
                        )}
                    </DialogBody>

                    <DialogFooter borderTop="1px solid" borderColor="gray.100" bg="gray.50">
                        <HStack justify="space-between" w="full">
                            <Button variant="ghost" onClick={fetchData} size="sm" color="gray.600" fontWeight="bold">
                                REFRESH ACADEMIC STREAM
                            </Button>
                            <HStack gap={4}>
                                <Button colorPalette="blue" size="sm" onClick={handleDownload} disabled={!data || data.records?.length === 0} borderRadius="full" px={6} fontWeight="black">
                                    <LuDownload /> DOWNLOAD PDF REPORT
                                </Button>
                                <DialogActionTrigger asChild>
                                    <Button variant="ghost" color="gray.500" size="sm" onClick={onClose} fontWeight="bold">
                                        CLOSE
                                    </Button>
                                </DialogActionTrigger>
                            </HStack>
                        </HStack>
                    </DialogFooter>
                </DialogContent>
            </DialogPositioner>
        </DialogRoot>
    );
};

export default TranscriptModal;
