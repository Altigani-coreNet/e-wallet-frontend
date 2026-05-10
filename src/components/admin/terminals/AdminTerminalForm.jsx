import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getTranslatedText } from '../../../utils/helpers';

const AdminTerminalForm = ({ initialData = {}, mode = 'create', onSubmit, loading }) => {
    const { t } = useTranslation();
    const [merchants, setMerchants] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        terminal_id: initialData.terminal_id || '',
        merchant_id: initialData.merchant_id || '',
        branch_id: initialData.branch_id || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        manufacturer: initialData.manufacturer || '',
        serial_no: initialData.serial_no || '',
        sdk_id: initialData.sdk_id || '',
        sdk_version: initialData.sdk_version || '',
        android_os: initialData.android_os || '',
        add_type: initialData.add_type || 'static',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        terminal_status: initialData.terminal_status || 'offline',
        device_id: initialData.device_id || ''
    });
    
    const [errors, setErrors] = useState({});
    
    useEffect(() => {
        fetchMerchants();
    }, []);

    useEffect(() => {
        if (formData.merchant_id) {
            fetchBranches(formData.merchant_id);
        } else {
            setBranches([]);
            setSelectedBranch(null);
        }
    }, [formData.merchant_id]);

    // Set initial selected merchant and branch when in edit mode
    useEffect(() => {
        if (mode === 'edit' && initialData.merchant_id && merchants.length > 0) {
            const merchant = merchants.find(m => m.id === initialData.merchant_id);
            if (merchant) {
                setSelectedMerchant({
                    value: merchant.id,
                    label: getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name) || t('admin.common.na'),
                    data: merchant
                });
            }
        }
    }, [mode, initialData.merchant_id, merchants, t]);

    useEffect(() => {
        if (mode === 'edit' && initialData.branch_id && branches.length > 0) {
            const branch = branches.find(b => b.id === initialData.branch_id);
            if (branch) {
                setSelectedBranch({
                    value: branch.id,
                    label: getTranslatedText(branch.name) || t('admin.common.na'),
                    data: branch
                });
            }
        }
    }, [mode, initialData.branch_id, branches, t]);

    const fetchMerchants = async () => {
        setLoadingMerchants(true);
        try {
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
        setLoadingBranches(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCHES, {
                params: { merchant_id: merchantId, per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success || response.data.status) {
                setBranches(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        } finally {
            setLoadingBranches(false);
        }
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

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('admin.terminalCreate.terminalNameRequired');
        }

        if (!formData.terminal_id.trim()) {
            newErrors.terminal_id = t('admin.terminalCreate.terminalIdRequired');
        }

        if (!formData.model.trim()) {
            newErrors.model = t('admin.terminalCreate.modelRequired');
        }

        if (!formData.brand.trim()) {
            newErrors.brand = t('admin.terminalCreate.brandRequired');
        }

        if (!formData.merchant_id) {
            newErrors.merchant_id = t('admin.terminalCreate.merchantRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.terminalCreate.basicInfo')}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        {/* Terminal Name */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('admin.terminalCreate.terminalName')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder={t('admin.terminalCreate.terminalNamePlaceholder')}
                                required
                            />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>

                        {/* Terminal ID */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('admin.terminalCreate.terminalId')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.terminal_id ? 'is-invalid' : ''}`}
                                value={formData.terminal_id}
                                onChange={(e) => handleChange('terminal_id', e.target.value)}
                                placeholder={t('admin.terminalCreate.terminalIdPlaceholder')}
                                required
                                disabled={mode === 'edit'}
                            />
                            {errors.terminal_id && <div className="invalid-feedback">{errors.terminal_id}</div>}
                        </div>

                        {/* Merchant */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('admin.terminalCreate.merchant')}</label>
                            <Select
                                value={selectedMerchant}
                                onChange={handleMerchantChange}
                                options={merchantOptions}
                                isSearchable={true}
                                isClearable={true}
                                isLoading={loadingMerchants}
                                isDisabled={loadingMerchants || loading}
                                placeholder={loadingMerchants ? t('admin.terminalCreate.loadingMerchants') : t('admin.terminalCreate.merchantPlaceholder')}
                                noOptionsMessage={() => t('admin.terminalCreate.noMerchantsFound')}
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

                        {/* Branch */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.branch')}</label>
                            <Select
                                value={selectedBranch}
                                onChange={handleBranchChange}
                                options={branchOptions}
                                isSearchable={true}
                                isClearable={true}
                                isLoading={loadingBranches}
                                isDisabled={!formData.merchant_id || loadingBranches || loading}
                                placeholder={
                                    !formData.merchant_id 
                                        ? t('admin.terminalCreate.selectMerchantFirst') 
                                        : loadingBranches 
                                            ? t('admin.terminalCreate.loadingBranches') 
                                            : branches.length > 0 
                                                ? t('admin.terminalCreate.branchPlaceholder') 
                                                : t('admin.terminalCreate.noBranchesFound')
                                }
                                noOptionsMessage={() => t('admin.terminalCreate.noBranchesFound')}
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
                                <div className="form-text">{t('admin.terminalCreate.selectMerchantFirst')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.terminalCreate.hardwareInfo')}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        {/* Brand */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('admin.terminalCreate.brand')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                                value={formData.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                                placeholder={t('admin.terminalCreate.brandPlaceholder')}
                                required
                            />
                            {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
                        </div>

                        {/* Model */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('admin.terminalCreate.model')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                                value={formData.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder={t('admin.terminalCreate.modelPlaceholder')}
                                required
                            />
                            {errors.model && <div className="invalid-feedback">{errors.model}</div>}
                        </div>

                        {/* Manufacturer */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.manufacturer')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.manufacturer}
                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                placeholder={t('admin.terminalCreate.manufacturerPlaceholder')}
                            />
                        </div>

                        {/* Serial Number */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.serialNumber')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.serial_no}
                                onChange={(e) => handleChange('serial_no', e.target.value)}
                                placeholder={t('admin.terminalCreate.serialNumberPlaceholder')}
                            />
                        </div>

                        {/* Device ID */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.deviceId')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.device_id}
                                onChange={(e) => handleChange('device_id', e.target.value)}
                                placeholder={t('admin.terminalCreate.deviceIdPlaceholder')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.terminalCreate.sdkInfo')}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        {/* SDK ID */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.sdkId')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.sdk_id}
                                onChange={(e) => handleChange('sdk_id', e.target.value)}
                                placeholder={t('admin.terminalCreate.sdkIdPlaceholder')}
                            />
                        </div>

                        {/* SDK Version */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.sdkVersion')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.sdk_version}
                                onChange={(e) => handleChange('sdk_version', e.target.value)}
                                placeholder={t('admin.terminalCreate.sdkVersionPlaceholder')}
                            />
                        </div>

                        {/* Android OS */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.androidOs')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.android_os}
                                onChange={(e) => handleChange('android_os', e.target.value)}
                                placeholder={t('admin.terminalCreate.androidOsPlaceholder')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.terminalCreate.statusSettings')}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        {/* Add Type */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.addType')}</label>
                            <select
                                className="form-select"
                                value={formData.add_type}
                                onChange={(e) => handleChange('add_type', e.target.value)}
                            >
                                <option value="static">{t('admin.terminalCreate.static')}</option>
                                <option value="auto">{t('admin.terminalCreate.auto')}</option>
                            </select>
                        </div>

                        {/* Terminal Status */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.terminalStatus')}</label>
                            <select
                                className="form-select"
                                value={formData.terminal_status}
                                onChange={(e) => handleChange('terminal_status', e.target.value)}
                            >
                                <option value="offline">{t('admin.common.offline')}</option>
                                <option value="online">{t('admin.common.online')}</option>
                                <option value="testing">{t('admin.common.testing')}</option>
                                <option value="maintenance">{t('admin.common.maintenance')}</option>
                            </select>
                        </div>

                        {/* Is Active */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('admin.terminalCreate.status')}</label>
                            <select
                                className="form-select"
                                value={formData.is_active ? '1' : '0'}
                                onChange={(e) => handleChange('is_active', e.target.value === '1')}
                            >
                                <option value="1">{t('admin.common.active')}</option>
                                <option value="0">{t('admin.common.inactive')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="card">
                <div className="card-body">
                    <div className="d-flex justify-content-end gap-3">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => window.history.back()}
                            disabled={loading}
                        >
                            {t('admin.terminalCreate.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {mode === 'create' ? t('admin.terminalCreate.creating') : t('admin.terminalEdit.updating')}
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-check fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {mode === 'create' ? t('admin.terminalCreate.create') : t('admin.terminalEdit.update')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AdminTerminalForm;

