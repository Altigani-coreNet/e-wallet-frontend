import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import ContentProviderModel from './ContentProviderModel';

const getApiToken = () => getToken();

export const getPartners = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.CONTENT_PROVIDERS, {
            params,
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch partners' };
    }
};

export const exportPartners = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.CONTENT_PROVIDER_EXPORT, {
            params,
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to export partners' };
    }
};

export const bulkDeletePartners = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(
            ADMIN_ENDPOINTS.CONTENT_PROVIDER_BULK_DELETE,
            { ids },
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete partners' };
    }
};

export const approvePartner = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.post(
            ADMIN_ENDPOINTS.CONTENT_PROVIDER_APPROVE(id),
            {},
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to approve partner' };
    }
};

export const rejectPartner = async (id, body) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_ENDPOINTS.CONTENT_PROVIDER_REJECT(id), body, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to reject partner',
            errors: error.response?.data?.errors,
        };
    }
};

export const suspendPartner = async (id, body) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_ENDPOINTS.CONTENT_PROVIDER_SUSPEND(id), body, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to suspend partner' };
    }
};

export const unsuspendPartner = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.post(
            ADMIN_ENDPOINTS.CONTENT_PROVIDER_UNSUSPEND(id),
            {},
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to unsuspend partner' };
    }
};

export const deletePartner = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_ENDPOINTS.CONTENT_PROVIDER_DETAILS(id), {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete partner' };
    }
};

export const getPartner = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.CONTENT_PROVIDER_DETAILS(id), {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch partner' };
    }
};

export const createPartner = async (partnerData) => {
    try {
        const token = getApiToken();
        const isFormData = partnerData instanceof FormData;
        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        };
        if (isFormData) {
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            headers['Content-Type'] = 'application/json';
        }
        const response = await axios.post(ADMIN_ENDPOINTS.CONTENT_PROVIDERS, partnerData, { headers });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to create partner',
            errors: error.response?.data?.errors,
        };
    }
};

export const updatePartner = async (id, partnerData) => {
    try {
        const token = getApiToken();
        const isFormData = partnerData instanceof FormData;
        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        };
        if (isFormData) {
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            headers['Content-Type'] = 'application/json';
        }
        const response = await axios.post(
            `${ADMIN_ENDPOINTS.CONTENT_PROVIDERS}/${id}?_method=PUT`,
            partnerData,
            { headers }
        );
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to update partner',
            errors: error.response?.data?.errors,
        };
    }
};

export const getPartnersSelect = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.CONTENT_PROVIDERS_SELECT, {
            params,
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch partners' };
    }
};

export const previewPartnersImport = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('import_file', file);
        const response = await axios.post(ADMIN_ENDPOINTS.CONTENT_PROVIDER_IMPORT_PREVIEW, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import',
            errors: error.response?.data?.errors,
        };
    }
};

export const importPartners = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('import_file', file);
        const response = await axios.post(ADMIN_ENDPOINTS.CONTENT_PROVIDER_IMPORT, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import partners',
            errors: error.response?.data?.errors,
        };
    }
};

export const getSubPartners = async (parentId, params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.PARTNER_SUB_PARTNERS(parentId), {
            params,
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch sub-partners' };
    }
};

export const createSubPartner = async (parentId, partnerData) => {
    try {
        const token = getApiToken();
        const isFormData = partnerData instanceof FormData;
        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        };
        if (isFormData) {
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            headers['Content-Type'] = 'application/json';
        }
        const response = await axios.post(ADMIN_ENDPOINTS.PARTNER_SUB_PARTNERS(parentId), partnerData, { headers });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to create sub-partner',
            errors: error.response?.data?.errors,
        };
    }
};

export const downloadPartnersImportTemplate = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.CONTENT_PROVIDER_EXPORT_TEMPLATE, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `content_providers_import_template_${new Date().toISOString().split('T')[0]}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to download template' };
    }
};

/**
 * Maps `getPartners` / sub-partners list envelope (`response.data` from axios) into models + pagination meta.
 * @param {Record<string, unknown>|null|undefined} envelope
 * @returns {{ partners: import('./ContentProviderModel').ContentProviderModel[], pagination: { current_page: number, per_page: number, total: number, last_page: number } | null }}
 */
export function mapAdminPartnersPaginatedResponse(envelope) {
    const paginator = envelope?.data;
    if (!paginator || !Array.isArray(paginator.data)) {
        return { partners: [], pagination: null };
    }
    return {
        partners: ContentProviderModel.fromApiResponseArray(paginator.data),
        pagination: {
            current_page: paginator.current_page ?? 1,
            per_page: paginator.per_page ?? 15,
            total: paginator.total ?? 0,
            last_page: paginator.last_page ?? 1,
        },
    };
}
