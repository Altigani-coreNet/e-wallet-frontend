import { APP_CONFIG } from './constants';
import { isSoftPosAdminJwtRoute } from './softposAdminRoutes';
import { showApiWarningToast } from './apiWarnings';

/** Same key as `lookupLocalStorage` in `src/i18n/config.js` */
const I18NEXT_LNG_STORAGE_KEY = 'i18nextLng';

const AUTH_ENDPOINT_PATHS = [
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

const MERCHANT_ENDPOINT_MARKERS = [
    '/merchant/',
    '/softpos/',
    '/api/softpos/',
    '/v1/merchant/',
    '/v2/merchant/',
];

const ADMIN_ENDPOINT_MARKERS = [
    '/admin/',
    '/api/v2/admin/',
];

/**
 * Active UI locale from i18next storage: only `ar` or `en`.
 */
export function resolveUiLocale() {
    let raw = 'en';
    try {
        raw = localStorage.getItem(I18NEXT_LNG_STORAGE_KEY) || 'en';
    } catch {
        /* private mode / no storage */
    }
    const base = String(raw).split(/[-_]/)[0].toLowerCase();
    return base === 'ar' ? 'ar' : 'en';
}

export function getAcceptLanguageHeaderValue() {
    return resolveUiLocale();
}

export function getLocaleHeaders() {
    const locale = getAcceptLanguageHeaderValue();
    return {
        'Accept-Language': locale,
        'X-App-Locale': locale,
    };
}

export function getJsonFetchHeaders(options = {}) {
    const { token = null, extra = {} } = options;
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getLocaleHeaders(),
        ...extra,
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

export function isAuthEndpoint(url) {
    const safeUrl = url || '';
    if (!safeUrl) return false;
    return AUTH_ENDPOINT_PATHS.some((endpoint) => safeUrl.includes(endpoint));
}

export function isMerchantEndpoint(url) {
    const safeUrl = url || '';
    if (!safeUrl) return false;
    if (isSoftPosAdminJwtRoute(safeUrl)) {
        return false;
    }
    if (ADMIN_ENDPOINT_MARKERS.some((endpoint) => safeUrl.includes(endpoint))) {
        return false;
    }
    return MERCHANT_ENDPOINT_MARKERS.some((endpoint) => safeUrl.includes(endpoint));
}

function applyHeaders(config, headers) {
    if (!config.headers) {
        config.headers = {};
    }
    Object.entries(headers).forEach(([key, value]) => {
        if (value === undefined) return;
        if (typeof config.headers.set === 'function') {
            config.headers.set(key, value);
        } else {
            config.headers[key] = value;
        }
    });
}

function getRegionsFromStore() {
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const state = parsed?.state || {};
            return {
                custom_region: state.custom_region === true,
                regions: Array.isArray(state.regions) ? state.regions : [],
            };
        }
    } catch {
        /* ignore */
    }
    return { custom_region: false, regions: [] };
}

function getTestMode() {
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const state = parsed?.state || {};
            if (state.testMode === true) return true;
        }
    } catch {
        /* ignore */
    }
    return localStorage.getItem('testMode') === 'true';
}

function getMerchantScopes() {
    try {
        const merchantStr = localStorage.getItem(APP_CONFIG.MERCHANT_KEY);
        if (merchantStr) {
            const merchant = JSON.parse(merchantStr);
            if (merchant && Array.isArray(merchant.scopes)) {
                return merchant.scopes;
            }
        }
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const merchantFromStore = parsed?.state?.merchant;
            if (merchantFromStore && Array.isArray(merchantFromStore.scopes)) {
                return merchantFromStore.scopes;
            }
        }
    } catch {
        /* ignore */
    }
    return [];
}

export function buildContextHeaders(url, token) {
    const headers = {
        ...getLocaleHeaders(),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (getTestMode() === true) {
        headers['X-Test-Mode'] = 'true';
    }

    if (!isAuthEndpoint(url)) {
        const { custom_region, regions } = getRegionsFromStore();
        if (custom_region === true && Array.isArray(regions) && regions.length > 0) {
            const regionIds = regions.map((region) =>
                typeof region === 'object' && region !== null ? (region.id || region) : region
            );
            headers['X-Regions'] = JSON.stringify(regionIds);
        }

        if (isMerchantEndpoint(url)) {
            const scopes = getMerchantScopes();
            if (Array.isArray(scopes) && scopes.length > 0) {
                headers['X-Scope'] = JSON.stringify(scopes);
            }
        }
    }

    return headers;
}

/**
 * @param {import('axios').AxiosInstance} instance
 * @param {{ getToken: () => string | null }} options
 */
export function attachApiInterceptors(instance, { getToken }) {
    instance.interceptors.request.use(
        (config) => {
            const token = getToken();
            applyHeaders(config, buildContextHeaders(config.url || '', token));
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => {
            showApiWarningToast(response);
            return response;
        },
        (error) => {
            if (error.response?.status === 403) {
                console.warn('Forbidden - Insufficient permissions');
            }
            if (error.response?.status === 500) {
                console.error('Server Error:', error.response.data);
            }
            return Promise.reject(error);
        }
    );
}
