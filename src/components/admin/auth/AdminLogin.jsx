import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ADMIN_ENDPOINTS, APP_CONFIG } from '../../../utils/constants';
import { setToken, setUser, removeToken } from '../../../utils/api';
import useAuthStore from '../../../stores/authStore';
import { resolveAdminPath } from '../../../i18n/localePaths';
import {
    MerchantAuthPageLayout,
    ADMIN_AUTH_FEATURE_ITEMS,
} from '../../auth/merchant/merchantAuthShell';

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
        const user = localStorage.getItem(APP_CONFIG.USER_KEY);

        if (token || user) {
            console.log('⚠️ Clearing existing tokens on admin login page');
            removeToken();
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validate = () => {
        const errors = {};

        if (!formData.email) {
            errors.email = t('admin.login.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = t('admin.login.emailInvalid');
        }

        if (!formData.password) {
            errors.password = t('admin.login.passwordRequired');
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

        setLoading(true);
        setFormErrors({});

        try {
            const response = await axios.post(ADMIN_ENDPOINTS.LOGIN, {
                email: formData.email,
                password: formData.password,
            });

            const isSuccess = response.data.success === true || response.data.status === true;

            if (isSuccess) {
                const responseData = response.data.data || response.data;
                const {
                    token,
                    access_token,
                    admin,
                    user,
                    roles = [],
                    permissions = [],
                    scopes = [],
                    regions = [],
                } = responseData;

                const authToken = token || access_token;

                const adminData = admin || user || {};
                const customRegion =
                    adminData.custom_region === true || adminData.custom_regeon === true;

                const regionsList =
                    customRegion && Array.isArray(regions) && regions.length > 0
                        ? regions
                        : Array.isArray(adminData.regions)
                          ? adminData.regions
                          : [];

                const mergedUser = {
                    ...adminData,
                    roles: Array.isArray(roles) ? roles : (admin?.roles || user?.roles || []),
                    permissions:
                        Array.isArray(permissions) && permissions.length > 0
                            ? permissions
                            : Array.isArray(scopes)
                              ? scopes
                              : admin?.permissions || user?.permissions || [],
                    custom_region: customRegion,
                    custom_regeon: customRegion,
                    regions: regionsList,
                    is_admin: true,
                };

                setToken(authToken);
                setUser(mergedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

                try {
                    useAuthStore.getState().syncProfileData(mergedUser, null);
                } catch {
                    /* store unavailable */
                }

                toast.success(t('admin.login.loginSuccessful'));
                navigate(resolveAdminPath('/admin/dashboard', location.pathname));
            } else {
                throw new Error(response.data.message || t('admin.login.loginFailed'));
            }
        } catch (err) {
            console.error('Admin login error:', err);
            const errorMessage =
                err.response?.data?.message || err.message || t('admin.login.loginFailed');
            toast.error(errorMessage);
            setFormErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MerchantAuthPageLayout
            cardTitle={t('admin.login.signIn')}
            cardSub={t('admin.login.enterCredentials')}
            asideHeadlineBefore={t('admin.login.heroHeadlineBefore')}
            asideHeadlineAccent={t('admin.login.heroHeadlineAccent')}
            asideSub={t('admin.login.heroSub')}
            featureItems={ADMIN_AUTH_FEATURE_ITEMS}
            trustTitleKey="admin.login.trustBadge"
            trustSubKey="admin.login.trustBadgeSub"
        >
            <form className="form w-100" onSubmit={handleSubmit} noValidate>
                {formErrors.submit && <div className="ml-alert">{formErrors.submit}</div>}

                <label className="ml-label" htmlFor="admin-login-email">
                    {t('admin.login.emailAddress')}
                </label>
                <div className={`ml-input-wrap ${formErrors.email ? 'ml-has-error' : ''}`}>
                    <span className="ml-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </span>
                    <input
                        id="admin-login-email"
                        type="email"
                        name="email"
                        placeholder={t('admin.login.emailPlaceholder')}
                        autoComplete="email"
                        className="ml-field"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {formErrors.email && <div className="ml-err">{formErrors.email}</div>}
                </div>

                <label className="ml-label" htmlFor="admin-login-password">
                    {t('admin.login.password')}
                </label>
                <div className={`ml-input-wrap ml-password-wrap ${formErrors.password ? 'ml-has-error' : ''}`}>
                    <span className="ml-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </span>
                    <input
                        id="admin-login-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder={t('auth.common.enterPassword')}
                        autoComplete="current-password"
                        className="ml-field"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <button
                        type="button"
                        className="ml-password-toggle"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                        aria-label={
                            showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')
                        }
                    >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                    {formErrors.password && <div className="ml-err">{formErrors.password}</div>}
                </div>

                <button type="submit" className="ml-btn-primary" disabled={loading}>
                    {loading ? (
                        <span>
                            {t('admin.login.signingIn')}
                            <span className="spinner-border spinner-border-sm align-middle ms-2" role="status" />
                        </span>
                    ) : (
                        t('admin.login.signInButton')
                    )}
                </button>

                <p className="ml-footer-reg mb-0">
                    <i className="bi bi-shield-lock me-1" aria-hidden />
                    {t('admin.login.restrictedNotice')}
                </p>
            </form>
        </MerchantAuthPageLayout>
    );
};

export default AdminLogin;
