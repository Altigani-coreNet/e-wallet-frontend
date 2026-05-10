import { Navigate, useParams } from 'react-router-dom';

/** `<Navigate to="/merchant/...">` relative to current `/:lang` segment. */
export default function LocalizedNavigate({ to }) {
    const { lang } = useParams();
    const path = to.startsWith('/') ? to : `/${to}`;
    return <Navigate to={`/${lang}${path}`} replace />;
}
