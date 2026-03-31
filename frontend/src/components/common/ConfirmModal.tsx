import React from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Button,
    Flex,
    Icon,
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "purple.500"
}) => {
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
                maxW="400px"
                w="90%"
                p={8}
                borderRadius="32px"
                onClick={(e) => e.stopPropagation()}
                animation="slideUp 0.3s ease-out"
                border="1px solid rgba(255, 255, 255, 0.1)"
                boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            >
                <VStack gap={6} align="center" textAlign="center">
                    <Box p={4} borderRadius="full" bg="rgba(167, 139, 250, 0.1)">
                        <Icon as={AlertTriangle} boxSize={8} color="purple.400" />
                    </Box>
                    <Box>
                        <Heading size="md" mb={2} color="white">{title}</Heading>
                        <Text color="gray.400" fontSize="sm">{description}</Text>
                    </Box>
                    <Flex gap={4} w="full">
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
                            bg={confirmColor}
                            color="white"
                            onClick={() => {
                                onConfirm();
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

export default ConfirmModal;
