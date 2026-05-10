import axios from 'axios';
import { attachAcceptLanguageInterceptor } from '../i18n/acceptLanguage';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { DETAIL_QUERY_DEFAULTS, LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

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
 * Get all purchases with pagination and filters
 */
export const getPurchases = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.PURCHASES, { params });
    return response.data;
};

/**
 * Export purchases data
 */
export const exportPurchases = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.PURCHASES_EXPORT, { params });
    return response.data;
};

/**
 * Get purchase details by ID
 */
export const getPurchaseById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.PURCHASE_DETAILS(id));
    return response.data;
};

/**
 * Get purchase invoice
 */
export const getPurchaseInvoice = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.PURCHASE_INVOICE(id));
    return response.data;
};

/**
 * Send purchase invoice via email
 */
export const sendPurchaseInvoice = async (id, email) => {
    const response = await api.post(ADMIN_ENDPOINTS.PURCHASE_INVOICE_SEND(id), { email });
    return response.data;
};

export const adminPurchasesKeys = {
    all: ['admin-purchases'],
    list: (params) => ['admin-purchases', 'list', params],
    detail: (id) => ['admin-purchases', 'detail', id],
    invoice: (id) => ['admin-purchases', 'invoice', id],
};

export const useAdminPurchases = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminPurchasesKeys.list(params),
        queryFn: () => getPurchases(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminPurchase = (id, options = {}) => {
    return useQuery({
        queryKey: adminPurchasesKeys.detail(id),
        queryFn: () => getPurchaseById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getPurchases,
    exportPurchases,
    getPurchaseById,
    getPurchaseInvoice,
    sendPurchaseInvoice,
    useAdminPurchases,
    useAdminPurchase,
};


