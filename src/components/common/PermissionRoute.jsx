import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { getToken, getUser } from '../../utils/api';

const resolveEffectivePermissions = (storePermissions, storedUser) => {
    if (Array.isArray(storePermissions) && storePermissions.length > 0) {
        return storePermissions;
    }
    if (Array.isArray(storedUser?.permissions) && storedUser.permissions.length > 0) {
        return storedUser.permissions;
    }
    if (Array.isArray(storedUser?.scopes) && storedUser.scopes.length > 0) {
        return storedUser.scopes;
    }
    return [];
};

const matchesPermission = (permission, effectivePermissions, can) => {
    if (!permission) return false;
    if (typeof can === 'function' && can(permission)) return true;
    if (!Array.isArray(effectivePermissions) || effectivePermissions.length === 0) return false;
    if (effectivePermissions.includes(permission)) return true;

    const lastDot = permission.lastIndexOf('.');
    if (lastDot > 0) {
        const namespaceBase = permission.substring(0, lastDot);
        if (effectivePermissions.includes(namespaceBase)) return true;
    }

    return false;
};

const PermissionRoute = ({ required = null, anyOf = [], children }) => {
    const location = useLocation();
    const can = useAuthStore(state => state.can);
    const permissions = useAuthStore(state => state.permissions);
    const profileLoading = useAuthStore(state => state.profileLoading);
    const profileLoaded = useAuthStore(state => state.profileLoaded);
    const storedUser = getUser();
    const token = getToken();

    const effectivePermissions = useMemo(
        () => resolveEffectivePermissions(permissions, storedUser),
        [permissions, storedUser]
    );

    const isPermissionsReady =
        profileLoaded ||
        effectivePermissions.length > 0 ||
        Boolean(token && storedUser);

    const isAllowed =
        (required && matchesPermission(required, effectivePermissions, can)) ||
        (Array.isArray(anyOf) && anyOf.length > 0 && anyOf.some((p) => matchesPermission(p, effectivePermissions, can)));

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


