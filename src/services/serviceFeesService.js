import { get } from '../utils/api';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';

/**
 * Get all service fees with pagination and filters
 * @param {Object} params - Query parameters (page, per_page, search, type, date_from, date_to)
 * @returns {Promise} - API response
 */
export const getServiceFees = async (params = {}) => {
    try {
        const queryParams = {
            page: params.page || 1,
            per_page: params.per_page || 15,
            ...params
        };

        const response = await get(SOFTPOS_ENDPOINTS.SERVICE_FEES, {
            params: queryParams
        });
        
        return {
            success: true,
            data: response.data?.data || response.data,
            pagination: response.data?.pagination || response.data?.meta || {}
        };
    } catch (error) {
        console.error('Error in getServiceFees:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch service fees',
            data: [],
            pagination: {}
        };
    }
};

/**
 * Get a single service fee by ID
 * @param {number|string} serviceFeeId - Service fee ID
 * @returns {Promise} - API response
 */
export const getServiceFee = async (serviceFeeId) => {
    try {
        const response = await get(SOFTPOS_ENDPOINTS.SERVICE_FEE_DETAILS(serviceFeeId));
        
        return {
            success: true,
            data: response.data?.data || response.data
        };
    } catch (error) {
        console.error('Error in getServiceFee:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch service fee'
        };
    }
};

/**
 * Get available service fee types
 * @returns {Promise} - API response
 */
export const getServiceFeeTypes = async () => {
    try {
        const response = await get(SOFTPOS_ENDPOINTS.SERVICE_FEE_TYPES);
        
        return {
            success: true,
            data: response.data?.data || response.data || []
        };
    } catch (error) {
        console.error('Error in getServiceFeeTypes:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch service fee types',
            data: []
        };
    }
};

