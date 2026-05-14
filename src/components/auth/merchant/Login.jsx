import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuthStore from '../../../stores/authStore';
import { getStoredOrDefaultLocale, replaceLocaleInPathname } from '../../../i18n/localePaths';
import {
    validateMerchantLoginForm,
    getStaleAuthResolution,
    getAuthenticatedSessionPath,
    getPostLoginNavigation,
    getMerchantLoginErrorMessage,
} from '../../../services/merchantLoginAuthService';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import { APP_ASSETS } from '../../../assets';
import { Store, ShieldCheck, TrendingUp } from 'lucide-react';
import '../../../styles/merchantLogin.css';

const FeatureIcon = ({ icon: Icon }) => (
    <div className="ml-feature-icon">
        <Icon className="ml-feature-icon-svg" size={24} strokeWidth={1.75} aria-hidden />
    </div>
);

const MERCHANT_LOGIN_FEATURE_ITEMS = [
    {
        icon: Store,
        titleKey: 'auth.login.feature1Title',
        descKey: 'auth.login.feature1Desc',
    },
    {
        icon: ShieldCheck,
        titleKey: 'auth.login.feature2Title',
        descKey: 'auth.login.feature2Desc',
    },
    {
        icon: TrendingUp,
        titleKey: 'auth.login.feature3Title',
        descKey: 'auth.login.feature3Desc',
    },
];

