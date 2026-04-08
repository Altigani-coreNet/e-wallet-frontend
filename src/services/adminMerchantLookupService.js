import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
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
    const id =
        item.shop_id ??
        item.merchant_id ??
        item.id ??
        fallbackId;

    if (id === undefined || id === null) {
        return null;
    }

    const name =
        item.name ??
        item.merchant_name ??
        item.business_name ??
        item.merchant ??
        '';

    const countryName =
        item.country_name ??
        item.countryName ??
        item.country ??
        '';

    return {
        id: String(id),
        name: name || '',
        countryName: countryName || '',
    };
};

const normalizePartnerRecord = (item = {}, fallbackId) => {
    const id = item.shop_id ?? item.partner_id ?? item.id ?? fallbackId;

    if (id === undefined || id === null) {
        return null;
    }

    const name = item.name ?? item.partner_name ?? item.business_name ?? item.partner ?? '';

    const countryName = item.country_name ?? item.countryName ?? item.country ?? '';

    const countryCode = item.country_code ?? item.countryCode ?? item.code ?? item.short_name ?? '';

    return {
        id: String(id),
        name: name || '',
        countryName: countryName || '',
        countryCode: countryCode || '',
    };
};

const extractPayload = (response) => {
    if (!response) return {};

    const data = response.data ?? response;
    const payload = data.data ?? data.items ?? data;

    return payload;
};

export const fetchMerchantCountryInfo = async (shopIds = []) => {
    if (!Array.isArray(shopIds) || shopIds.length === 0) {
        return {};
    }

    const uniqueIds = Array.from(
        new Set(
            shopIds
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    );

    if (!uniqueIds.length) {
        return {};
    }

    const response = await api.post(ADMIN_ENDPOINTS.MERCHANTS_COUNTRY_LOOKUP, {
        shop_ids: uniqueIds,
    });

    const payload = extractPayload(response);
    const result = {};

    if (Array.isArray(payload)) {
        payload.forEach((item = {}) => {
            const record = normalizeRecord(item);
            if (record) {
                result[record.id] = {
                    name: record.name,
                    countryName: record.countryName,
                };
            }
        });
    } else if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([key, value]) => {
            const record = normalizeRecord(value, key);
            if (record) {
                result[record.id] = {
                    name: record.name,
                    countryName: record.countryName,
                };
            }
        });
    }

    return result;
};

export const fetchPartnerCountryInfo = async (shopIds = []) => {
    if (!Array.isArray(shopIds) || shopIds.length === 0) {
        return {};
    }

    const uniqueIds = Array.from(
        new Set(
            shopIds
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    );

    if (!uniqueIds.length) {
        return {};
    }

    const response = await api.post(ADMIN_ENDPOINTS.CONTENT_PROVIDERS_COUNTRY_LOOKUP, {
        shop_ids: uniqueIds,
    });

    const payload = extractPayload(response);
    const result = {};

    if (Array.isArray(payload)) {
        payload.forEach((item = {}) => {
            const record = normalizePartnerRecord(item);
            if (record) {
                result[record.id] = {
                    name: record.name,
                    countryName: record.countryName,
                    countryCode: record.countryCode,
                };
            }
        });
    } else if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([key, value]) => {
            const record = normalizePartnerRecord(value, key);
            if (record) {
                result[record.id] = {
                    name: record.name,
                    countryName: record.countryName,
                    countryCode: record.countryCode,
                };
            }
        });
    }

    return result;
};

export default {
    fetchMerchantCountryInfo,
    fetchPartnerCountryInfo,
};

