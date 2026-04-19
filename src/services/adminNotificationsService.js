import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/json',
    },
});

export const getNotifications = async (params = {}) => {
    return axios.get(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATIONS, {
        ...withAuth(),
        params,
    });
};

export const getNotification = async (id) => {
    return axios.get(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATION_DETAILS(id), withAuth());
};

export const createNotification = async (payload) => {
    return axios.post(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATIONS, payload, {
        ...withAuth(),
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updateNotification = async (id, payload) => {
    return axios.post(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATION_DETAILS(id), payload, {
        ...withAuth(),
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteNotification = async (id) => {
    return axios.delete(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATION_DETAILS(id), withAuth());
};

export const resendNotification = async (id) => {
    return axios.post(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATION_RESEND(id), {}, withAuth());
};

export const getMerchantOptions = async (search = '') => {
    return axios.get(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATION_MERCHANTS_SELECT, {
        ...withAuth(),
        params: { search },
    });
};

export const getUsersByMerchant = async (merchantId, search = '') => {
    return axios.get(ADMIN_SYSTEM_ENDPOINTS.NOTIFICATION_USERS_BY_MERCHANT, {
        ...withAuth(),
        params: { merchant_id: merchantId, search },
    });
};
