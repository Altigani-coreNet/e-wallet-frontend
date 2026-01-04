import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const getAdvertisements = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENTS, {
            params: { page: params.page || 1, per_page: params.per_page || 15, ...params },
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch advertisements' };
    }
};

export const getAdvertisementsData = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENTS_DATA, {
            params: params,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch advertisements data' };
    }
};

export const getAdvertisement = async (advertisementId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENT_DETAILS(advertisementId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch advertisement' };
    }
};

export const createAdvertisement = async (advertisementData) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        Object.keys(advertisementData).forEach(key => {
            if (advertisementData[key] !== null && advertisementData[key] !== undefined) {
                formData.append(key, advertisementData[key]);
            }
        });

        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENTS, formData, {
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
            error: error.response?.data?.message || 'Failed to create advertisement',
            errors: error.response?.data?.errors
        };
    }
};

export const updateAdvertisement = async (advertisementId, advertisementData) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('_method', 'PUT');
        
        Object.keys(advertisementData).forEach(key => {
            if (advertisementData[key] !== null && advertisementData[key] !== undefined) {
                formData.append(key, advertisementData[key]);
            }
        });

        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENT_DETAILS(advertisementId), formData, {
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
            error: error.response?.data?.message || 'Failed to update advertisement',
            errors: error.response?.data?.errors
        };
    }
};

export const deleteAdvertisement = async (advertisementId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENT_DETAILS(advertisementId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete advertisement' };
    }
};

export const bulkDeleteAdvertisements = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENT_BULK_DELETE, { ids: ids.join(',') }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete advertisements' };
    }
};

export const changeAdvertisementStatus = async (advertisementId) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADVERTISEMENT_CHANGE_STATUS(advertisementId), {}, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to change advertisement status' };
    }
};


