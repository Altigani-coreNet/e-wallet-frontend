import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { REPORT_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

const api = axios.create({
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchAdminSalesData = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS_SALES, { params });
    return response.data;
};

export const fetchAdminSalesSummary = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS_SALES_SUMMARY, { params });
    return response.data;
};

export const fetchAdminPurchaseData = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS_PURCHASES, { params });
    return response.data;
};

export const fetchAdminPurchaseSummary = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS_PURCHASES_SUMMARY, { params });
    return response.data;
};

export const fetchAdminProductsData = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS_PRODUCTS, { params });
    return response.data;
};

export const fetchAdminProductsSummary = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS_PRODUCTS_SUMMARY, { params });
    return response.data;
};

export const adminReportsKeys = {
    base: ['admin-reports'],
    sales: (params) => ['admin-reports', 'sales', 'data', params],
    salesSummary: (params) => ['admin-reports', 'sales', 'summary', params],
    purchases: (params) => ['admin-reports', 'purchases', 'data', params],
    purchasesSummary: (params) => ['admin-reports', 'purchases', 'summary', params],
    products: (params) => ['admin-reports', 'products', 'data', params],
    productsSummary: (params) => ['admin-reports', 'products', 'summary', params],
};

export const useAdminSalesReport = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminReportsKeys.sales(params),
        queryFn: () => fetchAdminSalesData(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminSalesSummary = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminReportsKeys.salesSummary(params),
        queryFn: () => fetchAdminSalesSummary(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminPurchaseReport = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminReportsKeys.purchases(params),
        queryFn: () => fetchAdminPurchaseData(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminPurchaseSummary = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminReportsKeys.purchasesSummary(params),
        queryFn: () => fetchAdminPurchaseSummary(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminProductsReport = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminReportsKeys.products(params),
        queryFn: () => fetchAdminProductsData(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminProductsSummary = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminReportsKeys.productsSummary(params),
        queryFn: () => fetchAdminProductsSummary(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    fetchAdminSalesData,
    fetchAdminSalesSummary,
    fetchAdminPurchaseData,
    fetchAdminPurchaseSummary,
    fetchAdminProductsData,
    fetchAdminProductsSummary,
    useAdminSalesReport,
    useAdminSalesSummary,
    useAdminPurchaseReport,
    useAdminPurchaseSummary,
    useAdminProductsReport,
    useAdminProductsSummary,
};


