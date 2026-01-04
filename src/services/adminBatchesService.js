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
 * Fetch admin batches data
 */
export const fetchAdminBatches = async ({ page, perPage, filters }) => {
    const token = getApiToken();
    
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    const response = await axios.get(ADMIN_ENDPOINTS.BATCHES, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch admin batch statistics
 */
export const fetchAdminBatchStatistics = async (filters = {}) => {
    const token = getApiToken();
    
    const response = await axios.get(ADMIN_ENDPOINTS.BATCH_STATISTICS, {
        params: filters,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Export admin batches - Server-side export
 */
export const exportAdminBatches = async (filters) => {
    const token = getApiToken();
    
    const params = new URLSearchParams(filters).toString();
    
    const response = await axios.get(`${ADMIN_ENDPOINTS.BATCH_EXPORT}?${params}`, {
        responseType: 'blob',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data;
};

/**
 * Fetch admin batch details
 */
export const fetchAdminBatchDetails = async (batchId) => {
    const token = getApiToken();
    
    const response = await axios.get(ADMIN_ENDPOINTS.BATCH_DETAILS(batchId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

