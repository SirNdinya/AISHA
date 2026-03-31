import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, Text, Input, Button,
    Table, Badge, IconButton, Spinner
} from '@chakra-ui/react';
import { LuPlus, LuPower, LuPowerOff, LuMegaphone } from 'react-icons/lu';
import apiClient from '../../../services/apiClient';
import { toaster } from '../../../components/ui/toaster';

interface Broadcast {
    id: string;
    type: 'MAINTENANCE' | 'UPDATE' | 'GENERAL';
    target_system: 'ALL' | 'STUDENT' | 'COMPANY' | 'INSTITUTION';
    message: string;
    is_active: boolean;
    created_at: string;
}

const BroadcastManager: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [newMessage, setNewMessage] = useState('');
    const [newType, setNewType] = useState('GENERAL');
    const [newTarget, setNewTarget] = useState('ALL');

    const fetchBroadcasts = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/admin/broadcasts');
            setBroadcasts(res.data.data);
        } catch (error) {
            console.error('Failed to fetch broadcasts', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const handleCreate = async () => {
        if (!newMessage.trim()) return;
        setIsSaving(true);
        try {
            await apiClient.post('/admin/broadcasts', {
                type: newType,
                target_system: newTarget,
                message: newMessage
            });
            setNewMessage('');
            fetchBroadcasts();
            toaster.create({ title: "Broadcast Created", type: "success" });
        } catch (error) {
            toaster.create({ title: "Failed to create broadcast", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await apiClient.patch(`/admin/broadcasts/${id}/toggle`, {
                is_active: !currentStatus
            });
            fetchBroadcasts();
        } catch (error) {
            toaster.create({ title: "Failed to toggle broadcast", type: "error" });
        }
    };

    return (
        <VStack align="stretch" gap={8}>
            {/* Create Section */}
            <Box className="glass-panel" p={6} borderRadius="xl">
                <HStack gap={4} mb={4}>
                    <LuMegaphone size={20} color="#a78bfa" />
                    <Text fontWeight="bold" fontSize="lg">Create New Broadcast</Text>
                </HStack>
                <VStack align="stretch" gap={4}>
                    <Input
                        placeholder="Enter broadcast message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        bg="whiteAlpha.50"
                        borderColor="whiteAlpha.200"
                        _focus={{ borderColor: 'purple.400' }}
                    />
                    <HStack gap={4} w="full">
                        <Box flex={1}>
                            <Text fontSize="xs" color="gray.500" mb={1}>BROADCAST TYPE</Text>
                            <select
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    padding: '0 12px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                            >
                                <option value="GENERAL" style={{ backgroundColor: '#1a202c' }}>General Announcement</option>
                                <option value="MAINTENANCE" style={{ backgroundColor: '#1a202c' }}>System Maintenance</option>
                                <option value="UPDATE" style={{ backgroundColor: '#1a202c' }}>Version Update</option>
                            </select>
                        </Box>

                        <Box flex={1}>
                            <Text fontSize="xs" color="gray.500" mb={1}>TARGET SYSTEM</Text>
                            <select
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    padding: '0 12px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                                value={newTarget}
                                onChange={(e) => setNewTarget(e.target.value)}
                            >
                                <option value="ALL" style={{ backgroundColor: '#1a202c' }}>All Systems</option>
                                <option value="STUDENT" style={{ backgroundColor: '#1a202c' }}>Student Portal</option>
                                <option value="COMPANY" style={{ backgroundColor: '#1a202c' }}>Company Portal</option>
                                <option value="INSTITUTION" style={{ backgroundColor: '#1a202c' }}>Institution Portal</option>
                            </select>
                        </Box>

                        <Button
                            colorPalette="purple"
                            px={8}
                            h="40px"
                            mt={5}
                            onClick={handleCreate}
                            loading={isSaving}
                            gap={2}
                        >
                            <LuPlus /> Broadcast
                        </Button>
                    </HStack>
                </VStack>
            </Box>

            {/* List Section */}
            <Box className="glass-panel" borderRadius="xl" overflow="hidden">
                <Table.Root>
                    <Table.Header bg="whiteAlpha.50">
                        <Table.Row>
                            <Table.ColumnHeader>Type</Table.ColumnHeader>
                            <Table.ColumnHeader>Target</Table.ColumnHeader>
                            <Table.ColumnHeader>Message</Table.ColumnHeader>
                            <Table.ColumnHeader>Status</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {isLoading ? (
                            <Table.Row>
                                <Table.Cell colSpan={5} textAlign="center" py={8}>
                                    <Spinner color="purple.400" />
                                </Table.Cell>
                            </Table.Row>
                        ) : broadcasts.map(b => (
                            <Table.Row key={b.id} _hover={{ bg: 'whiteAlpha.50' }}>
                                <Table.Cell>
                                    <Badge colorPalette={b.type === 'MAINTENANCE' ? 'orange' : b.type === 'UPDATE' ? 'blue' : 'gray'}>
                                        {b.type}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.400">{b.target_system}</Text>
                                </Table.Cell>
                                <Table.Cell maxW="400px">
                                    <Text truncate fontSize="sm">{b.message}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge colorPalette={b.is_active ? 'green' : 'red'} variant="outline">
                                        {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <IconButton
                                        aria-label="Toggle Status"
                                        size="sm"
                                        variant="ghost"
                                        color={b.is_active ? 'red.400' : 'green.400'}
                                        onClick={() => handleToggle(b.id, b.is_active)}
                                    >
                                        {b.is_active ? <LuPowerOff /> : <LuPower />}
                                    </IconButton>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
        </VStack>
    );
};

export default BroadcastManager;
