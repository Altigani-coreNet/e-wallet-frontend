import { Navigate } from 'react-router-dom';
import { buildPrefixedPath, getStoredOrDefaultLocale } from './localePaths';

/** `/` → `/en` or stored locale (landing lives at `/:lang`). */
export default function RootLangRedirect() {
    const lng = getStoredOrDefaultLocale();
    return <Navigate to={buildPrefixedPath('/', lng)} replace />;
}
