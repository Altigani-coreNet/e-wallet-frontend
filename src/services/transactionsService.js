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
 * Fetch transactions data
 */
export const fetchTransactions = async ({ merchantId, userId, page, perPage, filters, sortBy = 'created_at', sortOrder = 'desc' }) => {
    console.log('fetchTransactions called with:', { merchantId, userId, page, perPage, filters, sortBy, sortOrder });
    const token = getApiToken();
    console.log('Token available:', !!token);
    
    // Build params - include merchant_id only if provided (server will handle if not provided)
    const params = {
        page: page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters
    };
    
    // Add merchant_id only if it exists
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    // Add user_id only if it exists
    if (userId) {
        params.user_id = userId;
    }
    
    console.log('Making API request to:', SOFTPOS_ENDPOINTS.TRANSACTIONS);
    console.log('Request params:', params);
    
    try {
        const response = await axios.get(SOFTPOS_ENDPOINTS.TRANSACTIONS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        console.log('API Response received:', response.status, response.data);
        return response.data;
    } catch (error) {
        console.error('API Error in fetchTransactions:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
};

/**
 * Fetch transaction statistics
 */
export const fetchStatistics = async ({ merchantId, userId, type }) => {
    const token = getApiToken();
    
    // Build params - include merchant_id only if provided (server will handle if not provided)
    const params = {};
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    if (userId) {
        params.user_id = userId;
    }
    if (type) {
        params.type = type;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.TRANSACTION_STATISTICS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Export transactions - Server-side export
 * Client sends only filters, server handles:
 * - Getting merchant from authenticated user
 * - Applying all filters
 * - Generating CSV file
 * - Returning ready file for download
 */
export const exportTransactions = async ({ merchantId, userId, filters }) => {
    const token = getApiToken();
    
    // Send only filters - server handles file generation and merchant ID
    const paramsObj = { ...filters }; // All filter parameters
    
    // Add merchant_id only if provided (server will handle if not provided)
    if (merchantId) {
        paramsObj.merchant_id = merchantId;
    }
    
    // Add user_id only if provided
    if (userId) {
        paramsObj.user_id = userId;
    }
    
    const params = new URLSearchParams(paramsObj).toString();
    
    // Server returns ready CSV file as blob
    const response = await axios.get(`${SOFTPOS_ENDPOINTS.TRANSACTION_EXPORT}?${params}`, {
        responseType: 'blob', // Expecting binary file from server
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data; // Return blob data directly from server
};

/**
 * Fetch transaction details
 */
export const fetchTransactionDetails = async (transactionId) => {
    const token = getApiToken();
    const response = await axios.get(SOFTPOS_ENDPOINTS.TRANSACTION_DETAILS(transactionId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * Void transaction
 */
export const voidTransaction = async ({ transactionId, reason }) => {
    const token = getApiToken();
    const response = await axios.post(SOFTPOS_ENDPOINTS.TRANSACTION_VOID(transactionId), 
        { reason },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        }
    );
    
    return response.data;
};

/**
 * Refund transaction
 */
export const refundTransaction = async ({ transactionId, amount, reason }) => {
    const token = getApiToken();
    const response = await axios.post(SOFTPOS_ENDPOINTS.TRANSACTION_REFUND(transactionId), 
        { amount, reason },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        }
    );
    
    return response.data;
};

/**
 * Send receipt
 */
export const sendReceipt = async ({ transactionId, email, message }) => {
    const token = getApiToken();
    const response = await axios.post(SOFTPOS_ENDPOINTS.TRANSACTION_SEND_RECEIPT(transactionId), 
        { email, message },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        }
    );
    
    return response.data;
};


