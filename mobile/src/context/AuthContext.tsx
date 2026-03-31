import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        const loadStorageData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const profile = await authService.getProfile();
                    // Enforce Student role for mobile app
                    if (profile.role !== 'STUDENT') {
                        await logout();
                    } else {
                        setUser(profile);
                    }
                }
            } catch (e) {
                console.error('Failed to load storage data', e);
                await logout();
            } finally {
                setIsLoading(false);
            }
        };

        loadStorageData();
    }, []);

    const login = async (credentials: any) => {
        const data = await authService.login(credentials);

        // Enforce Student role for mobile app
        if (data.user.role !== 'STUDENT') {
            await authService.logout(); // Clear token from storage
            throw new Error('Access denied. Only students can use this mobile app.');
        }

        setUser(data.user);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
