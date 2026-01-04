import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get admin API token
 */
const getApiToken = () => {
    return getToken();
};

/**
 * Fetch admin transactions data
 */
export const fetchAdminTransactions = async ({ page, perPage, filters }) => {
    const token = getApiToken();
    
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTIONS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch admin transaction statistics
 */
export const fetchAdminTransactionStatistics = async (filters = {}) => {
    const token = getApiToken();
    
    const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_STATISTICS, {
        params: filters,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Export admin transactions - Server-side export
 */
export const exportAdminTransactions = async (filters) => {
    const token = getApiToken();
    
    const params = new URLSearchParams(filters).toString();
    
    const response = await axios.get(`${ADMIN_ENDPOINTS.TRANSACTION_EXPORT}?${params}`, {
        responseType: 'blob',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data;
};

/**
 * Fetch admin transaction details
 */
export const fetchAdminTransactionDetails = async (transactionId) => {
    const token = getApiToken();
    
    const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_DETAILS(transactionId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

