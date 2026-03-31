
import React, { useState } from 'react';
import {
    Box,
    Button,
    Text,
    VStack,
    Icon,
    Progress,
    HStack,
    IconButton
} from '@chakra-ui/react';
import { LuUpload, LuFileText, LuX, LuCircleCheck } from 'react-icons/lu';
import apiClient from '../../services/apiClient';
import { toaster } from '../ui/toaster';

interface DocumentUploadProps {
    type: string;
    onUploadSuccess?: (data: any) => void;
    label?: string;
    accept?: string;
    metadata?: any;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
    type,
    onUploadSuccess,
    label = "Upload Document",
    accept = ".pdf,.jpg,.jpeg,.png",
    metadata = {}
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploaded, setIsUploaded] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setIsUploaded(false);
            setUploadProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('metadata', JSON.stringify(metadata));

        try {
            const response = await apiClient.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
                    setUploadProgress(progress);
                },
            });

            setIsUploaded(true);
            toaster.create({
                title: 'Success',
                description: `${file.name} uploaded successfully.`,
                type: 'success',
            });
            if (onUploadSuccess) onUploadSuccess(response.data.data);
        } catch (error: any) {
            console.error('Upload failed:', error);
            toaster.create({
                title: 'Upload Failed',
                description: error.response?.data?.message || 'Something went wrong.',
                type: 'error',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setIsUploaded(false);
        setUploadProgress(0);
    };

    return (
        <Box
            p={4}
            borderRadius="xl"
            bg="whiteAlpha.50"
            border="1px dashed"
            borderColor={file ? "blue.400" : "whiteAlpha.200"}
            transition="all 0.2s"
            _hover={{ borderColor: "blue.400" }}
        >
            <VStack gap={3} align="stretch">
                {!file ? (
                    <Box position="relative">
                        <input
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            style={{
                                opacity: 0,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                zIndex: 1
                            }}
                        />
                        <HStack justify="center" p={4} gap={3}>
                            <Icon as={LuUpload} color="gray.500" />
                            <Text color="gray.400" fontSize="sm">{label}</Text>
                        </HStack>
                    </Box>
                ) : (
                    <VStack align="stretch" gap={2}>
                        <HStack justify="space-between">
                            <HStack gap={2}>
                                <Icon as={isUploaded ? LuCircleCheck : LuFileText} color={isUploaded ? "green.400" : "blue.400"} />
                                <Box overflow="hidden">
                                    <Text fontSize="sm" fontWeight="medium" truncate>{file.name}</Text>
                                    <Text fontSize="xs" color="gray.500">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                                </Box>
                            </HStack>
                            {!isUploading && !isUploaded && (
                                <IconButton
                                    aria-label="Remove file"
                                    size="xs"
                                    variant="ghost"
                                    onClick={clearFile}
                                >
                                    <LuX />
                                </IconButton>
                            )}
                        </HStack>

                        {isUploading && (
                            <Box w="full">
                                <Progress.Root value={uploadProgress} size="xs" colorPalette="blue" borderRadius="full">
                                    <Progress.Track bg="whiteAlpha.100">
                                        <Progress.Range />
                                    </Progress.Track>
                                </Progress.Root>
                                <Text fontSize="10px" color="blue.400" mt={1} textAlign="right">{uploadProgress}%</Text>
                            </Box>
                        )}

                        {!isUploaded && !isUploading && (
                            <Button
                                size="sm"
                                colorPalette="blue"
                                onClick={handleUpload}
                            >
                                <LuUpload /> Confirm Upload
                            </Button>
                        )}

                        {isUploaded && (
                            <Text fontSize="xs" color="green.400" fontWeight="bold">UPLOADED & SECURED</Text>
                        )}
                    </VStack>
                )}
            </VStack>
        </Box>
    );
};

export default DocumentUpload;
