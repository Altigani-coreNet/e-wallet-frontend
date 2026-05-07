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
 * Fetch terminal groups data for admin
 */
export const fetchAdminTerminalGroups = async ({ page, perPage, filters }) => {
    const token = getApiToken();
    
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_GROUPS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch terminal group details
 */
export const getAdminTerminalGroup = async (terminalGroupId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_GROUP_DETAILS(terminalGroupId), {
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
        console.error('Error in getAdminTerminalGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch terminal group'
        };
    }
};

/**
 * Create a new terminal group
 */
export const createAdminTerminalGroup = async (terminalGroupData) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_GROUP_CREATE, terminalGroupData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Terminal group created successfully'
        };
    } catch (error) {
        console.error('Error in createAdminTerminalGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create terminal group'
        };
    }
};

/**
 * Update terminal group
 */
export const updateAdminTerminalGroup = async (terminalGroupId, terminalGroupData) => {
    const token = getApiToken();
    
    try {
        const response = await axios.put(ADMIN_ENDPOINTS.TERMINAL_GROUP_UPDATE(terminalGroupId), terminalGroupData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Terminal group updated successfully'
        };
    } catch (error) {
        console.error('Error in updateAdminTerminalGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update terminal group'
        };
    }
};

/**
 * Delete terminal group
 */
export const deleteAdminTerminalGroup = async (terminalGroupId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(ADMIN_ENDPOINTS.TERMINAL_GROUP_DELETE(terminalGroupId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return {
            success: true,
            message: response.data.message || 'Terminal group deleted successfully'
        };
    } catch (error) {
        console.error('Error in deleteAdminTerminalGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete terminal group'
        };
    }
};

/**
 * Bulk delete terminal groups
 */
export const bulkDeleteAdminTerminalGroups = async (ids) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(ADMIN_ENDPOINTS.TERMINAL_GROUP_BULK_DELETE, 
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
            message: response.data.data?.message || response.data.message || 'Terminal groups deleted successfully',
            count: response.data.data?.count || response.data.count || 0
        };
    } catch (error) {
        console.error('Error in bulkDeleteAdminTerminalGroups:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete terminal groups'
        };
    }
};

/**
 * Export terminal groups
 */
export const exportAdminTerminalGroups = async (filters) => {
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
        
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_GROUP_EXPORT, {
            params: cleanFilters,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Handle different response structures
        const isSuccess = response.data.success || response.data.status;
        let exportData = null;
        
        if (isSuccess && response.data.data) {
            // Try different data structures
            exportData = response.data.data.data || response.data.data;
            
            // If it's an object with data and filename, extract the data
            if (exportData && typeof exportData === 'object' && !Array.isArray(exportData)) {
                if (exportData.data && Array.isArray(exportData.data)) {
                    exportData = exportData.data;
                } else if (exportData.filename && exportData.data) {
                    exportData = exportData.data;
                }
            }
        }
        
        // Check if we have valid array data
        if (Array.isArray(exportData) && exportData.length > 0) {
            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map(row => headers.map(header => {
                    const cell = row[header] || '';
                    // Handle null, undefined, and convert to string
                    const cellValue = cell === null || cell === undefined ? '' : String(cell);
                    // Escape quotes and wrap in quotes if contains comma or quotes
                    return cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')
                        ? `"${cellValue.replace(/"/g, '""')}"` 
                        : cellValue;
                }).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            return blob;
        }
        
        throw new Error('No data to export');
    } catch (error) {
        console.error('Error in exportAdminTerminalGroups:', error);
        if (error.response?.status === 500) {
            toast.error(error.response?.data?.message || 'Server error occurred while exporting. Please try again or contact support.');
        } else if (error.message !== 'No data to export') {
            toast.error(error.response?.data?.message || 'Failed to export terminal groups');
        }
        throw error;
    }
};

/**
 * Get parent groups for dropdown
 */
export const getParentGroups = async (merchantId) => {
    const token = getApiToken();
    
    try {
        const params = merchantId ? { merchant_id: merchantId } : {};
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_GROUP_PARENT_GROUPS, {
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
        console.error('Error in getParentGroups:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch parent groups'
        };
    }
};

/**
 * Get terminal group statistics
 */
export const getAdminTerminalGroupStatistics = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.TERMINAL_GROUP_STATISTICS, {
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
        console.error('Error in getAdminTerminalGroupStatistics:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch statistics'
        };
    }
};

/**
 * React Query hook for terminal groups list
 */
export const useAdminTerminalGroups = (page, perPage, filters) => {
    return useQuery({
        queryKey: ['admin-terminal-groups', page, perPage, filters],
        queryFn: () => fetchAdminTerminalGroups({ page, perPage, filters }),
        staleTime: 0,
        cacheTime: 0,
        keepPreviousData: false,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });
};

/**
 * React Query hook for terminal group details
 */
export const useAdminTerminalGroup = (terminalGroupId) => {
    return useQuery({
        queryKey: ['admin-terminal-group', terminalGroupId],
        queryFn: () => getAdminTerminalGroup(terminalGroupId),
        enabled: !!terminalGroupId,
        staleTime: 30 * 1000,
        cacheTime: 5 * 60 * 1000
    });
};

/**
 * React Query hook for terminal group statistics
 */
export const useAdminTerminalGroupStatistics = () => {
    return useQuery({
        queryKey: ['admin-terminal-group-statistics'],
        queryFn: () => getAdminTerminalGroupStatistics(),
        staleTime: 60 * 1000,
        cacheTime: 5 * 60 * 1000
    });
};

/**
 * Toggle terminal group status (activate/deactivate)
 */
export const toggleTerminalGroupStatus = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(
            ADMIN_ENDPOINTS.TERMINAL_GROUP_TOGGLE_STATUS(id),
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );
        
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || 'Status updated successfully'
        };
    } catch (error) {
        console.error('Error in toggleTerminalGroupStatus:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to toggle status'
        };
    }
};

/**
 * Remove terminal from group
 */
export const removeTerminalFromGroup = async (groupId, terminalId) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(
            ADMIN_ENDPOINTS.TERMINAL_GROUP_REMOVE_TERMINAL(groupId),
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                data: {
                    terminal_id: terminalId
                }
            }
        );
        
        return {
            success: true,
            message: response.data.message || 'Terminal removed successfully'
        };
    } catch (error) {
        console.error('Error in removeTerminalFromGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to remove terminal'
        };
    }
};

