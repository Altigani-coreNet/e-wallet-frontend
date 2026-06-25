import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AUTH_ENDPOINTS } from '../../../utils/constants';

const CustomerSetPassword = () => {
    const { token: tokenParam } = useParams();
    const navigate = useNavigate();

    const token = useMemo(() => {
        if (!tokenParam) return '';
        try {
            return decodeURIComponent(tokenParam);
        } catch {
            return tokenParam;
        }
    }, [tokenParam]);

    const [checkingToken, setCheckingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenValid(false);
                setCheckingToken(false);
                return;
            }

            try {
                const response = await axios.get(AUTH_ENDPOINTS.CUSTOMER_SET_PASSWORD_VALIDATE, {
                    params: { token },
                    headers: { Accept: 'application/json' },
                });
                const payload = response.data || {};
                const isSuccess = payload.success === true || payload.status === true;
                setTokenValid(isSuccess);
                if (!isSuccess) {
                    toast.error(payload.message || 'This link is invalid or has expired.');
                }
            } catch (error) {
                setTokenValid(false);
                toast.error(error.response?.data?.message || 'This link is invalid or has expired.');
            } finally {
                setCheckingToken(false);
            }
        };

        validateToken();
    }, [token]);

    const passwordRules = useMemo(
        () => ({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            match: password !== '' && password === passwordConfirmation,
        }),
        [password, passwordConfirmation]
    );

    const isPasswordValid = Object.values(passwordRules).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast.error('Please meet all password requirements.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(
                AUTH_ENDPOINTS.CUSTOMER_SET_PASSWORD,
                {
                    token,
                    password,
                    password_confirmation: passwordConfirmation,
                },
                { headers: { Accept: 'application/json' } }
            );

            const payload = response.data || {};
            const isSuccess = payload.success === true || payload.status === true;
            if (isSuccess) {
                toast.success(payload.message || 'Password set successfully. You can now log in from the app.');
                setTokenValid(false);
                setPassword('');
                setPasswordConfirmation('');
                return;
            }

            toast.error(payload.message || 'Failed to set password.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to set password.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background:
                    'radial-gradient(circle at 20% 20%, #06056d 0, #04045a 35%, #020337 70%, #010120 100%)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    background: '#ffffff',
                    borderRadius: '14px',
                    boxShadow: '0 10px 40px rgba(2,3,55,0.45)',
                    padding: '32px 28px',
                }}
            >
                {checkingToken ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <span className="spinner-border text-primary" role="status" />
                        <p style={{ marginTop: '16px', color: '#6b7280' }}>Validating your link...</p>
                    </div>
                ) : !tokenValid ? (
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Link unavailable</h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                            This password setup link is invalid, already used, or has expired. Please contact
                            support to request a new one.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={() => navigate('/login')}
                        >
                            Go to login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        <h2 style={{ fontSize: '22px', marginBottom: '6px', textAlign: 'center' }}>
                            Set your password
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px', textAlign: 'center' }}>
                            Create a password to activate your account.
                        </p>

                        <label className="form-label fw-bold">Password</label>
                        <div className="input-group mb-3">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control form-control-solid"
                                name="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() => setShowPassword((prev) => !prev)}
                                tabIndex={-1}
                            >
                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                            </button>
                        </div>

                        <label className="form-label fw-bold">Confirm password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control form-control-solid mb-3"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: '13px' }}>
                            <li style={{ color: passwordRules.length ? '#16a34a' : '#9ca3af' }}>
                                {passwordRules.length ? '✓' : '•'} At least 8 characters
                            </li>
                            <li style={{ color: passwordRules.uppercase ? '#16a34a' : '#9ca3af' }}>
                                {passwordRules.uppercase ? '✓' : '•'} One uppercase letter
                            </li>
                            <li style={{ color: passwordRules.lowercase ? '#16a34a' : '#9ca3af' }}>
                                {passwordRules.lowercase ? '✓' : '•'} One lowercase letter
                            </li>
                            <li style={{ color: passwordRules.number ? '#16a34a' : '#9ca3af' }}>
                                {passwordRules.number ? '✓' : '•'} One number
                            </li>
                            <li style={{ color: passwordRules.match ? '#16a34a' : '#9ca3af' }}>
                                {passwordRules.match ? '✓' : '•'} Passwords match
                            </li>
                        </ul>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={submitting || !isPasswordValid}
                        >
                            {submitting ? 'Saving...' : 'Set password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CustomerSetPassword;
