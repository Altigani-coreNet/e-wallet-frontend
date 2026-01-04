import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePaymentLinkDetails, deletePaymentLink, updatePaymentLinkDate, sendPaymentLink } from '../../../services/paymentLinksService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import RescheduleModal from './RescheduleModal';
import SendModal from './SendModal';

const PaymentLinkDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    
    // Use React Query hook
    const { data: paymentLink, isLoading: loading, refetch } = usePaymentLinkDetails(id);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        if (paymentLink) {
            setTitle(`Payment Link - ${paymentLink.uuid || id}`);
            
            setBreadcrumbs([
                { label: 'Dashboard', path: '/merchant/dashboard' },
                { label: 'Payment Links', path: '/merchant/payment-links' },
                { label: paymentLink.uuid || 'Payment Link Details', path: `/merchant/payment-links/${id}`, active: true }
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
                        Back
                    </button>
                    <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => navigate(`/merchant/payment-links/${id}/edit`)}
                    >
                        <i className="ki-duotone ki-pencil fs-5">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Edit
                    </button>
                </>
            );
        }

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [paymentLink, id, navigate, setTitle, setBreadcrumbs, setActions]);

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
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Format amount
    const formatAmount = (amount, currencySymbol = '$', currencyCode = 'USD') => {
        return `${currencySymbol}${parseFloat(amount || 0).toFixed(2)} ${currencyCode}`;
    };

    // Handle copy link
    const handleCopyLink = useCallback(() => {
        if (!paymentLink?.uuid) return;
        
        const url = `${window.location.origin}/payment/${paymentLink.uuid}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    }, [paymentLink]);

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!paymentLink) return;
        
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await deletePaymentLink(paymentLink.id);
                toast.success('Payment link deleted successfully');
                navigate('/merchant/payment-links');
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete payment link');
            }
        }
    }, [paymentLink, navigate]);

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
                    <h3 className="text-gray-800 mb-2">Payment Link Not Found</h3>
                    <p className="text-gray-600 mb-5">The payment link you're looking for doesn't exist or you don't have access to it.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/payment-links')}>
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
        <>
            {/* Payment Link Information */}
            <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-gray-800">Payment Link Information</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">Complete payment link details</span>
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
                                        <span className={`badge badge-light-${getStatusColor(paymentLink.status)}`}>
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
                                    <label className="text-gray-600 fw-bold">Currency</label>
                                    <div className="text-gray-800 fw-semibold">
                                        {paymentLink.currency_code || 'N/A'} 
                                        {paymentLink.currency_name && ` (${paymentLink.currency_name})`}
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

                            <h4 className="mb-5">Payment Link Details</h4>
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
                                    <label className="text-gray-600 fw-bold">Payment Method Types</label>
                                    <div className="text-gray-800 fw-semibold">
                                        {paymentLink.payment_method_types && Array.isArray(paymentLink.payment_method_types) 
                                            ? paymentLink.payment_method_types.join(', ') 
                                            : paymentLink.payment_method_types || 'N/A'}
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
                                    Reschedule
                                </button>
                                <button
                                    className="btn btn-light-primary"
                                    onClick={() => setShowSendModal(true)}
                                >
                                    <i className="ki-duotone ki-send fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Send
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
                                    Delete
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

