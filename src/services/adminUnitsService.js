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

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getUnits = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.UNITS, { params });
    return response.data;
};

export const exportUnits = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.UNITS_EXPORT, { params });
    return response.data;
};

export const getUnitById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.UNIT_DETAILS(id));
    return response.data;
};

export const adminUnitsKeys = {
    all: ['admin-units'],
    list: (params) => ['admin-units', 'list', params],
    detail: (id) => ['admin-units', 'detail', id],
};

export const useAdminUnits = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminUnitsKeys.list(params),
        queryFn: () => getUnits(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminUnit = (id, options = {}) => {
    return useQuery({
        queryKey: adminUnitsKeys.detail(id),
        queryFn: () => getUnitById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getUnits,
    exportUnits,
    getUnitById,
    useAdminUnits,
    useAdminUnit,
};


