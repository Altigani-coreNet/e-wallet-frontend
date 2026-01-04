import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const getServiceFeesData = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEES_DATA, {
            params: params,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch service fees data' };
    }
};

export const getServiceFees = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEES, {
            params: { page: params.page || 1, per_page: params.per_page || 15, ...params },
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch service fees' };
    }
};

export const getServiceFee = async (serviceFeeId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEE_DETAILS(serviceFeeId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch service fee' };
    }
};

export const createServiceFee = async (serviceFeeData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEES, serviceFeeData, {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.message || 'Failed to create service fee',
            errors: error.response?.data?.errors
        };
    }
};

export const updateServiceFee = async (serviceFeeId, serviceFeeData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEE_DETAILS(serviceFeeId), serviceFeeData, {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.message || 'Failed to update service fee',
            errors: error.response?.data?.errors
        };
    }
};

export const deleteServiceFee = async (serviceFeeId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEE_DETAILS(serviceFeeId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete service fee' };
    }
};

export const bulkDeleteServiceFees = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEE_BULK_DELETE, { ids: ids.join(',') }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete service fees' };
    }
};

export const importServiceFees = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('import_file', file);

        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEE_IMPORT, formData, {
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
            error: error.response?.data?.message || 'Failed to import service fees',
            errors: error.response?.data?.errors
        };
    }
};

export const exportServiceFeesTemplate = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.SERVICE_FEE_EXPORT_TEMPLATE, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'service_fees_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to export template' };
    }
};


