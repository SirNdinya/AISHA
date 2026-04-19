import React, { useEffect, useState } from 'react';
import {
    Box, Text, VStack, HStack, Heading, Icon, Badge, Button,
    Spinner, Flex, SimpleGrid
} from '@chakra-ui/react';
import {
    DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody,
    DialogFooter, DialogActionTrigger, DialogPositioner, DialogCloseTrigger
} from '@chakra-ui/react';
import {
    TableRoot, TableHeader, TableRow, TableColumnHeader,
    TableBody, TableCell
} from '@chakra-ui/react';
import { LuBookOpen, LuDownload, LuZap, LuTrendingUp, LuSparkles, LuBot, LuActivity } from "react-icons/lu";
import StudentService from '../../../services/studentService';
import MarkdownText from '../../../components/common/MarkdownText';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface TranscriptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ student?: any, records: any[], analysis: any } | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isOpen) {
            fetchData();
            
            interval = setInterval(() => {
                setData(currentData => {
                    const isInvalid = !currentData?.analysis || 
                                     !currentData.analysis.insights || 
                                     currentData.analysis.insights.toLowerCase().includes('string') ||
                                     currentData.analysis.insights.includes('{');
                    
                    if (isInvalid) {
                        fetchDataSilent();
                    } else {
                        clearInterval(interval);
                    }
                    return currentData;
                });
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        await fetchDataSilent();
        setLoading(false);
    };

    const fetchDataSilent = async () => {
        try {
            const result = await StudentService.getTranscriptReport();
            setData(result || { student: null, records: [], analysis: { gpa: 0, insights: '', recommendation: '' } });
        } catch (error) {
            console.error('Failed to fetch transcript:', error);
            setData({ student: null, records: [], analysis: { gpa: 0, insights: 'Analysis not available.', recommendation: 'Please try again later.' } });
        }
    };

    const handleDownload = async () => {
        try {
            await StudentService.downloadTranscriptReport();
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const groupedRecords = (data?.records || []).reduce((acc: any, record: any) => {
        const key = `${record.academic_year || 'Unknown'} | SEMESTER ${record.semester || '?'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(record);
        return acc;
    }, {});

    return (
        <DialogRoot open={isOpen} onOpenChange={onClose} size="xl" scrollBehavior="inside">
            <DialogPositioner>
                <DialogContent 
                    bg="#020617" 
                    color="white" 
                    border="1px solid" 
                    borderColor="rgba(255, 255, 255, 0.1)" 
                    boxShadow="0 0 100px rgba(0, 0, 0, 0.5)"
                    borderRadius="2xl"
                    overflow="hidden"
                >
                    <DialogHeader bg="rgba(0,0,0,0.3)" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.1)" p={{ base: 3, md: 6 }}>
                        <HStack justify="space-between" w="full">
                            <HStack gap={{ base: 2, md: 4 }}>
                                <Flex 
                                    bg="brand.500" 
                                    p={{ base: 1.5, md: 2.5 }} 
                                    borderRadius="lg" 
                                    boxShadow="0 0 20px rgba(0, 136, 204, 0.4)"
                                >
                                    <Icon as={LuBookOpen} color="white" boxSize={{ base: 4, md: 5 }} />
                                </Flex>
                                <VStack align="start" gap={0}>
                                    <DialogTitle fontSize={{ base: "xs", md: "xl" }} color="white" fontWeight="black" letterSpacing="widest" textTransform="uppercase">
                                        Transcript
                                    </DialogTitle>
                                </VStack>
                            </HStack>
                            <DialogCloseTrigger asChild>
                                <Button variant="ghost" size="xs" color="whiteAlpha.600" onClick={onClose}>
                                    CLOSE
                                </Button>
                            </DialogCloseTrigger>
                        </HStack>
                    </DialogHeader>

                    <DialogBody py={8} px={8}>
                        {loading ? (
                            <Flex justify="center" align="center" py={24}>
                                <VStack gap={6}>
                                    <Box pos="relative">
                                        <Spinner size="xl" borderWidth="3px" color="brand.400" />
                                        <MotionBox
                                            pos="absolute" inset="-15px"
                                            border="1px solid" borderColor="brand.400" borderRadius="full" opacity={0.3}
                                            animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    </Box>
                                    <Text color="brand.400" fontSize="xs" fontWeight="black" letterSpacing="widest" textTransform="uppercase">Loading Academic Records...</Text>
                                </VStack>
                            </Flex>
                        ) : data && data.records?.length > 0 ? (
                            <VStack align="stretch" gap={10}>
                                {/* Header Stats Cards */}
                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                    <MotionBox
                                        whileHover={{ y: -2 }}
                                        p={4} bg="rgba(255,255,255,0.03)" border="1px solid" borderColor="rgba(255,255,255,0.05)" borderRadius="2xl"
                                    >
                                        <VStack align="start" gap={1}>
                                            <Text fontSize="10px" color="indigo.400" fontWeight="black" letterSpacing="widest">VERIFIED RECORDS</Text>
                                            <Text fontSize="lg" color="white" fontWeight="black">{data.records.length} UNITS</Text>
                                        </VStack>
                                    </MotionBox>
                                    <MotionBox
                                        whileHover={{ y: -2 }}
                                        p={4} bg="rgba(0,136,204,0.1)" border="1px solid" borderColor="brand.500" borderRadius="2xl"
                                    >
                                        <VStack align="start" gap={1}>
                                            <Text fontSize="10px" color="brand.400" fontWeight="black" letterSpacing="widest">INSTITUTION</Text>
                                            <Text fontSize="xs" color="white" fontWeight="bold" lineClamp={1} textTransform="uppercase">
                                                {data.student?.institution_name || 'MASINDE MULIRO'}
                                            </Text>
                                        </VStack>
                                    </MotionBox>
                                </SimpleGrid>

                                {/* AI Intelligence Highlight (Centerpiece) */}
                                <MotionBox
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    p={8} 
                                    bgGradient="linear(to-br, rgba(79, 70, 229, 0.15), rgba(0, 136, 204, 0.05))" 
                                    rounded="3xl" 
                                    border="1px solid" 
                                    borderColor="brand.400" 
                                    pos="relative"
                                    overflow="hidden"
                                    boxShadow="0 0 40px rgba(0, 136, 204, 0.2)"
                                >
                                    <Box pos="absolute" top={-10} right={-10} opacity={0.1}>
                                        <Icon as={LuBot} boxSize={48} />
                                    </Box>
                                    <HStack mb={6} justify="space-between">
                                        <HStack gap={3}>
                                            <Flex bg="brand.500" p={2} borderRadius="lg">
                                                <Icon as={LuSparkles} color="white" />
                                            </Flex>
                                            <VStack align="start" gap={0}>
                                                <Heading size="sm" color="white" fontWeight="black" letterSpacing="widest">ACADEMIC PERFORMANCE INSIGHTS</Heading>
                                                <Text fontSize="xs" color="brand.400" fontWeight="black">AI PERFORMANCE ANALYSIS</Text>
                                            </VStack>
                                        </HStack>
                                    </HStack>

                                    {(!data.analysis || !data.analysis.insights || data.analysis.insights.includes('{')) ? (
                                        <HStack gap={4} py={8} justify="center">
                                            <Spinner color="brand.400" size="sm" />
                                            <Text color="brand.400" fontSize="xs" fontWeight="black" letterSpacing="widest">GENERATING INSIGHTS...</Text>
                                        </HStack>
                                    ) : (
                                        <VStack align="stretch" gap={6}>
                                            <Box color="whiteAlpha.900" fontSize="sm" lineHeight="tall" fontWeight="semibold">
                                                <MarkdownText content={data.analysis.insights} />
                                            </Box>
                                            
                                            <Flex 
                                                p={5} 
                                                bg="rgba(0,0,0,0.3)" 
                                                borderRadius="2xl" 
                                                borderLeft="4px solid" 
                                                borderColor="green.400"
                                                align="center"
                                                gap={4}
                                            >
                                                <Icon as={LuTrendingUp} color="green.400" boxSize={6} />
                                                <VStack align="start" gap={0}>
                                                    <Text color="green.400" fontSize="9px" fontWeight="black" letterSpacing="2px">EXPERT RECOMMENDATION</Text>
                                                    <Text color="white" fontSize="sm" fontWeight="black">
                                                        {data.analysis.recommendation}
                                                    </Text>
                                                </VStack>
                                            </Flex>
                                        </VStack>
                                    )}
                                </MotionBox>

                                {/* Detailed Transcript Timeline */}
                                <VStack align="stretch" gap={12}>
                                    {Object.keys(groupedRecords).map((period, pIdx) => (
                                        <Box key={period}>
                                            <Flex mb={6} justify="space-between" align="center">
                                                <HStack gap={3}>
                                                    <Text color="indigo.400" fontSize="xs" fontWeight="black">0{pIdx + 1}</Text>
                                                    <Heading size="xs" color="white" textTransform="uppercase" letterSpacing="2px" fontWeight="black">
                                                        {period}
                                                    </Heading>
                                                </HStack>
                                                <Badge bg="whiteAlpha.100" color="whiteAlpha.700" variant="solid" size="sm" borderRadius="full" px={4} py={1} border="1px solid" borderColor="whiteAlpha.200">
                                                    {groupedRecords[period].length} VERIFIED ENTRIES
                                                </Badge>
                                            </Flex>
                                            <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="rgba(255,255,255,0.1)" bg="rgba(0,0,0,0.2)">
                                                <TableRoot size="sm" variant="line">
                                                    <TableHeader bg="rgba(255,255,255,0.05)">
                                                        <TableRow borderBottom="1px solid" borderColor="rgba(255,255,255,0.1)">
                                                            <TableColumnHeader color="indigo.400" py={2} fontWeight="black" fontSize="9px" w="50px">CODE</TableColumnHeader>
                                                            <TableColumnHeader color="indigo.400" py={2} fontWeight="black" fontSize="9px">UNIT NAME</TableColumnHeader>
                                                            <TableColumnHeader color="indigo.400" py={2} fontWeight="black" fontSize="9px" textAlign="center" display={{ base: "none", sm: "table-cell" }}>SCORE</TableColumnHeader>
                                                            <TableColumnHeader color="indigo.400" py={2} fontWeight="black" fontSize="9px" textAlign="center" w="60px">GRADE</TableColumnHeader>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {groupedRecords[period].map((record: any, idx: number) => (
                                                            <TableRow key={idx} _hover={{ bg: "whiteAlpha.100" }} transition="all 0.2s" borderBottom="1px solid" borderColor="whiteAlpha.100" bg="whiteAlpha.50">
                                                                <TableCell color="brand.400" fontWeight="black" fontSize="9px" whiteSpace="nowrap" py={2}>{record.unit_code}</TableCell>
                                                                <TableCell color="white" fontSize={{ base: "10px", md: "sm" }} fontWeight="bold" py={2}>
                                                                    {record.unit_name}
                                                                </TableCell>
                                                                <TableCell textAlign="center" color="white" fontWeight="black" display={{ base: "none", sm: "table-cell" }} py={2}>
                                                                    {record.mark !== null && record.mark !== undefined ? `${record.mark}%` : '--'}
                                                                </TableCell>
                                                                <TableCell textAlign="center" py={1}>
                                                                    <Badge 
                                                                        bg={record.grade?.startsWith('A') ? "rgba(72, 187, 120, 0.2)" : (record.grade === 'Incomplete' || record.grade === 'I') ? "rgba(239, 68, 68, 0.2)" : "rgba(237, 137, 54, 0.2)"} 
                                                                        color={record.grade?.startsWith('A') ? "green.400" : (record.grade === 'Incomplete' || record.grade === 'I') ? "red.400" : "orange.400"}
                                                                        border="1px solid"
                                                                        borderColor={record.grade?.startsWith('A') ? "green.400" : (record.grade === 'Incomplete' || record.grade === 'I') ? "red.400" : "orange.400"}
                                                                        borderRadius="md" px={1}
                                                                        fontSize="9px"
                                                                        maxW="50px"
                                                                        overflow="hidden"
                                                                        textOverflow="ellipsis"
                                                                    >
                                                                        {record.grade || 'N/A'}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </TableRoot>
                                            </Box>
                                        </Box>
                                    ))}
                                </VStack>
                            </VStack>
                        ) : (
                            <Flex py={32} align="center" justify="center" direction="column" gap={6}>
                                <Icon as={LuActivity} color="whiteAlpha.200" boxSize={20} />
                                <VStack gap={2}>
                                    <Text color="whiteAlpha.400" textAlign="center" fontWeight="black" letterSpacing="widest">NO ACADEMIC RECORDS FOUND</Text>
                                    <Text color="whiteAlpha.200" fontSize="xs" fontWeight="bold">Update your student portal to load your academic records.</Text>
                                </VStack>
                                <Button variant="outline" colorPalette="brand" size="md" borderRadius="full" px={10} onClick={fetchData} borderColor="brand.400" color="brand.400">
                                    REFRESH RECORDS
                                </Button>
                            </Flex>
                        )}
                    </DialogBody>

                    <DialogFooter bg="rgba(0,0,0,0.2)" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.05)" p={{ base: 4, md: 6 }}>
                        <Flex 
                            direction={{ base: "column", sm: "row" }} 
                            gap={4} 
                            w="full" 
                            align="center" 
                            justify="space-between"
                        >
                            <Button variant="ghost" onClick={fetchData} size="sm" color="brand.400" fontWeight="black" letterSpacing="widest" _hover={{ bg: "brand.900" }} w={{ base: "full", sm: "auto" }}>
                                <Icon as={LuZap} mr={2} /> REFRESH
                            </Button>
                            <Button 
                                bg="brand.500" 
                                _hover={{ bg: "brand.600", transform: "translateY(-1px)" }}
                                size={{ base: "sm", md: "md" }} 
                                onClick={handleDownload} 
                                disabled={!data || data.records?.length === 0} 
                                borderRadius="xl" 
                                px={{ base: 4, md: 8 }} 
                                fontWeight="black"
                                w={{ base: "full", sm: "auto" }}
                                boxShadow="0 4px 15px rgba(0, 136, 204, 0.3)"
                            >
                                <LuDownload /> GENERATE PDF
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogPositioner>
        </DialogRoot>
    );
};

export default TranscriptModal;
