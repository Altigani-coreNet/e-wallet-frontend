import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ADMIN_ENDPOINTS, APP_CONFIG } from '../../../utils/constants';
import { setToken, setUser, removeToken } from '../../../utils/api';
import useAuthStore from '../../../stores/authStore';

const AdminLogin = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Clear any stale tokens on mount to prevent redirect loop
    useEffect(() => {
        const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
        const user = localStorage.getItem(APP_CONFIG.USER_KEY);
        
        // If we're on login page, ensure auth state is cleared
        if (token || user) {
            console.log('⚠️ Clearing existing tokens on admin login page');
            removeToken(); // Use the proper removeToken function
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
        
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            errors.password = 'Password is required';
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

        setLoading(true);
        setFormErrors({});

        try {
            // Call admin-specific login endpoint
            const response = await axios.post(ADMIN_ENDPOINTS.LOGIN, {
                email: formData.email,
                password: formData.password,
            });

            // Handle both 'success' and 'status' response formats
            const isSuccess = response.data.success === true || response.data.status === true;

            if (isSuccess) {
                const responseData = response.data.data || response.data;
                const { token, access_token, admin, user, roles = [], permissions = [], scopes = [], regions = [] } = responseData;
                
                // Use access_token or token (support both formats)
                const authToken = token || access_token;
                
                // Extract custom_region flag (support both spellings: custom_region and custom_regeon)
                const adminData = admin || user || {};
                const customRegion = adminData.custom_region === true || adminData.custom_regeon === true;
                
                // Get regions list if custom_region is true
                const regionsList = customRegion && Array.isArray(regions) && regions.length > 0 
                    ? regions 
                    : (Array.isArray(adminData.regions) ? adminData.regions : []);
                
                // Merge roles/permissions/regions into user object so store/localStorage can hydrate them
                const mergedUser = {
                    ...adminData,
                    roles: Array.isArray(roles) ? roles : (admin?.roles || user?.roles || []),
                    permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : (Array.isArray(scopes) ? scopes : (admin?.permissions || user?.permissions || [])),
                    custom_region: customRegion,
                    custom_regeon: customRegion, // Support both spellings
                    regions: regionsList,
                    is_admin: true,
                };

                // Store admin token and data
                setToken(authToken);
                setUser(mergedUser);
                
                // Set default axios header
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

                // Sync to global auth store immediately
                try {
                    useAuthStore.getState().syncProfileData(mergedUser, null);
                } catch (e) {
                    // no-op if store unavailable
                }
                
                console.log('Admin login successful:', { admin: mergedUser, hasToken: !!authToken });
                
                toast.success('Admin login successful!');
                navigate('/admin/dashboard');
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Login failed';
            toast.error(errorMessage);
            setFormErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Page background image */}
            <style>{`
                body {
                    background-image: url('/login_background.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                }
                [data-bs-theme="dark"] body {
                    background-image: url('/login_background.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                }
                /* Login hero: hidden < lg; ~600px art, end-aligned on large screens */
                .login-hero-wrap {
                    width: 100%;
                }
                @media (min-width: 992px) {
                    .login-hero-wrap {
                        justify-content: flex-end;
                        align-items: center;
                    }
                }
                .login-hero-art {
                    width: min(100%, 600px);
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: 0;
                }
                @media (min-width: 992px) {
                    .login-hero-art {
                        width: 600px;
                        min-width: 600px;
                    }
                }
            `}</style>
            
            <div className="d-flex flex-column flex-root" id="kt_app_root" style={{ minHeight: '100vh' }}>
                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '100vh' }}>
                    {/* Left: hero illustration — only from lg up */}
                    <div
                        className="login-hero-wrap d-none d-lg-flex px-6 px-lg-8 pe-lg-6 py-10 py-lg-0"
                        style={{ flex: '1.6 1 0%', minWidth: 0, minHeight: '100vh' }}
                    >
                        <div className="login-hero-art">
                            <img
                                src="/login_image.png"
                                alt=""
                                className="w-100 d-block"
                                style={{ height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    </div>

                    {/* Right: login form (full width on small screens) */}
                    <div className="d-flex justify-content-center align-items-center p-12" style={{ flex: '1 1 0%', minWidth: 0, minHeight: '100vh' }}>
                        <div className="bg-body d-flex flex-column flex-center rounded-4 w-md-600px py-15 px-10">
                            <div className="d-flex flex-center flex-column align-items-stretch w-md-400px">
                                <div className="d-flex flex-center flex-column flex-column-fluid py-10">
                                    
                                    <form className="form w-100" onSubmit={handleSubmit}>
                                        <div className="text-center mb-13">
                                            <h1 className="text-dark fw-bolder mb-3">Admin Sign In</h1>
                                            <div className="text-gray-500 fw-semibold fs-6">Enter your admin credentials</div>
                                        </div>

                                        {/* Error Messages */}
                                        {formErrors.submit && (
                                            <div className="alert alert-danger">
                                                <div className="d-flex align-items-center">
                                                    <i className="ki-duotone ki-shield-cross fs-2hx text-danger me-4">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                    <div className="d-flex flex-column">
                                                        <h4 className="mb-1 text-dark">Access Denied</h4>
                                                        <span>{formErrors.submit}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Email Field */}
                                        <div className="fv-row mb-10">
                                            <input
                                                type="text"
                                                name="email"
                                                placeholder="Email Address"
                                                autoComplete="off"
                                                className={`form-control bg-transparent ${formErrors.email ? 'is-invalid' : ''}`}
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                            {formErrors.email && (
                                                <div className="invalid-feedback">{formErrors.email}</div>
                                            )}
                                        </div>

                                        {/* Password Field */}
                                        <div className="fv-row mb-8 position-relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Password"
                                                className={`form-control bg-transparent ${formErrors.password ? 'is-invalid' : ''}`}
                                                style={{ paddingRight: '3rem' }}
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-icon btn-sm position-absolute top-50 end-0 translate-middle-y me-2"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        {formErrors.password && (
                                            <div className="invalid-feedback">{formErrors.password}</div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="d-grid mb-10">
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            <span className={loading ? 'd-none' : 'indicator-label'}>Sign In</span>
                                            {loading && (
                                                <span className="indicator-progress" style={{ display: 'block' }}>
                                                    Signing In...
                                                    <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    </form>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;

