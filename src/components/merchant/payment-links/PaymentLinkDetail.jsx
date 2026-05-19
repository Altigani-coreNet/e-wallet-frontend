import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePaymentLinkDetails, deletePaymentLink, updatePaymentLinkDate, sendPaymentLink } from '../../../services/paymentLinksService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import RescheduleModal from './RescheduleModal';
import SendModal from './SendModal';
import useAuthStore from '../../../stores/authStore';

const PaymentLinkDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const { formatRecordCurrency } = useAuthStore();
    
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    
    // Use React Query hook
    const { data: paymentLink, isLoading: loading, refetch } = usePaymentLinkDetails(id);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        if (paymentLink) {
            setTitle(t('merchant.pages.paymentLinkTitle', { id: paymentLink.uuid || id }));
            
            setBreadcrumbs([
                { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
                { label: t('merchant.breadcrumbs.paymentLinks'), path: '/merchant/payment-links' },
                { label: paymentLink.uuid || t('merchant.breadcrumbs.paymentLinkDetail'), path: `/merchant/payment-links/${id}`, active: true }
            ]);
            
            setActions(
                <>
                    <button
                        className="btn btn-sm btn-light btn-active-light-primary me-2"
                        onClick={() => navigate('/merchant/payment-links')}
                    >
                        <i className="ki-duotone ki-arrow-left fs-5">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.common.back')}
                    </button>
                    <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => navigate(`/merchant/payment-links/${id}/edit`)}
                    >
                        <i className="ki-duotone ki-pencil fs-5">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.common.edit')}
                    </button>
                </>
            );
        }

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [paymentLink, id, navigate, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    // Get status badge color
    const getStatusColor = (status) => {
        const statusMap = {
            'active': 'success',
            'inactive': 'danger',
            'expired': 'warning',
            'completed': 'info',
            'scheduled': 'primary'
        };
        return statusMap[status?.toLowerCase()] || 'secondary';
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return t('merchant.common.na');
        const loc = (i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar-SA' : 'en-US';
        return new Date(date).toLocaleString(loc, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Handle copy link
    const handleCopyLink = useCallback(() => {
        if (!paymentLink?.uuid) return;
        
        const url = `${window.location.origin}/payment/${paymentLink.uuid}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success(t('merchant.paymentLinks.row.linkCopied'));
        }).catch(() => {
            toast.error(t('merchant.common.copyFailed'));
        });
    }, [paymentLink, t]);

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!paymentLink) return;
        
        const result = await Swal.fire({
            title: t('merchant.paymentLinks.row.deleteConfirmTitle'),
            text: t('merchant.paymentLinks.row.deleteConfirmText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDelete'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (result.isConfirmed) {
            try {
                await deletePaymentLink(paymentLink.id);
                toast.success(t('merchant.paymentLinks.detail.deleteSuccess'));
                navigate('/merchant/payment-links');
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(t('merchant.paymentLinks.detail.deleteFailed'));
            }
        }
    }, [paymentLink, navigate, t]);

    // Handle reschedule success
    const handleRescheduleSuccess = useCallback(() => {
        setShowRescheduleModal(false);
        refetch();
    }, [refetch]);

    // Handle send success
    const handleSendSuccess = useCallback(() => {
        setShowSendModal(false);
    }, []);

    // Skeleton placeholder for loading
    if (loading) {
        return (
            <>
                <style>{`
                    .skeleton {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeleton-loading 1.5s ease-in-out infinite;
                        border-radius: 4px;
                    }
                    
                    @keyframes skeleton-loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>

                <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header pt-5">
                                <div className="skeleton" style={{width: '200px', height: '48px'}}></div>
                            </div>
                            <div className="card-body pt-2 pb-4">
                                <div className="d-flex flex-column flex-grow-1">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="d-flex align-items-center mb-3">
                                            <div className="skeleton" style={{width: '150px', height: '18px', marginRight: '10px'}}></div>
                                            <div className="skeleton" style={{width: '250px', height: '18px'}}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!paymentLink) {
        return (
            <div className="card">
                <div className="card-body text-center py-20">
                    <i className="ki-duotone ki-information-5 fs-3x text-muted mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <h3 className="text-gray-800 mb-2">{t('merchant.paymentLinks.detail.notFoundTitle')}</h3>
                    <p className="text-gray-600 mb-5">{t('merchant.paymentLinks.detail.notFoundDesc')}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/payment-links')}>
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.common.backToPaymentLinks')}
                    </button>
                </div>
            </div>
        );
    }

    const paymentLinkUrl = `${window.location.origin}/payment/${paymentLink.uuid}`;

    return (
        <>
            {/* Payment Link Information */}
            <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-gray-800">{t('merchant.paymentLinks.detail.infoTitle')}</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('merchant.paymentLinks.detail.infoSubtitle')}</span>
                            </h3>
                        </div>
                        <div className="card-body pt-2 pb-4">
                            <div className="row mb-7">
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.uuid')}</label>
                                    <div className="text-gray-800 fw-semibold">{paymentLink.uuid || t('merchant.common.na')}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.table.status')}</label>
                                    <div>
                                        <span className={`badge badge-light-${getStatusColor(paymentLink.status)}`}>
                                            {paymentLink.status
                                                ? t(`merchant.paymentLinks.status.${paymentLink.status.toLowerCase()}`, {
                                                    defaultValue: paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)
                                                })
                                                : t('merchant.common.na')}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.table.amount')}</label>
                                    <div className="text-gray-800 fw-bold fs-3">
                                        {formatRecordCurrency(paymentLink.amount, paymentLink)}
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.table.currency')}</label>
                                    <div className="text-gray-800 fw-semibold">
                                        {paymentLink.currency_code || t('merchant.common.na')} 
                                        {paymentLink.currency_name && ` (${paymentLink.currency_name})`}
                                    </div>
                                </div>
                            </div>

                            <div className="separator mb-7"></div>

                            <h4 className="mb-5">{t('merchant.paymentLinks.detail.customerSection')}</h4>
                            <div className="row mb-7">
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.form.customerName')}</label>
                                    <div className="text-gray-800 fw-semibold">{paymentLink.customer_name || t('merchant.common.na')}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.form.customerEmail')}</label>
                                    <div className="text-gray-800 fw-semibold">{paymentLink.customer_email || t('merchant.common.na')}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.form.customerPhone')}</label>
                                    <div className="text-gray-800 fw-semibold">{paymentLink.customer_phone || t('merchant.common.na')}</div>
                                </div>
                            </div>

                            <div className="separator mb-7"></div>

                            <h4 className="mb-5">{t('merchant.paymentLinks.detail.detailsSection')}</h4>
                            <div className="row mb-7">
                                <div className="col-md-12 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.paymentLinkUrl')}</label>
                                    <div className="d-flex align-items-center">
                                        <input
                                            type="text"
                                            className="form-control me-2"
                                            value={paymentLinkUrl}
                                            readOnly
                                        />
                                        <button
                                            className="btn btn-sm btn-light-primary"
                                            onClick={handleCopyLink}
                                            title={t('merchant.paymentLinks.detail.copyLinkTitle')}
                                        >
                                            <i className="ki-duotone ki-copy fs-3">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.paymentMethodTypes')}</label>
                                    <div className="text-gray-800 fw-semibold">
                                        {paymentLink.payment_method_types && Array.isArray(paymentLink.payment_method_types) 
                                            ? paymentLink.payment_method_types.map((m) => t(`merchant.paymentLinks.methods.${m}`, { defaultValue: m })).join(', ') 
                                            : paymentLink.payment_method_types || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.scheduledDate')}</label>
                                    <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.scheduled_date)}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.expiredDate')}</label>
                                    <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.expired_date)}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.createdAt')}</label>
                                    <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.created_at)}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-gray-600 fw-bold">{t('merchant.paymentLinks.detail.updatedAt')}</label>
                                    <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.updated_at)}</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-footer pt-0">
                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-light"
                                    onClick={() => setShowRescheduleModal(true)}
                                >
                                    <i className="ki-duotone ki-calendar fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('merchant.paymentLinks.row.reschedule')}
                                </button>
                                <button
                                    className="btn btn-light-primary"
                                    onClick={() => setShowSendModal(true)}
                                >
                                    <i className="ki-duotone ki-send fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('merchant.paymentLinks.row.send')}
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                >
                                    <i className="ki-duotone ki-trash fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                        <span className="path5"></span>
                                    </i>
                                    {t('merchant.paymentLinks.row.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <RescheduleModal
                    show={showRescheduleModal}
                    paymentLink={paymentLink}
                    onClose={() => setShowRescheduleModal(false)}
                    onSuccess={handleRescheduleSuccess}
                />
            )}

            {/* Send Modal */}
            {showSendModal && (
                <SendModal
                    show={showSendModal}
                    paymentLink={paymentLink}
                    onClose={() => setShowSendModal(false)}
                    onSuccess={handleSendSuccess}
                />
            )}
        </>
    );
};

export default PaymentLinkDetail;

