import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    SimpleGrid,
    Badge,
    Icon,
    Table,
    Input,
    VStack,
    IconButton,
    Spinner,
    HStack,
    useDisclosure,
    Separator,
} from '@chakra-ui/react';
import {
    Plus,
    Building2,
    MoreVertical,
    Search,
    Mail,
    Lock,
    Users as UsersIcon,
    ShieldCheck,
    Eye,
    EyeOff,
    Power,
    PowerOff
} from 'lucide-react';
import { Switch } from '../../../components/ui/switch';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import apiClient from '../../../services/apiClient';
import { toaster } from '../../../components/ui/toaster';
import './AdminPortal.css';

interface Department {
    id: string;
    name: string;
    code: string;
    description: string;
    student_count: number;
    placed_count: number;
    user_id: string | null;
    admin_email: string | null;
    is_active: boolean;
}

const DepartmentManager: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [isGlobalModal, setIsGlobalModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: 'Claws@1234'
    });
    const [emailTemplate, setEmailTemplate] = useState('{dept_code}@{inst_code}.aisha.com');
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    const institutionCode = currentUser?.institutionCode || 'INST';

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/institutions/departments');
            setDepartments(res.data.data);

            // Fetch template from analytics
            const statsRes = await apiClient.get('/institutions/analytics');
            if (statsRes.data?.data?.overview?.email_template) {
                setEmailTemplate(statsRes.data.data.overview.email_template);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            toaster.create({ title: "Error", description: "Failed to load departments", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignAdmin = async () => {
        if (!selectedDept || !formData.email) {
            toaster.create({ title: "Validation Error", description: "Please provide an admin email and select a department", type: "error" });
            return;
        }

        setIsAssigning(true);
        try {
            await apiClient.post(`/institutions/departments/${selectedDept.id}/assign-admin`, formData);
            toaster.create({ title: "Success", description: `Admin assigned to ${selectedDept.name}`, type: "success" });
            setIsModalOpen(false);
            setFormData({ email: '', password: 'Claws@1234' });
            fetchDepartments();
        } catch (error: any) {
            console.error('Error assigning admin:', error);
            toaster.create({ title: "Error", description: error.response?.data?.message || "Failed to assign admin", type: "error" });
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleAccountStatus = async (deptId: string, currentStatus: boolean) => {
        try {
            await apiClient.patch(`/institutions/departments/${deptId}/status`, { isActive: !currentStatus });
            toaster.create({
                title: "Status Updated",
                description: `Dashboard access ${!currentStatus ? 'enabled' : 'disabled'}`,
                type: "success"
            });
            fetchDepartments();
        } catch (error) {
            console.error('Error toggling status:', error);
            toaster.create({ title: "Error", description: "Failed to update status", type: "error" });
        }
    };

    const generateEmail = (deptCode: string) => {
        return emailTemplate
            .replace('{dept_code}', deptCode.toLowerCase())
            .replace('{inst_code}', institutionCode.toLowerCase());
    };

    const openAssignmentModal = (dept: Department) => {
        setSelectedDept(dept);
        const defaultEmail = generateEmail(dept.code);
        setFormData({
            email: dept.admin_email || defaultEmail,
            password: 'Claws@1234'
        });
        setIsModalOpen(true);
    };

    if (isLoading && departments.length === 0) {
        return <Flex h="50vh" align="center" justify="center"><Spinner color="purple.400" /></Flex>;
    }

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="xl" fontWeight="black" letterSpacing="tight">Departmental Infrastructure</Heading>
                    <Text color="gray.500" fontSize="md">Manage administrative authority for pre-existing institutional nodes</Text>
                </Box>
                <Button
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    borderRadius="xl"
                    px={6}
                    h={12}
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)", transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                    onClick={() => {
                        setSelectedDept(null);
                        setIsGlobalModal(true);
                        setFormData({ email: '', password: 'Claws@1234' });
                        setIsModalOpen(true);
                    }}
                >
                    <HStack gap={2}>
                        <Icon as={Plus} boxSize={5} />
                        <Text>Provision Admin</Text>
                    </HStack>
                </Button>
            </Flex>

            {/* Top Highlights */}
            <SimpleGrid columns={[1, 2, 4]} gap={6} mb={10}>
                <Box className="glass-card" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">Total Depts</Text>
                        <Heading size="lg">{departments.length}</Heading>
                    </VStack>
                </Box>
                <Box className="glass-card" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">Managed Depts</Text>
                        <Heading size="lg" color="purple.300">{departments.filter(d => d.user_id).length}</Heading>
                    </VStack>
                </Box>
                <Box className="glass-card" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">Provisioning Status</Text>
                        <Badge colorPalette={departments.every(d => d.user_id) ? "green" : "orange"} variant="subtle">
                            {departments.every(d => d.user_id) ? "FULLY MANAGED" : "PENDING ADMINS"}
                        </Badge>
                    </VStack>
                </Box>
                <Box className="glass-card" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">Institutional Health</Text>
                        <HStack>
                            <Box w={2} h={2} bg="green.400" borderRadius="full" />
                            <Heading size="sm">Active</Heading>
                        </HStack>
                    </VStack>
                </Box>
            </SimpleGrid>

            {/* List Table */}
            <Box className="glass-card" p={8} borderRadius="30px">
                <Flex justify="space-between" align="center" mb={8}>
                    <HStack gap={4}>
                        <Heading size="md">Institutional Master List</Heading>
                        <Badge variant="subtle" colorPalette="purple" px={3} borderRadius="full">
                            EXISTING RECORDS
                        </Badge>
                    </HStack>
                    <Box position="relative" w="300px">
                        <Input
                            placeholder="Find department..."
                            bg="rgba(255,255,255,0.03)"
                            border="none"
                            pl={10}
                            borderRadius="xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon as={Search} position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500" />
                    </Box>
                </Flex>

                <Table.Root variant="line" size="lg">
                    <Table.Header borderBottom="1px solid rgba(255,255,255,0.05)">
                        <Table.Row>
                            <Table.ColumnHeader color="gray.500">DEPARTMENT</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">STUDENT DATA</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">ADMINISTRATIVE ACCOUNT</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500">PORTAL STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.500" textAlign="right">ACTIONS</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {departments
                            .filter(dept =>
                                dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                dept.code.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((dept) => (
                                <Table.Row key={dept.id} _hover={{ bg: "rgba(255,255,255,0.02)" }} transition="0.2s">
                                    <Table.Cell py={6}>
                                        <HStack gap={4}>
                                            <Box p={3} borderRadius="15px" bg="rgba(167, 139, 250, 0.1)">
                                                <Icon as={Building2} boxSize={5} color="purple.400" />
                                            </Box>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold" fontSize="md">{dept.name}</Text>
                                                <Text fontSize="xs" color="gray.500">{dept.code}</Text>
                                            </VStack>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <VStack align="start" gap={1}>
                                            <Badge colorPalette="gray" variant="subtle">{dept.student_count} Students</Badge>
                                            <Badge colorPalette="teal" variant="subtle">{dept.placed_count} Placed</Badge>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {dept.user_id ? (
                                            <VStack align="start" gap={1}>
                                                <HStack gap={2}>
                                                    <Icon as={Mail} boxSize={3} color="purple.400" />
                                                    <Text fontSize="xs" fontWeight="bold">{dept.admin_email}</Text>
                                                </HStack>
                                                <HStack gap={2}>
                                                    <Icon as={ShieldCheck} boxSize={3} color="teal.400" />
                                                    <Text fontSize="10px" color="gray.500">Verified System Admin</Text>
                                                </HStack>
                                            </VStack>
                                        ) : (
                                            <Text fontSize="xs" color="gray.500" fontStyle="italic">No Admin Assigned</Text>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {dept.user_id && (
                                            <HStack gap={4}>
                                                <Switch
                                                    colorPalette="teal"
                                                    checked={dept.is_active}
                                                    onCheckedChange={() => toggleAccountStatus(dept.id, dept.is_active)}
                                                />
                                                <Badge
                                                    colorPalette={dept.is_active ? "teal" : "red"}
                                                    variant="outline"
                                                    borderRadius="full"
                                                    px={3}
                                                >
                                                    {dept.is_active ? "ACTIVE" : "DISABLED"}
                                                </Badge>
                                            </HStack>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        <HStack justify="flex-end" gap={2}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                borderColor="whiteAlpha.200"
                                                color="white"
                                                _hover={{ bg: "purple.500", borderColor: "purple.500" }}
                                                borderRadius="lg"
                                                onClick={() => openAssignmentModal(dept)}
                                            >
                                                {dept.user_id ? "Change Password" : "Provision Admin"}
                                            </Button>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table.Root>
            </Box>

            {/* Assignment Modal */}
            {isModalOpen && (
                <Box className="modal-overlay" backdropFilter="blur(20px)" zIndex={100}>
                    <Box
                        className="modal-content glass-card"
                        maxW="500px"
                        p={10}
                        borderRadius="40px"
                        border="1px solid rgba(167, 139, 250, 0.2)"
                    >
                        <VStack gap={6} align="stretch">
                            <Box>
                                <Heading size="lg" mb={2}>Authorize Administrator</Heading>
                                <Text color="gray.500" fontSize="sm">Linking a new administrator to <b>{selectedDept?.name || 'a department'}</b>.</Text>
                            </Box>

                            <Separator opacity={0.1} />

                            {isGlobalModal && (
                                <Box>
                                    <Text fontSize="xs" color="gray.400" mb={2} fontWeight="bold" letterSpacing="widest">SELECT DEPARTMENT</Text>
                                    <Box position="relative">
                                        <select
                                            style={{
                                                width: '100%',
                                                height: '56px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '16px',
                                                color: 'white',
                                                padding: '0 48px 0 16px', // Updated padding
                                                outline: 'none',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            value={selectedDept?.id || ''}
                                            onChange={(e) => {
                                                const dept = departments.find(d => d.id === e.target.value);
                                                setSelectedDept(dept || null);
                                                if (dept && dept.code) {
                                                    const defaultEmail = generateEmail(dept.code);
                                                    setFormData(prev => ({ ...prev, email: defaultEmail }));
                                                }
                                            }}
                                        >
                                            <option value="" disabled style={{ color: '#000' }}>Select a department...</option>
                                            {departments.filter(d => !d.user_id).map(d => (
                                                <option key={d.id} value={d.id} style={{ color: '#000' }}>{d.name}</option>
                                            ))}
                                        </select>
                                        <Icon as={Building2} position="absolute" right={4} top="50%" transform="translateY(-50%)" color="gray.500" pointerEvents="none" />
                                    </Box>
                                </Box>
                            )}

                            <Box>
                                <Text fontSize="xs" color="gray.400" mb={2} fontWeight="bold" letterSpacing="widest">ADMINISTRATOR EMAIL</Text>
                                <Flex position="relative">
                                    <Input
                                        placeholder="admin@aisha.com"
                                        bg="rgba(255,255,255,0.02)"
                                        border="1px solid rgba(255,255,255,0.05)"
                                        h={14}
                                        pl={12}
                                        borderRadius="2xl"
                                        _focus={{ borderColor: "purple.400" }}
                                        value={formData.email}
                                        readOnly
                                    />
                                    <Icon as={Mail} position="absolute" left={4} top="50%" transform="translateY(-50%)" color="gray.600" />
                                </Flex>
                                <Text fontSize="10px" mt={2} color="gray.500">System generated based on department code for security.</Text>
                            </Box>

                            <Box>
                                <Text fontSize="xs" color="gray.400" mb={2} fontWeight="bold" letterSpacing="widest">DEFAULT ACCESS KEY</Text>
                                <Flex position="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        bg="rgba(255,255,255,0.05)"
                                        border="1px solid rgba(255,255,255,0.1)"
                                        h={14}
                                        pl={12}
                                        pr={12}
                                        borderRadius="2xl"
                                        _focus={{ borderColor: "purple.400" }}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <Icon as={Lock} position="absolute" left={4} top="50%" transform="translateY(-50%)" color="gray.500" />
                                    <IconButton
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        variant="ghost"
                                        size="sm"
                                        position="absolute"
                                        right={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        onClick={() => setShowPassword(!showPassword)}
                                        color="gray.500"
                                        _hover={{ color: "purple.400" }}
                                    >
                                        <Icon as={showPassword ? EyeOff : Eye} />
                                    </IconButton>
                                </Flex>
                            </Box>

                            <Flex gap={4} mt={4}>
                                <Button
                                    flex={1}
                                    variant="ghost"
                                    h={12}
                                    borderRadius="xl"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    flex={1}
                                    bg="linear-gradient(135deg, #a78bfa 0%, #2dd4bf 100%)"
                                    color="white"
                                    h={12}
                                    borderRadius="xl"
                                    onClick={handleAssignAdmin}
                                    loading={isAssigning}
                                >
                                    Confirm Assignment
                                </Button>
                            </Flex>
                        </VStack>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default DepartmentManager;
