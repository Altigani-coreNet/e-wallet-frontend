import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import { MerchantAuthPageLayout } from './merchantAuthShell';

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

    const passwordValidation = useMemo(
        () => ({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
            match: password !== '' && password === passwordConfirmation,
        }),
        [password, passwordConfirmation]
    );

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    const { cardTitle, cardSub } = useMemo(() => {
        if (checkingToken) {
            return { cardTitle: null, cardSub: null };
        }
        if (!tokenValid) {
            return {
                cardTitle: t('auth.resetFromEmail.invalidTitle'),
                cardSub: t('auth.resetFromEmail.invalidSubtitle'),
            };
        }
        return {
            cardTitle: t('auth.resetFromEmail.setNewTitle'),
            cardSub: t('auth.resetFromEmail.setNewSubtitle'),
        };
    }, [checkingToken, tokenValid, t]);

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
        <MerchantAuthPageLayout
            cardTitle={cardTitle}
            cardSub={cardSub}
            asideHeadlineBefore={t('auth.resetFromEmail.asideHeadlineBefore')}
            asideHeadlineAccent={t('auth.resetFromEmail.asideHeadlineAccent')}
            asideSub={t('auth.resetFromEmail.asideSub')}
            showAsideFeatures={false}
            showAsideTrust={false}
            showMobileMarketing={false}
        >
            {checkingToken ? (
                <div className="form w-100" aria-busy="true" aria-label={t('auth.common.ariaLoading')}>
                    <div className="placeholder-glow mb-3 d-flex justify-content-center">
                        <span className="placeholder col-8 col-lg-6 rounded" style={{ height: '2rem' }} />
                    </div>
                    <div className="placeholder-glow d-flex justify-content-center mb-8">
                        <span className="placeholder col-10 col-lg-8 rounded" style={{ height: '0.9rem' }} />
                    </div>
                    <div className="placeholder-glow mb-2">
                        <span className="placeholder col-4 rounded" style={{ height: '0.85rem' }} />
                    </div>
                    <div className="placeholder-glow mb-8">
                        <span className="placeholder col-12 rounded-2" style={{ height: 'calc(1.5em + 1.65rem + 2px)' }} />
                    </div>
                    <div className="placeholder-glow mb-2">
                        <span className="placeholder col-5 rounded" style={{ height: '0.85rem' }} />
                    </div>
                    <div className="placeholder-glow mb-8">
                        <span className="placeholder col-12 rounded-2" style={{ height: 'calc(1.5em + 1.65rem + 2px)' }} />
                    </div>
                </div>
            ) : !tokenValid ? (
                <div className="text-center w-100">
                    <div className="ml-actions-row">
                        <Link to="/forgot-password" className="ml-btn-primary">
                            {t('auth.resetFromEmail.goToForgot')}
                        </Link>
                    </div>
                </div>
            ) : (
                <form className="form w-100" onSubmit={handleSubmit} noValidate>
                    <label className="ml-label" htmlFor="reset-email-password">
                        {t('auth.common.password')}
                    </label>
                    <div className="ml-input-wrap ml-password-wrap">
                        <span className="ml-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="reset-email-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            autoComplete="new-password"
                            className="ml-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="ml-password-toggle"
                            onClick={() => setShowPassword((prev) => !prev)}
                            tabIndex={-1}
                            aria-label={showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
                        >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>

                    <label className="ml-label" htmlFor="reset-email-password-confirm">
                        {t('auth.common.confirmPassword')}
                    </label>
                    <div className="ml-input-wrap ml-password-wrap">
                        <span className="ml-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="reset-email-password-confirm"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            name="password_confirmation"
                            autoComplete="new-password"
                            className="ml-field"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="ml-password-toggle"
                            onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                            tabIndex={-1}
                            aria-label={
                                showPasswordConfirmation ? t('auth.common.hidePassword') : t('auth.common.showPassword')
                            }
                        >
                            <i className={`bi ${showPasswordConfirmation ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>

                    <div className="ml-password-rules">
                        <div className={`ml-password-rule ${passwordValidation.length ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            {t('auth.passwordRules.atLeast8')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.uppercase ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            {t('auth.passwordRules.uppercase')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.lowercase ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            {t('auth.passwordRules.lowercase')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.number ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            {t('auth.passwordRules.number')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.special ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            {t('auth.passwordRules.special')}
                        </div>
                        <div className={`ml-password-rule ${passwordValidation.match ? 'ml-password-rule--ok' : 'ml-password-rule--bad'}`}>
                            {t('auth.passwordRules.match')}
                        </div>
                    </div>

                    <div className="ml-actions-row">
                        <button type="submit" className="ml-btn-primary" disabled={submitting || !isPasswordValid}>
                            {submitting ? t('auth.common.resetting') : t('auth.forgotPassword.resetPassword')}
                        </button>
                        <Link to="/login" className="ml-btn-outline">
                            {t('auth.common.cancel')}
                        </Link>
                    </div>
                </form>
            )}
        </MerchantAuthPageLayout>
    );
};

export default ResetPasswordFromEmail;
