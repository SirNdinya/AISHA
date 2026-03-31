import React, { useEffect, useState } from 'react';
import {
    Box, Table, Badge, Button, Flex, Spinner, Text,
    Heading, HStack, For
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toaster } from '../../../components/ui/toaster';
import { LuBuilding2, LuCircleCheck, LuMailCheck, LuMailX, LuShieldX } from 'react-icons/lu';

const MotionBox = motion.create(Box);

interface Institution {
    id: string;
    name: string;
    code: string;
    email: string;
    email_verified: boolean;
    is_admin_verified: boolean;
    created_at: string;
}

type FilterType = 'all' | 'true' | 'false';

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Fully Verified', value: 'true' },
    { label: 'Pending', value: 'false' },
];

const InstitutionsManager: React.FC = () => {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');

    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    const fetchInstitutions = async (f: FilterType) => {
        setLoading(true);
        try {
            const params = f === 'all' ? {} : { verified: f };
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/admin/institutions`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setInstitutions(res.data.data);
        } catch (err: any) {
            toaster.create({ title: 'Failed to load institutions', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions(filter);
    }, [filter]);

    const handleVerify = async (inst: Institution) => {
        if (!inst.email_verified) {
            toaster.create({
                title: 'Cannot Verify Yet',
                description: 'The institution must verify their email address first.',
                type: 'warning'
            });
            return;
        }
        setVerifying(inst.id);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API}/admin/institutions/${inst.id}/verify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toaster.create({ title: `${inst.name} verified!`, type: 'success' });
            fetchInstitutions(filter);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Verification failed.';
            toaster.create({ title: 'Error', description: msg, type: 'error' });
        } finally {
            setVerifying(null);
        }
    };

    const getStatusBadge = (inst: Institution) => {
        if (inst.is_admin_verified && inst.email_verified) {
            return <Badge colorPalette="green" gap={1}><LuCircleCheck /> Verified</Badge>;
        }
        if (!inst.email_verified) {
            return <Badge colorPalette="red" gap={1}><LuMailX /> Email Pending</Badge>;
        }
        return <Badge colorPalette="orange" gap={1}><LuShieldX /> Admin Pending</Badge>;
    };

    return (
        <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Flex align="center" gap={3} mb={5}>
                <LuBuilding2 size={22} />
                <Heading size="md">Registered Institutions</Heading>
            </Flex>

            {/* Filter Buttons */}
            <HStack mb={5} gap={2}>
                <For each={FILTER_OPTIONS}>
                    {(opt) => (
                        <Button
                            key={opt.value}
                            size="sm"
                            variant={filter === opt.value ? 'solid' : 'ghost'}
                            colorPalette={filter === opt.value ? 'purple' : 'gray'}
                            onClick={() => setFilter(opt.value)}
                        >
                            {opt.label}
                        </Button>
                    )}
                </For>
            </HStack>

            <Box className="glass-panel" borderRadius="xl" overflowX="auto" p={4}>
                {loading ? (
                    <Flex justify="center" py={10}><Spinner color="cyan.400" /></Flex>
                ) : institutions.length === 0 ? (
                    <Text textAlign="center" py={10} color="gray.500">
                        No institutions found for the selected filter.
                    </Text>
                ) : (
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Institution</Table.ColumnHeader>
                                <Table.ColumnHeader>Code</Table.ColumnHeader>
                                <Table.ColumnHeader>Email</Table.ColumnHeader>
                                <Table.ColumnHeader>Email</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader>Registered</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">Action</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {institutions.map(inst => (
                                <Table.Row key={inst.id}>
                                    <Table.Cell fontWeight="bold">{inst.name}</Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="outline" colorPalette="blue">{inst.code}</Badge>
                                    </Table.Cell>
                                    <Table.Cell fontSize="sm" color="gray.400">{inst.email}</Table.Cell>
                                    <Table.Cell>
                                        {inst.email_verified
                                            ? <Badge colorPalette="green" gap={1}><LuMailCheck /> Verified</Badge>
                                            : <Badge colorPalette="red" gap={1}><LuMailX /> Unverified</Badge>}
                                    </Table.Cell>
                                    <Table.Cell>{getStatusBadge(inst)}</Table.Cell>
                                    <Table.Cell fontSize="sm" color="gray.500">
                                        {new Date(inst.created_at).toLocaleDateString()}
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">
                                        {!inst.is_admin_verified ? (
                                            <Button
                                                size="sm"
                                                colorPalette={inst.email_verified ? 'green' : 'gray'}
                                                disabled={!inst.email_verified || verifying === inst.id}
                                                loading={verifying === inst.id}
                                                onClick={() => handleVerify(inst)}
                                                title={!inst.email_verified ? 'Institution must verify email first' : 'Approve this institution'}
                                            >
                                                {inst.email_verified ? 'Approve' : 'Awaiting Email'}
                                            </Button>
                                        ) : (
                                            <Badge colorPalette="green" size="lg">Approved</Badge>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </MotionBox>
    );
};

export default InstitutionsManager;
