import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    IconButton,
    Flex,
    Heading,
    Spinner,
    Icon,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { AIMessage } from '../../services/aiService';
import ConfirmModal from './ConfirmModal';
import MarkdownText from './MarkdownText';


const MotionBox = motion(Box);

interface AishaPlaygroundProps {
    isOpen: boolean;
    onClose: () => void;
}

const AishaPlayground: React.FC<AishaPlaygroundProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await aiService.getHistory();
            if (res.status === 'success') {
                setMessages(res.data);
            }
        } catch (err) {
            console.error("Failed to load AI history", err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: AIMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const res = await aiService.chat(userMsg.content, messages);
            if (res.status === 'success' && res.data) {
                setMessages(prev => [...prev, res.data]);
            }
        } catch (err) {
            console.error("AI Chat failed", err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble responding right now. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        try {
            await aiService.clearHistory();
            setMessages([]);
        } catch (err) {
            console.error("Failed to clear history", err);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <MotionBox
                initial={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
                position="fixed"
                bottom={{ base: "90px", md: "110px" }}
                right={{ base: "20px", md: "30px" }}
                w={isMaximized ? { base: "90vw", md: "600px" } : { base: "90vw", md: "400px" }}
                h={isMaximized ? { base: "80vh", md: "700px" } : { base: "70vh", md: "500px" }}
                maxH="80vh"
                borderRadius="24px"
                className="glass-card"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                zIndex={1001}
                boxShadow="0 20px 50px rgba(0,0,0,0.6)"
                border="1px solid rgba(167, 139, 250, 0.2)"
                transition={{ duration: 0.3, ease: "easeOut" }}
                layout
            >
                {/* Header */}
                <Flex p={4} borderBottom="1px solid rgba(255,255,255,0.05)" align="center" justify="space-between" bg="rgba(167, 139, 250, 0.1)">
                    <HStack gap={3}>
                        <Box p={2} borderRadius="12px" bg="linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)">
                            <Icon as={Bot} color="white" boxSize={5} />
                        </Box>
                        <VStack align="flex-start" gap={0}>
                            <Heading size="xs" color="white">AISHA Playground</Heading>
                            <Text fontSize="10px" color="purple.300">Intelligent Assistant Online</Text>
                        </VStack>
                    </HStack>
                    <HStack gap={1}>
                        <IconButton
                            aria-label="Clear history"
                            size="sm"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "red.400", bg: "rgba(239, 68, 68, 0.1)" }}
                            onClick={() => setIsConfirmOpen(true)}
                        >
                            <Trash2 size={16} />
                        </IconButton>
                        <IconButton
                            aria-label="Maximize"
                            size="sm"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "white", bg: "rgba(255,255,255,0.05)" }}
                            onClick={() => setIsMaximized(!isMaximized)}
                        >
                            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </IconButton>
                        <IconButton
                            aria-label="Close"
                            size="sm"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "white", bg: "rgba(255,255,255,0.05)" }}
                            onClick={onClose}
                        >
                            <X size={18} />
                        </IconButton>
                    </HStack>
                </Flex>

                {/* Chat Area */}
                <Box flex={1} overflowY="auto" p={4} bg="rgba(0,0,0,0.2)" className="custom-scrollbar">
                    {isHistoryLoading ? (
                        <Flex h="full" align="center" justify="center">
                            <Spinner color="purple.400" size="lg" />
                        </Flex>
                    ) : messages.length === 0 ? (
                        <Flex h="full" align="center" justify="center" direction="column" gap={4} textAlign="center" px={8}>
                            <MotionBox
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Icon as={Bot} boxSize={12} color="purple.400" opacity={0.5} />
                            </MotionBox>
                            <Text color="gray.400" fontSize="sm">
                                Hello! I'm AISHA. How can I assist you with your placement journey or platform management today?
                            </Text>
                        </Flex>
                    ) : (
                        <VStack align="stretch" gap={4}>
                            {messages.map((msg, i) => (
                                <Flex key={i} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'} align="flex-start" gap={2}>
                                    {msg.role === 'assistant' && (
                                        <Box p={1.5} borderRadius="full" bg="purple.500" mt={1}>
                                            <Icon as={Bot} color="white" boxSize={3} />
                                        </Box>
                                    )}
                                    <MotionBox
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        maxW="85%"
                                        p={3}
                                        borderRadius="18px"
                                        bg={msg.role === 'user' ? "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" : "rgba(255,255,255,0.05)"}
                                        color={msg.role === 'user' ? "white" : "gray.200"}
                                        borderBottomRightRadius={msg.role === 'user' ? "4px" : "18px"}
                                        borderBottomLeftRadius={msg.role === 'user' ? "18px" : "4px"}
                                        boxShadow="xl"
                                        border="1px solid rgba(255,255,255,0.05)"
                                    >
                                        {msg.role === 'assistant' ? (
                                            <MarkdownText content={msg.content} fontSize="sm" lineHeight="tall" />
                                        ) : (
                                            <Text fontSize="sm" lineHeight="tall">{msg.content}</Text>
                                        )}
                                    </MotionBox>
                                    {msg.role === 'user' && (
                                        <Box p={1.5} borderRadius="full" bg="teal.500" mt={1}>
                                            <Icon as={User} color="white" boxSize={3} />
                                        </Box>
                                    )}
                                </Flex>
                            ))}
                            {isLoading && (
                                <Flex justify="flex-start" align="center" gap={2}>
                                    <Box p={1.5} borderRadius="full" bg="purple.500">
                                        <Icon as={Bot} color="white" boxSize={3} />
                                    </Box>
                                    <HStack gap={1} bg="rgba(255,255,255,0.05)" p={3} borderRadius="18px">
                                        <MotionBox
                                            w="4px" h="4px" bg="purple.400" borderRadius="full"
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity }}
                                        />
                                        <MotionBox
                                            w="4px" h="4px" bg="purple.400" borderRadius="full"
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <MotionBox
                                            w="4px" h="4px" bg="purple.400" borderRadius="full"
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                        />
                                    </HStack>
                                </Flex>
                            )}
                            <div ref={messagesEndRef} />
                        </VStack>
                    )}
                </Box>

                {/* Input Area */}
                <Box p={4} bg="rgba(255,255,255,0.02)" borderTop="1px solid rgba(255,255,255,0.05)">
                    <HStack gap={3}>
                        <Input
                            placeholder="Ask AISHA anything..."
                            variant="subtle"
                            bg="rgba(255,255,255,0.05)"
                            p={4}
                            borderRadius="15px"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            fontSize="sm"
                            _placeholder={{ color: "gray.500" }}
                            border="1px solid rgba(167, 139, 250, 0.1)"
                            _focus={{ border: "1px solid rgba(167, 139, 250, 0.5)" }}
                        />
                        <IconButton
                            aria-label="Send"
                            bg="#a78bfa"
                            color="white"
                            _hover={{ bg: "#8b5cf6", transform: "translateY(-2px)" }}
                            _active={{ transform: "scale(0.95)" }}
                            onClick={handleSend}
                            borderRadius="12px"
                            disabled={!inputValue.trim() || isLoading}
                            transition="all 0.2s"
                        >
                            <Send size={20} />
                        </IconButton>
                    </HStack>
                </Box>
                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleClear}
                    title="Clear Conversation"
                    description="Are you sure you want to clear our entire conversation history? This action cannot be undone."
                    confirmText="Clear History"
                    confirmColor="red.500"
                />
            </MotionBox>
        </AnimatePresence>
    );
};

export default AishaPlayground;
