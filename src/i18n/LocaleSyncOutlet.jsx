import { useEffect } from 'react';
import { Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import i18n from './config';
import { LOCALE_CODES, buildPrefixedPath } from './localePaths';

/**
 * Validates `:lang`, syncs i18next, renders nested routes (merchant, sales, public pages under /en, /ar).
 * If the first segment is not a locale (e.g. `/merchant/...`), redirect to the same path with stored locale.
 */
export default function LocaleSyncOutlet() {
    const { lang } = useParams();
    const location = useLocation();

    if (!LOCALE_CODES.includes(lang)) {
        const target = `${buildPrefixedPath(location.pathname)}${location.search}${location.hash}`;
        return <Navigate to={target} replace />;
    }

    useEffect(() => {
        const code = lang.split('-')[0];
        if ((i18n.language || 'en').split('-')[0] !== code) {
            void i18n.changeLanguage(lang);
        }
    }, [lang]);

    return <Outlet />;
}
