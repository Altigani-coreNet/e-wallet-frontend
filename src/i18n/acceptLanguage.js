import i18n from './config';

/**
 * Value for the HTTP Accept-Language header (RFC 7231), derived from the active i18n locale.
 */
export function getAcceptLanguageHeaderValue() {
    const raw = i18n.language || 'en';
    const base = String(raw).split(/[-_]/)[0].toLowerCase();
    const primary = base === 'ar' ? 'ar' : 'en';
    const secondary = primary === 'ar' ? 'en' : 'ar';
    return `${primary},${secondary};q=0.9`;
}

/**
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
export function applyAcceptLanguageHeader(config) {
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
 * Ensures every request from this axios instance sends Accept-Language.
 * @param {import('axios').AxiosInstance} axiosInstance
 */
export function attachAcceptLanguageInterceptor(axiosInstance) {
    axiosInstance.interceptors.request.use((config) => {
        applyAcceptLanguageHeader(config);
        return config;
    });
}
