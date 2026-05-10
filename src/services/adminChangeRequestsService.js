import axios from 'axios';
import { attachAcceptLanguageInterceptor } from '../i18n/acceptLanguage';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

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

export const getChangeRequestStatistics = async () => {
    const response = await api.get(ADMIN_ENDPOINTS.CHANGE_REQUEST_STATISTICS);
    return response.data;
};

export const getChangeRequests = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.CHANGE_REQUESTS, { params });
    return response.data;
};

export const getChangeRequestById = async (id) => {
    const response = await api.get(ADMIN_ENDPOINTS.CHANGE_REQUEST_DETAILS(id));
    return response.data;
};

export const approveChangeRequest = async (id, payload = {}) => {
    const response = await api.post(ADMIN_ENDPOINTS.CHANGE_REQUEST_APPROVE(id), payload);
    return response.data;
};

export const rejectChangeRequest = async (id, payload = {}) => {
    const response = await api.post(ADMIN_ENDPOINTS.CHANGE_REQUEST_REJECT(id), payload);
    return response.data;
};

export default {
    getChangeRequestStatistics,
    getChangeRequests,
    getChangeRequestById,
    approveChangeRequest,
    rejectChangeRequest,
};


