import React, { useState, useEffect } from 'react';
import { Box, Button, Input, VStack, Heading, Text, Flex, Grid, SimpleGrid, Link, Alert, Icon, HStack, Spinner, List, IconButton, chakra } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import apiClient from '../../services/apiClient';
import AuthLayout from '../../components/layout/AuthLayout';
import { FaUserGraduate, FaBuilding, FaUniversity, FaCheckCircle, FaExclamationCircle, FaArrowRight, FaArrowLeft, FaEnvelope, FaLock, FaUser, FaSearch, FaEye, FaEyeSlash, FaMagic } from 'react-icons/fa';
import { ProgressBar } from '../../components/ui/progress';

const MotionBox = motion(Box);

const RegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState(import.meta.env.VITE_PORTAL?.toUpperCase() || '');
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    const [emailSent, setEmailSent] = useState(true);
    const [emailError, setEmailError] = useState('');
    const [universities, setUniversities] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const navigate = useNavigate();

    const roles = [
        { value: 'STUDENT', label: 'Student', icon: FaUserGraduate, desc: 'Find internships & build your career path', color: 'blue' },
        { value: 'COMPANY', label: 'Company', icon: FaBuilding, desc: 'Post opportunities & hire top talent', color: 'purple' },
        { value: 'INSTITUTION', label: 'Institution', icon: FaUniversity, desc: 'Manage your students & programs', color: 'green' },
    ];

    const currentConfig = roles.find(r => r.value === role) || roles[0];

    // University Autocomplete Logic
    const searchUniversities = async (query: string) => {
        if (query.length < 3) {
            setUniversities([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await axios.get(`http://universities.hipolabs.com/search?name=${query}`);
            setUniversities(response.data.slice(0, 10)); // Limit to 10 results
            setShowSuggestions(true);
        } catch (err) {
            console.error('Failed to fetch universities', err);
        } finally {
            setIsSearching(false);
        }
    };

    const calculateStrength = (pass: string) => {
        let strength = 0;
        if (pass.length === 0) return 0;
        if (pass.length >= 8) strength += 20;
        if (/[A-Z]/.test(pass)) strength += 20;
        if (/[a-z]/.test(pass)) strength += 20;
        if (/[0-9]/.test(pass)) strength += 20;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
        return strength;
    };

    const generateStrongPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        // Ensure at least one of each required type
        retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        retVal += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
        retVal += "0123456789"[Math.floor(Math.random() * 26)];
        retVal += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];

        for (let i = 0, n = charset.length; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }

        // Shuffle
        retVal = retVal.split('').sort(() => 0.5 - Math.random()).join('');

        formik.setFieldValue('password', retVal);
        formik.setFieldValue('confirmPassword', retVal);
        setShowPassword(true);
    };

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
            confirmPassword: '',
            institution: '',
            name: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Email is required'),
            password: Yup.string()
                .min(8, 'Password must be at least 8 characters')
                .matches(/[A-Z]/, 'Must contain an uppercase letter')
                .matches(/[a-z]/, 'Must contain a lowercase letter')
                .matches(/[0-9]/, 'Must contain a number')
                .matches(/[^A-Za-z0-9]/, 'Must contain a special character')
                .required('Password is required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords do not match')
                .required('Please confirm your password'),
            institution: Yup.string().when('role', {
                is: (val: string) => val === 'STUDENT' || val === 'INSTITUTION',
                then: (schema) => schema.required('Institution is required'),
                otherwise: (schema) => schema.notRequired(),
            }),
            name: Yup.string().when('role', {
                is: 'COMPANY',
                then: (schema) => schema.required('Company name is required'),
                otherwise: (schema) => schema.notRequired(),
            }),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setServerError('');
            try {
                const response = await apiClient.post('/auth/register', {
                    email: values.email,
                    password: values.password,
                    role,
                    institution: (role === 'STUDENT' || role === 'INSTITUTION') ? values.institution : undefined,
                    name: role === 'COMPANY' ? values.name : undefined
                });
                setEmailSent(response.data.emailSent);
                setEmailError(response.data.emailError || '');
                setSuccess(true);
            } catch (err: any) {
                setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
            } finally {
                setLoading(false);
            }
        },
    });

    const RoleCard = ({ option, isSelected, onClick }: any) => (
        <Button
            type="button"
            onClick={onClick}
            w="full"
            h="auto"
            display="block"
            p={6}
            borderRadius="3xl"
            bg={isSelected ? `${option.color}.500` : 'white'}
            color={isSelected ? 'white' : 'gray.600'}
            border="2px solid"
            borderColor={isSelected ? `${option.color}.600` : 'gray.100'}
            boxShadow={isSelected ? 'xl' : 'sm'}
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
            textAlign="center"
            position="relative"
            overflow="hidden"
        >
            <VStack gap={4}>
                <Box
                    p={4}
                    borderRadius="2xl"
                    bg={isSelected ? 'whiteAlpha.200' : `${option.color}.50`}
                    color={isSelected ? 'white' : `${option.color}.500`}
                >
                    <Icon as={option.icon} fontSize="3xl" />
                </Box>
                <Box>
                    <Text fontWeight="black" fontSize="lg">{option.label}</Text>
                    <Text fontSize="xs" opacity={0.8} fontWeight="medium">{option.desc}</Text>
                </Box>
            </VStack>
            {isSelected && (
                <Box position="absolute" top={4} right={4}>
                    <FaCheckCircle />
                </Box>
            )}
        </Button>
    );

    const PasswordRequirement = ({ label, isMet }: { label: string; isMet: boolean }) => (
        <HStack gap={2} opacity={isMet ? 1 : 0.6} transition="all 0.2s">
            <Icon
                as={isMet ? FaCheckCircle : FaCheckCircle}
                color={isMet ? "green.500" : "gray.300"}
                fontSize="xs"
            />
            <Text fontSize="xs" fontWeight="medium" color={isMet ? "gray.700" : "gray.500"}>
                {label}
            </Text>
        </HStack>
    );

    return (
        <AuthLayout portal={role.toLowerCase()}>
            <Box
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(20px)"
                p={{ base: 8, md: 10 }}
                borderRadius="4xl"
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
                    bg={`${currentConfig.color}.500`}
                    borderRadius="full"
                    opacity={0.05}
                    transform="scale(2)"
                >
                    <Icon as={currentConfig.icon} boxSize={20} />
                </Box>

                <VStack gap={6} align="stretch" position="relative" zIndex={1}>
                    <VStack gap={4} textAlign="center">
                        <Box
                            p={4}
                            bg={`${currentConfig.color}.500`}
                            borderRadius="2xl"
                            color="white"
                            boxShadow={`0 10px 20px -5px var(--chakra-colors-${currentConfig.color}-500)`}
                        >
                            <Icon as={currentConfig.icon} boxSize={8} />
                        </Box>
                        <Box>
                            <Heading size="2xl" mb={1} color={`${currentConfig.color}.700`} fontWeight="black" letterSpacing="tight">
                                {currentConfig.label} Registration
                            </Heading>
                            <Text color="gray.500" fontWeight="medium">Create your {currentConfig.label.toLowerCase()} account Node</Text>
                        </Box>
                    </VStack>

                    {success ? (
                        <VStack gap={6} py={8} textAlign="center">
                            <Icon as={emailSent ? FaCheckCircle : FaExclamationCircle} fontSize="6xl" color={emailSent ? "green.500" : "orange.500"} />
                            <Heading size="lg" color="gray.800">
                                {emailSent ? 'Check Your Email' : 'Account Created'}
                            </Heading>
                            <Text color="gray.600">
                                {emailSent
                                    ? <>We've sent a verification link to <b>{formik.values.email}</b>. Please verify your account to complete registration.</>
                                    : (
                                        <VStack gap={4} align="stretch">
                                            <Text>Registration successful for <b>{formik.values.email}</b>, but we couldn't send the verification email.</Text>
                                            {emailError && (
                                                <Box p={3} bg="red.50" color="red.700" borderRadius="lg" fontSize="xs" textAlign="left" border="1px solid" borderColor="red.100">
                                                    <Text fontWeight="bold" mb={1}>Technical Error Detail:</Text>
                                                    <chakra.code fontSize="8pt" display="block">{emailError}</chakra.code>
                                                </Box>
                                            )}
                                            <Text fontSize="sm" color="gray.500">Please check your SMTP settings or contact support.</Text>
                                        </VStack>
                                    )
                                }
                            </Text>
                            <Button asChild colorPalette={currentConfig.color} w="full" h={14} borderRadius="2xl">
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
                                {!import.meta.env.VITE_PORTAL && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => setStep(1)}
                                        mb={4}
                                        color="gray.400"
                                        _hover={{ color: `${currentConfig.color}.500`, bg: 'transparent' }}
                                    >
                                        <HStack gap={1}>
                                            <Icon as={FaArrowLeft} />
                                            <Text fontWeight="bold">Change Role</Text>
                                        </HStack>
                                    </Button>
                                )}
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
                                            h={12}
                                            borderRadius="xl"
                                            bg="white"
                                            color="gray.800"
                                            borderColor={formik.touched.email && formik.errors.email ? "red.300" : "gray.200"}
                                            _focus={{ borderColor: `${currentConfig.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${currentConfig.color}-400)` }}
                                            autoComplete="email"
                                        />
                                    </Box>

                                    {(role === 'STUDENT' || role === 'INSTITUTION') && (
                                        <Box w="full" position="relative">
                                            <Flex align="center" mb={1.5} gap={2} color="gray.500">
                                                <Icon as={FaUniversity} fontSize="xs" />
                                                <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">Institution</Text>
                                            </Flex>
                                            <HStack position="relative">
                                                <Input
                                                    id="institution"
                                                    name="institution"
                                                    onChange={(e) => {
                                                        formik.handleChange(e);
                                                        searchUniversities(e.target.value);
                                                        setShowSuggestions(true);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    value={formik.values.institution}
                                                    placeholder="Type to search university..."
                                                    h={12}
                                                    borderRadius="xl"
                                                    bg="white"
                                                    color="gray.800"
                                                    borderColor={formik.touched.institution && formik.errors.institution ? "red.300" : "gray.200"}
                                                    _focus={{ borderColor: `${currentConfig.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${currentConfig.color}-400)` }}
                                                />
                                                {isSearching && (
                                                    <Box position="absolute" right={4}>
                                                        <Spinner size="xs" color={`${currentConfig.color}.500`} />
                                                    </Box>
                                                )}
                                            </HStack>

                                            <AnimatePresence>
                                                {showSuggestions && universities.length > 0 && (
                                                    <MotionBox
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        position="absolute"
                                                        top="100%"
                                                        left={0}
                                                        right={0}
                                                        bg="white"
                                                        boxShadow="xl"
                                                        borderRadius="xl"
                                                        zIndex={10}
                                                        maxH="200px"
                                                        overflowY="auto"
                                                        mt={2}
                                                        border="1px solid"
                                                        borderColor="gray.100"
                                                    >
                                                        <List.Root variant="plain">
                                                            {universities.map((uni, idx) => (
                                                                <chakra.button
                                                                    key={idx}
                                                                    type="button"
                                                                    w="full"
                                                                    textAlign="left"
                                                                    p={3}
                                                                    color="gray.700"
                                                                    _hover={{ bg: `${currentConfig.color}.50`, color: `${currentConfig.color}.700` }}
                                                                    onClick={() => {
                                                                        formik.setFieldValue('institution', uni.name);
                                                                        setUniversities([]);
                                                                        setShowSuggestions(false);
                                                                    }}
                                                                    fontSize="sm"
                                                                    fontWeight="medium"
                                                                >
                                                                    <HStack gap={2}>
                                                                        <Icon as={FaSearch} fontSize="xs" opacity={0.4} />
                                                                        <Text truncate>{uni.name}</Text>
                                                                    </HStack>
                                                                </chakra.button>
                                                            ))}
                                                        </List.Root>
                                                    </MotionBox>
                                                )}
                                            </AnimatePresence>
                                            {formik.touched.institution && formik.errors.institution && (
                                                <Text color="red.500" fontSize="xs" mt={1} fontWeight="semibold">{formik.errors.institution}</Text>
                                            )}
                                        </Box>
                                    )}

                                    <Box w="full">
                                        <Flex align="center" mb={1.5} gap={2} color="gray.500">
                                            <Icon as={FaLock} fontSize="xs" />
                                            <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">Password</Text>
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
                                                h={12}
                                                borderRadius="xl"
                                                bg="white"
                                                color="gray.800"
                                                borderColor={formik.touched.password && formik.errors.password ? "red.300" : "gray.200"}
                                                _focus={{ borderColor: `${currentConfig.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${currentConfig.color}-400)` }}
                                                pr={10}
                                                autoComplete="new-password"
                                            />
                                            <HStack position="absolute" right={2} top="50%" transform="translateY(-50%)" gap={0}>
                                                <IconButton
                                                    aria-label="Suggest strong password"
                                                    variant="ghost"
                                                    onClick={generateStrongPassword}
                                                    color={`${currentConfig.color}.500`}
                                                    size="sm"
                                                    _hover={{ bg: `${currentConfig.color}.50` }}
                                                    title="Suggest strong password"
                                                >
                                                    <Icon as={FaMagic} />
                                                </IconButton>
                                                <IconButton
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    variant="ghost"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    color="gray.400"
                                                    size="sm"
                                                    _hover={{ bg: "transparent", color: "gray.600" }}
                                                >
                                                    <Icon as={showPassword ? FaEyeSlash : FaEye} />
                                                </IconButton>
                                            </HStack>
                                        </Box>

                                        {formik.values.password.length > 0 && (
                                            <Box mt={3}>
                                                <ProgressBar
                                                    colorPalette={
                                                        calculateStrength(formik.values.password) < 40 ? 'red' :
                                                            calculateStrength(formik.values.password) < 80 ? 'orange' : 'green'
                                                    }
                                                    size="xs"
                                                    value={calculateStrength(formik.values.password)}
                                                    borderRadius="full"
                                                />
                                                <Flex justify="space-between" mt={1}>
                                                    <Text fontSize="2xs" color="gray.400" fontWeight="bold">STRENGTH</Text>
                                                    <Text fontSize="2xs" color={
                                                        calculateStrength(formik.values.password) < 40 ? 'red.500' :
                                                            calculateStrength(formik.values.password) < 80 ? 'orange.500' : 'green.500'
                                                    } fontWeight="black">
                                                        {calculateStrength(formik.values.password) < 40 ? 'WEAK' :
                                                            calculateStrength(formik.values.password) < 80 ? 'MODERATE' : 'STRONG'}
                                                    </Text>
                                                </Flex>
                                            </Box>
                                        )}

                                    {role === 'COMPANY' && (
                                        <Box w="full">
                                            <Flex align="center" mb={1.5} gap={2} color="gray.500">
                                                <Icon as={FaBuilding} fontSize="xs" />
                                                <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">Company Name</Text>
                                            </Flex>
                                            <Input
                                                id="name"
                                                name="name"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.name}
                                                placeholder="Enter your company name"
                                                h={12}
                                                borderRadius="xl"
                                                bg="white"
                                                color="gray.800"
                                                borderColor={formik.touched.name && formik.errors.name ? "red.300" : "gray.200"}
                                                _focus={{ borderColor: `${currentConfig.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${currentConfig.color}-400)` }}
                                            />
                                            {formik.touched.name && formik.errors.name && (
                                                <Text color="red.500" fontSize="xs" mt={1} fontWeight="semibold">{formik.errors.name}</Text>
                                            )}
                                        </Box>
                                    )}

                                        <AnimatePresence>
                                            {formik.values.password.length > 0 && calculateStrength(formik.values.password) < 100 && (
                                                <MotionBox
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    overflow="hidden"
                                                    mt={3}
                                                    p={3}
                                                    bg="gray.50"
                                                    borderRadius="xl"
                                                    border="1px solid"
                                                    borderColor="gray.100"
                                                >
                                                    <VStack align="stretch" gap={2}>
                                                        <PasswordRequirement
                                                            label="Minimum 8 characters"
                                                            isMet={formik.values.password.length >= 8}
                                                        />
                                                        <PasswordRequirement
                                                            label="At least one uppercase letter"
                                                            isMet={/[A-Z]/.test(formik.values.password)}
                                                        />
                                                        <PasswordRequirement
                                                            label="At least one lowercase letter"
                                                            isMet={/[a-z]/.test(formik.values.password)}
                                                        />
                                                        <PasswordRequirement
                                                            label="At least one number"
                                                            isMet={/[0-9]/.test(formik.values.password)}
                                                        />
                                                        <PasswordRequirement
                                                            label="At least one special character"
                                                            isMet={/[^A-Za-z0-9]/.test(formik.values.password)}
                                                        />
                                                    </VStack>
                                                </MotionBox>
                                            )}
                                        </AnimatePresence>
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
                                                h={12}
                                                borderRadius="xl"
                                                bg="white"
                                                color="gray.800"
                                                borderColor={formik.touched.confirmPassword && formik.errors.confirmPassword ? "red.300" : "gray.200"}
                                                _focus={{ borderColor: `${currentConfig.color}.400`, boxShadow: `0 0 0 1px var(--chakra-colors-${currentConfig.color}-400)` }}
                                                pr={10}
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
                                                size="sm"
                                                _hover={{ bg: "transparent", color: "gray.600" }}
                                            >
                                                <Icon as={showConfirmPassword ? FaEyeSlash : FaEye} />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Button
                                        type="submit"
                                        loading={loading}
                                        colorPalette={currentConfig.color}
                                        w="full"
                                        h={14}
                                        mt={4}
                                        borderRadius="2xl"
                                        fontWeight="black"
                                        fontSize="lg"
                                        boxShadow="xl"
                                    >
                                        Create Account
                                    </Button>
                                </VStack>
                            </form>

                            <Flex justify="center" gap={2} align="center">
                                <Text fontSize="sm" color="gray.500">Already have an account?</Text>
                                <Link asChild fontSize="sm" color="brand.600" fontWeight="bold">
                                    <RouterLink to="/login">Login Here</RouterLink>
                                </Link>
                            </Flex>
                        </>
                    )}
                </VStack>
            </Box>
        </AuthLayout >
    );
};

export default RegisterPage;
