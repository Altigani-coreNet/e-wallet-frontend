import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminSale } from '../../../services/adminSalesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import useAdminMerchantDetails from '../../../hooks/useAdminMerchantDetails';

const AdminSaleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();


    useEffect(() => {
        setTitle('Sale Details');
    }, [setTitle]);

    useEffect(() => {
        return () => setActions(null);
    }, [setActions]);

    const {
        data: saleResponse,
        isLoading,
        isFetching,
        error: saleError,
    } = useAdminSale(id);

    const sale = useMemo(() => {
        if (!saleResponse || saleResponse.success === false) return null;
        return saleResponse.data || null;
    }, [saleResponse]);

    useEffect(() => {
        if (!saleResponse) return;
        if (saleResponse.success === false) {
            const message = saleResponse?.message || saleResponse?.error || saleResponse?.data?.message || 'Failed to load sale details';
            toast.error(message);
        }
    }, [saleResponse]);

    useEffect(() => {
        if (!saleError) return;
        const message = saleError?.response?.data?.message || saleError.message || 'Failed to load sale details';
        toast.error(message);
    }, [saleError]);

    const {
        data: merchantData,
        isLoading: isMerchantLoading,
        isFetching: isMerchantFetching,
    } = useAdminMerchantDetails(sale?.shop_id);

    const merchantLoading = (isMerchantLoading || isMerchantFetching) && !!sale?.shop_id;
    const merchant = merchantData ?? null;

    const formatCurrency = (value) => {
        const amount = Number(value || 0);
        const symbol = sale?.currency_symbol || sale?.currency_object?.symbol || '$';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const formatStatus = (value, type = 'status') => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'number') {
            const numeric = Number(value);
            const paymentStatusMap = { 1: 'Paid', 0: 'Unpaid', 2: 'Partial', 3: 'Due' };
            if (type === 'payment') {
                return paymentStatusMap[numeric] || `Status ${numeric}`;
            }
            return numeric === 1 ? 'Active' : numeric === 0 ? 'Inactive' : `Status ${numeric}`;
        }
        const str = String(value).replace(/_/g, ' ').toLowerCase();
        return str.charAt(0).toUpperCase() + str.slice(1);
    };


    const handleViewInvoice = useCallback(() => {
        // Use encrypted_id if available, otherwise fallback to regular id
        const invoiceId = sale?.encrypted_id || sale?.id;
        
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
    }, [sale?.encrypted_id, sale?.id]);

    const goBackToList = useCallback(() => {
        navigate('/admin/sales/sales-list');
    }, [navigate]);

    useEffect(() => {
        setActions(
            <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-secondary" onClick={goBackToList}>
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
    }, [setActions, goBackToList, handleViewInvoice, sale?.encrypted_id, sale?.id]);

    const merchantInfo = useMemo(() => ({
        business: merchant?.business_name || merchant?.merchant?.business_name || merchant?.general_settings?.business_name || sale?.shop?.general_settings?.business_name || sale?.shop?.name || 'N/A',
        owner: merchant?.owner_name || merchant?.merchant?.owner_name || merchant?.user?.name || sale?.shop?.user?.name || 'N/A',
        email: merchant?.email || merchant?.merchant?.email || merchant?.user?.email || sale?.shop?.user?.email || sale?.shop?.email || 'N/A',
        phone: merchant?.phone || merchant?.merchant?.phone || merchant?.user?.phone || sale?.shop?.user?.phone || sale?.shop?.phone || 'N/A',
        address: merchant?.address || merchant?.business_address || merchant?.merchant?.address || sale?.shop?.general_settings?.address || 'N/A'
    }), [merchant, sale?.shop]);

    if (isLoading && !sale) return <LoadingSpinner />;

    if (!sale) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Sale not found</div>
                </div>
            </div>
        );
    }

    const items = Array.isArray(sale.product_sales) ? sale.product_sales : [];
    const showRefreshing = isFetching && !isLoading;

    return (
        <>
            <div className="card mb-5">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <h2 className="fw-bold">Sale Details</h2>
                    </div>
                </div>

                <div className="card-body pt-0">
                    {showRefreshing && (
                        <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                            <span className="spinner-border spinner-border-sm"></span>
                            <span>Refreshing sale data...</span>
                        </div>
                    )}
                    <div className="row g-5 g-xl-10">
                        <div className="col-lg-4">
                            <div className="card card-flush shadow-sm">
                                <div className="card-header border-0 pt-5 pb-0">
                                    <h3 className="card-title fw-bold">Sale Information</h3>
                                </div>
                                <div className="card-body pb-5">
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Reference</span>
                                        <span className="text-gray-900 fw-bold">{sale.reference_no}</span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Created At</span>
                                        <span className="text-gray-900 fw-bold">{new Date(sale.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Payment Status</span>
                                        <span className={`badge ${formatStatus(sale.payment_status, 'payment').includes('Paid') ? 'badge-light-success' : formatStatus(sale.payment_status, 'payment').includes('Partial') ? 'badge-light-warning' : 'badge-light-danger'}`}>
                                            {formatStatus(sale.payment_status, 'payment')}
                                        </span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Payment Method</span>
                                        <span className="text-gray-900 fw-bold">{formatStatus(sale.payment_method)}</span>
                                    </div>
                                    <div className="mb-0">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Sale Status</span>
                                        <span className="badge badge-light-primary">{formatStatus(sale.sale_status)}</span>
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
                                        <span className="text-gray-900 fw-bold">{sale.customer?.name || 'Walk-in Customer'}</span>
                                    </div>
                                    {sale.customer?.email && (
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Email</span>
                                            <span className="text-gray-900 fw-bold">{sale.customer.email}</span>
                                        </div>
                                    )}
                                    {sale.customer?.phone && (
                                        <div className="mb-0">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Phone</span>
                                            <span className="text-gray-900 fw-bold">{sale.customer.phone}</span>
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
                            <h3 className="card-title fw-bold">Products</h3>
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
                                                <td>{formatCurrency(sale.total_price)}</td>
                                            </tr>
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Discount</td>
                                                <td>{formatCurrency(sale.total_discount)}</td>
                                            </tr>
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Tax</td>
                                                <td>{formatCurrency(sale.total_tax)}</td>
                                            </tr>
                                            <tr className="table-light fw-semibold">
                                                <td colSpan={6} className="text-end">Shipping</td>
                                                <td>{formatCurrency(sale.shipping_cost)}</td>
                                            </tr>
                                            <tr className="table-primary fw-bold">
                                                <td colSpan={6} className="text-end text-white">Grand Total</td>
                                                <td className="text-white">{formatCurrency(sale.grand_total)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">No products found for this sale</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminSaleView;

