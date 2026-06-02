import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getBranchesForSelect } from '../../../services/branchesService';
import ErrorAlert from '../../../components/common/ErrorAlert';

const TerminalForm = ({ mode = 'create', initialData = {}, onSubmit, loading, error }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        terminal_id: '',
        branch_id: '',
        model: '',
        manufacturer: '',
        serial_no: '',
        sdk_id: '',
        sdk_version: '',
        android_os: '',
        add_type: 'static',
        is_active: 'active',
    });
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [branchSearchTerm, setBranchSearchTerm] = useState('');
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                terminal_id: initialData.terminal_id || '',
                branch_id: initialData.branch_id || '',
                model: initialData.model || '',
                manufacturer: initialData.manufacturer || '',
                serial_no: initialData.serial_no || '',
                sdk_id: initialData.sdk_id || '',
                sdk_version: initialData.sdk_version || '',
                android_os: initialData.android_os || '',
                add_type: initialData.add_type || 'static',
                is_active: initialData.is_active ? 'active' : 'inactive',
            });
        }
    }, [mode, initialData]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const container = document.getElementById('branch-select-container');
            if (container && !container.contains(event.target)) {
                setShowBranchDropdown(false);
            }
        };

        if (showBranchDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showBranchDropdown]);

    const fetchBranches = async () => {
        try {
            console.log('Fetching branches...');
            const response = await getBranchesForSelect();
            console.log('Branches response:', response);
            if (response.success) {
                const branchesData = response.data || [];
                console.log(`Loaded ${branchesData.length} branches`);
                setBranches(branchesData);
            } else {
                console.error('Failed to fetch branches:', response.error);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    // Filtered branches based on search term
    const filteredBranches = useMemo(() => {
        if (!branchSearchTerm.trim()) return branches;
        const searchLower = branchSearchTerm.toLowerCase();
        return branches.filter(branch => 
            branch.name.toLowerCase().includes(searchLower)
        );
    }, [branches, branchSearchTerm]);

    // Get selected branch name for display
    const selectedBranchName = useMemo(() => {
        if (!formData.branch_id && formData.branch_id !== 0) return '';
        // Try to match by id (as number or string)
        const branch = branches.find(b => {
            const branchId = Number(b.id);
            const formBranchId = Number(formData.branch_id);
            return branchId === formBranchId || String(b.id) === String(formData.branch_id);
        });
        return branch ? branch.name : '';
    }, [formData.branch_id, branches]);

    // When branches load and we have a branch_id, ensure the selected branch name is displayed
    useEffect(() => {
        if (mode === 'edit' && formData.branch_id && branches.length > 0 && selectedBranchName) {
            // Clear any search term to show the selected branch name
            setBranchSearchTerm('');
        }
    }, [mode, formData.branch_id, branches.length, selectedBranchName]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBranchSelect = (branchId) => {
        // Ensure branch_id is properly set (handle both string and number)
        const branchIdValue = branchId != null ? (Number(branchId) || branchId) : '';
        
        console.log('Branch selected - branchId:', branchId, 'branchIdValue:', branchIdValue);
        
        setFormData(prev => {
            const updated = {
                ...prev,
                branch_id: branchIdValue
            };
            console.log('Form data updated - branch_id:', updated.branch_id, 'Full formData:', updated);
            return updated;
        });
        
        setShowBranchDropdown(false);
        setBranchSearchTerm('');
    };

    const handleClearBranch = () => {
        setFormData(prev => ({
            ...prev,
            branch_id: ''
        }));
        setBranchSearchTerm('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted with data:', formData);
        onSubmit(formData);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    {mode === 'create'
                        ? t('merchant.terminalForm.createTitle')
                        : t('merchant.terminalForm.editTitle')}
                </h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {error && <ErrorAlert error={error} />}

                    <div className="row">
                        {/* Terminal Name */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label required">{t('merchant.terminalForm.terminalName')}</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.terminalNamePh')}
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                            <div className="form-text">{t('merchant.terminalForm.terminalNameHint')}</div>
                        </div>

                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.terminalId')}</label>
                            <input
                                type="text"
                                name="terminal_id"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.terminalIdPh')}
                                value={formData.terminal_id}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <div className="form-text">{t('merchant.terminalForm.terminalIdHint')}</div>
                        </div>

                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.branch')}</label>
                            <div className="position-relative" id="branch-select-container">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={
                                            loadingBranches 
                                                ? t('merchant.terminalForm.loadingBranches')
                                                : branches.length > 0 
                                                    ? t('merchant.terminalForm.searchBranchPh')
                                                    : t('merchant.terminalForm.noBranchesAvailable')
                                        }
                                        value={branchSearchTerm || selectedBranchName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setBranchSearchTerm(value);
                                            setShowBranchDropdown(true);
                                            // If user clears the input completely, also clear branch_id
                                            if (!value && selectedBranchName) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    branch_id: ''
                                                }));
                                            }
                                        }}
                                        onFocus={() => {
                                            // Show dropdown and allow searching
                                            setShowBranchDropdown(true);
                                        }}
                                        disabled={loading || loadingBranches}
                                        readOnly={false}
                                    />
                                    {selectedBranchName && !branchSearchTerm && (
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-light"
                                            onClick={handleClearBranch}
                                            disabled={loading || loadingBranches}
                                            title={t('merchant.terminalForm.clearSelection')}
                                        >
                                            <i className="ki-duotone ki-cross fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Dropdown */}
                                {showBranchDropdown && !loadingBranches && branches.length > 0 && (
                                    <div 
                                        className="dropdown-menu show w-100 position-absolute"
                                        style={{ zIndex: 9999, maxHeight: '300px', overflowY: 'auto', marginTop: '2px' }}
                                    >
                                        {filteredBranches.length > 0 ? (
                                            filteredBranches.map((branch) => {
                                                const isSelected = Number(formData.branch_id) === Number(branch.id) || 
                                                                   String(formData.branch_id) === String(branch.id);
                                                return (
                                                    <button
                                                        key={branch.id}
                                                        type="button"
                                                        className={`dropdown-item ${isSelected ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleBranchSelect(branch.id);
                                                        }}
                                                    >
                                                        {branch.name}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="dropdown-item-text text-muted">
                                                {t('merchant.terminalForm.noBranchesMatch', { term: branchSearchTerm })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="form-text">
                                {loadingBranches ? (
                                    <span className="text-muted">
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        {t('merchant.terminalForm.loadingBranches')}
                                    </span>
                                ) : branches.length > 0 ? (
                                    t('merchant.terminalForm.branchSearchHint', { count: branches.length })
                                ) : (
                                    <span className="text-warning">{t('merchant.terminalForm.noBranchesWarning')}</span>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label required">{t('merchant.terminalForm.status')}</label>
                            <select
                                name="is_active"
                                className="form-select"
                                value={formData.is_active}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="active">{t('merchant.terminalForm.active')}</option>
                                <option value="inactive">{t('merchant.terminalForm.inactive')}</option>
                            </select>
                            <div className="form-text">{t('merchant.terminalForm.statusHint')}</div>
                        </div>

                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.model')}</label>
                            <input
                                type="text"
                                name="model"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.modelPh')}
                                value={formData.model}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Manufacturer */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.manufacturer')}</label>
                            <input
                                type="text"
                                name="manufacturer"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.manufacturerPh')}
                                value={formData.manufacturer}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Serial Number */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.serialNumber')}</label>
                            <input
                                type="text"
                                name="serial_no"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.serialNumberPh')}
                                value={formData.serial_no}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* SDK ID */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.sdkId')}</label>
                            <input
                                type="text"
                                name="sdk_id"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.sdkIdPh')}
                                value={formData.sdk_id}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* SDK Version */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.sdkVersion')}</label>
                            <input
                                type="text"
                                name="sdk_version"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.sdkVersionPh')}
                                value={formData.sdk_version}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Android OS */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.androidOs')}</label>
                            <input
                                type="text"
                                name="android_os"
                                className="form-control"
                                placeholder={t('merchant.terminalForm.androidOsPh')}
                                value={formData.android_os}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Add Type */}
                        <div className="col-md-6 mb-6">
                            <label className="form-label">{t('merchant.terminalForm.addType')}</label>
                            <select
                                name="add_type"
                                className="form-select"
                                value={formData.add_type}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="static">{t('merchant.terminalForm.addTypeStatic')}</option>
                                <option value="auto">{t('merchant.terminalForm.addTypeAuto')}</option>
                            </select>
                            <div className="form-text">{t('merchant.terminalForm.addTypeHint')}</div>
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end py-6 px-9">
                    <button 
                        type="button" 
                        className="btn btn-light me-3"
                        onClick={() => window.history.back()}
                        disabled={loading}
                    >
                        {t('merchant.terminalForm.cancel')}
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                    >
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
            </form>
        </div>
    );
};

export default TerminalForm;

