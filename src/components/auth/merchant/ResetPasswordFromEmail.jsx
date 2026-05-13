import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AUTH_ENDPOINTS } from '../../../utils/constants';

const ResetPasswordFromEmail = () => {
    const { t } = useTranslation();
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
                    toast.error(payload.message || t('auth.resetFromEmail.toastInvalidToken'));
                }
            } catch (error) {
                setTokenValid(false);
                toast.error(error.response?.data?.message || t('auth.resetFromEmail.toastInvalidToken'));
            } finally {
                setCheckingToken(false);
            }
        };

        validateToken();
    }, [token, t]);

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
            toast.error(t('auth.resetFromEmail.toastMeetAll'));
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
                toast.success(payload.message || t('auth.resetFromEmail.toastSuccess'));
                navigate('/login');
                return;
            }

            toast.error(payload.message || t('auth.resetFromEmail.toastFailed'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('auth.resetFromEmail.toastFailed'));
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
                                alt={t('auth.common.fastPosLogoAlt')}
                            />
                            <img
                                className="theme-dark-show mx-auto mw-100 w-150px w-lg-300px mb-10 mb-lg-20"
                                src="/FastPOS_logo-03.png"
                                alt={t('auth.common.fastPosLogoAlt')}
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
                                alt={t('auth.common.fastPosLogoAlt')}
                            />
                        </div>

                        <div className="bg-body d-flex flex-column flex-center rounded-4 w-md-600px py-15 px-5">
                            <div className="d-flex flex-center flex-column align-items-stretch w-md-400px">
                        {checkingToken ? (
                            <div className="form w-100" aria-busy="true" aria-label={t('auth.common.ariaLoading')}>
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
                                <h1 className="text-gray-900 fw-bolder mb-3">{t('auth.resetFromEmail.invalidTitle')}</h1>
                                <div className="text-gray-500 fw-semibold fs-6 mb-8">
                                    {t('auth.resetFromEmail.invalidSubtitle')}
                                </div>
                                <Link to="/forgot-password" className="btn btn-primary">{t('auth.resetFromEmail.goToForgot')}</Link>
                            </div>
                        ) : (
                            <form className="form w-100" onSubmit={handleSubmit} noValidate>
                                <div className="text-center mb-10">
                                    <h1 className="text-gray-900 fw-bolder mb-3">{t('auth.resetFromEmail.setNewTitle')}</h1>
                                    <div className="text-gray-500 fw-semibold fs-6">
                                        {t('auth.resetFromEmail.setNewSubtitle')}
                                    </div>
                                </div>

                                <div className="fv-row mb-8">
                                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.password')}</label>
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
                                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.common.confirmPassword')}</label>
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
                                    <div className={passwordValidation.length ? 'text-success' : 'text-gray-500'}>{t('auth.passwordRules.atLeast8')}</div>
                                    <div className={passwordValidation.uppercase ? 'text-success' : 'text-gray-500'}>{t('auth.passwordRules.uppercase')}</div>
                                    <div className={passwordValidation.lowercase ? 'text-success' : 'text-gray-500'}>{t('auth.passwordRules.lowercase')}</div>
                                    <div className={passwordValidation.number ? 'text-success' : 'text-gray-500'}>{t('auth.passwordRules.number')}</div>
                                    <div className={passwordValidation.special ? 'text-success' : 'text-gray-500'}>{t('auth.passwordRules.special')}</div>
                                    <div className={passwordValidation.match ? 'text-success' : 'text-gray-500'}>{t('auth.passwordRules.match')}</div>
                                </div>

                                <div className="d-flex flex-wrap justify-content-center pb-lg-0">
                                    <button type="submit" className="btn btn-primary me-4" disabled={submitting || !isPasswordValid}>
                                        {submitting ? t('auth.common.resetting') : t('auth.forgotPassword.resetPassword')}
                                    </button>
                                    <Link to="/login" className="btn btn-light">{t('auth.common.cancel')}</Link>
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
