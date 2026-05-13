import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import VerificationInput from '../../common/VerificationInput';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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
                code
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

        // Validate code exists
        if (!activeCode || activeCode.length !== 6) {
            toast.error(t('auth.forgotPassword.toastVerifyBeforeReset'));
            setStep('verify');
            return;
        }

        // Validate token exists
        if (!token) {
            toast.error(t('auth.forgotPassword.toastSessionExpired'));
            setStep('request');
            return;
        }
        
        // Client-side password validation
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
                password_confirmation: passwordConfirmation 
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
            match: pwd === confirmation && pwd !== ''
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
                setResendTimer((t) => {
                    if (t <= 1) {
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return t - 1;
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

    return (
        <>
            {/* Page background image - matching Login layout */}
            <style>{`
                body {
                    background-image: url('/assets/media/auth/bg4.jpg');
                }
                [data-bs-theme="dark"] body {
                    background-image: url('/assets/media/auth/bg4-dark.jpg');
                }
            `}</style>
            
            <div className="d-flex flex-column flex-root" id="kt_app_root" style={{ minHeight: '100vh' }}>
                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '100vh' }}>
                    {/* Left side - Branding - Hidden on small screens - 50% width */}
                    <div className="d-none d-lg-flex justify-content-center align-items-center" style={{ flex: '1', minHeight: '100vh' }}>
                        <div className="d-flex flex-column flex-center p-10">
                            <img 
                                className="theme-light-show mx-auto mw-100 w-150px w-lg-300px mb-10 mb-lg-20" 
                                src="/assets/media/auth/agency.png" 
                                alt={t('auth.common.logoAlt')} 
                            />
                            <img 
                                className="theme-dark-show mx-auto mw-100 w-150px w-lg-300px mb-10 mb-lg-20" 
                                src="/assets/media/auth/agency-dark.png" 
                                alt={t('auth.common.logoAlt')} 
                            />
                            <h1 className="text-gray-800 fs-2qx fw-bold text-center mb-7">
                                {t('auth.forgotPassword.brandTitle')}
                            </h1>
                            <div className="text-gray-600 fs-base text-center fw-semibold">
                                {t('auth.forgotPassword.brandSubtitle')}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Password Reset Form - 50% width on desktop, 100% on mobile */}
                    <div className="d-flex justify-content-center align-items-center p-12" style={{ flex: '1', minHeight: '100vh' }}>
                        <div className="bg-body d-flex flex-column flex-center rounded-4 w-md-600px py-15 px-10">
                            <div className="d-flex flex-center flex-column align-items-stretch w-md-400px">
                                <div className="d-flex flex-center flex-column flex-column-fluid py-10 w-100">
                                    
                                    {step === 'request' && (
                                        <form className="form w-100" onSubmit={handleRequestReset} noValidate>
                                            <div className="text-center mb-10">
                                                <h1 className="text-gray-900 fw-bolder mb-3">{t('auth.forgotPassword.requestTitle')}</h1>
                                                <div className="text-gray-500 fw-semibold fs-6">{t('auth.forgotPassword.requestSubtitle')}</div>
                                            </div>

                                            <div className="fv-row mb-8">
                                                <input
                                                    type="email"
                                                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                                                    name="email"
                                                    autoComplete="off"
                                                    className="form-control bg-transparent"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="d-flex flex-wrap justify-content-center pb-lg-0">
                                                <button type="submit" className="btn btn-primary me-4" disabled={submitting}>
                                                    <span className={submitting ? 'd-none' : 'indicator-label'}>{t('auth.common.submit')}</span>
                                                    {submitting && (
                                                        <span className="indicator-progress" style={{ display: 'block' }}>
                                                            {t('auth.common.sendingCode')}
                                                            <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                                                        </span>
                                                    )}
                                                </button>
                                                <Link to="/login" className="btn btn-light">{t('auth.common.cancel')}</Link>
                                            </div>
                                        </form>
                                    )}

                                    {step === 'verify' && (
                                        <form className="form w-100" onSubmit={handleVerifyCode} noValidate>
                                            <div className="text-center mb-10">
                                                <h1 className="text-gray-900 fw-bolder mb-3">{t('auth.forgotPassword.verifyTitle')}</h1>
                                                <div className="text-gray-500 fw-semibold fs-6">
                                                    {t('auth.forgotPassword.verifyCodeLead')}{' '}
                                                    <strong>{maskEmail(email)}</strong>
                                                </div>
                                            </div>

                                            <div className="fv-row mb-8">
                                                <label className="form-label fw-bolder text-dark fs-6">{t('auth.forgotPassword.verificationCodeLabel')}</label>
                                                <VerificationInput
                                                    ref={verificationInputRef}
                                                    length={6}
                                                    onComplete={(val) => {
                                                        setCode(val);
                                                    }}
                                                />
                                                <div className="text-center mt-3">
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm ${isResendDisabled ? 'btn-secondary' : 'btn-link'}`}
                                                        disabled={isResendDisabled || isResending || verifying}
                                                        onClick={resendCode}
                                                    >
                                                        {isResending ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                {t('auth.common.resending')}
                                                            </>
                                                        ) : isResendDisabled ? (
                                                            t('auth.forgotPassword.resendCodeIn', { seconds: resendTimer })
                                                        ) : (
                                                            t('auth.forgotPassword.resendCode')
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="d-flex flex-wrap justify-content-center pb-lg-0">
                                                <button type="submit" className="btn btn-primary me-4" disabled={verifying || !code || code.length !== 6}>
                                                    <span className={verifying ? 'd-none' : 'indicator-label'}>{t('auth.forgotPassword.verifyCode')}</span>
                                                    {verifying && (
                                                        <span className="indicator-progress" style={{ display: 'block' }}>
                                                            {t('auth.common.verifying')}
                                                            <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                                                        </span>
                                                    )}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-light" 
                                                    onClick={handleBackToRequest} 
                                                    disabled={verifying}
                                                >
                                                    {t('auth.common.back')}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {step === 'reset' && (
                                        <form className="form w-100" onSubmit={handleResetPassword} noValidate>
                                            <div className="text-center mb-10">
                                                <h1 className="text-gray-900 fw-bolder mb-3">{t('auth.forgotPassword.setNewTitle')}</h1>
                                                <div className="text-gray-500 fw-semibold fs-6">
                                                    {t('auth.forgotPassword.setNewVerifiedLead')}{' '}
                                                    <strong>{maskEmail(email)}</strong>.
                                                </div>
                                            </div>

                                            <div className="fv-row mb-8">
                                                <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.password')}</label>
                                                <div className="position-relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder={t('auth.forgotPassword.enterPasswordPlaceholder')}
                                                        name="password"
                                                        className={`form-control form-control-lg form-control-solid ${password && (isPasswordValid() ? 'is-valid' : 'is-invalid')}`}
                                                        value={password}
                                                        onChange={handlePasswordChange}
                                                        style={{ textTransform: 'none', paddingLeft: '40px' }}
                                                        required
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
                                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                                        placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
                                                        name="password_confirmation"
                                                        className={`form-control form-control-lg form-control-solid ${passwordConfirmation && (passwordValidation.match ? 'is-valid' : 'is-invalid')}`}
                                                        value={passwordConfirmation}
                                                        onChange={handlePasswordChange}
                                                        style={{ textTransform: 'none', paddingLeft: '40px' }}
                                                        required
                                                    />
                                                    <span
                                                        className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <i className={`fas fa-${showPasswordConfirmation ? 'eye-slash' : 'eye'}`}></i>
                                                    </span>
                                                </div>
                                                {!passwordValidation.match && passwordConfirmation && (
                                                    <div className="text-danger mt-2">{t('auth.passwordRules.doNotMatch')}</div>
                                                )}
                                            </div>

                                            <div className="fv-row mb-8">
                                                <div className="password-validation mt-3">
                                                    <div className={`validation-item ${passwordValidation.length ? 'text-success' : 'text-danger'}`}>
                                                        <i className={`fas fa-${passwordValidation.length ? 'check' : 'times'} me-2`}></i>
                                                        {t('auth.passwordRules.atLeast8')}
                                                    </div>
                                                    <div className={`validation-item ${passwordValidation.uppercase ? 'text-success' : 'text-danger'}`}>
                                                        <i className={`fas fa-${passwordValidation.uppercase ? 'check' : 'times'} me-2`}></i>
                                                        {t('auth.passwordRules.uppercase')}
                                                    </div>
                                                    <div className={`validation-item ${passwordValidation.lowercase ? 'text-success' : 'text-danger'}`}>
                                                        <i className={`fas fa-${passwordValidation.lowercase ? 'check' : 'times'} me-2`}></i>
                                                        {t('auth.passwordRules.lowercase')}
                                                    </div>
                                                    <div className={`validation-item ${passwordValidation.number ? 'text-success' : 'text-danger'}`}>
                                                        <i className={`fas fa-${passwordValidation.number ? 'check' : 'times'} me-2`}></i>
                                                        {t('auth.passwordRules.number')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex flex-wrap justify-content-center pb-lg-0">
                                                <button type="submit" className="btn btn-primary me-4" disabled={resetting || !isPasswordValid() || !verifiedCode || verifiedCode.length !== 6}>
                                                    <span className={resetting ? 'd-none' : 'indicator-label'}>{t('auth.forgotPassword.resetPassword')}</span>
                                                    {resetting && (
                                                        <span className="indicator-progress" style={{ display: 'block' }}>
                                                            {t('auth.common.resetting')}
                                                            <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                                                        </span>
                                                    )}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-light" 
                                                    onClick={handleBackToVerify} 
                                                    disabled={resetting}
                                                >
                                                    {t('auth.common.back')}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {step === 'done' && (
                                        <div className="w-100 text-center">
                                            <div className="text-center mb-10">
                                                <h1 className="text-gray-900 fw-bolder mb-3">{t('auth.forgotPassword.doneTitle')}</h1>
                                                <div className="text-gray-500 fw-semibold fs-6">
                                                    {t('auth.forgotPassword.doneSubtitle')}
                                                </div>
                                            </div>
                                            <Link to="/login" className="btn btn-primary">{t('auth.common.goToLogin')}</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;

