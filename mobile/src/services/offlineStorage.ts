import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@saps_cache_';

export const offlineStorage = {
    saveData: async (key: string, data: any) => {
        try {
            const jsonValue = JSON.stringify(data);
            await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, jsonValue);
        } catch (e) {
            console.error('Error saving offline data', e);
        }
    },

    getData: async (key: string) => {
        try {
            const jsonValue = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error('Error reading offline data', e);
            return null;
        }
    },

    removeData: async (key: string) => {
        try {
            await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
        } catch (e) {
            console.error('Error removing offline data', e);
        }
    },

    clearCache: async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (e) {
            console.error('Error clearing cache', e);
        }
    }
};
