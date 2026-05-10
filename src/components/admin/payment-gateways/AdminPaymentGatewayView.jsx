import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateway } from '../../../services/adminPaymentGatewaysService';

const AdminPaymentGatewayView = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [paymentGateway, setPaymentGateway] = useState(null);

    React.useEffect(() => {
        setTitle(t('admin.paymentGatewayView.paymentProviderDetails'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to="/admin/payment-gateways" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.paymentGatewayView.back')}
                </Link>
                <Link to={`/admin/payment-gateways/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.paymentGatewayView.edit')}
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id, t]);

    useEffect(() => {
        fetchPaymentGateway();
    }, [id]);

    const fetchPaymentGateway = async () => {
        setLoading(true);
        try {
            const response = await getPaymentGateway(id);
            if (response.success) {
                const data = response.data.data?.data || response.data.data;
                setPaymentGateway(data);
            } else {
                toast.error(response.error || t('admin.paymentGatewayEdit.fetchFailed'));
                navigate('/admin/payment-gateways');
            }
        } catch (error) {
            console.error('Error fetching payment gateway:', error);
            toast.error(t('admin.paymentGatewayEdit.fetchFailed'));
            navigate('/admin/payment-gateways');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!paymentGateway) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <p>{t('admin.paymentGatewayView.notFound')}</p>
                </div>
            </div>
        );
    }

    const logoUrl = paymentGateway.logo 
        ? `/${paymentGateway.logo}`
        : paymentGateway.alias 
            ? `/payment-gateway/${paymentGateway.alias}.png`
            : null;

    const config = paymentGateway.config && typeof paymentGateway.config === 'object'
        ? paymentGateway.config
        : {};

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.paymentGatewayView.paymentProviderDetails')}</h3>
            </div>

            <div className="card-body">
                <div className="mb-8">
                    {logoUrl && (
                        <div className="d-flex justify-content-center mb-4">
                            <div className="symbol symbol-100px">
                                <img src={logoUrl} alt={paymentGateway.name} className="w-100" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('admin.paymentGatewayView.name')}</label>
                            <div className="form-control form-control-solid">{paymentGateway.name}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('admin.paymentGatewayView.title')}</label>
                            <div className="form-control form-control-solid">{paymentGateway.title}</div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('admin.paymentGatewayView.alias')}</label>
                            <div className="form-control form-control-solid">{paymentGateway.alias || '-'}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('admin.paymentGatewayView.mode')}</label>
                            <div>
                                <span className={`badge badge-${paymentGateway.mode === 'live' ? 'success' : 'warning'}`}>
                                    {paymentGateway.mode}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('admin.paymentGatewayView.status')}</label>
                            <div>
                                <span className={`badge badge-${paymentGateway.is_active ? 'success' : 'danger'}`}>
                                    {paymentGateway.is_active ? t('admin.paymentGatewayView.active') : t('admin.paymentGatewayView.inactive')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('admin.paymentGatewayView.createdAt')}</label>
                            <div className="form-control form-control-solid">
                                {new Date(paymentGateway.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {Object.keys(config).length > 0 && (
                    <div className="mb-5">
                        <label className="form-label fw-bold mb-4">{t('admin.paymentGatewayView.configuration')}</label>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>{t('admin.paymentGatewayView.key')}</th>
                                        <th>{t('admin.paymentGatewayView.value')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(config).map(([key, value]) => (
                                        <tr key={key}>
                                            <td className="fw-bold">{key}</td>
                                            <td>{String(value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {Object.keys(config).length === 0 && (
                    <div className="mb-5">
                        <label className="form-label fw-bold mb-4">{t('admin.paymentGatewayView.configuration')}</label>
                        <div className="form-control form-control-solid">{t('admin.paymentGatewayView.noConfigSet')}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPaymentGatewayView;
