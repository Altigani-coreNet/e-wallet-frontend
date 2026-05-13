import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import html2pdf from 'html2pdf.js';
import LoadingSpinner from '../common/LoadingSpinner';
import { SOFTPOS_ENDPOINTS } from '../../utils/constants';
import {
    buildReceiptPdfPageSizeMm,
    RECEIPT_PDF_MARGIN_MM,
    formatInvoicePdfFilenameDate,
} from './PosLinkInvoicePrint';

const PosInvoicePrint = () => {
    const { t } = useTranslation();
    const { id } = useParams(); // encrypted POS token for /pos-invoice/:id (payment-link invoices use PosLinkInvoicePrint)
    const receiptPdfRef = useRef(null);
    const pdfBusyRef = useRef(false);
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfBusy, setPdfBusy] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                const endpoint = SOFTPOS_ENDPOINTS.POS_INVOICE_PUBLIC(id);
                const response = await fetch(endpoint);
                const result = await response.json();

                console.log('POS Invoice API Response:', result);

                if (response.ok && result.data) {
                    setInvoice(result.data);
                } else {
                    setError(result.message || t('posInvoicePrint.errors.failedToLoad'));
                }
            } catch (err) {
                console.error('Error fetching POS invoice:', err);
                setError(t('posInvoicePrint.errors.failedToLoadRetry'));
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchInvoice();
    }, [id, t]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = useCallback(async () => {
        const el = receiptPdfRef.current;
        if (!el || pdfBusyRef.current) return;
        pdfBusyRef.current = true;
        setPdfBusy(true);
        try {
            const { widthMm, heightMm } = buildReceiptPdfPageSizeMm(el);
            const options = {
                margin: RECEIPT_PDF_MARGIN_MM,
                filename: `invoice-${formatInvoicePdfFilenameDate(invoice)}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false,
                },
                jsPDF: {
                    unit: 'mm',
                    format: [widthMm, heightMm],
                    orientation: 'portrait',
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            };
            await html2pdf().set(options).from(el).save();
        } catch (e) {
            console.error('PDF generation failed:', e);
            window.alert(t('posInvoicePrint.errors.pdfGenerationFailed'));
        } finally {
            pdfBusyRef.current = false;
            setPdfBusy(false);
        }
    }, [invoice, t]);

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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
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
                    <h4 className="alert-heading">{t('posInvoicePrint.errors.title')}</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="invoice-container">
            {/* Print Controls */}
            <div
                className="no-print mb-4 d-flex justify-content-end align-items-center flex-wrap gap-2"
                style={{ padding: '20px' }}
            >
                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => void handleDownloadPdf()}
                    disabled={pdfBusy}
                >
                    {pdfBusy ? t('posInvoicePrint.actions.generatingPdf') : t('posInvoicePrint.actions.downloadPdf')}
                </button>
                <button type="button" className="btn btn-primary" onClick={handlePrint}>
                    <i className="ki-duotone ki-printer fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    {t('posInvoicePrint.actions.printInvoice')}
                </button>
            </div>

            {/* Receipt Content */}
            <div className="receipt-wrapper">
                <div ref={receiptPdfRef} className="receipt-content">
                    {/* Logo & Branding */}
                    <div className="receipt-header">
                        <div className="receipt-logo">
                            <div className="logo-icon">FP</div>
                            <div className="logo-text">fastpay</div>
                        </div>
                    </div>

                    {/* Merchant Info */}
                    <div className="merchant-info">
                        <div className="merchant-name">{invoice.shop?.name || t('posInvoicePrint.placeholders.shop')}</div>
                    </div>

                    {/* Merchant Address */}
                    <div className="merchant-address-section">
                        <div className="merchant-address">
                            {invoice.shop?.address || t('posInvoicePrint.placeholders.merchantAddress')}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="receipt-divider"></div>

                    {/* Customer Info */}
                    {(invoice.customer?.name || invoice.customer?.phone) && (
                        <div className="customer-info">
                            <div className="customer-line">
                                <span className="customer-label">{t('posInvoicePrint.labels.customer')}</span>
                                <span className="customer-value">
                                    {invoice.customer?.name || t('posInvoicePrint.placeholders.customer')}
                                </span>
                            </div>
                            {invoice.customer?.phone && (
                                <div className="customer-line">
                                    <span className="customer-label">{t('posInvoicePrint.labels.phoneNo')}</span>
                                    <span className="customer-value">{invoice.customer.phone}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status & Amount Block */}
                    <div className="status-amount-section">
                        <div className="status-text">
                            {t(
                                `posInvoicePrint.paymentStatus.${String(invoice.payment_status ?? 'APPROVED')
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '_')}`,
                                { defaultValue: String(invoice.payment_status ?? 'APPROVED').toUpperCase() }
                            )}
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
                                <div className="split-payments-title">{t('posInvoicePrint.labels.paymentBreakdown')}</div>
                                {((invoice.footer?.split_payments?.paid || invoice.split_payments?.paid) || []).map((payment, index) => (
                                    <div key={index} className="split-payment-row">
                                        <span>
                                            {t('posInvoicePrint.splitPayment.methodLine', {
                                                method: payment.payment_method,
                                            })}
                                        </span>
                                        <span>{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                                {((invoice.footer?.split_payments?.unpaid || invoice.split_payments?.unpaid) || []).map((payment, index) => (
                                    <div key={`unpaid-${index}`} className="split-payment-row split-payment-unpaid">
                                        <span>
                                            {t('posInvoicePrint.splitPayment.pendingLine', {
                                                method: payment.payment_method,
                                            })}
                                        </span>
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
                                <div className="due-amount-label">{t('posInvoicePrint.labels.dueAmount')}</div>
                                <div className="due-amount-value">
                                    {formatCurrency(
                                        invoice.footer?.due_amount ?? 
                                        (invoice.grand_total - invoice.paid_amount)
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Transaction Details Footer */}
                    <div className="transaction-details-footer">
                        <div className="receipt-divider"></div>
                        <div className="transaction-details-title">{t('posInvoicePrint.labels.transactionDetails')}</div>
                        <div className="receipt-divider"></div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.date')}</span>
                            <span className="detail-value">{invoice.date ? formatDate(invoice.date) : formatDate(invoice.created_at)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.time')}</span>
                            <span className="detail-value">{invoice.time || formatTime(invoice.created_at)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.merchantCode')}</span>
                            <span className="detail-value">
                                {invoice.shop?.merchant_code || invoice.merchant_code || t('posInvoicePrint.placeholders.na')}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.terminalId')}</span>
                            <span className="detail-value">{invoice.terminal_id || t('posInvoicePrint.placeholders.na')}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.cardNumber')}</span>
                            <span className="detail-value">{invoice.card_number || t('posInvoicePrint.placeholders.na')}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.expiry')}</span>
                            <span className="detail-value">{invoice.expiry || t('posInvoicePrint.placeholders.na')}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.paymentMethod')}</span>
                            <span className="detail-value">{invoice.payment_method || t('posInvoicePrint.placeholders.na')}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.paymentType')}</span>
                            <span className="detail-value">
                                {invoice.transaction_type ||
                                    invoice.payment_type ||
                                    t('posInvoicePrint.placeholders.purchase')}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.transaction')}</span>
                            <span className="detail-value">
                                {invoice.transaction_id || invoice.id || t('posInvoicePrint.placeholders.na')}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{t('posInvoicePrint.labels.refNo')}</span>
                            <span className="detail-value">{invoice.ref_number || t('posInvoicePrint.placeholders.na')}</span>
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
                                                : t('posInvoicePrint.placeholders.na')}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Dashed Separator */}
                    <div className="receipt-divider"></div>

                    {/* QR Code Section */}
                    <div className="qr-section">
                        <div className="qr-title">{t('posInvoicePrint.qr.title')}</div>
                        <div className="qr-code" role="img" aria-label={t('posInvoicePrint.qr.ariaLabel')}>
                            <QRCode
                                value={
                                    invoice.invoice_url ||
                                    (typeof window !== 'undefined' ? window.location.href : '')
                                }
                                size={200}
                                level="M"
                            />
                        </div>
                        <div className="qr-instruction">{t('posInvoicePrint.qr.instruction')}</div>
                    </div>

                    {/* Thank You Message */}
                    <div className="thank-you-section">
                        <div className="thank-you-message">{t('posInvoicePrint.footer.thankYou')}</div>
                        <div className="powered-by">
                            {t('posInvoicePrint.footer.poweredBy', {
                                brand: invoice.powered_by || t('posInvoicePrint.footer.defaultBrand'),
                            })}
                        </div>
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
                .qr-code svg { width: 160px; height: 160px; border: 1px solid #e0e0e0; display: block; }
                .qr-instruction { font-size: 12px; color: #666; }
                .transaction-details-footer { margin-top: 15px; }
                .transaction-details-title {
                    text-align: center;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
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


