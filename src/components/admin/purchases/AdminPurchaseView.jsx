import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPurchaseInvoice, sendPurchaseInvoice, useAdminPurchase } from '../../../services/adminPurchasesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import useAdminMerchantDetails from '../../../hooks/useAdminMerchantDetails';

const AdminPurchaseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    const [sendingInvoice, setSendingInvoice] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        setTitle('Purchase Details');
        setActions(
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/purchases')}>
                <i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i>
                Back to List
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate]);

    const {
        data: purchaseResponse,
        isLoading,
        isFetching,
        error: purchaseError,
        refetch: refetchPurchase,
    } = useAdminPurchase(id);

    const purchase = useMemo(() => {
        if (!purchaseResponse || purchaseResponse.success === false) return null;
        return purchaseResponse.data || null;
    }, [purchaseResponse]);

    useEffect(() => {
        if (!purchaseResponse) return;
        if (purchaseResponse.success === false) {
            const message = purchaseResponse?.message || purchaseResponse?.error || purchaseResponse?.data?.message || 'Failed to load purchase details';
            toast.error(message);
        }
    }, [purchaseResponse]);

    useEffect(() => {
        if (!purchaseError) return;
        const message = purchaseError?.response?.data?.message || purchaseError.message || 'Failed to load purchase details';
        toast.error(message);
    }, [purchaseError]);

    useEffect(() => {
        if (!purchase) return;
        const defaultEmail = purchase.supplier?.email || purchase.shop?.user?.email || '';
        if (defaultEmail && !email) {
            setEmail(defaultEmail);
        }
    }, [purchase, email]);

    const {
        data: merchantData,
        isLoading: isMerchantLoading,
        isFetching: isMerchantFetching,
    } = useAdminMerchantDetails(purchase?.shop_id);

    useEffect(() => {
        if (!email && merchantData?.email) {
            setEmail(merchantData.email);
        }
    }, [merchantData?.email, email]);

    const merchantLoading = (isMerchantLoading || isMerchantFetching) && !!purchase?.shop_id;
    const merchant = merchantData ?? null;

    const formatCurrency = (value) => {
        const amount = Number(value || 0);
        const symbol = purchase?.currency_symbol || purchase?.currency_object?.symbol || '$';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const buildPdfUrl = (pdfBase64) => {
        if (!pdfBase64) return null;
        const sanitized = pdfBase64.replace(/\s/g, '');
        return `data:application/pdf;base64,${sanitized}`;
    };

    const openPdfInNewTab = (pdfUrl) => {
        try {
            const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                toast.error('Please allow pop-ups to view the invoice');
            }
        } catch (error) {
            console.error('Error opening PDF in new tab:', error);
            toast.error('Unable to open invoice');
        }
    };

    const downloadPdf = (pdfUrl, filename) => {
        try {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error triggering PDF download:', error);
            toast.error('Unable to download invoice');
        }
    };

    const handleViewInvoice = async () => {
        try {
            const response = await getPurchaseInvoice(id);
            if (response.success && response.data?.pdf) {
                const pdfUrl = buildPdfUrl(response.data.pdf);
                if (pdfUrl) {
                    openPdfInNewTab(pdfUrl);
                } else {
                    toast.error('Invoice file is empty');
                }
            } else {
                toast.error('Invoice not available');
            }
        } catch (error) {
            console.error('Error viewing purchase invoice:', error);
            toast.error('Failed to load invoice');
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const response = await getPurchaseInvoice(id);
            if (response.success && response.data?.pdf) {
                const pdfUrl = buildPdfUrl(response.data.pdf);
                if (pdfUrl) {
                    const reference = purchase?.reference_no || id;
                    downloadPdf(pdfUrl, response.data.filename || `purchase-${reference}.pdf`);
                    toast.success('Invoice downloaded successfully');
                } else {
                    toast.error('Invoice file is empty');
                }
            } else {
                toast.error('Invoice not available');
            }
        } catch (error) {
            console.error('Error downloading purchase invoice:', error);
            toast.error('Failed to download invoice');
        }
    };

    const handleSendInvoice = async () => {
        if (!email) {
            toast.error('Please enter an email address');
            return;
        }
        try {
            setSendingInvoice(true);
            const response = await sendPurchaseInvoice(id, email);
            if (response.success) {
                toast.success('Invoice sent successfully');
                setEmailModalOpen(false);
                refetchPurchase();
            }
        } catch (error) {
            console.error('Error sending purchase invoice:', error);
            toast.error('Failed to send invoice');
        } finally {
            setSendingInvoice(false);
        }
    };

    const normalizeValue = (value) => {
        if (!value && value !== 0) return '';
        if (typeof value === 'object') {
            if ('label' in value) return value.label;
            if ('value' in value) return value.value;
            if ('name' in value) return value.name;
        }
        return value;
    };

    const formatPaymentStatus = (value) => {
        const normalized = normalizeValue(value);
        if (normalized === '' && normalized !== 0) return 'N/A';
        const map = { 1: 'Paid', 0: 'Unpaid', true: 'Paid', false: 'Unpaid', 2: 'Partial', 3: 'Due', paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial', due: 'Due' };
        if (normalized in map) {
            return map[normalized];
        }
        const asString = String(normalized);
        return asString.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const formatPurchaseStatus = (value) => {
        const normalized = normalizeValue(value);
        if (normalized === '' && normalized !== 0) return 'N/A';
        if (typeof normalized === 'number' || typeof normalized === 'boolean') {
            return Number(normalized) === 1 ? 'Completed' : 'Pending';
        }
        const asString = String(normalized);
        return asString.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const merchantInfo = useMemo(() => ({
        business: merchant?.business_name || merchant?.general_settings?.business_name || purchase?.shop?.general_settings?.business_name || purchase?.shop?.name || 'N/A',
        owner: merchant?.owner_name || merchant?.user?.name || purchase?.shop?.user?.name || 'N/A',
        email: merchant?.email || merchant?.user?.email || purchase?.shop?.user?.email || purchase?.shop?.email || 'N/A',
        phone: merchant?.phone || merchant?.user?.phone || purchase?.shop?.user?.phone || purchase?.shop?.phone || 'N/A',
        address: merchant?.address || merchant?.business_address || purchase?.shop?.general_settings?.address || 'N/A'
    }), [merchant, purchase?.shop]);

    const purchaseItems = useMemo(() => (
        Array.isArray(purchase?.purchase_products) ? purchase.purchase_products : []
    ), [purchase?.purchase_products]);

    const summaryTotals = useMemo(() => ({
        subtotal: formatCurrency(purchase?.total_cost),
        discount: formatCurrency(purchase?.total_discount ?? purchase?.order_discount),
        tax: formatCurrency(purchase?.total_tax ?? purchase?.order_tax),
        shipping: formatCurrency(purchase?.shipping_cost),
        grandTotal: formatCurrency(purchase?.grand_total),
        paidAmount: formatCurrency(purchase?.paid_amount),
        dueAmount: formatCurrency((Number(purchase?.grand_total || 0) - Number(purchase?.paid_amount || 0)))
    }), [purchase]);

    if (isLoading) return <LoadingSpinner />;

    if (!purchase) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Purchase not found</div>
                </div>
            </div>
        );
    }

    const paymentStatusBadge = formatPaymentStatus(purchase.payment_status);
    const showRefreshing = isFetching && !isLoading;

    return (
        <>
            <div className="card mb-5">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <h2 className="fw-bold">Purchase Details</h2>
                    </div>
                    <div className="card-toolbar d-flex gap-2">
                        <button className="btn btn-sm btn-light-info" onClick={() => setEmailModalOpen(true)}>
                            <i className="ki-duotone ki-send fs-2"><span className="path1"></span><span className="path2"></span></i>
                            Send Invoice
                        </button>
                        <button className="btn btn-sm btn-light-success" onClick={handleDownloadInvoice}>
                            <i className="ki-duotone ki-download fs-2"><span className="path1"></span><span className="path2"></span></i>
                            Download
                        </button>
                        <button className="btn btn-sm btn-light-primary" onClick={handleViewInvoice}>
                            <i className="ki-duotone ki-eye fs-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                            View Invoice
                        </button>
                    </div>
                </div>

                <div className="card-body pt-0">
                    {showRefreshing && (
                        <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                            <span className="spinner-border spinner-border-sm"></span>
                            <span>Refreshing purchase details...</span>
                        </div>
                    )}
                    <div className="row g-5 g-xl-10">
                        <div className="col-lg-4">
                            <div className="card card-flush shadow-sm">
                                <div className="card-header border-0 pt-5 pb-0">
                                    <h3 className="card-title fw-bold">Purchase Information</h3>
                                </div>
                                <div className="card-body pb-5">
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Reference</span>
                                        <span className="text-gray-900 fw-bold">{purchase.reference_no || 'N/A'}</span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Created At</span>
                                        <span className="text-gray-900 fw-bold">{new Date(purchase.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Warehouse</span>
                                        <span className="text-gray-900 fw-bold">{purchase.warehouse?.name || 'N/A'}</span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Payment Status</span>
                                        <span className={`badge ${paymentStatusBadge.includes('Paid') ? 'badge-light-success' : paymentStatusBadge.includes('Partial') ? 'badge-light-warning' : 'badge-light-danger'}`}>
                                            {paymentStatusBadge}
                                        </span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Payment Method</span>
                                        <span className="text-gray-900 fw-bold">{formatPurchaseStatus(purchase.payment_method)}</span>
                                    </div>
                                    <div className="mb-0">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Purchase Status</span>
                                        <span className="badge badge-light-primary">{formatPurchaseStatus(purchase.status)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="card card-flush shadow-sm">
                                <div className="card-header border-0 pt-5 pb-0">
                                    <h3 className="card-title fw-bold">Supplier Details</h3>
                                </div>
                                <div className="card-body pb-5">
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Supplier</span>
                                        <span className="text-gray-900 fw-bold">{purchase.supplier?.name || 'N/A'}</span>
                                    </div>
                                    {purchase.supplier?.email && (
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Email</span>
                                            <span className="text-gray-900 fw-bold">{purchase.supplier.email}</span>
                                        </div>
                                    )}
                                    {purchase.supplier?.phone && (
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Phone</span>
                                            <span className="text-gray-900 fw-bold">{purchase.supplier.phone}</span>
                                        </div>
                                    )}
                                    <div className="mb-0">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Address</span>
                                        <span className="text-gray-900 fw-bold">{purchase.supplier?.address || 'N/A'}</span>
                                    </div>
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
                            <h3 className="card-title fw-bold">Purchase Items</h3>
                        </div>
                        <div className="card-body pt-3">
                            {purchaseItems.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Unit Cost</th>
                                                <th>Discount</th>
                                                <th>Tax</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseItems.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.product?.product_name || item.product?.name || 'N/A'}</td>
                                                    <td>{item.qty || item.quantity || 0}</td>
                                                    <td>{formatCurrency(item.net_unit_cost)}</td>
                                                    <td>{formatCurrency(item.discount)}</td>
                                                    <td>{formatCurrency(item.tax)}</td>
                                                    <td>{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Subtotal</td>
                                                <td>{summaryTotals.subtotal}</td>
                                            </tr>
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Discount</td>
                                                <td>{summaryTotals.discount}</td>
                                            </tr>
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Tax</td>
                                                <td>{summaryTotals.tax}</td>
                                            </tr>
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Shipping</td>
                                                <td>{summaryTotals.shipping}</td>
                                            </tr>
                                            <tr className="table-primary fw-bold">
                                                <td colSpan={6} className="text-end text-white">Grand Total</td>
                                                <td className="text-white">{summaryTotals.grandTotal}</td>
                                            </tr>
                                            <tr className="table-secondary fw-bold">
                                                <td colSpan={6} className="text-end">Paid Amount</td>
                                                <td>{summaryTotals.paidAmount}</td>
                                            </tr>
                                            <tr className="table-secondary fw-bold">
                                                <td colSpan={6} className="text-end">Amount Due</td>
                                                <td>{summaryTotals.dueAmount}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">No products found for this purchase</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {emailModalOpen && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Send Invoice</h5>
                                <button type="button" className="btn-close" onClick={() => setEmailModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEmailModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSendInvoice} disabled={sendingInvoice}>
                                    {sendingInvoice ? 'Sending...' : 'Send Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPurchaseView;

