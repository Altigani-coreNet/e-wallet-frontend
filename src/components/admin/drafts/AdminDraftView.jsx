import React, { useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminDraft } from '../../../services/adminDraftsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import useAdminMerchantDetails from '../../../hooks/useAdminMerchantDetails';

const AdminDraftView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    const {
        data: draftResponse,
        isLoading,
        isFetching,
        error: draftError,
    } = useAdminDraft(id);

    const draft = useMemo(() => {
        if (!draftResponse || draftResponse.success === false) return null;
        return draftResponse.data || null;
    }, [draftResponse]);

    useEffect(() => {
        if (!draftResponse) return;
        if (draftResponse.success === false) {
            const message = draftResponse?.message || draftResponse?.error || draftResponse?.data?.message || 'Failed to load draft details';
            toast.error(message);
        }
    }, [draftResponse]);

    useEffect(() => {
        if (!draftError) return;
        const message = draftError?.response?.data?.message || draftError.message || 'Failed to load draft details';
        toast.error(message);
    }, [draftError]);

    const {
        data: merchantData,
        isLoading: isMerchantLoading,
        isFetching: isMerchantFetching,
    } = useAdminMerchantDetails(draft?.shop_id);

    const merchantLoading = (isMerchantLoading || isMerchantFetching) && !!draft?.shop_id;
    const merchant = merchantData ?? null;

    const formatCurrency = (value) => {
        const amount = Number(value || 0);
        const symbol = draft?.currency_symbol || draft?.currency_object?.symbol || '$';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const merchantInfo = useMemo(() => ({
        business: merchant?.business_name || merchant?.general_settings?.business_name || draft?.shop?.general_settings?.business_name || draft?.shop?.name || 'N/A',
        owner: merchant?.owner_name || merchant?.user?.name || draft?.shop?.user?.name || 'N/A',
        email: merchant?.email || merchant?.user?.email || draft?.shop?.user?.email || draft?.shop?.email || 'N/A',
        phone: merchant?.phone || merchant?.user?.phone || draft?.shop?.user?.phone || draft?.shop?.phone || 'N/A',
        address: merchant?.address || merchant?.business_address || draft?.shop?.general_settings?.address || 'N/A'
    }), [merchant, draft?.shop]);

    const handleViewInvoice = useCallback(() => {
        // Use encrypted_id if available, otherwise fallback to regular id
        const invoiceId = draft?.encrypted_id || draft?.id;
        
        if (!invoiceId) {
            toast.error('Invoice link not available');
            return;
        }

        const invoiceUrl = '/invoice/' + invoiceId;

        try {
            const newWindow = window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                toast.error('Please allow pop-ups to view the invoice');
            }
        } catch (error) {
            console.error('Error opening invoice page:', error);
            toast.error('Unable to open invoice');
        }
    }, [draft?.encrypted_id, draft?.id]);

    useEffect(() => {
        setTitle('Draft Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/drafts')}>
                    <i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i>
                    Back to List
                </button>
                <button
                    className="btn btn-sm btn-light-primary"
                    onClick={handleViewInvoice}
                >
                    <i className="ki-duotone ki-eye fs-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                    View Invoice
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate, handleViewInvoice, draft?.encrypted_id, draft?.id]);

    if (isLoading) return <LoadingSpinner />;

    if (!draft) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Draft not found</div>
                </div>
            </div>
        );
    }

    const items = Array.isArray(draft.product_sales) ? draft.product_sales : [];
    const showRefreshing = isFetching && !isLoading;

    return (
        <div className="card">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h2 className="fw-bold">Draft Sale Summary</h2>
                </div>
            </div>

            <div className="card-body pt-0">
                {showRefreshing && (
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                        <span className="spinner-border spinner-border-sm"></span>
                        <span>Refreshing draft details...</span>
                    </div>
                )}
                <div className="row g-5 g-xl-10">
                    <div className="col-lg-4">
                        <div className="card card-flush shadow-sm">
                            <div className="card-header border-0 pt-5 pb-0">
                                <h3 className="card-title fw-bold">Draft Information</h3>
                            </div>
                            <div className="card-body pb-5">
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Reference</span>
                                    <span className="text-gray-900 fw-bold">{draft.reference_no}</span>
                                </div>
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Created At</span>
                                    <span className="text-gray-900 fw-bold">{new Date(draft.created_at).toLocaleString()}</span>
                                </div>
                                <div className="mb-0">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Grand Total</span>
                                    <span className="badge badge-light-warning fs-6">{formatCurrency(draft.grand_total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                <div className="col-lg-4">
                        <div className="card card-flush shadow-sm">
                            <div className="card-header border-0 pt-5 pb-0">
                                <h3 className="card-title fw-bold">Customer Details</h3>
                            </div>
                            <div className="card-body pb-5">
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Customer</span>
                                    <span className="text-gray-900 fw-bold">{draft.customer?.name || 'Walk-in Customer'}</span>
                                </div>
                                {draft.customer?.email && (
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Email</span>
                                        <span className="text-gray-900 fw-bold">{draft.customer.email}</span>
                                    </div>
                                )}
                                {draft.customer?.phone && (
                                    <div className="mb-0">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Phone</span>
                                        <span className="text-gray-900 fw-bold">{draft.customer.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card card-flush shadow-sm">
                            <div className="card-header border-0 pt-5 pb-0">
                                <h3 className="card-title fw-bold">Merchant Details</h3>
                            </div>
                            <div className="card-body pb-5">
                                {merchantLoading ? (
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-12 mb-3"></span>
                                        <span className="placeholder col-10 mb-3"></span>
                                        <span className="placeholder col-8 mb-3"></span>
                                        <span className="placeholder col-6"></span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Business</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.business}</span>
                                        </div>
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Owner</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.owner}</span>
                                        </div>
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Email</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.email}</span>
                                        </div>
                                        <div className="mb-0">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Phone</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.phone}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mt-10 shadow-sm">
                    <div className="card-header border-0 pt-5 pb-0">
                        <h3 className="card-title fw-bold">Draft Items</h3>
                    </div>
                    <div className="card-body pt-3">
                        {items.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th>Discount</th>
                                            <th>Tax</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td>{index + 1}</td>
                                                <td>{item.product?.product_name || item.product?.name || 'N/A'}</td>
                                                <td>{item.qty || 0}</td>
                                                <td>{formatCurrency(item.net_unit_price)}</td>
                                                <td>{formatCurrency(item.discount)}</td>
                                                <td>{formatCurrency(item.tax)}</td>
                                                <td>{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-light fw-semibold">
                                            <td colSpan={6} className="text-end">Subtotal</td>
                                            <td>{formatCurrency(draft.total_price)}</td>
                                        </tr>
                                        <tr className="table-light fw-semibold">
                                            <td colSpan={6} className="text-end">Discount</td>
                                            <td>{formatCurrency(draft.total_discount)}</td>
                                        </tr>
                                        <tr className="table-light fw-semibold">
                                            <td colSpan={6} className="text-end">Tax</td>
                                            <td>{formatCurrency(draft.total_tax)}</td>
                                        </tr>
                                        <tr className="table-primary fw-bold">
                                            <td colSpan={6} className="text-end text-white">Grand Total</td>
                                            <td className="text-white">{formatCurrency(draft.grand_total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">No items found for this draft</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDraftView;

