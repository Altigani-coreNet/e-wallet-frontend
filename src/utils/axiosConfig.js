/**
 * Global Axios Configuration
 * This file configures axios globally to ensure ALL axios calls
 * (even direct imports) go through our authentication interceptors
 */

import axios from 'axios';
import { APP_CONFIG } from './constants';
import { isSoftPosAdminJwtRoute } from './softposAdminRoutes';
import { showApiWarningToast } from './apiWarnings';

/** Same key as `lookupLocalStorage` in `src/i18n/config.js` */
const I18NEXT_LNG_STORAGE_KEY = 'i18nextLng';

/**
 * RFC 7231-style Accept-Language from the active UI locale (browser i18next storage).
 */
function getAcceptLanguageHeaderValue() {
    let raw = 'en';
    try {
        raw = localStorage.getItem(I18NEXT_LNG_STORAGE_KEY) || 'en';
    } catch {
        /* private mode / no storage */
    }
    const base = String(raw).split(/[-_]/)[0].toLowerCase();
    const primary = base === 'ar' ? 'ar' : 'en';
    const secondary = primary === 'ar' ? 'en' : 'ar';
    return `${primary},${secondary};q=0.9`;
}

/**
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
function applyAcceptLanguageHeader(config) {
    const value = getAcceptLanguageHeaderValue();
    if (!config.headers) {
        config.headers = {};
    }
    if (typeof config.headers.set === 'function') {
        config.headers.set('Accept-Language', value);
    } else {
        config.headers['Accept-Language'] = value;
    }
}

/**
 * Get authentication token from localStorage
 */
const getToken = () => {
    return localStorage.getItem(APP_CONFIG.TOKEN_KEY);
};

/**
 * Remove authentication tokens from localStorage
 */
const removeToken = () => {
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    localStorage.removeItem(APP_CONFIG.MERCHANT_KEY);
    // Clear Zustand persisted store (auth-storage) to remove all user data including regions
    localStorage.removeItem('auth-storage');
};

/**
 * Configure global axios defaults
 */
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

/**
 * Get regions from auth store (avoiding circular dependency by reading from localStorage)
 * @returns {object} Object with custom_region and regions
 */
const getRegionsFromStore = () => {
    try {
        // Access store state from localStorage to avoid circular dependency
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const state = parsed?.state || {};
            return {
                custom_region: state.custom_region === true,
                regions: Array.isArray(state.regions) ? state.regions : []
            };
        }
    } catch (error) {
        // Silently fail if store is not available
    }
    return { custom_region: false, regions: [] };
};

/**
 * Get test mode from auth store
 * @returns {boolean} Test mode status
 */
const getTestMode = () => {
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const state = parsed?.state || {};
            return state.testMode === true;
        }
    } catch (error) {
        // Silently fail
    }
    // Also check direct localStorage as fallback
    return localStorage.getItem('testMode') === 'true';
};

/**
 * Get merchant data from localStorage
 */
const getMerchant = () => {
    try {
        const merchantStr = localStorage.getItem(APP_CONFIG.MERCHANT_KEY);
        if (merchantStr) {
            return JSON.parse(merchantStr);
        }
        // Also try to get from auth store
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const state = parsed?.state || {};
            return state.merchant || null;
        }
    } catch (error) {
        // Silently fail
    }
    return null;
};

/**
 * Get merchant scopes from merchant data
 * @returns {array} Array of merchant scopes
 */
const getMerchantScopes = () => {
    try {
        const merchant = getMerchant();
        if (merchant && Array.isArray(merchant.scopes)) {
            return merchant.scopes;
        }
    } catch (error) {
        // Silently fail
    }
    return [];
};

/**
 * Check if the request URL is for merchant (not admin)
 * @param {string} url - The request URL
 * @returns {boolean} True if it's a merchant endpoint
 */
