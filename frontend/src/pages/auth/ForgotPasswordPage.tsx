import React, { useState } from 'react';
import { Box, Button, Input, VStack, Heading, Text, Flex, Link, Alert, Icon } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../services/apiClient';
import AuthLayout from '../../components/layout/AuthLayout';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ForgotPasswordPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);

    const formik = useFormik({
        initialValues: {
            email: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Email is required'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setServerError('');
            try {
                await apiClient.post('/auth/forgot-password', values);
                setSuccess(true);
            } catch (err: any) {
                setServerError(err.response?.data?.message || 'Request failed. Please try again.');
            } finally {
                setLoading(false);
            }
        },
    });

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
            >
                <VStack gap={8} align="stretch">
                    <Box textAlign="center">
                        <Heading size="2xl" mb={2} fontWeight="black" color="gray.800">
                            Reset Password
                        </Heading>
                        <Text color="gray.500" fontWeight="medium">
                            {success ? "Check your email for instructions" : "Enter your email address to receive a reset link"}
                        </Text>
                    </Box>

                    {success ? (
                        <VStack gap={6} py={4}>
                            <Icon as={FaCheckCircle} fontSize="6xl" color="green.500" />
                            <Text textAlign="center" color="gray.600">
                                We've sent a password reset link to <b>{formik.values.email}</b>.
                                Please check your inbox and follow the instructions.
                            </Text>
                            <Button asChild colorPalette="brand" variant="solid" w="full" h={14} borderRadius="2xl">
                                <RouterLink to="/login">Back to Login</RouterLink>
                            </Button>
                        </VStack>
                    ) : (
                        <>
                            {serverError && (
                                <Alert.Root status="error" variant="subtle" borderRadius="xl">
                                    <Alert.Indicator />
                                    <Alert.Description fontSize="sm">{serverError}</Alert.Description>
                                </Alert.Root>
                            )}

                            <form onSubmit={formik.handleSubmit}>
                                <VStack gap={6}>
                                    <Box w="full">
                                        <Flex align="center" mb={1.5} gap={2} color="gray.500">
                                            <Icon as={FaEnvelope} fontSize="xs" />
                                            <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">Email Address</Text>
                                        </Flex>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.email}
                                            placeholder="name@example.com"
                                            h={14}
                                            borderRadius="2xl"
                                            bg="white"
                                            color="gray.800"
                                            borderColor={formik.touched.email && formik.errors.email ? "red.300" : "gray.200"}
                                            _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                                            autoComplete="email"
                                        />
                                    </Box>

                                    <Button
                                        type="submit"
                                        loading={loading}
                                        colorPalette="brand"
                                        w="full"
                                        h={16}
                                        borderRadius="2xl"
                                        fontWeight="black"
                                        fontSize="lg"
                                        boxShadow="xl"
                                    >
                                        Send Reset Link
                                    </Button>

                                    <Link asChild fontSize="sm" color="gray.500" fontWeight="bold" _hover={{ color: "brand.600" }}>
                                        <RouterLink to="/login">
                                            <Flex align="center" gap={2}>
                                                <FaArrowLeft />
                                                <Text>Back to Login</Text>
                                            </Flex>
                                        </RouterLink>
                                    </Link>
                                </VStack>
                            </form>
                        </>
                    )}
                </VStack>
            </Box>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
