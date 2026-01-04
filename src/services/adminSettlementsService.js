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
 * Fetch admin settlements data
 */
export const fetchAdminSettlements = async ({ page, perPage, filters }) => {
    const token = getApiToken();
    
    const params = {
        page: page,
        per_page: perPage,
        ...filters
    };
    
    const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENTS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch admin settlement statistics
 */
export const fetchAdminSettlementStatistics = async (filters = {}) => {
    const token = getApiToken();
    
    const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENT_STATISTICS, {
        params: filters,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Export admin settlements - Server-side export
 */
export const exportAdminSettlements = async (filters) => {
    const token = getApiToken();
    
    const params = new URLSearchParams(filters).toString();
    
    const response = await axios.get(`${ADMIN_ENDPOINTS.SETTLEMENT_EXPORT}?${params}`, {
        responseType: 'blob',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.data;
};

/**
 * Fetch admin settlement details
 */
export const fetchAdminSettlementDetails = async (settlementId) => {
    const token = getApiToken();
    
    const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENT_DETAILS(settlementId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

