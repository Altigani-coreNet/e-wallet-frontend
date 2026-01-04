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
 * Fetch products
 */
export const fetchProducts = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCTS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Fetch product details
 */
export const fetchProductDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching product details:', error);
        throw error;
    }
};

/**
 * Fetch product sales
 */
export const fetchProductSales = async (id, params = {}) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_SALES(id), {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching product sales:', error);
        throw error;
    }
};

/**
 * Fetch product purchases
 */
export const fetchProductPurchases = async (id, params = {}) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_PURCHASES(id), {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching product purchases:', error);
        throw error;
    }
};

/**
 * Fetch product warehouses
 */
export const fetchProductWarehouses = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_WAREHOUSES(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching product warehouses:', error);
        throw error;
    }
};

/**
 * Create product
 */
export const createProduct = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.PRODUCT_CREATE, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error creating product:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create product',
            statusCode: error.response?.status,
            errorCode: error.response?.data?.data?.code || error.response?.data?.code
        };
    }
};

/**
 * Update product
 */
export const updateProduct = async (id, data) => {
    const token = getApiToken();
    
    try {
        // For FormData with file uploads, use POST with _method=PUT
        // Some Laravel backends handle PUT with FormData differently
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response = await axios.post(POS_ENDPOINTS.PRODUCT_UPDATE(id), data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } else {
            // For regular JSON data, use PUT
            const response = await axios.put(POS_ENDPOINTS.PRODUCT_UPDATE(id), data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.PRODUCT_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

/**
 * Fetch product select options (categories, brands, taxes, etc.)
 */
export const fetchProductSelectOptions = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_SELECT_OPTIONS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching product select options:', error);
        throw error;
    }
};

/**
 * Fetch categories for select (supports optional params like search/page)
 */
export const fetchCategoriesForSelect = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.CATEGORIES_SELECT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Fetch brands for select
 */
export const fetchBrandsForSelect = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.BRANDS_SELECT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
    }
};

/**
 * Fetch tags for select
 */
export const fetchTagsForSelect = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.TAGS_SELECT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching tags:', error);
        throw error;
    }
};

/**
 * Fetch taxes for select
 */
export const fetchTaxesForSelect = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.TAXES_SELECT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching taxes:', error);
        throw error;
    }
};

/**
 * Fetch warehouses for select
 */
export const fetchWarehousesForSelect = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSES_SELECT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        throw error;
    }
};

/**
 * Fetch units for select
 */
export const fetchUnitsForSelect = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.UNITS_SELECT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching units:', error);
        throw error;
    }
};

/**
 * Export products
 */
export const exportProducts = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_EXPORT, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting products:', error);
        throw error;
    }
};

/**
 * Download product template
 */
export const downloadProductTemplate = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.PRODUCT_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading product template:', error);
        throw error;
    }
};

/**
 * Preview product import
 */
export const previewProductImport = async (file) => {
    const token = getApiToken();
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await axios.post(POS_ENDPOINTS.PRODUCT_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error previewing product import:', error);
        throw error;
    }
};

/**
 * Import products
 */
export const importProducts = async (file) => {
    const token = getApiToken();
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await axios.post(POS_ENDPOINTS.PRODUCT_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error importing products:', error);
        throw error;
    }
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for products
 */
export const productsKeys = {
    all: ['products'],
    list: (params) => ['products', 'list', params],
    detail: (id) => ['products', 'detail', id],
};

/**
 * React Query hook for fetching products list
 */
export const useProducts = (params = {}, options = {}) => {
    return useQuery({
        queryKey: productsKeys.list(params),
        queryFn: () => fetchProducts(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

