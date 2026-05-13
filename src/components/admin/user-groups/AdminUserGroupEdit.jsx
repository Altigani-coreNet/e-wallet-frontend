import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getTranslatedText } from '../../../utils/helpers';
import UserGroupFormSkeleton from './UserGroupFormSkeleton';
import CustomUserSelector from './CustomUserSelector';

const AdminUserGroupEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [merchants, setMerchants] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        merchant_id: '',
        branch_id: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle(t('admin.userGroupsUI.form.editTitle'));
        setActions(
            <Link to="/admin/user-groups" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.userGroupsUI.form.back')}
            </Link>
        );
        return () => setActions(null);
    }, [setTitle, setActions, t, i18n.language]);

    useEffect(() => {
        fetchMerchants();
    }, []);

    useEffect(() => {
        if (id) {
            fetchUserGroup();
        }
    }, [id]);

    // Set selected merchant and branch when merchants/branches are loaded and formData is set
    useEffect(() => {
        if (formData.merchant_id && merchants.length > 0) {
            const merchant = merchants.find(m => m.id === formData.merchant_id);
            if (merchant && (!selectedMerchant || selectedMerchant.value !== merchant.id)) {
                setSelectedMerchant({
                    value: merchant.id,
                    label: getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name) || t('admin.common.na'),
                    data: merchant
                });
            }
        } else if (!formData.merchant_id) {
            setSelectedMerchant(null);
        }
    }, [formData.merchant_id, merchants]);

    useEffect(() => {
        if (formData.branch_id && branches.length > 0) {
            const branch = branches.find(b => b.id === formData.branch_id);
            if (branch && (!selectedBranch || selectedBranch.value !== branch.id)) {
                setSelectedBranch({
                    value: branch.id,
                    label: getTranslatedText(branch.name) || t('admin.common.na'),
                    data: branch
                });
            }
        } else if (!formData.branch_id) {
            setSelectedBranch(null);
        }
    }, [formData.branch_id, branches]);

    useEffect(() => {
        if (formData.merchant_id) {
            fetchBranches(formData.merchant_id);
        } else {
            setBranches([]);
            setSelectedBranch(null);
        }
    }, [formData.merchant_id]);

    const fetchUserGroup = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USER_GROUP_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success || response.data.status) {
                const group = response.data.data;
                setFormData({
                    name: group.name || '',
                    description: group.description || '',
                    merchant_id: group.merchant_id || '',
                    branch_id: group.branch_id || '',
                });
                setSelectedUsers(group.users?.map(u => u.id) || []);
            }
        } catch (error) {
            toast.error(t('admin.userGroupsUI.form.loadFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMerchants = async () => {
        try {
            setLoadingMerchants(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params: { per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                setMerchants(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        } finally {
            setLoadingMerchants(false);
        }
    };

    const fetchBranches = async (merchantId) => {
        try {
            setLoadingBranches(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCHES, {
                params: { merchant_id: merchantId, per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                const branchesData = response.data.data.data || [];
                setBranches(branchesData);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleMerchantChange = (selectedOption) => {
        setSelectedMerchant(selectedOption);
        const merchantId = selectedOption ? selectedOption.value : '';
        setFormData(prev => ({
            ...prev,
            merchant_id: merchantId,
            branch_id: '' // Clear branch when merchant changes
        }));
        setSelectedBranch(null);
        if (errors.merchant_id) {
            setErrors(prev => ({ ...prev, merchant_id: '' }));
        }
    };

    const handleBranchChange = (selectedOption) => {
        setSelectedBranch(selectedOption);
        const branchId = selectedOption ? selectedOption.value : '';
        setFormData(prev => ({
            ...prev,
            branch_id: branchId
        }));
    };

    // Transform merchants to react-select format
    const merchantOptions = useMemo(() => {
        return merchants.map(merchant => ({
            value: merchant.id,
            label: getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name) || t('admin.common.na'),
            data: merchant
        }));
    }, [merchants, t]);

    // Transform branches to react-select format
    const branchOptions = useMemo(() => {
        return branches.map(branch => ({
            value: branch.id,
            label: getTranslatedText(branch.name) || t('admin.common.na'),
            data: branch
        }));
    }, [branches, t]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = t('admin.userGroupsUI.form.nameRequired');
        }

        if (!formData.merchant_id) {
            newErrors.merchant_id = t('admin.userGroupsUI.form.merchantRequired');
        }

        if (selectedUsers.length === 0) {
            newErrors.user_ids = t('admin.userGroupsUI.form.usersRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error(t('admin.userGroupsUI.form.fillRequired'));
            return;
        }

        try {
            setSaving(true);
            const token = getToken();

            const submitData = {
                name: formData.name,
                description: formData.description,
                merchant_id: formData.merchant_id,
                branch_id: formData.branch_id || null,
                user_ids: selectedUsers
            };

            const response = await axios.put(
                ADMIN_ENDPOINTS.USER_GROUP_DETAILS(id),
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.userGroupsUI.form.updateSuccess'));
                navigate('/admin/user-groups');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || t('admin.userGroupsUI.form.updateFailed');
            toast.error(errorMessage);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <UserGroupFormSkeleton />;
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <h2>{t('admin.userGroupsUI.form.editTitle')}</h2>
                                    </div>
                                </div>

                                <div className="card-body p-9">
                                    {Object.keys(errors).length > 0 && (
                                        <div className="alert alert-danger alert-dismissible fade show mb-7">
                                            <h4 className="mb-1">{t('admin.userGroupsUI.form.validationErrors')}</h4>
                                            <ul className="mb-0">
                                                {Object.values(errors).map((error, idx) => (
                                                    <li key={idx}>{error}</li>
                                                ))}
                                            </ul>
                                            <button type="button" className="btn-close" onClick={() => setErrors({})}></button>
                                        </div>
                                    )}

                                    <div className="row">
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.userGroupsUI.form.groupName')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                            {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">{t('admin.userGroupsUI.form.description')}</label>
                                            <input
                                                type="text"
                                                name="description"
                                                className="form-control"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.userGroupsUI.form.merchant')}</label>
                                            <Select
                                                value={selectedMerchant}
                                                onChange={handleMerchantChange}
                                                options={merchantOptions}
                                                isSearchable={true}
                                                isClearable={true}
                                                isLoading={loadingMerchants}
                                                isDisabled={loadingMerchants || saving}
                                                placeholder={loadingMerchants ? t('admin.userGroupsUI.form.loadingMerchants') : t('admin.userGroupsUI.form.searchMerchantPh')}
                                                noOptionsMessage={() => t('admin.userGroupsUI.form.noMerchants')}
                                                className={errors.merchant_id ? 'is-invalid' : ''}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        minHeight: '44px',
                                                        borderColor: errors.merchant_id 
                                                            ? '#dc3545' 
                                                            : state.isFocused 
                                                                ? '#009ef7' 
                                                                : '#e4e6ef',
                                                        boxShadow: errors.merchant_id
                                                            ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)'
                                                            : state.isFocused 
                                                                ? '0 0 0 0.25rem rgba(0, 158, 247, 0.25)' 
                                                                : 'none',
                                                        '&:hover': {
                                                            borderColor: errors.merchant_id ? '#dc3545' : '#009ef7'
                                                        }
                                                    }),
                                                    menu: (base) => ({
                                                        ...base,
                                                        zIndex: 9999
                                                    })
                                                }}
                                            />
                                            {errors.merchant_id && <div className="invalid-feedback d-block">{errors.merchant_id}</div>}
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">{t('admin.userGroupsUI.form.branchOptional')}</label>
                                            <Select
                                                value={selectedBranch}
                                                onChange={handleBranchChange}
                                                options={branchOptions}
                                                isSearchable={true}
                                                isClearable={true}
                                                isLoading={loadingBranches}
                                                isDisabled={!formData.merchant_id || loadingBranches || saving}
                                                placeholder={
                                                    !formData.merchant_id 
                                                        ? t('admin.userGroupsUI.form.merchantFirstPh')
                                                        : loadingBranches 
                                                            ? t('admin.userGroupsUI.form.loadingBranches')
                                                            : branches.length > 0 
                                                                ? t('admin.userGroupsUI.form.searchBranchPh')
                                                                : t('admin.userGroupsUI.form.noBranchesAvailable')
                                                }
                                                noOptionsMessage={() => t('admin.userGroupsUI.form.noBranches')}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        minHeight: '44px',
                                                        borderColor: state.isFocused ? '#009ef7' : '#e4e6ef',
                                                        boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(0, 158, 247, 0.25)' : 'none',
                                                        '&:hover': {
                                                            borderColor: '#009ef7'
                                                        }
                                                    }),
                                                    menu: (base) => ({
                                                        ...base,
                                                        zIndex: 9999
                                                    })
                                                }}
                                            />
                                            {!formData.merchant_id && (
                                                <div className="form-text">{t('admin.userGroupsUI.form.selectMerchantFirstHint')}</div>
                                            )}
                                        </div>

                                        <div className="col-md-12 mb-7">
                                            <label className="form-label fw-bold required">{t('admin.userGroupsUI.form.selectUsers')}</label>
                                            <CustomUserSelector
                                                merchantId={formData.merchant_id}
                                                selectedUsers={selectedUsers}
                                                onUserChange={setSelectedUsers}
                                                className="mt-2"
                                            />
                                            {errors.user_ids && <div className="invalid-feedback d-block mt-2">{errors.user_ids}</div>}
                                        </div>
                                    </div>

                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-end gap-3">
                                                <Link to="/admin/user-groups" className="btn btn-light">
                                                    {t('admin.userGroupsUI.form.cancel')}
                                                </Link>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            {t('admin.userGroupsUI.form.updating')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ki-duotone ki-check fs-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                            {t('admin.userGroupsUI.form.updateGroup')}
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

export default AdminUserGroupEdit;

