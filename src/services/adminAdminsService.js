import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const getAdmins = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ADMINS, {
            params: { page: params.page || 1, per_page: params.per_page || 15, ...params },
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch admins' };
    }
};

export const getAdminsData = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ADMINS_DATA, {
            params: params,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch admins data' };
    }
};

export const getAdmin = async (adminId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ADMIN_DETAILS(adminId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch admin' };
    }
};

export const createAdmin = async (adminData) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        Object.keys(adminData).forEach(key => {
            if (adminData[key] !== null && adminData[key] !== undefined) {
                if (Array.isArray(adminData[key])) {
                    adminData[key].forEach((item, index) => {
                        formData.append(`${key}[${index}]`, item);
                    });
                } else {
                    formData.append(key, adminData[key]);
                }
            }
        });

        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADMINS, formData, {
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
            error: error.response?.data?.message || 'Failed to create admin',
            errors: error.response?.data?.errors
        };
    }
};

export const updateAdmin = async (adminId, adminData) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('_method', 'PUT');
        
        Object.keys(adminData).forEach(key => {
            if (adminData[key] !== null && adminData[key] !== undefined) {
                if (Array.isArray(adminData[key])) {
                    adminData[key].forEach((item, index) => {
                        formData.append(`${key}[${index}]`, item);
                    });
                } else {
                    formData.append(key, adminData[key]);
                }
            }
        });

        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADMIN_DETAILS(adminId), formData, {
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
            error: error.response?.data?.message || 'Failed to update admin',
            errors: error.response?.data?.errors
        };
    }
};

export const deleteAdmin = async (adminId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_SYSTEM_ENDPOINTS.ADMIN_DETAILS(adminId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete admin' };
    }
};

export const bulkDeleteAdmins = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADMIN_BULK_DELETE, { ids: ids.join(',') }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete admins' };
    }
};

export const changeAdminStatus = async (adminId) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ADMIN_CHANGE_STATUS(adminId), {}, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to change admin status' };
    }
};


