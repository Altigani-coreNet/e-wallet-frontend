import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getTranslatedText } from '../../../utils/helpers';

const AdminUserCreate = () => {
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

    useEffect(() => {
        setTitle('Add New User');
        setActions(
            <Link to="/admin/users" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back
            </Link>
        );
        return () => setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        fetchMerchants();
    }, []);

    useEffect(() => {
        if (formData.merchant_id) {
            fetchBranches(formData.merchant_id);
        } else {
            setBranches([]);
            setFormData(prev => ({ ...prev, branch_id: '' }));
        }
    }, [formData.merchant_id]);

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
            toast.error('Failed to load merchants');
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
        fetchBranches(merchant.id);
    };

    const handleRemoveMerchant = () => {
        setSelectedMerchant(null);
        setMerchantSearchTerm('');
        setFormData(prev => ({ ...prev, merchant_id: '', branch_id: '', country_id: '' }));
        setBranches([]);
        setFilteredBranches([]);
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
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = 'Phone is required';
        }

        if (!formData.merchant_id) {
            newErrors.merchant_id = 'Merchant is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
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
                is_admin: formData.is_admin
            };

            const response = await axios.post(
                ADMIN_ENDPOINTS.USERS,
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('User created successfully');
                navigate('/admin/users');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create user';
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
                                        <h2>Add New User</h2>
                                    </div>
                                </div>

                                <div className="card-body p-9">
                                    {/* General Validation Errors */}
                                    {Object.keys(errors).length > 0 && (
                                        <div className="alert alert-danger alert-dismissible fade show mb-7" role="alert">
                                            <div className="d-flex">
                                                <i className="ki-duotone ki-cross-circle fs-2hx text-danger me-4">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <div className="d-flex flex-column">
                                                    <h4 className="mb-1">Validation Errors</h4>
                                                    <ul className="mb-0">
                                                        {Object.values(errors).map((error, idx) => (
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
                                            <label className="form-label fw-bold required">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter full name"
                                            />
                                            {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="user@example.com"
                                            />
                                            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                                        </div>

                                        {/* Phone */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Phone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+1234567890"
                                            />
                                            {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                                            <div className="form-text text-info mt-2">
                                                <i className="ki-duotone ki-information fs-7 me-1">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                </i>
                                                A secure password will be auto-generated and sent to the user's email
                                            </div>
                                        </div>

                                        {/* Merchant */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Merchant</label>
                                            <div className="position-relative">
                                                <div 
                                                    className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.merchant_id ? 'is-invalid' : ''}`}
                                                    onClick={() => setShowMerchantList(!showMerchantList)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        {selectedMerchant ? (
                                                            <span className="text-gray-800">
                                                                {getTranslatedText(selectedMerchant.business_name) || getTranslatedText(selectedMerchant.name)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">Select Merchant</span>
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
                                                                placeholder="Search merchants..."
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
                                                            <div className="p-3 text-muted text-center">No merchants found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {errors.merchant_id && <div className="invalid-feedback d-block">{errors.merchant_id}</div>}
                                        </div>

                                        {/* Branch */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Branch (Optional)</label>
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
                                                                {!(selectedMerchant || formData.merchant_id) ? 'Select merchant first' : 'Select Branch'}
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
                                                                placeholder="Search branches..."
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
                                                            <div className="p-3 text-muted text-center">No branches found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Status</label>
                                            <select
                                                name="status"
                                                className="form-select"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>

                                        {/* Is Admin */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">User Type</label>
                                            <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="is_admin"
                                                    checked={formData.is_admin}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label">
                                                    {formData.is_admin ? 'Admin User' : 'Regular User'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-end gap-3">
                                                <Link to="/admin/users" className="btn btn-light">
                                                    Cancel
                                                </Link>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ki-duotone ki-check fs-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                            Create User
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

