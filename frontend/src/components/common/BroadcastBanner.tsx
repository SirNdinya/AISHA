import React, { useEffect, useState } from 'react';
import { Box, HStack, Icon, Text, Flex, Button } from '@chakra-ui/react';
import { LuX, LuZap, LuTriangleAlert, LuInfo } from 'react-icons/lu';
import apiClient from '../../services/apiClient';

interface Broadcast {
    type: 'MAINTENANCE' | 'UPDATE' | 'GENERAL';
    message: string;
    created_at: string;
}

interface BroadcastBannerProps {
    system: 'STUDENT' | 'COMPANY' | 'INSTITUTION' | 'ADMIN' | 'ALL';
}

const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ system }) => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const fetchBroadcasts = async () => {
        try {
            const res = await apiClient.get(`/public/broadcasts/active?system=${system}`);
            setBroadcasts(res.data.data);
        } catch (error) {
            console.error('Failed to fetch broadcasts', error);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
        const interval = setInterval(fetchBroadcasts, 300000); // Poll every 5 mins
        return () => clearInterval(interval);
    }, [system]);

    useEffect(() => {
        if (broadcasts.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % broadcasts.length);
            }, 8000);
            return () => clearInterval(timer);
        }
    }, [broadcasts]);

    if (!isVisible || broadcasts.length === 0) return null;

    const current = broadcasts[currentIndex];

    const getStyles = () => {
        switch (current.type) {
            case 'MAINTENANCE':
                return { bg: 'orange.600', icon: LuTriangleAlert, label: 'SYSTEM MAINTENANCE' };
            case 'UPDATE':
                return { bg: 'blue.600', icon: LuZap, label: 'VERSION UPDATE' };
            default:
                return { bg: 'purple.600', icon: LuInfo, label: 'ANNOUNCEMENT' };
        }
    };

    const { bg, icon: TypeIcon, label } = getStyles();

    return (
        <Box
            bg={bg}
            color="white"
            py={2.5}
            px={6}
            position="relative"
            overflow="hidden"
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
            zIndex={1000}
            className="broadcast-banner"
            animation="slideDown 0.5s ease-out"
        >
            <Flex align="center" justify="center" maxW="1200px" mx="auto">
                <HStack gap={4} flex={1} justify="center">
                    <HStack bg="whiteAlpha.200" px={3} py={0.5} borderRadius="full">
                        <Icon as={TypeIcon} boxSize={3.5} />
                        <Text fontSize="10px" fontWeight="black" letterSpacing="widest">{label}</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="medium" textAlign="center" letterSpacing="tight">
                        {current.message}
                    </Text>
                </HStack>
                <Button
                    variant="ghost"
                    size="xs"
                    color="whiteAlpha.700"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    onClick={() => setIsVisible(false)}
                    position="absolute"
                    right={4}
                >
                    <LuX size={16} />
                </Button>
            </Flex>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}} />
        </Box>
    );
};

export default BroadcastBanner;
