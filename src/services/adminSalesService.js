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
 * Get all sales with pagination and filters
 */
export const getSales = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALES, { params });
    return response.data;
};

/**
 * Export sales data
 */
export const exportSales = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALES_EXPORT, { params });
    return response.data;
};

/**
 * Get sale details by ID
 */
export const getSaleById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALE_DETAILS(id));
    return response.data;
};

/**
 * Get sale invoice
 */
export const getSaleInvoice = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.SALE_INVOICE(id));
    return response.data;
};

/**
 * Send sale invoice via email
 */
export const sendSaleInvoice = async (id, email) => {
    const response = await api.post(ADMIN_ENDPOINTS.SALE_INVOICE_SEND(id), { email });
    return response.data;
};

export const adminSalesKeys = {
    all: ['admin-sales'],
    list: (params) => ['admin-sales', 'list', params],
    detail: (id) => ['admin-sales', 'detail', id],
    invoice: (id) => ['admin-sales', 'invoice', id],
};

export const useAdminSales = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminSalesKeys.list(params),
        queryFn: () => getSales(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminSale = (id, options = {}) => {
    return useQuery({
        queryKey: adminSalesKeys.detail(id),
        queryFn: () => getSaleById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getSales,
    exportSales,
    getSaleById,
    getSaleInvoice,
    sendSaleInvoice,
    useAdminSales,
    useAdminSale,
};


