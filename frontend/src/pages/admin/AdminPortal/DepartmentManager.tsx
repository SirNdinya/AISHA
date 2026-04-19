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
    Separator,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogPositioner,
    DialogCloseTrigger,
    DialogBackdrop,
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
    total_institutional_students: number;
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
        return <Flex h="50vh" align="center" justify="center" bg="var(--terminal-bg)"><Spinner color="var(--terminal-accent)" /></Flex>;
    }

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4} mb={10}>
                <Box>
                    <Heading size={{ base: "lg", md: "xl" }} fontWeight="black" letterSpacing="tight" color="#F8FAFC">Departmental Infrastructure</Heading>
                    <Text color="var(--terminal-accent)" fontSize={{ base: "sm", md: "md" }} fontWeight="bold">Manage administrative authority for pre-existing institutional nodes</Text>
                </Box>
                <Button
                    bg="var(--terminal-accent)"
                    color="black"
                    borderRadius="xl"
                    px={6}
                    h={12}
                    w={{ base: "full", md: "auto" }}
                    _hover={{ opacity: 0.9, transform: "translateY(-2px)" }}
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
                        <Text fontWeight="bold">Provision Admin</Text>
                    </HStack>
                </Button>
            </Flex>

            {/* Top Highlights */}
            <SimpleGrid columns={[1, 2, 4]} gap={6} mb={10}>
                <Box className="glass-card" bg="var(--terminal-card)" border="1px solid" borderColor="var(--terminal-border)" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold" textTransform="uppercase">Total Depts</Text>
                        <Heading size="lg" color="#F8FAFC">{departments.length}</Heading>
                    </VStack>
                </Box>
                <Box className="glass-card" bg="var(--terminal-card)" border="1px solid" borderColor="var(--terminal-border)" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold" textTransform="uppercase">Managed Depts</Text>
                        <Heading size="lg" color="#F8FAFC">{departments.filter(d => d.user_id).length}</Heading>
                    </VStack>
                </Box>
                <Box className="glass-card" bg="var(--terminal-card)" border="1px solid" borderColor="var(--terminal-border)" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold" textTransform="uppercase">Provisioning Status</Text>
                        <Badge colorPalette={departments.every(d => d.user_id) ? "green" : "orange"} variant="subtle">
                            {departments.every(d => d.user_id) ? "FULLY MANAGED" : "PENDING ADMINS"}
                        </Badge>
                    </VStack>
                </Box>
                <Box className="glass-card" bg="var(--terminal-card)" border="1px solid" borderColor="var(--terminal-border)" p={6} borderRadius="24px">
                    <VStack align="start" gap={1}>
                        <Text color="var(--terminal-accent)" fontSize="xs" fontWeight="bold" textTransform="uppercase">Institutional Health</Text>
                        <HStack>
                            <Box w={2} h={2} bg="green.400" borderRadius="full" />
                            <Heading size="sm" color="#F8FAFC">Active</Heading>
                        </HStack>
                    </VStack>
                </Box>
            </SimpleGrid>

            {/* List Table */}
            <Box className="glass-card" bg="var(--terminal-card)" border="1px solid" borderColor="var(--terminal-border)" p={8} borderRadius="30px">
                <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4} mb={8}>
                    <HStack gap={4}>
                        <Heading size="md" color="#F8FAFC">Institutional Master List</Heading>
                        <Badge variant="subtle" colorPalette="cyan" px={3} borderRadius="full" bg="whiteAlpha.100" color="var(--terminal-accent)" display={{ base: "none", sm: "inline-flex" }}>
                            EXISTING RECORDS
                        </Badge>
                    </HStack>
                    <Box position="relative" w={{ base: "full", md: "300px" }}>
                        <Input
                            placeholder="Find department..."
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="var(--terminal-border)"
                            pl={10}
                            borderRadius="xl"
                            color="#F8FAFC"
                            _placeholder={{ color: "whiteAlpha.400" }}
                            _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon as={Search} position="absolute" left={3} top="50%" transform="translateY(-50%)" color="whiteAlpha.400" />
                    </Box>
                </Flex>

                <Table.Root variant="line" size="lg">
                    <Table.Header borderBottom="1px solid" borderColor="gray.100">
                        <Table.Row>
                            <Table.ColumnHeader color="var(--terminal-accent)">DEPARTMENT</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" display={{ base: "none", md: "table-cell" }}>STUDENT DATA</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" display={{ base: "none", lg: "table-cell" }}>ADMINISTRATIVE ACCOUNT</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" display={{ base: "none", sm: "table-cell" }}>PORTAL STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader color="var(--terminal-accent)" textAlign="right">ACTIONS</Table.ColumnHeader>
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
                                            <Box p={3} borderRadius="15px" bg="whiteAlpha.100">
                                                <Icon as={Building2} boxSize={5} color="var(--terminal-accent)" />
                                            </Box>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold" fontSize="md" color="#F8FAFC">{dept.name}</Text>
                                                <Text fontSize="xs" color="var(--terminal-accent)">{dept.code}</Text>
                                            </VStack>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell display={{ base: "none", md: "table-cell" }}>
                                        <VStack align="start" gap={1}>
                                            <Badge colorPalette="gray" variant="subtle">
                                                {dept.student_count} / {dept.total_institutional_students ?? '?'} Students
                                            </Badge>
                                            <Badge colorPalette="teal" variant="subtle" display={{ base: "none", lg: "inline-flex" }}>{dept.placed_count} Placed</Badge>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell display={{ base: "none", lg: "table-cell" }}>
                                        {dept.user_id ? (
                                            <VStack align="start" gap={1}>
                                                <HStack gap={2}>
                                                    <Icon as={Mail} boxSize={3} color="var(--terminal-accent)" />
                                                    <Text fontSize="xs" fontWeight="bold" color="whiteAlpha.900">{dept.admin_email}</Text>
                                                </HStack>
                                                <HStack gap={2}>
                                                    <Icon as={ShieldCheck} boxSize={3} color="teal.400" />
                                                    <Text fontSize="10px" color="var(--terminal-accent)">Verified System Admin</Text>
                                                </HStack>
                                            </VStack>
                                        ) : (
                                            <Text fontSize="xs" color="whiteAlpha.500" fontStyle="italic">No Admin Assigned</Text>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell display={{ base: "none", sm: "table-cell" }}>
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
                                                    display={{ base: "none", lg: "inline-flex" }}
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
                                                borderColor="var(--terminal-border)"
                                                color="#F8FAFC"
                                                _hover={{ bg: "var(--terminal-accent)", borderColor: "var(--terminal-accent)", color: "black" }}
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

            <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)} size="md">
                <DialogBackdrop backdropFilter="blur(12px)" bg="rgba(0,0,0,0.6)" />
                <DialogPositioner>
                    <DialogContent
                        bg="#020617"
                        color="white"
                        borderRadius="3xl"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        p={{ base: 4, md: 8 }}
                        mx={{ base: 4, md: 0 }}
                        boxShadow="0 25px 80px rgba(0,0,0,0.8)"
                    >
                        <DialogHeader>
                            <DialogTitle fontSize="2xl" fontWeight="black" color="#F8FAFC">
                                Authorize Administrator
                            </DialogTitle>
                            <Text color="var(--terminal-accent)" fontSize="sm" mt={2}>
                                Linking a new administrator to <b>{selectedDept?.name || 'a department'}</b>.
                            </Text>
                        </DialogHeader>

                        <DialogBody>
                            <VStack gap={6} align="stretch" mt={4}>
                                {isGlobalModal && (
                                    <Box>
                                        <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">SELECT DEPARTMENT</Text>
                                        <Box position="relative">
                                            <select
                                                style={{
                                                    width: '100%',
                                                    height: '56px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--terminal-border)',
                                                    borderRadius: '16px',
                                                    color: '#F8FAFC',
                                                    padding: '0 48px 0 16px',
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
                                                <option value="" disabled style={{ color: '#000' }}>Choose a department node...</option>
                                                {departments.map(d => (
                                                    <option 
                                                        key={d.id} 
                                                        value={d.id} 
                                                        style={{ color: d.user_id ? '#999' : '#000' }}
                                                        disabled={!!d.user_id}
                                                    >
                                                        {d.name} {d.user_id ? '(ADMIN ASSIGNED)' : '(AVAILABLE)'}
                                                    </option>
                                                ))}
                                            </select>
                                            <Icon as={Building2} position="absolute" right={4} top="50%" transform="translateY(-50%)" color="whiteAlpha.400" pointerEvents="none" />
                                        </Box>
                                    </Box>
                                )}

                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">ADMINISTRATOR EMAIL</Text>
                                    <Flex position="relative">
                                        <Input
                                            placeholder="admin@aisha.com"
                                            bg="rgba(255,255,255,0.05)"
                                            border="1px solid"
                                            borderColor="var(--terminal-border)"
                                            color="#F8FAFC"
                                            h={14}
                                            pl={12}
                                            borderRadius="2xl"
                                            _focus={{ borderColor: "purple.400" }}
                                            value={formData.email}
                                            readOnly
                                        />
                                        <Icon as={Mail} position="absolute" left={4} top="50%" transform="translateY(-50%)" color="whiteAlpha.400" />
                                    </Flex>
                                    <Text fontSize="10px" mt={2} color="whiteAlpha.500">System generated based on department code for security.</Text>
                                </Box>

                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">DEFAULT ACCESS KEY</Text>
                                    <Flex position="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            bg="rgba(255,255,255,0.05)"
                                            border="1px solid"
                                            borderColor="var(--terminal-border)"
                                            color="#F8FAFC"
                                            h={14}
                                            pl={12}
                                            pr={12}
                                            borderRadius="2xl"
                                            _focus={{ borderColor: "var(--terminal-accent)" }}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <Icon as={Lock} position="absolute" left={4} top="50%" transform="translateY(-50%)" color="whiteAlpha.400" />
                                        <IconButton
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            variant="ghost"
                                            size="sm"
                                            position="absolute"
                                            right={2}
                                            top="50%"
                                            transform="translateY(-50%)"
                                            onClick={() => setShowPassword(!showPassword)}
                                            color="whiteAlpha.400"
                                            _hover={{ color: "var(--terminal-accent)" }}
                                        >
                                            <Icon as={showPassword ? EyeOff : Eye} />
                                        </IconButton>
                                    </Flex>
                                </Box>
                            </VStack>
                        </DialogBody>

                        <DialogFooter gap={4} mt={6}>
                            <Button
                                flex={1}
                                variant="ghost"
                                h={12}
                                borderRadius="xl"
                                color="whiteAlpha.600"
                                _hover={{ bg: "whiteAlpha.100" }}
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                flex={1}
                                bg="var(--terminal-accent)"
                                color="black"
                                h={12}
                                borderRadius="xl"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleAssignAdmin}
                                loading={isAssigning}
                            >
                                Confirm Assignment
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger asChild>
                            <IconButton
                                variant="ghost"
                                size="sm"
                                position="absolute"
                                top={4}
                                right={4}
                                color="whiteAlpha.400"
                                _hover={{ color: "white" }}
                                onClick={() => setIsModalOpen(false)}
                            >
                                < LuX />
                            </IconButton>
                        </DialogCloseTrigger>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>
        </Box>
    );
};

export default DepartmentManager;
