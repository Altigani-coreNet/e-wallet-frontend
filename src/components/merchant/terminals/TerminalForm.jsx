import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { getBranchesForSelect } from '../../../services/branchesService';
import ErrorAlert from '../../common/ErrorAlert';

const formatFormError = (err) => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (err.message && typeof err.message === 'string') return err.message;
    if (typeof err === 'object') {
        const messages = Object.values(err).flatMap((value) =>
            Array.isArray(value) ? value : [value]
        );
        return messages.filter(Boolean).join(' ');
    }
    return null;
};

const TerminalForm = ({ mode = 'create', initialData = {}, onSubmit, loading, error }) => {
    const { t } = useTranslation();
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: initialData.name || '',
        terminal_id: initialData.terminal_id || '',
        branch_id: initialData.branch_id || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        manufacturer: initialData.manufacturer || '',
        serial_no: initialData.serial_no || '',
        sdk_id: initialData.sdk_id || '',
        sdk_version: initialData.sdk_version || '',
        android_os: initialData.android_os || '',
        add_type: initialData.add_type || 'static',
        is_active: initialData.is_active !== undefined
            ? (initialData.is_active === true || initialData.is_active === 'active' || initialData.is_active === 1 || initialData.is_active === '1')
            : true,
        terminal_status: initialData.terminal_status || 'offline',
        device_id: initialData.device_id || '',
    });

    useEffect(() => {
        const fetchBranches = async () => {
            setLoadingBranches(true);
            try {
                const response = await getBranchesForSelect();
                if (response.success) {
                    setBranches(response.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            } finally {
                setLoadingBranches(false);
            }
        };

        fetchBranches();
    }, []);

    useEffect(() => {
        if (mode === 'edit' && initialData?.id) {
            const branchId = initialData.branch_id ?? initialData.branch?.id ?? '';

            setFormData({
                name: initialData.name || '',
                terminal_id: initialData.terminal_id || '',
                branch_id: branchId,
                brand: initialData.brand || '',
                model: initialData.model || '',
                manufacturer: initialData.manufacturer || '',
                serial_no: initialData.serial_no || '',
                sdk_id: initialData.sdk_id || '',
                sdk_version: initialData.sdk_version || '',
                android_os: initialData.android_os || '',
                add_type: initialData.add_type || 'static',
                is_active: initialData.is_active === true || initialData.is_active === 'active' || initialData.is_active === 1 || initialData.is_active === '1',
                terminal_status: initialData.terminal_status || 'offline',
                device_id: initialData.device_id || '',
            });
        }
    }, [mode, initialData]);

    useEffect(() => {
        if (mode === 'edit' && initialData.branch_id && branches.length > 0) {
            const branch = branches.find((b) => String(b.id) === String(initialData.branch_id));
            if (branch) {
                setSelectedBranch({
                    value: branch.id,
                    label: branch.name,
                    data: branch,
                });
            }
        }
    }, [mode, initialData.branch_id, branches]);

    const branchOptions = useMemo(
        () => branches.map((branch) => ({
            value: branch.id,
            label: branch.name,
            data: branch,
        })),
        [branches]
    );

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleBranchChange = (selectedOption) => {
        setSelectedBranch(selectedOption);
        handleChange('branch_id', selectedOption ? selectedOption.value : '');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('merchant.terminalForm.terminalNameRequired', { defaultValue: 'Terminal name is required' });
        }
        if (mode === 'create' && !formData.terminal_id.trim()) {
            newErrors.terminal_id = t('merchant.terminalForm.terminalIdRequired', { defaultValue: 'Terminal ID is required' });
        }
        if (!formData.model.trim()) {
            newErrors.model = t('merchant.terminalForm.modelRequired', { defaultValue: 'Model is required' });
        }
        if (!formData.brand.trim()) {
            newErrors.brand = t('merchant.terminalForm.brandRequired', { defaultValue: 'Brand is required' });
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
            {formatFormError(error) && (
                <div className="mb-5">
                    <ErrorAlert message={formatFormError(error)} />
                </div>
            )}

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.basicInfo', { defaultValue: 'Basic Information' })}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('merchant.terminalForm.terminalName')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder={t('merchant.terminalForm.terminalNamePh')}
                                disabled={loading}
                                required
                            />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('merchant.terminalForm.terminalId')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.terminal_id ? 'is-invalid' : ''}`}
                                value={formData.terminal_id}
                                onChange={(e) => handleChange('terminal_id', e.target.value)}
                                placeholder={t('merchant.terminalForm.terminalIdPh')}
                                disabled={loading || mode === 'edit'}
                            />
                            {errors.terminal_id && <div className="invalid-feedback">{errors.terminal_id}</div>}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.branch')}</label>
                            <Select
                                value={selectedBranch}
                                onChange={handleBranchChange}
                                options={branchOptions}
                                isSearchable
                                isClearable
                                isLoading={loadingBranches}
                                isDisabled={loadingBranches || loading}
                                placeholder={
                                    loadingBranches
                                        ? t('merchant.terminalForm.loadingBranches')
                                        : t('merchant.terminalForm.searchBranchPh')
                                }
                                noOptionsMessage={() => t('merchant.terminalForm.noBranchesAvailable')}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        minHeight: '44px',
                                        borderColor: state.isFocused ? '#009ef7' : '#e4e6ef',
                                    }),
                                    menu: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.hardwareInfo', { defaultValue: 'Hardware Information' })}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('merchant.terminalForm.brand', { defaultValue: 'Brand' })}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                                value={formData.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                                disabled={loading}
                            />
                            {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold required">{t('merchant.terminalForm.model')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                                value={formData.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                disabled={loading}
                            />
                            {errors.model && <div className="invalid-feedback">{errors.model}</div>}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.manufacturer')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.manufacturer}
                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.serialNumber')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.serial_no}
                                onChange={(e) => handleChange('serial_no', e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.deviceId', { defaultValue: 'Device ID' })}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.device_id}
                                onChange={(e) => handleChange('device_id', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.sdkInfo', { defaultValue: 'SDK Information' })}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        <div className="col-md-4">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.sdkId')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.sdk_id}
                                onChange={(e) => handleChange('sdk_id', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.sdkVersion')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.sdk_version}
                                onChange={(e) => handleChange('sdk_version', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.androidOs')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.android_os}
                                onChange={(e) => handleChange('android_os', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.statusSettings', { defaultValue: 'Status Settings' })}</h3>
                </div>
                <div className="card-body">
                    <div className="row g-5">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.addType')}</label>
                            <select
                                className="form-select"
                                value={formData.add_type}
                                onChange={(e) => handleChange('add_type', e.target.value)}
                                disabled={loading}
                            >
                                <option value="static">{t('merchant.terminalForm.addTypeStatic')}</option>
                                <option value="auto">{t('merchant.terminalForm.addTypeAuto')}</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.terminalStatus', { defaultValue: 'Terminal Status' })}</label>
                            <select
                                className="form-select"
                                value={formData.terminal_status}
                                onChange={(e) => handleChange('terminal_status', e.target.value)}
                                disabled={loading}
                            >
                                <option value="offline">{t('merchant.common.offline', { defaultValue: 'Offline' })}</option>
                                <option value="online">{t('merchant.common.online', { defaultValue: 'Online' })}</option>
                                <option value="testing">{t('merchant.common.testing', { defaultValue: 'Testing' })}</option>
                                <option value="maintenance">{t('merchant.common.maintenance', { defaultValue: 'Maintenance' })}</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">{t('merchant.terminalForm.status')}</label>
                            <select
                                className="form-select"
                                value={formData.is_active ? '1' : '0'}
                                onChange={(e) => handleChange('is_active', e.target.value === '1')}
                                disabled={loading}
                            >
                                <option value="1">{t('merchant.terminalForm.active')}</option>
                                <option value="0">{t('merchant.terminalForm.inactive')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="d-flex justify-content-end gap-3">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => window.history.back()}
                            disabled={loading}
                        >
                            {t('merchant.terminalForm.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {t('merchant.terminalForm.saving')}
                                </>
                            ) : (
                                mode === 'create'
                                    ? t('merchant.terminalForm.createTerminal')
                                    : t('merchant.terminalForm.updateTerminal')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default TerminalForm;
