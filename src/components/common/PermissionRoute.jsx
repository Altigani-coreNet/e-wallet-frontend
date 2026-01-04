import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const PermissionRoute = ({ required = null, anyOf = [], children }) => {
    const location = useLocation();
    const can = useAuthStore(state => state.can);
    const permissions = useAuthStore(state => state.permissions);
    const profileLoading = useAuthStore(state => state.profileLoading);
    const profileLoaded = useAuthStore(state => state.profileLoaded);

    const isPermissionsReady = profileLoaded || (Array.isArray(permissions) && permissions.length > 0);
    const isAllowed =
        (required && can(required)) ||
        (Array.isArray(anyOf) && anyOf.length > 0 && anyOf.some(p => can(p)));

    if (profileLoading || !isPermissionsReady) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <span className="spinner-border text-primary" role="status"></span>
                    <p className="mt-3 text-muted">Loading permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAllowed) {
        return <Navigate to="/401" state={{ from: location, reason: 'forbidden' }} replace />;
    }

    return children;
};

export default PermissionRoute;


