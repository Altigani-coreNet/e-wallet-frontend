import React, { useState, useEffect, useRef, useCallback } from 'react';
import VerificationInput from '../../common/VerificationInput';
import Swal from 'sweetalert2';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import useRegistrationStore from '../../../stores/useRegistrationStore';

const AccountVerification = ({ formData, setFormData, onNextStep, onPreviousStep, onPreviousRef, onPreviousToStep0, onStartNewRegistration }) => {
    // Use registration store to save token
    const { setRegistrationToken, updateRegistrationProgress } = useRegistrationStore();
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState(null); // null = selection, 'email' or 'phone' = chosen method
    const [verificationStep, setVerificationStep] = useState(null); // null = selection screen, 'email'/'phone' = verifying, 'password' = password setup
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
    
    // Firebase init (singleton) using same credentials used elsewhere
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
            
            // Parse Firebase error code for better error messages
            let errorMessage = 'Failed to send verification code. Please try again or select email verification instead.';
            let errorTitle = 'SMS Failed';
            
            if (error.code) {
                switch (error.code) {
                    case 'auth/invalid-app-credential':
                        errorTitle = 'Error';
                        errorMessage = 'There was an error sending the message. Please try again or use email verification instead.';
                        break;
                    case 'auth/invalid-phone-number':
                        errorTitle = 'Invalid Phone Number';
                        errorMessage = 'The phone number format is invalid. Please check and try again.';
                        break;
                    case 'auth/too-many-requests':
                        errorTitle = 'Too Many Requests';
                        errorMessage = 'Too many SMS requests. Please wait a few minutes before trying again.';
                        break;
                    case 'auth/quota-exceeded':
                        errorTitle = 'Quota Exceeded';
                        errorMessage = 'SMS quota exceeded. Please contact support or try again later.';
                        break;
                    case 'auth/captcha-check-failed':
                        errorTitle = 'reCAPTCHA Error';
                        errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
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
                confirmButtonText: 'Proceed registration',
                cancelButtonText: 'Start new registration',
                width: '500px'
            });
            if (result.dismiss === Swal.DismissReason.cancel && typeof onStartNewRegistration === 'function') {
                onStartNewRegistration();
            }
        }
    };

    // Password validation rules
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

    // Password strength: only length/upper/lower/number/special, independent of confirmation
    const isPasswordStrong = () => {
        const { length, uppercase, lowercase, number, special } = passwordValidation;
        return length && uppercase && lowercase && number && special;
    };

    // Confirmation validity: only checks if it matches password (and both not empty)
    const isConfirmationValid = () => {
        return (
            passwordData.password &&
            passwordData.password_confirmation &&
            passwordData.password === passwordData.password_confirmation
        );
    };

    // Helpers to control when the password fields show valid/invalid state
    const getPasswordInputClass = () => {
        // Before the user starts typing, don't show valid/invalid state on the main password field
        if (!passwordData.password) {
            return 'form-control form-control-lg form-control-solid';
        }
        return `form-control form-control-lg form-control-solid ${isPasswordStrong() ? 'is-valid' : 'is-invalid'}`;
    };

    const getPasswordConfirmationClass = () => {
        // Confirmation field stays neutral until the user starts typing in it
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

    // Function to display email (no masking)
    const maskEmail = (email) => {
        // Show full email without masking, as requested
        return email || '';
    };

    // Function to mask phone (show only last 4 digits)
    const maskPhone = (phone) => {
        if (!phone) return '';
        return `****-****-${phone.slice(-4)}`;
    };

    // Get masked value based on verification method
    const getMaskedValue = () => {
        if (verificationMethod === 'email') {
            return maskEmail(formData.email);
        }
        return maskPhone(formData.phone);
    };

    // Function to start resend timer
    const startResendTimer = () => {
        setResendTimer(60);
        setIsResendDisabled(true);
    };

    // Function to send verification code
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
                        await Swal.fire({ icon: 'error', title: 'Validation Error', html: errorMessages.join('<br>'), confirmButtonText: 'OK' });
                    } else {
                        throw new Error(data.message || 'Failed to send verification code');
                    }
                }
            } else if (verificationMethod === 'phone') {
                await sendSmsOtp(formData.phone);
            }
        } catch (error) {
            console.error('Error sending code:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to send verification code. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setIsResending(false);
        }
    }, [verificationMethod, formData.email, formData.first_name, formData.last_name, formData.phone]);

    // Reset verification input fields
    const resetVerificationInputs = () => {
        if (verificationInputRef.current) {
            verificationInputRef.current.resetInputs();
        }
    };

    // Timer countdown effect
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

    // Reset loading state when verification method changes
    useEffect(() => {
        setIsResending(false);
        setIsResendDisabled(false);
        setIsRegistering(false);
        setResendTimer(0);
    }, [verificationMethod]);

    // Reset verification inputs when verification step matches method (verification UI is shown)
    useEffect(() => {
        if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
            resetVerificationInputs();
        }
    }, [verificationMethod, verificationStep]);

    // Send verification code when verification step is set and matches the selected method
    // This happens after the component re-renders with the verification UI (so reCAPTCHA container exists)
    useEffect(() => {
        // Only send if:
        // 1. Method is selected
        // 2. Step matches method (we're on verification screen)
        // 3. Not on password step
        // 4. Haven't already sent code (no token for email, no confirmation result for phone)
        const shouldSendCode = verificationMethod && 
                              verificationStep === verificationMethod && 
                              verificationStep !== 'password' &&
                              ((verificationMethod === 'email' && !verificationToken) || 
                               (verificationMethod === 'phone' && !confirmationResultRef.current));
        
        if (shouldSendCode) {
            // Small delay to ensure DOM is ready (especially for reCAPTCHA container)
            const timer = setTimeout(() => {
                sendVerificationCode();
            }, 300);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verificationMethod, verificationStep]); // sendVerificationCode is stable useCallback, safe to omit

    const handleVerificationComplete = async (code) => {
        if (!verificationToken && verificationMethod === 'email') {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'No verification token found. Please resend the email code.', confirmButtonText: 'OK' });
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
                    await Swal.fire({ icon: 'success', title: 'Email Verified', text: 'Email verification successful.', confirmButtonText: 'Continue' });
                    resetVerificationInputs();
                    // Go directly to password setup after email verification
                    setVerificationStep('password');
                } else {
                    await Swal.fire({ icon: 'error', title: 'Invalid Code', text: data.message || 'Incorrect email code.', confirmButtonText: 'Try Again' });
                    resetVerificationInputs();
                }
            } else if (verificationMethod === 'phone') {
                if (!code || code.length !== 6) {
                    await Swal.fire({ icon: 'error', title: 'Invalid Code', text: 'Please enter the 6-digit SMS code.', confirmButtonText: 'OK' });
                    return;
                }
                if (!confirmationResultRef.current) {
                    await Swal.fire({ icon: 'error', title: 'Error', text: 'No SMS verification in progress. Please resend the code.', confirmButtonText: 'OK' });
                    return;
                }
                await confirmationResultRef.current.confirm(code);
                await Swal.fire({ icon: 'success', title: 'Phone Verified', text: 'Phone verification successful.', confirmButtonText: 'Continue' });
                // Go directly to password setup after phone verification
                setVerificationStep('password');
            }
        } catch (error) {
            console.error('Verification error:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: 'There was an error verifying your code. Please try again.',
                confirmButtonText: 'OK'
            });
            resetVerificationInputs();
        } finally {
            setIsVerifying(false);
        }
    };

    // Handle going back to selection screen
    const handleGoBackToSelection = () => {
        // Reset verification state
        setVerificationStep(null);
        setVerificationToken(null);
        setVerificationMethod(null);
        confirmationResultRef.current = null;
        resetVerificationInputs();
        setIsResending(false);
        setIsResendDisabled(false);
        setResendTimer(0);
    };

    // Handle Previous button click from parent
    // If on verification screen -> go to selection
    // If on selection screen -> go to step 0
    const handlePreviousFromParent = useCallback(() => {
        // Check if we're on verification screen (step matches method and not password)
        if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
            // We're on verification screen, go back to selection
            setVerificationStep(null);
            setVerificationToken(null);
            setVerificationMethod(null);
            confirmationResultRef.current = null;
            resetVerificationInputs();
            setIsResending(false);
            setIsResendDisabled(false);
            setResendTimer(0);
        } else {
            // We're on selection screen, go back to step 0
            if (onPreviousToStep0) {
                onPreviousToStep0();
            }
        }
    }, [verificationMethod, verificationStep, onPreviousToStep0]);

    // Set the handler on the ref so parent can call it
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

    // Show verification method selection screen first
    // Show selection if step is null (initial state) or if method is selected but step doesn't match yet (user can change mind)
    // Don't show selection if we're actively verifying (step matches method) or on password step
    const isSelectingMethod = verificationStep === null || (verificationMethod && verificationStep !== verificationMethod && verificationStep !== 'password');
    
    if (isSelectingMethod) {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">Step 2: Account Verification & Security Setup</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">
                        Choose your preferred verification method. We'll send you a code to verify your account.
                    </div>
                </div>

                <div className="text-center mb-6 mb-lg-10">
                    <span className="flex justify-center items-center mb-5">
                        <img alt="Verification" className="mh-75px mh-lg-125px" 
                             src="/assets/media/svg/misc/smartphone.svg" />
                    </span>
                </div>

                <div className="mb-10">
                    <label className="form-label fw-bolder text-dark fs-6 mb-5">
                        Select Verification Method
                    </label>
                    
                    {/*begin::Option - Email*/}
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
                            <span className="text-gray-900 fw-bold d-block fs-5 fs-md-3">Email Verification</span>
                            <span className="text-muted fw-semibold fs-7 fs-md-6 text-break">
                                We'll send a verification code to: {maskEmail(formData.email)}
                            </span>
                        </span>
                    </label>
                    {/*end::Option - Email*/}

                    {/*begin::Option - Phone*/}
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
                            <span className="text-gray-900 fw-bold d-block fs-5 fs-md-3">Phone Verification</span>
                            <span className="text-muted fw-semibold fs-7 fs-md-6 text-break">
                                We'll send a verification code to: {maskPhone(formData.phone)}
                            </span>
                        </span>
                    </label>
                    {/*end::Option - Phone*/}

                    <div className="text-center mt-10">
                        <button
                            type="button"
                            className="btn btn-lg btn-primary w-100 mb-5"
                            disabled={!verificationMethod || isResending}
                            onClick={() => {
                                if (verificationMethod) {
                                    // Set the step to match the method
                                    // The code will be sent automatically via useEffect after component re-renders
                                    setVerificationStep(verificationMethod);
                                }
                            }}
                        >
                            {isResending ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending Code...
                                </>
                            ) : (
                                <>
                                    Continue with {verificationMethod === 'email' ? 'Email' : verificationMethod === 'phone' ? 'Phone' : ''} Verification
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

    // Show success message and next button when account is created
    if (accountCreated) {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">Account Created Successfully!</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">
                        Your account has been created and you can now proceed to register your partner
                    </div>
                </div>

                <div className="text-center mb-10">
                    <span className="flex justify-center items-center mb-5">
                        <img alt="Success" className="mh-125px" 
                             src="/assets/media/svg/misc/smartphone.svg" />
                    </span>

                    <div className="alert alert-success mb-5">
                        <div className="d-flex flex-column">
                            <span className="fw-bold fs-6">Welcome {userData?.name}!</span>
                            <span className="fs-7">Your account has been created successfully.</span>
                            <span className="fs-7 mt-1">You can now proceed to register your partner details or check your email for the next steps.</span>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        className="btn btn-lg btn-primary w-100 mb-5"
                        onClick={() => {
                            // Note: onNextStep will handle moving to step 2 and saving progress
                            // We don't need to save here as the parent component will save after step change
                            if (onNextStep) {
                                onNextStep();
                            }
                        }}
                    >
                        Continue to Partner Registration
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
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">Step 2: Account Verification & Security Setup</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">
                        Final step: Create a secure password to complete your account setup and protect your partner account
                    </div>
                </div>

                <div className="fv-row mb-8">
                    <label className="form-label fw-bolder text-dark fs-6">Password</label>
                    <div className="position-relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={getPasswordInputClass()}
                            placeholder="Enter password"
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
                    <label className="form-label fw-bolder text-dark fs-6">Confirm Password</label>
                    <div className="position-relative">
                        <input
                            type={showPasswordConfirmation ? "text" : "password"}
                            className={getPasswordConfirmationClass()}
                            placeholder="Confirm password"
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
                        <div className="invalid-feedback">
                            Passwords do not match
                        </div>
                    )}
                </div>
                <div className="fv-row mb-8">
                    <div className="password-validation mt-3">
                        <div className={`validation-item ${passwordValidation.length ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.length ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            At least 8 characters
                        </div>
                        <div className={`validation-item ${passwordValidation.uppercase ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.uppercase ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            One uppercase letter
                        </div>
                        <div className={`validation-item ${passwordValidation.lowercase ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.lowercase ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            One lowercase letter
                        </div>
                        <div className={`validation-item ${passwordValidation.number ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.number ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            One number
                        </div>
                        <div className={`validation-item ${passwordValidation.special ? 'text-success' : passwordData.password ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.special ? 'fa-check' : passwordData.password ? 'fa-times' : ''}`}></i>
                            One special character
                        </div>
                        <div className={`validation-item  ${passwordValidation.match ? 'text-success' : (passwordData.password || passwordData.password_confirmation) ? 'text-danger' : 'text-gray-500'}`}>
                            <i className={`fas me-2 ${passwordValidation.match ? 'fa-check' : (passwordData.password || passwordData.password_confirmation) ? 'fa-times' : ''}`}></i>
                            Password and confirmation must match
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        className="btn btn-lg btn-primary w-100 mb-5"
                        disabled={isRegistering}
                        onClick={async () => {
                            // Require strong password AND matching confirmation
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
                                    
                                    // Store token in localStorage for future requests
                                    if (token) {
                                        localStorage.setItem('auth_token', token);
                                        localStorage.setItem('user_data', JSON.stringify(userData));
                                        
                                        // Save token to registration store
                                        // Note: We save step 1 here (current step) because user hasn't moved to step 2 yet
                                        // The step will be updated to 2 when they click "Continue to Partner Registration"
                                        setRegistrationToken(token, userData);
                                        updateRegistrationProgress(1, formData); // Save current step (1)
                                    }
                                    
                                    setUserData(userData);
                                    setAccountCreated(true);
                                } else {
                                    throw new Error(data.message || 'Registration failed');
                                }
                            } catch (error) {
                                console.error('Registration error:', error);
                                
                                // Handle validation errors
                                if (error.response?.status === 422) {
                                    const errorMessages = Object.values(error.response.data.errors)
                                        .flat()
                                        .join('<br>');
                                    
                                    await Swal.fire({
                                        icon: 'error',
                                        title: 'Validation Error',
                                        html: errorMessages,
                                        confirmButtonText: 'OK'
                                    });
                                } else {
                                    await Swal.fire({
                                        icon: 'error',
                                        title: 'Registration Failed',
                                        text: error.message || 'Failed to create account. Please try again.',
                                        confirmButtonText: 'OK'
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
                                Creating Account...
                            </>
                        ) : (
                            'Set Password & Complete Registration'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Only show verification UI if method is selected and step matches
    if (verificationMethod && verificationStep === verificationMethod && verificationStep !== 'password') {
        return (
            <div className="w-100 min-w-0 overflow-hidden">
                <div className="pb-6 pb-lg-15">
                    <h2 className="fw-bolder text-dark fs-4 fs-lg-2">Step 2: Account Verification & Security Setup</h2>
                    <div className="text-muted fw-bold fs-7 fs-lg-6">
                        {verificationMethod === 'email' 
                            ? 'We\'ve sent a verification code to your email address. Enter the code below to verify your account and proceed to password setup.' 
                            : 'We\'ve sent a verification code to your phone number. Enter the code below to verify your account and proceed to password setup.'}
                    </div>
                </div>

            <div className="text-center mb-6 mb-lg-10">
                <span className="flex justify-center items-center mb-5">
                    <img alt="Verification" className="mh-75px mh-lg-125px" 
                         src="/assets/media/svg/misc/smartphone.svg" />
                </span>

                <div className="alert alert-primary mb-5">
                    {verificationMethod === 'email' ? (
                        <div className="d-flex flex-column min-w-0">
                            <span className="fw-bold fs-7 fs-md-6">A verification code has been sent to your email:</span>
                            <span className="fs-7 text-break">{getMaskedValue()}</span>
                            <span className="fs-7 mt-2">Please check your inbox (and spam folder) and enter the code below.</span>
                        </div>
                    ) : (
                        <div className="d-flex flex-column min-w-0">
                            <span className="fw-bold fs-7 fs-md-6">A verification code has been sent to your phone:</span>
                            <span className="fs-7 text-break">{getMaskedValue()}</span>
                            <span className="fs-7 mt-2">Please check your SMS messages and enter the code below.</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-10">
                <div className="fw-bolder text-start text-dark fs-6 mb-1 ms-1">
                    Type your 6 digit security code
                </div>

                <VerificationInput 
                    key={verificationMethod} // Force remount when method changes
                    ref={verificationInputRef}
                    length={6}
                    onComplete={handleVerificationComplete}
                />

                {isVerifying && (
                    <div className="d-flex justify-content-center mt-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Verifying...</span>
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
                                    Sending Code...
                                </>
                            ) : isResendDisabled ? (
                                `Resend Code in ${resendTimer}s`
                            ) : (
                                'Resend Code'
                            )}
                        </button>
                        
                        <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={handleGoBackToSelection}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to Change Method
                        </button>
                    </div>
                </div>
            </div>
            <div id="recaptcha-container" style={{ minHeight: 1 }}></div>
        </div>
        );
    }

    // Fallback - should not reach here, but return null if we do
    return null;
};

export default AccountVerification;
