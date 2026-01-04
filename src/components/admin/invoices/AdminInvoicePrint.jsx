import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { POS_API_BASE } from '../../../utils/constants';

const AdminInvoicePrint = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                
                // Fetch without authentication headers for public access
                const response = await fetch(`${POS_API_BASE}/invoice/${id}`);
                const data = await response.json();
                
                console.log('Invoice API Response:', data);
                
                if (response.ok && data.data) {
                    setInvoice(data.data);
                } else {
                    setError(data.message || 'Failed to load invoice');
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError('Failed to load invoice. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        window.close();
    };

    const getCurrencySymbol = () => {
        return invoice?.currency_symbol || invoice?.currency_object?.symbol || invoice?.shop?.currency_symbol || invoice?.shop?.currency || '$';
    };

    const formatCurrency = (amount) => {
        const symbol = getCurrencySymbol();
        const value = typeof amount === 'number' ? amount : parseFloat(amount || 0);
        return `${symbol}${value.toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error</h4>
                    <p>{error}</p>
                    <hr />
                    <button className="btn btn-primary" onClick={handleClose}>
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="invoice-container">
            {/* Print Controls */}
            <div className="no-print mb-4 d-flex justify-content-between align-items-center" style={{ padding: '20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <button className="btn btn-secondary" onClick={handleClose}>
                    <i className="ki-duotone ki-cross fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Close
                </button>
                <button className="btn btn-primary" onClick={handlePrint}>
                    <i className="ki-duotone ki-printer fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    Print Invoice
                </button>
            </div>

            {/* Receipt Content */}
            <div className="receipt-wrapper">
                <div className="receipt-content">
                    {/* Logo & Branding */}
                    <div className="receipt-header">
                        <div className="receipt-logo">
                            <div className="logo-icon">FP</div>
                            <div className="logo-text">fastpay</div>
                        </div>
                    </div>

                    {/* Merchant Info */}
                    <div className="merchant-info">
                        <div className="merchant-name">{invoice.shop?.name || 'Shop'}</div>
                    </div>

                    {/* Merchant Address */}
                    <div className="merchant-address-section">
                        <div className="merchant-address">
                            {invoice.shop?.merchant?.address || invoice.shop?.address || 'Merchant Address'}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="receipt-divider"></div>

                    {/* Customer Info */}
                    {(invoice.customer?.name || invoice.customer?.phone || invoice.customer?.phone_number) && (
                        <div className="customer-info">
                            <div className="customer-line">
                                <span className="customer-label">Customer:</span>
                                <span className="customer-value">{invoice.customer?.name || 'Customer'}</span>
                            </div>
                            {(invoice.customer?.phone || invoice.customer?.phone_number) && (
                                <div className="customer-line">
                                    <span className="customer-label">Phone No:</span>
                                    <span className="customer-value">{invoice.customer?.phone || invoice.customer?.phone_number}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transaction Info Before Items */}
                    <div className="transaction-info-top">
                        <div className="transaction-line">
                            <span className="transaction-label">Date/Time:</span>
                            <span className="transaction-value">
                                {invoice.date ? formatDate(invoice.date) : formatDate(invoice.created_at)}
                            </span>
                        </div>
                        <div className="transaction-line">
                            <span className="transaction-label">Invoice #:</span>
                            <span className="transaction-value">{invoice.receipt_number || invoice.reference_no || `RCPT-${invoice.id}`}</span>
                        </div>
                    </div>

                    {/* Dashed Separator */}
                    <div className="receipt-divider"></div>

                    {/* Order Summary */}
                    <div className="order-summary-title">Order Summary</div>
                    <div className="receipt-divider"></div>

                    {/* Items Table */}
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.products && invoice.products.map((product, index) => (
                                <tr key={index}>
                                    <td className="item-name">{product.name}</td>
                                    <td className="item-qty">{product.qty || 1}</td>
                                    <td className="item-price">{formatCurrency(product.net_unit_price || product.total / (product.qty || 1))}</td>
                                    <td className="item-total">{formatCurrency(product.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Dashed Separator */}
                    <div className="receipt-divider"></div>

                    {/* Totals - All calculations from backend */}
                    <div className="totals-section">
                        {invoice.footer && (
                            <>
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(invoice.footer.subtotal)}</span>
                                </div>
                                {invoice.footer.total_discount > 0 && (
                                    <div className="total-row">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(invoice.footer.total_discount)}</span>
                                    </div>
                                )}
                                {(() => {
                                    // Use server-calculated VAT breakdown
                                    const vatBreakdown = invoice.footer.vat_breakdown || [];
                                    if (vatBreakdown.length > 0) {
                                        return vatBreakdown.map((vat, index) => (
                                            <div key={index} className="total-row">
                                                <span>{vat.tax_name || 'VAT'} ({vat.rate}%)</span>
                                                <span>{formatCurrency(vat.amount)}</span>
                                            </div>
                                        ));
                                    } else if (invoice.footer.total_tax > 0) {
                                        // Fallback to single VAT if no breakdown available
                                        return (
                                            <div className="total-row">
                                                <span>VAT {invoice.footer.tax_percentage ? `(${invoice.footer.tax_percentage}%)` : ''}</span>
                                                <span>{formatCurrency(invoice.footer.total_tax)}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {invoice.footer.shipping_cost > 0 && (
                                    <div className="total-row">
                                        <span>Shipping</span>
                                        <span>{formatCurrency(invoice.footer.shipping_cost)}</span>
                                    </div>
                                )}
                                <div className="total-row total-final">
                                    <span>Total</span>
                                    <span>{formatCurrency(invoice.footer.grand_total)}</span>
                                </div>
                                
                                {/* Split Payments Breakdown */}
                                {invoice.footer.split_payments && invoice.footer.split_payments.paid && invoice.footer.split_payments.paid.length > 0 && (
                                    <>
                                        <div className="receipt-divider" style={{ marginTop: '10px', marginBottom: '8px' }}></div>
                                        <div className="split-payments-section">
                                            <div className="split-payments-title">Payment Breakdown:</div>
                                            {invoice.footer.split_payments.paid.map((payment, index) => (
                                                <div key={index} className="total-row split-payment-row">
                                                    <span>{payment.payment_method}:</span>
                                                    <span>{formatCurrency(payment.amount)}</span>
                                                </div>
                                            ))}
                                            {invoice.footer.split_payments.unpaid && invoice.footer.split_payments.unpaid.length > 0 && (
                                                <>
                                                    {invoice.footer.split_payments.unpaid.map((payment, index) => (
                                                        <div key={`unpaid-${index}`} className="total-row split-payment-row split-payment-unpaid">
                                                            <span>{payment.payment_method} (Pending):</span>
                                                            <span>{formatCurrency(payment.amount)}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                                
                                {/* Due Amount - Only show if there's a due amount */}
                                {invoice.footer && invoice.footer.due_amount > 0 && (
                                    <div className="total-row due-amount-row">
                                        <span>Due Amount:</span>
                                        <span>{formatCurrency(invoice.footer.due_amount)}</span>
                                    </div>
                                )}
                            </>
                        )}
                        {!invoice.footer && (
                            <>
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(invoice.total_price || 0)}</span>
                                </div>
                                {invoice.total_tax > 0 && (
                                    <div className="total-row">
                                        <span>VAT</span>
                                        <span>{formatCurrency(invoice.total_tax)}</span>
                                    </div>
                                )}
                                {invoice.total_discount > 0 && (
                                    <div className="total-row">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(invoice.total_discount)}</span>
                                    </div>
                                )}
                                <div className="total-row total-final">
                                    <span>Total</span>
                                    <span>{formatCurrency(invoice.grand_total || 0)}</span>
                                </div>
                                
                                {/* Split Payments Breakdown for non-footer invoices */}
                                {invoice.split_payments && invoice.split_payments.paid && invoice.split_payments.paid.length > 0 && (
                                    <>
                                        <div className="receipt-divider" style={{ marginTop: '10px', marginBottom: '8px' }}></div>
                                        <div className="split-payments-section">
                                            <div className="split-payments-title">Payment Breakdown:</div>
                                            {invoice.split_payments.paid.map((payment, index) => (
                                                <div key={index} className="total-row split-payment-row">
                                                    <span>{payment.payment_method}:</span>
                                                    <span>{formatCurrency(payment.amount)}</span>
                                                </div>
                                            ))}
                                            {invoice.split_payments.unpaid && invoice.split_payments.unpaid.length > 0 && (
                                                <>
                                                    {invoice.split_payments.unpaid.map((payment, index) => (
                                                        <div key={`unpaid-${index}`} className="total-row split-payment-row split-payment-unpaid">
                                                            <span>{payment.payment_method} (Pending):</span>
                                                            <span>{formatCurrency(payment.amount)}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                                
                                {/* Due Amount - Only show if there's a due amount */}
                                {invoice.grand_total && invoice.paid_amount && (invoice.grand_total - invoice.paid_amount) > 0 && (
                                    <div className="total-row due-amount-row">
                                        <span>Due Amount:</span>
                                        <span>{formatCurrency(invoice.grand_total - invoice.paid_amount)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Dashed Separator */}
                    <div className="receipt-divider"></div>

                    {/* QR Code Section */}
                    <div className="qr-section">
                        <div className="qr-title">Scan QR For E-Receipt</div>
                        <div className="qr-code">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                    invoice.invoice_url || 
                                    `${window.location.origin}/sales/invoice/${invoice.id || id}` ||
                                    window.location.href
                                )}`}
                                alt="Receipt QR Code"
                            />
                        </div>
                        <div className="qr-instruction">
                            Use your phone camera to download the receipt.
                        </div>
                    </div>

                    {/* Dashed Separator */}
                    <div className="receipt-divider"></div>

                    {/* Transaction Details Footer */}
                    <div className="transaction-details-footer">
                        <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">{invoice.date ? formatDate(invoice.date) : formatDate(invoice.created_at)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">{invoice.time || formatTime(invoice.created_at)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Merchant ID:</span>
                            <span className="detail-value">{invoice.shop?.merchant_code || invoice.merchant_id || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Terminal ID:</span>
                            <span className="detail-value">{invoice.terminal_id || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Payment Type:</span>
                            <span className="detail-value">{invoice.payment_method || invoice.payment_type || 'Cash'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Ref. No:</span>
                            <span className="detail-value">{invoice.ref_number || invoice.reference_no || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Thank You Message */}
                    <div className="thank-you-section">
                        <div className="thank-you-message">Thank you for your purchase!</div>
                        <div className="powered-by">Powered by {invoice.powered_by || 'CoreNet Technologies'}</div>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                .invoice-container {
                    min-height: 100vh;
                    background: #f5f5f5;
                }
                .receipt-wrapper {
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                }
                .receipt-content {
                    width: 100%;
                    max-width: 400px;
                    background: white;
                    padding: 25px 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                    color: #000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 15px; }
                .logo-icon { width: 40px; height: 40px; background: #000; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
                .logo-text { font-size: 24px; font-weight: 600; color: #000; letter-spacing: -0.5px; }
                .merchant-info { text-align: center; margin-bottom: 0; }
                .merchant-name { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 0; }
                .merchant-address-section { text-align: center; margin-bottom: 0; }
                .merchant-address { font-size: 13px; color: #666; line-height: 1.5; }
                .customer-info { margin-bottom: 0; margin-top: 0; }
                .customer-line { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
                .customer-label { font-weight: 600; color: #000; }
                .customer-value { color: #333; }
                .transaction-info-top { margin-bottom: 15px; margin-top: 0; }
                .transaction-line { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
                .transaction-label { font-weight: 600; color: #000; }
                .transaction-value { color: #333; }
                .receipt-divider { border-top: 2px dashed #ccc; margin: 12px 0; }
                .order-summary-title { text-align: center; font-size: 16px; font-weight: bold; color: #000; margin-bottom: 12px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
                .items-table thead { border-bottom: 1px solid #ddd; }
                .items-table th { text-align: left; padding: 8px 4px; font-weight: 600; color: #000; font-size: 12px; }
                .items-table td { padding: 6px 4px; color: #333; }
                .item-name { text-align: left; }
                .item-qty { text-align: center; }
                .item-price { text-align: right; }
                .item-total { text-align: right; font-weight: 600; }
                .totals-section { margin-bottom: 15px; margin-top: 10px; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #000; }
                .total-final { font-weight: bold; font-size: 14px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; }
                .split-payments-section { margin-top: 8px; }
                .split-payments-title { font-size: 12px; font-weight: 600; color: #000; margin-bottom: 6px; }
                .split-payment-row { font-size: 12px; color: #333; margin-bottom: 4px; }
                .split-payment-unpaid { color: #666; font-style: italic; }
                .due-amount-row { font-weight: 600; color: #d32f2f; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; }
                .qr-section { text-align: center; padding-top: 10px; }
                .qr-title { font-size: 13px; font-weight: 600; color: #000; margin-bottom: 12px; }
                .qr-code { display: flex; justify-content: center; margin-bottom: 12px; }
                .qr-code img { width: 160px; height: 160px; border: 1px solid #e0e0e0; }
                .qr-instruction { font-size: 12px; color: #666; }
                .transaction-details-footer { margin-top: 15px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
                .detail-label { font-weight: 600; color: #000; }
                .detail-value { color: #333; }
                .thank-you-section { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; }
                .thank-you-message { font-size: 15px; font-weight: bold; color: #000; margin-bottom: 8px; }
                .powered-by { font-size: 12px; color: #999; }
                
                /* Print Styles */
                @media print {
                    .no-print { display: none !important; }
                    .invoice-container { background: white !important; }
                    .receipt-wrapper { padding: 0 !important; }
                    .receipt-content { 
                        max-width: 100% !important; 
                        box-shadow: none !important; 
                        padding: 20px !important; 
                    }
                    @page { 
                        margin: 1cm; 
                        size: 80mm auto; 
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminInvoicePrint;



