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
 * Get all users with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, search, status, sort_by, sort_direction)
 * @returns {Promise} - API response
 */
export const getUsers = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 10,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/users`, {
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
        console.error('Error in getUsers:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch users'
        };
    }
};

/**
 * Get a single user by ID
 * @param {string} userId - User ID
 * @returns {Promise} - API response
 */
export const getUser = async (userId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/users/${userId}`, {
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
        console.error('Error in getUser:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user'
        };
    }
};

/**
 * Create a new user
 * @param {Object} userData - User data to create
 * @returns {Promise} - API response
 */
export const createUser = async (userData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(`${AUTH_SERVICE_URL}/users`, userData, {
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
        console.error('Error in createUser:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create user',
            statusCode: error.response?.status,
            errorCode: error.response?.data?.Error_Code || error.response?.data?.data?.code || error.response?.data?.code
        };
    }
};

/**
 * Update an existing user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} - API response
 */
export const updateUser = async (userId, userData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(`${AUTH_SERVICE_URL}/users/${userId}`, userData, {
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
        console.error('Error in updateUser:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update user'
        };
    }
};

/**
 * Delete a user
 * @param {string} userId - User ID
 * @returns {Promise} - API response
 */
export const deleteUser = async (userId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(`${AUTH_SERVICE_URL}/users/${userId}`, {
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
        console.error('Error in deleteUser:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete user'
        };
    }
};

/**
 * Get users for select dropdown
 * @param {string} search - Search term
 * @returns {Promise} - API response
 */
export const getUsersForSelect = async (search = '') => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/users/select/dropdown`, {
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
        console.error('Error in getUsersForSelect:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch users for select'
        };
    }
};

/**
 * Change user status
 * @param {string} userId - User ID
 * @param {number} status - Status (0 or 1)
 * @returns {Promise} - API response
 */
export const changeUserStatus = async (userId, status) => {
    try {
        const token = getApiToken();
        const response = await axios.put(
            `${AUTH_SERVICE_URL}/users/${userId}`,
            { status },
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
        console.error('Error in changeUserStatus:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to change user status'
        };
    }
};

/**
 * Export users to Excel
 * @param {Object} params - Query parameters (search, status, module, date_from, date_to)
 * @returns {Promise} - Blob response
 */
export const exportUsers = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/users/export`, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            responseType: 'blob'
        });
        
        // Check if response is an error (when API returns JSON error as blob)
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json') || response.data.type === 'application/json') {
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(response.data);
            });
            const errorData = JSON.parse(text);
            const error = new Error(errorData.message || errorData.error || 'Export failed');
            error.response = { data: errorData };
            throw error;
        }
        
        return response.data;
    } catch (error) {
        console.error('Error exporting users:', error);
        
        // Handle 404 - Route not found
        if (error.response?.status === 404) {
            const customError = new Error('Export endpoint not found. Please clear route cache: php artisan route:clear');
            customError.response = error.response;
            throw customError;
        }
        
        // Handle blob error responses
        if (error.response && error.response.data instanceof Blob) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(error.response.data);
                });
                const errorData = JSON.parse(text);
                const customError = new Error(errorData.message || errorData.error || 'Export failed');
                customError.response = { data: errorData };
                throw customError;
            } catch (parseError) {
                // If parsing fails, use original error
                const customError = new Error(error.response?.statusText || error.message || 'Failed to export users');
                customError.response = error.response;
                throw customError;
            }
        }
        
        throw error;
    }
};

/**
 * Download user import template
 * @returns {Promise} - Blob response
 */
export const downloadUserTemplate = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(`${AUTH_SERVICE_URL}/users/export-template`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading user template:', error);
        
        // Handle 404 - Route not found
        if (error.response?.status === 404) {
            const customError = new Error('Template endpoint not found. Please clear route cache: php artisan route:clear');
            customError.response = error.response;
            throw customError;
        }
        
        throw error;
    }
};

/**
 * Preview user import
 * @param {File} file - Excel file to preview
 * @returns {Promise} - API response with preview data
 */
export const previewUserImport = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${AUTH_SERVICE_URL}/users/import-preview`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error previewing user import:', error);
        throw error;
    }
};

/**
 * Import users from Excel
 * @param {File} file - Excel file to import
 * @returns {Promise} - API response
 */
export const importUsers = async (file) => {
    try {
        const token = getApiToken();
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${AUTH_SERVICE_URL}/users/import`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error importing users:', error);
        throw error;
    }
};

