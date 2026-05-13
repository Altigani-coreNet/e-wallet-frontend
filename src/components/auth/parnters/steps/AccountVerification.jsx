import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import VerificationInput from '../../../common/VerificationInput';
import Swal from 'sweetalert2';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AUTH_ENDPOINTS } from '../../../../utils/constants';
import useRegistrationStore from '../../../../stores/useRegistrationStore';

const AccountVerification = ({
    formData,
    setFormData,
    onNextStep,
    onPreviousStep,
    onPreviousRef,
    onPreviousToStep0,
    onStartNewRegistration,
    variant = 'merchant',
}) => {
    const { t } = useTranslation();
    const regKey = variant === 'partner' ? 'partner' : 'merchant';
    const { setRegistrationToken, updateRegistrationProgress } = useRegistrationStore();
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState(null);
    const [verificationStep, setVerificationStep] = useState(null);
    const [verificationToken, setVerificationToken] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [accountCreated, setAccountCreated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [passwordData, setPasswordData] = useState({
        password: '',
        password_confirmation: ''
    });
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false
    });
    const [resendTimer, setResendTimer] = useState(0);
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const verificationInputRef = useRef(null);
    const confirmationResultRef = useRef(null);
    const recaptchaRef = useRef(null);
    
    const ensureFirebase = () => {
        if (!window.__firebaseApp) {
            const firebaseConfig = {
                apiKey: 'AIzaSyAVWnL480bhjFnihbjrbE8FHB8Gm5sGdBg',
                authDomain: 'authuntication-otp.firebaseapp.com',
                projectId: 'authuntication-otp',
                storageBucket: 'authuntication-otp.firebasestorage.app',
                messagingSenderId: '612596848101',
                appId: '1:612596848101:web:1029b847f151f3fa640b0c',
                measurementId: 'G-6LZT1KLMBH',
            };
            window.__firebaseApp = initializeApp(firebaseConfig);
            try { getAnalytics(window.__firebaseApp); } catch {}
        }
        return window.__firebaseApp;
    };

    const ensureRecaptcha = () => {
        try {
            const app = ensureFirebase();
            const auth = getAuth(app);
            if (!window.__recaptchaVerifier) {
                const container = document.getElementById('recaptcha-container');
                if (!container) throw new Error('reCAPTCHA container not found');
                window.__recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
                window.__recaptchaVerifier.render?.();
            }
            recaptchaRef.current = window.__recaptchaVerifier;
        } catch (e) {
            try {
                const app = ensureFirebase();
                const auth = getAuth(app);
                window.__recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'normal' });
                recaptchaRef.current = window.__recaptchaVerifier;
            } catch {}
        }
    };

    const sendSmsOtp = async (phoneNumber) => {
        console.log(phoneNumber);
        try {
            ensureRecaptcha();
            let appVerifier = recaptchaRef.current;
            if (!appVerifier) throw new Error('reCAPTCHA not ready.');
            const auth = getAuth(ensureFirebase());
            if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                try { auth.settings.appVerificationDisabledForTesting = true; } catch {}
            }
            try {
                if (typeof appVerifier.render === 'function') await appVerifier.render();
                if (typeof appVerifier.verify === 'function') await appVerifier.verify();
            } catch (_) {
                window.__recaptchaVerifier = null;
                recaptchaRef.current = null;
                ensureRecaptcha();
                appVerifier = recaptchaRef.current;
                if (typeof appVerifier.render === 'function') await appVerifier.render();
                if (typeof appVerifier.verify === 'function') await appVerifier.verify();
            }
            confirmationResultRef.current = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            startResendTimer();
        } catch (error) {
            console.error('SMS send error:', error);
            
            let errorMessage = t('auth.accountVerification.firebase.sendFailed');
            let errorTitle = t('auth.common.smsFailed');

            if (error.code) {
                switch (error.code) {
                    case 'auth/invalid-app-credential':
                        errorTitle = t('auth.common.error');
                        errorMessage = t('auth.accountVerification.firebase.invalidAppCredential');
                        break;
                    case 'auth/invalid-phone-number':
                        errorTitle = t('auth.common.invalidPhoneNumber');
                        errorMessage = t('auth.accountVerification.firebase.invalidPhone');
                        break;
                    case 'auth/too-many-requests':
                        errorTitle = t('auth.common.tooManyRequests');
                        errorMessage = t('auth.accountVerification.firebase.tooManyRequests');
                        break;
                    case 'auth/quota-exceeded':
                        errorTitle = t('auth.common.quotaExceeded');
                        errorMessage = t('auth.accountVerification.firebase.quotaExceeded');
                        break;
                    case 'auth/captcha-check-failed':
                        errorTitle = t('auth.common.recaptchaError');
                        errorMessage = t('auth.accountVerification.firebase.captchaFailed');
                        break;
                    default:
                        errorMessage = error.message || errorMessage;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            const result = await Swal.fire({
                icon: 'error',
                title: errorTitle,
                html: errorMessage.replace(/\n/g, '<br>'),
                showCancelButton: true,
                confirmButtonText: t('auth.common.proceedRegistration'),
                cancelButtonText: t('auth.common.startNewRegistration'),
                width: '500px',
            });
            if (result.dismiss === Swal.DismissReason.cancel && typeof onStartNewRegistration === 'function') {
                onStartNewRegistration();
            }
        }
    };

    const validatePassword = (password, confirmation = passwordData.password_confirmation) => {
        setPasswordValidation({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
            match: password === confirmation && password !== ''
        });
    };

    const isPasswordStrong = () => {
        const { length, uppercase, lowercase, number, special } = passwordValidation;
        return length && uppercase && lowercase && number && special;
    };

    const isConfirmationValid = () => {
        return (
            passwordData.password &&
            passwordData.password_confirmation &&
            passwordData.password === passwordData.password_confirmation
        );
    };

    const getPasswordInputClass = () => {
        if (!passwordData.password) {
            return 'form-control form-control-lg form-control-solid';
        }
        return `form-control form-control-lg form-control-solid ${isPasswordStrong() ? 'is-valid' : 'is-invalid'}`;
    };

    const getPasswordConfirmationClass = () => {
        if (!passwordData.password_confirmation) {
            return 'form-control form-control-lg form-control-solid';
        }
        return `form-control form-control-lg form-control-solid ${isConfirmationValid() ? 'is-valid' : 'is-invalid'}`;
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        const newPasswordData = { ...passwordData, [name]: value };
        setPasswordData(newPasswordData);
        
        if (name === 'password') {
            validatePassword(value, newPasswordData.password_confirmation);
        } else {
            validatePassword(newPasswordData.password, value);
        }
    };

    const maskEmail = (email) => {
        return email || '';
    };

    const maskPhone = (phone) => {
        if (!phone) return '';
        return `****-****-${phone.slice(-4)}`;
    };

    const getMaskedValue = () => {
        if (verificationMethod === 'email') {
            return maskEmail(formData.email);
        }
        return maskPhone(formData.phone);
    };

    const startResendTimer = () => {
        setResendTimer(60);
        setIsResendDisabled(true);
    };

    const sendVerificationCode = useCallback(async () => {
        if (isResendDisabled || isResending || !verificationMethod) return;
        
        setIsResending(true);
        setIsResendDisabled(true);
        
        try {
            if (verificationMethod === 'email') {
                const response = await fetch(AUTH_ENDPOINTS.REGISTER_SEND_CODE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        type: 'email'
                    })
                });
                const data = await response.json();
                if (data.success) {
                    setVerificationToken(data.token);
                    startResendTimer();
                } else {
                    if (data.errors) {
                        const errorMessages = Object.values(data.errors).flat();
                        await Swal.fire({
                            icon: 'error',
                            title: t('auth.common.validationError'),
                            html: errorMessages.join('<br>'),
                            confirmButtonText: t('auth.common.ok'),
                        });
                    } else {
                        throw new Error(data.message || t('auth.accountVerification.failedSendCode'));
                    }
                }
            } else if (verificationMethod === 'phone') {
                await sendSmsOtp(formData.phone);
            }
        } catch (error) {
            console.error('Error sending code:', error);
            await Swal.fire({
                icon: 'error',
                title: t('auth.common.error'),
                text: t('auth.accountVerification.failedSendCode'),
                confirmButtonText: t('auth.common.ok'),
            });
        } finally {
            setIsResending(false);
        }
    }, [verificationMethod, formData.email, formData.first_name, formData.last_name, formData.phone, t]);

    const resetVerificationInputs = () => {
        if (verificationInputRef.current) {
            verificationInputRef.current.resetInputs();
        }
    };

    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(timer => {
                    if (timer <= 1) {
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return timer - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    useEffect(() => {
        setIsResending(false);
        setIsResendDisabled(false);
        setIsRegistering(false);
        setResendTimer(0);
    }, [verificationMethod]);

    useEffect(() => {
        if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
            resetVerificationInputs();
        }
    }, [verificationMethod, verificationStep]);

    useEffect(() => {
        const shouldSendCode = verificationMethod && 
                              verificationStep === verificationMethod && 
                              verificationStep !== 'password' &&
                              ((verificationMethod === 'email' && !verificationToken) || 
                               (verificationMethod === 'phone' && !confirmationResultRef.current));
        
        if (shouldSendCode) {
            const timer = setTimeout(() => {
                sendVerificationCode();
            }, 300);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verificationMethod, verificationStep]);

    const handleVerificationComplete = async (code) => {
        if (!verificationToken && verificationMethod === 'email') {
            await Swal.fire({
                icon: 'error',
                title: t('auth.common.error'),
                text: t('auth.accountVerification.noTokenResend'),
                confirmButtonText: t('auth.common.ok'),
            });
            return;
        }

        setIsVerifying(true);
        try {
            if (verificationMethod === 'email') {
                const response = await fetch(AUTH_ENDPOINTS.REGISTER_VERIFY_CODE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code, token: verificationToken, type: 'email' })
                });
                const data = await response.json();
                if (data.success) {
                    await Swal.fire({
                        icon: 'success',
                        title: t('auth.common.emailVerified'),
                        text: t('auth.accountVerification.emailVerifySuccess'),
                        confirmButtonText: t('auth.common.continue'),
                    });
                    resetVerificationInputs();
                    setVerificationStep('password');
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t('auth.common.invalidCode'),
                        text: data.message || t('auth.accountVerification.incorrectEmailCode'),
                        confirmButtonText: t('auth.common.tryAgain'),
                    });
                    resetVerificationInputs();
                }
            } else if (verificationMethod === 'phone') {
                if (!code || code.length !== 6) {
                    await Swal.fire({
                        icon: 'error',
                        title: t('auth.common.invalidCode'),
                        text: t('auth.accountVerification.enterSmsCode'),
                        confirmButtonText: t('auth.common.ok'),
                    });
                    return;
                }
                if (!confirmationResultRef.current) {
                    await Swal.fire({
                        icon: 'error',
                        title: t('auth.common.error'),
                        text: t('auth.accountVerification.noSmsInProgress'),
                        confirmButtonText: t('auth.common.ok'),
                    });
                    return;
                }
                await confirmationResultRef.current.confirm(code);
                await Swal.fire({
                    icon: 'success',
                    title: t('auth.common.phoneVerified'),
                    text: t('auth.accountVerification.phoneVerifySuccess'),
                    confirmButtonText: t('auth.common.continue'),
                });
                setVerificationStep('password');
            }
        } catch (error) {
            console.error('Verification error:', error);
            await Swal.fire({
                icon: 'error',
                title: t('auth.common.verificationFailed'),
                text: t('auth.accountVerification.verifyCodeError'),
                confirmButtonText: t('auth.common.ok'),
            });
            resetVerificationInputs();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoBackToSelection = () => {
        setVerificationStep(null);
        setVerificationToken(null);
        setVerificationMethod(null);
        confirmationResultRef.current = null;
        resetVerificationInputs();
        setIsResending(false);
        setIsResendDisabled(false);
        setResendTimer(0);
    };

    const handlePreviousFromParent = useCallback(() => {
        if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
            setVerificationStep(null);
            setVerificationToken(null);
            setVerificationMethod(null);
            confirmationResultRef.current = null;
            resetVerificationInputs();
            setIsResending(false);
            setIsResendDisabled(false);
            setResendTimer(0);
        } else {
            if (onPreviousToStep0) {
                onPreviousToStep0();
            }
        }
    }, [verificationMethod, verificationStep, onPreviousToStep0]);

    useEffect(() => {
        if (onPreviousRef) {
            onPreviousRef.current = handlePreviousFromParent;
        }
        return () => {
            if (onPreviousRef) {
                onPreviousRef.current = null;
            }
        };
    }, [handlePreviousFromParent, onPreviousRef]);

    const isSelectingMethod = verificationStep === null || (verificationMethod && verificationStep !== verificationMethod && verificationStep !== 'password');
    
    if (isSelectingMethod) {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">{t('auth.accountVerification.step2Title')}</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">{t('auth.accountVerification.selectionSubtitle')}</div>
                </div>

                <div className="text-center mb-6 mb-lg-10">
                    <span className="flex justify-center items-center mb-5">
                        <img alt={t('auth.common.verificationAlt')} className="mh-75px mh-lg-125px" 
                             src="/assets/media/svg/misc/smartphone.svg" />
                    </span>
                </div>

                <div className="mb-10">
                    <label className="form-label fw-bolder text-dark fs-6 mb-5">
                        {t('auth.accountVerification.selectMethodLabel')}
                    </label>
                    
                    <input 
                        type="radio" 
                        className="btn-check" 
                        name="verificationMethod" 
                        value="email" 
                        checked={verificationMethod === 'email'}
                        onChange={(e) => {
                            setVerificationMethod(e.target.value);
                        }}
                        id="verificationEmail"
                    />
                    <label 
                        className="btn btn-outline btn-outline-dashed btn-active-light-primary p-5 p-md-7 d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-5" 
                        htmlFor="verificationEmail"
                    >
                        <i className="fas fa-envelope text-primary fs-2x fs-md-4x me-0 me-sm-4 mb-3 mb-sm-0 flex-shrink-0"></i>
                        <span className="d-block fw-semibold text-start min-w-0">
                            <span className="text-gray-900 fw-bold d-block fs-5 fs-md-3">{t('auth.accountVerification.emailOptionTitle')}</span>
                            <span className="text-muted fw-semibold fs-7 fs-md-6 text-break">
                                {t('auth.accountVerification.emailOptionHint', { value: maskEmail(formData.email) })}
                            </span>
                        </span>
                    </label>

                    <input 
                        type="radio" 
                        className="btn-check" 
                        name="verificationMethod" 
                        value="phone" 
                        checked={verificationMethod === 'phone'}
                        onChange={(e) => {
                            setVerificationMethod(e.target.value);
                        }}
                        id="verificationPhone"
                    />
                    <label 
                        className="btn btn-outline btn-outline-dashed btn-active-light-primary p-5 p-md-7 d-flex flex-column flex-sm-row align-items-start align-items-sm-center" 
                        htmlFor="verificationPhone"
                    >
                        <i className="fas fa-phone text-primary fs-2x fs-md-4x me-0 me-sm-4 mb-3 mb-sm-0 flex-shrink-0"></i>
                        <span className="d-block fw-semibold text-start min-w-0">
                            <span className="text-gray-900 fw-bold d-block fs-5 fs-md-3">{t('auth.accountVerification.phoneOptionTitle')}</span>
                            <span className="text-muted fw-semibold fs-7 fs-md-6 text-break">
                                {t('auth.accountVerification.phoneOptionHint', { value: maskPhone(formData.phone) })}
                            </span>
                        </span>
                    </label>

                    <div className="text-center mt-10">
                        <button
                            type="button"
                            className="btn btn-lg btn-primary w-100 mb-5"
                            disabled={!verificationMethod || isResending}
                            onClick={() => {
                                if (verificationMethod) {
                                    setVerificationStep(verificationMethod);
                                }
                            }}
                        >
                            {isResending ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('auth.accountVerification.sendingCode')}
                                </>
                            ) : (
                                <>
                                    {verificationMethod === 'email'
                                        ? t('auth.accountVerification.continueWithEmail')
                                        : verificationMethod === 'phone'
                                          ? t('auth.accountVerification.continueWithPhone')
                                          : ''}
                                    <span className="svg-icon svg-icon-4 ms-1">
                                        <i className="fas fa-arrow-right"></i>
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (accountCreated) {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">{t('auth.accountVerification.accountCreatedTitle')}</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">
                        {t(`auth.accountVerification.${regKey}.accountCreatedSubtitle`)}
                    </div>
                </div>

                <div className="text-center mb-10">
                    <span className="flex justify-center items-center mb-5">
                        <img alt={t('auth.common.successAlt')} className="mh-125px" 
                             src="/assets/media/svg/misc/smartphone.svg" />
                    </span>

                    <div className="alert alert-success mb-5">
                        <div className="d-flex flex-column">
                            <span className="fw-bold fs-6">{t(`auth.accountVerification.${regKey}.welcomeName`, { name: userData?.name || '' })}</span>
                            <span className="fs-7">{t(`auth.accountVerification.${regKey}.accountCreatedLine`)}</span>
                            <span className="fs-7 mt-1">{t(`auth.accountVerification.${regKey}.nextStepsLine`)}</span>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        className="btn btn-lg btn-primary w-100 mb-5"
                        onClick={() => {
                            if (onNextStep) {
                                onNextStep();
                            }
                        }}
                    >
                        {t(`auth.accountVerification.${regKey}.continueCta`)}
                        <span className="svg-icon svg-icon-4 ms-1">
                            <i className="fas fa-arrow-right"></i>
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    if (verificationStep === 'password') {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">{t('auth.accountVerification.step2Title')}</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">{t('auth.accountVerification.passwordSubtitle')}</div>
                </div>

                <div className="fv-row mb-8">
                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.password')}</label>
                    <div className="position-relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={getPasswordInputClass()}
                            placeholder={t('auth.common.enterPassword')}
                            name="password"
                            value={passwordData.password}
                            onChange={handlePasswordChange}
                            style={{ textTransform: 'none', paddingLeft: '40px' }}
                        />
                        <span
                            className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                        </span>
                    </div>
                    
                </div>

                <div className="fv-row mb-8">
                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.confirmPassword')}</label>
                    <div className="position-relative">
                        <input
                            type={showPasswordConfirmation ? "text" : "password"}
                            className={getPasswordConfirmationClass()}
                            placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
                            name="password_confirmation"
                            value={passwordData.password_confirmation}
                            onChange={handlePasswordChange}
                            style={{ textTransform: 'none', paddingLeft: '40px' }}
                        />
                        <span
                            className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className={`fas fa-${showPasswordConfirmation ? 'eye-slash' : 'eye'}`}></i>
                        </span>
                    </div>
                    {!passwordValidation.match && passwordData.password_confirmation && (
                        <div className="invalid-feedback">{t('auth.passwordRules.doNotMatch')}</div>
                    )}
                </div>
                <div className="fv-row mb-8">
                    <div className="password-validation mt-3">
                        <div className={`validation-item ${passwordValidation.length ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.length ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            {t('auth.passwordRules.atLeast8')}
                        </div>
                        <div className={`validation-item ${passwordValidation.uppercase ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.uppercase ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            {t('auth.passwordRules.uppercase')}
                        </div>
                        <div className={`validation-item ${passwordValidation.lowercase ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.lowercase ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            {t('auth.passwordRules.lowercase')}
                        </div>
                        <div className={`validation-item ${passwordValidation.number ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.number ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            {t('auth.passwordRules.number')}
                        </div>
                        <div className={`validation-item ${passwordValidation.special ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.special ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            {t('auth.passwordRules.special')}
                        </div>
                        <div className={`validation-item  ${passwordValidation.match ? 'text-success' : (passwordData.password || passwordData.password_confirmation) ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.match ? 'fa-check' : (passwordData.password || passwordData.password_confirmation) ? 'fa-times' : ''}`}></i>
                            {t('auth.passwordRules.match')}
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        className="btn btn-lg btn-primary w-100 mb-5"
                        disabled={isRegistering}
                        onClick={async () => {
                            if (!isPasswordStrong() || !isConfirmationValid()) {
                                return;
                            }

                            setIsRegistering(true);

                            try {
                                const response = await fetch(AUTH_ENDPOINTS.REGISTER_USER, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        email: formData.email,
                                        first_name: formData.first_name,
                                        last_name: formData.last_name,
                                        phone: formData.phone,
                                        password: passwordData.password,
                                        password_confirmation: passwordData.password_confirmation
                                    })
                                });

                                const data = await response.json();

                                if (data.success) {
                                    const userData = data.data;
                                    const token = data.token;
                                    
                                    if (token) {
                                        localStorage.setItem('auth_token', token);
                                        localStorage.setItem('user_data', JSON.stringify(userData));
                                        setRegistrationToken(token, userData);
                                        updateRegistrationProgress(1, formData);
                                    }
                                    
                                    setUserData(userData);
                                    setAccountCreated(true);
                                } else {
                                    throw new Error(data.message || t('auth.common.registrationFailed'));
                                }
                            } catch (error) {
                                console.error('Registration error:', error);
                                
                                if (error.response?.status === 422) {
                                    const errorMessages = Object.values(error.response.data.errors)
                                        .flat()
                                        .join('<br>');
                                    
                                    await Swal.fire({
                                        icon: 'error',
                                        title: t('auth.common.validationError'),
                                        html: errorMessages,
                                        confirmButtonText: t('auth.common.ok'),
                                    });
                                } else {
                                    await Swal.fire({
                                        icon: 'error',
                                        title: t('auth.common.registrationFailed'),
                                        text: error.message || t('auth.accountVerification.registrationFailedGeneric'),
                                        confirmButtonText: t('auth.common.ok'),
                                    });
                                }
                            } finally {
                                setIsRegistering(false);
                            }
                        }}
                    >
                        {isRegistering ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t('auth.common.creatingAccount')}
                            </>
                        ) : (
                            t('auth.accountVerification.setPasswordCta')
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">{t('auth.accountVerification.step2Title')}</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">
                        {verificationMethod === 'email'
                            ? t('auth.accountVerification.codeIntroEmail')
                            : t('auth.accountVerification.codeIntroPhone')}
                    </div>
                </div>

            <div className="text-center mb-6 mb-lg-10">
                <span className="flex justify-center items-center mb-5">
                    <img alt={t('auth.common.verificationAlt')} className="mh-75px mh-lg-125px" 
                         src="/assets/media/svg/misc/smartphone.svg" />
                </span>

                <div className="alert alert-primary mb-5">
                    {verificationMethod === 'email' ? (
                        <div className="d-flex flex-column min-w-0">
                            <span className="fw-bold fs-7 fs-md-6">{t('auth.accountVerification.alertEmailLead')}</span>
                            <span className="fs-7 text-break">{getMaskedValue()}</span>
                            <span className="fs-7 mt-2">{t('auth.accountVerification.alertEmailHint')}</span>
                        </div>
                    ) : (
                        <div className="d-flex flex-column min-w-0">
                            <span className="fw-bold fs-7 fs-md-6">{t('auth.accountVerification.alertPhoneLead')}</span>
                            <span className="fs-7 text-break">{getMaskedValue()}</span>
                            <span className="fs-7 mt-2">{t('auth.accountVerification.alertPhoneHint')}</span>
                        </div>
                    )}
                </div>
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

                {isVerifying && (
                    <div className="d-flex justify-content-center mt-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t('auth.common.verifying')}</span>
                        </div>
                    </div>
                )}

                <div className="text-center mt-5">
                    <div className="d-flex flex-column gap-3 align-items-center">
                        <button
                            type="button"
                            className={`btn ${isResendDisabled ? 'btn-secondary' : 'btn-link'}`}
                            disabled={isResendDisabled || isResending}
                            onClick={() => {
                                sendVerificationCode();
                                resetVerificationInputs();
                            }}
                        >
                            {isResending ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('auth.accountVerification.sendingCode')}
                                </>
                            ) : isResendDisabled ? (
                                t('auth.accountVerification.resendIn', { seconds: resendTimer })
                            ) : (
                                t('auth.accountVerification.resendCode')
                            )}
                        </button>
                        
                        <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={handleGoBackToSelection}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            {t('auth.accountVerification.backChangeMethod')}
                        </button>
                    </div>
                </div>
            </div>
            <div id="recaptcha-container" style={{ minHeight: 1 }}></div>
        </div>
        );
    }

    return null;
};

export default AccountVerification;
