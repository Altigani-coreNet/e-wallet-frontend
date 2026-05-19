import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { post } from '../utils/api';
import useRegistrationStore from '../stores/useRegistrationStore';

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAVWnL480bhjFnihbjrbE8FHB8Gm5sGdBg',
    authDomain: 'authuntication-otp.firebaseapp.com',
    projectId: 'authuntication-otp',
    storageBucket: 'authuntication-otp.firebasestorage.app',
    messagingSenderId: '612596848101',
    appId: '1:612596848101:web:1029b847f151f3fa640b0c',
    measurementId: 'G-6LZT1KLMBH',
};

const ensureFirebase = () => {
    if (!window.__firebaseApp) {
        window.__firebaseApp = initializeApp(FIREBASE_CONFIG);
        try { getAnalytics(window.__firebaseApp); } catch {}
    }
    return window.__firebaseApp;
};

const useAccountVerification = ({
    formData,
    setFormData,
    onNextStep,
    onPreviousRef,
    onPreviousToStep0,
    onStartNewRegistration,
    variant = 'merchant',
}) => {
    const { t } = useTranslation();
    const regKey = variant === 'partner' ? 'partner' : 'merchant';
    const { setRegistrationToken, updateRegistrationProgress } = useRegistrationStore();

    const [isVerifying, setIsVerifying]               = useState(false);
    const [verificationMethod, setVerificationMethod] = useState(null);
    const [verificationStep, setVerificationStep]     = useState(null);
    const [verificationToken, setVerificationToken]   = useState(null);
    const [showPassword, setShowPassword]             = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [accountCreated, setAccountCreated]         = useState(false);
    const [userData, setUserData]                     = useState(null);
    const [passwordData, setPasswordData]             = useState({ password: '', password_confirmation: '' });
    const [passwordValidation, setPasswordValidation] = useState({
        length: false, uppercase: false, lowercase: false,
        number: false, special: false, match: false,
    });
    const [resendTimer, setResendTimer]               = useState(0);
    const [isResendDisabled, setIsResendDisabled]     = useState(false);
    const [isResending, setIsResending]               = useState(false);
    const [isRegistering, setIsRegistering]           = useState(false);

    const verificationInputRef  = useRef(null);
    const confirmationResultRef = useRef(null);
    const recaptchaRef          = useRef(null);

    // ─── Firebase / reCAPTCHA ────────────────────────────────────────────

    const ensureRecaptcha = () => {
        try {
            const app  = ensureFirebase();
            const auth = getAuth(app);
            if (!window.__recaptchaVerifier) {
                const container = document.getElementById('recaptcha-container');
                if (!container) throw new Error('reCAPTCHA container not found');
                window.__recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
                window.__recaptchaVerifier.render?.();
            }
            recaptchaRef.current = window.__recaptchaVerifier;
        } catch {
            try {
                const auth = getAuth(ensureFirebase());
                window.__recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'normal' });
                recaptchaRef.current = window.__recaptchaVerifier;
            } catch {}
        }
    };

    const sendSmsOtp = async (phoneNumber) => {
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
            } catch {
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
            let errorMessage = t('auth.accountVerification.firebase.sendFailed');
            let errorTitle   = t('auth.common.smsFailed');
            if (error.code) {
                const codeMap = {
                    'auth/invalid-app-credential': [t('auth.common.error'),             t('auth.accountVerification.firebase.invalidAppCredential')],
                    'auth/invalid-phone-number':   [t('auth.common.invalidPhoneNumber'), t('auth.accountVerification.firebase.invalidPhone')],
                    'auth/too-many-requests':      [t('auth.common.tooManyRequests'),    t('auth.accountVerification.firebase.tooManyRequests')],
                    'auth/quota-exceeded':         [t('auth.common.quotaExceeded'),      t('auth.accountVerification.firebase.quotaExceeded')],
                    'auth/captcha-check-failed':   [t('auth.common.recaptchaError'),     t('auth.accountVerification.firebase.captchaFailed')],
                };
                [errorTitle, errorMessage] = codeMap[error.code] ?? [errorTitle, error.message || errorMessage];
            } else if (error.message) {
                errorMessage = error.message;
            }
            const result = await Swal.fire({
                icon: 'error', title: errorTitle,
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

    // ─── Password helpers ────────────────────────────────────────────────

    const validatePassword = (password, confirmation = passwordData.password_confirmation) => {
        setPasswordValidation({
            length:    password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number:    /[0-9]/.test(password),
            special:   /[^A-Za-z0-9]/.test(password),
            match:     password === confirmation && password !== '',
        });
    };

    const isPasswordStrong = () => {
        const { length, uppercase, lowercase, number, special } = passwordValidation;
        return length && uppercase && lowercase && number && special;
    };

    const isConfirmationValid = () =>
        passwordData.password &&
        passwordData.password_confirmation &&
        passwordData.password === passwordData.password_confirmation;

    const getPasswordInputClass = () => {
        if (!passwordData.password) return 'form-control form-control-lg form-control-solid';
        return `form-control form-control-lg form-control-solid ${isPasswordStrong() ? 'is-valid' : 'is-invalid'}`;
    };

    const getPasswordConfirmationClass = () => {
        if (!passwordData.password_confirmation) return 'form-control form-control-lg form-control-solid';
        return `form-control form-control-lg form-control-solid ${isConfirmationValid() ? 'is-valid' : 'is-invalid'}`;
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        const newData = { ...passwordData, [name]: value };
        setPasswordData(newData);
        if (name === 'password') validatePassword(value, newData.password_confirmation);
        else validatePassword(newData.password, value);
    };

    // ─── Mask helpers ────────────────────────────────────────────────────

    const maskEmail = (email) => email || '';
    const maskPhone = (phone) => (phone ? `****-****-${phone.slice(-4)}` : '');
    const getMaskedValue = () =>
        verificationMethod === 'email' ? maskEmail(formData.email) : maskPhone(formData.phone);

    // ─── Timer ───────────────────────────────────────────────────────────

    const startResendTimer = () => {
        setResendTimer(60);
        setIsResendDisabled(true);
    };

    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((t) => {
                    if (t <= 1) { setIsResendDisabled(false); return 0; }
                    return t - 1;
                });
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [resendTimer]);

    // Reset loading state when method changes
    useEffect(() => {
        setIsResending(false);
        setIsResendDisabled(false);
        setIsRegistering(false);
        setResendTimer(0);
    }, [verificationMethod]);

    // ─── Verification input reset ────────────────────────────────────────

    const resetVerificationInputs = () => {
        verificationInputRef.current?.resetInputs?.();
    };

    useEffect(() => {
        if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
            resetVerificationInputs();
        }
    }, [verificationMethod, verificationStep]);

    // ─── Auto-send code ──────────────────────────────────────────────────

    const sendVerificationCode = useCallback(async () => {
        if (isResendDisabled || isResending || !verificationMethod) return;
        setIsResending(true);
        setIsResendDisabled(true);
        try {
            if (verificationMethod === 'email') {
                const { data } = await post(AUTH_ENDPOINTS.REGISTER_SEND_CODE, {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    type: 'email',
                });
                if (data.success) {
                    setVerificationToken(data.token);
                    startResendTimer();
                } else if (data.errors) {
                    await Swal.fire({
                        icon: 'error', title: t('auth.common.validationError'),
                        html: Object.values(data.errors).flat().join('<br>'),
                        confirmButtonText: t('auth.common.ok'),
                    });
                } else {
                    throw new Error(data.message || t('auth.accountVerification.failedSendCode'));
                }
            } else if (verificationMethod === 'phone') {
                await sendSmsOtp(formData.phone);
            }
        } catch {
            await Swal.fire({
                icon: 'error', title: t('auth.common.error'),
                text: t('auth.accountVerification.failedSendCode'),
                confirmButtonText: t('auth.common.ok'),
            });
        } finally {
            setIsResending(false);
        }
    }, [verificationMethod, formData.email, formData.first_name, formData.last_name, formData.phone, t]);

    useEffect(() => {
        const shouldSend =
            verificationMethod &&
            verificationStep === verificationMethod &&
            verificationStep !== 'password' &&
            ((verificationMethod === 'email' && !verificationToken) ||
             (verificationMethod === 'phone' && !confirmationResultRef.current));
        if (!shouldSend) return;
        const timer = setTimeout(() => sendVerificationCode(), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verificationMethod, verificationStep]);

    // ─── Verify code ─────────────────────────────────────────────────────

    const handleVerificationComplete = async (code) => {
        if (!verificationToken && verificationMethod === 'email') {
            await Swal.fire({
                icon: 'error', title: t('auth.common.error'),
                text: t('auth.accountVerification.noTokenResend'),
                confirmButtonText: t('auth.common.ok'),
            });
            return;
        }
        setIsVerifying(true);
        try {
            if (verificationMethod === 'email') {
                const { data } = await post(AUTH_ENDPOINTS.REGISTER_VERIFY_CODE, {
                    code,
                    token: verificationToken,
                    type: 'email',
                });
                if (data.success) {
                    await Swal.fire({
                        icon: 'success', title: t('auth.common.emailVerified'),
                        text: t('auth.accountVerification.emailVerifySuccess'),
                        confirmButtonText: t('auth.common.continue'),
                    });
                    resetVerificationInputs();
                    setVerificationStep('password');
                } else {
                    await Swal.fire({
                        icon: 'error', title: t('auth.common.invalidCode'),
                        text: data.message || t('auth.accountVerification.incorrectEmailCode'),
                        confirmButtonText: t('auth.common.tryAgain'),
                    });
                    resetVerificationInputs();
                }
            } else if (verificationMethod === 'phone') {
                if (!code || code.length !== 6) {
                    await Swal.fire({
                        icon: 'error', title: t('auth.common.invalidCode'),
                        text: t('auth.accountVerification.enterSmsCode'),
                        confirmButtonText: t('auth.common.ok'),
                    });
                    return;
                }
                if (!confirmationResultRef.current) {
                    await Swal.fire({
                        icon: 'error', title: t('auth.common.error'),
                        text: t('auth.accountVerification.noSmsInProgress'),
                        confirmButtonText: t('auth.common.ok'),
                    });
                    return;
                }
                await confirmationResultRef.current.confirm(code);
                await Swal.fire({
                    icon: 'success', title: t('auth.common.phoneVerified'),
                    text: t('auth.accountVerification.phoneVerifySuccess'),
                    confirmButtonText: t('auth.common.continue'),
                });
                setVerificationStep('password');
            }
        } catch {
            await Swal.fire({
                icon: 'error', title: t('auth.common.verificationFailed'),
                text: t('auth.accountVerification.verifyCodeError'),
                confirmButtonText: t('auth.common.ok'),
            });
            resetVerificationInputs();
        } finally {
            setIsVerifying(false);
        }
    };

    // ─── Navigation ──────────────────────────────────────────────────────

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
            handleGoBackToSelection();
        } else {
            onPreviousToStep0?.();
        }
    }, [verificationMethod, verificationStep, onPreviousToStep0]);

    useEffect(() => {
        if (onPreviousRef) onPreviousRef.current = handlePreviousFromParent;
        return () => { if (onPreviousRef) onPreviousRef.current = null; };
    }, [handlePreviousFromParent, onPreviousRef]);

    // ─── Register user ────────────────────────────────────────────────────

    const handleRegisterUser = async () => {
        if (!isPasswordStrong() || !isConfirmationValid()) return;
        setIsRegistering(true);
        try {
            const { data } = await post(AUTH_ENDPOINTS.REGISTER_USER, {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                password: passwordData.password,
                password_confirmation: passwordData.password_confirmation,
            });
            if (data.success) {
                const user  = data.data;
                const token = data.token;
                if (token) {
                    setRegistrationToken(token, user);
                    updateRegistrationProgress(1, formData);
                }
                setUserData(user);
                setAccountCreated(true);
            } else {
                throw new Error(data.message || t('auth.common.registrationFailed'));
            }
        } catch (error) {
            if (error.response?.status === 422) {
                await Swal.fire({
                    icon: 'error', title: t('auth.common.validationError'),
                    html: Object.values(error.response.data.errors).flat().join('<br>'),
                    confirmButtonText: t('auth.common.ok'),
                });
            } else {
                await Swal.fire({
                    icon: 'error', title: t('auth.common.registrationFailed'),
                    text: error.message || t('auth.accountVerification.registrationFailedGeneric'),
                    confirmButtonText: t('auth.common.ok'),
                });
            }
        } finally {
            setIsRegistering(false);
        }
    };

    // ─── Derived state ────────────────────────────────────────────────────

    const isSelectingMethod =
        verificationStep === null ||
        (verificationMethod && verificationStep !== verificationMethod && verificationStep !== 'password');

    return {
        // state
        regKey,
        isVerifying, isResending, isResendDisabled, isRegistering,
        resendTimer, accountCreated, userData,
        verificationMethod, verificationStep,
        showPassword, setShowPassword,
        showPasswordConfirmation, setShowPasswordConfirmation,
        passwordData, passwordValidation,
        isSelectingMethod,
        // refs
        verificationInputRef,
        // derived
        getMaskedValue, maskEmail, maskPhone,
        isPasswordStrong, isConfirmationValid,
        getPasswordInputClass, getPasswordConfirmationClass,
        // handlers
        setVerificationMethod, setVerificationStep,
        handlePasswordChange,
        handleVerificationComplete,
        handleGoBackToSelection,
        handleRegisterUser,
        sendVerificationCode,
        resetVerificationInputs,
        onNextStep,
    };
};

export default useAccountVerification;
