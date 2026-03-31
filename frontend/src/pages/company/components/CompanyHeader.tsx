
import React from 'react';
import { Box, Flex, HStack, Text, Avatar, IconButton, Badge, Icon, Separator, VStack } from '@chakra-ui/react';
import { LuBell, LuSearch, LuCommand } from 'react-icons/lu';
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
            w="full"
            px={8}
            display="flex"
            alignItems="center"
            className="glass-panel"
            mt={4}
            mx="auto"
            borderRadius="24px"
            maxW="calc(100% - 340px)"
            ml="300px"
        >
            <Flex justify="space-between" align="center" w="full">
                {/* Search Bar */}
                <HStack
                    bg="whiteAlpha.100"
                    px={4}
                    py={2}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    gap={3}
                    w="400px"
                    display={{ base: "none", md: "flex" }}
                >
                    <Icon as={LuSearch} color="gray.400" />
                    <Text color="gray.400" fontSize="sm" flex="1">Search student DNA / postings...</Text>
                    <HStack gap={1}>
                        <Box bg="whiteAlpha.200" px={1.5} py={0.5} borderRadius="md">
                            <Text fontSize="10px" color="gray.300">⌘</Text>
                        </Box>
                        <Box bg="whiteAlpha.200" px={1.5} py={0.5} borderRadius="md">
                            <Text fontSize="10px" color="gray.300">K</Text>
                        </Box>
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
                            <Badge colorPalette="purple" size="xs" variant="solid" borderRadius="md">
                                ENTERPRISE ADMIN
                            </Badge>
                        </VStack>
                        <Avatar.Root size="md" border="2px solid" borderColor="blue.500">
                            <Avatar.Fallback name={`${user?.firstName} ${user?.lastName}`} />
                        </Avatar.Root>
                    </HStack>
                </HStack>
            </Flex>
        </Box>
    );
};

export default CompanyHeader;
