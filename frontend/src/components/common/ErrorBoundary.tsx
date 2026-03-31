import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Heading, Text, Button, Code, VStack } from '@chakra-ui/react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box p={8} bg="red.50" minH="100vh" textAlign="center">
                    <VStack gap={4}>
                        <Heading color="red.600">Something went wrong.</Heading>
                        <Text color="red.500">The application encountered a critical error.</Text>

                        {this.state.error && (
                            <Box bg="white" p={4} borderRadius="md" shadow="sm" maxW="800px" w="full" overflowX="auto" textAlign="left">
                                <Code colorPalette="red" display="block" whiteSpace="pre-wrap">
                                    {this.state.error.toString()}
                                </Code>
                                {this.state.errorInfo && (
                                    <Code colorPalette="gray" display="block" whiteSpace="pre-wrap" mt={2} fontSize="xs">
                                        {this.state.errorInfo.componentStack}
                                    </Code>
                                )}
                            </Box>
                        )}

                        <Button colorPalette="red" onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                    </VStack>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
