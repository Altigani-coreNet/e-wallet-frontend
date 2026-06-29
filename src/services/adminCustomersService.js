import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';
import AdminCustomerModel, { mapAdminCustomersPaginated } from '../models/AdminCustomerModel';

const authHeaders = (accept = 'application/json') => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: accept,
});

/**
 * Fetch admin customers (for React Query). Returns the raw API payload so the
 * caller can read both the paginated list and pagination metadata.
 * @param {Object} params - Query parameters (page, per_page, sort_by, sort_direction, filters)
 * @returns {Promise<Object>} - API response data
 */
export const fetchAdminCustomers = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMERS, {
        params,
        headers: authHeaders(),
    });

    const body = response.data ?? {};

    return {
        ...body,
        data: mapAdminCustomersPaginated(body.data),
    };
};

/**
 * Fetch a single admin customer by UUID.
 */
export const fetchAdminCustomer = async (customerId) => {
    const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_DETAILS(customerId), {
        headers: authHeaders(),
    });

    const body = response.data ?? {};

    return {
        ...body,
        data: AdminCustomerModel.fromApi(body.data),
    };
};

/**
 * Delete a single admin customer.
 * @param {string|number} customerId - Customer ID
 * @returns {Promise<Object>} - Normalized API response
 */
export const deleteAdminCustomer = async (customerId) => {
    try {
        const response = await axios.delete(ADMIN_ENDPOINTS.CUSTOMER_DETAILS(customerId), {
            headers: authHeaders(),
        });
        return {
            success: response.data?.success ?? response.data?.status ?? true,
            message: response.data?.message,
        };
    } catch (error) {
        console.error('Error in deleteAdminCustomer:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete customer',
        };
    }
};

/**
 * Bulk delete admin customers.
 * @param {Array<string|number>} ids - Customer IDs
 * @returns {Promise<Object>} - Normalized API response
 */
export const bulkDeleteAdminCustomers = async (ids = []) => {
    try {
        const response = await axios.post(
            ADMIN_ENDPOINTS.CUSTOMER_BULK_DELETE,
            { ids },
            { headers: authHeaders() }
        );
        return {
            success: response.data?.success ?? response.data?.status ?? true,
            message: response.data?.message,
        };
    } catch (error) {
        console.error('Error in bulkDeleteAdminCustomers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete customers',
        };
    }
};

export const updateAdminCustomerStatus = async (customerId, status) => {
    try {
        const response = await axios.post(
            ADMIN_ENDPOINTS.CUSTOMER_UPDATE_STATUS(customerId),
            { status },
            { headers: authHeaders() }
        );
        return {
            success: response.data?.success ?? response.data?.status ?? true,
            message: response.data?.message,
            data: AdminCustomerModel.fromApi(response.data?.data),
        };
    } catch (error) {
        console.error('Error in updateAdminCustomerStatus:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update customer status',
        };
    }
};

/**
 * Toggle an admin customer's status (legacy active/suspended shortcut).
 */
export const toggleAdminCustomerStatus = async (customerId) => {
    try {
        const response = await axios.post(
            ADMIN_ENDPOINTS.CUSTOMER_TOGGLE_STATUS(customerId),
            {},
            { headers: authHeaders() }
        );
        return {
            success: response.data?.success ?? response.data?.status ?? true,
            message: response.data?.message,
        };
    } catch (error) {
        console.error('Error in toggleAdminCustomerStatus:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update customer status',
        };
    }
};

/**
 * Fetch admin customers export as CSV blob.
 */
export const downloadAdminCustomersExport = async (filters = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_EXPORT, {
        params: filters,
        headers: authHeaders('text/csv'),
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Download admin customer import template as CSV blob.
 */
export const downloadAdminCustomersTemplate = async () => {
    const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_EXPORT_TEMPLATE, {
        headers: authHeaders('text/csv'),
        responseType: 'blob',
    });
    return response.data;
};

export const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Fetch admin customers export payload (JSON rows that the caller converts to CSV).
 * @deprecated Use downloadAdminCustomersExport for CSV blob export.
 */
export const exportAdminCustomers = async (filters = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_EXPORT, {
        params: filters,
        headers: authHeaders(),
    });
    return response.data;
};

// ==================== REACT QUERY ====================

export const adminCustomersKeys = {
    all: ['admin', 'customers'],
    list: (params) => ['admin', 'customers', 'list', params],
    detail: (id) => ['admin', 'customers', 'detail', id],
};

/**
 * React Query hook for the admin customers list.
 */
export const useAdminCustomers = (params = {}, options = {}) => {
    return useQuery({
        queryKey: adminCustomersKeys.list(params),
        queryFn: () => fetchAdminCustomers(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};
