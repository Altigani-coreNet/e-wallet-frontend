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

const extractList = (payload) => {
    if (!payload) return [];

    if (Array.isArray(payload.data)) {
        return payload.data;
    }

    if (Array.isArray(payload.items)) {
        return payload.items;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload.data && Array.isArray(payload.data.data)) {
        return payload.data.data;
    }

    return [];
};

const normalizeLocaleString = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return normalizeLocaleString(parsed);
            } catch (error) {
                return trimmed;
            }
        }
        return trimmed;
    }

    if (typeof value === 'object') {
        for (const locale of ['en', 'en_US', 'en-US', 'ar', 'ar_SA', 'ar-SA']) {
            if (value[locale]) {
                return String(value[locale]);
            }
        }

        const firstNonEmpty = Object.values(value).find(Boolean);
        if (firstNonEmpty) {
            return String(firstNonEmpty);
        }
    }

    return '';
};

const normalizeOption = (item) => {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const id =
        item.id ??
        item.value ??
        item.key ??
        item.shop_id ??
        item.merchant_id ??
        item.supplier_id ??
        item.warehouse_id ??
        null;

    if (id === null || id === undefined) {
        return null;
    }

    const labelCandidates = [
        item.label,
        item.text,
        item.name,
        item.business_name,
        item.company_name,
        item.merchant_name,
        item.title,
        item.reference,
    ];

    let label = '';
    for (const candidate of labelCandidates) {
        label = normalizeLocaleString(candidate);
        if (label) break;
    }

    if (!label) {
        if (typeof item.code === 'string') {
            label = item.code.toUpperCase();
        } else {
            label = `#${id}`;
        }
    }

    return {
        id,
        value: String(id),
        label,
        raw: item,
    };
};

const mapToOptions = (list) => {
    if (!Array.isArray(list)) {
        return [];
    }
    return list.map(normalizeOption).filter(Boolean);
};

export const fetchAdminMerchantSelectOptions = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.MERCHANTS_SELECT, { params });
    return mapToOptions(extractList(response.data ?? response));
};

export const fetchAdminSupplierSelectOptions = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.SUPPLIERS_SELECT, { params });
    return mapToOptions(extractList(response.data ?? response));
};

export const fetchAdminWarehouseSelectOptions = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.WAREHOUSES_SELECT, { params });
    return mapToOptions(extractList(response.data ?? response));
};

export const fetchAdminCustomerSelectOptions = async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.CUSTOMERS_SELECT, { params });
    return mapToOptions(extractList(response.data ?? response));
};

export default {
    fetchAdminMerchantSelectOptions,
    fetchAdminSupplierSelectOptions,
    fetchAdminWarehouseSelectOptions,
    fetchAdminCustomerSelectOptions,
};










