import { useParams } from 'react-router-dom';
import { buildPrefixedPath, getStoredOrDefaultLocale, LOCALE_CODES } from '../i18n/localePaths';

/**
 * Prefix merchant/sales paths with current URL locale when inside `/:lang/*`, else localStorage locale.
 * @returns {(path: string) => string}
 */
export function useLocalePrefix() {
    const { lang } = useParams();
    const effective =
        lang && LOCALE_CODES.includes(lang) ? lang : getStoredOrDefaultLocale();
    return (path) => buildPrefixedPath(path, effective);
}
