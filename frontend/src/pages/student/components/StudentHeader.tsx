import React, { useMemo, useState } from 'react';
import {
    Box, Heading, Text, VStack, Badge, Flex,
    HStack, Icon, Button, Container, Image
} from '@chakra-ui/react';
import { LuSettings, LuX } from "react-icons/lu";
import { Avatar } from "../../../components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/authSlice';
import type { AppDispatch, RootState } from '../../../store';
import NotificationCenter from '../../../components/common/NotificationCenter';

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

const StudentHeader: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { profile, error } = useSelector((state: RootState) => state.student);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    }, []);

    const photoUrl = getMediaUrl(profile?.profile_picture_url);

    return (
        <>
            <Box bg="transparent" borderBottom="1px solid" borderColor="whiteAlpha.100" py={6} mb={8} pos="sticky" top={0} zIndex={10} backdropFilter="blur(20px)">
                <Container maxW="container.xl">
                    <Flex justify="space-between" align="flex-end">
                        <VStack align="start" gap={4}>
                            <Box
                                pos="relative"
                                cursor="pointer"
                                onClick={() => photoUrl && setIsPhotoOpen(true)}
                                role="group"
                                display="inline-block"
                            >
                                <Avatar
                                    size="md"
                                    border="2px solid"
                                    borderColor={error ? "red.500" : "cyan.400"}
                                    src={photoUrl}
                                    name={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                                    transition="all 0.3s"
                                    _groupHover={{ opacity: 0.7, transform: "scale(1.08)" }}
                                />
                                {/* "Click to view" overlay — only shown if there's a real photo */}
                                {photoUrl && (
                                    <Box
                                        pos="absolute"
                                        inset={0}
                                        borderRadius="full"
                                        bg="blackAlpha.700"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        opacity={0}
                                        transition="opacity 0.2s"
                                        _groupHover={{ opacity: 1 }}
                                        pointerEvents="none"
                                    >
                                        <Text fontSize="7px" fontWeight="bold" color="white" textAlign="center" lineHeight="1.2" px={1}>
                                            VIEW
                                        </Text>
                                    </Box>
                                )}
                            </Box>

                            <VStack align="start" gap={1}>
                                <HStack gap={3}>
                                    <Heading size="md" color="white" fontWeight="black" letterSpacing="tight">
                                        {greeting}, {profile?.last_name || '...'}
                                    </Heading>
                                    {error && <Badge size="sm" colorPalette="red" variant="subtle" fontWeight="bold">SYNC_ERROR</Badge>}
                                </HStack>
                                {/* Subtext removed per user request */}
                            </VStack>
                        </VStack>

                        <HStack gap={8} mb={1}>
                            <HStack gap={5}>
                                <NotificationCenter />
                                <Icon
                                    as={LuSettings}
                                    cursor="pointer"
                                    color="whiteAlpha.600"
                                    _hover={{ color: "cyan.400" }}
                                    onClick={() => navigate('/student/settings')}
                                    boxSize={5}
                                />
                                <Button 
                                    variant="outline" 
                                    colorPalette="cyan" 
                                    size="sm" 
                                    onClick={handleLogout} 
                                    border="1px solid" 
                                    borderColor="cyan.900" 
                                    _hover={{ bg: "cyan.900", color: "white" }}
                                    display={{ base: "flex", lg: "none" }}
                                >
                                    LOGOUT
                                </Button>
                            </HStack>
                        </HStack>
                    </Flex>
                </Container>
            </Box>

            {/* Lightbox: full-screen photo preview */}
            {isPhotoOpen && (
                <Box
                    pos="fixed"
                    inset={0}
                    zIndex={9999}
                    bg="blackAlpha.900"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => setIsPhotoOpen(false)}
                    backdropFilter="blur(8px)"
                    animation="fadeIn 0.2s ease"
                    style={{ cursor: 'zoom-out' }}
                >
                    {/* Close button */}
                    <Box
                        pos="absolute"
                        top={4}
                        right={4}
                        bg="whiteAlpha.200"
                        borderRadius="full"
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: "whiteAlpha.300" }}
                        onClick={(e) => { e.stopPropagation(); setIsPhotoOpen(false); }}
                        zIndex={1}
                    >
                        <LuX size={20} color="white" />
                    </Box>

                    {/* Photo */}
                    <Image
                        src={photoUrl}
                        alt={`${profile?.first_name} ${profile?.last_name}`}
                        maxH="85vh"
                        maxW="85vw"
                        objectFit="contain"
                        borderRadius="xl"
                        border="2px solid"
                        borderColor="cyan.400"
                        boxShadow="0 0 60px rgba(0, 200, 255, 0.2)"
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'default' }}
                    />

                    {/* Name caption */}
                    <Box pos="absolute" bottom={6} textAlign="center">
                        <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                            {profile?.first_name} {profile?.last_name}
                        </Text>
                    </Box>
                </Box>
            )}
        </>
    );
};

export default StudentHeader;
