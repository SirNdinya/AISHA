import React, { useEffect, useState, useRef } from 'react';
import { 
    Box, Button, Text, VStack, Flex, IconButton, Spinner, HStack, Heading,
    DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody,
    DialogFooter, DialogBackdrop, DialogPositioner, DialogCloseTrigger
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationsRead, deleteNotifications } from '../../store/notificationSlice';
import type { AppDispatch, RootState } from '../../store';
import { LuBell, LuBellRing, LuCheck, LuInfo, LuCircleCheck, LuTriangleAlert, LuCircleX, LuZap, LuX, LuTrash2, LuSmartphone } from "react-icons/lu";
import { useSocket } from '../../context/SocketContext';
import { type Notification as AppNotification } from '../../services/notificationService';
import MpesaPaymentModal from './MpesaPaymentModal';
import { Checkbox } from "../ui/checkbox";

const NotificationCenter: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { notifications, unreadCount, isLoading: loading } = useSelector((state: RootState) => state.notifications);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ open: boolean, amount: number, opportunityId: string }>({
        open: false,
        amount: 0,
        opportunityId: ''
    });

    const dropDownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { socket } = useSocket();

    useEffect(() => {
        dispatch(fetchNotifications());
        const interval = setInterval(() => dispatch(fetchNotifications()), 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                dropDownRef.current && 
                !dropDownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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

    const handleDeleteSelected = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.length === 0) return;
        dispatch(deleteNotifications(selectedIds));
        setSelectedIds([]);
    };

    const handleDeleteSingle = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        dispatch(deleteNotifications(id));
        setSelectedIds(prev => prev.filter(i => i !== id));
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(notifications.map(n => n.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <LuCircleCheck color="#10b981" />;
            case 'WARNING': return <LuTriangleAlert color="#f59e0b" />;
            case 'ERROR': return <LuCircleX color="#ef4444" />;
            case 'ai_match': return <LuZap color="#a78bfa" />;
            default: return <LuInfo color="#3b82f6" />;
        }
    };

    return (
        <>
            <Box position="relative">
                <IconButton
                    ref={buttonRef}
                    aria-label="Notifications"
                    variant="ghost"
                    onClick={toggleOpen}
                    position="relative"
                    borderRadius="full"
                    _hover={{ bg: "whiteAlpha.200" }}
                >
                    {unreadCount > 0 ? (
                        <LuBellRing size={20} color="#a78bfa" style={{ filter: 'drop-shadow(0 0 5px rgba(167, 139, 250, 0.5))' }} />
                    ) : (
                        <LuBell size={20} color="white" />
                    )}
                    {unreadCount > 0 && (
                        <Box
                            position="absolute"
                            top="-2px"
                            right="-2px"
                            bg="#a78bfa"
                            color="white"
                            borderRadius="full"
                            minW="18px"
                            h="18px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="10px"
                            fontWeight="bold"
                            boxShadow="0 0 10px rgba(167, 139, 250, 0.6)"
                            zIndex={2}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Box>
                    )}
                </IconButton>
            </Box>

            <DialogRoot 
                open={isOpen} 
                onOpenChange={(details) => !details.open && setIsOpen(false)}
                placement="center"
                size="md"
            >
                <DialogBackdrop backdropFilter="blur(16px)" bg="rgba(0,0,0,0.5)" />
                <DialogPositioner>
                    <DialogContent 
                        ref={dropDownRef}
                        w={{ base: "95vw", sm: "500px" }}
                        maxH={{ base: "85vh", sm: "600px" }}
                        bg="#020617"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        boxShadow="0 0 100px rgba(0, 0, 0, 0.5)"
                        borderRadius="2xl"
                        overflow="hidden"
                    >
                        <VStack align="stretch" gap={0} h="full">
                            <Flex p={4} borderBottom="1px solid rgba(255, 255, 255, 0.1)" justify="space-between" align="center" bg="rgba(167, 139, 250, 0.05)">
                                <Heading size="sm" color="white" fontWeight="black" display="flex" alignItems="center">
                                    <LuBell style={{ marginRight: '8px' }} /> Notifications
                                </Heading>
                                <HStack gap={1}>
                                    {notifications.length > 0 && (
                                        <Button 
                                            size="xs" 
                                            variant="ghost" 
                                            color="#a78bfa"
                                            _hover={{ bg: "rgba(167, 139, 250, 0.1)" }}
                                            onClick={handleMarkAllRead}
                                        >
                                            <LuCheck style={{ marginRight: '4px' }} /> Mark all read
                                        </Button>
                                    )}
                                    <DialogCloseTrigger asChild>
                                        <IconButton 
                                            size="sm" 
                                            variant="ghost" 
                                            color="gray.400"
                                            _hover={{ color: "white", bg: "whiteAlpha.100" }}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <LuX size={16} />
                                        </IconButton>
                                    </DialogCloseTrigger>
                                </HStack>
                            </Flex>

                            <VStack 
                                align="stretch" 
                                maxH={{ base: "70vh", sm: "500px" }} 
                                overflowY="auto" 
                                scrollBehavior="smooth"
                                className="custom-scrollbar"
                            >
                                {notifications.length === 0 ? (
                                    <Flex direction="column" align="center" justify="center" p={10} color="gray.500">
                                        <LuBell size={40} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                        <Text fontSize="sm">No new notifications</Text>
                                    </Flex>
                                ) : (
                                    notifications.map((n) => (
                                        <Box 
                                            key={n.id} 
                                            p={4} 
                                            borderBottom="1px solid rgba(255, 255, 255, 0.05)"
                                            bg={!n.is_read ? "rgba(167, 139, 250, 0.03)" : "transparent"}
                                            _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
                                            cursor="pointer"
                                            onClick={() => {
                                                dispatch(markNotificationsRead(n.id));
                                                setSelectedNotification(n);
                                            }}
                                            transition="background 0.2s"
                                            position="relative"
                                            role="group"
                                        >
                                            <Flex gap={3} align="start">
                                                <Box p={2} borderRadius="xl" bg="whiteAlpha.50">
                                                    {getIcon(n.type)}
                                                </Box>
                                                <VStack align="start" flex={1} gap={0.5}>
                                                    <Text fontWeight="bold" fontSize="sm" color={!n.is_read ? "white" : "gray.300"} lineClamp={1}>
                                                        {n.title}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.400" lineClamp={2} lineHeight="short">
                                                        {n.message}
                                                    </Text>
                                                    <Flex mt={1} align="center" justify="space-between" w="full">
                                                        <Text fontSize="10px" color="gray.600">
                                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                        {!n.is_read && (
                                                            <Box w="6px" h="6px" bg="#a78bfa" borderRadius="full" />
                                                        )}
                                                    </Flex>

                                                    {n.type === 'ai_match' && n.ai_metadata?.amount && (
                                                        <Button
                                                            size="xs"
                                                            colorPalette="green"
                                                            mt={3}
                                                            rounded="lg"
                                                            bg="#4FB13C"
                                                            _hover={{ bg: "#43a032" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPaymentModal({
                                                                    open: true,
                                                                    amount: n.ai_metadata.amount,
                                                                    opportunityId: n.ai_metadata.opportunityId
                                                                });
                                                            }}
                                                        >
                                                            <LuSmartphone style={{ marginRight: '4px' }} /> Pay KES {n.ai_metadata.amount}
                                                        </Button>
                                                    )}
                                                </VStack>
                                                <IconButton
                                                    aria-label="Delete notification"
                                                    variant="ghost"
                                                    size="xs"
                                                    opacity={0}
                                                    _groupHover={{ opacity: 0.6 }}
                                                    _hover={{ opacity: 1, color: "red.400" }}
                                                    onClick={(e) => handleDeleteSingle(e, n.id)}
                                                    mt={0.5}
                                                >
                                                    <LuTrash2 size={14} />
                                                </IconButton>
                                            </Flex>
                                        </Box>
                                    ))
                                )}
                            </VStack>
                        </VStack>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>

            {/* Notification Detail Dialog - Centered */}
            <DialogRoot 
                open={!!selectedNotification} 
                onOpenChange={(details) => !details.open && setSelectedNotification(null)}
                size="md"
                placement="center"
            >
                <DialogBackdrop backdropFilter="blur(16px)" bg="rgba(0,0,0,0.6)" />
                <DialogPositioner>
                    <DialogContent 
                        bg="#0d1117" 
                        borderRadius={{ base: "2xl", md: "3xl" }}
                        border="1px solid rgba(255,255,255,0.1)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    >
                        <DialogHeader pb={0}>
                            <HStack gap={4}>
                                <Box p={3} borderRadius="2xl" bg="whiteAlpha.50">
                                    {selectedNotification && getIcon(selectedNotification.type)}
                                </Box>
                                <VStack align="start" gap={0}>
                                    <DialogTitle color="white" fontWeight="black">
                                        {selectedNotification?.title}
                                    </DialogTitle>
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        {selectedNotification && new Date(selectedNotification.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                                    </Text>
                                </VStack>
                            </HStack>
                            <DialogCloseTrigger asChild>
                                <IconButton
                                    aria-label="Close"
                                    variant="ghost"
                                    size="sm"
                                    borderRadius="full"
                                    onClick={() => setSelectedNotification(null)}
                                    position="absolute"
                                    top={4}
                                    right={4}
                                    _hover={{ bg: "whiteAlpha.100" }}
                                >
                                    <LuX size={18} />
                                </IconButton>
                            </DialogCloseTrigger>
                        </DialogHeader>
                        
                        <DialogBody py={8}>
                            <Text color="gray.200" fontSize="lg" lineHeight="relaxed">
                                {selectedNotification?.message}
                            </Text>
                        </DialogBody>
                        
                        <DialogFooter gap={4}>
                            <Button
                                variant="outline"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                color="white"
                                _hover={{ bg: "whiteAlpha.100" }}
                                onClick={(e) => {
                                    if (selectedNotification) {
                                        handleDeleteSingle(e, selectedNotification.id);
                                        setSelectedNotification(null);
                                    }
                                }}
                            >
                                <LuTrash2 style={{ marginRight: '8px' }} /> Delete
                            </Button>
                            <Button
                                colorPalette="purple"
                                minW="120px"
                                fontWeight="bold"
                                onClick={() => setSelectedNotification(null)}
                            >
                                Got it
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>

            <MpesaPaymentModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                amount={paymentModal.amount}
                opportunityId={paymentModal.opportunityId}
            />
        </>
    );
};

export default NotificationCenter;
