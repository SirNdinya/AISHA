import React from 'react';
import { Box, Flex, HStack, Text, Avatar, Icon, Separator, VStack } from '@chakra-ui/react';
import { Search, Menu } from 'lucide-react';
import { IconButton } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import ThemeToggle from '../../../components/common/ThemeToggle';
import NotificationCenter from '../../../components/common/NotificationCenter';

const CompanyHeader: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <Box
            as="header"
            h="80px"
            w={{ base: "calc(100% - 32px)", lg: "full" }}
            px={{ base: 4, lg: 8 }}
            display="flex"
            alignItems="center"
            className="glass-panel"
            mt={4}
            mx="auto"
            borderRadius="24px"
            maxW={{ base: "full", lg: "calc(100% - 340px)" }}
            ml={{ base: "auto", lg: "300px" }}
            zIndex={1100}
        >
            <Flex justify="space-between" align="center" w="full" gap={2}>
                <HStack gap={2}>
                    {/* Search Bar */}
                    <HStack
                        bg="gray.50"
                        px={4}
                        py={2}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        gap={3}
                        w={{ base: "full", md: "400px" }}
                        display={{ base: "none", md: "flex" }}
                    >
                        <Icon as={Search} color="slate.600" />
                        <Text color="slate.600" fontSize="sm" flex="1" truncate>Search students or postings...</Text>
                        <HStack gap={1}>
                            <Box bg="whiteAlpha.200" px={1.5} py={0.5} borderRadius="md">
                                <Text fontSize="10px" color="gray.300">⌘</Text>
                            </Box>
                            <Box bg="whiteAlpha.200" px={1.5} py={0.5} borderRadius="md">
                                <Text fontSize="10px" color="gray.300">K</Text>
                            </Box>
                        </HStack>
                    </HStack>
                </HStack>

                {/* Right Actions */}
                <HStack gap={6}>
                    <HStack gap={4} display={{ base: "none", lg: "flex" }}>
                        <NotificationCenter />
                        <ThemeToggle />
                    </HStack>

                    <Separator orientation="vertical" h="30px" opacity={0.1} />

                    <HStack gap={4}>
                        <VStack align="flex-end" gap={0} display={{ base: "none", md: "flex" }}>
                            <Text fontWeight="bold" fontSize="sm">{user?.firstName} {user?.lastName}</Text>
                        </VStack>
                        <Avatar.Root size="md" border="2px solid" borderColor="indigo.500">
                            <Avatar.Fallback name={`${user?.firstName} ${user?.lastName}`} />
                        </Avatar.Root>
                    </HStack>
                </HStack>
            </Flex>
        </Box>
    );
};

export default CompanyHeader;
