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
 * Get all drafts with pagination and filters
 */
export const getDrafts = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.DRAFTS, { params });
    return response.data;
};

/**
 * Export drafts data
 */
export const exportDrafts = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.DRAFTS_EXPORT, { params });
    return response.data;
};

/**
 * Get draft details by ID
 */
export const getDraftById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.DRAFT_DETAILS(id));
    return response.data;
};

export const adminDraftsKeys = {
    all: ['admin-drafts'],
    list: (params) => ['admin-drafts', 'list', params],
    detail: (id) => ['admin-drafts', 'detail', id],
};

export const useAdminDrafts = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminDraftsKeys.list(params),
        queryFn: () => getDrafts(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminDraft = (id, options = {}) => {
    return useQuery({
        queryKey: adminDraftsKeys.detail(id),
        queryFn: () => getDraftById(id),
        enabled: !!id,
        ...DETAIL_QUERY_DEFAULTS,
        ...options,
    });
};

export default {
    getDrafts,
    exportDrafts,
    getDraftById,
    useAdminDrafts,
    useAdminDraft,
};


