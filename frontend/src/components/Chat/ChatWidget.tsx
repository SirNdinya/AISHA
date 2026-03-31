import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
    Box, Input, VStack, Text, IconButton, HStack,
    Card, Heading, Badge, Flex, Spinner
} from '@chakra-ui/react';
import {
    LuMessageSquare, LuX, LuSend, LuMinimize2,
    LuCircle
} from 'react-icons/lu';
import { messageService } from '../../services/messageService';
import type { ChatMessage } from '../../services/messageService';

interface ChatWidgetProps {
    currentUserId: string;
    targetUserId: string;
    targetUserName?: string;
    applicationId?: string;
    opportunityId?: string;
    contextTitle?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
    currentUserId,
    targetUserId,
    targetUserName = "Recipient",
    applicationId,
    opportunityId,
    contextTitle
}) => {
    const { socket, isConnected } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, targetUserId, applicationId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await messageService.getConversation({
                otherId: targetUserId,
                appId: applicationId
            });
            if (res.status === 'success') {
                setMessages(res.data);
            }
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (socket) {
            const handleNewMessage = (msg: ChatMessage) => {
                const isRelevant =
                    (msg.sender_id === targetUserId || msg.receiver_id === targetUserId) &&
                    (!applicationId || msg.application_id === applicationId);

                if (isRelevant) {
                    setMessages(prev => [...prev, msg]);
                }
            };

            socket.on('new_message', handleNewMessage);
            return () => {
                socket.off('new_message', handleNewMessage);
            };
        }
    }, [socket, targetUserId, applicationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        try {
            const res = await messageService.sendMessage({
                receiver_id: targetUserId,
                content: inputValue,
                application_id: applicationId,
                opportunity_id: opportunityId
            });

            if (res.status === 'success') {
                setMessages(prev => [...prev, res.data]);
                setInputValue("");
            }
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    if (!isOpen) {
        return (
            <IconButton
                aria-label="Open Chat"
                position="fixed"
                bottom="20px"
                right="20px"
                colorPalette="purple"
                onClick={() => setIsOpen(true)}
                size="lg"
                borderRadius="full"
                zIndex={1000}
                boxShadow="0 8px 32px rgba(167, 139, 250, 0.4)"
                backdropFilter="blur(8px)"
                bg="rgba(167, 139, 250, 0.2)"
                border="1px solid rgba(167, 139, 250, 0.3)"
                _hover={{ bg: "rgba(167, 139, 250, 0.3)", transform: "scale(1.1)" }}
                transition="all 0.3s"
            >
                <LuMessageSquare size={24} />
            </IconButton>
        );
    }

    return (
        <Card.Root
            position="fixed"
            bottom="20px"
            right="20px"
            w="380px"
            h="550px"
            zIndex={1000}
            bg="rgba(13, 17, 23, 0.8)"
            backdropFilter="blur(20px) saturate(180%)"
            border="1px solid rgba(255, 255, 255, 0.125)"
            shadow="dark-lg"
            borderRadius="2xl"
            overflow="hidden"
            animation="fade-in 0.3s ease-out"
        >
            <Card.Header
                bg="linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(167, 139, 250, 0.1) 100%)"
                color="white"
                py={4}
                borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            >
                <HStack justify="space-between" w="full">
                    <HStack>
                        <Box p={2} bg="rgba(255, 255, 255, 0.1)" borderRadius="full">
                            <LuMessageSquare size={16} />
                        </Box>
                        <VStack align="start" gap={0}>
                            <Heading size="xs" fontWeight="bold">{targetUserName}</Heading>
                            {contextTitle && <Text fontSize="10px" color="gray.400">RE: {contextTitle}</Text>}
                        </VStack>
                    </HStack>
                    <HStack gap={1}>
                        <Badge
                            bg={isConnected ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                            color={isConnected ? "emerald.300" : "red.300"}
                            variant="subtle"
                            size="xs"
                            borderRadius="full"
                            textTransform="none"
                            px={2}
                        >
                            <Flex align="center" gap={1}>
                                <LuCircle size={8} fill={isConnected ? "#6ee7b7" : "#fca5a5"} />
                                {isConnected ? "Live" : "Offline"}
                            </Flex>
                        </Badge>
                        <IconButton
                            aria-label="Minimize"
                            size="xs"
                            variant="ghost"
                            color="whiteAlpha.700"
                            _hover={{ color: "white", bg: "whiteAlpha.100" }}
                            onClick={() => setIsOpen(false)}
                        >
                            <LuMinimize2 />
                        </IconButton>
                        <IconButton
                            aria-label="Close"
                            size="xs"
                            variant="ghost"
                            color="whiteAlpha.700"
                            _hover={{ color: "white", bg: "whiteAlpha.100" }}
                            onClick={() => setIsOpen(false)}
                        >
                            <LuX />
                        </IconButton>
                    </HStack>
                </HStack>
            </Card.Header>

            <Card.Body
                overflowY="auto"
                p={4}
                css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                }}
            >
                {isLoading ? (
                    <Flex h="full" align="center" justify="center">
                        <Spinner color="purple.500" borderWidth="3px" size="lg" />
                    </Flex>
                ) : (
                    <VStack align="stretch" gap={4}>
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <Box
                                    key={msg.id}
                                    alignSelf={isMe ? "flex-end" : "flex-start"}
                                    bg={isMe ? "rgba(167, 139, 250, 0.2)" : "rgba(255, 255, 255, 0.05)"}
                                    color="white"
                                    px={4}
                                    py={3}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor={isMe ? "rgba(167, 139, 250, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                                    borderBottomRightRadius={isMe ? "2px" : "xl"}
                                    borderBottomLeftRadius={isMe ? "xl" : "2px"}
                                    maxW="85%"
                                    shadow="md"
                                >
                                    <Text fontSize="sm" lineHeight="tall">{msg.content}</Text>
                                    <HStack justify="flex-end" mt={1} opacity={0.6}>
                                        <Text fontSize="9px">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </HStack>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </VStack>
                )}
            </Card.Body>

            <Card.Footer p={4} borderTop="1px solid rgba(255, 255, 255, 0.1)" bg="rgba(255, 255, 255, 0.02)">
                <HStack w="full" bg="rgba(255, 255, 255, 0.05)" borderRadius="full" p={1} pl={4}>
                    <Input
                        placeholder="Type your message..."
                        size="md"
                        variant="subtle"
                        color="white"
                        _placeholder={{ color: "gray.500" }}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <IconButton
                        aria-label="Send"
                        colorPalette="purple"
                        borderRadius="full"
                        onClick={handleSend}
                        size="sm"
                        disabled={!inputValue.trim()}
                        _hover={{ transform: "scale(1.1)" }}
                    >
                        <LuSend />
                    </IconButton>
                </HStack>
            </Card.Footer>
        </Card.Root>
    );
};

export default ChatWidget;
