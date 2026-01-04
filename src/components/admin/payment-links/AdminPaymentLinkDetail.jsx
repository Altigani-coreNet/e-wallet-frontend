import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import { useAdminPaymentLink } from '../../../services/adminPaymentLinksService';

const AdminPaymentLinkDetail = () => {
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
            toast.error(paymentLinkResponse.message || paymentLinkResponse.error || paymentLinkResponse.data?.message || 'Failed to load payment link.');
            return null;
        }
        return paymentLinkResponse.data || paymentLinkResponse;
    }, [paymentLinkResponse]);

    useEffect(() => {
        if (error) {
            const message = error?.response?.data?.message || error.message || 'Failed to load payment link.';
            toast.error(message);
        }
    }, [error]);

    useEffect(() => {
        setTitle(paymentLink ? `Payment Link - ${paymentLink.uuid || id}` : 'Payment Link Details');
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
                    Back
                </button>
                <button
                    className="btn btn-sm btn-light btn-active-light-success"
                    onClick={refetch}
                >
                    <i className="ki-duotone ki-arrows-circle fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Refresh
                </button>
            </div>
        );

        return () => {
            setActions(null);
        };
    }, [setTitle, setActions, paymentLink, id, navigate, refetch]);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
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
            toast.success('Link copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    }, [paymentLink]);

    if (isLoading && !paymentLink) {
        return (
            <div className="card">
                <div className="card-body py-10 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
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
                    <h3 className="text-gray-800 mb-2">Payment Link Not Found</h3>
                    <p className="text-gray-600 mb-5">The payment link you are looking for does not exist or you do not have access to it.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/admin/payment-links')}>
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Back to Payment Links
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
                            <span className="card-label fw-bold text-gray-800">Payment Link Information</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Detailed view of the payment link</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 pb-4">
                        <div className="row mb-7">
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">UUID</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.uuid || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Status</label>
                                <div>
                                    <span className="badge badge-light-primary">
                                        {paymentLink.status ? paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Amount</label>
                                <div className="text-gray-800 fw-bold fs-3">
                                    {formatAmount(paymentLink.amount, paymentLink.currency_symbol, paymentLink.currency_code)}
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Merchant</label>
                                <div className="text-gray-800 fw-semibold">
                                    {paymentLink.merchant_name || paymentLink.merchant?.name || 'N/A'}
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Country</label>
                                <div className="text-gray-800 fw-semibold">
                                    {paymentLink.country_name || paymentLink.country?.name || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="separator mb-7"></div>

                        <h4 className="mb-5">Customer Information</h4>
                        <div className="row mb-7">
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Customer Name</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.customer_name || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Customer Email</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.customer_email || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Customer Phone</label>
                                <div className="text-gray-800 fw-semibold">{paymentLink.customer_phone || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="separator mb-7"></div>

                        <h4 className="mb-5">Link Details</h4>
                        <div className="row mb-7">
                            <div className="col-md-12 mb-3">
                                <label className="text-gray-600 fw-bold">Payment Link URL</label>
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
                                        title="Copy link"
                                    >
                                        <i className="ki-duotone ki-copy fs-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Scheduled Date</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.scheduled_date)}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Expired Date</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.expired_date)}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Created At</label>
                                <div className="text-gray-800 fw-semibold">{formatDate(paymentLink.created_at)}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="text-gray-600 fw-bold">Updated At</label>
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

