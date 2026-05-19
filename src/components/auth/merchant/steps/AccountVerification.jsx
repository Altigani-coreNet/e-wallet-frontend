import React from 'react';
import { useTranslation } from 'react-i18next';
import VerificationInput from '../../../common/VerificationInput';
import useAccountVerification from '../../../../hooks/useAccountVerification';
import '../../../../styles/AccountVerification.css';

const AccountVerification = (props) => {
    const { t } = useTranslation();
    const {
        regKey,
        isVerifying, isResending, isResendDisabled, isRegistering,
        resendTimer, accountCreated, userData,
        verificationMethod, verificationStep,
        showPassword, setShowPassword,
        showPasswordConfirmation, setShowPasswordConfirmation,
        passwordData, passwordValidation,
        isSelectingMethod,
        verificationInputRef,
        getMaskedValue, maskEmail, maskPhone,
        isPasswordStrong, isConfirmationValid,
        getPasswordInputClass, getPasswordConfirmationClass,
        setVerificationMethod, setVerificationStep,
        handlePasswordChange,
        handleVerificationComplete,
        handleGoBackToSelection,
        handleRegisterUser,
        sendVerificationCode,
        resetVerificationInputs,
        onNextStep,
    } = useAccountVerification(props);

    const { formData } = props;

    // ── Method selection screen ─────────────────────────────────────────
    if (isSelectingMethod) {
        return (
            <div className="av-root">
                <div className="av-header">
                    <h2 className="av-title">{t('auth.accountVerification.step2Title')}</h2>
                    <p className="av-subtitle">{t('auth.accountVerification.selectionSubtitle')}</p>
                </div>

                <div className="av-illustration-wrap">
                    <img
                        alt={t('auth.common.verificationAlt')}
                        className="av-illustration"
                        src="/assets/media/svg/misc/smartphone.svg"
                    />
                </div>

                <div>
                    <span className="av-method-label">
                        {t('auth.accountVerification.selectMethodLabel')}
                    </span>

                    <input type="radio" className="btn-check" name="verificationMethod"
                        value="email" checked={verificationMethod === 'email'}
                        onChange={(e) => setVerificationMethod(e.target.value)}
                        id="verificationEmail"
                    />
                    <label className="av-option-card" htmlFor="verificationEmail">
                        <div className="av-option-icon-wrap">
                            <i className="fas fa-envelope" />
                        </div>
                        <div className="av-option-text">
                            <p className="av-option-title">{t('auth.accountVerification.emailOptionTitle')}</p>
                            <p className="av-option-hint">
                                {t('auth.accountVerification.emailOptionHint', { value: maskEmail(formData.email) })}
                            </p>
                        </div>
                    </label>

                    <input type="radio" className="btn-check" name="verificationMethod"
                        value="phone" checked={verificationMethod === 'phone'}
                        onChange={(e) => setVerificationMethod(e.target.value)}
                        id="verificationPhone"
                    />
                    <label className="av-option-card" htmlFor="verificationPhone">
                        <div className="av-option-icon-wrap">
                            <i className="fas fa-phone" />
                        </div>
                        <div className="av-option-text">
                            <p className="av-option-title">{t('auth.accountVerification.phoneOptionTitle')}</p>
                            <p className="av-option-hint">
                                {t('auth.accountVerification.phoneOptionHint', { value: maskPhone(formData.phone) })}
                            </p>
                        </div>
                    </label>

                    <button
                        type="button"
                        className="av-continue-btn"
                        disabled={!verificationMethod || isResending}
                        onClick={() => { if (verificationMethod) setVerificationStep(verificationMethod); }}
                    >
                        {isResending ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                {t('auth.accountVerification.sendingCode')}
                            </>
                        ) : (
                            <>
                                {verificationMethod === 'email'
                                    ? t('auth.accountVerification.continueWithEmail')
                                    : verificationMethod === 'phone'
                                        ? t('auth.accountVerification.continueWithPhone')
                                        : t('auth.accountVerification.selectMethodLabel')}
                                <i className="fas fa-arrow-right" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ── Account created ─────────────────────────────────────────────────
    if (accountCreated) {
        return (
            <div className="av-root">
                <div className="av-header">
                    <h2 className="av-title">{t('auth.accountVerification.accountCreatedTitle')}</h2>
                    <p className="av-subtitle">{t(`auth.accountVerification.${regKey}.accountCreatedSubtitle`)}</p>
                </div>

                <div className="av-illustration-wrap">
                    <img alt={t('auth.common.successAlt')} className="av-illustration"
                         src="/assets/media/svg/misc/smartphone.svg" />
                </div>

                <div className="alert alert-success mb-5">
                    <div className="d-flex flex-column">
                        <span className="fw-bold fs-6">
                            {t(`auth.accountVerification.${regKey}.welcomeName`, { name: userData?.name || '' })}
                        </span>
                        <span className="fs-7">{t(`auth.accountVerification.${regKey}.accountCreatedLine`)}</span>
                        <span className="fs-7 mt-1">{t(`auth.accountVerification.${regKey}.nextStepsLine`)}</span>
                    </div>
                </div>

                <button type="button" className="av-continue-btn" onClick={onNextStep}>
                    {t(`auth.accountVerification.${regKey}.continueCta`)}
                    <i className="fas fa-arrow-right" />
                </button>
            </div>
        );
    }

    // ── Password setup ──────────────────────────────────────────────────
    if (verificationStep === 'password') {
        return (
            <div className="av-root">
                <div className="av-header">
                    <h2 className="av-title">{t('auth.accountVerification.step2Title')}</h2>
                    <p className="av-subtitle">{t('auth.accountVerification.passwordSubtitle')}</p>
                </div>

                <div className="fv-row mb-8">
                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.password')}</label>
                    <div className="position-relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={getPasswordInputClass()}
                            placeholder={t('auth.common.enterPassword')}
                            name="password"
                            value={passwordData.password}
                            onChange={handlePasswordChange}
                            style={{ textTransform: 'none', paddingLeft: '40px' }}
                        />
                        <span className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                            onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                            <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} />
                        </span>
                    </div>
                </div>

                <div className="fv-row mb-8">
                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.confirmPassword')}</label>
                    <div className="position-relative">
                        <input
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            className={getPasswordConfirmationClass()}
                            placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
                            name="password_confirmation"
                            value={passwordData.password_confirmation}
                            onChange={handlePasswordChange}
                            style={{ textTransform: 'none', paddingLeft: '40px' }}
                        />
                        <span className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                            style={{ cursor: 'pointer' }}>
                            <i className={`fas fa-${showPasswordConfirmation ? 'eye-slash' : 'eye'}`} />
                        </span>
                    </div>
                    {!passwordValidation.match && passwordData.password_confirmation && (
                        <div className="invalid-feedback d-block">{t('auth.passwordRules.doNotMatch')}</div>
                    )}
                </div>

                <div className="fv-row mb-8">
                    <div className="av-pwd-rules">
                        {[
                            { key: 'length',    rule: passwordValidation.length,    label: t('auth.passwordRules.atLeast8') },
                            { key: 'uppercase', rule: passwordValidation.uppercase, label: t('auth.passwordRules.uppercase') },
                            { key: 'lowercase', rule: passwordValidation.lowercase, label: t('auth.passwordRules.lowercase') },
                            { key: 'number',    rule: passwordValidation.number,    label: t('auth.passwordRules.number') },
                            { key: 'special',   rule: passwordValidation.special,   label: t('auth.passwordRules.special') },
                            { key: 'match',     rule: passwordValidation.match,     label: t('auth.passwordRules.match'),
                              active: !!(passwordData.password || passwordData.password_confirmation) },
                        ].map(({ key, rule, label, active }) => {
                            const typed = key === 'match' ? !!active : !!passwordData.password;
                            const color = rule ? '#16a34a' : typed ? '#dc2626' : '#9ca3af';
                            return (
                                <div key={key} className="av-pwd-rule" style={{ color }}>
                                    <i className={`fas ${rule ? 'fa-check' : typed ? 'fa-times' : ''}`} />
                                    {label}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="button"
                    className="av-continue-btn"
                    disabled={isRegistering}
                    onClick={handleRegisterUser}
                >
                    {isRegistering ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            {t('auth.common.creatingAccount')}
                        </>
                    ) : (
                        t('auth.accountVerification.setPasswordCta')
                    )}
                </button>
            </div>
        );
    }

    // ── OTP entry screen ────────────────────────────────────────────────
    if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
        return (
            <div className="av-root">
                <div className="av-header">
                    <h2 className="av-title">{t('auth.accountVerification.step2Title')}</h2>
                    <p className="av-subtitle">
                        {verificationMethod === 'email'
                            ? t('auth.accountVerification.codeIntroEmail')
                            : t('auth.accountVerification.codeIntroPhone')}
                    </p>
                </div>

                <div className="av-illustration-wrap">
                    <img alt={t('auth.common.verificationAlt')} className="av-illustration"
                         src="/assets/media/svg/misc/smartphone.svg" />
                </div>

                <div className="alert alert-primary av-alert mb-5">
                    {verificationMethod === 'email' ? (
                        <>
                            <p className="av-alert-title">{t('auth.accountVerification.alertEmailLead')}</p>
                            <p className="av-alert-value">{getMaskedValue()}</p>
                            <p className="av-alert-hint">{t('auth.accountVerification.alertEmailHint')}</p>
                        </>
                    ) : (
                        <>
                            <p className="av-alert-title">{t('auth.accountVerification.alertPhoneLead')}</p>
                            <p className="av-alert-value">{getMaskedValue()}</p>
                            <p className="av-alert-hint">{t('auth.accountVerification.alertPhoneHint')}</p>
                        </>
                    )}
                </div>

                <div className="mb-10">
                    <div className="fw-bolder text-start text-dark fs-6 mb-1 ms-1">
                        {t('auth.accountVerification.sixDigitLabel')}
                    </div>

                    <VerificationInput
                        key={verificationMethod}
                        ref={verificationInputRef}
                        length={6}
                        onComplete={handleVerificationComplete}
                    />

                    <div className="d-flex flex-column align-items-center gap-2 mt-3">
                        <button
                            type="button"
                            className={`btn ${isResendDisabled || isVerifying ? 'btn-secondary' : 'btn-link'}`}
                            disabled={isResendDisabled || isResending || isVerifying}
                            onClick={() => { sendVerificationCode(); resetVerificationInputs(); }}
                        >
                            {isVerifying ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                    {t('auth.common.verifying')}…
                                </>
                            ) : isResending ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                    {t('auth.accountVerification.sendingCode')}
                                </>
                            ) : isResendDisabled ? (
                                t('auth.accountVerification.resendIn', { seconds: resendTimer })
                            ) : (
                                t('auth.accountVerification.resendCode')
                            )}
                        </button>

                        <button type="button" className="btn btn-light btn-sm" onClick={handleGoBackToSelection}>
                            <i className="fas fa-arrow-left me-2" />
                            {t('auth.accountVerification.backChangeMethod')}
                        </button>
                    </div>
                </div>

                <div id="recaptcha-container" style={{ minHeight: 1 }} />
            </div>
        );
    }

    return null;
};

export default AccountVerification;
