import React, { useState } from 'react';
import {
    Box,
    VStack,
    Text,
    Button,
    Flex,
    Input,
    Icon,
    IconButton
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogBackdrop,
    DialogPositioner,
    DialogCloseTrigger
} from '../ui/dialog';
import { LuMessageSquareText } from "react-icons/lu";
import { X as LuX } from "lucide-react";


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

    return (
        <DialogRoot 
            open={isOpen} 
            onOpenChange={(details) => !details.open && onClose()}
            size="md"
            placement="center"
        >
            <DialogBackdrop backdropFilter="blur(16px)" bg="rgba(0,0,0,0.4)" />
            <DialogPositioner>
                <DialogContent 
                    bg="#0d1117" 
                    borderRadius="3xl" 
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    shadow="2xl"
                    p={2}
                    w={{ base: "90%", sm: "450px" }}
                >
                    <DialogHeader>
                        <VStack gap={4} align="center" pt={4}>
                            <Box p={4} borderRadius="full" bg="rgba(167, 139, 250, 0.1)">
                                <Icon as={LuMessageSquareText} boxSize={8} color="purple.400" />
                            </Box>
                            <DialogTitle color="white" fontWeight="black" fontSize="xl">{title}</DialogTitle>
                        </VStack>
                        <DialogCloseTrigger asChild>
                            <IconButton
                                aria-label="Close"
                                variant="ghost" 
                                color="whiteAlpha.600" 
                                position="absolute" 
                                top={4} 
                                right={4}
                                rounded="full"
                                _hover={{ bg: "whiteAlpha.100", color: "white" }}
                            >
                                <LuX />
                            </IconButton>
                        </DialogCloseTrigger>
                    </DialogHeader>

                    <DialogBody py={4}>
                        <VStack gap={6} align="stretch">
                            <Text color="gray.400" fontSize="sm" textAlign="center" lineHeight="relaxed">
                                {description}
                            </Text>
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
                                borderRadius="2xl"
                                h={14}
                                px={4}
                                color="white"
                                fontSize="md"
                                _focus={{ borderColor: "purple.400", bg: "rgba(255, 255, 255, 0.08)" }}
                            />
                        </VStack>
                    </DialogBody>

                    <DialogFooter pb={6}>
                        <Flex gap={4} w="full">
                            <Button
                                flex={1}
                                variant="ghost"
                                onClick={onClose}
                                borderRadius="2xl"
                                h={12}
                                fontWeight="bold"
                                color="gray.400"
                                _hover={{ bg: "whiteAlpha.100", color: "white" }}
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
                                borderRadius="2xl"
                                h={12}
                                fontWeight="black"
                                _hover={{ opacity: 0.9, transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                                boxShadow="0 8px 20px rgba(167, 139, 250, 0.2)"
                            >
                                {confirmText}
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogPositioner>
        </DialogRoot>
    );
};

export default PromptModal;
