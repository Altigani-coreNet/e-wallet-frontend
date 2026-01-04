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

export const getTags = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.TAGS, { params });
    return response.data;
};

export const exportTags = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.TAGS_EXPORT, { params });
    return response.data;
};

export const getTagById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.TAG_DETAILS(id));
    return response.data;
};

export const adminTagsKeys = {
    all: ['admin-tags'],
    list: (params) => ['admin-tags', 'list', params],
    detail: (id) => ['admin-tags', 'detail', id],
};

export const useAdminTags = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminTagsKeys.list(params),
        queryFn: () => getTags(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminTag = (id, options = {}) => {
    return useQuery({
        queryKey: adminTagsKeys.detail(id),
        queryFn: () => getTagById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getTags,
    exportTags,
    getTagById,
    useAdminTags,
    useAdminTag,
};


