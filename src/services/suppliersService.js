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
 * Fetch suppliers (for React Query)
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response data
 */
export const fetchSuppliers = async (params = {}) => {
    const token = getApiToken();
    const response = await axios.get(POS_ENDPOINTS.SUPPLIERS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    return response.data;
};

/**
 * Get all suppliers with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, search, country, city)
 * @returns {Promise} - API response
 */
export const getSuppliers = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.SUPPLIERS, {
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
        console.error('Error in getSuppliers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch suppliers'
        };
    }
};

/**
 * Get a single supplier by ID with purchase history
 * @param {string|number} supplierId - Supplier ID
 * @param {Object} params - Query parameters for purchase history (per_page, date_from, date_to)
 * @returns {Promise} - API response
 */
export const getSupplier = async (supplierId, params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.SUPPLIER_DETAILS(supplierId), {
            params,
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
        console.error('Error in getSupplier:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch supplier'
        };
    }
};

/**
 * Create a new supplier
 * @param {Object} supplierData - Supplier data to create
 * @returns {Promise} - API response
 */
export const createSupplier = async (supplierData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.SUPPLIERS, supplierData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.supplier || response.data.data || response.data,
            message: response.data.message || 'Supplier created successfully'
        };
    } catch (error) {
        console.error('Error in createSupplier:', error);
        return {
            success: false,
            statusCode: error.response?.status,
            errorCode: error.response?.data?.data?.code || error.response?.data?.code || error.response?.data?.Error_Code,
            error: error.response?.data?.message || error.message || 'Failed to create supplier',
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Update an existing supplier
 * @param {string|number} supplierId - Supplier ID
 * @param {Object} supplierData - Supplier data to update
 * @returns {Promise} - API response
 */
export const updateSupplier = async (supplierId, supplierData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(POS_ENDPOINTS.SUPPLIER_DETAILS(supplierId), supplierData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.supplier || response.data.data || response.data,
            message: response.data.message || 'Supplier updated successfully'
        };
    } catch (error) {
        console.error('Error in updateSupplier:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update supplier',
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Delete a supplier
 * @param {string|number} supplierId - Supplier ID
 * @returns {Promise} - API response
 */
export const deleteSupplier = async (supplierId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(POS_ENDPOINTS.SUPPLIER_DETAILS(supplierId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Supplier deleted successfully'
        };
    } catch (error) {
        console.error('Error in deleteSupplier:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete supplier'
        };
    }
};

/**
 * Bulk delete suppliers
 * @param {Array} supplierIds - Array of supplier IDs
 * @returns {Promise} - API response
 */
export const bulkDeleteSuppliers = async (supplierIds) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.SUPPLIER_BULK_DELETE, 
            { ids: supplierIds },
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
            message: response.data.message || 'Suppliers deleted successfully'
        };
    } catch (error) {
        console.error('Error in bulkDeleteSuppliers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete suppliers'
        };
    }
};

/**
 * Export suppliers to CSV
 * @param {Object} filters - Filter parameters
 * @returns {Promise} - Blob response
 */
export const exportSuppliers = async (filters = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.SUPPLIER_EXPORT, {
            params: filters,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/csv'
            },
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Error in exportSuppliers:', error);
        throw error;
    }
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for suppliers
 */
export const suppliersKeys = {
    all: ['suppliers'],
    list: (params) => ['suppliers', 'list', params],
    detail: (id) => ['suppliers', 'detail', id],
};

/**
 * React Query hook for fetching suppliers list
 */
export const useSuppliers = (params = {}, options = {}) => {
    return useQuery({
        queryKey: suppliersKeys.list(params),
        queryFn: () => fetchSuppliers(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

