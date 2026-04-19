import React, { useState } from 'react';
import {
    Box, Button, Heading, Text, VStack,
    Input, Icon, Flex, Spinner, Alert,
    DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody,
    DialogFooter, DialogBackdrop, DialogPositioner, DialogCloseTrigger,
    IconButton
} from '@chakra-ui/react';
import { LuX, LuSmartphone, LuShieldCheck } from "react-icons/lu";
import apiClient from '../../services/apiClient';

interface MpesaPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    opportunityId: string;
    onSuccess?: () => void;
}

const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({ isOpen, onClose, amount, opportunityId, onSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS'>('IDLE');

    const handlePayment = async () => {
        const phoneRegex = /^0[71]\d{8}$/;
        if (!phoneNumber) {
            setError('Please enter your M-Pesa phone number.');
            return;
        }
        if (!phoneRegex.test(phoneNumber)) {
            setError('Phone number must start with 07 or 01 and be 10 digits.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.post('/payments/pay', {
                phoneNumber,
                amount,
                opportunityId,
                type: 'PLACEMENT_STIPEND'
            });

            if (response.data.status === 'success') {
                setStatus('PENDING');
                setTimeout(() => {
                    setStatus('SUCCESS');
                    setIsLoading(false);
                    if (onSuccess) onSuccess();
                }, 3000);
            } else {
                setError('Failed to initiate payment. Please try again.');
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Connection error. Please check your network.');
            setIsLoading(false);
        }
    };

    return (
        <DialogRoot 
            open={isOpen} 
            onOpenChange={(details) => !details.open && onClose()}
            size="md"
            placement="center"
        >
            <DialogBackdrop backdropFilter="blur(12px)" bg="rgba(0,0,0,0.4)" />
            <DialogPositioner>
                <DialogContent 
                    bg="#0d1117" 
                    borderRadius="3xl" 
                    w={{ base: "95%", sm: "450px" }}
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    shadow="2xl"
                    overflow="hidden"
                >
                    <DialogHeader borderBottom="1px solid rgba(255, 255, 255, 0.05)" pb={4}>
                        <Flex justify="center" pt={4}>
                            <Box bg="green.500/20" p={4} borderRadius="full">
                                <Icon as={LuSmartphone} color="#4FB13C" boxSize={8} />
                            </Box>
                        </Flex>
                        <DialogTitle textAlign="center" color="white" mt={4} fontWeight="black" fontSize="xl">M-PESA Express</DialogTitle>
                        <Text textAlign="center" color="gray.500" fontSize="xs" fontWeight="bold">STK Push Authentication</Text>
                        <DialogCloseTrigger asChild>
                            <IconButton
                                aria-label="Close"
                                variant="ghost" 
                                color="whiteAlpha.600" 
                                position="absolute" 
                                top={4} 
                                right={4}
                                rounded="full"
                                _hover={{ bg: "whiteAlpha.100", color: "white" }}
                            >
                                <LuX />
                            </IconButton>
                        </DialogCloseTrigger>
                    </DialogHeader>

                    <DialogBody py={8}>
                        <VStack gap={6} align="stretch">
                            {status === 'IDLE' && (
                                <>
                                    <Box bg="whiteAlpha.50" p={5} borderRadius="2xl" border="1px dashed" borderColor="whiteAlpha.200">
                                        <Flex justify="space-between" align="center">
                                            <Text color="gray.400" fontSize="xs" fontWeight="bold">Transaction Amount</Text>
                                            <Text color="#4FB13C" fontWeight="black" fontSize="2xl">KES {amount.toLocaleString()}</Text>
                                        </Flex>
                                    </Box>

                                    <Box>
                                        <Text color="gray.500" fontSize="xs" mb={2} fontWeight="black">M-PESA PHONE NUMBER</Text>
                                        <Input
                                            placeholder="e.g. 0712345678"
                                            bg="rgba(255, 255, 255, 0.05)" 
                                            border="1px solid rgba(255, 255, 255, 0.1)" 
                                            color="white" 
                                            h={14}
                                            borderRadius="xl"
                                            fontSize="lg"
                                            _focus={{ borderColor: "#4FB13C", bg: "rgba(255, 255, 255, 0.08)" }}
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                        />
                                        <Text fontSize="10px" color="gray.600" mt={2} fontWeight="bold">
                                            A secure STK push request will be sent to this device.
                                        </Text>
                                    </Box>

                                    {error && (
                                        <Alert.Root status="error" variant="subtle" borderRadius="xl">
                                            <Alert.Indicator />
                                            <Alert.Title fontSize="xs" color="red.400">{error}</Alert.Title>
                                        </Alert.Root>
                                    )}

                                    <Button
                                        size="lg" 
                                        rounded="2xl" 
                                        h={16}
                                        onClick={handlePayment}
                                        disabled={isLoading}
                                        bg="#4FB13C"
                                        color="black"
                                        fontWeight="black"
                                        fontSize="md"
                                        letterSpacing="1px"
                                        _hover={{ bg: "#43a032", transform: "translateY(-2px)" }}
                                        boxShadow="0 10px 20px rgba(79, 177, 60, 0.2)"
                                        transition="all 0.2s"
                                    >
                                        {isLoading ? <Spinner size="sm" mr={3} /> : <LuSmartphone style={{ marginRight: '8px' }} />}
                                        {isLoading ? 'INITIATING...' : 'PAY WITH M-PESA'}
                                    </Button>
                                </>
                            )}

                            {status === 'PENDING' && (
                                <VStack py={4} gap={6} textAlign="center">
                                    <Spinner size="xl" thickness="4px" color="#4FB13C" />
                                    <VStack gap={2}>
                                        <Text color="white" fontWeight="black" fontSize="xl">Check your phone!</Text>
                                        <Text color="gray.400" fontSize="sm">
                                            Please enter your M-PESA PIN to authorize the payment of <b>KES {amount.toLocaleString()}</b>.
                                        </Text>
                                    </VStack>
                                </VStack>
                            )}

                            {status === 'SUCCESS' && (
                                <VStack py={4} gap={6} textAlign="center">
                                    <Box bg="green.500" p={5} borderRadius="full" shadow="0 0 30px rgba(72, 187, 120, 0.4)">
                                        <Icon as={LuShieldCheck} color="white" boxSize={12} />
                                    </Box>
                                    <VStack gap={2}>
                                        <Text color="white" fontSize="2xl" fontWeight="black">Payment Successful!</Text>
                                        <Text color="gray.400" fontSize="sm">
                                            Your transaction has been processed. Your workspace is now updated.
                                        </Text>
                                    </VStack>
                                    <Button w="full" bg="indigo.500" color="white" h={14} mt={4} onClick={onClose} rounded="2xl" fontWeight="black">
                                        Continue to Workspace
                                    </Button>
                                </VStack>
                            )}
                        </VStack>
                    </DialogBody>
                </DialogContent>
            </DialogPositioner>
        </DialogRoot>
    );
};

export default MpesaPaymentModal;
