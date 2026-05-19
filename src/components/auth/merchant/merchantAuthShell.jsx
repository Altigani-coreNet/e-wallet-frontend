import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { replaceLocaleInPathname, pathShouldSkipLocaleRedirect } from '../../../i18n/localePaths';
import { APP_ASSETS } from '../../../assets';
import { Store, ShieldCheck, TrendingUp } from 'lucide-react';
import '../../../styles/merchantLogin.css';

const FeatureIcon = ({ icon: Icon }) => (
    <div className="ml-feature-icon">
        <Icon className="ml-feature-icon-svg" size={24} strokeWidth={1.75} aria-hidden />
    </div>
);

const MERCHANT_AUTH_FEATURE_ITEMS = [
    { icon: Store, titleKey: 'auth.login.feature1Title', descKey: 'auth.login.feature1Desc' },
    { icon: ShieldCheck, titleKey: 'auth.login.feature2Title', descKey: 'auth.login.feature2Desc' },
    { icon: TrendingUp, titleKey: 'auth.login.feature3Title', descKey: 'auth.login.feature3Desc' },
];

export function MerchantAuthMarketingFeatures({ variant }) {
    const { t } = useTranslation();
    const listClass = variant === 'mobile' ? 'ml-features ml-features--mobile' : 'ml-features';
    return (
        <ul className={listClass}>
            {MERCHANT_AUTH_FEATURE_ITEMS.map((item) => (
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
}

export function MerchantAuthTrustBadge({ className = '' }) {
    const { t } = useTranslation();
    return (
        <div className={['ml-trust', className].filter(Boolean).join(' ')}>
            <i className="bi bi-shield-check ml-trust-icon" aria-hidden />
            <span className="ml-trust-text">
                <strong>{t('auth.login.trustBadge')}</strong>{' '}
                {t('auth.login.trustBadgeSub')}
            </span>
        </div>
    );
}

/** Mobile footer tip pill — matches login trust / marketing footer placement. */
export function MerchantAuthMobileTip({ title, body, iconClass = 'bi-lightbulb' }) {
    if (!body) return null;
    return (
        <div className="ml-mobile-tip" role="note">
            <i className={`bi ${iconClass} ml-mobile-tip-icon`} aria-hidden />
            <span className="ml-mobile-tip-text">
                {title ? <strong className="ml-mobile-tip-title">{title}</strong> : null}
                {body}
            </span>
        </div>
    );
}

const FORGOT_PASSWORD_MOBILE_TIP_IDS = {
    request: ['checkSpam', 'registeredEmail', 'codeExpiry'],
    verify: ['sixDigits', 'waitInbox', 'resendTimer'],
    reset: ['uniquePassword', 'mixChars', 'keepPrivate'],
    done: ['signInNew', 'updateBrowser', 'needHelp'],
};

/** Picks a random forgot-password tip for the current step. */
export function pickForgotPasswordMobileTip(step, t) {
    const pool = FORGOT_PASSWORD_MOBILE_TIP_IDS[step] || FORGOT_PASSWORD_MOBILE_TIP_IDS.request;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const base = `auth.forgotPassword.mobileTips.${id}`;
    return {
        title: t(`${base}.title`),
        body: t(`${base}.body`),
        iconClass: t(`${base}.icon`, { defaultValue: 'bi-lightbulb' }),
    };
}

export function MerchantAuthLangToggle() {
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
        /* Login, forgot-password, reset link, etc. live outside `/:lang/*`. Prefixing would hit
         * `/:lang/*` → splat → merchant redirect. Only change i18n; keep the same URL. */
        if (pathShouldSkipLocaleRedirect(location.pathname)) {
            void i18n.changeLanguage(lng);
            return;
        }
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
}

/**
 * Shared merchant auth frame (aside + main + card). Each route can set its own
 * left-column copy and toggle feature list / trust / mobile marketing blocks.
 */
export function MerchantAuthPageLayout({
    children,
    cardTitle = null,
    cardSub = null,
    /** `undefined` = use login defaults; `null` = hide that line */
    asideHeadlineBefore,
    asideHeadlineAccent,
    asideSub,
    brandLogoAltKey = 'auth.login.brandLogoAlt',
    showAsideFeatures = true,
    showAsideTrust = true,
    showMobileMarketing = true,
    /** Custom mobile footer (e.g. forgot-password tips). Shown when set, even if showMobileMarketing is false. */
    mobileFooter = null,
}) {
    const { t } = useTranslation();

    const hb = asideHeadlineBefore !== undefined ? asideHeadlineBefore : t('auth.login.heroHeadlineBefore');
    const ha = asideHeadlineAccent !== undefined ? asideHeadlineAccent : t('auth.login.heroHeadlineAccent');
    const subResolved =
        asideSub === undefined ? t('auth.login.heroSub') : asideSub;
    const showAsideSub = asideSub !== null;

    return (
        <div className="ml-root" id="kt_app_root">
            <div className="ml-shell">
                <aside className="ml-aside">
                    <div className="ml-aside-container">
                        <div className="ml-aside-brand">
                            <img
                                src={APP_ASSETS.auth.merchantLogin.brandLogo}
                                alt={t(brandLogoAltKey)}
                                className="ml-brand-logo ml-brand-logo--aside"
                                decoding="async"
                            />
                            <MerchantAuthLangToggle />
                        </div>
                        <h1 className="ml-headline">
                            {hb}
                            {ha != null && String(ha).length > 0 ? (
                                <>
                                    {' '}
                                    <span className="ml-headline-accent">{ha}</span>
                                </>
                            ) : null}
                        </h1>
                        {showAsideSub ? <p className="ml-sub">{subResolved}</p> : null}
                        {showAsideFeatures ? <MerchantAuthMarketingFeatures variant="aside" /> : null}
                        {showAsideTrust ? <MerchantAuthTrustBadge /> : null}
                    </div>
                </aside>

                <div className="ml-main">
                    <div className="ml-mobile-logo">
                        <img
                            src={APP_ASSETS.auth.merchantLogin.brandLogo}
                            alt={t(brandLogoAltKey)}
                            className="ml-brand-logo ml-brand-logo--mobile"
                            decoding="async"
                        />
                        <MerchantAuthLangToggle />
                    </div>

                    <div className="ml-card">
                        {cardTitle != null && cardTitle !== '' ? <h2 className="ml-card-title">{cardTitle}</h2> : null}
                        {cardSub != null ? <p className="ml-card-sub">{cardSub}</p> : null}
                        {children}
                    </div>

                    {showMobileMarketing || mobileFooter != null ? (
                        <div className="ml-mobile-marketing">
                            {mobileFooter != null ? (
                                mobileFooter
                            ) : (
                                <>
                                    <MerchantAuthMarketingFeatures variant="mobile" />
                                    <MerchantAuthTrustBadge className="ml-trust--mobile" />
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
