import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, Flex, IconButton, Spinner, HStack, Heading } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationsRead } from '../../store/notificationSlice';
import type { AppDispatch, RootState } from '../../store';
import { LuBell, LuBellRing, LuCheck, LuInfo, LuCircleCheck, LuTriangleAlert, LuCircleX, LuZap, LuX } from "react-icons/lu";
import { useSocket } from '../../context/SocketContext';
import { type Notification as AppNotification } from '../../services/notificationService';
import MpesaPaymentModal from './MpesaPaymentModal';

const NotificationCenter: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { notifications, unreadCount, isLoading: loading } = useSelector((state: RootState) => state.notifications);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ open: boolean, amount: number, opportunityId: string }>({
        open: false,
        amount: 0,
        opportunityId: ''
    });

    const { socket } = useSocket();

    useEffect(() => {
        dispatch(fetchNotifications());
        const interval = setInterval(() => dispatch(fetchNotifications()), 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    // Handle real-time updates via Socket.io
    useEffect(() => {
        if (!socket) return;

        const handleNotification = () => {
            dispatch(fetchNotifications());
        };

        socket.on('notification', handleNotification);
        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, dispatch]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(markNotificationsRead('all'));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <LuCircleCheck color="#10b981" />;
            case 'WARNING': return <LuTriangleAlert color="#f59e0b" />;
            case 'ERROR': return <LuCircleX color="#ef4444" />;
            default: return <LuInfo color="#3b82f6" />;
        }
    };

    return (
        <Box position="relative">
            <IconButton
                aria-label="Notifications"
                variant="ghost"
                onClick={toggleOpen}
                position="relative"
                borderRadius="full"
                _hover={{ bg: "whiteAlpha.200" }}
            >
                {unreadCount > 0 ? <LuBellRing size={20} color="#f87171" /> : <LuBell size={20} />}
                {unreadCount > 0 && (
                    <Box
                        position="absolute"
                        top="-2px"
                        right="-2px"
                        bg="red.500"
                        color="white"
                        borderRadius="full"
                        minW="18px"
                        h="18px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="10px"
                        fontWeight="bold"
                        boxShadow="0 0 10px rgba(244, 63, 94, 0.6)"
                        zIndex={2}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Box>
                )}
            </IconButton>

            {isOpen && (
                <Box
                    position="absolute"
                    top="120%"
                    right={0}
                    w="350px"
                    maxH="500px"
                    bg="rgba(13, 17, 23, 0.85)"
                    backdropFilter="blur(16px) saturate(180%)"
                    border="1px solid rgba(255, 255, 255, 0.125)"
                    shadow="2xl"
                    borderRadius="2xl"
                    zIndex={2000}
                    overflow="hidden"
                    animation="fade-in 0.2s ease-out"
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        p={4}
                        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                        bg="rgba(255, 255, 255, 0.05)"
                    >
                        <Text fontWeight="bold" fontSize="md" color="white">Notifications</Text>
                        <Button
                            size="xs"
                            variant="ghost"
                            onClick={handleMarkAllRead}
                            fontSize="xs"
                            color="purple.300"
                            _hover={{ bg: "whiteAlpha.100" }}
                        >
                            <LuCheck /> Mark all read
                        </Button>
                    </Flex>

                    <VStack align="stretch" maxH="400px" overflowY="auto" gap={0} css={{
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                    }}>
                        {loading && notifications.length === 0 ? (
                            <Flex p={10} justify="center"><Spinner size="sm" color="purple.400" /></Flex>
                        ) : notifications.length === 0 ? (
                            <VStack p={10} gap={2}>
                                <LuBell size={32} opacity={0.2} color="white" />
                                <Text textAlign="center" fontSize="sm" color="gray.400">All caught up!</Text>
                            </VStack>
                        ) : (
                            notifications.map(n => (
                                <Box
                                    key={n.id}
                                    p={4}
                                    bg={n.is_read ? 'transparent' : 'rgba(167, 139, 250, 0.1)'}
                                    borderBottom="1px solid rgba(255, 255, 255, 0.05)"
                                    _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                                    cursor="pointer"
                                    onClick={() => {
                                        dispatch(markNotificationsRead(n.id));
                                        setSelectedNotification(n);
                                    }}
                                    transition="all 0.2s"
                                >
                                    <Flex gap={3} align="start">
                                        <Box mt={1}>{getIcon(n.type)}</Box>
                                        <Box flex={1}>
                                            <Text fontSize="sm" fontWeight={!n.is_read ? 'bold' : 'medium'} color="white">
                                                {n.title}
                                            </Text>
                                            <Text fontSize="xs" color="gray.400" mt={1} lineClamp={2}>
                                                {n.message}
                                            </Text>
                                            <Text fontSize="10px" color="gray.500" mt={2}>
                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            {n.ai_metadata?.type === 'PAYMENT_REQUIRED' && (
                                                <Button
                                                    size="xs"
                                                    colorPalette="green"
                                                    mt={3}
                                                    rounded="lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPaymentModal({
                                                            open: true,
                                                            amount: n.ai_metadata.amount,
                                                            opportunityId: n.ai_metadata.opportunityId
                                                        });
                                                    }}
                                                >
                                                    <LuZap style={{ marginRight: '4px' }} /> Pay KES {n.ai_metadata.amount}
                                                </Button>
                                            )}
                                        </Box>
                                        {!n.is_read && (
                                            <Box w="6px" h="6px" bg="purple.400" borderRadius="full" mt={2} />
                                        )}
                                    </Flex>
                                </Box>
                            ))
                        )}
                    </VStack>

                </Box>
            )}

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <Box
                    position="fixed"
                    inset={0}
                    zIndex={9999}
                    bg="blackAlpha.800"
                    backdropFilter="blur(8px)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => setSelectedNotification(null)}
                >
                    <Box
                        bg="#1a1c23"
                        p={8}
                        borderRadius="2xl"
                        maxW="500px"
                        w="full"
                        mx={4}
                        border="1px solid rgba(255,255,255,0.1)"
                        onClick={(e) => e.stopPropagation()}
                        animation="slide-up 0.3s ease-out"
                    >
                        <Flex justify="space-between" align="center" mb={6}>
                            <HStack gap={3}>
                                {getIcon(selectedNotification.type)}
                                <Heading size="md" color="white">{selectedNotification.title}</Heading>
                            </HStack>
                            <IconButton
                                aria-label="Close"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedNotification(null)}
                            >
                                <LuX />
                            </IconButton>
                        </Flex>
                        
                        <Text color="gray.300" fontSize="md" lineHeight="tall" mb={8}>
                            {selectedNotification.message}
                        </Text>
                        
                        <Flex justify="space-between" align="center">
                            <Text fontSize="xs" color="gray.500">
                                {new Date(selectedNotification.created_at).toLocaleString()}
                            </Text>
                            <Button
                                size="sm"
                                colorPalette="purple"
                                onClick={() => setSelectedNotification(null)}
                            >
                                Close
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}

            <MpesaPaymentModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                amount={paymentModal.amount}
                opportunityId={paymentModal.opportunityId}
            />
        </Box>
    );
};

export default NotificationCenter;
