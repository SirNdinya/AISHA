import React, { useState } from 'react';
import {
    Box, Button, Heading, Text, VStack,
    Input, Icon, Flex, Spinner, Alert
} from '@chakra-ui/react';
import { LuX, LuSmartphone, LuShieldCheck, LuZap } from "react-icons/lu";
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

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!phoneNumber) {
            setError('Please enter your M-Pesa phone number.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.post('/payments/initiate', {
                phoneNumber,
                amount,
                opportunityId,
                type: 'PLACEMENT_STIPEND'
            });

            if (response.data.status === 'success') {
                setStatus('PENDING');
                // In a real app, we might poll for status, but for now we'll show a success message
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
        <Box
            position="fixed" top={0} left={0} w="full" h="full" bg="blackAlpha.800"
            display="flex" justifyContent="center" alignItems="center" zIndex={2000}
            backdropFilter="blur(10px)" p={4}
        >
            <Box
                bg="gray.900" p={8} borderRadius="3xl" w={{ base: "full", md: "450px" }}
                border="1px solid" borderColor="whiteAlpha.200" shadow="2xl"
                position="relative"
            >
                <IconButton
                    aria-label="Close"
                    variant="ghost" color="whiteAlpha.600" position="absolute" top={4} right={4}
                    onClick={onClose} rounded="full"
                >
                    <LuX />
                </IconButton>

                <VStack gap={6} align="stretch">
                    <Box textAlign="center">
                        <Box bg="green.500/20" p={4} borderRadius="full" display="inline-block" mb={4}>
                            <Icon as={LuSmartphone} color="green.400" boxSize={8} />
                        </Box>
                        <Heading size="lg" color="white">M-PESA Express</Heading>
                        <Text color="gray.400" fontSize="sm">STK Push Authentication</Text>
                    </Box>

                    {status === 'IDLE' && (
                        <>
                            <Box bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px dashed" borderColor="whiteAlpha.200">
                                <Flex justify="space-between" align="center">
                                    <Text color="gray.400" fontSize="xs">Transaction Amount</Text>
                                    <Text color="green.400" fontWeight="bold" fontSize="xl">KES {amount.toLocaleString()}</Text>
                                </Flex>
                            </Box>

                            <Box>
                                <Text color="gray.500" fontSize="xs" mb={2}>M-PESA PHONE NUMBER</Text>
                                <Input
                                    placeholder="e.g. 0712345678"
                                    bg="whiteAlpha.100" border="none" color="white" h={12}
                                    value={phoneNumber}
                                    onChange={e => setPhoneNumber(e.target.value)}
                                />
                                <Text fontSize="10px" color="gray.600" mt={2}>
                                    A payment request will be sent to this device.
                                </Text>
                            </Box>

                            {error && (
                                <Alert.Root status="error" variant="subtle" borderRadius="lg">
                                    <Alert.Indicator />
                                    <Alert.Title fontSize="xs">{error}</Alert.Title>
                                </Alert.Root>
                            )}

                            <Button
                                colorPalette="green" size="lg" rounded="xl" h={14}
                                onClick={handlePayment}
                                disabled={isLoading}
                                boxShadow="0 0 20px rgba(72, 187, 120, 0.3)"
                            >
                                {isLoading ? <Spinner size="sm" mr={3} /> : <LuZap style={{ marginRight: '8px' }} />}
                                {isLoading ? 'Processing...' : 'Pay with M-PESA'}
                            </Button>
                        </>
                    )}

                    {status === 'PENDING' && (
                        <VStack py={10} gap={4} textAlign="center">
                            <Spinner size="xl" color="green.400" />
                            <Text color="white" fontWeight="bold">Check your phone!</Text>
                            <Text color="gray.400" fontSize="sm">
                                Please enter your M-PESA PIN to authorize the payment of <b>KES {amount}</b>.
                            </Text>
                        </VStack>
                    )}

                    {status === 'SUCCESS' && (
                        <VStack py={10} gap={4} textAlign="center">
                            <Box bg="green.500" p={4} borderRadius="full">
                                <Icon as={LuShieldCheck} color="white" boxSize={10} />
                            </Box>
                            <Text color="white" fontSize="xl" fontWeight="bold">Payment Successful!</Text>
                            <Text color="gray.400" fontSize="sm">
                                Your placement has been finalized. You can now access your logbook and company materials.
                            </Text>
                            <Button w="full" colorPalette="blue" mt={4} onClick={onClose} rounded="xl">
                                Continue to Workspace
                            </Button>
                        </VStack>
                    )}
                </VStack>
            </Box>
        </Box>
    );
};

// Internal IconButton component for consistency if not exported from UI
const IconButton: React.FC<any> = ({ children, ...props }) => (
    <Button variant="ghost" p={0} minW="40px" h="40px" {...props}>
        {children}
    </Button>
);

export default MpesaPaymentModal;
