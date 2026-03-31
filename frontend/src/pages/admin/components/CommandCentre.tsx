import React, { useState, useEffect, useRef } from 'react';
import {
    Box, VStack, HStack, Text, Input, Flex,
    Icon, Badge, SimpleGrid, Spinner, IconButton, Separator, Heading
} from '@chakra-ui/react';
import {
    LuTerminal, LuCpu, LuDatabase, LuActivity,
    LuShieldAlert, LuZap, LuSend, LuBrainCircuit
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../../services/apiClient';

const MotionBox = motion.create(Box);

interface LogEntry {
    type: 'info' | 'error' | 'success' | 'system';
    message: string;
    timestamp: string;
}

const CommandCentre: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([
        { type: 'system', message: 'AISHA System Intelligence Initialized...', timestamp: new Date().toLocaleTimeString() },
        { type: 'info', message: 'Connecting to Core Neural Network...', timestamp: new Date().toLocaleTimeString() },
        { type: 'success', message: 'Connection Established. Standing by for commands.', timestamp: new Date().toLocaleTimeString() }
    ]);
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({
        cpu: '1.2%',
        ram: '244MB',
        db: 'Connected',
        api: 'Healthy'
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const interval = setInterval(() => {
            setStats({
                cpu: (Math.random() * 2 + 0.5).toFixed(1) + '%',
                ram: (Math.floor(Math.random() * 20) + 240) + 'MB',
                db: 'Connected',
                api: 'Healthy'
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        setLogs(prev => [...prev, {
            type,
            message,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const handleCommand = async () => {
        if (!command.trim() || isProcessing) return;

        const cmd = command.trim();
        addLog(`> ${cmd}`, 'info');
        setCommand('');
        setIsProcessing(true);

        try {
            const res = await apiClient.post('/admin/execute-command', { command: cmd });
            const response = res.data.data;

            if (response.logs) {
                response.logs.forEach((l: any) => addLog(l.message, l.type));
            } else {
                addLog(response.message || 'Command executed successfully.', 'success');
            }
        } catch (error: any) {
            addLog(error.response?.data?.message || 'Neural link failure. Command rejected.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <VStack align="stretch" gap={6} h="calc(100vh - 250px)">
            {/* System Health HUD */}
            <SimpleGrid columns={[1, 2, 4]} gap={4}>
                <HealthCard icon={LuCpu} label="Neural CPU" value={stats.cpu} color="cyan.400" />
                <HealthCard icon={LuActivity} label="Memory Load" value={stats.ram} color="purple.400" />
                <HealthCard icon={LuDatabase} label="Sync Status" value={stats.db} color="green.400" />
                <HealthCard icon={LuShieldAlert} label="Core Security" value={stats.api} color="blue.400" />
            </SimpleGrid>

            {/* Terminal Section */}
            <Flex flex={1} gap={4} overflow="hidden">
                {/* Main Terminal */}
                <VStack
                    flex={2}
                    bg="rgba(10, 15, 30, 0.9)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    overflow="hidden"
                    align="stretch"
                >
                    <HStack bg="whiteAlpha.50" px={4} py={2} justify="space-between">
                        <HStack gap={2}>
                            <Icon as={LuTerminal} color="cyan.400" />
                            <Text fontSize="xs" fontWeight="bold" letterSpacing="widest">SYSTEM TERMINAL</Text>
                        </HStack>
                        <Badge variant="subtle" colorPalette="cyan" fontSize="10px">SECURE_ROOT</Badge>
                    </HStack>

                    <Box
                        flex={1}
                        p={4}
                        overflowY="auto"
                        ref={scrollRef}
                        css={{
                            '&::-webkit-scrollbar': { width: '4px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {logs.map((log, i) => (
                                <MotionBox
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    mb={2}
                                >
                                    <HStack align="start" gap={3} fontSize="sm">
                                        <Text color="whiteAlpha.400" fontSize="xs" mt={0.5}>[{log.timestamp}]</Text>
                                        <Text color={
                                            log.type === 'error' ? 'red.400' :
                                                log.type === 'success' ? 'green.400' :
                                                    log.type === 'system' ? 'cyan.400' : 'whiteAlpha.800'
                                        } fontFamily="monospace">
                                            {log.type === 'system' && <Icon as={LuZap} boxSize={3} mr={2} />}
                                            {log.message}
                                        </Text>
                                    </HStack>
                                </MotionBox>
                            ))}
                        </AnimatePresence>
                        {isProcessing && (
                            <HStack gap={2} mt={2}>
                                <Spinner size="xs" color="cyan.400" />
                                <Text fontSize="xs" color="cyan.400" fontFamily="monospace">Processing neural request...</Text>
                            </HStack>
                        )}
                    </Box>

                    <Box p={4} borderTop="1px solid" borderColor="whiteAlpha.100">
                        <HStack gap={3}>
                            <Text color="cyan.400" fontWeight="bold">admin@aisha:~$</Text>
                            <Input
                                variant="flushed"
                                placeholder="Type a command or ask AI (e.g., 'check system health')..."
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
                                autoFocus
                                color="white"
                                fontFamily="monospace"
                            />
                            <IconButton
                                aria-label="Send"
                                variant="ghost"
                                onClick={handleCommand}
                                loading={isProcessing}
                            >
                                <LuSend />
                            </IconButton>
                        </HStack>
                    </Box>
                </VStack>

                {/* AI Brain HUD (Sidebar) */}
                <VStack
                    flex={1}
                    bg="rgba(167, 139, 250, 0.05)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="purple.500/20"
                    p={6}
                    align="center"
                    justify="center"
                    textAlign="center"
                    gap={4}
                >
                    <Box position="relative">
                        <MotionBox
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 0.8, 0.5]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            position="absolute"
                            top="-20px"
                            left="-20px"
                            right="-20px"
                            bottom="-20px"
                            borderRadius="full"
                            bg="purple.500/20"
                            filter="blur(30px)"
                        />
                        <Icon as={LuBrainCircuit} boxSize={16} color="purple.400" position="relative" zIndex={1} />
                    </Box>
                    <VStack gap={1}>
                        <Heading size="sm" fontWeight="bold">AI COMMAND ENGINE</Heading>
                        <Text fontSize="xs" color="purple.200/60">INTELLIGENCE_LEVEL: OMNI.IX</Text>
                    </VStack>
                    <Separator opacity={0.1} />
                    <VStack align="start" gap={2} w="full">
                        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Suggested Commands</Text>
                        <CommandTip text="Diagnose API latency" />
                        <CommandTip text="Broadcast update to Students" />
                        <CommandTip text="List unverified institutions" />
                        <CommandTip text="Rotate encryption keys" />
                    </VStack>
                </VStack>
            </Flex>
        </VStack>
    );
};

const HealthCard = ({ icon, label, value, color }: any) => (
    <HStack
        className="glass-panel"
        p={4}
        borderRadius="xl"
        gap={4}
        border="1px solid"
        borderColor="whiteAlpha.100"
    >
        <Flex
            p={3}
            borderRadius="lg"
            bg="whiteAlpha.50"
            color={color}
            boxShadow={`0 0 15px ${color}20`}
        >
            <Icon as={icon} boxSize={5} />
        </Flex>
        <VStack align="start" gap={0}>
            <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase">{label}</Text>
            <Text fontSize="lg" fontWeight="black" color="whiteAlpha.900">{value}</Text>
        </VStack>
    </HStack>
);

const CommandTip = ({ text }: { text: string }) => (
    <HStack
        w="full"
        p={2}
        borderRadius="md"
        bg="whiteAlpha.50"
        _hover={{ bg: 'whiteAlpha.100', cursor: 'pointer', transform: 'translateX(5px)' }}
        transition="all 0.2s"
        fontSize="11px"
        color="whiteAlpha.700"
    >
        <Icon as={LuZap} boxSize={3} color="purple.400" />
        <Text>{text}</Text>
    </HStack>
);

export default CommandCentre;
