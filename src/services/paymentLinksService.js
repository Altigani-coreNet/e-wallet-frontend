import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
    PAYMENT_LINKS_STALE_TIME: 30 * 1000, // 30 seconds
    PAYMENT_LINK_STATISTICS_STALE_TIME: 30 * 1000, // 30 seconds
    PAYMENT_LINK_DETAILS_STALE_TIME: 30 * 1000, // 30 seconds
};

/**
 * Fetch payment links data
 */
export const fetchPaymentLinks = async ({ merchantId, page, perPage, filters }) => {
    const token = getApiToken();
    
    // Build params
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    // Add merchant_id only if it exists
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.PAYMENT_LINKS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch payment link statistics
 */
export const fetchPaymentLinkStatistics = async (merchantId) => {
    const token = getApiToken();
    
    const params = {};
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.PAYMENT_LINK_STATISTICS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * Fetch payment link details
 */
export const fetchPaymentLinkDetails = async (paymentLinkId) => {
    const token = getApiToken();
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.PAYMENT_LINK_DETAILS(paymentLinkId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * Create payment link
 */
export const createPaymentLink = async (paymentLinkData) => {
    const token = getApiToken();
    
    const response = await axios.post(SOFTPOS_ENDPOINTS.PAYMENT_LINKS, paymentLinkData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Update payment link
 */
export const updatePaymentLink = async (paymentLinkId, paymentLinkData) => {
    const token = getApiToken();
    
    const response = await axios.put(SOFTPOS_ENDPOINTS.PAYMENT_LINK_DETAILS(paymentLinkId), paymentLinkData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Delete payment link
 */
export const deletePaymentLink = async (paymentLinkId) => {
    const token = getApiToken();
    
    const response = await axios.delete(SOFTPOS_ENDPOINTS.PAYMENT_LINK_DETAILS(paymentLinkId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Bulk delete payment links
 */
export const bulkDeletePaymentLinks = async (ids) => {
    const token = getApiToken();
    
    const response = await axios.post(SOFTPOS_ENDPOINTS.PAYMENT_LINK_BULK_DELETE, {
        ids: ids
    }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Update payment link scheduled date
 */
export const updatePaymentLinkDate = async (paymentLinkId, scheduledDate) => {
    const token = getApiToken();
    
    const response = await axios.post(SOFTPOS_ENDPOINTS.PAYMENT_LINK_UPDATE_DATE(paymentLinkId), {
        scheduled_date: scheduledDate
    }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Send payment link via email/WhatsApp/SMS
 */
export const sendPaymentLink = async (paymentLinkId, sendOptions) => {
    const token = getApiToken();
    
    const response = await axios.post(SOFTPOS_ENDPOINTS.PAYMENT_LINK_SEND(paymentLinkId), sendOptions, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Export payment links
 */
export const exportPaymentLinks = async ({ merchantId, filters }) => {
    const token = getApiToken();
    
    // Build params
    const params = { ...filters };
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const paramsStr = new URLSearchParams(params).toString();
    
    // Server returns ready CSV file as blob
    const response = await axios.get(`${SOFTPOS_ENDPOINTS.PAYMENT_LINK_EXPORT}?${paramsStr}`, {
        responseType: 'blob', // Expecting binary file from server
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data; // Return blob data directly from server
};

/**
 * React Query Hooks
 */

/**
 * Hook to fetch payment links list
 */
export const usePaymentLinks = (merchantId, page, perPage, filters) => {
    return useQuery({
        queryKey: ['payment-links', merchantId, page, perPage, filters],
        queryFn: () => fetchPaymentLinks({ merchantId, page, perPage, filters }),
        staleTime: CACHE_CONFIG.PAYMENT_LINKS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching payment links:', error);
            toast.error('Failed to load payment links');
        }
    });
};

/**
 * Hook to fetch payment link statistics
 */
export const usePaymentLinkStatistics = (merchantId) => {
    return useQuery({
        queryKey: ['payment-link-statistics', merchantId],
        queryFn: () => fetchPaymentLinkStatistics(merchantId),
        staleTime: CACHE_CONFIG.PAYMENT_LINK_STATISTICS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching payment link statistics:', error);
        }
    });
};

/**
 * Hook to fetch payment link details
 */
export const usePaymentLinkDetails = (paymentLinkId) => {
    return useQuery({
        queryKey: ['payment-link-details', paymentLinkId],
        queryFn: () => fetchPaymentLinkDetails(paymentLinkId),
        enabled: !!paymentLinkId,
        staleTime: CACHE_CONFIG.PAYMENT_LINK_DETAILS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching payment link details:', error);
            toast.error('Failed to load payment link details');
        }
    });
};

