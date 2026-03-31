import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Input, VStack, HStack, Field, Text as ChakraText, Icon, Grid, Slider } from '@chakra-ui/react';
import { LuSave, LuTerminal, LuUpload, LuSearch } from "react-icons/lu";
import Cropper from 'react-easy-crop';
import studentService from '../../../services/studentService';
import { toaster } from '../../../components/ui/toaster';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentProfile, updateStudentProfile } from '../../../store/studentSlice';
import type { AppDispatch, RootState } from '../../../store';
import type { Student, UpdateStudentDto } from '../../../types/student';
const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/api(.*)?$/, '');
const getMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
};

interface ProfileEditProps {
    student: Student;
    onCancel: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ student, onCancel }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.student);

    const [formData, setFormData] = useState<UpdateStudentDto>({
        first_name: student?.first_name || '',
        last_name: student?.last_name || '',
        admission_number: student?.admission_number || '',
        course_of_study: student?.course_of_study || '',
        mpesa_number: student?.mpesa_number || '',
        skills: student?.skills || [],
        interests: student?.interests || [],
        requires_stipend: student?.requires_stipend || false,
        min_stipend_amount: student?.min_stipend_amount || 0
    });

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as string }));
    };

    const handleSubmit = async () => {
        await dispatch(updateStudentProfile(formData));
        onCancel();
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File> => {
        const image = new Image();
        image.src = imageSrc;
        await new Promise((resolve) => (image.onload = resolve));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) return;
                const file = new File([blob], 'cropped-profile.jpg', { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg');
        });
    };

    const handleUploadCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsUploading(true);
        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            await studentService.uploadProfilePicture(croppedFile);
            await dispatch(fetchStudentProfile());
            toaster.create({ title: "Avatar Successfully Reconfigured", type: "success" });
            setIsCropping(false);
            setImageSrc(null);
        } catch (err) {
            console.error(err);
            toaster.create({ title: "Sync Error", type: "error" });
        } finally {
            setIsUploading(false);
        }
    };

    const inputStyles = {
        bg: "whiteAlpha.50",
        border: "1px solid",
        borderColor: "whiteAlpha.200",
        color: "white",
        fontSize: "sm",
        fontWeight: "mono",
        _focus: { borderColor: "cyan.400", bg: "whiteAlpha.100" }
    };

    const labelStyles = {
        fontSize: "10px",
        color: "cyan.400",
        textTransform: "uppercase",
        fontWeight: "bold",
        mb: 1
    };

    return (
        <Box className="terminal-card" p={8}>
            <HStack justify="space-between" mb={8}>
                <VStack align="start" gap={1}>
                    <Heading size="md" color="white" letterSpacing="widest" textTransform="uppercase">Parameter Configuration</Heading>
                    <ChakraText color="whiteAlpha.600" fontSize="xs" fontWeight="mono">Modifying core identity nodes and expertise clusters.</ChakraText>
                </VStack>
                <Icon as={LuTerminal} size="xl" color="cyan.400" />
            </HStack>

            <VStack gap={6} align="stretch">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <Field.Root>
                        <Field.Label {...labelStyles}>First Name Node</Field.Label>
                        <Input name="first_name" value={formData.first_name || ''} readOnly bg="whiteAlpha.100" color="whiteAlpha.600" />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label {...labelStyles}>Last Name Node</Field.Label>
                        <Input name="last_name" value={formData.last_name || ''} readOnly bg="whiteAlpha.100" color="whiteAlpha.600" />
                    </Field.Root>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1.5fr" }} gap={6}>
                    <Field.Root>
                        <Field.Label {...labelStyles}>Registry ID (Admission)</Field.Label>
                        <Input name="admission_number" value={formData.admission_number || ''} readOnly bg="whiteAlpha.100" color="whiteAlpha.600" />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label {...labelStyles}>Academic Trajectory (Course)</Field.Label>
                        <Input name="course_of_study" value={formData.course_of_study || ''} readOnly bg="whiteAlpha.100" color="whiteAlpha.600" />
                    </Field.Root>
                </Grid>

                <HStack gap={6}>
                    <Field.Root>
                        <Field.Label {...labelStyles}>Fiscal Link (M-Pesa)</Field.Label>
                        <Input name="mpesa_number" value={formData.mpesa_number || ''} onChange={handleChange} {...inputStyles} />
                    </Field.Root>
                </HStack>

                <Field.Root>
                    <Field.Label {...labelStyles}>Expertise Injection (Skills - Comma Separated)</Field.Label>
                    <Input
                        name="skills"
                        value={formData.skills?.join(', ') || ''}
                        onChange={(e) => setFormData((p: UpdateStudentDto) => ({ ...p, skills: e.target.value.split(',').map(s => s.trim()) }))}
                        {...inputStyles}
                    />
                </Field.Root>

                <Field.Root>
                    <Field.Label {...labelStyles}>Neural Interests (Comma Separated)</Field.Label>
                    <Input
                        name="interests"
                        value={formData.interests?.join(', ') || ''}
                        onChange={(e) => setFormData((p: UpdateStudentDto) => ({ ...p, interests: e.target.value.split(',').map(s => s.trim()) }))}
                        {...inputStyles}
                    />
                </Field.Root>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <Field.Root>
                        <Field.Label {...labelStyles}>Profile Avatar Node</Field.Label>
                        <HStack gap={4} mb={2}>
                            <Avatar
                                size="lg"
                                border="2px solid"
                                borderColor="cyan.400"
                                src={getMediaUrl(student.profile_picture_url)}
                                name={`${student.first_name} ${student.last_name}`}
                            />
                            <VStack align="start" gap={0}>
                                <Text fontSize="10px" color="whiteAlpha.600" fontWeight="bold">CURRENT_MATRIX</Text>
                                <Text fontSize="9px" color="cyan.400" fontWeight="mono">ACTIVE_AVATAR_LAYER</Text>
                            </VStack>
                        </HStack>
                        <Flex
                            border="1px dashed"
                            borderColor="cyan.900"
                            bg="cyan.900/10"
                            p={4}
                            borderRadius="lg"
                            direction="column"
                            align="center"
                            gap={2}
                            cursor="pointer"
                            _hover={{ bg: "cyan.900/20", borderColor: "cyan.400" }}
                            onClick={() => document.getElementById('profile-upload')?.click()}
                        >
                            <Icon as={LuUpload} color="cyan.400" />
                            <ChakraText fontSize="10px" color="cyan.200" fontWeight="bold">UPLOAD_AVATAR_LAYER</ChakraText>
                            <Input id="profile-upload" type="file" accept="image/*" display="none" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        setImageSrc(reader.result as string);
                                        setIsCropping(true);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </Flex>

                        {/* Cropper Overlay */}
                        {isCropping && imageSrc && (
                            <Box pos="fixed" inset={0} bg="blackAlpha.900" zIndex={1000} p={10}>
                                <VStack h="full" gap={6}>
                                    <Heading size="md" color="white" textTransform="uppercase">Optimize Avatar Matrix</Heading>
                                    <Box pos="relative" w="full" flex={1} bg="gray.900" borderRadius="xl" overflow="hidden">
                                        <Cropper
                                            image={imageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={1}
                                            onCropChange={setCrop}
                                            onCropComplete={onCropComplete}
                                            onZoomChange={setZoom}
                                        />
                                    </Box>
                                    <VStack maxW="md" w="full" gap={4}>
                                        <HStack w="full" gap={4}>
                                            <Icon as={LuSearch} color="cyan.400" />
                                            <Slider.Root
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                value={[zoom]}
                                                onValueChange={(e) => setZoom(e.value[0])}
                                                colorPalette="cyan"
                                            >
                                                <Slider.Track bg="whiteAlpha.200">
                                                    <Slider.Range />
                                                </Slider.Track>
                                                <Slider.Thumb index={0} />
                                            </Slider.Root>
                                        </HStack>
                                        <HStack gap={4}>
                                            <Button variant="ghost" color="white" onClick={() => setIsCropping(false)}>CANCEL</Button>
                                            <Button colorPalette="cyan" loading={isUploading} onClick={handleUploadCrop}>INITIALIZE_SYNC</Button>
                                        </HStack>
                                    </VStack>
                                </VStack>
                            </Box>
                        )}
                    </Field.Root>

                    <Field.Root>
                        <Field.Label {...labelStyles}>External Doc Sync (Resume / CV)</Field.Label>
                        <Flex
                            border="1px dashed"
                            borderColor="whiteAlpha.300"
                            p={4}
                            borderRadius="md"
                            direction="column"
                            align="center"
                            gap={2}
                            cursor="pointer"
                            _hover={{ bg: "whiteAlpha.50", borderColor: "cyan.400" }}
                            onClick={() => document.getElementById('cv-upload')?.click()}
                        >
                            <Icon as={LuUpload} color="whiteAlpha.400" />
                            <ChakraText fontSize="xs" color="whiteAlpha.500">UPLOAD PDF / DOC FOR NEURAL PARSING</ChakraText>
                            <Input id="cv-upload" type="file" accept=".pdf,.doc,.docx" display="none" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    try {
                                        await import('../../../services/studentService').then(m => m.default.uploadCV(file));
                                        alert("RESUME_UPLOADED: NEURAL_DATA_SYNCED");
                                    } catch (err) {
                                        console.error("Upload failed", err);
                                    }
                                }
                            }} />
                        </Flex>
                    </Field.Root>
                </Grid>

                <Flex gap={4} mt={6} justify="flex-end">
                    <Button variant="ghost" colorPalette="whiteAlpha" onClick={onCancel} size="sm" fontSize="10px" letterSpacing="widest">
                        ABORT_CHANGES
                    </Button>
                    <Button
                        colorPalette="cyan"
                        variant="solid"
                        loading={isLoading}
                        onClick={handleSubmit}
                        size="sm"
                        fontSize="10px"
                        letterSpacing="widest"
                    >
                        <LuSave /> COMMIT_PARAMETERS
                    </Button>
                </Flex>
            </VStack>
        </Box>
    );
};

export default ProfileEdit;
