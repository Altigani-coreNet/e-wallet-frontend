import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SOFTPOS_ENDPOINTS, SOFTPOS_API_BASE, AUTH_SERVICE_BASE } from '../utils/constants';
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
    TERMINALS_STALE_TIME: 30 * 1000, // 30 seconds
    TERMINAL_DETAILS_STALE_TIME: 30 * 1000, // 30 seconds
};

/**
 * Fetch terminals data
 */
export const fetchTerminals = async ({ merchantId, page, perPage, filters }) => {
    const token = getApiToken();
    
    // Build params
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    // Add merchant_id only if it exists
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.TERMINALS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch terminal details (used by components - returns {success, data} format)
 */
export const getTerminal = async (terminalId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(SOFTPOS_ENDPOINTS.TERMINAL_DETAILS(terminalId), {
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
        console.error('Error in getTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch terminal'
        };
    }
};

/**
 * Fetch terminal details (for React Query hooks)
 */
export const fetchTerminalDetails = async (terminalId) => {
    const token = getApiToken();
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.TERMINAL_DETAILS(terminalId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Create a new terminal
 */
export const createTerminal = async (terminalData) => {
    const token = getApiToken();
    
    try {
        // Ensure is_active is sent as string ("active" or "inactive")
        const dataToSend = {
            ...terminalData,
            is_active: terminalData.is_active === 'active' || terminalData.is_active === true || terminalData.is_active === 1 || terminalData.is_active === '1'
                ? 'active'
                : 'inactive'
        };
        
        const response = await axios.post(SOFTPOS_ENDPOINTS.TERMINALS, dataToSend, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in createTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create terminal'
        };
    }
};

/**
 * Export terminals - Server-side export
 */
export const exportTerminals = async ({ merchantId, filters }) => {
    const token = getApiToken();
    
    // Send only filters - server handles file generation
    const paramsObj = { ...filters };
    
    // Add merchant_id only if provided
    if (merchantId) {
        paramsObj.merchant_id = merchantId;
    }
    
    const params = new URLSearchParams(paramsObj).toString();
    
    // Server returns ready CSV file as blob
    const response = await axios.get(`${SOFTPOS_ENDPOINTS.TERMINAL_EXPORT}?${params}`, {
        responseType: 'blob', // Expecting binary file from server
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data; // Return blob data directly from server
};

/**
 * Delete a single terminal
 */
export const deleteTerminal = async (terminalId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(SOFTPOS_ENDPOINTS.TERMINAL_DETAILS(terminalId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in deleteTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete terminal'
        };
    }
};

/**
 * Update a terminal
 */
export const updateTerminal = async (terminalId, terminalData) => {
    const token = getApiToken();
    
    try {
        // Ensure is_active is sent as string ("active" or "inactive")
        const dataToSend = {
            ...terminalData,
            is_active: terminalData.is_active === 'active' || terminalData.is_active === true || terminalData.is_active === 1 || terminalData.is_active === '1'
                ? 'active'
                : 'inactive'
        };
        
        const response = await axios.put(SOFTPOS_ENDPOINTS.TERMINAL_DETAILS(terminalId), dataToSend, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in updateTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update terminal'
        };
    }
};

/**
 * Bulk delete terminals
 */
export const bulkDeleteTerminals = async (terminalIds) => {
    const token = getApiToken();
    
    const response = await axios.post(SOFTPOS_ENDPOINTS.TERMINAL_BULK_DELETE, {
        ids: terminalIds
    }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Import terminals from file
 */
export const importTerminals = async (file) => {
    const token = getApiToken();
    
    const formData = new FormData();
    formData.append('import_file', file);
    
    const response = await axios.post(`${AUTH_SERVICE_BASE}/merchant/terminals/import`, formData, {
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
        formData.append('import_file', file);
        
        const response = await axios.post(`${AUTH_SERVICE_BASE}/merchant/terminals/import-preview`, formData, {
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
 * Export terminals template
 */
export const exportTemplate = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(`${AUTH_SERVICE_BASE}/merchant/terminals/export-template`, {
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
            a.download = 'terminals_import_template.csv';
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
 * Hook to fetch terminals list
 */
export const useTerminals = (merchantId, page, perPage, filters) => {
    return useQuery({
        queryKey: ['terminals', merchantId, page, perPage, filters],
        queryFn: () => fetchTerminals({ merchantId, page, perPage, filters }),
        staleTime: CACHE_CONFIG.TERMINALS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching terminals:', error);
            toast.error('Failed to load terminals');
        }
    });
};

/**
 * Hook to fetch terminal details
 */
export const useTerminalDetails = (terminalId) => {
    return useQuery({
        queryKey: ['terminal-details', terminalId],
        queryFn: () => fetchTerminalDetails(terminalId),
        enabled: !!terminalId,
        staleTime: CACHE_CONFIG.TERMINAL_DETAILS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching terminal details:', error);
            toast.error('Failed to load terminal details');
        }
    });
};

