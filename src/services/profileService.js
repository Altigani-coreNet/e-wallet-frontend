import axios from 'axios';
import { AUTH_ENDPOINTS, AUTH_SERVICE_BASE } from '../utils/constants';
import { getToken } from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Profile API Service
 * Handles all profile-related API calls
 */

/**
 * Get user info with merchant data and profile completion
 */
export const getUserInfo = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(AUTH_ENDPOINTS.PROFILE_ME, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in getUserInfo:', error);
        throw error;
    }
};

/**
 * Get profile completion percentage
 */
export const getProfileCompletion = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(AUTH_ENDPOINTS.PROFILE_COMPLETION, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in getProfileCompletion:', error);
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (data) => {
    const token = getApiToken();
    
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            if (key === 'profile_image' && data[key] instanceof File) {
                formData.append(key, data[key]);
            } else {
                formData.append(key, data[key]);
            }
        }
    });
    
    try {
        const response = await axios.post(AUTH_ENDPOINTS.UPDATE_PROFILE, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in updateProfile:', error);
        throw error;
    }
};

/**
 * Change password
 */
export const changePassword = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in changePassword:', error);
        throw error;
    }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (file) => {
    const token = getApiToken();
    
    const formData = new FormData();
    formData.append('profile_image', file);
    
    try {
        const response = await axios.post(AUTH_ENDPOINTS.UPLOAD_PROFILE_IMAGE, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in uploadProfileImage:', error);
        throw error;
    }
};

/**
 * Delete profile image
 */
export const deleteProfileImage = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(AUTH_ENDPOINTS.DELETE_PROFILE_IMAGE, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in deleteProfileImage:', error);
        throw error;
    }
};

/**
 * Update merchant profile (creates change request)
 */
export const updateMerchantProfile = async (data) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(AUTH_ENDPOINTS.MERCHANT_PROFILE_UPDATE, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in updateMerchantProfile:', error);
        throw error;
    }
};

/**
 * Update merchant attachments
 */
export const updateMerchantAttachments = async (files = {}) => {
    const token = getApiToken();
    
    const formData = new FormData();
    Object.keys(files).forEach(key => {
        const file = files[key];
        if (file instanceof File) {
            formData.append(key, file);
        }
    });
    
    try {
        const response = await axios.post(AUTH_ENDPOINTS.MERCHANT_PROFILE_UPDATE_ATTACHMENTS, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in updateMerchantAttachments:', error);
        throw error;
    }
};

/**
 * Get rejected fields for editing
 */
export const getRejectedFields = async () => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(AUTH_ENDPOINTS.MERCHANT_PROFILE_REJECTED_FIELDS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in getRejectedFields:', error);
        throw error;
    }
};

/**
 * Update rejected fields
 */
export const updateRejectedFields = async (data, files = {}) => {
    const token = getApiToken();
    
    const formData = new FormData();
    
    // Add form fields
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });
    
    // Add file uploads
    Object.keys(files).forEach(key => {
        if (files[key] instanceof File) {
            formData.append(key, files[key]);
        }
    });
    
    try {
        const response = await axios.post(AUTH_ENDPOINTS.MERCHANT_PROFILE_UPDATE_REJECTED, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in updateRejectedFields:', error);
        throw error;
    }
};

