import axios from 'axios';
import { POS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Get all API keys for the authenticated merchant
 */
export const getApiKeys = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.API_KEYS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in getApiKeys:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch API keys'
        };
    }
};

/**
 * Generate a new API key
 */
export const generateApiKey = async (mode) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.API_KEY_GENERATE, {
            mode: mode
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in generateApiKey:', error);
        const errorResponse = error.response?.data;
        return {
            success: false,
            error: errorResponse?.message || error.message || 'Failed to generate API key',
            errors: errorResponse?.errors || null
        };
    }
};

/**
 * Regenerate an existing API key
 */
export const regenerateApiKey = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.API_KEY_REGENERATE(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in regenerateApiKey:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to regenerate API key'
        };
    }
};

/**
 * Deactivate an API key
 */
export const deactivateApiKey = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.API_KEY_DEACTIVATE(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in deactivateApiKey:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to deactivate API key'
        };
    }
};

