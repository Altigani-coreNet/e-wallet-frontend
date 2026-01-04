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

// ==================== TAGS ====================

/**
 * Fetch tags
 */
export const fetchTags = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.TAGS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching tags:', error);
        throw error;
    }
};

/**
 * Fetch tag details
 */
export const fetchTagDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.TAG_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching tag details:', error);
        throw error;
    }
};

/**
 * Create tag
 */
export const createTag = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.TAG_CREATE, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating tag:', error);
        throw error;
    }
};

/**
 * Update tag
 */
export const updateTag = async (id, data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.TAG_UPDATE(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating tag:', error);
        throw error;
    }
};

/**
 * Delete tag
 */
export const deleteTag = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.TAG_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting tag:', error);
        throw error;
    }
};

/**
 * Toggle tag status
 */
export const toggleTagStatus = async (id) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.TAG_TOGGLE_STATUS(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling tag status:', error);
        throw error;
    }
};

// ==================== TAXES ====================

/**
 * Fetch taxes
 */
export const fetchTaxes = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.TAXES, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching taxes:', error);
        throw error;
    }
};

/**
 * Fetch tax details
 */
export const fetchTaxDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.TAX_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching tax details:', error);
        throw error;
    }
};

/**
 * Create tax
 */
export const createTax = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.TAX_CREATE, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating tax:', error);
        throw error;
    }
};

/**
 * Update tax
 */
export const updateTax = async (id, data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.TAX_UPDATE(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating tax:', error);
        throw error;
    }
};

/**
 * Delete tax
 */
export const deleteTax = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.TAX_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting tax:', error);
        throw error;
    }
};

// ==================== CATEGORIES ====================

/**
 * Fetch categories
 */
export const fetchCategories = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.CATEGORIES, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Fetch parent categories
 */
export const fetchParentCategories = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.CATEGORY_PARENT, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching parent categories:', error);
        throw error;
    }
};

/**
 * Fetch category details
 */
export const fetchCategoryDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.CATEGORY_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching category details:', error);
        throw error;
    }
};

/**
 * Create category
 */
export const createCategory = async (data) => {
    const token = getApiToken();
    
    try {
        // Check if data is FormData (for file uploads)
        const isFormData = data instanceof FormData;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        
        // Explicitly set Content-Type based on payload type
        // - For FormData: use multipart/form-data (file uploads)
        // - For JSON objects: use application/json
        if (isFormData) {
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios.post(POS_ENDPOINTS.CATEGORY_CREATE, data, {
            headers: headers
        });
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

/**
 * Update category
 */
export const updateCategory = async (id, data) => {
    const token = getApiToken();
    
    try {
        // Check if data is FormData (for file uploads)
        const isFormData = data instanceof FormData;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        
        // Only set Content-Type for FormData, let browser set it with boundary
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios.post(POS_ENDPOINTS.CATEGORY_UPDATE(id), data, {
            headers: headers
        });
        return response.data;
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
};

/**
 * Delete category
 */
export const deleteCategory = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.CATEGORY_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
};

/**
 * Toggle category status
 */
export const toggleCategoryStatus = async (id) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.CATEGORY_TOGGLE_STATUS(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling category status:', error);
        throw error;
    }
};

// ==================== WAREHOUSES ====================

/**
 * Fetch warehouses
 */
export const fetchWarehouses = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSES, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        throw error;
    }
};

/**
 * Fetch warehouse details
 */
export const fetchWarehouseDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSE_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching warehouse details:', error);
        throw error;
    }
};

/**
 * Create warehouse
 */
export const createWarehouse = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_CREATE, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating warehouse:', error);
        throw error;
    }
};

/**
 * Update warehouse
 */
export const updateWarehouse = async (id, data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_UPDATE(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating warehouse:', error);
        throw error;
    }
};

/**
 * Delete warehouse
 */
export const deleteWarehouse = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.WAREHOUSE_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        throw error;
    }
};

/**
 * Toggle warehouse status
 */
export const toggleWarehouseStatus = async (id) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_TOGGLE_STATUS(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling warehouse status:', error);
        throw error;
    }
};

/**
 * Fetch warehouse products
 */
export const fetchWarehouseProducts = async (id, params = {}) => {
    const token = getApiToken();

    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSE_PRODUCTS(id), {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching warehouse products:', error);
        throw error;
    }
};

/**
 * Fetch warehouse transactions
 */
export const fetchWarehouseTransactions = async (id, params = {}) => {
    const token = getApiToken();

    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSE_TRANSACTIONS(id), {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching warehouse transactions:', error);
        throw error;
    }
};

/**
 * Receive goods into a warehouse
 */
export const receiveWarehouseGoods = async (id, data) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_RECEIVE_GOODS(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error receiving goods:', error);
        throw error;
    }
};

/**
 * Transfer goods between warehouses
 */
export const transferWarehouseGoods = async (id, data) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_TRANSFER_GOODS(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error transferring goods:', error);
        throw error;
    }
};

/**
 * Transfer goods from warehouse to store
 */
export const transferWarehouseToStore = async (id, data) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_TRANSFER_TO_STORE(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error transferring goods to store:', error);
        throw error;
    }
};

