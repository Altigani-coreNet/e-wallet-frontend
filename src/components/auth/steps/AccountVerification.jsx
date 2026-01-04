import React, { useState, useEffect, useRef, useCallback } from 'react';
import VerificationInput from '../../common/VerificationInput';
import Swal from 'sweetalert2';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import useRegistrationStore from '../../../stores/useRegistrationStore';

const AccountVerification = ({ formData, setFormData, onNextStep }) => {
    // Use registration store to save token
    const { setRegistrationToken, updateRegistrationProgress } = useRegistrationStore();
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStep, setVerificationStep] = useState('email');
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
            // Removed resetVerificationInputs() - inputs are reset before step change
        } catch (error) {
            console.error('SMS send error:', error);
            await Swal.fire({ icon: 'error', title: 'SMS Failed', text: 'Failed to send code.' });
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

    const isPasswordValid = () => {
        return Object.values(passwordValidation).every(value => value === true);
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

    // Function to mask email (show first 4 and last 4 characters)
    const maskEmail = (email) => {
        if (!email) return '';
        const [username, domain] = email.split('@');
        if (!domain) return email;

        const maskedUsername = username.length > 4
            ? `${username.slice(0, 4)}****${username.slice(-4)}`
            : username;

        return `${maskedUsername}@${domain}`;
    };

    // Function to mask phone (show only last 4 digits)
    const maskPhone = (phone) => {
        if (!phone) return '';
        return `****-****-${phone.slice(-4)}`;
    };

    // Get masked value based on verification step
    const getMaskedValue = () => {
        if (verificationStep === 'email') {
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
        if (isResendDisabled || isResending) return;
        
        setIsResending(true);
        setIsResendDisabled(true);
        
        try {
            if (verificationStep === 'email') {
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
            } else {
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
    }, [verificationStep, formData.email, formData.first_name, formData.last_name, formData.phone]);

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

    // Reset loading state when verification step changes
    useEffect(() => {
        setIsResending(false);
        setIsResendDisabled(false);
        setIsRegistering(false);
        setResendTimer(0);
    }, [verificationStep]);

    // Send code when component mounts or verification step changes
    useEffect(() => {
        if (verificationStep !== 'password') {
            sendVerificationCode();
            // Only reset on initial email step, not when transitioning to phone
            // (phone step reset is handled in handleVerificationComplete)
            if (verificationStep === 'email') {
                resetVerificationInputs();
            }
        }
    }, [verificationStep, sendVerificationCode]);

    const handleVerificationComplete = async (code) => {
        if (!verificationToken) {
            if (verificationStep === 'email') {
                await Swal.fire({ icon: 'error', title: 'Error', text: 'No verification token found. Please resend the email code.', confirmButtonText: 'OK' });
                return;
            }
        }

        setIsVerifying(true);
        try {
            if (verificationStep === 'email') {
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
                    // Reset inputs BEFORE changing step and sending SMS
                    resetVerificationInputs();
                    setVerificationStep('phone');
                    setVerificationToken(null);
                    // Send SMS after step change
                    sendSmsOtp(formData.phone);
                } else {
                    await Swal.fire({ icon: 'error', title: 'Invalid Code', text: data.message || 'Incorrect email code.', confirmButtonText: 'Try Again' });
                    resetVerificationInputs();
                }
            } else {
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

    // Show success message and next button when account is created
    if (accountCreated) {
        return (
            <div className="w-100">
                <div className="pb-10 pb-lg-15">
                    <h2 className="fw-bolder text-dark">Account Created Successfully!</h2>
                    <div className="text-muted fw-bold fs-6">
                        Your account has been created and you can now proceed to register your merchant
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
                            <span className="fs-7 mt-1">You can now proceed to register your merchant details or check your email for the next steps.</span>
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
                        Continue to Merchant Registration
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
            <div className="w-100">
                <div className="pb-10 pb-lg-15">
                    <h2 className="fw-bolder text-dark">Step 2: Account Verification & Security Setup</h2>
                    <div className="text-muted fw-bold fs-6">
                        Final step: Create a secure password to complete your account setup and protect your merchant account
                    </div>
                </div>

                <div className="fv-row mb-8">
                    <label className="form-label fw-bolder text-dark fs-6">Password</label>
                    <div className="position-relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`form-control form-control-lg form-control-solid ${isPasswordValid() ? 'is-valid' : 'is-invalid'}`}
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
                            className={`form-control form-control-lg form-control-solid ${passwordValidation.match ? 'is-valid' : 'is-invalid'}`}
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
                        <div className={`validation-item ${passwordValidation.length ? 'text-success' : 'text-danger'}`}>
                            <i className={`fas fa-${passwordValidation.length ? 'check' : 'times'} me-2`}></i>
                            At least 8 characters
                        </div>
                        <div className={`validation-item ${passwordValidation.uppercase ? 'text-success' : 'text-danger'}`}>
                            <i className={`fas fa-${passwordValidation.uppercase ? 'check' : 'times'} me-2`}></i>
                            One uppercase letter
                        </div>
                        <div className={`validation-item ${passwordValidation.lowercase ? 'text-success' : 'text-danger'}`}>
                            <i className={`fas fa-${passwordValidation.lowercase ? 'check' : 'times'} me-2`}></i>
                            One lowercase letter
                        </div>
                        <div className={`validation-item ${passwordValidation.number ? 'text-success' : 'text-danger'}`}>
                            <i className={`fas fa-${passwordValidation.number ? 'check' : 'times'} me-2`}></i>
                            One number
                        </div>
                        <div className={`validation-item ${passwordValidation.special ? 'text-success' : 'text-danger'}`}>
                            <i className={`fas fa-${passwordValidation.special ? 'check' : 'times'} me-2`}></i>
                            One special character
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        className="btn btn-lg btn-primary w-100 mb-5"
                        disabled={isRegistering}
                        onClick={async () => {
                            if (!isPasswordValid()) {
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
                                        // The step will be updated to 2 when they click "Continue to Merchant Registration"
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

    return (
        <div className="w-100">
            <div className="pb-10 pb-lg-15">
                <h2 className="fw-bolder text-dark">Step 2: Account Verification & Security Setup</h2>
                <div className="text-muted fw-bold fs-6">
                    {verificationStep === 'email' 
                        ? 'We\'ll verify your email address, phone number, and help you create a secure password for your account. This ensures your account is protected and you can receive important notifications.' 
                        : 'Now verify your phone number to complete the verification process and proceed to password setup.'}
                </div>
            </div>

            <div className="text-center mb-10">
                <span className="flex justify-center items-center mb-5">
                    <img alt="Verification" className="mh-125px" 
                         src="/assets/media/svg/misc/smartphone.svg" />
                </span>

                <div className="alert alert-primary mb-5">
                    {verificationStep === 'email' ? (
                        <div className="d-flex flex-column">
                            <span className="fw-bold fs-6">A verification code has been sent to your email:</span>
                            <span className="fs-7">{getMaskedValue()}</span>
                            <span className="fs-7 mt-2">Please check your inbox (and spam folder) and enter the code below.</span>
                        </div>
                    ) : (
                        <div className="d-flex flex-column">
                            <span className="fw-bold fs-6">A verification code has been sent to your phone:</span>
                            <span className="fs-7">{getMaskedValue()}</span>
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
                    key={verificationStep} // Force remount when step changes
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
                </div>
            </div>
            <div id="recaptcha-container" style={{ minHeight: 1 }}></div>
        </div>
    );
};

export default AccountVerification;

