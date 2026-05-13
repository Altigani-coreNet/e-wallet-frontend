import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import html2pdf from 'html2pdf.js';
import LoadingSpinner from '../common/LoadingSpinner';
import { SOFTPOS_ENDPOINTS } from '../../utils/constants';

/**
 * PDF page size for payment-link receipts (html2pdf.js → jsPDF).
 * Width: 80mm matches common thermal POS rolls and `@page { size: 80mm auto }` in print CSS.
 * Height: computed per invoice from DOM (see buildReceiptPdfPageSizeMm).
 */
export const RECEIPT_PDF_PAGE_WIDTH_MM = 80;
export const RECEIPT_PDF_MARGIN_MM = 5;
/** Cap single-page PDF height to avoid browser canvas limits on huge receipts. */
export const RECEIPT_PDF_MAX_PAGE_HEIGHT_MM = 800;
/** Minimum page height so tiny receipts still look normal. */
export const RECEIPT_PDF_MIN_PAGE_HEIGHT_MM = 100;

/** CSS px → mm at 96dpi (browser reference pixel). */
const cssPxToMm = (px) => (Number(px) * 25.4) / 96;

export function buildReceiptPdfPageSizeMm(receiptEl) {
    if (!receiptEl) {
        return {
            widthMm: RECEIPT_PDF_PAGE_WIDTH_MM,
            heightMm: RECEIPT_PDF_MIN_PAGE_HEIGHT_MM,
        };
    }
    const contentHeightMm = cssPxToMm(receiptEl.scrollHeight);
    const margins = RECEIPT_PDF_MARGIN_MM * 2;
    const heightMm = Math.ceil(contentHeightMm + margins + 6);
    return {
        widthMm: RECEIPT_PDF_PAGE_WIDTH_MM,
        heightMm: Math.min(
            RECEIPT_PDF_MAX_PAGE_HEIGHT_MM,
            Math.max(RECEIPT_PDF_MIN_PAGE_HEIGHT_MM, heightMm)
        ),
    };
}

