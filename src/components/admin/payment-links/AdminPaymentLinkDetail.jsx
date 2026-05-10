import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import { useAdminPaymentLink } from '../../../services/adminPaymentLinksService';

const AdminPaymentLinkDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    const {
        data: paymentLinkResponse,
        isLoading,
        error,
        refetch,
    } = useAdminPaymentLink(id, { enabled: !!id });

    const paymentLink = useMemo(() => {
        if (!paymentLinkResponse) return null;
        if (paymentLinkResponse.success === false || paymentLinkResponse.status === false) {
            toast.error(paymentLinkResponse.message || paymentLinkResponse.error || paymentLinkResponse.data?.message || t('admin.paymentLinksIndex.loadFailed'));
            return null;
        }
        return paymentLinkResponse.data || paymentLinkResponse;
    }, [paymentLinkResponse, t]);

    useEffect(() => {
        if (error) {
            const message = error?.response?.data?.message || error.message || t('admin.paymentLinksIndex.loadFailed');
            toast.error(message);
        }
    }, [error, t]);

    useEffect(() => {
        setTitle(paymentLink ? `${t('admin.paymentLinksIndex.paymentLinks')} - ${paymentLink.uuid || id}` : t('admin.paymentLinkDetail.details'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-light btn-active-light-primary"
                    onClick={() => navigate('/admin/payment-links')}
                >
                    <i className="ki-duotone ki-arrow-left fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.paymentLinkDetail.back')}
                </button>
                <button
                    className="btn btn-sm btn-light btn-active-light-success"
                    onClick={refetch}
                >
                    <i className="ki-duotone ki-arrows-circle fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.paymentLinkDetail.refresh')}
                </button>
            </div>
        );

        return () => {
            setActions(null);
        };
    }, [setTitle, setActions, paymentLink, id, navigate, refetch, t]);

    const formatDate = (date) => {
        if (!date) return t('admin.paymentLinksIndex.na');
        return new Date(date).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const formatAmount = (amount, currencySymbol = '$', currencyCode = 'USD') => {
        const numericAmount = Number(amount);
        if (Number.isNaN(numericAmount)) {
            return `${currencySymbol}0.00 ${currencyCode}`;
        }
        return `${currencySymbol}${numericAmount.toFixed(2)} ${currencyCode}`;
    };

    const handleCopyLink = useCallback(() => {
        if (!paymentLink?.uuid) return;

        const url = `${window.location.origin}/payment/${paymentLink.uuid}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success(t('admin.paymentLinksIndex.linkCopied'));
        }).catch(() => {
            toast.error(t('admin.paymentLinksIndex.noLinkToCopy'));
        });
    }, [paymentLink, t]);

    if (isLoading && !paymentLink) {
        return (
            <div className="card">
                <div className="card-body py-10 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                    </div>
                </div>
            </div>
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
                    <h3 className="text-gray-800 mb-2">{t('admin.paymentLinkDetail.notFound')}</h3>
                    <p className="text-gray-600 mb-5">{t('admin.paymentLinkDetail.notFoundMessage')}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/admin/payment-links')}>
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('admin.paymentLinkDetail.backToLinks')}
                    </button>
                </div>
            </div>
        );
    }

    const paymentLinkUrl = `${window.location.origin}/payment/${paymentLink.uuid}`;

    return (
        <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
            <div className="col-md-12">
                <div className="card">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('admin.paymentLinkDetail.information')}</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.paymentLinkDetail.detailedView')}</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 pb-4">
                        <div className="row mb-7">
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.uuid')}</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.uuid || t('admin.paymentLinksIndex.na')}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.status')}</label>
                                <div>
                                    <span className="badge badge-light-primary">
                                        {paymentLink.status ? paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1) : t('admin.paymentLinksIndex.na')}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.amount')}</label>
                                <div className="text-gray-800 fw-bold fs-3">
                                    {formatAmount(paymentLink.amount, paymentLink.currency_symbol, paymentLink.currency_code)}
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.merchant')}</label>
                                <div className="text-gray-800 fw-semibold">
                                    {paymentLink.merchant_name || paymentLink.merchant?.name || t('admin.paymentLinksIndex.na')}
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.country')}</label>
                                <div className="text-gray-800 fw-semibold">
                                    {paymentLink.country_name || paymentLink.country?.name || t('admin.paymentLinksIndex.na')}
                                </div>
                            </div>
                        </div>

                        <div className="separator mb-7"></div>

                        <h4 className="mb-5">{t('admin.paymentLinkDetail.customerInfo')}</h4>
                        <div className="row mb-7">
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.customer')}</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.customer_name || t('admin.paymentLinksIndex.na')}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinkDetail.customerEmail')}</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.customer_email || t('admin.paymentLinksIndex.na')}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinkDetail.customerPhone')}</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.customer_phone || t('admin.paymentLinksIndex.na')}</div>
                            </div>
                        </div>

                        <div className="separator mb-7"></div>

                        <h4 className="mb-5">{t('admin.paymentLinkDetail.linkDetails')}</h4>
                        <div className="row mb-7">
                            <div className="col-md-12 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinkDetail.url')}</label>
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
                                        title={t('admin.paymentLinkDetail.copyLink')}
                                    >
                                        <i className="ki-duotone ki-copy fs-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.scheduledDate')}</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.scheduled_date)}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.expiredDate')}</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.expired_date)}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinksIndex.createdAt')}</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.created_at)}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">{t('admin.paymentLinkDetail.updatedAt')}</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.updated_at)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPaymentLinkDetail;

