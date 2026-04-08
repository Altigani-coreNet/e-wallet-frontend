import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { getToken, getUser } from '../../utils/api';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, initialize } = useAuthStore();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Initialize auth state from localStorage on mount ONCE
        const token = getToken();
        const user = getUser();
        
        console.log('🔒 ProtectedRoute: Checking authentication...', {
            hasToken: !!token,
            hasUser: !!user,
            isAuthenticated
        });
        
        // If we have token and user in localStorage, initialize the store
        if (token && user) {
            initialize();
        }
        
        // Mark checking as complete after a brief moment to let store update
        setTimeout(() => {
            setIsChecking(false);
        }, 100);
    }, []); // Run only once on mount

    // Show nothing while checking (prevents flash of login page)
    if (isChecking) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <span className="spinner-border spinner-border-lg text-primary" role="status"></span>
                    <p className="mt-3 text-muted">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // After checking, verify we have both token and user
    const token = getToken();
    const user = getUser();
    const hasValidAuth = !!(token && user && isAuthenticated);

    if (!hasValidAuth) {
        console.log('🚫 ProtectedRoute: Not authenticated, redirecting to login');
        // Redirect to login page but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('✅ ProtectedRoute: Authenticated, allowing access');
    return children;
};

export default ProtectedRoute;

