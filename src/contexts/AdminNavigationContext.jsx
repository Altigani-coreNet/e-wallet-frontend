import React, { createContext, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveAdminPath, stripLocalePrefixForAdmin } from '../i18n/localePaths';

const AdminNavigationContext = createContext(null);

export function AdminNavigationProvider({ children }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const value = useMemo(
        () => ({
            to: (path) => resolveAdminPath(path, pathname),
            navigateAdmin: (to, opts) => {
                if (typeof to === 'number') {
                    return navigate(to);
                }
                return navigate(resolveAdminPath(to, pathname), opts);
            },
            adminPathname: stripLocalePrefixForAdmin(pathname),
        }),
        [pathname, navigate]
    );
    return (
        <AdminNavigationContext.Provider value={value}>
            {children}
        </AdminNavigationContext.Provider>
    );
}

export function useAdminNavigation() {
    const ctx = useContext(AdminNavigationContext);
    if (!ctx) {
        throw new Error('useAdminNavigation must be used within AdminNavigationProvider');
    }
    return ctx;
}
