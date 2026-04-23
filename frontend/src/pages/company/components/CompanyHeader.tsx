
import React from 'react';
import { Box, Flex, HStack, Text, Avatar, Icon, Separator, VStack, Input } from '@chakra-ui/react';
import { LuSearch } from 'react-icons/lu';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import type { RootState } from '../../../store';
import ThemeToggle from '../../../components/common/ThemeToggle';
import NotificationCenter from '../../../components/common/NotificationCenter';

const CompanyHeader: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setSearchParams(prev => {
            if (newQuery) {
                prev.set('search', newQuery);
            } else {
                prev.delete('search');
            }
            return prev;
        }, { replace: true });
    };

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
            zIndex={1100}
        >
            <Flex justify="space-between" align="center" w="full">
                {/* Search Bar */}
                <HStack
                    bg="rgba(255, 255, 255, 0.7)"
                    px={4}
                    py={1.5}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="whiteAlpha.400"
                    gap={3}
                    w="400px"
                    display={{ base: "none", md: "flex" }}
                >
                    <Icon as={LuSearch} color="black" />
                    <Input
                        variant="flushed"
                        border="none"
                        _focus={{ outline: "none", boxShadow: "none" }}
                        color="black"
                        _placeholder={{ color: "gray.600" }}
                        fontSize="sm"
                        flex="1"
                        placeholder="Search students or postings..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <HStack gap={1}>
                        <Box bg="blackAlpha.200" px={1.5} py={0.5} borderRadius="md">
                            <Text fontSize="10px" color="black">⌘</Text>
                        </Box>
                        <Box bg="blackAlpha.200" px={1.5} py={0.5} borderRadius="md">
                            <Text fontSize="10px" color="black">K</Text>
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
