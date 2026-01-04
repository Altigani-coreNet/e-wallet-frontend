import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SOFTPOS_ENDPOINTS, AUTH_SERVICE_BASE } from '../utils/constants';
import { getToken } from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
    BRANCHES_STALE_TIME: 30 * 1000, // 30 seconds
    BRANCH_DETAILS_STALE_TIME: 30 * 1000, // 30 seconds
};

/**
 * Fetch branches data
 */
export const fetchBranches = async ({ merchantId, page, perPage, filters }) => {
    const token = getApiToken();
    
    // Build params
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    // Add merchant_id only if it exists (branches API might not need it)
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.BRANCHES, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch branch details (used by components - returns {success, data} format)
 */
export const getBranch = async (branchId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(SOFTPOS_ENDPOINTS.BRANCH_DETAILS(branchId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Return in consistent format that components expect
        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in getBranch:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch branch'
        };
    }
};

/**
 * Fetch branch details (for React Query hooks)
 */
export const fetchBranchDetails = async (branchId) => {
    const token = getApiToken();
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.BRANCH_DETAILS(branchId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Create a new branch
 */
export const createBranch = async (branchData) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(SOFTPOS_ENDPOINTS.BRANCHES, branchData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Ensure consistent response format
        return {
            success: response.data.success !== undefined ? response.data.success : true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in createBranch:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create branch',
            statusCode: error.response?.status,
            errorCode: error.response?.data?.Error_Code || error.response?.data?.data?.code || error.response?.data?.code
        };
    }
};

/**
 * Get branches for select dropdown
 */
export const getBranchesForSelect = async (search = '') => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(`${AUTH_SERVICE_BASE}/branches/select`, {
            params: { search },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in getBranchesForSelect:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch branches',
            data: []
        };
    }
};

/**
 * Export branches - Server-side export
 */
export const exportBranches = async ({ merchantId, filters }) => {
    const token = getApiToken();
    
    // Send only filters - server handles file generation
    const paramsObj = { ...filters };
    
    const params = new URLSearchParams(paramsObj).toString();
    
    // Server returns ready CSV file as blob
    const response = await axios.get(`${SOFTPOS_ENDPOINTS.BRANCH_EXPORT}?${params}`, {
        responseType: 'blob', // Expecting binary file from server
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data; // Return blob data directly from server
};

/**
 * Delete a single branch
 */
export const deleteBranch = async (branchId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(SOFTPOS_ENDPOINTS.BRANCH_DETAILS(branchId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in deleteBranch:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete branch'
        };
    }
};

/**
 * Update a branch
 */
export const updateBranch = async (branchId, branchData) => {
    const token = getApiToken();
    
    try {
        const response = await axios.put(SOFTPOS_ENDPOINTS.BRANCH_DETAILS(branchId), branchData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in updateBranch:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update branch'
        };
    }
};

/**
 * Bulk delete branches
 */
export const bulkDeleteBranches = async (branchIds) => {
    const token = getApiToken();
    
    const response = await axios.post(SOFTPOS_ENDPOINTS.BRANCH_BULK_DELETE, {
        ids: branchIds
    }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Get branches by IDs (for displaying branch details in terminals)
 */
export const getBranchesByIds = async (branchIds = []) => {
    const token = getApiToken();
    
    if (!branchIds || branchIds.length === 0) {
        return { success: true, data: [] };
    }

    // Filter out null/undefined values and get unique IDs
    const uniqueIds = [...new Set(branchIds.filter(id => id != null))];
    
    if (uniqueIds.length === 0) {
        return { success: true, data: [] };
    }

    try {
        const response = await axios.post(SOFTPOS_ENDPOINTS.BRANCH_BY_IDS, {
            ids: uniqueIds
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in getBranchesByIds:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch branches',
            data: []
        };
    }
};

/**
 * Import branches from file
 */
export const importBranches = async (file) => {
    const token = getApiToken();
    
    const formData = new FormData();
    formData.append('import_file', file);
    
    const response = await axios.post(`${AUTH_SERVICE_BASE}/branches/import`, formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    
    return response.data;
};

/**
 * Preview import data before importing
 */
export const previewImport = async (file) => {
    const token = getApiToken();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${AUTH_SERVICE_BASE}/branches/import-preview`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in previewImport:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to preview import'
        };
    }
};

/**
 * Export branches template
 */
export const exportTemplate = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(`${AUTH_SERVICE_BASE}/branches/export-template`, {
        responseType: 'blob',
        headers: {
            'Authorization': `Bearer ${token}`
        }
        });
        
        if (response.data) {
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'branches_import_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            return { success: true };
        } else {
            return { success: false, error: 'Failed to download template' };
        }
    } catch (error) {
        console.error('Error in exportTemplate:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to export template'
        };
    }
};

/**
 * React Query Hooks
 */

/**
 * Hook to fetch branches list
 */
export const useBranches = (merchantId, page, perPage, filters) => {
    return useQuery({
        queryKey: ['branches', merchantId, page, perPage, filters],
        queryFn: () => fetchBranches({ merchantId, page, perPage, filters }),
        staleTime: CACHE_CONFIG.BRANCHES_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching branches:', error);
            toast.error('Failed to load branches');
        }
    });
};

/**
 * Hook to fetch branch details
 */
export const useBranchDetails = (branchId) => {
    return useQuery({
        queryKey: ['branch-details', branchId],
        queryFn: () => fetchBranchDetails(branchId),
        enabled: !!branchId,
        staleTime: CACHE_CONFIG.BRANCH_DETAILS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching branch details:', error);
            toast.error('Failed to load branch details');
        }
    });
};

