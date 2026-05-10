/** Locales that appear as the first URL segment (must match LocaleSyncOutlet). */
export const LOCALE_CODES = ['en', 'ar'];

export function getStoredOrDefaultLocale() {
    try {
        const v = localStorage.getItem('i18nextLng');
        const code = (v || 'en').split('-')[0].toLowerCase();
        return LOCALE_CODES.includes(code) ? code : 'en';
    } catch {
        return 'en';
    }
}

/** @param {string} path absolute app path e.g. `/merchant/dashboard` */
export function buildPrefixedPath(path, locale = getStoredOrDefaultLocale()) {
    const p = path.startsWith('/') ? path : `/${path}`;
    if (p === '/') return `/${locale}`;
    return `/${locale}${p}`;
}

/** @param {string} pathname */
export function stripLocalePrefix(pathname) {
    return pathname.replace(/^\/(en|ar)(?=\/|$)/, '') || '/';
}

/** Swap `/en/...` ↔ `/ar/...` */
export function replaceLocaleInPathname(pathname, newLocale) {
    if (!LOCALE_CODES.includes(newLocale)) return pathname;
    const stripped = pathname.replace(/^\/(en|ar)(?=\/|$)/, '');
    const rest = stripped || '/';
    if (rest === '/') return `/${newLocale}`;
    return `/${newLocale}${rest.startsWith('/') ? rest : `/${rest}`}`;
}

/**
 * Paths handled outside `/:lang/*` — must not be auto-prefixed by NoLocaleFallback.
 * @param {string} pathname
 */
export function pathShouldSkipLocaleRedirect(pathname) {
    if (pathname === '/') return true;
    const exactOrPrefix = [
        '/login',
        '/admin',
        '/forgot-password',
        '/401',
        '/404',
        '/500',
        '/merchant/register',
        '/partner/register',
        '/admin/login',
        '/invoice',
        '/pos-invoice',
        '/link-invoice',
        '/reset-password',
    ];
    for (const pre of exactOrPrefix) {
        if (pathname === pre || pathname.startsWith(`${pre}/`)) return true;
    }
    if (pathname.startsWith('/payment') || pathname.startsWith('/payments')) return true;
    return false;
}