/** Local YYYY-MM-DD for PDF filenames (`invoice-YYYY-MM-DD.pdf`). Uses invoice date when present. */
export function formatInvoicePdfFilenameDate(invoice) {
    const raw = invoice?.date || invoice?.created_at;
    let d = raw ? new Date(raw) : new Date();
    if (Number.isNaN(d.getTime())) {
        d = new Date();
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Small product thumbnail for receipt line (URL from payment-link line_items.image). */
const LineItemThumb = ({ src, name }) => {
    const { t } = useTranslation();
    const [errored, setErrored] = useState(false);
    if (!src || errored) {
        const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
        return (
            <div
                className="line-item-thumb line-item-thumb--placeholder"
                title={name || t('posInvoicePrint.placeholders.item')}
                aria-hidden
            >
                <span className="line-item-thumb-letter">{letter}</span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt=""
            className="line-item-thumb line-item-thumb--img"
            onError={() => setErrored(true)}
        />
    );
};

/**
 * Public invoice/receipt view for payment-link transactions (UUID from URL).
 * Same layout as POS invoice print; split so payment-link behavior can diverge later.
 */
const PosLinkInvoicePrint = () => {
    const { t } = useTranslation();
    const { uuid } = useParams();
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
                const endpoint = SOFTPOS_ENDPOINTS.LINK_INVOICE_PUBLIC(uuid);
                const response = await fetch(endpoint);
                const result = await response.json();

                console.log('Payment link invoice API response:', result);

                if (response.ok && result.data) {
                    setInvoice(result.data);
                } else {
                    setError(result.message || t('posInvoicePrint.errors.failedToLoad'));
                }
            } catch (err) {
                console.error('Error fetching payment link invoice:', err);
                setError(t('posInvoicePrint.errors.failedToLoadRetry'));
            } finally {
                setLoading(false);
            }
        };

        if (uuid) fetchInvoice();
    }, [uuid, t]);

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

                    {/* Date / invoice # — same pattern as sales InvoicePrint */}
                    <div className="transaction-info-top">
                        <div className="transaction-line">
                            <span className="transaction-label">{t('posInvoicePrint.labels.dateTime')}</span>
                            <span className="transaction-value">
                                {invoice.date ? formatDate(invoice.date) : formatDate(invoice.created_at)}
                            </span>
                        </div>
                        <div className="transaction-line">
                            <span className="transaction-label">{t('posInvoicePrint.labels.invoiceNumber')}</span>
                            <span className="transaction-value">
                                {invoice.receipt_number || invoice.reference_no || `RCPT-${invoice.id ?? ''}`}
                            </span>
                        </div>
                    </div>

                    <div className="receipt-divider"></div>

                    {/* Order line items from payment-link metadata (products[] from API) */}
                    {invoice.products && invoice.products.length > 0 && (
                        <>
                            <div className="order-summary-title">{t('posInvoicePrint.labels.orderSummary')}</div>
                            <div className="receipt-divider"></div>
                            <table className="items-table items-table--with-images">
                                <thead>
                                    <tr>
                                        <th className="item-thumb-col" aria-label={t('posInvoicePrint.table.imageAria')}></th>
                                        <th>{t('posInvoicePrint.table.item')}</th>
                                        <th>{t('posInvoicePrint.table.qty')}</th>
                                        <th>{t('posInvoicePrint.table.price')}</th>
                                        <th>{t('posInvoicePrint.table.total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.products.map((product, index) => (
                                        <tr key={index}>
                                            <td className="item-thumb-cell">
                                                <LineItemThumb src={product.image} name={product.name} />
                                            </td>
                                            <td className="item-name">{product.name}</td>
                                            <td className="item-qty">{product.qty ?? 1}</td>
                                            <td className="item-price">
                                                {formatCurrency(
                                                    product.net_unit_price ??
                                                        (product.total != null && product.qty
                                                            ? product.total / (product.qty || 1)
                                                            : 0)
                                                )}
                                            </td>
                                            <td className="item-total">{formatCurrency(product.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="receipt-divider"></div>
                        </>
                    )}

                    {/* Subtotal / Tax / Total (no large status + hero amount) */}
                    <div className="link-invoice-totals">
                        <div className="total-row">
                            <span>{t('posInvoicePrint.labels.subtotal')}</span>
                            <span>{formatCurrency(invoice.footer?.subtotal ?? invoice.amount ?? 0)}</span>
                        </div>
                        <div className="total-row">
                            <span>{t('posInvoicePrint.labels.tax')}</span>
                            <span>{formatCurrency(invoice.footer?.total_tax ?? 0)}</span>
                        </div>
                        {(invoice.footer?.shipping_cost ?? 0) > 0 && (
                            <div className="total-row">
                                <span>{t('posInvoicePrint.labels.shipping')}</span>
                                <span>{formatCurrency(invoice.footer.shipping_cost)}</span>
                            </div>
                        )}
                        <div className="total-row total-final">
                            <span>{t('posInvoicePrint.labels.total')}</span>
                            <span>{formatCurrency(invoice.footer?.grand_total ?? invoice.amount ?? 0)}</span>
                        </div>
                    </div>

                    {/* Split Payments Breakdown */}
                    {(invoice.footer?.split_payments?.paid && invoice.footer.split_payments.paid.length > 0) ||
                    (invoice.split_payments?.paid && invoice.split_payments.paid.length > 0) ? (
                        <>
                            <div className="receipt-divider"></div>
                            <div className="split-payments-section">
                                <div className="split-payments-title">{t('posInvoicePrint.labels.paymentBreakdown')}</div>
                                {((invoice.footer?.split_payments?.paid || invoice.split_payments?.paid) || []).map(
                                    (payment, index) => (
                                        <div key={index} className="split-payment-row">
                                            <span>
                                                {t('posInvoicePrint.splitPayment.methodLine', {
                                                    method: payment.payment_method,
                                                })}
                                            </span>
                                            <span>{formatCurrency(payment.amount)}</span>
                                        </div>
                                    )
                                )}
                                {((invoice.footer?.split_payments?.unpaid || invoice.split_payments?.unpaid) || []).map(
                                    (payment, index) => (
                                        <div key={`unpaid-${index}`} className="split-payment-row split-payment-unpaid">
                                            <span>
                                                {t('posInvoicePrint.splitPayment.pendingLine', {
                                                    method: payment.payment_method,
                                                })}
                                            </span>
                                            <span>{formatCurrency(payment.amount)}</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </>
                    ) : null}

                    {/* Due Amount - Only show if there's a due amount */}
                    {((invoice.footer?.due_amount && invoice.footer.due_amount > 0) ||
                        (invoice.grand_total && invoice.paid_amount && invoice.grand_total - invoice.paid_amount > 0)) && (
                        <>
                            <div className="receipt-divider"></div>
                            <div className="due-amount-section">
                                <div className="due-amount-label">{t('posInvoicePrint.labels.dueAmount')}</div>
                                <div className="due-amount-value">
                                    {formatCurrency(
                                        invoice.footer?.due_amount ?? invoice.grand_total - invoice.paid_amount
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
                            <span className="detail-value">
                                {invoice.date ? formatDate(invoice.date) : formatDate(invoice.created_at)}
                            </span>
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
                                    invoice.invoice_url || (typeof window !== 'undefined' ? window.location.href : '')
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
                .transaction-info-top { margin-bottom: 15px; margin-top: 0; }
                .transaction-line { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
                .transaction-label { font-weight: 600; color: #000; }
                .transaction-value { color: #333; }
                .order-summary-title { text-align: center; font-size: 16px; font-weight: bold; color: #000; margin-bottom: 12px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
                .items-table thead { border-bottom: 1px solid #ddd; }
                .items-table th { text-align: left; padding: 8px 4px; font-weight: 600; color: #000; font-size: 12px; }
                .items-table td { padding: 6px 4px; color: #333; vertical-align: middle; }
                .item-thumb-col { width: 48px; padding: 6px 4px 6px 0 !important; }
                .item-thumb-cell { width: 48px; padding: 6px 4px 6px 0 !important; vertical-align: middle; }
                .line-item-thumb {
                    width: 40px;
                    height: 40px;
                    border-radius: 6px;
                    flex-shrink: 0;
                    border: 1px solid #e8e8e8;
                    background: #f4f4f4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .line-item-thumb--img {
                    object-fit: cover;
                    padding: 0;
                }
                .line-item-thumb--placeholder { color: #888; font-size: 14px; font-weight: 600; }
                .line-item-thumb-letter { line-height: 1; }
                .item-name { text-align: left; }
                .item-qty { text-align: center; }
                .item-price { text-align: right; }
                .item-total { text-align: right; font-weight: 600; }
                .link-invoice-totals {
                    margin: 12px 0 8px 0;
                    padding-top: 4px;
                }
                .link-invoice-totals .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 14px;
                    color: #000;
                }
                .link-invoice-totals .total-final {
                    font-weight: 700;
                    font-size: 15px;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #ddd;
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

export default PosLinkInvoicePrint;
