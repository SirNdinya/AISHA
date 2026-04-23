import React from 'react';
import {
    Box,
    VStack,
    Text,
    Button,
    Flex,
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
import { LuTriangleAlert } from "react-icons/lu";
import { X as LuX } from "lucide-react";


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
    return (
        <DialogRoot 
            open={isOpen} 
            onOpenChange={(details) => !details.open && onClose()}
            size="sm"
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
                    w={{ base: "90%", sm: "400px" }}
                >
                    <DialogHeader>
                        <VStack gap={4} align="center" pt={4}>
                            <Box p={4} borderRadius="full" bg="rgba(167, 139, 250, 0.1)">
                                <Icon as={LuTriangleAlert} boxSize={8} color="purple.400" />
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

                    <DialogBody textAlign="center" py={4}>
                        <Text color="gray.400" fontSize="sm" lineHeight="relaxed">
                            {description}
                        </Text>
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
                                bg={confirmColor}
                                color="white"
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                borderRadius="2xl"
                                h={12}
                                fontWeight="black"
                                _hover={{ opacity: 0.9, transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                                boxShadow={`0 8px 20px ${confirmColor}33`}
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

export default ConfirmModal;
