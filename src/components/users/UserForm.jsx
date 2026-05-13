import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRoles } from '../../services/rolesService';
import { getBranchesForSelect } from '../../services/branchesService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const UserForm = ({ user = null, onSubmit, loading, error, mode = 'create' }) => {
    const { t } = useTranslation();
    const location = useLocation();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    const usersPath = `${basePath}/users`;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        branch_id: '',
        status: 1,
        roles: [],
        user_type: '' // admin, supervisor, cashier
    });
    
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    // Load form data if editing
    useEffect(() => {
        if (user && mode === 'edit') {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                branch_id: user.branch_id || '',
                status: user.status !== undefined ? user.status : 1,
                roles: user.roles || [],
                // backend stores this as "type"; fall back to user_type if present
                user_type: user.type || user.user_type || ''
            });
            setSelectedRoles(user.roles?.map(r => r.id) || []);
        }
    }, [user, mode]);

    // Fetch branches for dropdown
    useEffect(() => {
        const fetchBranches = async () => {
            setLoadingBranches(true);
            try {
                const response = await getBranchesForSelect();
                if (response.success) {
                    const branchesData = response.data?.data || response.data || [];
                    setBranches(Array.isArray(branchesData) ? branchesData : []);
                } else {
                    setBranches([]);
                }
            } catch (err) {
                console.error('Error fetching branches:', err);
                setBranches([]);
            } finally {
                setLoadingBranches(false);
            }
        };
        fetchBranches();
    }, []);

    // Fetch roles from AuthService when component mounts
    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const params = { per_page: 100 };
            const response = await getRoles(params);
            
            if (response.success) {
                // Handle nested response structure
                const responseData = response.data.data || {};
                const rolesList = response.data.data.data || response.data.data.roles || [];
                
                // Ensure it's an array
                const rolesArray = Array.isArray(rolesList) ? rolesList : [];
                setRoles(rolesArray);
            } else {
                console.error('Failed to fetch roles:', response.error);
                setRoles([]);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            setRoles([]);
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear validation error for this field when user types
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleRoleToggle = (roleId) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleId)) {
                return prev.filter(id => id !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clear previous validation errors
        setValidationErrors({});

        const dataToSubmit = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            branch_id: formData.branch_id || null,
            status: formData.status,
            roles: selectedRoles,  // Array of role IDs
            user_type: formData.user_type || null
        };

        onSubmit(dataToSubmit);
    };
    
    // Parse error to extract validation errors
    useEffect(() => {
        if (error) {
            // Check if error is an object with field-specific errors
            if (typeof error === 'object' && !Array.isArray(error)) {
                setValidationErrors(error);
            } else {
                setValidationErrors({});
            }
        }
    }, [error]);

    return (
        <div className="card">
            {/* Card Header */}
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h2>{mode === 'create' ? t('merchant.users.form.addTitle') : t('merchant.users.form.editTitle')}</h2>
                </div>
                <div className="card-toolbar">
                    <div className="d-flex justify-content-end">
                        <Link to={usersPath} className="btn btn-light-danger me-3">
                            <i className="ki-duotone ki-arrow-left fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('merchant.users.form.back')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
                {/* Show general error only if it's not a validation error object */}
                {error && typeof error === 'string' && <ErrorAlert message={error} />}

                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Name */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label fs-6 fw-bold required">{t('merchant.users.form.name')}</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`form-control form-control-solid ${validationErrors.name ? 'is-invalid' : ''}`}
                                placeholder={t('merchant.users.form.namePh')}
                                required
                            />
                            {validationErrors.name && (
                                <div className="invalid-feedback d-block">
                                    {Array.isArray(validationErrors.name) ? validationErrors.name[0] : validationErrors.name}
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label fs-6 fw-bold required">{t('merchant.users.form.email')}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-control form-control-solid ${validationErrors.email ? 'is-invalid' : ''}`}
                                placeholder={t('merchant.users.form.emailPh')}
                                required
                                disabled={mode === 'edit'}
                            />
                            {validationErrors.email && (
                                <div className="invalid-feedback d-block">
                                    {Array.isArray(validationErrors.email) ? validationErrors.email[0] : validationErrors.email}
                                </div>
                            )}
                            {mode === 'edit' && (
                                <div className="form-text">{t('merchant.users.form.emailLockedHint')}</div>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label fs-6 fw-bold required">{t('merchant.users.form.phone')}</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`form-control form-control-solid ${validationErrors.phone ? 'is-invalid' : ''}`}
                                placeholder={t('merchant.users.form.phonePh')}
                                required
                            />
                            {validationErrors.phone && (
                                <div className="invalid-feedback d-block">
                                    {Array.isArray(validationErrors.phone) ? validationErrors.phone[0] : validationErrors.phone}
                                </div>
                            )}
                        </div>

                        {/* Branch */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label fs-6 fw-bold">{t('merchant.users.form.branch')}</label>
                            {loadingBranches ? (
                                <div className="text-muted">{t('merchant.users.form.loadingBranches')}</div>
                            ) : (
                                <select
                                    name="branch_id"
                                    value={formData.branch_id}
                                    onChange={handleChange}
                                    className="form-select form-select-solid"
                                >
                                    <option value="">{t('merchant.users.form.selectBranchOptional')}</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {validationErrors.branch_id && (
                                <div className="invalid-feedback d-block">
                                    {Array.isArray(validationErrors.branch_id) ? validationErrors.branch_id[0] : validationErrors.branch_id}
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label fs-6 fw-bold">{t('merchant.users.form.status')}</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-select form-select-solid"
                            >
                                <option value="1">{t('merchant.common.active')}</option>
                                <option value="0">{t('merchant.common.inactive')}</option>
                            </select>
                        </div>

                        {/* User Type */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label fs-6 fw-bold">{t('merchant.users.form.userType')}</label>
                            <select
                                name="user_type"
                                value={formData.user_type}
                                onChange={handleChange}
                                className="form-select form-select-solid"
                            >
                                <option value="">{t('merchant.users.form.selectUserType')}</option>
                                <option value="admin">{t('merchant.users.form.typeAdmin')}</option>
                                <option value="supervisor">{t('merchant.users.form.typeSupervisor')}</option>
                                <option value="cashier">{t('merchant.users.form.typeCashier')}</option>
                            </select>
                            {validationErrors.user_type && (
                                <div className="invalid-feedback d-block">
                                    {Array.isArray(validationErrors.user_type) ? validationErrors.user_type[0] : validationErrors.user_type}
                                </div>
                            )}
                        </div>

                        {/* Password Info */}
                        {mode === 'create' && (
                            <div className="col-md-12 mb-5">
                                <div className="alert alert-info d-flex align-items-center p-1">
                                    <i className="ki-duotone ki-information-5 fs-4hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div>
                                        <h5 className="mb-1">{t('merchant.users.form.passwordInfoTitle')}</h5>
                                        <p className="mb-0">{t('merchant.users.form.passwordInfoBody')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Roles */}
                        <div className="col-md-12 mb-5">
                            <label className="form-label fs-6 fw-bold">{t('merchant.users.form.roles')}</label>
                            <div className="text-muted fs-7 mb-3">
                                {loadingRoles ? t('merchant.users.form.rolesLoading') : t('merchant.users.form.rolesHint')}
                            </div>
                            
                            {loadingRoles ? (
                                <LoadingSpinner message={t('merchant.users.form.loadingRolesMsg')} />
                            ) : (
                                <div className="border rounded p-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <div className="row">
                                        {Array.isArray(roles) && roles.map((role) => (
                                            <div key={role.id} className="col-md-6 mb-3">
                                                <div className="form-check form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={role.id}
                                                        checked={selectedRoles.includes(role.id)}
                                                        onChange={() => handleRoleToggle(role.id)}
                                                        id={`role_${role.id}`}
                                                    />
                                                    <label className="form-check-label fw-semibold" htmlFor={`role_${role.id}`}>
                                                        {role.name}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        {(!roles || roles.length === 0) && (
                                            <div className="col-12 text-center text-muted py-5">
                                                {t('merchant.users.form.noRoles')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Selected Roles Display */}
                            {selectedRoles.length > 0 && Array.isArray(roles) && (
                                <div className="mt-3">
                                    <div className="fs-7 text-muted mb-2">
                                        {t('merchant.users.form.selectedRoles', { count: selectedRoles.length })}
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {roles
                                            .filter(role => selectedRoles.includes(role.id))
                                            .map((role) => (
                                                <span key={role.id} className="badge badge-light-primary">
                                                    {role.name}
                                                    <i 
                                                        className="ki-duotone ki-cross fs-7 ms-1 cursor-pointer"
                                                        onClick={() => handleRoleToggle(role.id)}
                                                    >
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="col-12 mt-5">
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading || loadingRoles}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {mode === 'create' ? t('merchant.users.form.saving') : t('merchant.users.form.updating')}
                                    </>
                                ) : (
                                    mode === 'create' ? t('merchant.users.form.createUser') : t('merchant.users.form.updateUser')
                                )}
                            </button>
                            <Link to={usersPath} className="btn btn-light-danger ms-2">
                                {t('merchant.users.form.cancel')}
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;

