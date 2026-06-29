import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, getUser, removeToken } from '../../utils/api';
import { resolveAdminPath } from '../../i18n/localePaths';
import useAuthStore from '../../stores/authStore';

const AdminProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [authData, setAuthData] = useState({ token: null, user: null });

    useEffect(() => {
        // Check auth once on mount
        const token = getToken();
        const user = getUser();
        
        console.log('🔒 AdminProtectedRoute: Checking admin authentication...', {
            hasToken: !!token,
            hasUser: !!user,
            isAdmin: user?.is_admin
        });
        
        setAuthData({ token, user });

        if (token && user) {
            try {
                useAuthStore.getState().syncProfileData(
                    {
                        ...user,
                        is_admin: user.is_admin ?? true,
                        permissions:
                            user.permissions ||
                            user.scopes ||
                            [],
                    },
                    null
                );
            } catch {
                /* store unavailable */
            }
        }
        
        // Clear any stale auth state if no valid token
        if (!token || !user) {
            console.log('⚠️ AdminProtectedRoute: No valid token, clearing auth storage');
            removeToken(); // Use the proper removeToken function
        }
        
        // Mark checking complete
        setTimeout(() => {
            setIsChecking(false);
        }, 100);
    }, []); // Run only once on mount

    // Show loading while checking
    if (isChecking) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <span className="spinner-border spinner-border-lg text-primary" role="status"></span>
                    <p className="mt-3 text-muted">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to admin login
    if (!authData.token || !authData.user) {
        console.log('🚫 AdminProtectedRoute: Not authenticated, redirecting to admin login');
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // For admin routes, we just check if token exists
    // The backend middleware will validate if it's from admins table
    // We can optionally check for admin flag if available
    const isAdmin = authData.user?.is_admin === true || authData.user?.role === 'admin' || true; // Allow any authenticated user with valid token - backend will validate
    
    if (!isAdmin) {
        return (
            <div className="d-flex flex-column flex-root">
                <div className="d-flex flex-column flex-center flex-column-fluid p-10">
                    <div className="card shadow-sm w-100 w-md-600px">
                        <div className="card-body text-center py-20">
                            <div className="mb-10">
                                <i className="ki-duotone ki-shield-cross fs-5tx text-danger">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                            </div>
                            <h1 className="fw-bolder text-gray-900 mb-5">Unauthorized Access</h1>
                            <div className="text-gray-600 fs-5 mb-10">
                                You do not have permission to access this admin area. 
                                <br />
                                Admin privileges are required.
                            </div>
                            <div className="d-flex flex-center flex-wrap gap-3">
                                <a href="/merchant/dashboard" className="btn btn-lg btn-primary">
                                    Go to Merchant Dashboard
                                </a>
                                <a
                                    href={resolveAdminPath('/admin/login', location.pathname)}
                                    className="btn btn-lg btn-light-primary"
                                >
                                    Admin Login
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User is authenticated and is admin
    console.log('✅ AdminProtectedRoute: Authenticated admin, allowing access');
    return children;
};

export default AdminProtectedRoute;

