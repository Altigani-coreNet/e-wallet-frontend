import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import AdminMerchantResponse from './AdminMerchantResponse';

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

export const getMerchantDetails = async (id) => {
    if (!id) {
        throw new Error('Merchant id is required');
    }

    const response = await api.get(ADMIN_ENDPOINTS.MERCHANT_DETAILS(id));
    const payload = response.data ?? {};
    const merchantData = payload.data ?? payload;
    const normalizedMerchant = merchantData?.merchant ?? merchantData;

    return normalizedMerchant ?? null;
};

export const getMerchantsList = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.MERCHANTS, { params });
    const payload = response.data ?? {};
    const isSuccess = payload.success || payload.status;

    if (!isSuccess) {
        return {
            merchants: [],
            pagination: null,
        };
    }

    const resource = payload.data ?? {};
    const merchants = AdminMerchantResponse.fromApiArray(resource.data ?? []);
    const meta = resource.meta ?? {};

    return {
        merchants,
        pagination: {
            current_page: meta.current_page ?? 1,
            per_page: meta.per_page ?? 15,
            total: meta.total ?? merchants.length,
            last_page: meta.last_page ?? 1,
        },
    };
};

export default {
    getMerchantDetails,
    getMerchantsList,
};

