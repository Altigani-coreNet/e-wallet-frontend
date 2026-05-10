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

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchAdminPaymentLinks = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.PAYMENT_LINKS, { params });
    return response.data;
};

export const fetchAdminPaymentLinkDetails = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.PAYMENT_LINK_DETAILS(id));
    return response.data;
};

export const fetchAdminPaymentLinkStatistics = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.PAYMENT_LINK_STATISTICS, { params });
    return response.data;
};

export const exportAdminPaymentLinks = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.PAYMENT_LINK_EXPORT, {
        params,
        responseType: 'blob',
    });
    return response;
};

export const adminPaymentLinksKeys = {
    all: ['admin-payment-links'],
    list: (params) => ['admin-payment-links', 'list', params],
    detail: (id) => ['admin-payment-links', 'detail', id],
    statistics: (params) => ['admin-payment-links', 'statistics', params],
};

export const useAdminPaymentLinks = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminPaymentLinksKeys.list(params),
        queryFn: () => fetchAdminPaymentLinks(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminPaymentLink = (id, options = {}) => {
    return useQuery({
        queryKey: adminPaymentLinksKeys.detail(id),
        queryFn: () => fetchAdminPaymentLinkDetails(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminPaymentLinkStatistics = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminPaymentLinksKeys.statistics(params),
        queryFn: () => fetchAdminPaymentLinkStatistics(params),
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    fetchAdminPaymentLinks,
    fetchAdminPaymentLinkDetails,
    fetchAdminPaymentLinkStatistics,
    exportAdminPaymentLinks,
    useAdminPaymentLinks,
    useAdminPaymentLink,
    useAdminPaymentLinkStatistics,
};

