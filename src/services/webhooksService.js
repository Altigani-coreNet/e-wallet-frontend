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
 * Get all webhooks for the merchant
 */
export const getWebhooks = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.WEBHOOKS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching webhooks:', error);
        throw error;
    }
};

/**
 * Get available webhook events
 */
export const getWebhookEvents = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.WEBHOOK_EVENTS, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching webhook events:', error);
        throw error;
    }
};

/**
 * Get single webhook details
 */
export const getWebhook = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.WEBHOOK_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching webhook:', error);
        throw error;
    }
};

/**
 * Create a new webhook
 */
export const createWebhook = async (webhookData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.WEBHOOKS, webhookData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating webhook:', error);
        throw error;
    }
};

/**
 * Update a webhook
 */
export const updateWebhook = async (id, webhookData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(POS_ENDPOINTS.WEBHOOK_DETAILS(id), webhookData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating webhook:', error);
        throw error;
    }
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(POS_ENDPOINTS.WEBHOOK_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting webhook:', error);
        throw error;
    }
};

/**
 * Toggle webhook active status
 */
export const toggleWebhook = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.WEBHOOK_TOGGLE(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling webhook:', error);
        throw error;
    }
};

/**
 * Regenerate webhook secret
 */
export const regenerateWebhookSecret = async (id) => {
    try {
        const token = getApiToken();
        const response = await axios.post(POS_ENDPOINTS.WEBHOOK_REGENERATE_SECRET(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error regenerating webhook secret:', error);
        throw error;
    }
};

/**
 * Get webhook logs
 */
export const getWebhookLogs = async (id, params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(POS_ENDPOINTS.WEBHOOK_LOGS(id), {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching webhook logs:', error);
        throw error;
    }
};

