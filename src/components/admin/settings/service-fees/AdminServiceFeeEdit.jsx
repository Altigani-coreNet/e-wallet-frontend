import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getServiceFee, updateServiceFee } from '../../../../services/adminServiceFeesService';

const AdminServiceFeeEdit = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        fees: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle(t('admin.settings.serviceFees.editTitle'));
        setActions(null);
        fetchServiceFee();
    }, [setTitle, setActions, id, t]);

    const fetchServiceFee = async () => {
        setFetching(true);
        const response = await getServiceFee(id);
        setFetching(false);

        if (response.success) {
            const data = response.data.data || response.data;
            setFormData({
                name: data.name || '',
                type: data.type || '',
                fees: data.fees || ''
            });
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.fetchOneFailed'));
            navigate('/admin/settings/service-fees');
        }
    };

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

        const response = await updateServiceFee(id, formData);
        setLoading(false);

        if (response.success) {
            toast.success(t('admin.settings.serviceFees.updateSuccess'));
            navigate('/admin/settings/service-fees');
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.updateFailed'));
            if (response.errors) {
                setErrors(response.errors);
            }
        }
    };

    if (fetching) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <div className="card">
                        <div className="card-body text-center py-20">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                        {t('admin.settings.serviceFees.updating')}
                                    </>
                                ) : (
                                    t('admin.settings.serviceFees.updateBtn')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
        </>
    );
};

export default AdminServiceFeeEdit;
