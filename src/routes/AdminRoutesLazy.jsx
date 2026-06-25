import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayoutOutlet, ADMIN_NESTED_ROUTES } from './AdminRoutes';

/**
 * Lazy-loadable admin route tree — importing this module pulls in all admin pages
 * as a separate chunk instead of the main bundle.
 */
export default function AdminRoutesLazy() {
    return (
        <Routes>
            <Route element={<AdminLayoutOutlet />}>
                {ADMIN_NESTED_ROUTES}
            </Route>
        </Routes>
    );
}