const isMerchantEndpoint = (url) => {
    if (!url) return false;
    if (isSoftPosAdminJwtRoute(url)) {
        return false;
    }
    // Merchant endpoints (not admin)
    const merchantEndpoints = [
        '/merchant/',
        '/softpos/',
        '/api/softpos/',
        '/v1/merchant/',
        '/v2/merchant/',
    ];
    // Admin endpoints (should NOT include scopes)
    const adminEndpoints = [
        '/admin/',
        '/api/v2/admin/',
    ];
    
    // Check if it's an admin endpoint first
    if (adminEndpoints.some(endpoint => url.includes(endpoint))) {
        return false;
    }
    
    // Check if it's a merchant endpoint
    return merchantEndpoints.some(endpoint => url.includes(endpoint));
};

/**
 * Check if the request URL is a login/register endpoint that should NOT include regions
 * @param {string} url - The request URL
 * @returns {boolean} True if it's a login/register endpoint
 */
const isAuthEndpoint = (url) => {
    if (!url) return false;
    const authEndpoints = [
        '/login',
        '/register',
        '/password/request-reset',
        '/password/verify-code',
        '/password/reset',
        '/register/validate-details',
        '/register/send-verification-code',
        '/register/verify-code',
        '/register/user',
        '/register/merchant',
    ];
    return authEndpoints.some(endpoint => url.includes(endpoint));
};

/**
 * Global Request Interceptor
 * Automatically adds auth token and regions to ALL axios requests
 */
axios.interceptors.request.use(
    (config) => {
        applyAcceptLanguageHeader(config);

        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add test mode header to all requests
        const testMode = getTestMode();
        if (testMode === true) {
            config.headers['X-Test-Mode'] = 'true';
        }
        
        // Add regions header if custom_region is enabled (for admin dashboard requests)
        // BUT NOT for login/register endpoints
        if (!isAuthEndpoint(config.url)) {
            const { custom_region, regions } = getRegionsFromStore();
            if (custom_region === true && Array.isArray(regions) && regions.length > 0) {
                // Extract region IDs from regions array (support both object and ID formats)
                const regionIds = regions.map(region => {
                    // If region is an object with id property, use id; otherwise use the value itself
                    return typeof region === 'object' && region !== null ? (region.id || region) : region;
                });
                
                // Send regions as JSON string array in header
                config.headers['X-Regions'] = JSON.stringify(regionIds);
            }
            
            // Add scopes header for merchant endpoints (not admin)
            if (isMerchantEndpoint(config.url)) {
                const scopes = getMerchantScopes();
                if (Array.isArray(scopes) && scopes.length > 0) {
                    // Send scopes as JSON string array in header
                    config.headers['X-Scope'] = JSON.stringify(scopes);
                }
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Global Response Interceptor
 * Handles authentication errors globally for ALL axios responses
 */
axios.interceptors.response.use(
    (response) => {
        showApiWarningToast(response);
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized - GLOBAL FOR ALL AXIOS CALLS
            // if (error.response.status === 401) {
            //     const requestUrl = error.config?.url || '';
            //     const currentPath = window.location.pathname;

            //     // If this is a login/register endpoint OR we are already on a login page,
            //     // don't trigger the global unauthorized flow. Let the page handle it.
            //     if (isAuthEndpoint(requestUrl) || currentPath === '/login' || currentPath === '/admin/login') {
            //         return Promise.reject(error);
            //     }

            //     console.warn('🔒 [Global Interceptor] Unauthorized - Token may be invalid or expired');
                
            //     // Determine redirect path based on current route
            //     const isAdminRoute = currentPath.startsWith('/admin');
            //     const redirectPath = isAdminRoute ? '/admin/login' : '/login';
                
            //     // Trigger logout event with redirect path
            //     window.dispatchEvent(new CustomEvent('unauthorized', { 
            //         detail: { redirectPath } 
            //     }));
                
            //     // Clear tokens
            //     removeToken();
            // }
            
            // Handle 403 Forbidden
            if (error.response.status === 403) {
                console.warn('⛔ [Global Interceptor] Forbidden - Insufficient permissions');
            }

            // Handle 500 Server Error
            if (error.response.status === 500) {
                console.error('💥 [Global Interceptor] Server Error:', error.response.data);
            }
        } else if (error.request) {
            // Request made but no response
            console.error('🌐 [Global Interceptor] Network Error: No response received');
        }
        
        return Promise.reject(error);
    }
);

console.log('✅ Global Axios interceptors configured successfully');

export default axios;

