import React, { useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, Home, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2pdf from 'html2pdf.js';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
    const invoiceRef = useRef(null);
    const [searchParams] = useSearchParams();
    const paymentTime = new Date().toLocaleString();

    const amount = searchParams.get('amount') ?? '';
    const currency = searchParams.get('currency') || 'USD';
    const method = searchParams.get('method') || 'Card';
    const intent = searchParams.get('intent') || searchParams.get('reference') || '';
    const uuid = (searchParams.get('uuid') || '').trim();

    const formattedAmount = useMemo(() => {
        if (amount === '' || Number.isNaN(Number(amount))) return null;
        return `${currency} ${Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }, [amount, currency]);

    /** Same-origin URL as this app — opens <Route path="/link-invoice/:uuid" /> (PosInvoicePrint). */
    const invoicePageUrl = useMemo(() => {
        if (!uuid || typeof window === 'undefined') return null;
        const base = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin;
        return `${base}/link-invoice/${uuid}`;
    }, [uuid]);

    /** Payload encoded in the QR (invoice URL preferred; otherwise a short text summary). Rendered locally — no third-party QR image API. */
    const qrPayload = useMemo(() => {
        if (invoicePageUrl) return invoicePageUrl;
        const lines = [
            formattedAmount && `Amount: ${formattedAmount}`,
            method && `Method: ${method}`,
            intent && `Reference: ${intent}`,
        ].filter(Boolean);
        if (lines.length === 0) return null;
        return lines.join('\n');
    }, [invoicePageUrl, formattedAmount, method, intent]);

    const onDownloadInvoice = async () => {
        if (!invoiceRef.current) return;

        const options = {
            margin: [8, 8, 8, 8],
            filename: `receipt-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        await html2pdf().set(options).from(invoiceRef.current).save();
    };

    return (
        <div className="ps-page">
            <div className="ps-receipt-card" ref={invoiceRef}>
                <div className="ps-header">
                    <div className="ps-success-icon">
                        <CheckCircle2 size={52} strokeWidth={2.5} />
                    </div>

                    <div className="ps-header-text">
                        <h1>Payment Success!</h1>
                        {formattedAmount ? <h2>{formattedAmount}</h2> : null}
                        <p>Thank you for using our platform. Your payment has been received.</p>
                    </div>
                </div>

                <div className="ps-line" />

                <div className="ps-details">
                    <div className="ps-detail-row">
                        <span>Payment time</span>
                        <strong>{paymentTime}</strong>
                    </div>
                    <div className="ps-detail-row">
                        <span>Status</span>
                        <strong>Completed</strong>
                    </div>
                    {formattedAmount ? (
                        <div className="ps-detail-row">
                            <span>Amount paid</span>
                            <strong>{formattedAmount}</strong>
                        </div>
                    ) : null}
                    {method ? (
                        <div className="ps-detail-row">
                            <span>Payment method</span>
                            <strong>{method}</strong>
                        </div>
                    ) : null}
                    {intent ? (
                        <div className="ps-detail-row">
                            <span>Reference</span>
                            <strong>{intent}</strong>
                        </div>
                    ) : null}
                </div>

                {qrPayload ? (
                    <>
                        <div className="ps-dash" />
                        <div className="ps-qr-block">
                            <div className="ps-qr-title">
                                <QrCode size={20} aria-hidden />
                                Receipt QR
                            </div>
                            <div className="ps-qr-image ps-qr-svg" role="img" aria-label="Receipt QR code">
                                <QRCode value={qrPayload} size={180} level="M" />
                            </div>
                            <small>
                                {invoicePageUrl
                                    ? 'Scan to open your e-receipt in the browser.'
                                    : 'Scan to view a short summary of this payment.'}
                            </small>
                            {invoicePageUrl ? (
                                <a className="ps-qr-link" href={invoicePageUrl} target="_blank" rel="noopener noreferrer">
                                    Open receipt
                                </a>
                            ) : null}
                        </div>
                    </>
                ) : null}

                <div className="ps-actions">
                    <button type="button" className="ps-btn ps-btn-light" onClick={onDownloadInvoice}>
                        <Download size={16} />
                        Download Receipt
                    </button>
                    <Link className="ps-btn ps-btn-primary" to="/">
                        <Home size={16} />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
