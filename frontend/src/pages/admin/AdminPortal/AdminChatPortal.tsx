import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Heading,
    Icon,
    Input,
    IconButton,
    AvatarRoot,
    AvatarFallback,
    Badge,
    Spinner
} from '@chakra-ui/react';
import {
    Search,
    MessageSquare,
    Send,
    User,
    Building2,
    GraduationCap,
    Clock
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../store';
import { messageService } from '../../../services/messageService';
import type { ChatMessage } from '../../../services/messageService';
import { useSocket } from '../../../context/SocketContext';
import './AdminPortal.css';

const AdminChatPortal: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { socket } = useSocket();
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [departments, setDepartments] = useState<any[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchDepts = async () => {
            if (user?.role === 'INSTITUTION') {
                try {
                    const params = user.institutionCode ? { params: { institutionCode: user.institutionCode } } : {};
                    const res = await apiClient.get('/institutions/departments', params);
                    if (res.data?.data) {
                        setDepartments(res.data.data);
                    }
                } catch (e) {
                    console.error("Failed to fetch departments for chat contacts", e);
                }
            }
        };
        fetchDepts();
    }, [user]);

    useEffect(() => {
        const loadConversations = async () => {
            setIsLoading(true);
            try {
                // For Institution admins, we fetch all messages related to their institution
                const res = await messageService.getConversation({});
                if (res.status === 'success') {
                    setMessages(res.data);
                }
            } catch (err) {
                console.error("Failed to load conversations", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadConversations();
    }, [user?.id]);

    useEffect(() => {
        if (socket) {
            const handleNewMessage = (msg: ChatMessage) => {
                if (activeConversation && (msg.sender_id === activeConversation.id || msg.receiver_id === activeConversation.id)) {
                    setMessages(prev => [...prev, msg]);
                } else if (msg.sender_id !== user?.id) {
                    // Update unread count for the sender
                    setUnreadCounts(prev => ({
                        ...prev,
                        [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
                    }));

                    // To update 'last message' in the sidebar, we might re-fetch or optimistically update the conversations list.
                    // Removed setConversations since it's now dynamically calculated
                }
            };
            socket.on('new_message', handleNewMessage);
            return () => { socket.off('new_message', handleNewMessage); };
        }
    }, [socket, activeConversation, user?.id, departments]);

    useEffect(() => {
        if (activeConversation) {
            // clear unread count when opening
            setUnreadCounts(prev => {
                if (prev[activeConversation.id]) {
                    const newCounts = { ...prev };
                    delete newCounts[activeConversation.id];
                    return newCounts;
                }
                return prev;
            });
            fetchMessages(activeConversation.id);
        }
    }, [activeConversation]);

    const fetchMessages = async (otherId: string) => {
        try {
            const res = await messageService.getConversation({ otherId });
            if (res.status === 'success') {
                setMessages(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    // Now we calculate conversations on the fly based on messages and departments
    // Use React.useMemo so we don't recalculate it unnecessarily
    const conversations = React.useMemo(() => {
        const lastMsgs: Record<string, any> = {};
        messages.forEach(m => {
            const otherId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
            const otherName = m.sender_id === user?.id ? m.receiver_name : m.sender_name;
            if (!lastMsgs[otherId] || new Date(m.created_at) > new Date(lastMsgs[otherId].created_at)) {
                lastMsgs[otherId] = {
                    id: otherId,
                    name: otherName || "Unknown User",
                    lastMessage: m.content,
                    created_at: m.created_at,
                    role: m.receiver_id === user?.id ? 'SENDER' : 'RECEIVER'
                };
            }
        });

        // Merge department admins into the list (if we are Institution Admin)
        if (user?.role === 'INSTITUTION') {
            departments.forEach(dept => {
                if (dept.user_id) {
                    // Update display name if they exist in history, otherwise add them
                    if (lastMsgs[dept.user_id]) {
                        lastMsgs[dept.user_id].name = dept.name; // override name with dept name
                    } else {
                        // Create a placeholder conversation entry
                        lastMsgs[dept.user_id] = {
                            id: dept.user_id,
                            name: dept.name, // Display department name for clarity
                            lastMessage: "No messages yet",
                            created_at: new Date(0).toISOString(), // place at bottom
                            role: 'RECEIVER'
                        };
                    }
                }
            });
        }

        // Add the Institution Admin to the list if we are a Department Admin
        if (user?.role === 'DEPARTMENT_ADMIN' && user?.institutionAdminId) {
            if (!lastMsgs[user.institutionAdminId]) {
                lastMsgs[user.institutionAdminId] = {
                    id: user.institutionAdminId,
                    name: `${user.institutionName || 'Institution'} Admin`, // Display institution admin name
                    lastMessage: "No messages yet",
                    created_at: new Date(0).toISOString(),
                    role: 'RECEIVER'
                };
            } else {
                lastMsgs[user.institutionAdminId].name = `${user.institutionName || 'Institution'} Admin`;
            }
        }

        return Object.values(lastMsgs).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [messages, departments, user]);

    // Set an active conversation if not set and conversations are loaded
    useEffect(() => {
        if (!activeConversation && conversations.length > 0) {
            setActiveConversation(conversations[0]);
        }
    }, [conversations, activeConversation]);

    const handleSend = async () => {
        if (!inputValue.trim() || !activeConversation) return;
        try {
            const res = await messageService.sendMessage({
                receiver_id: activeConversation.id,
                content: inputValue
            });
            if (res.status === 'success') {
                setMessages(prev => [...prev, res.data]);
                setInputValue("");
            }
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    if (isLoading) return <Flex h="50vh" align="center" justify="center"><Spinner color="purple.400" /></Flex>;

    return (
        <Box h="calc(100vh - 180px)" animation="fadeIn 0.5s ease-out">
            <Flex h="full" gap={6}>
                {/* Conversation List */}
                <VStack w="350px" borderRadius="24px" className="glass-card" overflow="hidden" align="stretch" gap={0}>
                    <Box p={6} borderBottom="1px solid rgba(255,255,255,0.05)">
                        <Heading size="md" mb={4}>Communications</Heading>
                        <Input
                            placeholder="Search contacts..."
                            size="sm"
                            bg="rgba(255,255,255,0.05)"
                            border="none"
                            borderRadius="10px"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Box>
                    <Box overflowY="auto" flex={1}>
                        {conversations
                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(conv => (
                                <Flex
                                    key={conv.id}
                                    p={4}
                                    cursor="pointer"
                                    align="center"
                                    justify="space-between"
                                    gap={3}
                                    bg={activeConversation?.id === conv.id ? "rgba(167, 139, 250, 0.1)" : "transparent"}
                                    transition="0.2s"
                                    _hover={{ bg: "rgba(255,255,255,0.02)" }}
                                    onClick={() => setActiveConversation(conv)}
                                >
                                    <HStack gap={3} flex={1} overflow="hidden">
                                        <AvatarRoot size="sm">
                                            <AvatarFallback name={conv.name} />
                                        </AvatarRoot>
                                        <VStack align="flex-start" gap={0} flex={1}>
                                            <HStack justify="space-between" w="full">
                                                <Text fontWeight="bold" fontSize="sm" w="130px" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{conv.name}</Text>
                                                <Text fontSize="10px" color="gray.500" whiteSpace="nowrap">
                                                    {conv.lastMessage === "No messages yet" ? "" : new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.400" lineClamp={1} fontStyle={conv.lastMessage === "No messages yet" ? "italic" : "normal"}>{conv.lastMessage}</Text>
                                        </VStack>
                                    </HStack>

                                    {unreadCounts[conv.id] > 0 && (
                                        <Badge colorPalette="red" variant="solid" borderRadius="full" size="sm" px={2}>
                                            {unreadCounts[conv.id]}
                                        </Badge>
                                    )}
                                </Flex>
                            ))}
                    </Box>
                </VStack>

                {/* Chat Window */}
                <VStack flex={1} borderRadius="24px" className="glass-card" overflow="hidden" align="stretch" gap={0}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <Flex p={4} borderBottom="1px solid rgba(255,255,255,0.05)" align="center" justify="space-between" bg="rgba(255,255,255,0.02)">
                                <HStack gap={4}>
                                    <AvatarRoot size="md">
                                        <AvatarFallback name={activeConversation.name} />
                                    </AvatarRoot>
                                    <VStack align="flex-start" gap={0}>
                                        <Text fontWeight="bold">{activeConversation.name}</Text>
                                        <HStack gap={1}>
                                            <Icon as={Clock} boxSize={3} color="teal.400" />
                                            <Text fontSize="xs" color="teal.400">Active now</Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </Flex>

                            {/* Messages Area */}
                            <Box flex={1} overflowY="auto" p={6} bg="rgba(0,0,0,0.1)">
                                <VStack align="stretch" gap={4}>
                                    {messages.map(msg => {
                                        const isMe = msg.sender_id === user?.id;
                                        return (
                                            <Flex key={msg.id} justify={isMe ? "flex-end" : "flex-start"}>
                                                <Box
                                                    maxW="70%"
                                                    p={3}
                                                    borderRadius="18px"
                                                    bg={isMe ? "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" : "rgba(255,255,255,0.05)"}
                                                    color={isMe ? "white" : "gray.200"}
                                                    borderBottomRightRadius={isMe ? "4px" : "18px"}
                                                    borderBottomLeftRadius={isMe ? "18px" : "4px"}
                                                    boxShadow="xl"
                                                >
                                                    <Text fontSize="sm">{msg.content}</Text>
                                                    <Text fontSize="9px" textAlign="right" mt={1} opacity={0.6}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        );
                                    })}
                                </VStack>
                            </Box>

                            {/* Input Area */}
                            <Box p={4} bg="rgba(255,255,255,0.02)">
                                <HStack gap={3}>
                                    <Input
                                        placeholder="Type your message..."
                                        border="none"
                                        bg="rgba(255,255,255,0.05)"
                                        p={4}
                                        borderRadius="15px"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <IconButton
                                        aria-label="Send"
                                        bg="#a78bfa"
                                        color="white"
                                        _hover={{ bg: "#8b5cf6" }}
                                        onClick={handleSend}
                                        borderRadius="12px"
                                    >
                                        <Send size={20} />
                                    </IconButton>
                                </HStack>
                            </Box>
                        </>
                    ) : (
                        <Flex h="full" align="center" justify="center" direction="column" gap={4}>
                            <Icon as={MessageSquare} boxSize={12} color="gray.600" />
                            <Text color="gray.500">Select a contact to start messaging</Text>
                        </Flex>
                    )}
                </VStack>
            </Flex>
        </Box>
    );
};

export default AdminChatPortal;
