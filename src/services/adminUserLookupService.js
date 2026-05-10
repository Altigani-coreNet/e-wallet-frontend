import axios from 'axios';
import { attachAcceptLanguageInterceptor } from '../i18n/acceptLanguage';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const api = axios.create({
    headers: {
        Accept: 'application/json',
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

const normalizeRecord = (item = {}, fallbackId) => {
    const id =
        item.id ??
        item.user_id ??
        fallbackId;

    if (id === undefined || id === null) {
        return null;
    }

    const name =
        item.name ??
        item.full_name ??
        item.user_name ??
        item.username ??
        item.email ??
        '';

    return {
        id: String(id),
        name: name || '',
    };
};

const extractPayload = (response) => {
    if (!response) return {};

    const data = response.data ?? response;
    const payload = data.data ?? data.items ?? data;

    return payload;
};

export const fetchUserInfoByIds = async (userIds = []) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return {};
    }

    const uniqueIds = Array.from(
        new Set(
            userIds
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    );

    if (!uniqueIds.length) {
        return {};
    }

    const response = await api.post(ADMIN_ENDPOINTS.USER_LOOKUP, {
        user_ids: uniqueIds,
    });

    const payload = extractPayload(response);
    const result = {};

    if (Array.isArray(payload)) {
        payload.forEach((item = {}) => {
            const record = normalizeRecord(item);
            if (record) {
                result[record.id] = {
                    name: record.name,
                };
            }
        });
    } else if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([key, value]) => {
            const record = normalizeRecord(value, key);
            if (record) {
                result[record.id] = {
                    name: record.name,
                };
            }
        });
    }

    return result;
};

export default {
    fetchUserInfoByIds,
};

