import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { replaceLocaleInPathname } from '../../i18n/localePaths';
import './PaymentLinkRedirect.css';

const IconShield = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconLock = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const IconArrowLeft = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

/** Same FastPay header as the payment checkout page. Optional back control sits next to the logo. */
export const PaymentCheckoutHeader = ({ onBack }) => {
    const { t, i18n } = useTranslation();
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
        <header className="pl-header">
            <div className="pl-header-inner">
                <div className="pl-header-start">
                    {typeof onBack === 'function' ? (
                        <button type="button" className="pl-header-back" onClick={onBack} aria-label={t('paymentCheckout.header.backAria')}>
                            <IconArrowLeft size={18} />
                        </button>
                    ) : null}
                    <div className="pl-header-logo">
                        <img src="/faspay_logo_1.png" alt={t('paymentCheckout.header.logoAlt')} className="pl-logo-img" />
                    </div>
                </div>
                <div className="pl-header-actions">
                    <div className="pl-header-secure">
                        <IconShield size={15} />
                        <span>{t('paymentCheckout.header.securePayment')}</span>
                    </div>
                    <div className="pl-header-lang" role="group" aria-label={t('paymentCheckout.header.chooseLanguage')}>
                        <button
                            type="button"
                            className={`pl-header-lang-btn${activeLang === 'en' ? ' pl-header-lang-btn--active' : ''}`}
                            onClick={() => switchLanguage('en')}
                            aria-pressed={activeLang === 'en'}
                            aria-label={t('paymentCheckout.header.langEnglishAria')}
                        >
                            {t('paymentCheckout.header.langEnShort')}
                        </button>
                        <button
                            type="button"
                            className={`pl-header-lang-btn${activeLang === 'ar' ? ' pl-header-lang-btn--active' : ''}`}
                            onClick={() => switchLanguage('ar')}
                            aria-pressed={activeLang === 'ar'}
                            aria-label={t('paymentCheckout.header.langArabicAria')}
                        >
                            {t('paymentCheckout.header.langArShort')}
                        </button>
                    </div>
                </div>
            </div>
            <div className="pl-header-blob" aria-hidden="true" />
        </header>
    );
};

/** Same footer as the payment checkout page — wide: cancel | powered-by | domain; ≤640px: cancel hidden (see CSS), powered + domain only. */
export const PaymentCheckoutFooter = ({ onCancel }) => {
    const { t } = useTranslation();
    return (
        <footer className="pl-footer">
            <button
                type="button"
                className="pl-cancel-btn pl-footer-cancel"
                onClick={onCancel || (() => window.history.back())}
            >
                <IconArrowLeft size={15} />
                {t('paymentCheckout.footer.cancelReturn')}
            </button>
            <div className="pl-footer-powered">
                <span className="pl-footer-powered-label">{t('paymentCheckout.footer.poweredBy')}</span>
                <span className="pl-footer-powered-brand">{t('paymentCheckout.footer.brand')}</span>
            </div>
            <div className="pl-footer-domain">
                <IconLock size={13} />
                {t('paymentCheckout.footer.domainHost')}
            </div>
        </footer>
    );
};
