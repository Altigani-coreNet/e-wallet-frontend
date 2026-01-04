import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

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
 * Get all warehouses with pagination and filters
 */
export const getWarehouses = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.WAREHOUSES, { params });
    return response.data;
};

/**
 * Export warehouses data
 */
export const exportWarehouses = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.WAREHOUSES_EXPORT, { params });
    return response.data;
};

/**
 * Get warehouse details by ID
 */
export const getWarehouseById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.WAREHOUSE_DETAILS(id));
    return response.data;
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for admin warehouses
 */
export const adminWarehousesKeys = {
    all: ['adminWarehouses'],
    list: (params) => ['adminWarehouses', 'list', params],
    detail: (id) => ['adminWarehouses', 'detail', id],
};

/**
 * React Query hook for fetching admin warehouses list
 */
export const useAdminWarehouses = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminWarehousesKeys.list(params),
        queryFn: () => getWarehouses(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getWarehouses,
    exportWarehouses,
    getWarehouseById,
};


