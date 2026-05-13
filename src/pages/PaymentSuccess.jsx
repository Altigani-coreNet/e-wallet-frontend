import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, Home, Loader2, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2pdf from 'html2pdf.js';
import { apiGet } from '../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../utils/constants';
import { PaymentCheckoutFooter, PaymentCheckoutHeader } from '../components/payment-links/PaymentCheckoutChrome';
import '../components/payment-links/PaymentLinkRedirect.css';
import './PaymentSuccess.css';

const receiptErrMessage = (res) => {
    if (typeof res.error === 'string' && res.error) return res.error;
    const d = res.details;
    if (d?.message) return d.message;
    return 'Could not load receipt.';
};

/**
 * Navigate here as `/:lang/payments/success/:uuid` only.
 * Receipt fields come from SoftPos `GET .../payment-links/uuid/{uuid}/receipt`.
 */
const PaymentSuccess = () => {
    const invoiceRef = useRef(null);
    const navigate = useNavigate();
    const { lang, uuid } = useParams();

    const [loading, setLoading] = useState(true);
    const [receipt, setReceipt] = useState(null);
    const [loadError, setLoadError] = useState(null);

    const uuidTrim = uuid ? String(uuid).trim() : '';

    const loadReceipt = useCallback(async () => {
        if (!uuidTrim) {
            setLoading(false);
            setLoadError('Missing payment reference.');
            return;
        }
        setLoading(true);
        setLoadError(null);

        const url = `${SOFTPOS_API_BASE}/payment-links/uuid/${encodeURIComponent(uuidTrim)}/receipt`;

        const maxAttempts = 6;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            /* eslint-disable no-await-in-loop */
            const res = await apiGet(url);
            if (res.success && res.data?.success !== false) {
                const payload = res.data?.data ?? null;
                setReceipt(payload);
                setLoading(false);
                return;
            }
            if (res.status === 409 && attempt < maxAttempts - 1) {
                await new Promise((r) => setTimeout(r, 700));
                continue;
            }
            setLoadError(receiptErrMessage(res));
            setLoading(false);
            return;
        }
    }, [uuidTrim]);

    useEffect(() => {
        void loadReceipt();
    }, [loadReceipt]);

    const amount = receipt?.amount != null && receipt.amount !== '' ? String(receipt.amount) : '';
    const currency = receipt?.currency_code || '';
    const method = receipt?.method || 'Card';
    const intent =
        receipt?.reference ||
        receipt?.stripe_payment_intent_id ||
        receipt?.transaction_id ||
        '';

    const paymentTime = useMemo(() => {
        if (receipt?.paid_at) {
            try {
                return new Date(receipt.paid_at).toLocaleString();
            } catch {
                /* ignore */
            }
        }
        return new Date().toLocaleString();
    }, [receipt?.paid_at]);

    const formattedAmount = useMemo(() => {
        if (amount === '' || Number.isNaN(Number(amount))) return null;
        const sym = receipt?.currency_symbol || currency || '';
        return `${sym} ${Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }, [amount, currency, receipt?.currency_symbol]);

    const statusLabel = receipt?.payment_status || receipt?.status || 'completed';

    const invoicePageUrl = useMemo(() => {
        if (!uuidTrim || typeof window === 'undefined') return null;
        const base = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin;
        return `${base}/link-invoice/${uuidTrim}`;
    }, [uuidTrim]);

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

    const homePath = lang ? `/${lang}` : '/';
    const checkoutPath = lang && uuidTrim ? `/${lang}/payments/${uuidTrim}` : '/';

    if (loading) {
        return (
            <div className="pl-page">
                <PaymentCheckoutHeader onBack={() => navigate(-1)} />
                <main className="pl-main pl-main--result ps-success-layout">
                    <div className="ps-page ps-success-page">
                        <div className="ps-receipt-card ps-receipt-card--loading" style={{ textAlign: 'center' }}>
                            <Loader2 size={40} className="ps-loading-spin" style={{ marginBottom: 16 }} />
                            <p style={{ margin: 0, color: '#6b7280' }}>Loading receipt…</p>
                        </div>
                    </div>
                </main>
                <PaymentCheckoutFooter onCancel={() => navigate(checkoutPath)} />
            </div>
        );
    }

    return (
        <div className="pl-page">
            <PaymentCheckoutHeader onBack={() => navigate(-1)} />
            <main className="pl-main pl-main--result ps-success-layout">
                <div className="ps-page ps-success-page">
                    <div className="ps-receipt-card" ref={invoiceRef}>
                        <div className="ps-header">
                            <div className="ps-success-icon">
                                <CheckCircle2 size={52} strokeWidth={2.5} />
                            </div>

                            <div className="ps-header-text">
                                <h1>Payment Success!</h1>
                                {formattedAmount ? <h2>{formattedAmount}</h2> : null}
                                <p>Thank you for using our platform. Your payment has been received.</p>
                                {loadError ? (
                                    <p style={{ color: '#b45309', marginTop: 12 }}>
                                        {loadError}.{' '}
                                        <button
                                            type="button"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#2563eb',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                padding: 0,
                                                font: 'inherit',
                                            }}
                                            onClick={() => void loadReceipt()}
                                        >
                                            Retry
                                        </button>
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="ps-line" />

                        <div className="ps-details">
                            {receipt?.merchant_name ? (
                                <div className="ps-detail-row">
                                    <span>Merchant</span>
                                    <strong>{receipt.merchant_name}</strong>
                                </div>
                            ) : null}
                            <div className="ps-detail-row">
                                <span>Payment time</span>
                                <strong>{paymentTime}</strong>
                            </div>
                            <div className="ps-detail-row">
                                <span>Status</span>
                                <strong>{String(statusLabel)}</strong>
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
                            {receipt?.stripe_payment_intent_id &&
                            receipt?.reference !== receipt?.stripe_payment_intent_id ? (
                                <div className="ps-detail-row">
                                    <span>Stripe payment</span>
                                    <strong style={{ wordBreak: 'break-all' }}>{receipt.stripe_payment_intent_id}</strong>
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
                            <Link className="ps-btn ps-btn-primary" to={homePath}>
                                <Home size={16} />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <PaymentCheckoutFooter onCancel={() => navigate(checkoutPath)} />
        </div>
    );
};

export default PaymentSuccess;
