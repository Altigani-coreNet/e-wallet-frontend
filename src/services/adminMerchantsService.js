import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

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

export default {
    getMerchantDetails,
};

