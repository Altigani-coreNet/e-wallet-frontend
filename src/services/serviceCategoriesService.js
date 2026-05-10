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

/**
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export const fetchServiceCategoryDetails = async (id) => {
    if (!id) {
        throw new Error('Category id is required');
    }

    const response = await api.get(ADMIN_ENDPOINTS.SERVICE_CATEGORY_DETAILS(id));
    const payload = response.data ?? {};
    const data = payload.data ?? payload;

    return { success: true, data };
};

export default {
    fetchServiceCategoryDetails,
};
