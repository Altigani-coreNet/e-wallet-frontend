import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuthStore from '../../../stores/authStore';
import { buildPrefixedPath, getStoredOrDefaultLocale } from '../../../i18n/localePaths';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, loading, error, isAuthenticated, clearError, merchant } = useAuthStore();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    // Clear stale tokens on mount and redirect if already authenticated (but verify token exists)
    useEffect(() => {
        const token = localStorage.getItem('corenet_token');
        
        // If store says authenticated but no token in localStorage, clear the store
        if (isAuthenticated && !token) {
            console.log('⚠️ Clearing stale auth state - no token in localStorage');
            useAuthStore.setState({
                user: null,
                merchant: null,
                token: null,
                isAuthenticated: false,
            });
            return;
        }
        
        // Only redirect if truly authenticated with valid token
        if (isAuthenticated && token) {
            const status = merchant?.status ? String(merchant.status).toLowerCase() : null;
            const lng = getStoredOrDefaultLocale();
            const targetRoute =
                status === 'approved'
                    ? buildPrefixedPath('/merchant/dashboard', lng)
                    : buildPrefixedPath('/merchant/profile', lng);
            navigate(targetRoute, { replace: true });
        }
    }, [isAuthenticated, merchant, navigate]);

    // Clear error when component unmounts
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear field error when user types
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validate = () => {
        const errors = {};
        
        if (!formData.email) {
            errors.email = t('auth.login.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = t('auth.login.emailInvalid');
        }
        
        if (!formData.password) {
            errors.password = t('auth.login.passwordRequired');
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const result = await login({
                email: formData.email,
                password: formData.password,
            });
            
            toast.success(t('auth.login.success'));

            const lng = getStoredOrDefaultLocale();

            // Check if user needs to complete merchant registration
            if (result?.needsMerchantRegistration) {
                navigate('/merchant/register?step=2', { replace: true });
                return;
            }
            
            const merchantFromResponse = result?.merchant || result?.user?.merchant || merchant;
            const status = merchantFromResponse?.status ? String(merchantFromResponse.status).toLowerCase() : null;

            // If merchant is not approved, always go to profile
            if (status !== 'approved') {
                navigate(buildPrefixedPath('/merchant/profile', lng), { replace: true });
                return;
            }

            // Decide default module based on plan scopes (POS vs Cashier)
            const merchantScopes = Array.isArray(merchantFromResponse?.scopes) ? merchantFromResponse.scopes : [];
            const hasSoftPosScope = merchantScopes.includes('softpos');
            const hasCashierScope = merchantScopes.includes('cashier');

            const planScopes = Array.isArray(merchantFromResponse?.plan?.plan_scopes)
                ? merchantFromResponse.plan.plan_scopes
                : [];
            const posScopeTypes = ['users', 'branches', 'terminals', 'transactions', 'batches', 'settlements', 'payment_links'];
            const salesScopeTypes = ['categories', 'products', 'customers', 'suppliers', 'purchases', 'sales'];

            const posScopes = planScopes.filter(
                (scope) => scope.module === 'pos' && posScopeTypes.includes(scope.scope_type)
            );
            const salesScopes = planScopes.filter(
                (scope) => scope.module === 'cashier' && salesScopeTypes.includes(scope.scope_type)
            );

            const hasAnyPosScopesEnabled =
                planScopes.length === 0
                    ? hasSoftPosScope
                    : posScopes.length > 0 && posScopes.some((scope) => scope.is_enabled === true);

            const hasAnySalesScopesEnabled =
                planScopes.length === 0
                    ? hasCashierScope
                    : salesScopes.length > 0 && salesScopes.some((scope) => scope.is_enabled === true);

            if (hasAnyPosScopesEnabled) {
                navigate(buildPrefixedPath('/merchant/dashboard', lng), { replace: true });
            } else if (hasAnySalesScopesEnabled) {
                navigate(buildPrefixedPath('/sales/dashboard', lng), { replace: true });
            } else {
                navigate(buildPrefixedPath('/merchant/profile', lng), { replace: true });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || error || t('auth.login.failed');
            toast.error(errorMessage);
            setFormErrors({ submit: errorMessage });
        }
    };

    return (
        <>
            {/* Page background image - using shared login background */}
            <style>{`
                body {
                    background-image: url('/login_background.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                }
                [data-bs-theme="dark"] body {
                    background-image: url('/login_background.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                }
                .login-hero-wrap {
                    width: 100%;
                }
                @media (min-width: 992px) {
                    .login-hero-wrap {
                        justify-content: flex-end;
                        align-items: center;
                    }
                }
                .login-hero-art {
                    width: min(100%, 600px);
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: 0;
                }
                @media (min-width: 992px) {
                    .login-hero-art {
                        width: 600px;
                        min-width: 600px;
                    }
                }
            `}</style>
            
            <div className="d-flex flex-column flex-root" id="kt_app_root" style={{ minHeight: '100vh' }}>
                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '100vh' }}>
                    {/* Left: hero illustration — only from lg up */}
                    <div
                        className="login-hero-wrap d-none d-lg-flex px-6 px-lg-8 pe-lg-6 py-10 py-lg-0"
                        style={{ flex: '1.6 1 0%', minWidth: 0, minHeight: '100vh' }}
                    >
                        <div className="login-hero-art">
                            <img
                                src="/login_image.png"
                                alt=""
                                className="w-100 d-block"
                                style={{ height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    </div>

                    {/* Right: login form (full width on small screens) */}
                    <div className="d-flex justify-content-center align-items-center p-12" style={{ flex: '1 1 0%', minWidth: 0, minHeight: '100vh' }}>
                    <div className="bg-body d-flex flex-column flex-center rounded-4 w-md-600px py-15 px-10">
                        <div className="d-flex flex-center flex-column align-items-stretch w-md-400px">
                            <div className="d-flex flex-center flex-column flex-column-fluid py-10">
                                
                                <form className="form w-100" onSubmit={handleSubmit}>
                                    <div className="text-center mb-13">
                                        <h1 className="text-dark fw-bolder mb-3">{t('auth.login.title')}</h1>
                                        <div className="text-gray-500 fw-semibold fs-6">{t('auth.login.subtitle')}</div>
                                    </div>

                                    {/* Error Messages */}
                                    {formErrors.submit && (
                                        <div className="alert alert-danger">
                                            {formErrors.submit}
                                        </div>
                                    )}

                                    {/* Email Field */}
                                    <div className="fv-row mb-10">
                                        <input
                                            type="text"
                                            name="email"
                                            placeholder={t('auth.login.emailPlaceholder')}
                                            autoComplete="off"
                                            className={`form-control bg-transparent ${formErrors.email ? 'is-invalid' : ''}`}
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        {formErrors.email && (
                                            <div className="invalid-feedback">{formErrors.email}</div>
                                        )}
                                    </div>

                                    {/* Password Field */}
                                    <div className="fv-row mb-8 position-relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder={t('auth.login.passwordPlaceholder')}
                                            className={`form-control bg-transparent ${formErrors.password ? 'is-invalid' : ''}`}
                                            style={{ paddingRight: '3rem' }}
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-sm position-absolute top-50 end-0 translate-middle-y me-2"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                        {formErrors.password && (
                                            <div className="invalid-feedback">{formErrors.password}</div>
                                        )}
                                    </div>

                                    {/* Forgot Password Link */}
                                    <div className="d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-10">
                                        <div></div>
                                        <Link to="/forgot-password" className="link-primary">
                                            {t('auth.login.forgotPassword')}
                                        </Link>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="d-grid mb-10">
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            <span className={loading ? 'd-none' : 'indicator-label'}>{t('auth.common.signIn')}</span>
                                            {loading && (
                                                <span className="indicator-progress" style={{ display: 'block' }}>
                                                    {t('auth.login.signingIn')}
                                                    <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Register Link */}
                                    <div className="text-center">
                                        <span className="text-gray-500 fs-6">{t('auth.login.noAccount')}</span>
                                        <Link to="/merchant/register" className="link-primary fw-semibold fs-6 ms-1">
                                            {t('auth.common.registerHere')}
                                        </Link>
                                    </div>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default Login;

