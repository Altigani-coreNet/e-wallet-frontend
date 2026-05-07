import axios from 'axios';
import { APP_CONFIG } from './constants';
import { isSoftPosAdminJwtRoute } from './softposAdminRoutes';
import { showApiWarningToast } from './apiWarnings';

/**
 * Controls whether `apiClient` treats HTTP 401 as “session dead” (clear token + `unauthorized` → login redirect).
 * Set `redirectOn401` to `true` for normal production behavior; keep `false` while debugging or when some routes return 401 without invalidating the session.
 * @type {{ redirectOn401: boolean }}
 */
export const apiClientAuthBehavior = {
    redirectOn401: false,
};

/**
 * Store authentication token in localStorage
 * @param {string} token - The authentication token
 */
export const setToken = (token) => {
    if (token) {
        localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
    }
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} The stored token or null
 */
export const getToken = () => {
    return localStorage.getItem(APP_CONFIG.TOKEN_KEY);
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    localStorage.removeItem(APP_CONFIG.MERCHANT_KEY);
    // Clear Zustand persisted store (auth-storage) to remove all user data including regions
    localStorage.removeItem('auth-storage');
};

/**
 * Store user data in localStorage
 * @param {object} user - The user object
 */
export const setUser = (user) => {
    if (user) {
        localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
    }
};

/**
 * Get user data from localStorage
 * @returns {object|null} The stored user object or null
 */
