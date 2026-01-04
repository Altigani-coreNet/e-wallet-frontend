import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore';

const Register = () => {
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

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/merchant/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Clear error when component unmounts
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear field error when user types
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validate = () => {
        const errors = {};
        
        if (!formData.first_name) {
            errors.first_name = 'First name is required';
        }
        
        if (!formData.last_name) {
            errors.last_name = 'Last name is required';
        }
        
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }
        
        if (!formData.phone) {
            errors.phone = 'Phone is required';
        }
        
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        if (!formData.password_confirmation) {
            errors.password_confirmation = 'Please confirm your password';
        } else if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = 'Passwords do not match';
        }
        
        if (!formData.terms) {
            errors.terms = 'You must accept the terms and conditions';
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
            
            toast.success('Registration successful!');
            navigate('/merchant/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.message || error || 'Registration failed';
            toast.error(errorMessage);
            setFormErrors({ submit: errorMessage });
        }
    };

    return (
        <div className="d-flex flex-column flex-root" id="kt_app_root">
            <div className="d-flex flex-column flex-lg-row flex-column-fluid">
                {/* Left side - Register Form */}
                <div className="d-flex flex-column flex-lg-row-fluid w-lg-50 p-10 order-2 order-lg-1">
                    <div className="d-flex flex-center flex-column flex-lg-row-fluid">
                        <div className="w-lg-600px p-10">
                            {/* Logo */}
                            <div className="text-center mb-11">
                                <h1 className="text-dark fw-bolder mb-3">Sign Up</h1>
                                <div className="text-gray-500 fw-semibold fs-6">Create Your Admin Account</div>
                            </div>

                            {/* Form */}
                            <form className="form w-100" onSubmit={handleSubmit}>
                                {formErrors.submit && (
                                    <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                                        <i className="ki-duotone ki-shield-tick fs-2hx text-danger me-4">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <div className="d-flex flex-column">
                                            <h4 className="mb-1 text-danger">Error</h4>
                                            <span>{formErrors.submit}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Name Fields */}
                                <div className="row fv-row mb-7">
                                    <div className="col-xl-6">
                                        <label className="form-label fw-bolder text-dark fs-6">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            className={`form-control bg-transparent ${formErrors.first_name ? 'is-invalid' : ''}`}
                                            placeholder="First name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                        />
                                        {formErrors.first_name && (
                                            <div className="invalid-feedback">{formErrors.first_name}</div>
                                        )}
                                    </div>
                                    <div className="col-xl-6">
                                        <label className="form-label fw-bolder text-dark fs-6">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            className={`form-control bg-transparent ${formErrors.last_name ? 'is-invalid' : ''}`}
                                            placeholder="Last name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                        />
                                        {formErrors.last_name && (
                                            <div className="invalid-feedback">{formErrors.last_name}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="fv-row mb-7">
                                    <label className="form-label fw-bolder text-dark fs-6">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className={`form-control bg-transparent ${formErrors.email ? 'is-invalid' : ''}`}
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                    {formErrors.email && (
                                        <div className="invalid-feedback">{formErrors.email}</div>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="fv-row mb-7">
                                    <label className="form-label fw-bolder text-dark fs-6">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className={`form-control bg-transparent ${formErrors.phone ? 'is-invalid' : ''}`}
                                        placeholder="Enter your phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    {formErrors.phone && (
                                        <div className="invalid-feedback">{formErrors.phone}</div>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="mb-10 fv-row" data-kt-password-meter="true">
                                    <div className="mb-1">
                                        <label className="form-label fw-bolder text-dark fs-6">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className={`form-control bg-transparent ${formErrors.password ? 'is-invalid' : ''}`}
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />
                                        {formErrors.password && (
                                            <div className="invalid-feedback">{formErrors.password}</div>
                                        )}
                                    </div>
                                    <div className="text-muted">
                                        Use 6 or more characters with a mix of letters, numbers & symbols.
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="fv-row mb-10">
                                    <label className="form-label fw-bolder text-dark fs-6">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        className={`form-control bg-transparent ${formErrors.password_confirmation ? 'is-invalid' : ''}`}
                                        placeholder="Confirm password"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                    />
                                    {formErrors.password_confirmation && (
                                        <div className="invalid-feedback">{formErrors.password_confirmation}</div>
                                    )}
                                </div>

                                {/* Terms */}
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
                                            I Accept the{' '}
                                            <a href="#" className="ms-1 link-primary">
                                                Terms
                                            </a>
                                        </span>
                                    </label>
                                    {formErrors.terms && (
                                        <div className="text-danger mt-2">{formErrors.terms}</div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="d-grid mb-10">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Please wait...
                                            </>
                                        ) : (
                                            <>
                                                <span className="indicator-label">Sign Up</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Login Link */}
                                <div className="text-gray-500 text-center fw-semibold fs-6">
                                    Already have an Account?{' '}
                                    <Link to="/login" className="link-primary fw-semibold">
                                        Sign in
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right side - Background Image */}
                <div className="d-flex flex-lg-row-fluid w-lg-50 bgi-size-cover bgi-position-center order-1 order-lg-2"
                     style={{
                         backgroundImage: 'url(/assets/media/misc/auth-bg.png)',
                         backgroundColor: '#1e1e2d'
                     }}>
                    <div className="d-flex flex-column flex-center py-7 py-lg-15 px-5 px-md-15 w-100">
                        <h1 className="d-none d-lg-block text-white fs-2qx fw-bolder text-center mb-7">
                            Fast, Efficient and Productive
                        </h1>
                        <div className="d-none d-lg-block text-white fs-base text-center">
                            Admin Dashboard for managing your business operations
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

