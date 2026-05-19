import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import VerificationInput from '../../common/VerificationInput';
import {
    MerchantAuthPageLayout,
    MerchantAuthMobileTip,
    pickForgotPasswordMobileTip,
} from './merchantAuthShell';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState('request'); // request -> verify -> reset -> done
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [token, setToken] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        match: false,
    });
    const [resendTimer, setResendTimer] = useState(0);
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifiedCode, setVerifiedCode] = useState('');
    const verificationInputRef = useRef(null);

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await axios.post(AUTH_ENDPOINTS.PASSWORD_REQUEST_RESET, { email });

            if (response.data.success) {
                setToken(response.data.token);
                setVerifiedCode('');
                setStep('verify');
                toast.success(t('auth.forgotPassword.toastCodeSent'));
                startResendTimer();
                resetVerificationInputs();
            } else {
                toast.error(response.data.message || t('auth.forgotPassword.toastUnableStart'));
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('auth.forgotPassword.toastNetwork');
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();

        if (!code || code.length !== 6) {
            toast.error(t('auth.forgotPassword.toastEnterSix'));
            return;
        }

        if (!token) {
            toast.error(t('auth.forgotPassword.toastSessionExpired'));
            setStep('request');
            return;
        }

        setVerifying(true);

        try {
            const response = await axios.post(AUTH_ENDPOINTS.PASSWORD_VERIFY_CODE, {
                token,
                code,
            });

            if (response.data.success) {
                setVerifiedCode(code);
                toast.success(t('auth.forgotPassword.toastCodeVerified'));
                setStep('reset');
                resetVerificationInputs();
            } else {
                const errors = response.data.errors ? Object.values(response.data.errors).flat().join('\n') : '';
                toast.error(errors || response.data.message || t('auth.forgotPassword.toastVerifyFailed'));
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('auth.forgotPassword.toastVerifyRetry');
            const errors = err.response?.data?.errors;
            if (errors) {
                const errorList = Object.values(errors).flat().join('\n');
                toast.error(errorList);
            } else {
                toast.error(errorMessage);
            }
            resetVerificationInputs();
        } finally {
            setVerifying(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        const activeCode = verifiedCode || code;

        if (!activeCode || activeCode.length !== 6) {
            toast.error(t('auth.forgotPassword.toastVerifyBeforeReset'));
            setStep('verify');
            return;
        }

        if (!token) {
            toast.error(t('auth.forgotPassword.toastSessionExpired'));
            setStep('request');
            return;
        }

        if (!isPasswordValid()) {
            toast.error(t('auth.forgotPassword.toastMeetRequirements'));
            return;
        }

        setResetting(true);

        try {
            const response = await axios.post(AUTH_ENDPOINTS.PASSWORD_RESET, {
                token,
                code: activeCode,
                password,
                password_confirmation: passwordConfirmation,
            });

            if (response.data.success) {
                setStep('done');
                setVerifiedCode('');
                toast.success(t('auth.forgotPassword.toastResetSuccess'));
            } else {
                const errors = response.data.errors ? Object.values(response.data.errors).flat().join('\n') : '';
                toast.error(errors || response.data.message || t('auth.forgotPassword.toastResetFailed'));
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('auth.forgotPassword.toastResetNetwork');
            const errors = err.response?.data?.errors;
            if (errors) {
                const errorList = Object.values(errors).flat().join('\n');
                toast.error(errorList);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setResetting(false);
        }
    };

    const validatePassword = (pwd, confirmation = passwordConfirmation) => {
        setPasswordValidation({
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            match: pwd === confirmation && pwd !== '',
        });
    };

    const isPasswordValid = () => {
        return Object.values(passwordValidation).every((v) => v === true);
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        if (name === 'password') {
            setPassword(value);
            validatePassword(value, passwordConfirmation);
        } else if (name === 'password_confirmation') {
            setPasswordConfirmation(value);
            validatePassword(password, value);
        }
    };

    const startResendTimer = () => {
        setResendTimer(60);
        setIsResendDisabled(true);
    };

    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((timer) => {
                    if (timer <= 1) {
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return timer - 1;
                });
            }, 1000);
        }
        return () => interval && clearInterval(interval);
    }, [resendTimer]);

    const resetVerificationInputs = () => {
        if (verificationInputRef.current && verificationInputRef.current.resetInputs) {
            verificationInputRef.current.resetInputs();
        }
        setCode('');
    };

    const resendCode = async () => {
        if (isResendDisabled || isResending) return;
        setIsResending(true);

        try {
            const response = await axios.post(AUTH_ENDPOINTS.PASSWORD_REQUEST_RESET, { email });

            if (response.data.success) {
                setToken(response.data.token);
                setVerifiedCode('');
                setStep('verify');
                startResendTimer();
                resetVerificationInputs();
                toast.success(t('auth.forgotPassword.toastResendOk'));
            } else {
                toast.error(response.data.message || t('auth.forgotPassword.toastResendFailed'));
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('auth.forgotPassword.toastResendNetwork');
            toast.error(errorMessage);
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToRequest = () => {
        resetVerificationInputs();
        setStep('request');
        setToken('');
        setCode('');
        setVerifiedCode('');
        setPassword('');
        setPasswordConfirmation('');
        setPasswordValidation({
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            match: false,
        });
        setShowPassword(false);
        setShowPasswordConfirmation(false);
        setResendTimer(0);
        setIsResendDisabled(false);
        setIsResending(false);
    };

    const handleBackToVerify = () => {
        resetVerificationInputs();
        setStep('verify');
        setVerifiedCode('');
        setPassword('');
        setPasswordConfirmation('');
        setPasswordValidation({
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            match: false,
        });
        setShowPassword(false);
        setShowPasswordConfirmation(false);
    };

    const maskEmail = (value) => {
        if (!value) return '';
        const [user, domain] = value.split('@');
        if (!domain) return value;
        const maskedUser = user.length > 4 ? `${user.slice(0, 4)}****${user.slice(-2)}` : user;
        return `${maskedUser}@${domain}`;
    };

    const forgotCardTitle = useMemo(() => {
        switch (step) {
            case 'request':
                return t('auth.forgotPassword.requestTitle');
            case 'verify':
                return t('auth.forgotPassword.verifyTitle');
            case 'reset':
                return t('auth.forgotPassword.setNewTitle');
            case 'done':
                return t('auth.forgotPassword.doneTitle');
            default:
                return '';
        }
    }, [step, t]);

    const forgotCardSub = useMemo(() => {
        switch (step) {
            case 'request':
                return t('auth.forgotPassword.requestSubtitle');
            case 'verify':
                return (
                    <>
                        {t('auth.forgotPassword.verifyCodeLead')}{' '}
                        <strong>{maskEmail(email)}</strong>
                    </>
                );
            case 'reset':
                return (
                    <>
                        {t('auth.forgotPassword.setNewVerifiedLead')}{' '}
                        <strong>{maskEmail(email)}</strong>.
                    </>
                );
            case 'done':
                return t('auth.forgotPassword.doneSubtitle');
            default:
                return null;
        }
    }, [step, t, email]);

    const mobileTip = useMemo(() => pickForgotPasswordMobileTip(step, t), [step, t]);

    return (
        <MerchantAuthPageLayout
            cardTitle={forgotCardTitle}
            cardSub={forgotCardSub}
            asideHeadlineBefore={t('auth.forgotPassword.asideHeadlineBefore')}
            asideHeadlineAccent={t('auth.forgotPassword.asideHeadlineAccent')}
            asideSub={t('auth.forgotPassword.asideSub')}
            showAsideFeatures={false}
            showAsideTrust={false}
            showMobileMarketing={false}
            mobileFooter={
                <MerchantAuthMobileTip
                    title={mobileTip.title}
                    body={mobileTip.body}
                    iconClass={mobileTip.iconClass}
                />
            }
        >
            {step === 'request' && (
                <form className="form w-100" onSubmit={handleRequestReset} noValidate>
                    <label className="ml-label" htmlFor="forgot-email">
                        {t('auth.login.emailLabel')}
                    </label>
                    <div className="ml-input-wrap">
                        <span className="ml-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </span>
                        <input
                            id="forgot-email"
                            type="email"
                            placeholder={t('auth.forgotPassword.emailPlaceholder')}
                            name="email"
                            autoComplete="email"
                            className="ml-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="ml-actions-row">
                        <button type="submit" className="ml-btn-primary" disabled={submitting}>
                            {submitting ? (
                                <span>
                                    {t('auth.common.sendingCode')}
                                    <span className="spinner-border spinner-border-sm align-middle ms-2" role="status" />
                                </span>
                            ) : (
                                t('auth.common.submit')
                            )}
                        </button>
                        <Link to="/login" className="ml-btn-outline">
                            {t('auth.common.cancel')}
                        </Link>
                    </div>
                </form>
            )}

            {step === 'verify' && (
                <form className="form w-100" onSubmit={handleVerifyCode} noValidate>
                    <label className="ml-label">{t('auth.forgotPassword.verificationCodeLabel')}</label>
                    <div className="ml-verification-wrap">
                        <VerificationInput
                            ref={verificationInputRef}
                            length={6}
                            onComplete={(val) => {
                                setCode(val);
                            }}
                        />
                    </div>
                    <div className="ml-resend-row">
                        <button
                            type="button"
                            className="ml-text-btn"
                            disabled={isResendDisabled || isResending || verifying}
                            onClick={resendCode}
                        >
                            {isResending ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                    {t('auth.common.resending')}
                                </>
                            ) : isResendDisabled ? (
                                t('auth.forgotPassword.resendCodeIn', { seconds: resendTimer })
                            ) : (
                                t('auth.forgotPassword.resendCode')
                            )}
                        </button>
                    </div>
                    <div className="ml-actions-row">
                        <button type="submit" className="ml-btn-primary" disabled={verifying || !code || code.length !== 6}>
                            {verifying ? (
                                <span>
                                    {t('auth.common.verifying')}
                                    <span className="spinner-border spinner-border-sm align-middle ms-2" role="status" />
                                </span>
                            ) : (
                                t('auth.forgotPassword.verifyCode')
                            )}
                        </button>
                        <button type="button" className="ml-btn-outline" onClick={handleBackToRequest} disabled={verifying}>
                            {t('auth.common.back')}
                        </button>
                    </div>
                </form>
            )}

            {step === 'reset' && (
                <form className="form w-100" onSubmit={handleResetPassword} noValidate>
                    <label className="ml-label" htmlFor="forgot-new-password">
                        {t('auth.common.password')}
                    </label>
                    <div className={`ml-input-wrap ml-password-wrap ${password && !isPasswordValid() ? 'ml-has-error' : ''}`}>
                        <span className="ml-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="forgot-new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth.forgotPassword.enterPasswordPlaceholder')}
                            name="password"
                            autoComplete="new-password"
                            className="ml-field"
                            value={password}
                            onChange={handlePasswordChange}
                            required
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
                    </div>

                    <label className="ml-label" htmlFor="forgot-confirm-password">
                        {t('auth.common.confirmPassword')}
                    </label>
                    <div className={`ml-input-wrap ml-password-wrap ${passwordConfirmation && !passwordValidation.match ? 'ml-has-error' : ''}`}>
                        <span className="ml-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="forgot-confirm-password"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
                            name="password_confirmation"
                            autoComplete="new-password"
                            className="ml-field"
                            value={passwordConfirmation}
                            onChange={handlePasswordChange}
                            required
                        />
                        <button
                            type="button"
                            className="ml-password-toggle"
                            onClick={() => setShowPasswordConfirmation((p) => !p)}
                            tabIndex={-1}
                            aria-label={
                                showPasswordConfirmation ? t('auth.common.hidePassword') : t('auth.common.showPassword')
                            }
                        >
                            <i className={`bi ${showPasswordConfirmation ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>
                    {!passwordValidation.match && passwordConfirmation ? (
                        <div className="ml-err">{t('auth.passwordRules.doNotMatch')}</div>
                    ) : null}

                    <div className="ml-password-rules">
                        <div className={`ml-password-rule ${passwordValidation.length ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            <i className={`bi ${passwordValidation.length ? 'bi-check-lg' : 'bi-x-lg'}`} aria-hidden />
                            {t('auth.passwordRules.atLeast8')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.uppercase ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            <i className={`bi ${passwordValidation.uppercase ? 'bi-check-lg' : 'bi-x-lg'}`} aria-hidden />
                            {t('auth.passwordRules.uppercase')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.lowercase ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            <i className={`bi ${passwordValidation.lowercase ? 'bi-check-lg' : 'bi-x-lg'}`} aria-hidden />
                            {t('auth.passwordRules.lowercase')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.number ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            <i className={`bi ${passwordValidation.number ? 'bi-check-lg' : 'bi-x-lg'}`} aria-hidden />
                            {t('auth.passwordRules.number')}
                        </div>
                    </div>

                    <div className="ml-actions-row">
                        <button
                            type="submit"
                            className="ml-btn-primary"
                            disabled={resetting || !isPasswordValid() || !verifiedCode || verifiedCode.length !== 6}
                        >
                            {resetting ? (
                                <span>
                                    {t('auth.common.resetting')}
                                    <span className="spinner-border spinner-border-sm align-middle ms-2" role="status" />
                                </span>
                            ) : (
                                t('auth.forgotPassword.resetPassword')
                            )}
                        </button>
                        <button type="button" className="ml-btn-outline" onClick={handleBackToVerify} disabled={resetting}>
                            {t('auth.common.back')}
                        </button>
                    </div>
                </form>
            )}

            {step === 'done' && (
                <div className="ml-actions-row">
                    <Link to="/login" className="ml-btn-primary">
                        {t('auth.common.goToLogin')}
                    </Link>
                </div>
            )}
        </MerchantAuthPageLayout>
    );
};

export default ForgotPassword;
