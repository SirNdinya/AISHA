import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/student/DashboardScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
    return (
        <AuthProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#2b6cb0',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                >
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="StudentDashboard"
                        component={DashboardScreen}
                        options={{ title: 'Student Portal' }}
                    />
                    <Stack.Screen
                        name="StudentProfile"
                        component={ProfileScreen}
                        options={{ title: 'My Profile' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
};

export default AppNavigator;
