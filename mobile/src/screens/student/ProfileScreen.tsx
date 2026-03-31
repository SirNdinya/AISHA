import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentProfile'>;

interface Props {
    navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Institution</Text>
                        <Text style={styles.infoValue}>{user.institution || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Course</Text>
                        <Text style={styles.infoValue}>{user.course || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Year of Study</Text>
                        <Text style={styles.infoValue}>{user.yearOfStudy || 'N/A'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2b6cb0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    email: {
        fontSize: 16,
        color: '#718096',
        marginTop: 4,
    },
    infoSection: {
        width: '100%',
        backgroundColor: '#f7fafc',
        borderRadius: 12,
        padding: 20,
        marginBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
    },
    infoLabel: {
        fontSize: 16,
        color: '#4a5568',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#2d3748',
    },
    logoutButton: {
        width: '100%',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e53e3e',
        alignItems: 'center',
    },
    logoutText: {
        color: '#e53e3e',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