// ==================== BRANDS ====================

/**
 * Fetch brands
 */
export const fetchBrands = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.BRANDS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
    }
};

/**
 * Fetch brand details
 */
export const fetchBrandDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.BRAND_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching brand details:', error);
        throw error;
    }
};

/**
 * Create brand
 */
export const createBrand = async (data) => {
    const token = getApiToken();
    
    try {
        // Check if data is FormData (for file uploads)
        const isFormData = data instanceof FormData;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        
        // Explicitly set Content-Type based on payload type
        // - For FormData: use multipart/form-data (file uploads)
        // - For JSON objects: use application/json
        if (isFormData) {
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios.post(POS_ENDPOINTS.BRAND_CREATE, data, {
            headers: headers
        });
        return response.data;
    } catch (error) {
        console.error('Error creating brand:', error);
        throw error;
    }
};

/**
 * Update brand
 */
export const updateBrand = async (id, data) => {
    const token = getApiToken();
    
    try {
        // Check if data is FormData (for file uploads)
        const isFormData = data instanceof FormData;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        
        // Don't set Content-Type for FormData - let browser/axios set it with boundary
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios.post(POS_ENDPOINTS.BRAND_UPDATE(id), data, {
            headers: headers
        });
        return response.data;
    } catch (error) {
        console.error('Error updating brand:', error);
        throw error;
    }
};

/**
 * Delete brand
 */
export const deleteBrand = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.BRAND_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting brand:', error);
        throw error;
    }
};

/**
 * Toggle brand status
 */
export const toggleBrandStatus = async (id) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.BRAND_TOGGLE_STATUS(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling brand status:', error);
        throw error;
    }
};

// ==================== UNITS ====================

/**
 * Fetch units
 */
export const fetchUnits = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.UNITS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching units:', error);
        throw error;
    }
};

/**
 * Fetch unit details
 */
export const fetchUnitDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.UNIT_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching unit details:', error);
        throw error;
    }
};

/**
 * Create unit
 */
export const createUnit = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.UNIT_CREATE, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating unit:', error);
        throw error;
    }
};

/**
 * Update unit
 */
export const updateUnit = async (id, data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(POS_ENDPOINTS.UNIT_UPDATE(id), data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating unit:', error);
        throw error;
    }
};

/**
 * Delete unit
 */
export const deleteUnit = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(POS_ENDPOINTS.UNIT_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting unit:', error);
        throw error;
    }
};

/**
 * Toggle unit status
 */
export const toggleUnitStatus = async (id) => {
    const token = getApiToken();

    try {
        const response = await axios.post(POS_ENDPOINTS.UNIT_TOGGLE_STATUS(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling unit status:', error);
        throw error;
    }
};

// ==================== BULK DELETE ====================

/**
 * Bulk delete brands
 */
export const bulkDeleteBrands = async (ids) => {
    const token = getApiToken();
    try {
        const response = await axios.post(POS_ENDPOINTS.BRAND_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error bulk deleting brands:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete brands'
        };
    }
};

/**
 * Bulk delete categories
 */
export const bulkDeleteCategories = async (ids) => {
    const token = getApiToken();
    try {
        const response = await axios.post(POS_ENDPOINTS.CATEGORY_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error bulk deleting categories:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete categories'
        };
    }
};

/**
 * Bulk delete tags
 */
export const bulkDeleteTags = async (ids) => {
    const token = getApiToken();
    try {
        const response = await axios.post(POS_ENDPOINTS.TAG_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error bulk deleting tags:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete tags'
        };
    }
};

/**
 * Bulk delete units
 */
export const bulkDeleteUnits = async (ids) => {
    const token = getApiToken();
    try {
        const response = await axios.post(POS_ENDPOINTS.UNIT_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error bulk deleting units:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete units'
        };
    }
};

/**
 * Bulk delete taxes
 */
export const bulkDeleteTaxes = async (ids) => {
    const token = getApiToken();
    try {
        const response = await axios.post(POS_ENDPOINTS.TAX_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error bulk deleting taxes:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete taxes'
        };
    }
};

/**
 * Bulk delete warehouses
 */
export const bulkDeleteWarehouses = async (ids) => {
    const token = getApiToken();
    try {
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error bulk deleting warehouses:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete warehouses'
        };
    }
};

// ==================== EXPORT ====================

/**
 * Export brands
 */
export const exportBrands = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.BRAND_EXPORT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting brands:', error);
        throw error;
    }
};

/**
 * Export categories
 */
export const exportCategories = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.CATEGORY_EXPORT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting categories:', error);
        throw error;
    }
};

/**
 * Export tags
 */
export const exportTags = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.TAG_EXPORT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting tags:', error);
        throw error;
    }
};

/**
 * Export units
 */
export const exportUnits = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.UNIT_EXPORT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting units:', error);
        throw error;
    }
};

/**
 * Export taxes
 */
export const exportTaxes = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.TAX_EXPORT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting taxes:', error);
        throw error;
    }
};

/**
 * Export warehouses
 */
export const exportWarehouses = async (params = {}) => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSE_EXPORT, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting warehouses:', error);
        throw error;
    }
};

