import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

import AccountDetails from './steps/AccountDetails';
import AccountVerification from './steps/AccountVerification';
import BusinessDocuments from './steps/BusinessDocuments';
import CompletionStep from './steps/CompletionStep';
import MerchantProfile from './steps/MerchantProfile';

import useMerchantRegister from '../../../hooks/useMerchantRegister';
import { APP_ASSETS } from '../../../assets';
import { replaceLocaleInPathname, pathShouldSkipLocaleRedirect } from '../../../i18n/localePaths';
import '../../../styles/MerchantRegister.css';

/* ── Shared hook: close dropdown on outside click ───────────────────── */
const useDropdown = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    return { open, setOpen, ref };
};

/* ── Language dropdown ───────────────────────────────────────────────── */
const MrLangDropdown = () => {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { open, setOpen, ref } = useDropdown();

    const activeLang = useMemo(() => {
        const m = location.pathname.match(/^\/(en|ar)(?=\/|$)/);
        if (m) return m[1];
        return (i18n.language || 'en').split('-')[0];
    }, [location.pathname, i18n.language]);

    const switchLang = (lng) => {
        setOpen(false);
        if (lng === activeLang) return;
        if (pathShouldSkipLocaleRedirect(location.pathname)) {
            void i18n.changeLanguage(lng);
            return;
        }
        const next = replaceLocaleInPathname(location.pathname, lng);
        navigate(`${next}${location.search}${location.hash}`, { replace: true });
    };

    return (
        <div className="mr-ctrl-wrap" ref={ref}>
            <button
                type="button"
                className={`mr-ctrl-btn${open ? ' mr-ctrl-btn--active' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label={t('auth.common.changeLanguage', 'Change language')}
                aria-expanded={open}
            >
                <img
                    src="/arabic.png"
                    alt=""
                    className="mr-lang-png-icon"
                    aria-hidden="true"
                    decoding="async"
                />
            </button>

            {open && (
                <div className="mr-dropdown" role="listbox" aria-label="Select language">
                    <div className="mr-dropdown-header">
                        <i className="fas fa-globe mr-dropdown-header-icon" />
                        {t('auth.common.selectLanguage', 'Select Language')}
                    </div>
                    {[
                        { code: 'en', flag: '🇺🇸', label: 'English' },
                        { code: 'ar', flag: '🇦🇪', label: 'العربية' },
                    ].map(({ code, flag, label }) => (
                        <button
                            key={code}
                            type="button"
                            role="option"
                            aria-selected={activeLang === code}
                            className={`mr-dropdown-item${activeLang === code ? ' mr-dropdown-item--active' : ''}`}
                            onClick={() => switchLang(code)}
                        >
                            <span className="mr-dropdown-item-flag">{flag}</span>
                            <span>{label}</span>
                            {activeLang === code && <i className="fas fa-check mr-dropdown-item-check" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Support dropdown ────────────────────────────────────────────────── */
const SUPPORT_SUBJECTS = [
    { icon: 'fa-envelope-open',  labelKey: 'supportNotReceivingEmail',  label: "I'm not receiving emails"     },
    { icon: 'fa-ban',            labelKey: 'supportEmailTaken',         label: 'My email is already taken'    },
    { icon: 'fa-mobile-alt',     labelKey: 'supportPhoneVerification',  label: 'Phone verification not working'},
    { icon: 'fa-user-lock',      labelKey: 'supportAccountLocked',      label: 'My account is locked'         },
    { icon: 'fa-question-circle',labelKey: 'supportOther',              label: 'Other issue'                  },
];

const MrSupportDropdown = () => {
    const { t } = useTranslation();
    const { open, setOpen, ref } = useDropdown();

    const handleSubject = (subject) => {
        setOpen(false);
        window.open(
            `mailto:support@fastpay.com?subject=${encodeURIComponent(subject)}`,
            '_blank'
        );
    };

    return (
        <div className="mr-ctrl-wrap" ref={ref}>
            <button
                type="button"
                className={`mr-ctrl-btn${open ? ' mr-ctrl-btn--active' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label={t('auth.common.support', 'Support')}
                aria-expanded={open}
            >
                <i className="fas fa-headset" />
            </button>

            {open && (
                <div className="mr-dropdown mr-dropdown--right" role="menu">
                    <div className="mr-dropdown-header">
                        <i className="fas fa-headset mr-dropdown-header-icon" />
                        {t('auth.common.howCanWeHelp', 'How can we help?')}
                    </div>
                    {SUPPORT_SUBJECTS.map(({ icon, labelKey, label }) => (
                        <button
                            key={labelKey}
                            type="button"
                            role="menuitem"
                            className="mr-dropdown-item"
                            onClick={() => handleSubject(label)}
                        >
                            <i className={`fas ${icon} mr-dropdown-item-icon`} />
                            <span>{t(`auth.support.${labelKey}`, label)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Combined header controls ────────────────────────────────────────── */
const MrHeaderControls = () => (
    <div className="mr-header-controls">
        <MrLangDropdown />
        <MrSupportDropdown />
    </div>
);

const MerchantRegister = () => {
    const { t } = useTranslation();

    const {
        steps,
        currentStep,
        setCurrentStep,
        formData,
        fieldErrors,
        isLoading,
        showContinueModal,
        savedProgressData,
        accountVerificationPreviousRef,
        handleNext,
        handlePrevious,
        handleFieldChange,
        handleContinueRegistration,
        handleStartNew,
        saveProgress,
    } = useMerchantRegister();

    const [progressOpen, setProgressOpen] = useState(false);

    const commonProps = { formData, setFormData: handleFieldChange, fieldErrors };
    // step 1 (verification) gets a narrow centred container; all others get wide
    const stepCardClass = currentStep === 1
        ? 'mr-step-card mr-step-card--narrow'
        : 'mr-step-card mr-step-card--wide';

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <AccountDetails {...commonProps} />;
            case 1:
                return (
                    <AccountVerification
                    {...commonProps}
                    variant="merchant"
                    onNextStep={() => {
                            const nextStep = currentStep + 1;
                        setCurrentStep(nextStep);
                            setTimeout(() => saveProgress(nextStep, formData), 100);
                    }}
                    onPreviousRef={accountVerificationPreviousRef}
                        onPreviousToStep0={() => setCurrentStep(0)}
                    onStartNewRegistration={handleStartNew}
                    />
                );
            case 2:
                return <MerchantProfile {...commonProps} />;
            case 3:
                return <BusinessDocuments {...commonProps} />;
            case 4:
                return <CompletionStep onRegisterAnother={handleStartNew} />;
            default:
                return null;
        }
    };

    const isLastStep = currentStep >= steps.length - 1;
    
    return (
        <>
            {/* ── Continue-registration modal ── */}
            {showContinueModal && savedProgressData && (
                <div className="modal fade show mr-modal-overlay" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {t('auth.registration.continueModalTitle')}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleStartNew}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <i
                                        className="fas fa-info-circle text-primary"
                                        style={{ fontSize: '3rem' }}
                                    />
                                </div>
                                <p className="text-center mb-3">
                                    {t('auth.registration.continueModalFoundPrefix')}{' '}
                                    <strong>
                                        {steps[savedProgressData.currentStep]?.title ||
                                            t('auth.registration.stepFallback', {
                                                n: savedProgressData.currentStep + 1,
                                            })}
                                    </strong>
                                    .
                                </p>
                                <p className="text-center text-muted">
                                    {t('auth.registration.continueModalQuestion')}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleStartNew}
                                >
                                    {t('auth.registration.startNewRegistration')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleContinueRegistration}
                                >
                                    {t('auth.registration.continueRegistration')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page ── */}
            <div className="mr-root">

                {/* ── Mobile top bar (hidden on desktop) ── */}
                <header className="mr-mobile-topbar">
                    <button
                        type="button"
                        className="mr-mobile-menu-btn"
                        aria-label="Show progress"
                        onClick={() => setProgressOpen(true)}
                    >
                        <i className="fas fa-bars" />
                    </button>

                    <div className="mr-mobile-topbar-center">
                        <img
                            src={APP_ASSETS.auth.merchantLogin.brandLogo}
                            alt="Brand logo"
                            className="mr-mobile-logo"
                            decoding="async"
                        />
                    </div>

                    <span className="mr-mobile-step-count">
                        {currentStep + 1}&nbsp;/&nbsp;{steps.length}
                    </span>
                </header>

                {/* ── Mobile horizontal stepper (hidden on desktop) ── */}
                <div className="mr-mobile-hstepper" aria-label="Registration steps">
                    {steps.map((step, index) => {
                        const isActive    = currentStep === index;
                        const isCompleted = currentStep > index;
                        return (
                            <React.Fragment key={index}>
                                <div className={`mr-mhs-item${isActive ? ' mr-mhs-item--active' : isCompleted ? ' mr-mhs-item--completed' : ''}`}>
                                    <div className="mr-mhs-badge">
                                        {isCompleted ? <i className="fas fa-check" /> : index + 1}
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`mr-mhs-line${isCompleted ? ' mr-mhs-line--done' : ''}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="mr-shell">

                    {/* ── Left sidebar card (desktop only) ── */}
                    <aside className="mr-sidebar">
                        <div className="mr-sidebar-logo">
                            <img
                                src={APP_ASSETS.auth.merchantLogin.brandLogo}
                                alt="Brand logo"
                                decoding="async"
                            />
                            <MrHeaderControls />
                        </div>

                        <nav className="mr-stepper" aria-label="Registration steps">
                            {steps.map((step, index) => {
                                const isActive    = currentStep === index;
                                const isCompleted = currentStep > index;
                                const stepClass   = isActive
                                    ? 'mr-step mr-step--active'
                                    : isCompleted
                                        ? 'mr-step mr-step--completed'
                                        : 'mr-step mr-step--pending';
                                return (
                                    <div key={index} className={stepClass}>
                                        <div className="mr-step-col">
                                            <div className="mr-step-badge">
                                                {isCompleted ? <i className="fas fa-check" /> : index + 1}
                                            </div>
                                        </div>
                                        <div className="mr-step-info">
                                            <p className="mr-step-title">{step.title}</p>
                                            <p className="mr-step-desc">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="mr-security">
                            <div className="mr-security-icon">
                                <i className="fas fa-shield-alt" />
                            </div>
                            <div>
                                <p className="mr-security-title">{t('auth.registration.securityTitle')}</p>
                                <p className="mr-security-desc">{t('auth.registration.securityDesc')}</p>
                            </div>
                        </div>
                    </aside>

                    {/* ── Right form card ── */}
                    <main className="mr-main">
                        <div className="mr-card">
                            <div className="mr-card-body">
                                <div className={stepCardClass}>
                                    <form noValidate>
                                        {renderStepContent()}
                                    </form>
                                </div>
                            </div>

                            {!isLastStep && (
                                <footer className="mr-card-footer">
                                    {/* LEFT */}
                                    <div>
                                        {currentStep === 0 ? (
                                            <div className="mr-footer-progress">
                                                <i className="fas fa-lock" />
                                                <span>{t('auth.registration.progressSaved')}</span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-light btn-sm"
                                                disabled={currentStep <= 2}
                                                onClick={handlePrevious}
                                            >
                                                <i className="fas fa-arrow-left me-2" />
                                                {t('auth.common.previous')}
                                            </button>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            disabled={currentStep === 1 || isLoading}
                                            onClick={handleNext}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                                    {t('auth.common.loadingEllipsis')}
                                                </>
                                            ) : (
                                                <>
                                                    {t('auth.common.next')}
                                                    <i className="fas fa-arrow-right ms-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </footer>
                            )}
                        </div>
                    </main>

                </div>

                {/* ── Progress drawer (inside mr-root so CSS vars cascade) ── */}
                {progressOpen && (
                    <div
                        className="mr-progress-backdrop"
                        onClick={() => setProgressOpen(false)}
                        aria-hidden="true"
                    />
                )}
                <aside className={`mr-progress-drawer${progressOpen ? ' mr-progress-drawer--open' : ''}`}>
                    <div className="mr-progress-drawer-header">
                        <img
                            src={APP_ASSETS.auth.merchantLogin.brandLogo}
                            alt="Brand logo"
                            className="mr-progress-drawer-logo"
                            decoding="async"
                        />
                        <div className="mr-progress-drawer-header-actions">
                            <MrHeaderControls />
                            <button
                                type="button"
                                className="mr-progress-drawer-close"
                                aria-label="Close"
                                onClick={() => setProgressOpen(false)}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    </div>

                    <p className="mr-progress-drawer-label">
                        {t('auth.registration.yourProgress', 'Your Progress')}
                    </p>

                    <nav className="mr-stepper mr-progress-drawer-stepper">
                        {steps.map((step, index) => {
                            const isActive    = currentStep === index;
                            const isCompleted = currentStep > index;
                            const stepClass   = isActive
                                ? 'mr-step mr-step--active'
                                : isCompleted
                                    ? 'mr-step mr-step--completed'
                                    : 'mr-step mr-step--pending';
                            return (
                                <div key={index} className={stepClass}>
                                    <div className="mr-step-col">
                                        <div className="mr-step-badge">
                                            {isCompleted ? <i className="fas fa-check" /> : index + 1}
                                        </div>
                                    </div>
                                    <div className="mr-step-info">
                                        <p className="mr-step-title">{step.title}</p>
                                        <p className="mr-step-desc">{step.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mr-security">
                        <div className="mr-security-icon">
                            <i className="fas fa-shield-alt" />
                        </div>
                        <div>
                            <p className="mr-security-title">{t('auth.registration.securityTitle')}</p>
                            <p className="mr-security-desc">{t('auth.registration.securityDesc')}</p>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default MerchantRegister;
