import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Get all payment gateways with pagination and filters
 */
export const getPaymentGateways = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.PAYMENT_GATEWAYS, {
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
        console.error('Error in getPaymentGateways:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch payment gateways'
        };
    }
};

/**
 * Get a single payment gateway by ID
 */
export const getPaymentGateway = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_DETAILS(id), {
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
        console.error('Error in getPaymentGateway:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch payment gateway'
        };
    }
};

/**
 * Create a new payment gateway
 */
export const createPaymentGateway = async (formData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_ENDPOINTS.PAYMENT_GATEWAYS, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in createPaymentGateway:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create payment gateway',
            errors: error.response?.data?.errors
        };
    }
};

/**
 * Update an existing payment gateway
 */
export const updatePaymentGateway = async (id, formData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_DETAILS(id), formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error in updatePaymentGateway:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update payment gateway',
            errors: error.response?.data?.errors
        };
    }
};

/**
 * Delete a payment gateway
 */
export const deletePaymentGateway = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_DETAILS(id), {
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
        console.error('Error in deletePaymentGateway:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete payment gateway'
        };
    }
};

/**
 * Toggle payment gateway status
 */
export const togglePaymentGatewayStatus = async (id, status) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_TOGGLE_STATUS(id), {
            status: status
        }, {
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
        console.error('Error in togglePaymentGatewayStatus:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to toggle payment gateway status'
        };
    }
};
