import axios from 'axios';
import { ADMIN_ENDPOINTS, AUTH_SERVICE_BASE } from '../utils/constants';
import { getToken } from '../utils/api';

const api = axios.create({
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const normalizeRecord = (item = {}, fallbackId) => {
    const id = item.id ?? item.user_id ?? fallbackId;
    if (id === undefined || id === null) return null;

    const combinedName = [
        item.first_name ?? '',
        item.last_name ?? item.surname ?? item.family_name ?? '',
    ]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(' ');

    const name =
        combinedName ||
        item.name ||
        item.full_name ||
        item.user_name ||
        item.username ||
        item.email ||
        '';

    return {
        id: String(id),
        name: name || '',
    };
};

const extractPayload = (response) => {
    if (!response) return {};
    const data = response.data ?? response;
    return data.data ?? data.items ?? data;
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

    // Use original admin endpoint
    const response = await api.post(ADMIN_ENDPOINTS.USER_LOOKUP, {
        user_ids: uniqueIds,
    });

    const payload = extractPayload(response);
    const result = {};

    if (Array.isArray(payload)) {
        payload.forEach((item = {}) => {
            const record = normalizeRecord(item);
            if (record) {
                result[record.id] = { name: record.name };
            }
        });
    } else if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([key, value]) => {
            const record = normalizeRecord(value, key);
            if (record) {
                result[record.id] = { name: record.name };
            }
        });
    }

    return result;
};

/**
 * Fetch user information by IDs using v2/users/lookup endpoint (admin authentication required)
 */
export const fetchUserInfoByIdsV2 = async (userIds = []) => {
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

    // Use v2/users/lookup endpoint (admin authentication required)
    const response = await api.post(`${AUTH_SERVICE_BASE}/v2/users/lookup`, {
        user_ids: uniqueIds,
    });

    const payload = extractPayload(response);
    const result = {};

    if (Array.isArray(payload)) {
        payload.forEach((item = {}) => {
            const record = normalizeRecord(item);
            if (record) {
                result[record.id] = { name: record.name };
            }
        });
    } else if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([key, value]) => {
            const record = normalizeRecord(value, key);
            if (record) {
                result[record.id] = { name: record.name };
            }
        });
    }

    return result;
};

export default {
    fetchUserInfoByIds,
    fetchUserInfoByIdsV2,
};

