import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Get all user groups with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, search, status, branch_id, sort_by, sort_direction)
 * @returns {Promise} - API response
 */
export const getUserGroups = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(SOFTPOS_ENDPOINTS.USER_GROUPS, {
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
        console.error('Error in getUserGroups:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user groups'
        };
    }
};

/**
 * Get a single user group by ID
 * @param {string} userGroupId - User Group ID
 * @returns {Promise} - API response
 */
export const getUserGroup = async (userGroupId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(SOFTPOS_ENDPOINTS.USER_GROUP_DETAILS(userGroupId), {
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
        console.error('Error in getUserGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user group'
        };
    }
};

/**
 * Create a new user group
 * @param {Object} userGroupData - User group data to create
 * @returns {Promise} - API response
 */
export const createUserGroup = async (userGroupData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(SOFTPOS_ENDPOINTS.USER_GROUPS, userGroupData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in createUserGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create user group',
            errors: error.response?.data?.message || error.response?.data
        };
    }
};

/**
 * Update an existing user group
 * @param {string} userGroupId - User Group ID
 * @param {Object} userGroupData - Updated user group data
 * @returns {Promise} - API response
 */
export const updateUserGroup = async (userGroupId, userGroupData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(SOFTPOS_ENDPOINTS.USER_GROUP_DETAILS(userGroupId), userGroupData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in updateUserGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update user group',
            errors: error.response?.data?.message || error.response?.data
        };
    }
};

/**
 * Delete a user group
 * @param {string} userGroupId - User Group ID
 * @returns {Promise} - API response
 */
export const deleteUserGroup = async (userGroupId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(SOFTPOS_ENDPOINTS.USER_GROUP_DETAILS(userGroupId), {
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
        console.error('Error in deleteUserGroup:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete user group'
        };
    }
};

/**
 * Bulk delete user groups
 * @param {Array} ids - Array of user group IDs
 * @returns {Promise} - API response
 */
export const bulkDeleteUserGroups = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(SOFTPOS_ENDPOINTS.USER_GROUP_BULK_DELETE, { ids }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in bulkDeleteUserGroups:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete user groups'
        };
    }
};

/**
 * Toggle user group status (active/inactive)
 * @param {string} userGroupId - User Group ID
 * @returns {Promise} - API response
 */
export const toggleUserGroupStatus = async (userGroupId) => {
    try {
        const token = getApiToken();
        const response = await axios.post(SOFTPOS_ENDPOINTS.USER_GROUP_TOGGLE_STATUS(userGroupId), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data.data || response.data
        };
    } catch (error) {
        console.error('Error in toggleUserGroupStatus:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to toggle user group status'
        };
    }
};

/**
 * Get user groups for select dropdown
 * @param {Object} params - Query parameters (search, branch_id, status)
 * @returns {Promise} - API response
 */
export const getUserGroupsForSelect = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(SOFTPOS_ENDPOINTS.USER_GROUP_SELECT, {
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
        console.error('Error in getUserGroupsForSelect:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user groups for select'
        };
    }
};

/**
 * Get users for current merchant (for user group assignment)
 * @returns {Promise} - API response
 */
export const getUsersForSelect = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(SOFTPOS_ENDPOINTS.USER_GROUP_USERS, {
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
        console.error('Error in getUsersForSelect:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch users'
        };
    }
};

/**
 * Get branches for current merchant (for user group assignment)
 * @returns {Promise} - API response
 */
export const getBranchesForSelect = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(SOFTPOS_ENDPOINTS.USER_GROUP_BRANCHES, {
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
        console.error('Error in getBranchesForSelect:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch branches'
        };
    }
};

