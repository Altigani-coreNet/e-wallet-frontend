import axios from 'axios';
import { attachAcceptLanguageInterceptor } from '../i18n/acceptLanguage';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

attachAcceptLanguageInterceptor(api);

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Get all categories with pagination and filters
 */
export const getCategories = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.CATEGORIES, { params });
    return response.data;
};

/**
 * Export categories data
 */
export const exportCategories = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.CATEGORIES_EXPORT, { params });
    return response.data;
};

/**
 * Get category details by ID
 */
export const getCategoryById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.CATEGORY_DETAILS(id));
    return response.data;
};

export default {
    getCategories,
    exportCategories,
    getCategoryById,
};


