import React, { useEffect } from 'react';
import {
    Box, VStack, Text, Heading, Container,
    Button, HStack, Badge,
    Flex, Spinner
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationsRead } from '../../store/notificationSlice';
import type { AppDispatch, RootState } from '../../store';
import {
    LuCheck, LuBell, LuClock,
    LuCircleCheck, LuTriangleAlert, LuCircleX, LuInfo
} from "react-icons/lu";

const NotificationPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { notifications, isLoading } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleMarkAllRead = () => {
        dispatch(markNotificationsRead('all'));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <LuCircleCheck size={20} color="#10b981" />;
            case 'WARNING': return <LuTriangleAlert size={20} color="#f59e0b" />;
            case 'ERROR': return <LuCircleX size={20} color="#ef4444" />;
            default: return <LuInfo size={20} color="#3b82f6" />;
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box minH="100vh" bg="#0F172A" pt={20}>
            <Container maxW="container.lg" py={8}>
                <Box
                    bg="rgba(13, 17, 23, 0.4)"
                    backdropFilter="blur(10px)"
                    borderRadius="2xl"
                    border="1px solid rgba(255,255,255,0.05)"
                    p={6}
                >
                    <HStack justify="space-between" mb={8}>
                        <VStack align="start" gap={1}>
                            <Heading size="lg" color="white">Your Notifications</Heading>
                            <Text color="gray.400" fontSize="sm">Stay updated with system activities and alerts.</Text>
                        </VStack>
                        <Button
                            colorPalette="purple"
                            variant="outline"
                            onClick={handleMarkAllRead}
                            disabled={notifications.length === 0}
                        >
                            <LuCheck /> Mark All as Read
                        </Button>
                    </HStack>

                    {isLoading && notifications.length === 0 ? (
                        <Flex justify="center" py={20}>
                            <Spinner color="purple.500" size="xl" />
                        </Flex>
                    ) : notifications.length === 0 ? (
                        <VStack py={20} gap={4}>
                            <LuBell size={64} opacity={0.1} color="white" />
                            <Text color="gray.500" fontSize="lg">No notifications yet.</Text>
                            <Button variant="ghost" colorPalette="gray" onClick={() => dispatch(fetchNotifications())}>
                                Refresh
                            </Button>
                        </VStack>
                    ) : (
                        <VStack align="stretch" gap={4}>
                            {notifications.map((n) => (
                                <Box
                                    key={n.id}
                                    p={5}
                                    bg={n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(167, 139, 250, 0.08)'}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor={n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(167, 139, 250, 0.2)'}
                                    _hover={{ bg: 'rgba(255,255,255,0.05)', borderColor: 'purple.500' }}
                                    cursor="pointer"
                                    onClick={() => !n.is_read && dispatch(markNotificationsRead(n.id))}
                                    transition="all 0.2s"
                                    position="relative"
                                >
                                    <HStack gap={4} align="start">
                                        <Box mt={1} p={2} bg="rgba(255,255,255,0.05)" borderRadius="lg">
                                            {getIcon(n.type)}
                                        </Box>
                                        <Box flex={1}>
                                            <HStack justify="space-between">
                                                <Text fontWeight="bold" fontSize="md" color="white">{n.title}</Text>
                                                {!n.is_read && <Badge colorPalette="purple" variant="solid">New</Badge>}
                                            </HStack>
                                            <Text mt={2} color="gray.300" fontSize="sm" lineHeight="tall">
                                                {n.message}
                                            </Text>
                                            <HStack mt={4} gap={4}>
                                                <HStack gap={1} color="gray.500" fontSize="xs">
                                                    <LuClock size={12} />
                                                    <Text>{formatDate(n.created_at)}</Text>
                                                </HStack>
                                            </HStack>
                                        </Box>
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default NotificationPage;
