import React, { useEffect } from 'react';
import { Box, Heading, Text, Table, Button, Badge, Flex, Spinner, Tabs } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnverifiedUsers, verifyUser } from '../../store/adminSlice';
import type { AppDispatch, RootState } from '../../store';
import { Toaster, toaster } from '../../components/ui/toaster';
import BroadcastManager from './components/BroadcastManager';
import SystemSettings from './components/SystemSettings';
import CommandCentre from './components/CommandCentre';
import InstitutionsManager from './components/InstitutionsManager';
import { LuShieldCheck, LuMegaphone, LuSettings, LuTerminal, LuBuilding2 } from 'react-icons/lu';

const MotionBox = motion.create(Box);

const AdminDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { users, isLoading } = useSelector((state: RootState) => state.admin);

    useEffect(() => {
        dispatch(fetchUnverifiedUsers());
    }, [dispatch]);

    const handleVerify = async (id: string) => {
        await dispatch(verifyUser(id));
        toaster.create({ title: "User Verified", type: "success" });
    };

    return (
        <Box className="glass-background" minH="100vh" p={8}>
            <Toaster />
            <Heading mb={2}>Admin Portal</Heading>
            <Text color="gray.400" mb={8}>System Oversight & Verification</Text>

            <Tabs.Root defaultValue="verification" variant="enclosed" colorPalette="purple">
                <Tabs.List bg="whiteAlpha.50" p={1} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100" mb={6}>
                    <Tabs.Trigger value="verification" gap={2}>
                        <LuShieldCheck size={18} />
                        Verification
                        <Badge variant="solid" colorPalette="purple" size="xs" borderRadius="full">
                            {users.length}
                        </Badge>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="broadcast" gap={2}>
                        <LuMegaphone size={18} />
                        Broadcasts
                    </Tabs.Trigger>
                    <Tabs.Trigger value="settings" gap={2}>
                        <LuSettings size={18} />
                        Settings
                    </Tabs.Trigger>
                    <Tabs.Trigger value="command" gap={2}>
                        <LuTerminal size={18} />
                        Command Centre
                    </Tabs.Trigger>
                    <Tabs.Trigger value="institutions" gap={2}>
                        <LuBuilding2 size={18} />
                        Institutions
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="verification">
                    <MotionBox
                        className="glass-panel"
                        borderRadius="xl"
                        shadow="sm"
                        overflowX="auto" p={4}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Email</Table.ColumnHeader>
                                    <Table.ColumnHeader>Role</Table.ColumnHeader>
                                    <Table.ColumnHeader>Registered</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="right">Action</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {users.map(user => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell fontWeight="bold">{user.email}</Table.Cell>
                                        <Table.Cell>
                                            <Badge colorPalette="purple">{user.role}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>{new Date(user.created_at).toLocaleDateString()}</Table.Cell>
                                        <Table.Cell textAlign="right">
                                            <Button size="sm" colorPalette="green" onClick={() => handleVerify(user.id)}>
                                                Verify
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                        {users.length === 0 && !isLoading && (
                            <Text textAlign="center" py={8} color="gray.500">No pending verifications.</Text>
                        )}
                        {isLoading && <Flex justify="center" py={8}><Spinner color="cyan.400" /></Flex>}
                    </MotionBox>
                </Tabs.Content>

                <Tabs.Content value="broadcast">
                    <MotionBox
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <BroadcastManager />
                    </MotionBox>
                </Tabs.Content>

                <Tabs.Content value="settings">
                    <MotionBox
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SystemSettings />
                    </MotionBox>
                </Tabs.Content>

                <Tabs.Content value="command">
                    <MotionBox
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CommandCentre />
                    </MotionBox>
                </Tabs.Content>

                <Tabs.Content value="institutions">
                    <MotionBox
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <InstitutionsManager />
                    </MotionBox>
                </Tabs.Content>
            </Tabs.Root>
        </Box>
    );
};

export default AdminDashboard;
