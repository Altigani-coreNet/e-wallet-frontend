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
 * Fetch purchase report data
 */
export const fetchPurchaseData = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.REPORTS_PURCHASES, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching purchase data:', error);
        throw error;
    }
};

/**
 * Fetch purchase summary
 */
export const fetchPurchaseSummary = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.REPORTS_PURCHASES_SUMMARY, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching purchase summary:', error);
        throw error;
    }
};

/**
 * Fetch sales report data
 */
export const fetchSalesData = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.REPORTS_SALES, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching sales data:', error);
        throw error;
    }
};

/**
 * Fetch sales summary
 */
export const fetchSalesSummary = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.REPORTS_SALES_SUMMARY, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching sales summary:', error);
        throw error;
    }
};

/**
 * Fetch products report data
 */
export const fetchProductsData = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.REPORTS_PRODUCTS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching products data:', error);
        throw error;
    }
};

/**
 * Fetch products summary
 */
export const fetchProductsSummary = async (params) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(POS_ENDPOINTS.REPORTS_PRODUCTS_SUMMARY, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching products summary:', error);
        throw error;
    }
};


