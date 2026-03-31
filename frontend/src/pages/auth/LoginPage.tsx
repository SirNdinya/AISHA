import React, { useState } from 'react';
import { Box, Button, Input, VStack, Heading, Text, Flex, Grid, Link, Alert, Icon, HStack, IconButton } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../services/apiClient';
import AuthLayout from '../../components/layout/AuthLayout';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { FaUserGraduate, FaBuilding, FaUniversity, FaUserShield, FaArrowRight, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Determine default portal from URL or environment
    const portalParam = searchParams.get('portal')?.toLowerCase() || import.meta.env.VITE_PORTAL || 'student';
    const [activePortal, setActivePortal] = useState(portalParam);

    const portalConfigs: Record<string, any> = {
        student: { label: 'Student', color: 'blue', icon: FaUserGraduate, title: 'Student Portal' },
        company: { label: 'Company', color: 'purple', icon: FaBuilding, title: 'Employer Portal' },
        institution: { label: 'Institution', color: 'green', icon: FaUniversity, title: 'Institution Portal' },
        admin: { label: 'Admin', color: 'red', icon: FaUserShield, title: 'Admin Gateway' },
    };

    const config = portalConfigs[activePortal] || portalConfigs.student;

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Email is required'),
            password: Yup.string().required('Password is required'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setServerError('');
            try {
                console.log('Attempting login for:', values.email, 'Role:', activePortal.toUpperCase());
                // Ensure the correct role is passed to the backend if needed, 
                // but usually the backend handles routing after login.
                // Here we pass it based on the active portal.
                const response = await apiClient.post('/auth/login', { ...values, role: activePortal.toUpperCase() });
                console.log('Login response:', response.data);

                const { token, user } = response.data;

                if (!token || !user) {
                    throw new Error('Invalid response from server: Missing token or user data.');
                }

                // Set Redux state
                dispatch(setCredentials({ user, token }));

                // Persist (saps_token is already set by setCredentials reducer, 
                // but let's be explicit with the user object if needed for immediate rehydration)
                localStorage.setItem('saps_user', JSON.stringify(user));

                // Route based on ACTUAL role from server
                setTimeout(() => {
                    const role = user.role.toUpperCase();
                    let targetPath = '/dashboard';

                    if (role === 'INSTITUTION') targetPath = '/institution/dashboard';
                    else if (role === 'DEPARTMENT_ADMIN') targetPath = '/department/dashboard';
                    else if (role === 'STUDENT') targetPath = '/student/dashboard';
                    else if (role === 'COMPANY') targetPath = '/company/dashboard';
                    else if (role === 'ADMIN') targetPath = '/admin/dashboard';

                    console.log(`Navigating to ${targetPath} based on role: ${role}`);
                    navigate(targetPath, { replace: true });
                }, 100);

            } catch (err: any) {
                console.error('Login Frontend Error:', err);
                if (err.response?.status === 403 || err.response?.status === 404) {
                    setServerError(err.response.data.message || 'Authentication failed. Please check your credentials and portal.');
                } else if (err.response?.status === 500) {
                    setServerError('Server encountered an error. This has been logged and we are looking into it.');
                } else {
                    setServerError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
                }
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <AuthLayout portal={activePortal}>
            <Box
                bg="rgba(255, 255, 255, 0.85)"
                backdropFilter="blur(20px)"
                p={{ base: 8, md: 10 }}
                borderRadius="3xl"
                boxShadow="2xl"
                border="1px solid"
                borderColor="whiteAlpha.500"
                position="relative"
                overflow="hidden"
            >
                {/* Decorative Portal Identifier */}
                <Box
                    position="absolute"
                    top="-20px"
                    right="-20px"
                    p={10}
                    bg={`${config.color}.500`}
                    borderRadius="full"
                    opacity={0.05}
                    transform="scale(2)"
                >
                    <Icon as={config.icon} boxSize={20} />
                </Box>

                <VStack gap={8} align="stretch" position="relative" zIndex={1}>
                    <VStack gap={4} textAlign="center">
                        <Box
                            p={4}
                            bg={`${config.color}.500`}
                            borderRadius="2xl"
                            color="white"
                            boxShadow={`0 10px 20px -5px var(--chakra-colors-${config.color}-500)`}
                        >
                            <Icon as={config.icon} boxSize={8} />
                        </Box>
                        <Box>
                            <Heading size="2xl" mb={1} color={`${config.color}.700`} fontWeight="black" letterSpacing="tight">
                                {config.title}
                            </Heading>
                            <Text color="gray.500" fontWeight="medium">Secure Access Node • {config.label} Authorization</Text>
                        </Box>
                    </VStack>

                    {serverError && (
                        <Box p={4} bg="red.50" color="red.600" borderRadius="xl" border="1px solid" borderColor="red.200">
                            <Flex align="center" gap={3}>
                                <Icon as={FaEnvelope} color="red.500" />
                                <Text fontSize="sm" fontWeight="semibold">{serverError}</Text>
                            </Flex>
                        </Box>
                    )}

                    <form onSubmit={formik.handleSubmit}>
                        <VStack gap={5}>
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
                                    border="1px solid"
                                    borderColor={formik.touched.email && formik.errors.email ? "red.300" : "gray.200"}
                                    _focus={{ borderColor: `${config.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${config.color}-400)` }}
                                />
                                {formik.touched.email && formik.errors.email && (
                                    <Text color="red.500" fontSize="xs" mt={1} fontWeight="semibold">{formik.errors.email}</Text>
                                )}
                            </Box>

                            <Box w="full">
                                <Flex justify="space-between" mb={1.5}>
                                    <Flex align="center" gap={2} color="gray.500">
                                        <Icon as={FaLock} fontSize="xs" />
                                        <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">Password</Text>
                                    </Flex>
                                    <Link asChild fontSize="xs" fontWeight="bold" color={`${config.color}.600`}>
                                        <RouterLink to="/forgot-password">Forgot Password?</RouterLink>
                                    </Link>
                                </Flex>
                                <Box position="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.password}
                                        placeholder="••••••••"
                                        h={14}
                                        borderRadius="2xl"
                                        bg="white"
                                        color="gray.800"
                                        border="1px solid"
                                        borderColor={formik.touched.password && formik.errors.password ? "red.300" : "gray.200"}
                                        _focus={{ borderColor: `${config.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${config.color}-400)` }}
                                        pr={12}
                                    />
                                    <IconButton
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        variant="ghost"
                                        position="absolute"
                                        right={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        onClick={() => setShowPassword(!showPassword)}
                                        color="gray.400"
                                        _hover={{ bg: "transparent", color: "gray.600" }}
                                    >
                                        <Icon as={showPassword ? FaEyeSlash : FaEye} />
                                    </IconButton>
                                </Box>
                                {formik.touched.password && formik.errors.password && (
                                    <Text color="red.500" fontSize="xs" mt={1} fontWeight="semibold">{formik.errors.password}</Text>
                                )}
                            </Box>

                            <Button
                                type="submit"
                                loading={loading}
                                colorPalette={config.color}
                                w="full"
                                size="lg"
                                h={16}
                                borderRadius="2xl"
                                fontWeight="black"
                                fontSize="lg"
                                boxShadow="xl"
                                _hover={{ transform: 'translateY(-2px)' }}
                            >
                                <Flex align="center" gap={3}>
                                    <Text>Login to Account</Text>
                                    <Icon as={FaArrowRight} />
                                </Flex>
                            </Button>
                        </VStack>
                    </form>

                    <Flex justify="center" gap={2} align="center">
                        <Text fontSize="sm" color="gray.500" fontWeight="medium">Don't have an account?</Text>
                        <Link asChild fontSize="sm" color={`${config.color}.600`} fontWeight="bold">
                            <RouterLink to="/register">Register Here</RouterLink>
                        </Link>
                    </Flex>
                </VStack>
            </Box>
        </AuthLayout>
    );
};

export default LoginPage;
