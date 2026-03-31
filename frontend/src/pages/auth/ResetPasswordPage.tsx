import React from 'react';
import { Box, Button, Input, VStack, Heading, Text, Flex, Alert, Link, Icon, IconButton } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import apiClient from '../../services/apiClient';
import { FaLock, FaCheckCircle, FaExclamationCircle, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ProgressBar } from '../../components/ui/progress';

const ResetPasswordPage: React.FC = () => {
    const [serverError, setServerError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const portal = searchParams.get('portal')?.toLowerCase() || 'student';
    const navigate = useNavigate();

    const portalColors: Record<string, string> = {
        student: 'blue',
        company: 'purple',
        institution: 'green',
        admin: 'red'
    };

    const activeColor = portalColors[portal] || 'blue';

    const calculateStrength = (pass: string) => {
        let strength = 0;
        if (pass.length > 5) strength += 20;
        if (pass.length > 8) strength += 20;
        if (/[A-Z]/.test(pass)) strength += 20;
        if (/[0-9]/.test(pass)) strength += 20;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
        return strength;
    };

    const formik = useFormik({
        initialValues: {
            password: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            password: Yup.string()
                .min(8, 'Password must be at least 8 characters')
                .matches(/[A-Z]/, 'Requires an uppercase letter')
                .matches(/[0-9]/, 'Requires a number')
                .required('New password is required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords do not match')
                .required('Confirm your new password'),
        }),
        onSubmit: async (values) => {
            if (calculateStrength(values.password) < 40) {
                setServerError("Password is too weak. Please include more variations.");
                return;
            }

            setLoading(true);
            setServerError('');
            setSuccess('');

            try {
                await apiClient.post('/auth/reset-password', { token, password: values.password });
                setSuccess('Password reset successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2500);
            } catch (err: any) {
                setServerError(err.response?.data?.message || 'Password reset failed. The link may have expired.');
            } finally {
                setLoading(false);
            }
        },
    });

    const strength = calculateStrength(formik.values.password);
    const strengthColor = strength < 40 ? 'red' : strength < 80 ? 'orange' : 'green';

    if (!token) {
        return (
            <AuthLayout>
                <Alert.Root status="error" variant="subtle" borderRadius="2xl">
                    <Alert.Indicator />
                    <Box flex="1">
                        <Alert.Title fontWeight="black">Invalid Link</Alert.Title>
                        <Alert.Description fontSize="sm">The password reset token is missing or invalid.</Alert.Description>
                    </Box>
                </Alert.Root>
            </AuthLayout>
        )
    }

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
                        <Heading size="2xl" mb={2} fontWeight="black" color={`${activeColor}.600`}>
                            {portal.charAt(0).toUpperCase() + portal.slice(1)} Reset
                        </Heading>
                        <Text color="gray.500" fontWeight="medium">Secure your account with a new password</Text>
                    </Box>

                    {success && (
                        <Alert.Root status="success" variant="subtle" borderRadius="xl">
                            <Alert.Indicator />
                            <Alert.Description fontSize="sm">{success}</Alert.Description>
                        </Alert.Root>
                    )}

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
                                    <Icon as={FaShieldAlt} fontSize="xs" />
                                    <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">New Password</Text>
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
                                        borderColor={formik.touched.password && formik.errors.password ? "red.300" : "gray.200"}
                                        _focus={{ borderColor: `${activeColor}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${activeColor}-400)` }}
                                        pr={12}
                                        autoComplete="new-password"
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
                                <ProgressBar colorPalette={strengthColor} size="xs" value={strength} mt={3} borderRadius="full" />
                                <Flex justify="space-between" mt={1}>
                                    <Text fontSize="2xs" color="gray.400" fontWeight="bold">STRENGTH</Text>
                                    <Text fontSize="2xs" color={`${strengthColor}.500`} fontWeight="black">
                                        {strength < 40 ? 'WEAK' : strength < 80 ? 'MODERATE' : 'STRONG'}
                                    </Text>
                                </Flex>
                                {formik.touched.password && formik.errors.password && (
                                    <Text color="red.500" fontSize="xs" mt={1} fontWeight="semibold">{formik.errors.password}</Text>
                                )}
                            </Box>

                            <Box w="full">
                                <Flex align="center" mb={1.5} gap={2} color="gray.500">
                                    <Icon as={FaCheckCircle} fontSize="xs" />
                                    <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">Confirm Password</Text>
                                </Flex>
                                <Box position="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.confirmPassword}
                                        placeholder="••••••••"
                                        h={14}
                                        borderRadius="2xl"
                                        bg="white"
                                        color="gray.800"
                                        borderColor={formik.touched.confirmPassword && formik.errors.confirmPassword ? "red.300" : "gray.200"}
                                        _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                                        pr={12}
                                        autoComplete="new-password"
                                    />
                                    <IconButton
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        variant="ghost"
                                        position="absolute"
                                        right={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        color="gray.400"
                                        _hover={{ bg: "transparent", color: "gray.600" }}
                                    >
                                        <Icon as={showConfirmPassword ? FaEyeSlash : FaEye} />
                                    </IconButton>
                                </Box>
                                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                    <Text color="red.500" fontSize="xs" mt={1} fontWeight="semibold">{formik.errors.confirmPassword}</Text>
                                )}
                            </Box>

                            <Button
                                type="submit"
                                loading={loading}
                                colorPalette={activeColor}
                                w="full"
                                h={16}
                                borderRadius="2xl"
                                fontWeight="black"
                                fontSize="lg"
                                boxShadow="xl"
                                _hover={{ transform: 'translateY(-2px)' }}
                            >
                                <Flex align="center" gap={3}>
                                    <Icon as={FaLock} />
                                    <Text>Set New Password</Text>
                                </Flex>
                            </Button>
                        </VStack>
                    </form>

                    <Flex justify="center">
                        <Link asChild fontSize="sm" color={`${activeColor}.600`} fontWeight="bold" _hover={{ opacity: 0.8 }}>
                            <RouterLink to="/login">← Back to Login</RouterLink>
                        </Link>
                    </Flex>
                </VStack>
            </Box>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
