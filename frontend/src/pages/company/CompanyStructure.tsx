import React, { useState, useEffect } from 'react';
import {
    Box, Heading, Text, Flex, Button, Card, Grid,
    VStack, HStack, Input, Textarea, Spinner, Badge
} from '@chakra-ui/react';
import { LuPlus, LuTrash2, LuUsers, LuBuilding2, LuX } from 'react-icons/lu';
import { toaster } from '../../components/ui/toaster';
import apiClient from '../../services/apiClient';

interface Department {
    id: string;
    name: string;
    description: string;
}

interface Supervisor {
    id: string;
    name: string;
    email: string;
    phone: string;
    department_id: string;
    department_name?: string;
}

// Custom IconButton for consistency
const IconButton: React.FC<any> = ({ children, ...props }) => (
    <Button variant="ghost" p={0} minW="40px" h="40px" {...props}>
        {children}
    </Button>
);

const CompanyStructure: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDeptOpen, setIsDeptOpen] = useState(false);
    const [isSupOpen, setIsSupOpen] = useState(false);

    const [newDept, setNewDept] = useState({ name: '', description: '' });
    const [newSup, setNewSup] = useState({ name: '', email: '', phone: '', department_id: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, supRes] = await Promise.all([
                apiClient.get('/company/departments'),
                apiClient.get('/company/supervisors')
            ]);
            setDepartments(deptRes.data.data);
            setSupervisors(supRes.data.data);
        } catch (error) {
            toaster.create({ title: 'Error loading structure data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateDept = async () => {
        try {
            await apiClient.post('/company/departments', newDept);
            toaster.create({ title: 'Department created!', type: 'success' });
            setNewDept({ name: '', description: '' });
            setIsDeptOpen(false);
            fetchData();
        } catch (error) {
            toaster.create({ title: 'Failed to create department', type: 'error' });
        }
    };

    const handleDeleteDept = async (id: string) => {
        try {
            await apiClient.delete(`/company/departments/${id}`);
            toaster.create({ title: 'Department deleted', type: 'success' });
            fetchData();
        } catch (error) {
            toaster.create({ title: 'Failed to delete', type: 'error' });
        }
    };

    const handleCreateSup = async () => {
        try {
            await apiClient.post('/company/supervisors', newSup);
            toaster.create({ title: 'Supervisor assigned!', type: 'success' });
            setNewSup({ name: '', email: '', phone: '', department_id: '' });
            setIsSupOpen(false);
            fetchData();
        } catch (error) {
            toaster.create({ title: 'Failed to assign supervisor', type: 'error' });
        }
    };

    const handleDeleteSup = async (id: string) => {
        try {
            await apiClient.delete(`/company/supervisors/${id}`);
            toaster.create({ title: 'Supervisor removed', type: 'success' });
            fetchData();
        } catch (error) {
            toaster.create({ title: 'Failed to remove supervisor', type: 'error' });
        }
    };

    if (loading) return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" /></Flex>;

    return (
        <Box animation="fadeIn 0.5s ease-out">
            <Heading mb={2} color="white">Structure & Staff</Heading>
            <Text color="gray.400" mb={8}>Manage your company departments and field supervisors.</Text>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
                {/* Departments */}
                <Card.Root className="glass-panel" bg="whiteAlpha.50" borderColor="whiteAlpha.100">
                    <Card.Body>
                        <Flex justify="space-between" align="center" mb={6}>
                            <HStack>
                                <LuBuilding2 size={24} color="#3182CE" />
                                <Heading size="md" color="white">Departments</Heading>
                            </HStack>
                            <Button size="sm" colorPalette="blue" onClick={() => setIsDeptOpen(true)}>
                                <LuPlus /> Add Dept
                            </Button>
                        </Flex>

                        <VStack align="stretch" gap={4}>
                            {departments.length === 0 ? (
                                <Text color="gray.500">No departments added yet.</Text>
                            ) : departments.map(dept => (
                                <Box key={dept.id} p={4} bg="whiteAlpha.100" borderRadius="md">
                                    <Flex justify="space-between" align="center">
                                        <Box>
                                            <Text fontWeight="bold" color="white">{dept.name}</Text>
                                            <Text fontSize="sm" color="gray.400">{dept.description}</Text>
                                        </Box>
                                        <IconButton aria-label="Delete" color="red.400" onClick={() => handleDeleteDept(dept.id)}>
                                            <LuTrash2 />
                                        </IconButton>
                                    </Flex>
                                </Box>
                            ))}
                        </VStack>
                    </Card.Body>
                </Card.Root>

                {/* Supervisors */}
                <Card.Root className="glass-panel" bg="whiteAlpha.50" borderColor="whiteAlpha.100">
                    <Card.Body>
                        <Flex justify="space-between" align="center" mb={6}>
                            <HStack>
                                <LuUsers size={24} color="#805AD5" />
                                <Heading size="md" color="white">Supervisors</Heading>
                            </HStack>
                            <Button size="sm" colorPalette="purple" onClick={() => setIsSupOpen(true)}>
                                <LuPlus /> Add Supervisor
                            </Button>
                        </Flex>

                        <VStack align="stretch" gap={4}>
                            {supervisors.length === 0 ? (
                                <Text color="gray.500">No supervisors assigned yet.</Text>
                            ) : supervisors.map(sup => (
                                <Box key={sup.id} p={4} bg="whiteAlpha.100" borderRadius="md">
                                    <Flex justify="space-between" align="center">
                                        <Box>
                                            <Text fontWeight="bold" color="white">{sup.name}</Text>
                                            <Text fontSize="sm" color="gray.400">{sup.email} • {sup.phone}</Text>
                                            {sup.department_name && <Badge mt={2} colorPalette="blue">{sup.department_name}</Badge>}
                                        </Box>
                                        <IconButton aria-label="Delete" color="red.400" onClick={() => handleDeleteSup(sup.id)}>
                                            <LuTrash2 />
                                        </IconButton>
                                    </Flex>
                                </Box>
                            ))}
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </Grid>

            {/* Department Modal */}
            {isDeptOpen && (
                <Box position="fixed" top={0} left={0} w="full" h="full" bg="blackAlpha.800" display="flex" justifyContent="center" alignItems="center" zIndex={2000} backdropFilter="blur(10px)" p={4}>
                    <Box bg="gray.900" p={8} borderRadius="3xl" w={{ base: "full", md: "450px" }} border="1px solid" borderColor="whiteAlpha.200" position="relative">
                        <IconButton aria-label="Close" color="whiteAlpha.600" position="absolute" top={4} right={4} onClick={() => setIsDeptOpen(false)} rounded="full">
                            <LuX />
                        </IconButton>
                        <Heading size="md" mb={6} color="white">Add Department</Heading>
                        <VStack gap={4} align="stretch">
                            <Box>
                                <Text mb={2} color="gray.300">Department Name</Text>
                                <Input placeholder="e.g. IT Department" color="white" value={newDept.name} onChange={(e: any) => setNewDept({ ...newDept, name: e.target.value })} />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Description</Text>
                                <Textarea placeholder="Brief description..." color="white" value={newDept.description} onChange={(e: any) => setNewDept({ ...newDept, description: e.target.value })} />
                            </Box>
                            <Button w="100%" colorPalette="blue" onClick={handleCreateDept} mt={4}>Save Department</Button>
                        </VStack>
                    </Box>
                </Box>
            )}

            {/* Supervisor Modal */}
            {isSupOpen && (
                <Box position="fixed" top={0} left={0} w="full" h="full" bg="blackAlpha.800" display="flex" justifyContent="center" alignItems="center" zIndex={2000} backdropFilter="blur(10px)" p={4}>
                    <Box bg="gray.900" p={8} borderRadius="3xl" w={{ base: "full", md: "450px" }} border="1px solid" borderColor="whiteAlpha.200" position="relative">
                        <IconButton aria-label="Close" color="whiteAlpha.600" position="absolute" top={4} right={4} onClick={() => setIsSupOpen(false)} rounded="full">
                            <LuX />
                        </IconButton>
                        <Heading size="md" mb={6} color="white">Add Supervisor</Heading>
                        <VStack gap={4} align="stretch">
                            <Box>
                                <Text mb={2} color="gray.300">Name</Text>
                                <Input placeholder="e.g. Jane Doe" color="white" value={newSup.name} onChange={(e: any) => setNewSup({ ...newSup, name: e.target.value })} />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Email</Text>
                                <Input type="email" placeholder="jane.doe@company.com" color="white" value={newSup.email} onChange={(e: any) => setNewSup({ ...newSup, email: e.target.value })} />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Phone</Text>
                                <Input placeholder="+254 700 000000" color="white" value={newSup.phone} onChange={(e: any) => setNewSup({ ...newSup, phone: e.target.value })} />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Assign to Department (Optional)</Text>
                                <select
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: 'transparent', border: '1px solid #4A5568', color: 'white' }}
                                    value={newSup.department_id}
                                    onChange={(e: any) => setNewSup({ ...newSup, department_id: e.target.value })}
                                >
                                    <option value="" style={{ color: 'black' }}>-- Select Dept --</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id} style={{ color: 'black' }}>{d.name}</option>
                                    ))}
                                </select>
                            </Box>
                            <Button w="100%" colorPalette="purple" onClick={handleCreateSup} mt={4}>Save Supervisor</Button>
                        </VStack>
                    </Box>
                </Box>
            )}

        </Box>
    );
};

export default CompanyStructure;
