import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    SETTLEMENTS_STALE_TIME: 30 * 1000, // 30 seconds
    SETTLEMENT_STATISTICS_STALE_TIME: 30 * 1000, // 30 seconds
    SETTLEMENT_DETAILS_STALE_TIME: 30 * 1000, // 30 seconds
};

/**
 * Fetch settlements data
 */
export const fetchSettlements = async ({ merchantId, page, perPage, filters, sortBy = 'created_at', sortOrder = 'desc' }) => {
    const token = getApiToken();
    
    // Build params
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
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.SETTLEMENTS_DATA, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch settlement statistics
 */
export const fetchSettlementStatistics = async (merchantId) => {
    const token = getApiToken();
    
    const params = {};
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.SETTLEMENT_STATISTICS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch settlement details
 */
export const fetchSettlementDetails = async (settlementId) => {
    const token = getApiToken();
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.SETTLEMENT_DETAILS(settlementId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * Fetch settlement transactions (refunded and voided)
 */
export const fetchSettlementTransactions = async ({ merchantId, page, perPage, filters }) => {
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
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.SETTLEMENT_TRANSACTIONS_DATA, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * Fetch settlement transactions statistics
 */
export const fetchSettlementTransactionsStatistics = async (merchantId) => {
    const token = getApiToken();
    
    const params = {};
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.SETTLEMENT_TRANSACTIONS_STATISTICS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};

/**
 * React Query Hooks
 */

/**
 * Hook to fetch settlements list
 */
export const useSettlements = (merchantId, page, perPage, filters, sortBy = 'created_at', sortOrder = 'desc') => {
    return useQuery({
        queryKey: ['settlements', merchantId, page, perPage, filters, sortBy, sortOrder],
        queryFn: () => fetchSettlements({ merchantId, page, perPage, filters, sortBy, sortOrder }),
        staleTime: CACHE_CONFIG.SETTLEMENTS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching settlements:', error);
            toast.error('Failed to load settlements');
        }
    });
};

/**
 * Hook to fetch settlement statistics
 */
export const useSettlementStatistics = (merchantId) => {
    return useQuery({
        queryKey: ['settlement-statistics', merchantId],
        queryFn: () => fetchSettlementStatistics(merchantId),
        staleTime: CACHE_CONFIG.SETTLEMENT_STATISTICS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching settlement statistics:', error);
        }
    });
};

/**
 * Hook to fetch settlement details
 */
export const useSettlementDetails = (settlementId) => {
    return useQuery({
        queryKey: ['settlement-details', settlementId],
        queryFn: () => fetchSettlementDetails(settlementId),
        enabled: !!settlementId,
        staleTime: CACHE_CONFIG.SETTLEMENT_DETAILS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching settlement details:', error);
            toast.error('Failed to load settlement details');
        }
    });
};

/**
 * Hook to fetch settlement transactions (refunded and voided)
 */
export const useSettlementTransactions = (merchantId, page, perPage, filters) => {
    return useQuery({
        queryKey: ['settlement-transactions', merchantId, page, perPage, filters],
        queryFn: () => fetchSettlementTransactions({ merchantId, page, perPage, filters }),
        staleTime: CACHE_CONFIG.SETTLEMENTS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching settlement transactions:', error);
            toast.error('Failed to load settlement transactions');
        }
    });
};

/**
 * Hook to fetch settlement transactions statistics
 */
export const useSettlementTransactionsStatistics = (merchantId) => {
    return useQuery({
        queryKey: ['settlement-transactions-statistics', merchantId],
        queryFn: () => fetchSettlementTransactionsStatistics(merchantId),
        staleTime: CACHE_CONFIG.SETTLEMENT_STATISTICS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching settlement transactions statistics:', error);
        }
    });
};

