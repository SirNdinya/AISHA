import React, { useState } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Button,
    Flex,
    Input,
    Icon,
} from '@chakra-ui/react';
import { MessageSquareText } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    description: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    defaultValue?: string;
}

const PromptModal: React.FC<PromptModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    placeholder = "Type here...",
    confirmText = "Submit",
    cancelText = "Cancel",
    defaultValue = ""
}) => {
    const [value, setValue] = useState(defaultValue);

    if (!isOpen) return null;

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.7)"
            backdropFilter="blur(10px)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={2000}
            onClick={onClose}
        >
            <Box
                className="glass-card"
                maxW="450px"
                w="90%"
                p={8}
                borderRadius="32px"
                onClick={(e) => e.stopPropagation()}
                animation="slideUp 0.3s ease-out"
                border="1px solid rgba(255, 255, 255, 0.1)"
                boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            >
                <VStack gap={6} align="stretch">
                    <Box textAlign="center">
                        <Box p={4} borderRadius="full" bg="rgba(167, 139, 250, 0.1)" w="fit-content" mx="auto" mb={4}>
                            <Icon as={MessageSquareText} boxSize={8} color="purple.400" />
                        </Box>
                        <Heading size="md" mb={2} color="white">{title}</Heading>
                        <Text color="gray.400" fontSize="sm">{description}</Text>
                    </Box>

                    <Input
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onConfirm(value);
                                onClose();
                            }
                        }}
                        bg="rgba(255, 255, 255, 0.05)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        borderRadius="xl"
                        h={14}
                        px={4}
                        color="white"
                        _focus={{ borderColor: "purple.400", bg: "rgba(255, 255, 255, 0.08)" }}
                    />

                    <Flex gap={4}>
                        <Button
                            flex={1}
                            variant="ghost"
                            onClick={onClose}
                            borderRadius="xl"
                            h={12}
                            _hover={{ bg: "whiteAlpha.100" }}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            flex={1}
                            bg="purple.500"
                            color="white"
                            onClick={() => {
                                onConfirm(value);
                                onClose();
                            }}
                            borderRadius="xl"
                            h={12}
                            _hover={{ opacity: 0.9, transform: "translateY(-2px)" }}
                            transition="all 0.2s"
                        >
                            {confirmText}
                        </Button>
                    </Flex>
                </VStack>
            </Box>
        </Box>
    );
};

export default PromptModal;
