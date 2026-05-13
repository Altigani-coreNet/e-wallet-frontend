import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getServiceFee } from '../../../../services/adminServiceFeesService';
import { translateServiceFeeType } from '../../../../utils/serviceFeeTypeLabel';

const AdminServiceFeeView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [serviceFee, setServiceFee] = useState(null);

    useEffect(() => {
        setTitle(t('admin.settings.serviceFees.viewTitle'));
        setActions(
            <Link to={`/admin/settings/service-fees/${id}/edit`} className="btn btn-sm btn-primary">
                <i className="ki-duotone ki-pencil fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">{t('admin.common.edit')}</span>
            </Link>
        );
        fetchServiceFee();
        return () => setActions(null);
    }, [setTitle, setActions, id, t]);

    const fetchServiceFee = async () => {
        setLoading(true);
        const response = await getServiceFee(id);
        setLoading(false);

        if (response.success) {
            setServiceFee(response.data.data || response.data);
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.fetchOneFailed'));
            navigate('/admin/settings/service-fees');
        }
    };

    if (loading) {
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

    if (!serviceFee) {
        return null;
    }

    const typeLabel = translateServiceFeeType(t, serviceFee.type);

    return (
        <>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.settings.serviceFees.cardDetails')}</h3>
                        <div className="card-toolbar">
                            <button 
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => navigate('/admin/settings/service-fees')}
                            >
                                {t('admin.settings.backToList')}
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.serviceFees.labelId')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">{serviceFee.id}</span>
                            </div>
                        </div>
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.serviceFees.labelName')}</label>
                            <div className="col-lg-8 fv-row">
                                <span className="fw-bold fs-6">{serviceFee.name}</span>
                            </div>
                        </div>
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.serviceFees.labelType')}</label>
                            <div className="col-lg-8">
                                <span className="badge badge-light-primary" dir="auto">{typeLabel}</span>
                            </div>
                        </div>
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.serviceFees.labelFees')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">{Number(serviceFee.fees).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.serviceFees.colCreatedAt')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6">
                                    {new Date(serviceFee.created_at).toLocaleDateString(i18n.language, { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        {serviceFee.updated_at && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.lastUpdated')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bold fs-6">
                                        {new Date(serviceFee.updated_at).toLocaleDateString(i18n.language, { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </>
    );
};

export default AdminServiceFeeView;
