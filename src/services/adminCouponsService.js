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

export const getCoupons = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.COUPONS, { params });
    return response.data;
};

export const exportCoupons = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.COUPONS_EXPORT, { params });
    return response.data;
};

export const getCouponById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.COUPON_DETAILS(id));
    return response.data;
};

export const adminCouponsKeys = {
    all: ['admin-coupons'],
    list: (params) => ['admin-coupons', 'list', params],
    detail: (id) => ['admin-coupons', 'detail', id],
};

export const useAdminCoupons = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminCouponsKeys.list(params),
        queryFn: () => getCoupons(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminCoupon = (id, options = {}) => {
    return useQuery({
        queryKey: adminCouponsKeys.detail(id),
        queryFn: () => getCouponById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getCoupons,
    exportCoupons,
    getCouponById,
    useAdminCoupons,
    useAdminCoupon,
};




