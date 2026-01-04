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
 * Fetch purchases (for React Query)
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response data
 */
export const fetchPurchases = async (params = {}) => {
    const token = getApiToken();
    const response = await axios.get(POS_ENDPOINTS.PURCHASES, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    return response.data;
};

/**
 * Get all purchases with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, warehouse_id, supplier_id, start_date, end_date, search)
 * @returns {Promise} - API response
 */
export const getPurchases = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.PURCHASES, {
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
        console.error('Error in getPurchases:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch purchases'
        };
    }
};

/**
 * Get a single purchase by ID
 * @param {string|number} purchaseId - Purchase ID
 * @returns {Promise} - API response
 */
export const getPurchase = async (purchaseId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.PURCHASE_DETAILS(purchaseId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.purchase || response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in getPurchase:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch purchase'
        };
    }
};

/**
 * Create a new purchase
 * @param {Object} purchaseData - Purchase data with products
 * @returns {Promise} - API response
 */
export const createPurchase = async (purchaseData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.PURCHASES, purchaseData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.purchase || response.data.data || response.data,
            message: response.data.message || 'Purchase created successfully'
        };
    } catch (error) {
        console.error('Error in createPurchase:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create purchase',
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Update an existing purchase
 * @param {string|number} purchaseId - Purchase ID
 * @param {Object} purchaseData - Purchase data to update
 * @returns {Promise} - API response
 */
export const updatePurchase = async (purchaseId, purchaseData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(POS_ENDPOINTS.PURCHASE_DETAILS(purchaseId), purchaseData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data?.purchase || response.data.data || response.data,
            message: response.data.message || 'Purchase updated successfully'
        };
    } catch (error) {
        console.error('Error in updatePurchase:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update purchase',
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Delete a purchase
 * @param {string|number} purchaseId - Purchase ID
 * @returns {Promise} - API response
 */
export const deletePurchase = async (purchaseId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(POS_ENDPOINTS.PURCHASE_DETAILS(purchaseId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Purchase deleted successfully'
        };
    } catch (error) {
        console.error('Error in deletePurchase:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete purchase'
        };
    }
};

/**
 * Bulk delete purchases
 * @param {Array} purchaseIds - Array of purchase IDs
 * @returns {Promise} - API response
 */
export const bulkDeletePurchases = async (purchaseIds) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.PURCHASE_BULK_DELETE, 
            { ids: purchaseIds },
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
            message: response.data.message || 'Purchases deleted successfully'
        };
    } catch (error) {
        console.error('Error in bulkDeletePurchases:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete purchases'
        };
    }
};

/**
 * Export purchases to CSV
 * @param {Object} filters - Filter parameters
 * @returns {Promise} - Blob response
 */
export const exportPurchases = async (filters = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.PURCHASE_EXPORT, {
            params: filters,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/csv'
            },
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Error in exportPurchases:', error);
        throw error;
    }
};

/**
 * Export purchases to PDF
 * @param {Object} filters - Filter parameters
 * @returns {Promise} - API response with PDF URL
 */
export const exportPurchasesPDF = async (filters = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.PURCHASE_PDF, {
            params: filters,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data,
            pdfUrl: response.data.data?.invoice_pdf_url || response.data.invoice_pdf_url
        };
    } catch (error) {
        console.error('Error in exportPurchasesPDF:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to export PDF'
        };
    }
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for purchases
 */
export const purchasesKeys = {
    all: ['purchases'],
    list: (params) => ['purchases', 'list', params],
    detail: (id) => ['purchases', 'detail', id],
};

/**
 * React Query hook for fetching purchases list
 */
export const usePurchases = (params = {}, options = {}) => {
    return useQuery({
        queryKey: purchasesKeys.list(params),
        queryFn: () => fetchPurchases(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

