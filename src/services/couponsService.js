import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { POS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

const getApiToken = () => getToken();

export const fetchCoupons = async (params = {}) => {
    const token = getApiToken();

    const response = await axios.get(POS_ENDPOINTS.COUPONS, {
        params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    return response.data;
};

export const fetchCouponDetails = async (id) => {
    const token = getApiToken();

    const response = await axios.get(POS_ENDPOINTS.COUPON_DETAILS(id), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    return response.data;
};

export const createCoupon = async (data) => {
    const token = getApiToken();

    const response = await axios.post(POS_ENDPOINTS.COUPON_CREATE, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    return response.data;
};

export const updateCoupon = async (id, data) => {
    const token = getApiToken();

    const response = await axios.post(POS_ENDPOINTS.COUPON_UPDATE(id), data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    return response.data;
};

export const deleteCoupon = async (id) => {
    const token = getApiToken();

    const response = await axios.delete(POS_ENDPOINTS.COUPON_DELETE(id), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    return response.data;
};

export const bulkDeleteCoupons = async (ids = []) => {
    const token = getApiToken();

    const response = await axios.post(POS_ENDPOINTS.COUPON_BULK_DELETE, { ids }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    return response.data;
};

export const fetchCouponsForSelect = async (params = {}) => {
    const token = getApiToken();

    const response = await axios.get(POS_ENDPOINTS.COUPONS_SELECT, {
        params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    return response.data?.data ?? [];
};

export const exportCoupons = async (params = {}) => {
    const token = getApiToken();

    const response = await axios.get(POS_ENDPOINTS.COUPON_EXPORT, {
        params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        responseType: 'blob'
    });

    return response.data;
};

export const exportCouponTemplate = async () => {
    const token = getApiToken();

    const response = await axios.get(POS_ENDPOINTS.COUPON_EXPORT_TEMPLATE, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        responseType: 'blob'
    });

    return response.data;
};

export const importCouponsPreview = async (file) => {
    const token = getApiToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(POS_ENDPOINTS.COUPON_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview coupon import',
        };
    }
};

export const importCoupons = async (file) => {
    const token = getApiToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(POS_ENDPOINTS.COUPON_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import coupons',
        };
    }
};

export const couponsKeys = {
    all: ['coupons'],
    list: (params) => ['coupons', 'list', params],
    detail: (id) => ['coupons', 'detail', id],
};

export const useCoupons = (params = {}, options = {}) => {
    return useQuery({
        queryKey: couponsKeys.list(params),
        queryFn: () => fetchCoupons(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};


