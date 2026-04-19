import React, { useEffect } from 'react';
import { Box, Heading, Text, Table, Button, Badge, Flex, Spinner, Tabs } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnverifiedUsers, verifyUser } from '../../store/adminSlice';
import type { AppDispatch, RootState } from '../../store';
import { Toaster, toaster } from '../../components/ui/toaster';
import BroadcastManager from './components/BroadcastManager';
import SystemSettings from './components/SystemSettings';
import InstitutionsManager from './components/InstitutionsManager';
import { LuShieldCheck, LuMegaphone, LuSettings, LuBuilding2 } from 'react-icons/lu';

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
        <Box minH="100vh" p={{ base: 4, md: 8 }}>
            <Toaster />
            <Heading mb={2} color="#F8FAFC" size={{ base: "xl", md: "2xl" }}>Admin Portal</Heading>
            <Text color="var(--terminal-accent)" mb={8} fontSize={{ base: "sm", md: "md" }}>System Oversight & Verification</Text>

            <Tabs.Root defaultValue="verification" variant="enclosed" colorPalette="brand">
                <Tabs.List
                    bg="rgba(255, 255, 255, 0.05)"
                    p={1}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="var(--terminal-border)"
                    mb={6}
                    overflowX="auto"
                    whiteSpace="nowrap"
                    css={{
                        "&::-webkit-scrollbar": { display: "none" },
                        "scrollbarWidth": "none"
                    }}
                >
                    <Tabs.Trigger value="verification" gap={2}>
                        <LuShieldCheck size={18} />
                        Verification
                        <Badge variant="solid" colorPalette="brand" size="xs" borderRadius="full">
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
                    <Tabs.Trigger value="institutions" gap={2}>
                        <LuBuilding2 size={18} />
                        Institutions
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="verification">
                    <MotionBox
                        bg="var(--terminal-card)"
                        border="1px solid"
                        borderColor="var(--terminal-border)"
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
                                    <Table.ColumnHeader display={{ base: "none", md: "table-cell" }}>Role</Table.ColumnHeader>
                                    <Table.ColumnHeader display={{ base: "none", lg: "table-cell" }}>Registered</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="right">Action</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {users.map(user => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell fontWeight="bold" fontSize="sm">{user.email}</Table.Cell>
                                        <Table.Cell display={{ base: "none", md: "table-cell" }}>
                                            <Badge colorPalette="brand">{user.role}</Badge>
                                        </Table.Cell>
                                        <Table.Cell display={{ base: "none", lg: "table-cell" }}>{new Date(user.created_at).toLocaleDateString()}</Table.Cell>
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
                            <Text textAlign="center" py={8} color="slate.500">No pending verifications.</Text>
                        )}
                        {isLoading && <Flex justify="center" py={8}><Spinner color="var(--terminal-accent)" /></Flex>}
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
