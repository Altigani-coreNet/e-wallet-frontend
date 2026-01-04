import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salesReportService } from '../../../services/salesReportService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import ReceivePaymentModal from './ReceivePaymentModal';
import usePosStore from '../../../stores/usePosStore';

const SaleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const { clearCart, addToCart, selectCustomer, applyDiscount, setAppliedCoupon, updateQuantity } = usePosStore();
    
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReceivePaymentModal, setShowReceivePaymentModal] = useState(false);

    useEffect(() => {
        setTitle('Sale Details');
        setBreadcrumbs([
            { label: 'Dashboard', url: '/sales/dashboard' },
            { label: 'Sales Report', url: null },
            { label: 'Sale Details', url: null },
        ]);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions]);

    // Handle invoice view - uses encrypted_id from the sale data
    const handleViewInvoice = () => {
        if (sale?.encrypted_id) {
            window.open(`/sales/invoice/${sale.encrypted_id}`, '_blank');
        }
    };

    // Handle continue draft sale - load products and customer into POS
    const handleContinueDraft = () => {
        if (!sale || !sale.products || sale.products.length === 0) {
            return;
        }

        // Clear current cart
        clearCart();

        // Load products into cart
        sale.products.forEach((product) => {
            // Map sale product to cart product format
            const cartProduct = {
                id: product.product_id || product.id,
                name: product.name || product.product_name || 'N/A',
                code: product.code || product.sku,
                price: product.net_unit_price || product.price || 0,
                quantity: 1, // Start with 1, will update quantity after
                tax: product.tax || 0,
                tax_rate: product.tax_rate || 0,
                tax_type: product.tax_type || 'exclusive',
                variant_id: product.variant_id || null,
                serial_imei_number: product.serial_imei_number || null,
                thumbnail: product.thumbnail || product.image || null,
                image: product.image || product.thumbnail || null,
            };

            // Add product to cart first (adds with quantity 1)
            addToCart(cartProduct);
            
            // Then update to correct quantity if more than 1
            if (product.qty && product.qty > 1) {
                updateQuantity(cartProduct.id, product.qty);
            }
        });

        // Set customer if exists
        if (sale.customer) {
            selectCustomer(sale.customer);
        }

        // Apply discount if exists
        if (sale.order_discount && sale.order_discount > 0) {
            applyDiscount(sale.order_discount);
        }

        // Apply coupon if exists
        if (sale.coupon_id || sale.coupon_discount) {
            setAppliedCoupon({
                id: sale.coupon_id,
                discount: sale.coupon_discount || 0,
            });
        }

        // Navigate to POS
        navigate('/sales/sale');
    };

    useEffect(() => {
        if (sale) {
            const dueAmount = (sale.grand_total || 0) - (sale.paid_amount || 0);
            const showReceivePayment = dueAmount > 0;
            const isDraft = sale.type === 'Draft' || sale.type === 'draft';

            setActions(
                <>
                    {isDraft && (
                        <button 
                            onClick={handleContinueDraft}
                            className="btn btn-sm btn-warning me-3"
                        >
                            <i className="ki-duotone ki-arrow-right fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Continue
                        </button>
                    )}
                    {showReceivePayment && (
                        <button 
                            onClick={() => setShowReceivePaymentModal(true)}
                            className="btn btn-sm btn-success me-3"
                        >
                            <i className="ki-duotone ki-money fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Receive Payment
                        </button>
                    )}
                    <button 
                        onClick={handleViewInvoice}
                        className="btn btn-sm btn-primary me-3"
                    >
                        <i className="ki-duotone ki-file-down fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        View Invoice
                    </button>
                    <button 
                        onClick={() => navigate(-1)}
                        className="btn btn-sm btn-light"
                    >
                        <i className="ki-duotone ki-arrow-left fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Back
                    </button>
                </>
            );
        }
        
        return () => {
            setActions(null);
        };
    }, [sale, navigate]);

    useEffect(() => {
        fetchSale();
    }, [id]);

    const fetchSale = async () => {
        try {
            const response = await salesReportService.getSaleDetails(id);

            // The sale data is in response.data (not nested)
            const saleData = response?.data.data || {};
            console.log(saleData, 'codes');
            setSale(saleData);
        } catch (err) {
            console.error('Error fetching sale:', err);
            setError(err.response?.data?.message || 'Failed to fetch sale details');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentReceived = () => {
        // Refresh sale data after payment
        fetchSale();
    };

    if (loading) {
        return (
            <div>
                {/* Logo Section Skeleton */}
                <div className="container mt-3 pb-5 border-bottom">
                    <div className="row align-items-center">
                        <div className="col-md-4">
                            <div className="skeleton-loader" style={{height: '80px', width: '250px'}}></div>
                        </div>
                        <div className="col-md-4 text-center">
                            <div className="skeleton-loader mx-auto" style={{height: '30px', width: '150px'}}></div>
                        </div>
                    </div>
                </div>

                {/* Sale and Customer Information Skeleton */}
                <div className="mt-5">
                    <div className="row mb-5">
                        {/* Sale Details Card Skeleton */}
                        <div className="col-md-6">
                            <div className="card card-flush">
                                <div className="card-header">
                                    <div className="skeleton-loader" style={{height: '24px', width: '120px'}}></div>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex flex-column gap-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <div className="skeleton-loader" style={{height: '20px', width: '120px'}}></div>
                                                <div className="skeleton-loader" style={{height: '20px', width: '100px'}}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Details Card Skeleton */}
                        <div className="col-md-6">
                            <div className="card card-flush">
                                <div className="card-header">
                                    <div className="skeleton-loader" style={{height: '24px', width: '140px'}}></div>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex flex-column gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <div className="skeleton-loader" style={{height: '20px', width: '120px'}}></div>
                                                <div className="skeleton-loader" style={{height: '20px', width: '150px'}}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table Skeleton */}
                <div className="card card-flush mt-5">
                    <div className="card-header">
                        <div className="skeleton-loader" style={{height: '24px', width: '100px'}}></div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                            <th key={i}>
                                                <div className="skeleton-loader" style={{height: '20px', width: '80px'}}></div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map((row) => (
                                        <tr key={row}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                                                <td key={col}>
                                                    <div className="skeleton-loader" style={{height: '20px', width: '60px'}}></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !sale) {
        return <ErrorAlert message={error || 'Sale not found'} />;
    }

    const getCurrencySymbol = () => {
        const currency = sale?.currency_object;
        return sale?.currency_symbol || currency?.symbol || currency?.currency_symbol || '$';
    };

    const formatCurrency = (value) => {
        const symbol = getCurrencySymbol();
        const amount = typeof value === 'number' ? value : parseFloat(value || 0);
        return `${symbol}${amount.toFixed(2)}`;
    };

    return (
        <div>
            {/* Sale and Customer Information */}
            <div className="mt-5">
                <div className="row mb-5">
                        {/* Sale Details - Left Side */}
                        <div className="col-md-6">
                            <div className="card card-flush">
                                <div className="card-header">
                                    <h3 className="card-title">Sale Details</h3>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                            <span className="text-gray-600 fw-bold">Date:</span>
                                            <span className="text-gray-800">{sale.date}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                            <span className="text-gray-600 fw-bold">Reference:</span>
                                            <span className="text-gray-800">{sale.reference_no}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                            <span className="text-gray-600 fw-bold">Payment Method:</span>
                                            <span className="text-gray-800">{sale.payment_method || 'N/A'}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                            <span className="text-gray-600 fw-bold">Payment Status:</span>
                                            <span>
                                                {sale.payment_status_label ? (
                                                    <span className={`badge ${
                                                        sale.payment_status_label === 'Paid' ? 'badge-light-success' :
                                                        sale.payment_status_label === 'Partial' ? 'badge-light-warning' :
                                                        'badge-light-danger'
                                                    }`}>
                                                        {sale.payment_status_label}
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-light-secondary">N/A</span>
                                                )}
                                            </span>
                                        </div>
                                        {sale.payment_link_url && (
                                            <div className="border-bottom pb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="text-gray-600 fw-bold">Payment Link:</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    <a
                                                        href={sale.payment_link_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="fw-bold text-primary"
                                                        style={{ wordBreak: 'break-all' }}
                                                    >
                                                        {sale.payment_link_url}
                                                    </a>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-light-primary btn-sm"
                                                            onClick={() => navigator.clipboard.writeText(sale.payment_link_url)}
                                                        >
                                                            Copy Link
                                                        </button>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => window.open(sale.payment_link_url, '_blank')}
                                                        >
                                                            Open Link
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {sale.biller && (
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <span className="text-gray-600 fw-bold">Biller:</span>
                                                <span className="text-gray-800">{sale.biller.name}</span>
                                            </div>
                                        )}
                                        {sale.warehouse && (
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <span className="text-gray-600 fw-bold">Warehouse:</span>
                                                <span className="text-gray-800">{sale.warehouse.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Details - Right Side */}
                        <div className="col-md-6">
                            {sale.customer ? (
                                <div className="card card-flush">
                                    <div className="card-header">
                                        <h3 className="card-title">Customer Details</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex flex-column gap-3">
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <span className="text-gray-600 fw-bold">Customer Name:</span>
                                                <span className="text-gray-800">{sale.customer.name}</span>
                                            </div>
                                            {sale.customer.email && (
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Email:</span>
                                                    <span className="text-gray-800">{sale.customer.email}</span>
                                                </div>
                                            )}
                                            {sale.customer.phone && (
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Phone:</span>
                                                    <span className="text-gray-800">{sale.customer.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card card-flush">
                                    <div className="card-header">
                                        <h3 className="card-title">Customer Details</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-gray-600 fw-bold">Customer:</span>
                                            <span className="text-gray-500">Walk-in Customer</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
            </div>

            {/* Products Table */}
            <div className="card card-flush mt-5">
                <div className="card-header">
                    <h3 className="card-title">Products</h3>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead className="table-light">
                                <tr>
                                    <th>SL</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Discount</th>
                                    <th>Gross Amount</th>
                                    <th>Tax Rate (%)</th>
                                    <th>Tax Amount</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.products && sale.products.length > 0 ? (
                                    <>
                                        {sale.products.map((product, index) => {
                                            // Calculate gross amount (qty * unit_price - discount)
                                            const unitPrice = product.net_unit_price || product.price || 0;
                                            const qty = product.qty || 0;
                                            const discount = product.discount || 0;
                                            const grossAmount = (unitPrice * qty) - discount;
                                            const taxRate = product.tax_rate || 0;
                                            const taxAmount = product.tax || 0;
                                            const total = product.total || 0;

                                            return (
                                                <tr key={index}>
                                                    <td><strong>{index + 1}</strong></td>
                                                    <td>
                                                        <div className="fw-semibold">
                                                            {product.name && product.name !== 'N/A' ? product.name : product.sku}
                                                        </div>
                                                        {product.code && (
                                                            <div className="text-muted small">{product.code}</div>
                                                        )}
                                                    </td>
                                                    <td className="text-center">{qty}</td>
                                                    <td className="text-end">{formatCurrency(unitPrice)}</td>
                                                    <td className="text-end">{formatCurrency(discount)}</td>
                                                    <td className="text-end">{formatCurrency(grossAmount)}</td>
                                                    <td className="text-end">{taxRate.toFixed(2)}%</td>
                                                    <td className="text-end">{formatCurrency(taxAmount)}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(total)}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="border-top-2">
                                            <td colSpan="8" className="text-end fw-bold">
                                                Subtotal:
                                            </td>
                                            <td className="text-end fw-bold">{formatCurrency(sale.total_price)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" className="text-end fw-semibold">
                                                Total Tax (from products):
                                            </td>
                                            <td className="text-end">
                                                {formatCurrency(
                                                    sale.products?.reduce((sum, product) => sum + (parseFloat(product.tax) || 0), 0) || 0
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" className="text-end fw-semibold">
                                                Order Discount:
                                            </td>
                                            <td className="text-end">{formatCurrency(sale.order_discount || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" className="text-end fw-semibold">
                                                Coupon Discount:
                                            </td>
                                            <td className="text-end">{formatCurrency(sale.coupon_discount || 0)}</td>
                                        </tr>
                                        <tr className="table-active border-top-2">
                                            <td colSpan="8" className="text-end fw-bold fs-4">
                                                Grand Total:
                                            </td>
                                            <td className="text-end fw-bold text-primary fs-4">{formatCurrency(sale.grand_total)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" className="text-end fw-semibold">
                                                Paid Amount:
                                            </td>
                                            <td className="text-end fw-bold text-success">{formatCurrency(sale.paid_amount || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" className="text-end fw-semibold">
                                                Due Balance:
                                            </td>
                                            <td className="text-end fw-bold text-danger">
                                                {formatCurrency((sale.grand_total || 0) - (sale.paid_amount || 0))}
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <div className="text-gray-500">No products found</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {sale.sale_note && (
                <div className="row mt-5">
                            <div className="col-12">
                                <div className="card card-flush py-4">
                                    <div className="card-header">
                                        <h3 className="card-title">Sale Note</h3>
                                    </div>
                                    <div className="card-body">
                                        {sale.sale_note}
                                    </div>
                                </div>
                            </div>
                    </div>
                )}

            {/* Payment Details Section */}
            {sale.sale_payments && sale.sale_payments.length > 0 && (
                <div className="row mt-5">
                            <div className="col-12">
                                <div className="card card-flush py-4">
                                    <div className="card-header">
                                        <h3 className="card-title">Payment Details</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-bordered">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Payment Method</th>
                                                        <th className="text-end">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sale.sale_payments.map((payment, index) => (
                                                        <tr key={payment.id || index}>
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <span className="fw-semibold">{payment.payment_method}</span>
                                                            </td>
                                                            <td className="text-end fw-bold">
                                                                {formatCurrency(payment.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="table-active border-top-2">
                                                        <td colSpan="2" className="text-end fw-bold fs-5">
                                                            Total Paid:
                                                        </td>
                                                        <td className="text-end fw-bold text-primary fs-5">
                                                            {formatCurrency(
                                                                sale.sale_payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {sale.grand_total && (
                                                        <tr>
                                                            <td colSpan="2" className="text-end fw-semibold">
                                                                Grand Total:
                                                            </td>
                                                            <td className="text-end fw-bold">
                                                                {formatCurrency(sale.grand_total)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {sale.grand_total && (
                                                        <tr>
                                                            <td colSpan="2" className="text-end fw-semibold">
                                                                {sale.payment_status_label === 'Paid' ? (
                                                                    <span className="text-success">Balance:</span>
                                                                ) : (
                                                                    <span className="text-danger">Due Amount:</span>
                                                                )}
                                                            </td>
                                                            <td className={`text-end fw-bold ${
                                                                sale.payment_status_label === 'Paid' ? 'text-success' : 'text-danger'
                                                            }`}>
                                                                {formatCurrency(
                                                                    sale.grand_total - sale.sale_payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

            <ReceivePaymentModal
                show={showReceivePaymentModal}
                onClose={() => setShowReceivePaymentModal(false)}
                sale={sale}
                onSuccess={handlePaymentReceived}
            />
        </div>
    );
};

export default SaleView;

