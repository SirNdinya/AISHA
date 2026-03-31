import React, { useEffect, useState } from 'react';
import { Box, VStack, Heading, Text, Spinner, Icon, Button, Alert } from '@chakra-ui/react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { FaCheckCircle, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';
import apiClient from '../../services/apiClient';
import AuthLayout from '../../components/layout/AuthLayout';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');
    const token = searchParams.get('token');
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                const response = await apiClient.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
                // Auto redirect after 3 seconds
                setTimeout(() => navigate('/login'), 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
            }
        };

        verifyToken();
    }, [token, navigate]);

    return (
        <AuthLayout>
            <Box
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(20px)"
                p={{ base: 8, md: 10 }}
                borderRadius="4xl"
                boxShadow="2xl"
                border="1px solid"
                borderColor="whiteAlpha.500"
                textAlign="center"
            >
                <VStack gap={6}>
                    {status === 'loading' && (
                        <>
                            <Spinner size="xl" color="brand.500" borderWidth="4px" />
                            <Heading size="xl" color="gray.800">Verifying...</Heading>
                            <Text color="gray.500">Please wait while we confirm your email address.</Text>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <Icon as={FaCheckCircle} fontSize="6xl" color="green.500" />
                            <Heading size="xl" color="gray.800">Verified!</Heading>
                            <Alert.Root status="success" variant="subtle" borderRadius="xl">
                                <Alert.Indicator />
                                <Alert.Description fontWeight="medium">{message}</Alert.Description>
                            </Alert.Root>
                            <Text color="gray.500">You will be redirected to the login page in a few seconds.</Text>
                            <Button asChild colorPalette="brand" w="full" h={14} borderRadius="2xl" mt={4}>
                                <RouterLink to="/login">
                                    Go to Login <Icon as={FaArrowRight} ml={2} />
                                </RouterLink>
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <Icon as={FaExclamationCircle} fontSize="6xl" color="red.500" />
                            <Heading size="xl" color="gray.800">Verification Failed</Heading>
                            <Alert.Root status="error" variant="subtle" borderRadius="xl">
                                <Alert.Indicator />
                                <Alert.Description fontWeight="medium">{message}</Alert.Description>
                            </Alert.Root>
                            <Button asChild variant="outline" colorPalette="gray" w="full" h={14} borderRadius="2xl" mt={4}>
                                <RouterLink to="/login">Back to Login</RouterLink>
                            </Button>
                        </>
                    )}
                </VStack>
            </Box>
        </AuthLayout>
    );
};

export default VerifyEmailPage;
