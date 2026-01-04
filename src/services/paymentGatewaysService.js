import axios from 'axios';
import { POS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Get all payment gateways (admin templates + shop configs)
 */
export const getPaymentGateways = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.PAYMENT_GATEWAYS, {
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
 * Get a single payment gateway by name
 */
export const getPaymentGateway = async (name) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.PAYMENT_GATEWAY_DETAILS(name), {
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
 * Update payment gateway configuration (shop-specific)
 */
export const updatePaymentGateway = async (name, formData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(POS_ENDPOINTS.PAYMENT_GATEWAY_DETAILS(name), formData, {
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
        const errorResponse = error.response?.data;
        return {
            success: false,
            error: errorResponse?.message || error.message || 'Failed to update payment gateway',
            errors: errorResponse?.errors || null
        };
    }
};

/**
 * Toggle payment gateway status
 */
export const togglePaymentGatewayStatus = async (name, status) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.PAYMENT_GATEWAY_TOGGLE_STATUS(name), {
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

/**
 * Set payment gateway as default
 */
export const setPaymentGatewayAsDefault = async (name) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.PAYMENT_GATEWAY_SET_DEFAULT(name), {}, {
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
        console.error('Error in setPaymentGatewayAsDefault:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to set payment gateway as default'
        };
    }
};

/**
 * Delete payment gateway configuration
 */
export const deletePaymentGateway = async (name) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(POS_ENDPOINTS.PAYMENT_GATEWAY_DELETE(name), {
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
