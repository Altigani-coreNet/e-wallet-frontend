import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS, ADMIN_SYSTEM_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getTranslatedText } from '../../../utils/helpers';

const AdminUserCreate = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [saving, setSaving] = useState(false);
    const [merchants, setMerchants] = useState([]);
    const [branches, setBranches] = useState([]);
    const [merchantSearchTerm, setMerchantSearchTerm] = useState('');
    const [branchSearchTerm, setBranchSearchTerm] = useState('');
    const [filteredMerchants, setFilteredMerchants] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [showMerchantList, setShowMerchantList] = useState(false);
    const [showBranchList, setShowBranchList] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [merchantRoles, setMerchantRoles] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        merchant_id: '',
        branch_id: '',
        country_id: '',
        status: 'active',
        is_admin: false
    });
    const [errors, setErrors] = useState({});

    const hasError = (field) => {
        const error = errors[field];
        if (Array.isArray(error)) return error.length > 0 && Boolean(error[0]);
        return Boolean(error);
    };
    const getErrorMessage = (field) => {
        const error = errors[field];
        return Array.isArray(error) ? error[0] : error;
    };
    const validationMessages = Object.values(errors)
        .flatMap((error) => (Array.isArray(error) ? error : [error]))
        .filter(Boolean);

    useEffect(() => {
        setTitle(t('admin.usersUI.form.addTitle'));
        setActions(
            <Link to="/admin/users" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.usersUI.form.back')}
            </Link>
        );
        return () => setActions(null);
    }, [setTitle, setActions, t, i18n.language]);

    useEffect(() => {
        fetchMerchants();
    }, []);

    useEffect(() => {
        if (formData.merchant_id) {
            fetchBranches(formData.merchant_id);
            fetchMerchantRoles(formData.merchant_id);
        } else {
            setBranches([]);
            setMerchantRoles([]);
            setSelectedRoleIds([]);
            setFormData(prev => ({ ...prev, branch_id: '' }));
        }
    }, [formData.merchant_id]);

    const fetchMerchantRoles = async (merchantId) => {
        if (!merchantId) {
            setMerchantRoles([]);
            return;
        }
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.ROLES_SELECT, {
                params: { merchant_id: merchantId },
                headers: { Authorization: `Bearer ${token}` }
            });
            const list = Array.isArray(response.data) ? response.data : [];
            setMerchantRoles(list);
            setSelectedRoleIds((prev) => prev.filter((id) => list.some((r) => String(r.id) === String(id))));
        } catch (error) {
            console.error('Failed to fetch merchant roles:', error);
            setMerchantRoles([]);
        }
    };

    const toggleRole = (roleId) => {
        const idStr = String(roleId);
        setSelectedRoleIds((prev) =>
            prev.map(String).includes(idStr) ? prev.filter((id) => String(id) !== idStr) : [...prev, roleId]
        );
    };

    const fetchMerchants = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params: { per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                const merchantsList = response.data.data.data || [];
                setMerchants(merchantsList);
                setFilteredMerchants(merchantsList);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
            toast.error(t('admin.usersUI.form.loadMerchantsFailed'));
        }
    };

    const fetchBranches = async (merchantId) => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCHES, {
                params: { merchant_id: merchantId, per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                const branchesList = response.data.data.data || [];
                setBranches(branchesList);
                setFilteredBranches(branchesList);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const handleMerchantSearch = (searchTerm) => {
        setMerchantSearchTerm(searchTerm);
        if (searchTerm.length >= 1) {
            const filtered = merchants.filter(merchant =>
                merchant.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                merchant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                merchant.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredMerchants(filtered);
        } else {
            setFilteredMerchants(merchants);
        }
    };

    const handleMerchantSelect = (merchant) => {
        setSelectedMerchant(merchant);
        const merchantName = getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name);
        setMerchantSearchTerm(merchantName);
        setFormData(prev => ({ 
            ...prev, 
            merchant_id: merchant.id, 
            branch_id: '',
            country_id: merchant.country_id || ''
        }));
        setShowMerchantList(false);
        setSelectedBranch(null);
        setBranchSearchTerm('');
        setSelectedRoleIds([]);
        fetchBranches(merchant.id);
    };

    const handleRemoveMerchant = () => {
        setSelectedMerchant(null);
        setMerchantSearchTerm('');
        setFormData(prev => ({ ...prev, merchant_id: '', branch_id: '', country_id: '' }));
        setBranches([]);
        setFilteredBranches([]);
        setMerchantRoles([]);
        setSelectedRoleIds([]);
    };

    const handleBranchSearch = (searchTerm) => {
        setBranchSearchTerm(searchTerm);
        if (searchTerm.length >= 1) {
            const filtered = branches.filter(branch =>
                branch.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredBranches(filtered);
        } else {
            setFilteredBranches(branches);
        }
    };

    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch);
        const branchName = getTranslatedText(branch.name);
        setBranchSearchTerm(branchName);
        setFormData(prev => ({ ...prev, branch_id: branch.id }));
        setShowBranchList(false);
    };

    const handleRemoveBranch = () => {
        setSelectedBranch(null);
        setBranchSearchTerm('');
        setFormData(prev => ({ ...prev, branch_id: '' }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = t('admin.usersUI.form.nameRequired');
        }

        if (!formData.email?.trim()) {
            newErrors.email = t('admin.usersUI.form.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('admin.usersUI.form.emailInvalid');
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = t('admin.usersUI.form.phoneRequired');
        }

        if (!formData.merchant_id) {
            newErrors.merchant_id = t('admin.usersUI.form.merchantRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error(t('admin.usersUI.form.fillRequired'));
            return;
        }

        try {
            setSaving(true);
            const token = getToken();

            const submitData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                merchant_id: formData.merchant_id,
                branch_id: formData.branch_id || null,
                country_id: formData.country_id || null,
                status: formData.status,
                is_admin: formData.is_admin,
                roles: selectedRoleIds
            };

            const response = await axios.post(
                ADMIN_ENDPOINTS.USERS,
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.usersUI.form.createSuccess'));
                navigate('/admin/users');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || t('admin.usersUI.form.createFailed');
            toast.error(errorMessage);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <h2>{t('admin.usersUI.form.addTitle')}</h2>
                                    </div>
                                </div>

                                <div className="card-body p-9">
                                    {/* General Validation Errors */}
                                    {validationMessages.length > 0 && (
                                        <div className="alert alert-danger alert-dismissible fade show mb-7" role="alert">
                                            <div className="d-flex">
                                                <i className="ki-duotone ki-cross-circle fs-2hx text-danger me-4">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <div className="d-flex flex-column">
                                                    <h4 className="mb-1">{t('admin.usersUI.form.validationErrors')}</h4>
                                                    <ul className="mb-0">
                                                        {validationMessages.map((error, idx) => (
                                                            <li key={idx}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <button type="button" className="btn-close" onClick={() => setErrors({})}></button>
                                        </div>
                                    )}

                                    <div className="row">
                                        {/* Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.usersUI.form.fullName')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className={`form-control ${hasError('name') ? 'is-invalid' : ''}`}
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder={t('admin.usersUI.form.fullNamePh')}
                                            />
                                            {hasError('name') && <div className="invalid-feedback d-block">{getErrorMessage('name')}</div>}
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.usersUI.form.email')}</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control ${hasError('email') ? 'is-invalid' : ''}`}
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder={t('admin.usersUI.form.emailPh')}
                                            />
                                            {hasError('email') && <div className="invalid-feedback d-block">{getErrorMessage('email')}</div>}
                                        </div>

                                        {/* Phone */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.usersUI.form.phone')}</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className={`form-control ${hasError('phone') ? 'is-invalid' : ''}`}
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder={t('admin.usersUI.form.phonePh')}
                                            />
                                            {hasError('phone') && <div className="invalid-feedback d-block">{getErrorMessage('phone')}</div>}
                                            <div className="form-text text-info mt-2">
                                                <i className="ki-duotone ki-information fs-7 me-1">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                </i>
                                                {t('admin.usersUI.form.passwordHintCreate')}
                                            </div>
                                        </div>

                                        {/* Merchant */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.usersUI.form.merchant')}</label>
                                            <div className="position-relative">
                                                <div 
                                                    className={`form-control h-50px d-flex align-items-center justify-content-between ${hasError('merchant_id') ? 'is-invalid' : ''}`}
                                                    onClick={() => setShowMerchantList(!showMerchantList)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        {selectedMerchant ? (
                                                            <span className="text-gray-800">
                                                                {getTranslatedText(selectedMerchant.business_name) || getTranslatedText(selectedMerchant.name)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">{t('admin.usersUI.form.selectMerchant')}</span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        {selectedMerchant && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-icon btn-sm btn-light-danger me-2"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveMerchant(); }}
                                                            >
                                                                <i className="ki-duotone ki-cross fs-2">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </button>
                                                        )}
                                                        <i className={`ki-duotone ki-down fs-2 ${showMerchantList ? 'rotate-180' : ''}`}>
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </div>
                                                </div>
                                                
                                                {showMerchantList && (
                                                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                        <div className="p-2">
                                                            <input 
                                                                type="text" 
                                                                className="form-control form-control-sm mb-2" 
                                                                placeholder={t('admin.usersUI.form.searchMerchantsPh')}
                                                                value={merchantSearchTerm}
                                                                onChange={(e) => handleMerchantSearch(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        {filteredMerchants.length > 0 ? (
                                                            filteredMerchants.map((merchant) => (
                                                                <div 
                                                                    key={merchant.id}
                                                                    className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                                    onMouseDown={(e) => { e.preventDefault(); handleMerchantSelect(merchant); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <div className="text-gray-800 fw-bold">
                                                                        {getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name)}
                                                                    </div>
                                                                    {merchant.email && <div className="text-muted fs-7">{merchant.email}</div>}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-muted text-center">{t('admin.usersUI.form.noMerchants')}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {hasError('merchant_id') && <div className="invalid-feedback d-block">{getErrorMessage('merchant_id')}</div>}
                                        </div>

                                        {/* Branch */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">{t('admin.usersUI.form.branchOptional')}</label>
                                            <div className="position-relative">
                                                <div 
                                                    className="form-control h-50px d-flex align-items-center justify-content-between"
                                                    onClick={() => { if (selectedMerchant || formData.merchant_id) setShowBranchList(!showBranchList); }}
                                                    style={{ 
                                                        cursor: (selectedMerchant || formData.merchant_id) ? 'pointer' : 'not-allowed',
                                                        opacity: (selectedMerchant || formData.merchant_id) ? 1 : 0.6
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        {selectedBranch ? (
                                                            <span className="text-gray-800">{getTranslatedText(selectedBranch.name)}</span>
                                                        ) : (
                                                            <span className="text-muted">
                                                                {!(selectedMerchant || formData.merchant_id) ? t('admin.usersUI.form.selectMerchantFirst') : t('admin.usersUI.form.selectBranch')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        {selectedBranch && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-icon btn-sm btn-light-danger me-2"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveBranch(); }}
                                                            >
                                                                <i className="ki-duotone ki-cross fs-2">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </button>
                                                        )}
                                                        <i className={`ki-duotone ki-down fs-2 ${showBranchList ? 'rotate-180' : ''}`}>
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </div>
                                                </div>
                                                
                                                {showBranchList && (selectedMerchant || formData.merchant_id) && (
                                                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                        <div className="p-2">
                                                            <input 
                                                                type="text" 
                                                                className="form-control form-control-sm mb-2" 
                                                                placeholder={t('admin.usersUI.form.searchBranchesPh')}
                                                                value={branchSearchTerm}
                                                                onChange={(e) => handleBranchSearch(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        {filteredBranches.length > 0 ? (
                                                            filteredBranches.map((branch) => (
                                                                <div 
                                                                    key={branch.id}
                                                                    className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                                    onMouseDown={(e) => { e.preventDefault(); handleBranchSelect(branch); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <div className="text-gray-800">{getTranslatedText(branch.name)}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-muted text-center">{t('admin.usersUI.form.noBranches')}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Merchant roles (guard web, scoped to merchant) */}
                                        <div className="col-12 mb-7">
                                            <label className="form-label fw-bold">{t('admin.usersUI.form.roles')}</label>
                                            {!formData.merchant_id ? (
                                                <div className="text-muted fs-7">{t('admin.usersUI.form.selectMerchantForRoles')}</div>
                                            ) : merchantRoles.length === 0 ? (
                                                <div className="text-muted fs-7">
                                                    {t('admin.usersUI.form.noRoles')}
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-wrap gap-4 mt-2">
                                                    {merchantRoles.map((role) => (
                                                        <label key={role.id} className="form-check form-check-custom form-check-solid form-check-sm">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={selectedRoleIds.map(String).includes(String(role.id))}
                                                                onChange={() => toggleRole(role.id)}
                                                            />
                                                            <span className="form-check-label text-gray-800">{role.text || role.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">{t('admin.common.status')}</label>
                                            <select
                                                name="status"
                                                className="form-select"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                            >
                                                <option value="active">{t('admin.common.active')}</option>
                                                <option value="inactive">{t('admin.common.inactive')}</option>
                                            </select>
                                        </div>

                                        {/* Is Admin */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">{t('admin.usersUI.form.userType')}</label>
                                            <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="is_admin"
                                                    checked={formData.is_admin}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label">
                                                    {formData.is_admin ? t('admin.usersUI.form.adminUser') : t('admin.usersUI.form.regularUser')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-end gap-3">
                                                <Link to="/admin/users" className="btn btn-light">
                                                    {t('admin.usersUI.form.cancel')}
                                                </Link>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            {t('admin.usersUI.form.creating')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ki-duotone ki-check fs-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                            {t('admin.usersUI.form.createUser')}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUserCreate;

