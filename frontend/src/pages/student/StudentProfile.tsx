import React, { useEffect, useState } from 'react';
import { Box, Spinner, Flex, Text, Container } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentProfile } from '../../store/studentSlice';
import type { AppDispatch, RootState } from '../../store';
import ProfileView from './components/ProfileView';
import ProfileEdit from './components/ProfileEdit';

const StudentProfile: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { profile, isLoading, error } = useSelector((state: RootState) => state.student);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        dispatch(fetchStudentProfile());
    }, [dispatch]);

    // If error is "Student profile not found", we want to show the create profile form
    const isProfileMissing = !profile && (error?.includes('Student profile not found') || error?.includes('404'));

    useEffect(() => {
        if (isProfileMissing && !isEditing) {
            setIsEditing(true);
        }
    }, [isProfileMissing, isEditing]);

    if (isLoading && !profile && !error) {
        return (
            <Flex h="50vh" align="center" justify="center">
                <Spinner size="xl" color="cyan.400" />
            </Flex>
        );
    }

    if (error && !isProfileMissing) {
        return (
            <Container maxW="container.xl">
                <Box className="terminal-card" p={8} borderColor="red.900">
                    <Text color="red.400" fontWeight="mono">[SYSTEM_FAILURE]: UNAUTHORIZED_ACCESS OR DATA_SYNC_ERROR</Text>
                    <Text color="whiteAlpha.600" fontSize="xs" mt={2}>{error}</Text>
                </Box>
            </Container>
        );
    }

    // Defensive check: if no profile and not loading/error, show setup or spinner
    if (!profile && !isLoading && !isProfileMissing) {
        return (
            <Flex h="50vh" align="center" justify="center">
                <Spinner size="xl" color="cyan.400" />
            </Flex>
        );
    }

    return (
        <Container maxW="container.xl" pb={12}>
            {isEditing || isProfileMissing ? (
                <ProfileEdit
                    student={profile || {} as any}
                    onCancel={() => {
                        if (!isProfileMissing) setIsEditing(false);
                    }}
                />
            ) : profile ? (
                <ProfileView student={profile} />
            ) : null}
        </Container>
    );
};

export default StudentProfile;
