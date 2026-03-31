import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Flex,
    SimpleGrid,
    Icon,
    Table,
    Badge,
    IconButton,
    Input,
    HStack,
    VStack,
    Spinner,
} from '@chakra-ui/react';
import {
    Search,
    FileText,
    ShieldCheck,
    Clock,
    Download,
    Eye,
    CheckCircle2
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { toaster } from '../../../components/ui/toaster';
import './AdminPortal.css';

const DocumentHub: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const docsRes = await apiClient.get('/institutions/documents');
            setDocuments(docsRes.data.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
            toaster.create({ title: "Error", description: "Failed to load document data", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDocs = documents.filter(d =>
        (d.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         d.type?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="xl" fontWeight="black">Sovereign Document Vault</Heading>
                    <Text color="gray.500">Blockchain-anchored institutional records and automated fulfillment tracking</Text>
                </Box>
            </Flex>

            {/* Quick Stats */}
            <SimpleGrid columns={[1, 3]} gap={6} mb={8}>
                {[
                    { label: 'Auto-Generated', count: documents.length, icon: FileText, color: '#a78bfa' },
                    { label: 'Verified Integrity', count: documents.filter(d => d.status === 'VERIFIED').length, icon: ShieldCheck, color: '#2dd4bf' },
                    { label: 'Pending Process', count: documents.filter(d => d.status === 'PENDING').length, icon: Clock, color: '#fbbf24' },
                ].map((stat, i) => (
                    <Box key={i} className="glass-card" p={6} borderRadius="24px" display="flex" alignItems="center" gap={4}>
                        <Box p={3} borderRadius="15px" bg={`${stat.color}20`}>
                            <Icon as={stat.icon} boxSize={6} color={stat.color} />
                        </Box>
                        <VStack align="start" gap={0}>
                            <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">{stat.label}</Text>
                            <Heading size="lg">{stat.count}</Heading>
                        </VStack>
                    </Box>
                ))}
            </SimpleGrid>

            <Box className="glass-card" p={8} borderRadius="30px">
                <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
                    <HStack gap={4}>
                        <Heading size="md">Issuance History</Heading>
                        <Badge variant="subtle" colorPalette="teal">BLOCKCHAIN_SYNC</Badge>
                    </HStack>
                    <Box w={{ base: "full", md: "300px" }} position="relative">
                        <Input
                            pl={10}
                            placeholder="Locate student record..."
                            bg="rgba(255,255,255,0.05)"
                            border="none"
                            borderRadius="xl"
                            h={10}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Icon as={Search} position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500" />
                    </Box>
                </Flex>

                {isLoading ? (
                    <Flex justify="center" py={20}><Spinner color="purple.400" /></Flex>
                ) : (
                    <Table.Root variant="line" size="lg">
                        <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                            <Table.Row>
                                <Table.ColumnHeader color="gray.500">DOCUMENT_NODE</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">RECIPIENT_HASH</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500">INTEGRITY_STATUS</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.500" textAlign="right">OPERATIONS</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
                                <Table.Row key={i} _hover={{ bg: "rgba(255,255,255,0.02)" }}>
                                    <Table.Cell py={5}>
                                        <HStack gap={4}>
                                            <Icon as={FileText} color="purple.400" boxSize={5} />
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold">{doc.type}</Text>
                                                <Text fontSize="10px" color="gray.500">UID: {doc.id.substring(0, 8).toUpperCase()}</Text>
                                            </VStack>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <VStack align="start" gap={0}>
                                            <Text fontWeight="medium" color="gray.200">{doc.student_name}</Text>
                                            <Text fontSize="xs" color="gray.500">Reg: {doc.admission_number || 'SYNC_ERROR'}</Text>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={doc.status === 'VERIFIED' ? 'teal' : 'amber'}
                                            variant="subtle"
                                            borderRadius="full"
                                            px={3}
                                        >
                                            <HStack gap={1}>
                                                <Icon as={doc.status === 'VERIFIED' ? CheckCircle2 : Clock} boxSize={3} />
                                                <Text>{doc.status}</Text>
                                            </HStack>
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <HStack gap={2} justify="flex-end">
                                            <IconButton aria-label="View" size="sm" variant="ghost" color="gray.400" _hover={{ color: 'white' }}>
                                                <Eye size={18} />
                                            </IconButton>
                                            <IconButton aria-label="Download" size="sm" variant="ghost" color="gray.400" _hover={{ color: 'teal.400' }}>
                                                <Download size={18} />
                                            </IconButton>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            )) : (
                                <Table.Row>
                                    <Table.Cell colSpan={4} textAlign="center" py={10}>
                                        <Text color="gray.500">No synchronized records found in local cache.</Text>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Box>
    );
};

export default DocumentHub;
