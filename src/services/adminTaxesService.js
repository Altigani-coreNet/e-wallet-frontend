import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { DETAIL_QUERY_DEFAULTS, LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

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
 * Get all taxes with pagination and filters
 */
export const getTaxes = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.TAXES, { params });
    return response.data;
};

/**
 * Export taxes data
 */
export const exportTaxes = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.TAXES_EXPORT, { params });
    return response.data;
};

/**
 * Get tax details by ID
 */
export const getTaxById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.TAX_DETAILS(id));
    return response.data;
};

export const adminTaxesKeys = {
    all: ['admin-taxes'],
    list: (params) => ['admin-taxes', 'list', params],
    detail: (id) => ['admin-taxes', 'detail', id],
};

export const useAdminTaxes = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminTaxesKeys.list(params),
        queryFn: () => getTaxes(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminTax = (id, options = {}) => {
    return useQuery({
        queryKey: adminTaxesKeys.detail(id),
        queryFn: () => getTaxById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getTaxes,
    exportTaxes,
    getTaxById,
    useAdminTaxes,
    useAdminTax,
};


