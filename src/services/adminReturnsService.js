import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Get all sale returns with pagination and filters
 */
export const getSaleReturns = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALE_RETURNS, { params });
    return response.data;
};

/**
 * Export sale returns data
 */
export const exportSaleReturns = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALE_RETURNS_EXPORT, { params });
    return response.data;
};

/**
 * Get sale return details by ID
 */
export const getSaleReturnById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALE_RETURN_DETAILS(id));
    return response.data;
};

export default {
    getSaleReturns,
    exportSaleReturns,
    getSaleReturnById,
};