export const getUser = () => {
    const user = localStorage.getItem(APP_CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
};

/**
 * Store merchant data in localStorage
 * @param {object} merchant - The merchant object
 */
export const setMerchant = (merchant) => {
    if (merchant) {
        localStorage.setItem(APP_CONFIG.MERCHANT_KEY, JSON.stringify(merchant));
    }
};

/**
 * Get merchant data from localStorage
 * @returns {object|null} The stored merchant object or null
 */
export const getMerchant = () => {
    const merchant = localStorage.getItem(APP_CONFIG.MERCHANT_KEY);
    return merchant ? JSON.parse(merchant) : null;
};

/**
 * Get regions from auth store (avoiding circular dependency by using getState)
 * @returns {object} Object with custom_region and regions
 */
const getRegionsFromStore = () => {
    try {
        // Access store state without importing to avoid circular dependency
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
 * Get merchant scopes from merchant data
 * @returns {array} Array of merchant scopes
 */
const getMerchantScopes = () => {
    try {
        const merchant = getMerchant();
        if (merchant && Array.isArray(merchant.scopes)) {
            return merchant.scopes;
        }
        // Also try to get from auth store
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const state = parsed?.state || {};
            const merchantFromStore = state.merchant;
            if (merchantFromStore && Array.isArray(merchantFromStore.scopes)) {
                return merchantFromStore.scopes;
            }
        }
    } catch (error) {
        // Silently fail if store is not available
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
        '/admin/login',
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
 * Get default headers with authentication and regions
 * @param {string} url - Optional URL to check if it's an auth endpoint
 * @returns {object} Headers object
 */
const getHeaders = (url = '') => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add regions header if custom_region is enabled (for admin dashboard requests)
    // BUT NOT for login/register endpoints
    if (!isAuthEndpoint(url)) {
        const { custom_region, regions } = getRegionsFromStore();
        if (custom_region === true && Array.isArray(regions) && regions.length > 0) {
            // Extract region IDs from regions array (support both object and ID formats)
            const regionIds = regions.map(region => {
                // If region is an object with id property, use id; otherwise use the value itself
                return typeof region === 'object' && region !== null ? (region.id || region) : region;
            });
            
            // Send regions as JSON string array in header
            headers['X-Regions'] = JSON.stringify(regionIds);
        }
        
        // Add scopes header for merchant endpoints (not admin)
        if (isMerchantEndpoint(url)) {
            const scopes = getMerchantScopes();
            if (Array.isArray(scopes) && scopes.length > 0) {
                // Send scopes as JSON string array in header
                headers['X-Scope'] = JSON.stringify(scopes);
            }
        }
    }

    return headers;
};

/**
 * Create axios instance with interceptors
 * This instance should be used by all services to ensure consistent auth handling
 */
const apiClient = axios.create();

// Request interceptor to add auth token and regions
apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        showApiWarningToast(response);
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized (align with global axios: never logout on auth endpoints / login pages)
           
            
            // Handle 403 Forbidden
            if (error.response.status === 403) {
                console.warn('Forbidden - Insufficient permissions');
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Make a GET request
 * @param {string} url - The API endpoint URL
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response promise
 */
export const get = async (url, config = {}) => {
    try {
        const response = await apiClient.get(url, {
            ...config,
            headers: {
                ...getHeaders(url),
                ...(config.headers || {})
            }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/**
 * Make a POST request
 * @param {string} url - The API endpoint URL
 * @param {object} data - The request body data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response promise
 */
export const post = async (url, data = {}, config = {}) => {
    try {
        const response = await apiClient.post(url, data, {
            ...config,
            headers: {
                ...getHeaders(url),
                ...(config.headers || {})
            }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/**
 * Make a PUT request
 * @param {string} url - The API endpoint URL
 * @param {object} data - The request body data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response promise
 */
export const put = async (url, data = {}, config = {}) => {
    try {
        const response = await apiClient.put(url, data, {
            ...config,
            headers: {
                ...getHeaders(url),
                ...(config.headers || {})
            }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/**
 * Make a DELETE request
 * @param {string} url - The API endpoint URL
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response promise
 */
export const del = async (url, config = {}) => {
    try {
        const response = await apiClient.delete(url, {
            ...config,
            headers: {
                ...getHeaders(url),
                ...(config.headers || {})
            }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/**
 * Make a PATCH request
 * @param {string} url - The API endpoint URL
 * @param {object} data - The request body data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response promise
 */
export const patch = async (url, data = {}, config = {}) => {
    try {
        const response = await apiClient.patch(url, data, {
            ...config,
            headers: {
                ...getHeaders(url),
                ...(config.headers || {})
            }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/**
 * Upload a file using multipart/form-data
 * @param {string} url - The API endpoint URL
 * @param {FormData} formData - FormData object with file and other data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response promise
 */
export const uploadFile = async (url, formData, config = {}) => {
    try {
        const token = getToken();
        const headers = {
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'multipart/form-data',
        };
        
        // Add regions header if custom_region is enabled
        // BUT NOT for login/register endpoints
        if (!isAuthEndpoint(url)) {
            const { custom_region, regions } = getRegionsFromStore();
            if (custom_region === true && Array.isArray(regions) && regions.length > 0) {
                const regionIds = regions.map(region => {
                    return typeof region === 'object' && region !== null ? (region.id || region) : region;
                });
                headers['X-Regions'] = JSON.stringify(regionIds);
            }
            
            // Add scopes header for merchant endpoints (not admin)
            if (isMerchantEndpoint(url)) {
                const scopes = getMerchantScopes();
                if (Array.isArray(scopes) && scopes.length > 0) {
                    headers['X-Scope'] = JSON.stringify(scopes);
                }
            }
        }
        
        const response = await apiClient.post(url, formData, {
            ...config,
            headers: {
                ...headers,
                ...(config.headers || {})
            }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/**
 * Handle API errors
 * @param {Error} error - The error object
 */
const handleError = (error) => {
    if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
        // Request made but no response
        console.error('Network Error: No response received', error.request);
    } else {
        // Error in request setup
        console.error('Request Error:', error.message);
    }
};

// Export the configured axios client for services that need direct access
export { apiClient };

// Export as default object for convenience
export default {
    get,
    post,
    put,
    del,
    patch,
    uploadFile,
    setToken,
    getToken,
    removeToken,
    setUser,
    getUser,
    setMerchant,
    getMerchant,
    apiClient, // Also export in default object
    apiClientAuthBehavior,
};

