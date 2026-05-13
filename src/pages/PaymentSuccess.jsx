import React, { useEffect, useId, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCircle2, Home, Printer, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { apiGet } from '../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../utils/constants';
import { PaymentCheckoutFooter, PaymentCheckoutHeader } from '../components/payment-links/PaymentCheckoutChrome';
import '../components/payment-links/PaymentLinkRedirect.css';
import './PaymentSuccess.css';

const receiptErrMessage = (res, t) => {
    if (typeof res.error === 'string' && res.error) return res.error;
    const d = res.details;
    if (d?.message) return d.message;
    return t('paymentCheckout.success.couldNotLoadReceipt');
};

/**
 * Navigate here as `/:lang/payments/success/:uuid` only.
 * Receipt fields come from SoftPos `GET .../payment-links/uuid/{uuid}/receipt`.
 */
const PaymentSuccess = () => {
    const { t, i18n } = useTranslation();
    const burstGradId = useId().replace(/:/g, 'psg');
    const navigate = useNavigate();
    const { lang, uuid } = useParams();

    const [loading, setLoading] = useState(true);
    const [receipt, setReceipt] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [qrSize, setQrSize] = useState(152);
    const uuidTrim = uuid ? String(uuid).trim() : '';

    const checkoutPath = useMemo(
        () => (lang && uuidTrim ? `/${lang}/payments/${uuidTrim}` : '/'),
        [lang, uuidTrim],
    );

    const successPageClass = useMemo(
        () => `ps-page ps-success-page${(i18n.language || '').toLowerCase().startsWith('ar') ? ' ps-page--ar' : ''}`,
        [i18n.language],
    );

    const loadReceipt = useCallback(async () => {
        if (!uuidTrim) {
            setLoading(false);
            setLoadError(t('paymentCheckout.success.missingReference'));
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
            setLoadError(receiptErrMessage(res, t));
            setLoading(false);
            return;
        }
    }, [uuidTrim, t]);

    useEffect(() => {
        void loadReceipt();
    }, [loadReceipt]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const resizeQr = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            let size;
            if (w < 360) size = 118;
            else if (w < 420) size = 128;
            else if (w < 520) size = 140;
            else if (w >= 1200) size = 130;
            else if (w >= 901) size = 136;
            else size = 146;

            if (h <= 600) size = Math.min(size, 96);
            else if (h <= 720) size = Math.min(size, 110);
            else if (h <= 900) size = Math.min(size, 122);

            setQrSize(size);
        };
        resizeQr();
        window.addEventListener('resize', resizeQr);
        return () => window.removeEventListener('resize', resizeQr);
    }, []);

    const amount = receipt?.amount != null && receipt.amount !== '' ? String(receipt.amount) : '';
    const currency = receipt?.currency_code || '';
    const method =
        receipt?.method != null && receipt?.method !== ''
            ? String(receipt.method)
            : t('paymentCheckout.success.defaultMethodCard');
    const intent =
        receipt?.reference ||
        receipt?.stripe_payment_intent_id ||
        receipt?.transaction_id ||
        '';

    const paymentTypeDisplay = useMemo(() => {
        const m = receipt?.metadata;
        const meta = typeof m === 'object' && m !== null && !Array.isArray(m) ? m : {};
        if (meta.transaction_type) return String(meta.transaction_type).toUpperCase();
        if (receipt?.transaction_type) return String(receipt.transaction_type).toUpperCase();
        return 'SALE';
    }, [receipt]);

    const formattedDateTime = useMemo(() => {
        const raw = receipt?.paid_at;
        const d = raw ? new Date(raw) : new Date();
        try {
            const locale = i18n.language?.startsWith('ar') ? 'ar' : i18n.language;
            return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return d.toLocaleString();
        }
    }, [receipt?.paid_at, i18n.language]);

    const formattedAmount = useMemo(() => {
        if (amount === '' || Number.isNaN(Number(amount))) return null;
        const sym = receipt?.currency_symbol || currency || '';
        return `${sym}${Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }, [amount, currency, receipt?.currency_symbol]);

    const na = t('posInvoicePrint.placeholders.na');

    const merchantCodeDisplay =
        receipt?.merchant_code != null && String(receipt.merchant_code).trim() !== ''
            ? String(receipt.merchant_code)
            : na;
    const terminalIdDisplay =
        receipt?.terminal_id != null && receipt.terminal_id !== '' ? String(receipt.terminal_id) : na;
    const cardDisplay =
        receipt?.card_number != null && String(receipt.card_number).trim() !== ''
            ? String(receipt.card_number)
            : na;
    const expiryDisplay =
        receipt?.expiry != null && String(receipt.expiry).trim() !== '' ? String(receipt.expiry) : na;

    const receiptNoDisplay = intent || uuidTrim || na;

    const invoicePageUrl = useMemo(() => {
        if (!uuidTrim || typeof window === 'undefined') return null;
        const base = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin;
        return `${base}/link-invoice/${uuidTrim}`;
    }, [uuidTrim]);

    const qrPayload = useMemo(() => {
        if (invoicePageUrl) return invoicePageUrl;
        const lines = [
            formattedAmount && t('paymentCheckout.success.qrAmount', { value: formattedAmount }),
            method && t('paymentCheckout.success.qrMethod', { value: method }),
            intent && t('paymentCheckout.success.qrReference', { value: intent }),
        ].filter(Boolean);
        if (lines.length === 0) return null;
        return lines.join('\n');
    }, [invoicePageUrl, formattedAmount, method, intent, t]);

    const onShare = async () => {
        const url = invoicePageUrl || (typeof window !== 'undefined' ? window.location.href : '');
        const title = t('paymentCheckout.success.headingSuccessful');
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title, url });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            }
        } catch {
            /* user cancelled or unsupported */
        }
    };

    const onPrint = () => {
        if (typeof window !== 'undefined') window.print();
    };

    if (loading) {
        return (
            <div className="pl-page">
                <PaymentCheckoutHeader onBack={() => navigate(-1)} />
                <main className="pl-main pl-main--result ps-success-layout">
                    <div className={successPageClass}>
                        <div
                            className="ps-loading-placeholder"
                            aria-busy="true"
                            aria-live="polite"
                            aria-label={t('paymentCheckout.success.loadingReceipt')}
                        >
                            <div className="ps-loading-grid">
                                <div className="ps-loading-col">
                                    <div className="ps-skeleton-card">
                                        <div className="ps-skeleton ps-skeleton-circle" />
                                        <div className="ps-skeleton ps-skeleton-title" />
                                        <div className="ps-skeleton-row">
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--short" />
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--value" />
                                        </div>
                                        <div className="ps-skeleton-row">
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--short" />
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--value" />
                                        </div>
                                        <div className="ps-skeleton-row">
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--short" />
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--med" />
                                        </div>
                                    </div>
                                    <div className="ps-skeleton-card">
                                        <div className="ps-skeleton ps-skeleton-line ps-skeleton-line--center" />
                                        <div className="ps-skeleton ps-skeleton-qr" />
                                        <div className="ps-skeleton ps-skeleton-line ps-skeleton-line--center ps-skeleton-line--narrow" />
                                        <div className="ps-skeleton ps-skeleton-subhead" />
                                        <div className="ps-skeleton-row">
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--short" />
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--value" />
                                        </div>
                                        <div className="ps-skeleton-row">
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--short" />
                                            <span className="ps-skeleton ps-skeleton-line ps-skeleton-line--value" />
                                        </div>
                                    </div>
                                </div>
                                <div className="ps-loading-col ps-loading-col--hero">
                                    <div className="ps-skeleton-card ps-skeleton-card--hero">
                                        <div className="ps-skeleton ps-skeleton-burst" />
                                        <div className="ps-skeleton ps-skeleton-amount" />
                                        <div className="ps-skeleton ps-skeleton-line ps-skeleton-line--center ps-skeleton-line--status" />
                                    </div>
                                    <div className="ps-skeleton-actions">
                                        <span className="ps-skeleton ps-skeleton-btn" />
                                        <span className="ps-skeleton ps-skeleton-btn" />
                                        <span className="ps-skeleton ps-skeleton-btn ps-skeleton-btn--full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <div className="ps-no-print">
                    <PaymentCheckoutFooter onCancel={() => navigate(checkoutPath)} />
                </div>
            </div>
        );
    }

    return (
        <div className="pl-page">
            <div className="ps-no-print">
                <PaymentCheckoutHeader onBack={() => navigate(-1)} />
            </div>
            <main className="pl-main pl-main--result ps-success-layout">
                <div className={successPageClass}>
                    <div className="ps-success-shell">
                        <div className="ps-success-grid">
                            <aside className="ps-success-aside">
                                <section className="ps-panel ps-panel--summary">
                                    <div className="ps-panel-check" aria-hidden>
                                        <CheckCircle2 size={28} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="ps-panel-title">{t('paymentCheckout.success.headingSuccessful')}</h2>
                                    <dl className="ps-kv">
                                        {formattedAmount ? (
                                            <div className="ps-kv-row">
                                                <dt>{t('paymentCheckout.success.amountPaid')}</dt>
                                                <dd className="ps-kv-dd--amount">{formattedAmount}</dd>
                                            </div>
                                        ) : null}
                                        <div className="ps-kv-row">
                                            <dt>{t('paymentCheckout.success.paymentTypeLabel')}</dt>
                                            <dd>{paymentTypeDisplay}</dd>
                                        </div>
                                        <div className="ps-kv-row">
                                            <dt>{t('paymentCheckout.success.receiptNoLabel')}</dt>
                                            <dd className="ps-kv-dd--break">{receiptNoDisplay}</dd>
                                        </div>
                                    </dl>
                                    {loadError ? (
                                        <p className="ps-panel-error">
                                            {loadError}.{' '}
                                            <button type="button" className="ps-panel-retry" onClick={() => void loadReceipt()}>
                                                {t('paymentCheckout.success.retry')}
                                            </button>
                                        </p>
                                    ) : null}
                                </section>

                                <section className="ps-panel ps-panel--meta">
                                    {qrPayload ? (
                                        <div className="ps-qr-section">
                                            <h3 className="ps-subheading">{t('posInvoicePrint.qr.title')}</h3>
                                            <div
                                                className="ps-qr-wrap"
                                                role="img"
                                                aria-label={t('paymentCheckout.success.receiptQrAria')}
                                            >
                                                <QRCode value={qrPayload} size={qrSize} level="M" />
                                            </div>
                                            <p className="ps-qr-instruction">{t('posInvoicePrint.qr.instruction')}</p>
                                            {invoicePageUrl ? (
                                                <a className="ps-qr-link" href={invoicePageUrl} target="_blank" rel="noopener noreferrer">
                                                    {t('paymentCheckout.success.openReceipt')}
                                                </a>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <h3 className="ps-subheading ps-subheading--tx">{t('posInvoicePrint.labels.transactionDetails')}</h3>
                                    <dl className="ps-kv ps-kv--compact">
                                        <div className="ps-kv-row">
                                            <dt>{t('posInvoicePrint.labels.dateTime')}</dt>
                                            <dd>{formattedDateTime}</dd>
                                        </div>
                                        <div className="ps-kv-row">
                                            <dt>{t('paymentCheckout.success.merchantCode')}</dt>
                                            <dd>{merchantCodeDisplay}</dd>
                                        </div>
                                        <div className="ps-kv-row">
                                            <dt>{t('posInvoicePrint.labels.terminalId')}</dt>
                                            <dd>{terminalIdDisplay}</dd>
                                        </div>
                                        <div className="ps-kv-row">
                                            <dt>{t('paymentCheckout.success.cardNo')}</dt>
                                            <dd>{cardDisplay}</dd>
                                        </div>
                                        <div className="ps-kv-row">
                                            <dt>{t('posInvoicePrint.labels.expiry')}</dt>
                                            <dd>{expiryDisplay}</dd>
                                        </div>
                                    </dl>
                                </section>
                            </aside>

                            <div className="ps-success-main">
                                <section className="ps-hero-card">
                                    <div className="ps-hero-badge" aria-hidden>
                                        <svg className="ps-hero-burst" viewBox="0 0 120 120" width="96" height="96">
                                            <defs>
                                                <radialGradient id={burstGradId} cx="50%" cy="45%" r="65%">
                                                    <stop offset="0%" stopColor="#4ade80" />
                                                    <stop offset="100%" stopColor="#16a34a" />
                                                </radialGradient>
                                            </defs>
                                            <circle cx="60" cy="60" r="52" fill={`url(#${burstGradId})`} />
                                            {[...Array(12)].map((_, i) => (
                                                <line
                                                    key={`burst-ray-${i}`}
                                                    x1="60"
                                                    y1="8"
                                                    x2="60"
                                                    y2="18"
                                                    stroke="#22c55e"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    transform={`rotate(${i * 30} 60 60)`}
                                                />
                                            ))}
                                        </svg>
                                        <span className="ps-hero-check-wrap">
                                            <Check strokeWidth={3} size={36} />
                                        </span>
                                    </div>

                                    {formattedAmount ? <p className="ps-hero-amount">{formattedAmount}</p> : null}
                                    <p className="ps-hero-status">{t('paymentCheckout.success.headingSuccessful')}</p>
                                </section>

                                <div className="ps-hero-actions ps-no-print">
                                    <div className="ps-hero-actions-row ps-hero-actions-row--share-print">
                                        <button type="button" className="ps-btn-outline" onClick={() => void onShare()}>
                                            <Share2 size={18} strokeWidth={2} />
                                            {t('paymentCheckout.success.share')}
                                        </button>
                                        <button type="button" className="ps-btn-outline" onClick={onPrint}>
                                            <Printer size={18} strokeWidth={2} />
                                            {t('paymentCheckout.success.print')}
                                        </button>
                                    </div>
                                    <Link className="ps-btn-solid ps-btn-solid--home" to="/">
                                        <Home size={18} strokeWidth={2} />
                                        {t('paymentCheckout.success.backToHome')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <div className="ps-no-print">
                <PaymentCheckoutFooter onCancel={() => navigate(checkoutPath)} />
            </div>
        </div>
    );
};

export default PaymentSuccess;
