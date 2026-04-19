import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AUTH_ENDPOINTS } from '../../utils/constants';

const ResetPasswordFromEmail = () => {
    const { token: tokenParam } = useParams();
    const token = (() => {
        if (!tokenParam) return '';
        try {
            return decodeURIComponent(tokenParam);
        } catch {
            return tokenParam;
        }
    })();
    const navigate = useNavigate();

    const [checkingToken, setCheckingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenValid(false);
                setCheckingToken(false);
                return;
            }

            try {
                const response = await axios.get(AUTH_ENDPOINTS.PASSWORD_VALIDATE_RESET_TOKEN, {
                    params: { token },
                });
                const payload = response.data || {};
                const isSuccess = payload.success === true || payload.status === true;
                setTokenValid(isSuccess);
                if (!isSuccess) {
                    toast.error(payload.message || 'Invalid or expired reset token.');
                }
            } catch (error) {
                setTokenValid(false);
                toast.error(error.response?.data?.message || 'Invalid or expired reset token.');
            } finally {
                setCheckingToken(false);
            }
        };

        validateToken();
    }, [token]);

    const passwordValidation = useMemo(() => ({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
        match: password !== '' && password === passwordConfirmation,
    }), [password, passwordConfirmation]);

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast.error('Please meet all password requirements.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(
                AUTH_ENDPOINTS.PASSWORD_RESET_WITH_TOKEN,
                {
                    token,
                    password,
                    password_confirmation: passwordConfirmation,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const payload = response.data || {};
            const isSuccess = payload.success === true || payload.status === true;
            if (isSuccess) {
                toast.success(payload.message || 'Password reset successfully.');
                navigate('/login');
                return;
            }

            toast.error(payload.message || 'Failed to reset password.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                body {
                    background-image: url('/silder/4.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }
                [data-bs-theme="dark"] body {
                    background-image: url('/silder/4.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }
            `}</style>

            <div className="d-flex flex-column flex-root" id="kt_app_root" style={{ minHeight: '100vh' }}>
                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '100vh' }}>
                    {/* Left side - Branding - Hidden on small screens */}
                    <div className="d-none d-lg-flex justify-content-center align-items-center" style={{ flex: '1', minHeight: '100vh' }}>
                        <div className="d-flex flex-column flex-center p-10">
                            <img
                                className="theme-light-show mx-auto mw-100 w-150px w-lg-300px mb-10 mb-lg-20"
                                src="/FastPOS_logo-03.png"
                                alt="FastPOS Logo"
                            />
                            <img
                                className="theme-dark-show mx-auto mw-100 w-150px w-lg-300px mb-10 mb-lg-20"
                                src="/FastPOS_logo-03.png"
                                alt="FastPOS Logo"
                            />
                        </div>
                    </div>

                    {/* Right side - Reset Form */}
                    <div className="d-flex flex-column justify-content-center align-items-center p-12" style={{ flex: '1', minHeight: '100vh' }}>
                        {/* Small-screen logo */}
                        <div className="d-flex d-lg-none justify-content-center mb-5">
                            <img
                                className="mx-auto mw-100 w-150px"
                                src="/FastPOS_logo-03.png"
                                alt="FastPOS Logo"
                            />
                        </div>

                        <div className="bg-body d-flex flex-column flex-center rounded-4 w-md-600px py-15 px-5">
                            <div className="d-flex flex-center flex-column align-items-stretch w-md-400px">
                        {checkingToken ? (
                            <div className="form w-100" aria-busy="true" aria-label="Loading">
                                <div className="text-center mb-10">
                                    <div className="placeholder-glow mb-3 d-flex justify-content-center">
                                        <span className="placeholder col-8 col-lg-6 rounded" style={{ height: '2rem' }}></span>
                                    </div>
                                    <div className="placeholder-glow d-flex justify-content-center">
                                        <span className="placeholder col-10 col-lg-8 rounded" style={{ height: '0.9rem' }}></span>
                                    </div>
                                </div>

                                <div className="fv-row mb-8">
                                    <div className="placeholder-glow mb-2">
                                        <span className="placeholder col-4 rounded" style={{ height: '0.85rem' }}></span>
                                    </div>
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-12 rounded-2" style={{ height: 'calc(1.5em + 1.65rem + 2px)' }}></span>
                                    </div>
                                </div>

                                <div className="fv-row mb-8">
                                    <div className="placeholder-glow mb-2">
                                        <span className="placeholder col-5 rounded" style={{ height: '0.85rem' }}></span>
                                    </div>
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-12 rounded-2" style={{ height: 'calc(1.5em + 1.65rem + 2px)' }}></span>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    {[6, 5, 5, 4, 5, 6].map((cols, i) => (
                                        <div key={i} className="placeholder-glow mb-2">
                                            <span className={`placeholder col-${cols} rounded`} style={{ height: '0.75rem' }}></span>
                                        </div>
                                    ))}
                                </div>

                                <div className="d-flex flex-wrap justify-content-center gap-3 pb-lg-0">
                                    <div className="placeholder-glow">
                                        <span className="placeholder rounded" style={{ width: '140px', height: '42px' }}></span>
                                    </div>
                                    <div className="placeholder-glow">
                                        <span className="placeholder rounded" style={{ width: '100px', height: '42px' }}></span>
                                    </div>
                                </div>
                            </div>
                        ) : !tokenValid ? (
                            <div className="text-center">
                                <h1 className="text-gray-900 fw-bolder mb-3">Reset Link Invalid</h1>
                                <div className="text-gray-500 fw-semibold fs-6 mb-8">
                                    This link is invalid or expired. Please request a new password reset link.
                                </div>
                                <Link to="/forgot-password" className="btn btn-primary">Go to Forgot Password</Link>
                            </div>
                        ) : (
                            <form className="form w-100" onSubmit={handleSubmit} noValidate>
                                <div className="text-center mb-10">
                                    <h1 className="text-gray-900 fw-bolder mb-3">Set New Password</h1>
                                    <div className="text-gray-500 fw-semibold fs-6">
                                        Enter your new password and confirmation.
                                    </div>
                                </div>

                                <div className="fv-row mb-8">
                                    <label className="form-label fw-bolder text-dark fs-6">Password</label>
                                    <div className="position-relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            className="form-control form-control-lg form-control-solid"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{ textTransform: 'none', paddingLeft: '40px' }}
                                            required
                                        />
                                        <span
                                            className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                                            onClick={() => setShowPassword((prev) => !prev)}
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
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            name="password_confirmation"
                                            className="form-control form-control-lg form-control-solid"
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            style={{ textTransform: 'none', paddingLeft: '40px' }}
                                            required
                                        />
                                        <span
                                            className="btn btn-sm btn-icon position-absolute translate-middle-y top-50 start-0 ms-2"
                                            onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <i className={`fas fa-${showPasswordConfirmation ? 'eye-slash' : 'eye'}`}></i>
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-8 fs-7">
                                    <div className={passwordValidation.length ? 'text-success' : 'text-gray-500'}>At least 8 characters</div>
                                    <div className={passwordValidation.uppercase ? 'text-success' : 'text-gray-500'}>One uppercase letter</div>
                                    <div className={passwordValidation.lowercase ? 'text-success' : 'text-gray-500'}>One lowercase letter</div>
                                    <div className={passwordValidation.number ? 'text-success' : 'text-gray-500'}>One number</div>
                                    <div className={passwordValidation.special ? 'text-success' : 'text-gray-500'}>One special character</div>
                                    <div className={passwordValidation.match ? 'text-success' : 'text-gray-500'}>Password and confirmation must match</div>
                                </div>

                                <div className="d-flex flex-wrap justify-content-center pb-lg-0">
                                    <button type="submit" className="btn btn-primary me-4" disabled={submitting || !isPasswordValid}>
                                        {submitting ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    <Link to="/login" className="btn btn-light">Cancel</Link>
                                </div>
                            </form>
                        )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordFromEmail;
