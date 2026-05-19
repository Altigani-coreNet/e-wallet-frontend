import i18n from './config';

/** Active UI locale: only `ar` or `en`. */
export function getAcceptLanguageHeaderValue() {
    const raw = i18n.language || 'en';
    const base = String(raw).split(/[-_]/)[0].toLowerCase();
    return base === 'ar' ? 'ar' : 'en';
}

export function getLocaleHeaders() {
    const locale = getAcceptLanguageHeaderValue();
    return {
        'Accept-Language': locale,
        'X-App-Locale': locale,
    };
}

/**
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
export function applyAcceptLanguageHeader(config) {
    const localeHeaders = getLocaleHeaders();
    if (!config.headers) {
        config.headers = {};
    }
    Object.entries(localeHeaders).forEach(([key, value]) => {
        if (typeof config.headers.set === 'function') {
            config.headers.set(key, value);
        } else {
            config.headers[key] = value;
        }
    });
}

/**
 * Ensures every request from this axios instance sends Accept-Language.
 * @param {import('axios').AxiosInstance} axiosInstance
 */
export function attachAcceptLanguageInterceptor(axiosInstance) {
    axiosInstance.interceptors.request.use((config) => {
        applyAcceptLanguageHeader(config);
        return config;
    });
}
