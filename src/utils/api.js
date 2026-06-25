import axios from 'axios';
import { APP_CONFIG } from './constants';
import {
    attachApiInterceptors,
    buildContextHeaders,
    getAcceptLanguageHeaderValue,
    getJsonFetchHeaders,
    getLocaleHeaders,
    isAuthEndpoint,
    isMerchantEndpoint,
    resolveUiLocale,
} from './apiInterceptors';

export {
    attachApiInterceptors,
    buildContextHeaders,
    getAcceptLanguageHeaderValue,
    getJsonFetchHeaders,
    getLocaleHeaders,
    isAuthEndpoint,
    isMerchantEndpoint,
    resolveUiLocale,
};

/**
 * Controls whether `apiClient` treats HTTP 401 as session dead (clear token + redirect).
 */
export const apiClientAuthBehavior = {
    redirectOn401: false,
};

export const setToken = (token) => {
    if (token) {
        localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
    }
};

export const getToken = () => localStorage.getItem(APP_CONFIG.TOKEN_KEY);

export const removeToken = () => {
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    localStorage.removeItem(APP_CONFIG.MERCHANT_KEY);
    localStorage.removeItem('auth-storage');
};

export const setRegistrationTokenStorage = (token) => {
    if (token) {
        localStorage.setItem(APP_CONFIG.REGISTRATION_TOKEN_KEY, token);
    }
};

export const getRegistrationToken = () =>
    localStorage.getItem(APP_CONFIG.REGISTRATION_TOKEN_KEY);

export const setRegistrationUserStorage = (user) => {
    if (user) {
        localStorage.setItem(APP_CONFIG.REGISTRATION_USER_KEY, JSON.stringify(user));
    }
};

export const getRegistrationUserStorage = () => {
    try {
        const raw = localStorage.getItem(APP_CONFIG.REGISTRATION_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearRegistrationSession = () => {
    localStorage.removeItem(APP_CONFIG.REGISTRATION_TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.REGISTRATION_USER_KEY);
    localStorage.removeItem('auth_token');
};

export const getRegistrationAuthToken = (storeToken = null) =>
    storeToken || getRegistrationToken() || null;

export const setUser = (user) => {
    if (user) {
        localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
    }
};

export const getUser = () => {
    const user = localStorage.getItem(APP_CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const setMerchant = (merchant) => {
    if (merchant) {
        localStorage.setItem(APP_CONFIG.MERCHANT_KEY, JSON.stringify(merchant));
    }
};

export const getMerchant = () => {
    const merchant = localStorage.getItem(APP_CONFIG.MERCHANT_KEY);
    return merchant ? JSON.parse(merchant) : null;
};

const getHeaders = (url = '') => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...buildContextHeaders(url, getToken()),
});

/** Canonical axios instance — all services should prefer this or the `http` helpers below. */
const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

attachApiInterceptors(apiClient, { getToken });

const handleError = (error) => {
    if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
        console.error('Network Error: No response received', error.request);
    } else {
        console.error('Request Error:', error.message);
    }
};

export const get = async (url, config = {}) => {
    try {
        return await apiClient.get(url, {
            ...config,
            headers: { ...getHeaders(url), ...(config.headers || {}) },
        });
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const post = async (url, data = {}, config = {}) => {
    try {
        return await apiClient.post(url, data, {
            ...config,
            headers: { ...getHeaders(url), ...(config.headers || {}) },
        });
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const put = async (url, data = {}, config = {}) => {
    try {
        return await apiClient.put(url, data, {
            ...config,
            headers: { ...getHeaders(url), ...(config.headers || {}) },
        });
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const del = async (url, config = {}) => {
    try {
        return await apiClient.delete(url, {
            ...config,
            headers: { ...getHeaders(url), ...(config.headers || {}) },
        });
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const patch = async (url, data = {}, config = {}) => {
    try {
        return await apiClient.patch(url, data, {
            ...config,
            headers: { ...getHeaders(url), ...(config.headers || {}) },
        });
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const uploadFile = async (url, formData, config = {}) => {
    try {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
            ...buildContextHeaders(url, getToken()),
        };

        return await apiClient.post(url, formData, {
            ...config,
            headers: { ...headers, ...(config.headers || {}) },
        });
    } catch (error) {
        handleError(error);
        throw error;
    }
};

/** Unified HTTP facade — preferred entry point for new code. */
export const http = {
    get,
    post,
    put,
    patch,
    delete: del,
    uploadFile,
    client: apiClient,
};

export { apiClient };

export default {
    get,
    post,
    put,
    del,
    patch,
    uploadFile,
    http,
    setToken,
    getToken,
    setRegistrationTokenStorage,
    getRegistrationToken,
    getRegistrationAuthToken,
    clearRegistrationSession,
    removeToken,
    setUser,
    getUser,
    setMerchant,
    getMerchant,
    resolveUiLocale,
    getAcceptLanguageHeaderValue,
    getLocaleHeaders,
    getJsonFetchHeaders,
    apiClient,
    apiClientAuthBehavior,
};
