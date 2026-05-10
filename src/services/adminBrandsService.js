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

export const getBrands = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.BRANDS, { params });
    return response.data;
};

export const exportBrands = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.BRANDS_EXPORT, { params });
    return response.data;
};

export const getBrandById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.BRAND_DETAILS(id));
    return response.data;
};

export const adminBrandsKeys = {
    all: ['admin-brands'],
    list: (params) => ['admin-brands', 'list', params],
    detail: (id) => ['admin-brands', 'detail', id],
};

export const useAdminBrands = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminBrandsKeys.list(params),
        queryFn: () => getBrands(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminBrand = (id, options = {}) => {
    return useQuery({
        queryKey: adminBrandsKeys.detail(id),
        queryFn: () => getBrandById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getBrands,
    exportBrands,
    getBrandById,
    useAdminBrands,
    useAdminBrand,
};


