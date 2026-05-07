import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

// Normalize admin payload from API resource into a consistent shape for the UI
const normalizeAdmin = (apiAdmin) => {
    if (!apiAdmin) return null;

    return {
        id: apiAdmin.id,
        name: apiAdmin.name,
        email: apiAdmin.email,
        phone: apiAdmin.phone || null,
        profile_image: apiAdmin.profile_image || null,
        status: apiAdmin.status || 'inactive',
        custom_region: !!apiAdmin.custom_region,
        roles: Array.isArray(apiAdmin.roles) ? apiAdmin.roles : [],
        regions: Array.isArray(apiAdmin.regions) ? apiAdmin.regions : [],
        country: apiAdmin.country || null,
        created_at: apiAdmin.created_at,
        raw: apiAdmin,
    };
};

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

        const payload = response.data?.data;

        let rows = [];
        let meta = {};

        // Case 1: backend returns simple array: { status: true, data: [ ...admins ] }
        if (Array.isArray(payload)) {
            rows = payload.map(normalizeAdmin);
            meta = {
                current_page: params.page || 1,
                per_page: params.per_page || rows.length,
                total: rows.length,
                last_page: 1,
            };
        } else if (payload && typeof payload === 'object') {
            // Case 2: backend returns paginator/resource: { status: true, data: { data: [...], meta: {...} } }
            const paginator = payload;
            const rawRows = Array.isArray(paginator.data) ? paginator.data : [];
            rows = rawRows.map(normalizeAdmin);
            meta = paginator.meta || {};
        }

        return {
            success: true,
            data: {
                admins: rows,
                meta: {
                    current_page: meta.current_page,
                    per_page: meta.per_page,
                    total: meta.total,
                    last_page: meta.last_page,
                },
            },
        };
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

        // Support both shapes:
        // 1) { status: true, data: { ...admin } }
        // 2) { status: true, data: { data: { ...admin } } }
        const payload = response.data?.data;
        const apiAdmin = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const normalized = normalizeAdmin(apiAdmin);

        if (!normalized) {
            return { success: false, error: 'Invalid admin response format' };
        }

        return { success: true, data: normalized };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch admin' };
    }
};

export const createAdmin = async (adminData) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        
        // Normalize custom_region to "1"/"0" so backend boolean casting works correctly
        const normalizedData = {
            ...adminData,
            ...(adminData.hasOwnProperty('custom_region') && {
                custom_region: adminData.custom_region ? '1' : '0',
            }),
        };

        Object.keys(normalizedData).forEach(key => {
            if (normalizedData[key] !== null && normalizedData[key] !== undefined) {
                if (Array.isArray(normalizedData[key])) {
                    normalizedData[key].forEach((item, index) => {
                        formData.append(`${key}[${index}]`, item);
                    });
                } else {
                    formData.append(key, normalizedData[key]);
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
        const apiAdmin = response.data?.data;
        return { success: true, data: normalizeAdmin(apiAdmin) };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to change admin status' };
    }
};


