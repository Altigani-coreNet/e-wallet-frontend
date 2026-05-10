import { Navigate, useLocation } from 'react-router-dom';
import {
    buildPrefixedPath,
    pathShouldSkipLocaleRedirect,
    getStoredOrDefaultLocale,
} from './localePaths';

/**
 * `/merchant/...` without `/en` prefix → `/en/merchant/...` (or stored locale).
 * Unrecognized paths that skip prefix → 404 via parent * handling.
 */
export default function NoLocaleFallback() {
    const location = useLocation();
    const { pathname, search, hash } = location;

    if (pathShouldSkipLocaleRedirect(pathname)) {
        return <Navigate to="/404" replace />;
    }

    const lng = getStoredOrDefaultLocale();
    const target = `${buildPrefixedPath(pathname, lng)}${search}${hash}`;
    return <Navigate to={target} replace />;
}
