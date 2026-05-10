import axios from 'axios';
import { attachAcceptLanguageInterceptor } from '../i18n/acceptLanguage';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const api = axios.create({
    headers: {
        Accept: 'application/json',
    },
});

attachAcceptLanguageInterceptor(api);

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Fetch user information by IDs
 */
export const fetchUserInfo = async (userIds = []) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return {};
    }

    const uniqueIds = Array.from(
        new Set(
            userIds
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    );

    if (!uniqueIds.length) {
        return {};
    }

    try {
        // Fetch users by IDs - using select endpoint or individual requests
        const promises = uniqueIds.map(async (userId) => {
            try {
                const response = await api.get(ADMIN_ENDPOINTS.USER_DETAILS(userId));
                const user = response.data?.data || response.data;
                return {
                    id: String(userId),
                    name: user?.name || user?.full_name || '',
                    email: user?.email || '',
                };
            } catch (error) {
                console.warn(`Failed to fetch user ${userId}:`, error);
                return {
                    id: String(userId),
                    name: '',
                    email: '',
                };
            }
        });

        const results = await Promise.all(promises);
        const result = {};
        results.forEach((user) => {
            result[user.id] = user;
        });
        return result;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return {};
    }
};

/**
 * Fetch terminal information by IDs
 */
export const fetchTerminalInfo = async (terminalIds = []) => {
    if (!Array.isArray(terminalIds) || terminalIds.length === 0) {
        return {};
    }

    const uniqueIds = Array.from(
        new Set(
            terminalIds
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    );

    if (!uniqueIds.length) {
        return {};
    }

    try {
        // Fetch terminals by IDs
        const promises = uniqueIds.map(async (terminalId) => {
            try {
                const response = await api.get(ADMIN_ENDPOINTS.TERMINAL_DETAILS(terminalId));
                const terminal = response.data?.data || response.data;
                return {
                    id: String(terminalId),
                    name: terminal?.name || terminal?.terminal_id || '',
                    terminal_id: terminal?.terminal_id || '',
                };
            } catch (error) {
                console.warn(`Failed to fetch terminal ${terminalId}:`, error);
                return {
                    id: String(terminalId),
                    name: '',
                    terminal_id: '',
                };
            }
        });

        const results = await Promise.all(promises);
        const result = {};
        results.forEach((terminal) => {
            result[terminal.id] = terminal;
        });
        return result;
    } catch (error) {
        console.error('Error fetching terminal info:', error);
        return {};
    }
};

export default {
    fetchUserInfo,
    fetchTerminalInfo,
};

