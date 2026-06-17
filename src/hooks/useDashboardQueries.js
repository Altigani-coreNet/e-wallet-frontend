import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { fetchMerchantDashboardLatestTransactions } from '../services/merchantDashboardService';

// Build params helper
const buildParams = (filters) => {
    const params = {};
    if (filters.datetime_from) params.datetime_from = filters.datetime_from;
    if (filters.datetime_to) params.datetime_to = filters.datetime_to;
    if (filters.transaction_status) params.transaction_status = filters.transaction_status;
    return params;
};

// Fetch statistics
const fetchStatistics = async (filters) => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found');
    }
    
    const params = buildParams(filters);
    const response = await axios.get(SOFTPOS_ENDPOINTS.DASHBOARD_STATISTICS, {
        params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to load statistics');
};

// Fetch charts
const fetchCharts = async (filters) => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found');
    }
    
    const params = buildParams(filters);
    const response = await axios.get(SOFTPOS_ENDPOINTS.DASHBOARD_CHARTS, {
        params,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to load charts');
};

// Custom hook for statistics
export const useDashboardStatistics = (filters, options = {}) => {
    return useQuery({
        queryKey: ['dashboard', 'statistics', filters.datetime_from, filters.datetime_to, filters.transaction_status],
        queryFn: () => fetchStatistics(filters),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 1,
        ...options
    });
};

// Custom hook for charts
export const useDashboardCharts = (filters, options = {}) => {
    return useQuery({
        queryKey: ['dashboard', 'charts', filters.datetime_from, filters.datetime_to, filters.transaction_status],
        queryFn: () => fetchCharts(filters),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        ...options
    });
};

// Custom hook for latest transactions
export const useDashboardLatestTransactions = (filters, options = {}) => {
    return useQuery({
        queryKey: ['dashboard', 'latest-transactions', filters.datetime_from, filters.datetime_to, filters.transaction_status, filters.limit],
        queryFn: () => fetchMerchantDashboardLatestTransactions(filters),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        ...options
    });
};

