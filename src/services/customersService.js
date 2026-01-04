import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { POS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Fetch customers (for React Query)
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response data
 */
export const fetchCustomers = async (params = {}) => {
    const token = getApiToken();
    const response = await axios.get(POS_ENDPOINTS.CUSTOMERS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    return response.data;
};

/**
 * Get all customers with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, search, customer_group_id, date_from, date_to)
 * @returns {Promise} - API response
 */
export const getCustomers = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.CUSTOMERS, {
            params: queryParams,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in getCustomers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch customers'
        };
    }
};

/**
 * Get a single customer by ID
 * @param {string|number} customerId - Customer ID
 * @returns {Promise} - API response
 */
export const getCustomer = async (customerId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.CUSTOMER_DETAILS(customerId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.customers || response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in getCustomer:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch customer'
        };
    }
};

/**
 * Search customers
 * @param {string} searchTerm - Search term
 * @returns {Promise} - API response
 */
export const searchCustomers = async (searchTerm) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.CUSTOMER_SEARCH, {
            params: { search: searchTerm },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.customers || response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in searchCustomers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to search customers'
        };
    }
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data to create
 * @returns {Promise} - API response
 */
export const createCustomer = async (customerData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.CUSTOMERS, customerData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.customer || response.data.data || response.data,
            message: response.data.message || 'Customer created successfully'
        };
    } catch (error) {
        console.error('Error in createCustomer:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create customer',
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Update an existing customer
 * @param {string|number} customerId - Customer ID
 * @param {Object} customerData - Customer data to update
 * @returns {Promise} - API response
 */
export const updateCustomer = async (customerId, customerData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(POS_ENDPOINTS.CUSTOMER_DETAILS(customerId), customerData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.customer || response.data.data || response.data,
            message: response.data.message || 'Customer updated successfully'
        };
    } catch (error) {
        console.error('Error in updateCustomer:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update customer',
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Delete a customer
 * @param {string|number} customerId - Customer ID
 * @returns {Promise} - API response
 */
export const deleteCustomer = async (customerId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(POS_ENDPOINTS.CUSTOMER_DETAILS(customerId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Customer deleted successfully'
        };
    } catch (error) {
        console.error('Error in deleteCustomer:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete customer'
        };
    }
};

/**
 * Bulk delete customers
 * @param {Array} customerIds - Array of customer IDs
 * @returns {Promise} - API response
 */
export const bulkDeleteCustomers = async (customerIds) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.CUSTOMER_BULK_DELETE, 
            { ids: customerIds },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Customers deleted successfully'
        };
    } catch (error) {
        console.error('Error in bulkDeleteCustomers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete customers'
        };
    }
};

/**
 * Get customer groups for dropdown
 * @returns {Promise} - API response
 */
export const getCustomerGroups = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.CUSTOMER_GROUPS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.customerGroups || response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in getCustomerGroups:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch customer groups'
        };
    }
};

/**
 * Export customers to CSV
 * @param {Object} filters - Filter parameters
 * @returns {Promise} - Blob response
 */
export const exportCustomers = async (filters = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.CUSTOMER_EXPORT, {
            params: filters,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/csv'
            },
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Error in exportCustomers:', error);
        throw error;
    }
};

/**
 * Download customer import template
 * @returns {Promise} - Blob response
 */
export const exportCustomersTemplate = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.CUSTOMER_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/csv'
            },
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Error in exportCustomersTemplate:', error);
        throw error;
    }
};

/**
 * Preview customer import
 * @param {File} file - CSV or Excel file
 * @returns {Promise} - API response with preview data
 */
export const importCustomersPreview = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('import_file', file);

        const response = await axios.post(POS_ENDPOINTS.CUSTOMER_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message
        };
    } catch (error) {
        console.error('Error in importCustomersPreview:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to preview import'
        };
    }
};

/**
 * Import customers from file
 * @param {File} file - CSV or Excel file
 * @returns {Promise} - API response with import results
 */
export const importCustomers = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('import_file', file);

        const response = await axios.post(POS_ENDPOINTS.CUSTOMER_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message
        };
    } catch (error) {
        console.error('Error in importCustomers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to import customers'
        };
    }
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for customers
 */
export const customersKeys = {
    all: ['customers'],
    list: (params) => ['customers', 'list', params],
    detail: (id) => ['customers', 'detail', id],
};

/**
 * React Query hook for fetching customers list
 */
export const useCustomers = (params = {}, options = {}) => {
    return useQuery({
        queryKey: customersKeys.list(params),
        queryFn: () => fetchCustomers(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

