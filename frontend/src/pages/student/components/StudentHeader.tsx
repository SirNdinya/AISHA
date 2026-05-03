import React, { useMemo, useState } from 'react';
import {
    Box, Heading, Text, VStack, Badge, Flex,
    HStack, Button, Container, Image, IconButton
} from '@chakra-ui/react';
import { LuSettings, LuMenu } from "react-icons/lu";
import { X as LuX } from "lucide-react";

import { Avatar } from "../../../components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/authSlice';
import type { AppDispatch, RootState } from '../../../store';
import NotificationCenter from '../../../components/common/NotificationCenter';
import ThemeSwitcher from '../../../components/common/ThemeSwitcher';

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

interface StudentHeaderProps {
    onMenuClick?: () => void;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ onMenuClick }) => {
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
            <Box bg="transparent" borderBottom="1px solid" borderColor="gray.200" py={{ base: 2, lg: 1 }} mb={1} pos="sticky" top={0} zIndex={1100} backdropFilter="blur(20px)">
                <Container maxW="container.xl">
                    <Flex justify="space-between" align="center">
                        <HStack gap={4}>
                            <IconButton
                                aria-label="Toggle navigation"
                                variant="ghost"
                                color="white"
                                display={{ base: "flex", lg: "none" }}
                                onClick={onMenuClick}
                            >
                                <LuMenu size={24} />
                            </IconButton>

                            <Box
                                pos="relative"
                                cursor="pointer"
                                onClick={() => photoUrl && setIsPhotoOpen(true)}
                                role="group"
                                display={{ base: "none", sm: "inline-block" }}
                            >
                                <Avatar
                                    size="md"
                                    border="2px solid"
                                    borderColor={error ? "red.500" : "indigo.400"}
                                    src={photoUrl}
                                    name={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                                    transition="all 0.3s"
                                    _groupHover={{ opacity: 0.7, transform: "scale(1.08)" }}
                                />
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

                            <VStack align="start" gap={0}>
                                <HStack gap={3}>
                                    <Heading size={{ base: "sm", md: "md" }} color="#F8FAFC" fontWeight="black" letterSpacing="tight">
                                        {greeting}, {profile?.last_name || '...'}
                                    </Heading>
                                    {error && <Badge size="sm" colorPalette="red" variant="subtle" fontWeight="bold">SYNC ERROR</Badge>}
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack gap={{ base: 4, md: 8 }}>
                            <HStack gap={{ base: 2, md: 5 }}>
                                <NotificationCenter />
                                <ThemeSwitcher />
                                <IconButton
                                    aria-label="Settings"
                                    variant="ghost"
                                    color="whiteAlpha.600"
                                    _hover={{ color: "indigo.400" }}
                                    onClick={() => navigate('/student/settings')}
                                    size="sm"
                                >
                                    <LuSettings size={20} />
                                </IconButton>
                                <Button 
                                    variant="outline" 
                                    colorPalette="red" 
                                    size="xs" 
                                    onClick={handleLogout} 
                                    border="1px solid" 
                                    borderColor="red.500/30" 
                                    _hover={{ bg: "red.600", color: "white" }}
                                    display={{ base: "flex", lg: "none" }}
                                    px={3}
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
                        <LuX size={20} color="#F8FAFC" />
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
                        borderColor="indigo.400"
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
