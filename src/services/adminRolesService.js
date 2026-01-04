import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Get all roles with pagination and filters
 */
export const getRoles = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ROLES, {
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
 * Get roles data for DataTable
 */
export const getRolesData = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ROLES_DATA, {
            params: params,
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
        console.error('Error in getRolesData:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch roles data'
        };
    }
};

/**
 * Get a single role by ID
 */
export const getRole = async (roleId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ROLE_DETAILS(roleId), {
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
 */
export const createRole = async (roleData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ROLES, roleData, {
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
            error: error.response?.data?.message || error.message || 'Failed to create role',
            errors: error.response?.data?.errors
        };
    }
};

/**
 * Update an existing role
 */
export const updateRole = async (roleId, roleData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(ADMIN_SYSTEM_ENDPOINTS.ROLE_DETAILS(roleId), roleData, {
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
            error: error.response?.data?.message || error.message || 'Failed to update role',
            errors: error.response?.data?.errors
        };
    }
};

/**
 * Delete a role
 */
export const deleteRole = async (roleId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_SYSTEM_ENDPOINTS.ROLE_DETAILS(roleId), {
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
 * Bulk delete roles
 */
export const bulkDeleteRoles = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.ROLE_BULK_DELETE, { ids: ids.join(',') }, {
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
        console.error('Error in bulkDeleteRoles:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete roles'
        };
    }
};

/**
 * Get all permissions
 */
export const getPermissions = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ROLES_PERMISSIONS, {
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
        console.error('Error in getPermissions:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch permissions'
        };
    }
};

/**
 * Get roles for select dropdown
 */
export const getRolesSelect = async (search = '') => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ROLES_SELECT, {
            params: { search },
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
        console.error('Error in getRolesSelect:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch roles for select'
        };
    }
};


