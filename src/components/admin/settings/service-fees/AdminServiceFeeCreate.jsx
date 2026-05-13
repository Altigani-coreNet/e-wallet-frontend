import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { createServiceFee } from '../../../../services/adminServiceFeesService';

const AdminServiceFeeCreate = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        fees: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle(t('admin.settings.serviceFees.createTitle'));
        setActions(null);
    }, [setTitle, setActions, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const response = await createServiceFee(formData);
        setLoading(false);

        if (response.success) {
            toast.success(t('admin.settings.serviceFees.createSuccess'));
            navigate('/admin/settings/service-fees');
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.createFailed'));
            if (response.errors) {
                setErrors(response.errors);
            }
        }
    };

    return (
        <>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.settings.serviceFees.cardInfo')}</h3>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="row mb-6">
                                <div className="col-lg-6">
                                    <label className="form-label required">{t('admin.settings.serviceFees.labelName')}</label>
                                    <input 
                                        type="text"
                                        name="name"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">{t('admin.settings.serviceFees.labelType')}</label>
                                    <input 
                                        type="text"
                                        name="type"
                                        className={`form-control ${errors.type ? 'is-invalid' : ''}`}
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.type && <div className="invalid-feedback">{errors.type[0]}</div>}
                                </div>
                            </div>
                            <div className="row mb-6">
                                <div className="col-lg-6">
                                    <label className="form-label required">{t('admin.settings.serviceFees.labelFees')}</label>
                                    <input 
                                        type="number"
                                        name="fees"
                                        step="0.01"
                                        min="0"
                                        className={`form-control ${errors.fees ? 'is-invalid' : ''}`}
                                        value={formData.fees}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.fees && <div className="invalid-feedback">{errors.fees[0]}</div>}
                                </div>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-end py-6 px-9">
                            <button 
                                type="button" 
                                className="btn btn-light btn-active-light-primary me-2"
                                onClick={() => navigate('/admin/settings/service-fees')}
                            >
                                {t('admin.common.cancel')}
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('admin.settings.serviceFees.creating')}
                                    </>
                                ) : (
                                    t('admin.settings.serviceFees.createBtn')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
        </>
    );
};

export default AdminServiceFeeCreate;
