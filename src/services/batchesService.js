import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { toast } from 'react-toastify';
import BatchModel, { BatchStatisticsModel } from './BatchModel';

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
    BATCHES_STALE_TIME: 30 * 1000, // 30 seconds
    BATCH_STATISTICS_STALE_TIME: 30 * 1000, // 30 seconds
    BATCH_DETAILS_STALE_TIME: 30 * 1000, // 30 seconds
};

/**
 * Fetch batches data
 */
export const fetchBatches = async ({ merchantId, page, perPage, filters, sortBy = 'created_at', sortOrder = 'desc' }) => {
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
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.BATCHES_DATA, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    const body = response.data;
    const rows = Array.isArray(body.data) ? body.data : [];
    return {
        data: BatchModel.fromApiResponseArray(rows),
        total: body.total ?? 0,
        per_page: body.per_page ?? perPage,
        current_page: body.current_page ?? page,
        last_page: body.last_page ?? 1,
    };
};

/**
 * Fetch batch statistics
 */
export const fetchBatchStatistics = async (merchantId) => {
    const token = getApiToken();
    
    const params = {};
    if (merchantId) {
        params.merchant_id = merchantId;
    }
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.BATCH_STATISTICS, {
        params: params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return BatchStatisticsModel.fromApiResponse(response.data);
};

/**
 * Fetch batch details
 */
export const fetchBatchDetails = async (batchId) => {
    const token = getApiToken();
    
    const response = await axios.get(SOFTPOS_ENDPOINTS.BATCH_DETAILS(batchId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    const body = response.data;
    const payload = body?.data ?? body;
    return BatchModel.fromApiResponse(payload);
};

/**
 * React Query Hooks
 */

/**
 * Hook to fetch batches list
 */
export const useBatches = (merchantId, page, perPage, filters, sortBy = 'created_at', sortOrder = 'desc') => {
    return useQuery({
        queryKey: ['batches', merchantId, page, perPage, filters, sortBy, sortOrder],
        queryFn: () => fetchBatches({ merchantId, page, perPage, filters, sortBy, sortOrder }),
        staleTime: CACHE_CONFIG.BATCHES_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching batches:', error);
            toast.error('Failed to load batches');
        }
    });
};

/**
 * Hook to fetch batch statistics
 */
export const useBatchStatistics = (merchantId) => {
    return useQuery({
        queryKey: ['batch-statistics', merchantId],
        queryFn: () => fetchBatchStatistics(merchantId),
        staleTime: CACHE_CONFIG.BATCH_STATISTICS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching batch statistics:', error);
        }
    });
};

/**
 * Hook to fetch batch details
 */
export const useBatchDetails = (batchId) => {
    return useQuery({
        queryKey: ['batch-details', batchId],
        queryFn: () => fetchBatchDetails(batchId),
        enabled: !!batchId,
        staleTime: CACHE_CONFIG.BATCH_DETAILS_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching batch details:', error);
            toast.error('Failed to load batch details');
        }
    });
};

