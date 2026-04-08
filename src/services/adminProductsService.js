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
 * Get all products with pagination and filters
 */
export const getProducts = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.POS_PRODUCTS, { params });
    return response.data;
};

/**
 * Export products data
 */
export const exportProducts = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.POS_PRODUCTS_EXPORT, { params });
    return response.data;
};

/**
 * Get product details by ID
 */
export const getProductById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.POS_PRODUCT_DETAILS(id));
    return response.data;
};

export const adminProductsKeys = {
    all: ['admin-products'],
    list: (params) => ['admin-products', 'list', params],
    detail: (id) => ['admin-products', 'detail', id],
};

export const useAdminProducts = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminProductsKeys.list(params),
        queryFn: () => getProducts(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminProduct = (id, options = {}) => {
    return useQuery({
        queryKey: adminProductsKeys.detail(id),
        queryFn: () => getProductById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getProducts,
    exportProducts,
    getProductById,
    useAdminProducts,
    useAdminProduct,
};


