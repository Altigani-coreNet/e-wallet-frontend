import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Fetch terminals data for admin
 */
export const fetchAdminTerminals = async ({ page, perPage, filters }) => {
    const token = getApiToken();
    
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    const response = await axios.get(ADMIN_ENDPOINTS.TERMINALS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch terminal details
 */
export const getAdminTerminal = async (terminalId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_DETAILS(terminalId), {
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
        console.error('Error in getAdminTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch terminal'
        };
    }
};

/**
 * Create a new terminal
 */
export const createAdminTerminal = async (terminalData) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_CREATE, terminalData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Terminal created successfully'
        };
    } catch (error) {
        console.error('Error in createAdminTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create terminal'
        };
    }
};

/**
 * Update terminal
 */
export const updateAdminTerminal = async (terminalId, terminalData) => {
    const token = getApiToken();
    
    try {
        const response = await axios.put(ADMIN_ENDPOINTS.TERMINAL_UPDATE(terminalId), terminalData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Terminal updated successfully'
        };
    } catch (error) {
        console.error('Error in updateAdminTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update terminal'
        };
    }
};

/**
 * Delete terminal
 */
export const deleteAdminTerminal = async (terminalId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(ADMIN_ENDPOINTS.TERMINAL_DELETE(terminalId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return {
            success: true,
            message: response.data.message || 'Terminal deleted successfully'
        };
    } catch (error) {
        console.error('Error in deleteAdminTerminal:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete terminal'
        };
    }
};

/**
 * Bulk delete terminals
 */
export const bulkDeleteAdminTerminals = async (ids) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_BULK_DELETE, 
            { ids },
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
            message: response.data.data?.message || response.data.message || 'Terminals deleted successfully',
            count: response.data.data?.count || response.data.count || 0
        };
    } catch (error) {
        console.error('Error in bulkDeleteAdminTerminals:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete terminals'
        };
    }
};

/**
 * Bulk status change
 */
export const bulkStatusChangeAdminTerminals = async (ids, status) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_BULK_STATUS, 
            { ids, status },
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
            message: response.data.data?.message || response.data.message || 'Terminal status updated successfully',
            count: response.data.data?.count || response.data.count || 0
        };
    } catch (error) {
        console.error('Error in bulkStatusChangeAdminTerminals:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update terminal status'
        };
    }
};

/**
 * Export terminals
 */
export const exportAdminTerminals = async (filters) => {
    const token = getApiToken();
    
    try {
        // Filter out empty string parameters to avoid backend issues
        const cleanFilters = Object.keys(filters).reduce((acc, key) => {
            const value = filters[key];
            // Only include non-empty values
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});
        
        // Backend returns a streamed CSV file, so we need to request it as a blob
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_EXPORT, {
            params: cleanFilters,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/csv' // Changed from application/json to text/csv
            },
            responseType: 'blob' // Important: tell axios to expect binary data
        });
        
        // Check if we got a valid blob response
        if (response.data && response.data.size > 0) {
            return response.data; // Return the blob directly
        }
        
        // If the blob is empty or too small, it might be an error response
        // Try to parse it as JSON to get the error message
        if (response.data && response.data.size < 100) {
            const text = await response.data.text();
            try {
                const errorData = JSON.parse(text);
                if (errorData.message) {
                    throw new Error(errorData.message);
                }
            } catch (e) {
                // Not JSON, might be empty CSV
                if (text.trim().length === 0 || text.split('\n').length <= 1) {
                    throw new Error('No data to export');
                }
            }
        }
        
        throw new Error('No data to export');
    } catch (error) {
        console.error('Error in exportAdminTerminals:', error);
        if (error.response?.status === 500) {
            // Try to parse error message from blob if it's an error response
            if (error.response?.data instanceof Blob) {
                try {
                    const errorText = await error.response.data.text();
                    const errorData = JSON.parse(errorText);
                    toast.error(errorData.message || 'Server error occurred while exporting. Please try again or contact support.');
                } catch (e) {
                    toast.error('Server error occurred while exporting. Please try again or contact support.');
                }
            } else {
                toast.error(error.response?.data?.message || 'Server error occurred while exporting. Please try again or contact support.');
            }
        } else if (error.message !== 'No data to export') {
            toast.error(error.response?.data?.message || 'Failed to export terminals');
        }
        throw error;
    }
};

/**
 * Download export template
 */
export const downloadAdminTerminalTemplate = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_EXPORT_TEMPLATE, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'terminals_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Template downloaded successfully');
        return { success: true };
    } catch (error) {
        console.error('Error in downloadAdminTerminalTemplate:', error);
        toast.error('Failed to download template');
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to download template'
        };
    }
};

/**
 * Preview import
 */
export const previewAdminTerminalImport = async (file, merchantId) => {
    const token = getApiToken();
    
    try {
        const formData = new FormData();
        formData.append('import_file', file);
        formData.append('merchant_id', merchantId);
        
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_IMPORT_PREVIEW, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in previewAdminTerminalImport:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to preview import'
        };
    }
};

/**
 * Import terminals
 */
export const importAdminTerminals = async (file, merchantId) => {
    const token = getApiToken();
    
    try {
        const formData = new FormData();
        formData.append('import_file', file);
        formData.append('merchant_id', merchantId);
        
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_IMPORT, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return {
            success: true,
            message: response.data.data?.message || response.data.message || 'Terminals imported successfully',
            imported_count: response.data.data?.imported_count || response.data.imported_count || 0,
            errors: response.data.data?.errors || response.data.errors || []
        };
    } catch (error) {
        console.error('Error in importAdminTerminals:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to import terminals'
        };
    }
};

/**
 * Get terminal statistics
 */
export const getAdminTerminalStatistics = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_STATISTICS, {
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
        console.error('Error in getAdminTerminalStatistics:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch statistics'
        };
    }
};

/**
 * React Query hook for terminals list
 */
export const useAdminTerminals = (page, perPage, filters) => {
    return useQuery({
        queryKey: ['admin-terminals', page, perPage, filters],
        queryFn: () => fetchAdminTerminals({ page, perPage, filters }),
        staleTime: 0,
        gcTime: 0,
        keepPreviousData: false,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });
};

/**
 * React Query hook for terminal details
 */
export const useAdminTerminal = (terminalId) => {
    return useQuery({
        queryKey: ['admin-terminal', terminalId],
        queryFn: () => getAdminTerminal(terminalId),
        enabled: !!terminalId,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000 // 5 minutes
    });
};

/**
 * React Query hook for terminal statistics
 */
export const useAdminTerminalStatistics = () => {
    return useQuery({
        queryKey: ['admin-terminal-statistics'],
        queryFn: () => getAdminTerminalStatistics(),
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000 // 5 minutes
    });
};

