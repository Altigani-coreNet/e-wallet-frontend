import axios from 'axios';
import { AUTH_SERVICE_BASE } from '../utils/constants';
import { getToken } from '../utils/api';

// Base URL for AuthService API
const AUTH_SERVICE_URL = AUTH_SERVICE_BASE;

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Get all roles with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, search, type, parent, sort_by, sort_direction)
 * @returns {Promise} - API response
 */
export const getRoles = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 10,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/roles`, {
            params: queryParams,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in getRoles:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch roles'
        };
    }
};

/**
 * Get a single role by ID
 * @param {number} roleId - Role ID
 * @returns {Promise} - API response
 */
export const getRole = async (roleId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/roles/${roleId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in getRole:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch role'
        };
    }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data to create
 * @returns {Promise} - API response
 */
export const createRole = async (roleData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(`${AUTH_SERVICE_URL}/roles`, roleData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in createRole:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create role'
        };
    }
};

/**
 * Update an existing role
 * @param {number} roleId - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise} - API response
 */
export const updateRole = async (roleId, roleData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(`${AUTH_SERVICE_URL}/roles/${roleId}`, roleData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in updateRole:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update role'
        };
    }
};

/**
 * Delete a role
 * @param {number} roleId - Role ID
 * @returns {Promise} - API response
 */
export const deleteRole = async (roleId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(`${AUTH_SERVICE_URL}/roles/${roleId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in deleteRole:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete role'
        };
    }
};

/**
 * Assign permissions to a role
 * @param {number} roleId - Role ID
 * @param {Array} permissionIds - Array of permission IDs
 * @returns {Promise} - API response
 */
export const assignPermissionsToRole = async (roleId, permissionIds) => {
    try {
        const token = getApiToken();
        const response = await axios.post(
            `${AUTH_SERVICE_URL}/roles/${roleId}/permissions`,
            { permission_ids: permissionIds },
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
            data: response.data
        };
    } catch (error) {
        console.error('Error in assignPermissionsToRole:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to assign permissions'
        };
    }
};

/**
 * Get all permissions (for role creation/editing)
 * @param {string} module - Module name to filter permissions (e.g., 'pos', 'sales', 'merchant' for all)
 * @returns {Promise} - API response
 */
export const getPermissions = async (module = 'merchant') => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Module': module
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in getPermissions:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch permissions'
        };
    }
};

/**
 * Get roles by type (e.g., 'shop', 'admin')
 * @param {string} type - Role type
 * @returns {Promise} - API response
 */
export const getRolesByType = async (type) => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/roles`, {
            params: { type },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in getRolesByType:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch roles by type'
        };
    }
};

