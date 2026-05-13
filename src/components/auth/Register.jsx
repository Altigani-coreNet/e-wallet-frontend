import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { register, loading, error, isAuthenticated, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/merchant/dashboard');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validate = () => {
        const errors = {};

        if (!formData.first_name) {
            errors.first_name = t('auth.adminRegister.firstNameRequired');
        }

        if (!formData.last_name) {
            errors.last_name = t('auth.adminRegister.lastNameRequired');
        }

        if (!formData.email) {
            errors.email = t('auth.adminRegister.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = t('auth.adminRegister.emailInvalid');
        }

        if (!formData.phone) {
            errors.phone = t('auth.adminRegister.phoneRequired');
        }

        if (!formData.password) {
            errors.password = t('auth.adminRegister.passwordRequired');
        } else if (formData.password.length < 6) {
            errors.password = t('auth.adminRegister.passwordMin');
        }

        if (!formData.password_confirmation) {
            errors.password_confirmation = t('auth.adminRegister.confirmRequired');
        } else if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = t('auth.adminRegister.passwordMismatch');
        }

        if (!formData.terms) {
            errors.terms = t('auth.adminRegister.termsRequired');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            await register({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            });

            toast.success(t('auth.adminRegister.registrationSuccess'));
            navigate('/merchant/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.message || error || t('auth.adminRegister.registrationFailed');
            toast.error(errorMessage);
            setFormErrors({ submit: errorMessage });
        }
    };

    return (
        <div className="d-flex flex-column flex-root" id="kt_app_root">
            <div className="d-flex flex-column flex-lg-row flex-column-fluid">
                <div className="d-flex flex-column flex-lg-row-fluid w-lg-50 p-10 order-2 order-lg-1">
                    <div className="d-flex flex-center flex-column flex-lg-row-fluid">
                        <div className="w-lg-600px p-10">
                            <div className="text-center mb-11">
                                <h1 className="text-dark fw-bolder mb-3">{t('auth.adminRegister.title')}</h1>
                                <div className="text-gray-500 fw-semibold fs-6">{t('auth.adminRegister.subtitle')}</div>
                            </div>

                            <form className="form w-100" onSubmit={handleSubmit}>
                                {formErrors.submit && (
                                    <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                                        <i className="ki-duotone ki-shield-tick fs-2hx text-danger me-4">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <div className="d-flex flex-column">
                                            <h4 className="mb-1 text-danger">{t('auth.common.error')}</h4>
                                            <span>{formErrors.submit}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="row fv-row mb-7">
                                    <div className="col-xl-6">
                                        <label className="form-label fw-bolder text-dark fs-6">{t('auth.adminRegister.firstNameLabel')}</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            className={`form-control bg-transparent ${formErrors.first_name ? 'is-invalid' : ''}`}
                                            placeholder={t('auth.adminRegister.placeholderFirstName')}
                                            value={formData.first_name}
                                            onChange={handleChange}
                                        />
                                        {formErrors.first_name && (
                                            <div className="invalid-feedback">{formErrors.first_name}</div>
                                        )}
                                    </div>
                                    <div className="col-xl-6">
                                        <label className="form-label fw-bolder text-dark fs-6">{t('auth.adminRegister.lastNameLabel')}</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            className={`form-control bg-transparent ${formErrors.last_name ? 'is-invalid' : ''}`}
                                            placeholder={t('auth.adminRegister.placeholderLastName')}
                                            value={formData.last_name}
                                            onChange={handleChange}
                                        />
                                        {formErrors.last_name && (
                                            <div className="invalid-feedback">{formErrors.last_name}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="fv-row mb-7">
                                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.adminRegister.emailLabel')}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className={`form-control bg-transparent ${formErrors.email ? 'is-invalid' : ''}`}
                                        placeholder={t('auth.adminRegister.placeholderEmail')}
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                </div>

                                <div className="fv-row mb-7">
                                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.adminRegister.phoneLabel')}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className={`form-control bg-transparent ${formErrors.phone ? 'is-invalid' : ''}`}
                                        placeholder={t('auth.adminRegister.placeholderPhone')}
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                                </div>

                                <div className="mb-10 fv-row" data-kt-password-meter="true">
                                    <div className="mb-1">
                                        <label className="form-label fw-bolder text-dark fs-6">{t('auth.adminRegister.passwordLabel')}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className={`form-control bg-transparent ${formErrors.password ? 'is-invalid' : ''}`}
                                            placeholder={t('auth.adminRegister.placeholderPassword')}
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />
                                        {formErrors.password && (
                                            <div className="invalid-feedback">{formErrors.password}</div>
                                        )}
                                    </div>
                                    <div className="text-muted">{t('auth.passwordRules.hintMixed')}</div>
                                </div>

                                <div className="fv-row mb-10">
                                    <label className="form-label fw-bolder text-dark fs-6">{t('auth.adminRegister.confirmPasswordLabel')}</label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        className={`form-control bg-transparent ${formErrors.password_confirmation ? 'is-invalid' : ''}`}
                                        placeholder={t('auth.adminRegister.placeholderConfirmPassword')}
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                    />
                                    {formErrors.password_confirmation && (
                                        <div className="invalid-feedback">{formErrors.password_confirmation}</div>
                                    )}
                                </div>

                                <div className="fv-row mb-8">
                                    <label className={`form-check form-check-inline ${formErrors.terms ? 'is-invalid' : ''}`}>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="terms"
                                            checked={formData.terms}
                                            onChange={handleChange}
                                        />
                                        <span className="form-check-label fw-semibold text-gray-700 fs-base ms-1">
                                            {t('auth.adminRegister.acceptTerms')}{' '}
                                            <a href="#" className="ms-1 link-primary">
                                                {t('auth.common.terms')}
                                            </a>
                                        </span>
                                    </label>
                                    {formErrors.terms && <div className="text-danger mt-2">{formErrors.terms}</div>}
                                </div>

                                <div className="d-grid mb-10">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                {t('auth.common.pleaseWait')}
                                            </>
                                        ) : (
                                            <span className="indicator-label">{t('auth.common.signUp')}</span>
                                        )}
                                    </button>
                                </div>

                                <div className="text-gray-500 text-center fw-semibold fs-6">
                                    {t('auth.adminRegister.alreadyHaveAccount')}{' '}
                                    <Link to="/login" className="link-primary fw-semibold">
                                        {t('auth.adminRegister.signInLink')}
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div
                    className="d-flex flex-lg-row-fluid w-lg-50 bgi-size-cover bgi-position-center order-1 order-lg-2"
                    style={{
                        backgroundImage: 'url(/assets/media/misc/auth-bg.png)',
                        backgroundColor: '#1e1e2d',
                    }}
                >
                    <div className="d-flex flex-column flex-center py-7 py-lg-15 px-5 px-md-15 w-100">
                        <h1 className="d-none d-lg-block text-white fs-2qx fw-bolder text-center mb-7">
                            {t('auth.adminRegister.heroTitle')}
                        </h1>
                        <div className="d-none d-lg-block text-white fs-base text-center">{t('auth.adminRegister.heroSubtitle')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
