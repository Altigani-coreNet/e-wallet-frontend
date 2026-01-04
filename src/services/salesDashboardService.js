import { useQuery } from '@tanstack/react-query';
import { POS_ENDPOINTS } from '../utils/constants';
import { apiGet } from '../utils/apiUtils';

/**
 * Fetch dashboard statistics
 */
export const useDashboardStatistics = (filters = {}) => {
    return useQuery({
        queryKey: ['sales-dashboard-statistics', filters.date_from, filters.date_to],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            
            const url = params.toString() 
                ? `${POS_ENDPOINTS.DASHBOARD_STATISTICS}?${params.toString()}`
                : POS_ENDPOINTS.DASHBOARD_STATISTICS;
            
            const response = await apiGet(url);
            if (response.success) {
                // Ensure we return the data or default values
                if (response.data && response.data.data) {
                    return response.data.data;
                }
                // Return default structure if data is missing
                console.warn('⚠️ Unexpected response structure for statistics:', response);
                return {
                    total_sales: '0.00',
                    total_purchases: '0.00',
                    total_customers: 0,
                    total_orders: 0
                };
            }
            throw new Error(response.error || response.message || 'Failed to fetch statistics');
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    });
};

/**
 * Fetch latest sales
 */
export const useLatestSales = (limit = 7, filters = {}) => {
    return useQuery({
        queryKey: ['sales-dashboard-latest-sales', limit, filters.date_from, filters.date_to],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('limit', limit);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            
            const response = await apiGet(`${POS_ENDPOINTS.DASHBOARD_LATEST_SALES}?${params.toString()}`);
            
            // Handle successful response
            if (response.success) {
                // Check if data exists and has the expected structure
                if (response.data && response.data.data !== undefined) {
                    // Ensure we always return an array
                    const data = response.data.data;
                    return Array.isArray(data) ? data : [];
                }
                // Handle case where data is directly in response.data (not nested)
                if (Array.isArray(response.data)) {
                    return response.data;
                }
                // If no data structure found, return empty array
                console.warn('⚠️ Unexpected response structure for latest sales:', {
                    response: response,
                    url: `${POS_ENDPOINTS.DASHBOARD_LATEST_SALES}?${params.toString()}`
                });
                return [];
            }
            
            // Handle error response
            const errorMsg = response.error || response.message || 'Failed to fetch latest sales';
            console.error('❌ Error fetching latest sales:', {
                error: errorMsg,
                response: response,
                url: `${POS_ENDPOINTS.DASHBOARD_LATEST_SALES}?${params.toString()}`
            });
            throw new Error(errorMsg);
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Fetch latest purchases
 */
export const useLatestPurchases = (limit = 7, filters = {}) => {
    return useQuery({
        queryKey: ['sales-dashboard-latest-purchases', limit, filters.date_from, filters.date_to],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('limit', limit);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            
            const response = await apiGet(`${POS_ENDPOINTS.DASHBOARD_LATEST_PURCHASES}?${params.toString()}`);
            if (response.success) {
                // Ensure we always return an array
                if (response.data && response.data.data !== undefined) {
                    const data = response.data.data;
                    return Array.isArray(data) ? data : [];
                }
                if (Array.isArray(response.data)) {
                    return response.data;
                }
                console.warn('⚠️ Unexpected response structure for latest purchases:', response);
                return [];
            }
            throw new Error(response.error || response.message || 'Failed to fetch latest purchases');
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Fetch sales and purchases chart data
 */
export const useSalesChart = (period = 'daily', filters = {}) => {
    return useQuery({
        queryKey: ['sales-dashboard-chart', period, filters.date_from, filters.date_to],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('period', period);
            if (filters.date_from) params.append('datetime_from', filters.date_from);
            if (filters.date_to) params.append('datetime_to', filters.date_to);
            
            const response = await apiGet(`${POS_ENDPOINTS.DASHBOARD_SALES_PURCHASES_CHART}?${params.toString()}`);
            if (response.success) {
                if (response.data && response.data.data) {
                    return response.data.data;
                }
                // Return default chart structure if data is missing
                console.warn('⚠️ Unexpected response structure for chart data:', response);
                return {
                    labels: [],
                    series: [
                        { name: 'Sales', data: [] },
                        { name: 'Purchases', data: [] }
                    ]
                };
            }
            throw new Error(response.error || response.message || 'Failed to fetch chart data');
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

