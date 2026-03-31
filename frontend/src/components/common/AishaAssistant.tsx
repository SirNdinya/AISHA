import React from 'react';
import { Box, Image, Text, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import aishaBot from '../../assets/aisha-bot.png';
import AishaPlayground from './AishaPlayground';

const MotionBox = motion(Box);

const AishaAssistant: React.FC = () => {
    const [isPlaygroundOpen, setIsPlaygroundOpen] = React.useState(false);
    return (
        <Box
            position="fixed"
            bottom={{ base: "20px", md: "30px" }}
            right={{ base: "20px", md: "30px" }}
            zIndex={1000}
        >
            <Flex direction="column" align="center" gap={2}>
                <MotionBox
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: { type: "spring", stiffness: 260, damping: 20 }
                    }}
                    whileHover={{
                        scale: 1.1,
                        filter: "drop-shadow(0 0 15px rgba(167, 139, 250, 0.6))",
                        y: -5
                    }}
                    whileTap={{ scale: 0.9 }}
                    cursor="pointer"
                    borderRadius="full"
                    className="glass-card"
                    p={1.5}
                    border="2px solid rgba(167, 139, 250, 0.3)"
                    overflow="hidden"
                    boxShadow="0 10px 30px rgba(0,0,0,0.5)"
                    position="relative"
                    onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                >
                    {/* Pulsing Aura */}
                    <MotionBox
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        borderRadius="full"
                        bg="rgba(167, 139, 250, 0.2)"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        zIndex={-1}
                    />

                    <Image
                        src={aishaBot}
                        alt="AISHA Assistant"
                        boxSize={{ base: "50px", md: "65px" }}
                        borderRadius="full"
                        objectFit="cover"
                    />
                </MotionBox>
                <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <Text
                        className="gradient-text"
                        fontSize="xs"
                        fontWeight="bold"
                        textAlign="center"
                        textShadow="0 2px 4px rgba(0,0,0,0.5)"
                    >
                        AISHA Assistant
                    </Text>
                </MotionBox>
            </Flex>
            <AishaPlayground isOpen={isPlaygroundOpen} onClose={() => setIsPlaygroundOpen(false)} />
        </Box>
    );
};

export default AishaAssistant;
