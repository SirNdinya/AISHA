import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, Text, Table, Badge, Spinner,
    Heading, Icon, Flex, IconButton
} from '@chakra-ui/react';
import { LuSettings, LuRefreshCw } from 'react-icons/lu';
import { Switch } from '../../../components/ui/switch';
import apiClient from '../../../services/apiClient';
import { toaster } from '../../../components/ui/toaster';

interface Setting {
    key: string;
    value: string;
    description: string;
    updated_at: string;
}

const SystemSettings: React.FC = () => {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState<string | null>(null);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/admin/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toaster.create({ title: "Failed to load settings", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleToggle = async (key: string, currentValue: string) => {
        setUpdatingKey(key);
        const newValue = currentValue === 'true' ? 'false' : 'true';
        try {
            await apiClient.patch('/admin/settings', { key, value: newValue });
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
            toaster.create({ title: `Setting ${key} updated`, type: "success" });
        } catch (error) {
            toaster.create({ title: "Failed to update setting", type: "error" });
        } finally {
            setUpdatingKey(null);
        }
    };

    if (isLoading) {
        return <Flex justify="center" py={12}><Spinner color="purple.400" /></Flex>;
    }

    return (
        <VStack align="stretch" gap={6}>
            <Box className="glass-panel" p={6} borderRadius="xl">
                <Flex justify="space-between" align="center" mb={6}>
                    <HStack gap={3}>
                        <Icon as={LuSettings} boxSize={5} color="purple.400" />
                        <Heading size="md">Core Infrastructure Controls</Heading>
                    </HStack>
                    <IconButton
                        aria-label="Refresh Settings"
                        variant="ghost"
                        onClick={fetchSettings}
                        size="sm"
                    >
                        <LuRefreshCw />
                    </IconButton>
                </Flex>

                <Table.Root variant="line">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Setting Configuration</Table.ColumnHeader>
                            <Table.ColumnHeader>Description</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">State</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {settings.map(setting => (
                            <Table.Row key={setting.key} _hover={{ bg: 'whiteAlpha.50' }}>
                                <Table.Cell py={4}>
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="bold" fontSize="sm" color="purple.300">
                                            {setting.key.replace(/_/g, ' ')}
                                        </Text>
                                        <Text fontSize="10px" color="gray.500">
                                            Last Modified: {new Date(setting.updated_at).toLocaleString()}
                                        </Text>
                                    </VStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="xs" color="gray.400">{setting.description}</Text>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <HStack justify="flex-end" gap={4}>
                                        <Badge
                                            colorPalette={setting.value === 'true' ? 'green' : 'red'}
                                            variant="outline"
                                            fontSize="10px"
                                        >
                                            {setting.value === 'true' ? 'ACTIVE' : 'DISABLED'}
                                        </Badge>
                                        <Switch
                                            colorPalette="purple"
                                            checked={setting.value === 'true'}
                                            onCheckedChange={() => handleToggle(setting.key, setting.value)}
                                            disabled={updatingKey === setting.key}
                                        />
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>

            <Box bg="orange.900/20" p={4} borderRadius="lg" border="1px solid" borderColor="orange.500/30">
                <HStack gap={3}>
                    <Box color="orange.400" as="span">⚠️</Box>
                    <Text fontSize="xs" color="orange.200">
                        <b>Critical Warning:</b> Changing global infrastructure modes (like Maintenance Mode) will affect all concurrent user sessions immediately across all portals.
                    </Text>
                </HStack>
            </Box>
        </VStack>
    );
};

export default SystemSettings;
