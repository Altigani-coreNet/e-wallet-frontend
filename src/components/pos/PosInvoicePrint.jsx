import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { SOFTPOS_ENDPOINTS } from '../../utils/constants';

const PosInvoicePrint = () => {
    const { id } = useParams(); // encrypted transaction id
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                const response = await fetch(SOFTPOS_ENDPOINTS.POS_INVOICE_PUBLIC(id));
                const result = await response.json();

                console.log('POS Invoice API Response:', result);

                if (response.ok && result.data) {
                    setInvoice(result.data);
                } else {
                    setError(result.message || 'Failed to load invoice');
                }
            } catch (err) {
                console.error('Error fetching POS invoice:', err);
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

    const getCurrencySymbol = () => {
        return invoice?.currency_symbol || invoice?.currency_object?.symbol || '$';
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
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="invoice-container">
            {/* Print Controls */}
            <div className="no-print mb-4 d-flex justify-content-end align-items-center" style={{ padding: '20px' }}>
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
                            {invoice.shop?.address || 'Merchant Address'}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="receipt-divider"></div>

                    {/* Customer Info */}
                    {(invoice.customer?.name || invoice.customer?.phone) && (
                        <div className="customer-info">
                            <div className="customer-line">
                                <span className="customer-label">Customer:</span>
                                <span className="customer-value">{invoice.customer?.name || 'Customer'}</span>
                            </div>
                            {invoice.customer?.phone && (
                                <div className="customer-line">
                                    <span className="customer-label">Phone No:</span>
                                    <span className="customer-value">{invoice.customer.phone}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status & Amount Block */}
                    <div className="status-amount-section">
                        <div className="status-text">
                            {String(invoice.payment_status || 'APPROVED').toUpperCase()}
                        </div>
                        <div className="amount-text">
                            {formatCurrency(invoice.footer?.grand_total ?? invoice.amount)}
                        </div>
                    </div>

                    {/* Split Payments Breakdown */}
                    {(invoice.footer?.split_payments?.paid && invoice.footer.split_payments.paid.length > 0) || 
                     (invoice.split_payments?.paid && invoice.split_payments.paid.length > 0) ? (
                        <>
                            <div className="receipt-divider"></div>
                            <div className="split-payments-section">
                                <div className="split-payments-title">Payment Breakdown:</div>
                                {((invoice.footer?.split_payments?.paid || invoice.split_payments?.paid) || []).map((payment, index) => (
                                    <div key={index} className="split-payment-row">
                                        <span>{payment.payment_method}:</span>
                                        <span>{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                                {((invoice.footer?.split_payments?.unpaid || invoice.split_payments?.unpaid) || []).map((payment, index) => (
                                    <div key={`unpaid-${index}`} className="split-payment-row split-payment-unpaid">
                                        <span>{payment.payment_method} (Pending):</span>
                                        <span>{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : null}

                    {/* Due Amount - Only show if there's a due amount */}
                    {((invoice.footer?.due_amount && invoice.footer.due_amount > 0) || 
                      (invoice.grand_total && invoice.paid_amount && (invoice.grand_total - invoice.paid_amount) > 0)) && (
                        <>
                            <div className="receipt-divider"></div>
                            <div className="due-amount-section">
                                <div className="due-amount-label">Due Amount:</div>
                                <div className="due-amount-value">
                                    {formatCurrency(
                                        invoice.footer?.due_amount ?? 
                                        (invoice.grand_total - invoice.paid_amount)
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Dashed Separator */}
                    <div className="receipt-divider"></div>

                    {/* QR Code Section */}
                    <div className="qr-section">
                        <div className="qr-title">Scan QR For E-Receipt</div>
                        <div className="qr-code">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                    invoice.invoice_url || window.location.href
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
                            <span className="detail-value">{invoice.merchant_id || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Terminal ID:</span>
                            <span className="detail-value">{invoice.terminal_id || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Payment Type:</span>
                            <span className="detail-value">{invoice.payment_method || 'Card'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Ref. No:</span>
                            <span className="detail-value">{invoice.ref_number || 'N/A'}</span>
                        </div>
                        {Array.isArray(invoice.meta) && invoice.meta.length > 0 && (
                            <>
                                <div className="receipt-divider" style={{ marginTop: '10px', marginBottom: '8px' }}></div>
                                {invoice.meta.map((metaItem, index) => (
                                    <div key={`meta-${index}`} className="detail-row">
                                        <span className="detail-label">
                                            {(metaItem?.key || '').toString().replace(/_/g, ' ')}:
                                        </span>
                                        <span className="detail-value">
                                            {metaItem?.value !== null && metaItem?.value !== undefined && metaItem?.value !== ''
                                                ? metaItem.value.toString()
                                                : 'N/A'}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
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
                .status-amount-section {
                    text-align: center;
                    margin: 12px 0 8px 0;
                }
                .status-text {
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .amount-text {
                    font-size: 24px;
                    font-weight: 800;
                    color: #000;
                }
                .receipt-divider { border-top: 2px dashed #ccc; margin: 12px 0; }
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
                .split-payments-section { margin-top: 8px; margin-bottom: 8px; }
                .split-payments-title { font-size: 12px; font-weight: 600; color: #000; margin-bottom: 6px; text-align: center; }
                .split-payment-row { display: flex; justify-content: space-between; font-size: 12px; color: #333; margin-bottom: 4px; }
                .split-payment-unpaid { color: #666; font-style: italic; }
                .due-amount-section { text-align: center; margin-top: 8px; margin-bottom: 8px; }
                .due-amount-label { font-size: 13px; font-weight: 600; color: #d32f2f; margin-bottom: 4px; }
                .due-amount-value { font-size: 16px; font-weight: 700; color: #d32f2f; }
                @media print {
                    .no-print { display: none !important; }
                    .invoice-container { background: white !important; }
                    .receipt-wrapper { padding: 0 !important; }
                    .receipt-content { max-width: 100% !important; box-shadow: none !important; padding: 20px !important; }
                    @page { margin: 1cm; size: 80mm auto; }
                }
            `}</style>
        </div>
    );
};

export default PosInvoicePrint;


