import React, { useMemo, useState } from 'react';
import {
    Box, Heading, Text, VStack, Badge, Flex,
    HStack, Button, Container, Image, IconButton
} from '@chakra-ui/react';
import { LuSettings, LuX } from "react-icons/lu";
import { Avatar } from "../../../components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/authSlice';
import type { AppDispatch, RootState } from '../../../store';
import NotificationCenter from '../../../components/common/NotificationCenter';

interface StudentHeaderProps {
}

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

const StudentHeader: React.FC<StudentHeaderProps> = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { profile } = useSelector((state: RootState) => state.student);
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
            <Box bg="transparent" borderBottom="1px solid" borderColor="whiteAlpha.100" py={{ base: 4, md: 2 }} mb={2} pos="sticky" top={0} zIndex={1100} backdropFilter="blur(20px)">
                <Container maxW="container.xl">
                    <Flex justify="space-between" align={{ base: "center", md: "flex-end" }} gap={4}>
                        <HStack gap={4}>
                            <Box
                                pos="relative"
                                cursor="pointer"
                                onClick={() => photoUrl && setIsPhotoOpen(true)}
                                role="group"
                                display="inline-block"
                            >
                                <Avatar
                                    size={{ base: "md", md: "lg" }}
                                    border="2px solid"
                                    borderColor="indigo.400"
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
                                        <Text fontSize="10px" fontWeight="bold" color="white" textAlign="center" lineHeight="1.2" px={2}>
                                            VIEW
                                        </Text>
                                    </Box>
                                )}
                            </Box>

                            <VStack align="start" gap={0}>
                                <HStack gap={3}>
                                    <Heading size={{ base: "md", md: "lg" }} color="#F8FAFC" fontWeight="black" letterSpacing="tight">
                                        {greeting}, {profile?.last_name || '...'}
                                    </Heading>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack gap={8}>
                            <HStack gap={5}>
                                <NotificationCenter />
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
                                    colorPalette="indigo" 
                                    size="sm" 
                                    onClick={handleLogout} 
                                    border="1px solid" 
                                    borderColor="indigo.900" 
                                    _hover={{ bg: "indigo.900", color: "white" }}
                                    display={{ base: "none", md: "flex" }}
                                >
                                    SIGN OUT
                                </Button>
                            </HStack>
                        </HStack>
                    </Flex>
                </Container>
            </Box>

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
                        <LuX size={24} color="#F8FAFC" />
                    </Box>

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
                </Box>
            )}
        </>
    );
};

export default StudentHeader;