const LoginMarketingFeatures = ({ variant }) => {
    const { t } = useTranslation();
    const listClass = variant === 'mobile' ? 'ml-features ml-features--mobile' : 'ml-features';
    return (
        <ul className={listClass}>
            {MERCHANT_LOGIN_FEATURE_ITEMS.map((item) => (
                <li key={item.titleKey} className="ml-feature">
                    <FeatureIcon icon={item.icon} />
                    <div>
                        <div className="ml-feature-title">{t(item.titleKey)}</div>
                        <div className="ml-feature-desc">{t(item.descKey)}</div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const LoginTrustBadge = ({ className = '' }) => {
    const { t } = useTranslation();
    return (
        <div className={['ml-trust', className].filter(Boolean).join(' ')}>
            <i className="bi bi-shield-check ml-trust-icon" aria-hidden />
            <span className="ml-trust-text">
                <strong>{t('auth.login.trustBadge')}</strong>
                {/* <br /> */}
                {t('auth.login.trustBadgeSub')}
            </span>
        </div>
    );
};

const LoginLangToggle = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const activeLang = useMemo(() => {
        const m = location.pathname.match(/^\/(en|ar)(?=\/|$)/);
        if (m) return m[1];
        return (i18n.language || 'en').split('-')[0];
    }, [location.pathname, i18n.language]);

    const switchLanguage = (lng) => {
        if (lng === activeLang) return;
        const nextPath = replaceLocaleInPathname(location.pathname, lng);
        navigate(`${nextPath}${location.search}${location.hash}`, { replace: true });
    };

    return (
        <div className="ml-lang" role="group" aria-label="Choose language">
            <button
                type="button"
                className={`ml-lang-btn${activeLang === 'en' ? ' ml-lang-btn--active' : ''}`}
                onClick={() => switchLanguage('en')}
                aria-pressed={activeLang === 'en'}
            >
                EN
            </button>
            <button
                type="button"
                className={`ml-lang-btn${activeLang === 'ar' ? ' ml-lang-btn--active' : ''}`}
                onClick={() => switchLanguage('ar')}
                aria-pressed={activeLang === 'ar'}
            >
                AR
            </button>
        </div>
    );
};

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, exchangeGoogleOAuthCode, loading, error, isAuthenticated, clearError, merchant, user } =
        useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const googleReturnHandledRef = useRef(false);
    // Blocks the isAuthenticated watcher from navigating while any explicit login
    // flow (form login or Google OAuth) is in-flight and fetchProfile hasn't yet
    // populated `merchant` in the store.
    const authFlowInProgressRef = useRef(false);

    useEffect(() => {
        if (getStaleAuthResolution(isAuthenticated) === 'clear') {
            console.log('⚠️ Clearing stale auth state - no token in localStorage');
            useAuthStore.setState({
                user: null,
                merchant: null,
                token: null,
                isAuthenticated: false,
            });
            return;
        }

        // Let the active login handler do the navigation once fetchProfile is done.
        if (authFlowInProgressRef.current) return;

        if (isAuthenticated) {
            const lng = getStoredOrDefaultLocale();
            navigate(getAuthenticatedSessionPath(merchant, lng, user), { replace: true });
        }
    }, [isAuthenticated, merchant, user, navigate]);

    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    /** Google OAuth: AuthService redirects here with `google_oauth_code` or `google_oauth_error`. */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const oauthErr = params.get('google_oauth_error');
        const oauthCode = params.get('google_oauth_code');
        if (!oauthErr && !oauthCode) {
            googleReturnHandledRef.current = false;
            return;
        }
        if (googleReturnHandledRef.current) {
            return;
        }
        googleReturnHandledRef.current = true;

        if (oauthErr) {
            const errKey =
                oauthErr === 'no_account'
                    ? 'auth.login.googleOAuthNoAccount'
                    : oauthErr === 'inactive'
                      ? 'auth.login.googleOAuthInactive'
                      : oauthErr === 'no_email'
                        ? 'auth.login.googleOAuthNoEmail'
                        : oauthErr === 'access_denied'
                          ? 'auth.login.googleOAuthDenied'
                          : oauthErr === 'server'
                            ? 'auth.login.googleOAuthServer'
                            : 'auth.login.googleOAuthGenericError';
            toast.error(t(errKey));
            navigate('/login', { replace: true });
            return;
        }

        const code = oauthCode;
        navigate('/login', { replace: true });

        (async () => {
            authFlowInProgressRef.current = true;
            try {
                const result = await exchangeGoogleOAuthCode(code);
                toast.success(t('auth.login.success'));
                const lng = getStoredOrDefaultLocale();
                const currentMerchant = useAuthStore.getState().merchant;
                const { path, replace } = getPostLoginNavigation({
                    loginResult: result,
                    currentMerchant,
                    locale: lng,
                });
                navigate(path, { replace });
            } catch (err) {
                const msg = getMerchantLoginErrorMessage(err, null, t('auth.login.googleOAuthInvalidCode'));
                toast.error(msg);
            } finally {
                authFlowInProgressRef.current = false;
            }
        })();
    }, [
        location.search,
        navigate,
        t,
        exchangeGoogleOAuthCode,
    ]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateMerchantLoginForm(formData, {
            emailRequired: t('auth.login.emailRequired'),
            emailInvalid: t('auth.login.emailInvalid'),
            passwordRequired: t('auth.login.passwordRequired'),
        });
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        authFlowInProgressRef.current = true;
        try {
            const result = await login({
                email: formData.email,
                password: formData.password,
            });

            toast.success(t('auth.login.success'));

            const lng = getStoredOrDefaultLocale();
            const currentMerchant = useAuthStore.getState().merchant;
            const { path, replace } = getPostLoginNavigation({
                loginResult: result,
                currentMerchant,
                locale: lng,
            });
            navigate(path, { replace });
        } catch (err) {
            const errorMessage = getMerchantLoginErrorMessage(err, error, t('auth.login.failed'));
            toast.error(errorMessage);
            setFormErrors({ submit: errorMessage });
        } finally {
            authFlowInProgressRef.current = false;
        }
    };

    return (
        <div className="ml-root" id="kt_app_root">
                <div className="ml-shell">
                    <aside className="ml-aside">
                        <div className="ml-aside-container">
                            <div className="ml-aside-brand">
                                <img
                                    src={APP_ASSETS.auth.merchantLogin.brandLogo}
                                    alt={t('auth.login.brandLogoAlt')}
                                    className="ml-brand-logo ml-brand-logo--aside"
                                    decoding="async"
                                />
                            </div>
                            <h1 className="ml-headline">
                                {t('auth.login.heroHeadlineBefore')}{' '}
                                <span className="ml-headline-accent">{t('auth.login.heroHeadlineAccent')}</span>
                            </h1>
                            <p className="ml-sub">{t('auth.login.heroSub')}</p>
                            <LoginMarketingFeatures variant="aside" />
                            <LoginTrustBadge />
                        </div>
                    </aside>

                    <div className="ml-main">
                        <div className="ml-desktop-lang">
                            <LoginLangToggle />
                        </div>

                        <div className="ml-mobile-logo">
                            <img
                                src={APP_ASSETS.auth.merchantLogin.brandLogo}
                                alt={t('auth.login.brandLogoAlt')}
                                className="ml-brand-logo ml-brand-logo--mobile"
                                decoding="async"
                            />
                            <LoginLangToggle />
                        </div>

                        <div className="ml-card">
                            <h2 className="ml-card-title">{t('auth.login.title')}</h2>
                            <p className="ml-card-sub">{t('auth.login.subtitle')}</p>

                            <form className="form w-100" onSubmit={handleSubmit} noValidate>
                                {formErrors.submit && <div className="ml-alert">{formErrors.submit}</div>}

                                <label className="ml-label" htmlFor="merchant-login-email">
                                    {t('auth.login.emailLabel')}
                                </label>
                                <div className={`ml-input-wrap ${formErrors.email ? 'ml-has-error' : ''}`}>
                                    <span className="ml-input-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </span>
                                    <input
                                        id="merchant-login-email"
                                        type="email"
                                        name="email"
                                        placeholder={t('auth.login.emailPlaceholder')}
                                        autoComplete="email"
                                        className="ml-field"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    {formErrors.email && <div className="ml-err">{formErrors.email}</div>}
                                </div>

                                <label className="ml-label" htmlFor="merchant-login-password">
                                    {t('auth.common.password')}
                                </label>
                                <div className={`ml-input-wrap ml-password-wrap ${formErrors.password ? 'ml-has-error' : ''}`}>
                                    <span className="ml-input-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        id="merchant-login-password"
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
                                        aria-label={showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
                                    >
                                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                    {formErrors.password && <div className="ml-err">{formErrors.password}</div>}
                                </div>

                                <div className="ml-forgot-row">
                                    <Link to="/forgot-password">{t('auth.login.forgotPassword')}</Link>
                                </div>

                                <button type="submit" className="ml-btn-primary" disabled={loading}>
                                    {loading ? (
                                        <span>
                                            {t('auth.login.signingIn')}
                                            <span className="spinner-border spinner-border-sm align-middle ms-2" role="status" />
                                        </span>
                                    ) : (
                                        t('auth.common.signIn')
                                    )}
                                </button>

                                <div className="ml-oauth-divider" role="separator" aria-label={t('auth.login.orDivider')}>
                                    <span className="ml-oauth-divider-line" aria-hidden />
                                    <span className="ml-oauth-divider-text">{t('auth.login.orDivider')}</span>
                                    <span className="ml-oauth-divider-line" aria-hidden />
                                </div>

                                <a
                                    href={AUTH_ENDPOINTS.GOOGLE_OAUTH_REDIRECT}
                                    className="ml-btn-google"
                                    draggable={false}
                                >
                                    <img
                                        src={APP_ASSETS.auth.google}
                                        alt=""
                                        className="ml-btn-google-icon"
                                        width={20}
                                        height={20}
                                        decoding="async"
                                    />
                                    <span>{t('auth.login.signInWithGoogle')}</span>
                                </a>

                                <div className="ml-footer-reg">
                                    {t('auth.login.noAccount')}
                                    <Link to="/merchant/register">{t('auth.common.registerHere')}</Link>
                                </div>
                            </form>
                        </div>

                        <div className="ml-mobile-marketing">
                            <LoginMarketingFeatures variant="mobile" />
                            <LoginTrustBadge className="ml-trust--mobile" />
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default Login;
