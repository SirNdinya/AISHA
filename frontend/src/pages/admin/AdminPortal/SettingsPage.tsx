import React, { useState } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    Input,
    VStack,
    HStack,
    Icon,
    Separator,
    Grid,
    GridItem,
    IconButton,
    Spinner,
    List,
    chakra
} from '@chakra-ui/react';
import { Settings, Lock, User, Building, Mail, Eye, EyeOff } from 'lucide-react';
import { FaSearch } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../../../store';
import { toaster } from '../../../components/ui/toaster';
import apiClient from '../../../services/apiClient';
import { updateUser } from '../../../store/authSlice';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

const SettingsPage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false);

    // University Autocomplete State
    const [universities, setUniversities] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Form state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        institutionName: user?.institutionName || '',
        email: user?.email || '',
    });

    const searchUniversities = async (query: string) => {
        if (query.length < 3) {
            setUniversities([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await axios.get(`http://universities.hipolabs.com/search?name=${query}`);
            setUniversities(response.data.slice(0, 10));
            setShowSuggestions(true);
        } catch (err) {
            console.error('Failed to fetch universities', err);
        } finally {
            setIsSearching(false);
        }
    };

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleProfileUpdate = async () => {
        setIsLoading(true);
        try {
            // Updated to use the institutional settings endpoint
            const payload = user?.role === 'INSTITUTION' 
                ? { institutionName: profileData.institutionName }
                : { firstName: profileData.firstName, lastName: profileData.lastName };

            await apiClient.patch('/institutions/settings', payload);

            // Dispatch action to update Redux store
            dispatch(updateUser(payload));

            toaster.create({ title: "Success", description: "Profile updated successfully.", type: "success" });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toaster.create({ title: "Error", description: error.response?.data?.message || "Failed to update profile", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toaster.create({ title: "Validation Error", description: "New passwords do not match", type: "error" });
            return;
        }

        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toaster.create({ title: "Validation Error", description: "Please enter both current and new passwords", type: "error" });
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            toaster.create({ title: "Success", description: "Password updated successfully.", type: "success" });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Error updating password:', error);
            toaster.create({ title: "Error", description: error.response?.data?.message || "Failed to update password", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box animation="fadeIn 0.5s ease-out" maxW="1200px" mx="auto">
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="xl" fontWeight="black" letterSpacing="tight" color="#F8FAFC">Account Settings</Heading>
                    <Text color="var(--terminal-accent)" fontSize="md">Manage your profile, security, and preferences</Text>
                </Box>
            </Flex>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
                {/* Profile Settings */}
                <GridItem>
                    <Box className="glass-card" p={8} borderRadius="30px" h="100%">
                        <HStack mb={6}>
                            <Box p={3} borderRadius="15px" bg="whiteAlpha.100">
                                <Icon as={User} boxSize={5} color="var(--terminal-accent)" />
                            </Box>
                            <Heading size="md" color="#F8FAFC">Profile Information</Heading>
                        </HStack>

                        <VStack gap={5} align="stretch">
                            {user?.role === 'INSTITUTION' ? (
                                <Box position="relative">
                                    <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">INSTITUTION NAME</Text>
                                    <HStack position="relative">
                                        <Input
                                            value={profileData.institutionName}
                                            onChange={(e) => {
                                                setProfileData({ ...profileData, institutionName: e.target.value });
                                                searchUniversities(e.target.value);
                                            }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            bg="whiteAlpha.50"
                                            border="1px solid"
                                            borderColor="var(--terminal-border)"
                                            borderRadius="xl"
                                            h={12}
                                            color="#F8FAFC"
                                            placeholder="Type to search..."
                                            _placeholder={{ color: "whiteAlpha.400" }}
                                            _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                                        />
                                        {isSearching && (
                                            <Box position="absolute" right={4}>
                                            <Spinner size="xs" color="brand.500" />
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
                                                            color="slate.800"
                                                            _hover={{ bg: "brand.50", color: "brand.700" }}
                                                            onClick={() => {
                                                                setProfileData({ ...profileData, institutionName: uni.name });
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
                                </Box>
                            ) : (
                                <>
                                    <Box>
                                        <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">FIRST NAME</Text>
                                        <Input
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({ ...profileData as any, firstName: e.target.value })}
                                            bg="whiteAlpha.50"
                                            border="1px solid"
                                            borderColor="var(--terminal-border)"
                                            borderRadius="xl"
                                            h={12}
                                            color="#F8FAFC"
                                            _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                                        />
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">LAST NAME</Text>
                                        <Input
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData({ ...profileData as any, lastName: e.target.value })}
                                            bg="whiteAlpha.50"
                                            border="1px solid"
                                            borderColor="var(--terminal-border)"
                                            borderRadius="xl"
                                            h={12}
                                            color="#F8FAFC"
                                            _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                                        />
                                    </Box>
                                </>
                            )}

                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">EMAIL ADDRESS (READ-ONLY)</Text>
                                <Flex position="relative">
                                    <Input
                                        value={profileData.email}
                                        readOnly
                                        bg="whiteAlpha.100"
                                        border="1px solid"
                                        borderColor="var(--terminal-border)"
                                        borderRadius="xl"
                                        pl={10}
                                        h={12}
                                        color="whiteAlpha.500"
                                        _disabled={{ opacity: 0.7 }}
                                    />
                                    <Icon as={Mail} position="absolute" left={3} top="50%" transform="translateY(-50%)" color="whiteAlpha.400" />
                                </Flex>
                                <Text fontSize="xs" color="whiteAlpha.500" mt={1}>Contact standard support to change your email</Text>
                            </Box>

                            <Button
                                mt={4}
                                bg="var(--terminal-accent)"
                                color="black"
                                h={12}
                                borderRadius="xl"
                                onClick={handleProfileUpdate}
                                loading={isLoading}
                                _hover={{ opacity: 0.9, transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                            >
                                Save Changes
                            </Button>
                        </VStack>
                    </Box>
                </GridItem>

                {/* Security Settings */}
                <GridItem>
                    <Box className="glass-card" p={8} borderRadius="30px" h="100%">
                        <HStack mb={6}>
                            <Box p={3} borderRadius="15px" bg="whiteAlpha.100">
                                <Icon as={Lock} boxSize={5} color="var(--terminal-accent)" />
                            </Box>
                            <Heading size="md" color="#F8FAFC">Security & Password</Heading>
                        </HStack>

                        <VStack gap={5} align="stretch">
                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">CURRENT PASSWORD</Text>
                                <Flex position="relative">
                                    <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        bg="whiteAlpha.50"
                                        border="1px solid"
                                        borderColor="var(--terminal-border)"
                                        borderRadius="xl"
                                        h={12}
                                        pr={10}
                                        color="#F8FAFC"
                                        _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                                    />
                                    <IconButton
                                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                    variant="ghost"
                                    size="sm"
                                    position="absolute"
                                    right={2}
                                    top="50%"
                                    transform="translateY(-50%)"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    color="whiteAlpha.400"
                                >
                                    <Icon as={showCurrentPassword ? EyeOff : Eye} color="var(--terminal-accent)" />
                                </IconButton>
                                </Flex>
                            </Box>

                            <Separator opacity={0.1} my={2} />

                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">NEW PASSWORD</Text>
                                <Flex position="relative">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        bg="whiteAlpha.50"
                                        border="1px solid"
                                        borderColor="var(--terminal-border)"
                                        borderRadius="xl"
                                        h={12}
                                        pr={10}
                                        color="#F8FAFC"
                                        _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                                    />
                                    <IconButton
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                        variant="ghost"
                                        size="sm"
                                        position="absolute"
                                        right={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        color="whiteAlpha.400"
                                        _hover={{ color: "var(--terminal-accent)" }}
                                    >
                                        <Icon as={showNewPassword ? EyeOff : Eye} />
                                    </IconButton>
                                </Flex>
                            </Box>

                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="bold" letterSpacing="widest">CONFIRM NEW PASSWORD</Text>
                                <Flex position="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        bg="whiteAlpha.50"
                                        border="1px solid"
                                        borderColor="var(--terminal-border)"
                                        borderRadius="xl"
                                        h={12}
                                        pr={10}
                                        color="#F8FAFC"
                                        _focus={{ bg: "whiteAlpha.100", ring: 1, ringColor: "var(--terminal-accent)" }}
                                    />
                                    <IconButton
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        variant="ghost"
                                        size="sm"
                                        position="absolute"
                                        right={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        color="whiteAlpha.400"
                                        _hover={{ color: "var(--terminal-accent)" }}
                                    >
                                        <Icon as={showConfirmPassword ? EyeOff : Eye} />
                                    </IconButton>
                                </Flex>
                            </Box>

                            <Button
                                variant="solid"
                                colorPalette="teal"
                                h={12}
                                borderRadius="xl"
                                onClick={handlePasswordUpdate}
                                loading={isLoading}
                                _hover={{ transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                            >
                                Update Password
                            </Button>
                        </VStack>
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default SettingsPage;
