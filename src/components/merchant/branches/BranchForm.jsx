import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorAlert from '../../../components/common/ErrorAlert';

const BranchForm = ({ mode = 'create', initialData = {}, onSubmit, loading, error }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        is_active: false,
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                address: initialData.address || '',
                is_active: initialData.is_active || false,
            });
        }
    }, [mode, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    {mode === 'create'
                        ? t('merchant.branchForm.createTitle')
                        : t('merchant.branchForm.editTitle')}
                </h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {error && <ErrorAlert error={error} />}

                    {mode === 'create' && (
                        <div className="alert alert-info d-flex align-items-center mb-6">
                            <i className="ki-duotone ki-information-2 fs-2x me-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h5 className="mb-1">{t('merchant.branchForm.requestTitle')}</h5>
                                <span>{t('merchant.branchForm.requestMessage')}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="form-label required">{t('merchant.branchForm.branchName')}</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder={t('merchant.branchForm.branchNamePh')}
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                        <div className="form-text">{t('merchant.branchForm.branchNameHint')}</div>
                    </div>

                    <div className="mb-6">
                        <label className="form-label">{t('merchant.branchForm.address')}</label>
                        <textarea
                            name="address"
                            className="form-control"
                            rows="3"
                            placeholder={t('merchant.branchForm.addressPh')}
                            value={formData.address}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <div className="form-text">{t('merchant.branchForm.addressHint')}</div>
                    </div>

                    {mode === 'edit' && (
                        <div className="mb-6">
                            <label className="form-label">{t('merchant.branchForm.status')}</label>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <label className="form-check-label" htmlFor="is_active">
                                    {formData.is_active
                                        ? t('merchant.branchForm.active')
                                        : t('merchant.branchForm.inactive')}
                                </label>
                            </div>
                            <div className="form-text">
                                {formData.is_active
                                    ? t('merchant.branchForm.activeHint')
                                    : t('merchant.branchForm.inactiveHint')}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button 
                        type="button"
                        onClick={() => window.history.back()}
                        className="btn btn-light"
                        disabled={loading}
                    >
                        {t('merchant.branchForm.cancel')}
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {mode === 'create'
                                    ? t('merchant.branchForm.creating')
                                    : t('merchant.branchForm.updating')}
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {mode === 'create'
                                    ? t('merchant.branchForm.submitRequest')
                                    : t('merchant.branchForm.updateBranch')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BranchForm;