// ==================== EXPORT TEMPLATE ====================

/**
 * Export brand template
 */
export const exportBrandTemplate = async () => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.BRAND_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting brand template:', error);
        throw error;
    }
};

/**
 * Export category template
 */
export const exportCategoryTemplate = async () => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.CATEGORY_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting category template:', error);
        throw error;
    }
};

/**
 * Export tag template
 */
export const exportTagTemplate = async () => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.TAG_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting tag template:', error);
        throw error;
    }
};

/**
 * Export unit template
 */
export const exportUnitTemplate = async () => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.UNIT_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting unit template:', error);
        throw error;
    }
};

/**
 * Export tax template
 */
export const exportTaxTemplate = async () => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.TAX_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting tax template:', error);
        throw error;
    }
};

/**
 * Export warehouse template
 */
export const exportWarehouseTemplate = async () => {
    const token = getApiToken();
    try {
        const response = await axios.get(POS_ENDPOINTS.WAREHOUSE_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting warehouse template:', error);
        throw error;
    }
};

// ==================== IMPORT PREVIEW ====================

/**
 * Import preview for brands
 */
export const importBrandsPreview = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.BRAND_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error previewing brand import:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import'
        };
    }
};

/**
 * Import preview for categories
 */
export const importCategoriesPreview = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.CATEGORY_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error previewing category import:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import'
        };
    }
};

/**
 * Import preview for tags
 */
export const importTagsPreview = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.TAG_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error previewing tag import:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import'
        };
    }
};

/**
 * Import preview for units
 */
export const importUnitsPreview = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.UNIT_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error previewing unit import:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import'
        };
    }
};

/**
 * Import preview for taxes
 */
export const importTaxesPreview = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.TAX_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error previewing tax import:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import'
        };
    }
};

/**
 * Import preview for warehouses
 */
export const importWarehousesPreview = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error previewing warehouse import:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to preview import'
        };
    }
};

// ==================== IMPORT ====================

/**
 * Import brands
 */
export const importBrands = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.BRAND_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error importing brands:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import brands'
        };
    }
};

/**
 * Import categories
 */
export const importCategories = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.CATEGORY_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error importing categories:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import categories'
        };
    }
};

/**
 * Import tags
 */
export const importTags = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.TAG_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error importing tags:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import tags'
        };
    }
};

/**
 * Import units
 */
export const importUnits = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.UNIT_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error importing units:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import units'
        };
    }
};

/**
 * Import taxes
 */
export const importTaxes = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.TAX_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error importing taxes:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import taxes'
        };
    }
};

/**
 * Import warehouses
 */
export const importWarehouses = async (file) => {
    const token = getApiToken();
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(POS_ENDPOINTS.WAREHOUSE_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error importing warehouses:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to import warehouses'
        };
    }
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for inventory entities
 */
export const inventoryKeys = {
    units: {
        all: ['units'],
        list: (params) => ['units', 'list', params],
        detail: (id) => ['units', 'detail', id],
    },
    brands: {
        all: ['brands'],
        list: (params) => ['brands', 'list', params],
        detail: (id) => ['brands', 'detail', id],
    },
    categories: {
        all: ['categories'],
        list: (params) => ['categories', 'list', params],
        detail: (id) => ['categories', 'detail', id],
    },
    tags: {
        all: ['tags'],
        list: (params) => ['tags', 'list', params],
        detail: (id) => ['tags', 'detail', id],
    },
    taxes: {
        all: ['taxes'],
        list: (params) => ['taxes', 'list', params],
        detail: (id) => ['taxes', 'detail', id],
    },
    warehouses: {
        all: ['warehouses'],
        list: (params) => ['warehouses', 'list', params],
        detail: (id) => ['warehouses', 'detail', id],
    },
};

/**
 * React Query hook for fetching units list
 */
export const useUnits = (params = {}, options = {}) => {
    return useQuery({
        queryKey: inventoryKeys.units.list(params),
        queryFn: () => fetchUnits(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

/**
 * React Query hook for fetching brands list
 */
export const useBrands = (params = {}, options = {}) => {
    return useQuery({
        queryKey: inventoryKeys.brands.list(params),
        queryFn: () => fetchBrands(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

/**
 * React Query hook for fetching categories list
 */
export const useCategories = (params = {}, options = {}) => {
    return useQuery({
        queryKey: inventoryKeys.categories.list(params),
        queryFn: () => fetchCategories(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

/**
 * React Query hook for fetching tags list
 */
export const useTags = (params = {}, options = {}) => {
    return useQuery({
        queryKey: inventoryKeys.tags.list(params),
        queryFn: () => fetchTags(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

/**
 * React Query hook for fetching taxes list
 */
export const useTaxes = (params = {}, options = {}) => {
    return useQuery({
        queryKey: inventoryKeys.taxes.list(params),
        queryFn: () => fetchTaxes(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

/**
 * React Query hook for fetching warehouses list
 */
export const useWarehouses = (params = {}, options = {}) => {
    return useQuery({
        queryKey: inventoryKeys.warehouses.list(params),
        queryFn: () => fetchWarehouses(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

