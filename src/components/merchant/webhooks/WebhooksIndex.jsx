import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getWebhooks, deleteWebhook, toggleWebhook } from '../../../services/webhooksService';
import Swal from 'sweetalert2';

const WebhooksIndex = () => {
    const { t } = useTranslation();
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            setLoading(true);
            const response = await getWebhooks();
            console.log('Webhooks response:', response);
            
            if (response.status || response.success) {
                setWebhooks(response.data?.webhooks || []);
            }
        } catch (error) {
            console.error('Error fetching webhooks:', error);
            Swal.fire(t('merchant.common.error'), t('merchant.webhooks.loadFailed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const response = await toggleWebhook(id);
            if (response.status || response.success) {
                const message = response.data?.message || response.message || t('merchant.webhooks.statusUpdated');
                Swal.fire(t('merchant.common.success'), message, 'success');
                fetchWebhooks();
            }
        } catch (error) {
            console.error('Error toggling webhook:', error);
            Swal.fire(t('merchant.common.error'), t('merchant.webhooks.toggleFailed'), 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.webhooks.deleteConfirmText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDelete'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteWebhook(id);
                if (response.status || response.success) {
                    const message = response.data?.message || response.message || t('merchant.webhooks.deleteSuccess');
                    Swal.fire(t('merchant.common.deleted'), message, 'success');
                    fetchWebhooks();
                }
            } catch (error) {
                console.error('Error deleting webhook:', error);
                Swal.fire(t('merchant.common.error'), t('merchant.webhooks.deleteFailed'), 'error');
            }
        }
    };

    const getStatusBadge = (is_active) => {
        return is_active ? (
            <span className="badge badge-success">{t('merchant.common.active')}</span>
        ) : (
            <span className="badge badge-secondary">{t('merchant.common.inactive')}</span>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">{t('merchant.common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">{t('merchant.webhooks.title')}</h2>
                            <p className="text-muted">
                                {t('merchant.webhooks.pageSubtitle')}
                            </p>
                        </div>
                        <Link to="/merchant/webhooks/create" className="btn btn-primary">
                            <i className="fas fa-plus me-2"></i>
                            {t('merchant.webhooks.addEndpoint')}
                        </Link>
                    </div>
                </div>
            </div>

            {webhooks.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <i className="fas fa-webhook fa-3x text-muted mb-3"></i>
                        <h4>{t('merchant.webhooks.emptyTitle')}</h4>
                        <p className="text-muted mb-4">
                            {t('merchant.webhooks.emptyHint')}
                        </p>
                        <Link to="/merchant/webhooks/create" className="btn btn-primary">
                            <i className="fas fa-plus me-2"></i>
                            {t('merchant.webhooks.addEndpoint')}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="col-12 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center mb-2">
                                                <h5 className="mb-0 me-3">{webhook.name}</h5>
                                                {getStatusBadge(webhook.is_active)}
                                            </div>
                                            <p className="text-muted mb-2">{webhook.description || t('merchant.webhooks.noDescription')}</p>
                                            <div className="mb-3">
                                                <small className="text-muted">{t('merchant.webhooks.endpointUrl')}:</small>
                                                <div className="d-flex align-items-center">
                                                    <code className="bg-light px-2 py-1 rounded">{webhook.endpoint_url}</code>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-link"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(webhook.endpoint_url);
                                                            Swal.fire({
                                                                icon: 'success',
                                                                title: t('merchant.webhooks.copiedTitle'),
                                                                text: t('merchant.webhooks.copiedUrl'),
                                                                timer: 1500,
                                                                showConfirmButton: false
                                                            });
                                                        }}
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-3">
                                                <div>
                                                    <small className="text-muted">{t('merchant.webhooks.subscribedEvents')}:</small>
                                                    <br />
                                                    <span className="badge badge-info">{t('merchant.webhooks.eventsCount', { count: webhook.events_count })}</span>
                                                </div>
                                                <div>
                                                    <small className="text-muted">{t('merchant.webhooks.successLabel')}:</small>
                                                    <br />
                                                    <span className="text-success fw-bold">{webhook.success_count}</span>
                                                </div>
                                                <div>
                                                    <small className="text-muted">{t('merchant.webhooks.failedLabel')}:</small>
                                                    <br />
                                                    <span className="text-danger fw-bold">{webhook.failure_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Link
                                                to={`/merchant/webhooks/${webhook.id}`}
                                                className="btn btn-sm btn-info"
                                                title={t('merchant.webhooks.viewDetails')}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </Link>
                                            <Link
                                                to={`/merchant/webhooks/${webhook.id}/edit`}
                                                className="btn btn-sm btn-primary"
                                                title={t('merchant.webhooks.edit')}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(webhook.id)}
                                                className={`btn btn-sm ${webhook.is_active ? 'btn-warning' : 'btn-success'}`}
                                                title={webhook.is_active ? t('merchant.webhooks.disable') : t('merchant.webhooks.enable')}
                                            >
                                                <i className={`fas fa-${webhook.is_active ? 'pause' : 'play'}`}></i>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(webhook.id)}
                                                className="btn btn-sm btn-danger"
                                                title={t('merchant.webhooks.delete')}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WebhooksIndex;
