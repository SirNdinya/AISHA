import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import studentService from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDashboard'>;

interface Props {
    navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ applications: 0, offers: 0 });
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const [statsData, oppsData] = await Promise.all([
                studentService.getDashboardStats(),
                studentService.getOpportunities()
            ]);
            setStats(statsData);
            setOpportunities(oppsData.slice(0, 3));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2b6cb0" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.welcome}>Welcome, {user?.firstName || 'Student'}!</Text>
                    <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.applications}</Text>
                        <Text style={styles.statLabel}>Applications</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.offers}</Text>
                        <Text style={styles.statLabel}>Offers</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Opportunities</Text>
                    {opportunities.map((item: any) => (
                        <TouchableOpacity key={item.id} style={styles.opportunityCard}>
                            <Text style={styles.jobTitle}>{item.title}</Text>
                            <Text style={styles.companyName}>{item.company_name}</Text>
                            <Text style={styles.location}>{item.location}</Text>
                        </TouchableOpacity>
                    ))}
                    {opportunities.length === 0 && (
                        <Text style={styles.emptyText}>No recent opportunities found.</Text>
                    )}
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7fafc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 25,
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    date: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2b6cb0',
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },
    section: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 15,
    },
    opportunityCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2b6cb0',
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    companyName: {
        fontSize: 14,
        color: '#4a5568',
        marginTop: 2,
    },
    location: {
        fontSize: 12,
        color: '#a0aec0',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#a0aec0',
        marginTop: 20,
    }
});

export default DashboardScreen;
