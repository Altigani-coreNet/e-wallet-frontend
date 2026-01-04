import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AUTH_ENDPOINTS } from '../utils/constants';
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
    CURRENCIES_STALE_TIME: 60 * 60 * 1000, // 1 hour (currencies don't change often)
};

/**
 * Fetch all currencies from AuthService
 */
export const fetchCurrencies = async () => {
    const token = getApiToken();
    
    const response = await axios.get(AUTH_ENDPOINTS.CURRENCIES, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * Fetch currencies for select dropdown (simplified format)
 */
export const fetchCurrenciesSelect = async () => {
    const token = getApiToken();
    
    const response = await axios.get(AUTH_ENDPOINTS.CURRENCIES_SELECT, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * Fetch currency details by UUID
 */
export const fetchCurrencyDetails = async (currencyId) => {
    const token = getApiToken();
    
    const response = await axios.get(`${AUTH_ENDPOINTS.CURRENCIES}/${currencyId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data.data || response.data;
};

/**
 * React Query Hooks
 */

/**
 * Hook to fetch all currencies
 */
export const useCurrencies = () => {
    return useQuery({
        queryKey: ['currencies'],
        queryFn: fetchCurrencies,
        staleTime: CACHE_CONFIG.CURRENCIES_STALE_TIME,
        cacheTime: CACHE_CONFIG.CURRENCIES_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching currencies:', error);
            toast.error('Failed to load currencies');
        }
    });
};

/**
 * Hook to fetch currencies for select dropdown
 */
export const useCurrenciesSelect = () => {
    return useQuery({
        queryKey: ['currencies-select'],
        queryFn: fetchCurrenciesSelect,
        staleTime: CACHE_CONFIG.CURRENCIES_STALE_TIME,
        cacheTime: CACHE_CONFIG.CURRENCIES_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching currencies:', error);
            toast.error('Failed to load currencies');
        }
    });
};

/**
 * Hook to fetch currency details
 */
export const useCurrencyDetails = (currencyId) => {
    return useQuery({
        queryKey: ['currency-details', currencyId],
        queryFn: () => fetchCurrencyDetails(currencyId),
        enabled: !!currencyId,
        staleTime: CACHE_CONFIG.CURRENCIES_STALE_TIME,
        cacheTime: CACHE_CONFIG.CURRENCIES_STALE_TIME,
        onError: (error) => {
            console.error('Error fetching currency details:', error);
            toast.error('Failed to load currency details');
        }
    });
};


