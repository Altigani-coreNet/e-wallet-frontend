import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '../../utils/lazyStripe';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGet, apiPost } from '../../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../../utils/constants';
import './PaymentLinkRedirect.css';
import { PaymentCheckoutHeader, PaymentCheckoutFooter } from './PaymentCheckoutChrome';

/** Matches `.pl-input` / Stripe Elements iframe styling */
const STRIPE_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '14px',
            color: '#111827',
            fontFamily: 'inherit',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#c1c8d0', fontWeight: '400' },
            iconColor: '#6b7280',
        },
        invalid: { color: '#dc2626' },
    },
};

/* ── helpers ─────────────────────────────────────────────────────────────── */

const getLinkStatus = (link) =>
    String(link?.status || link?.payment_status || '').trim().toLowerCase();

const isPayableStatus = (status) => {
    const payable = new Set(['pending', 'waiting', 'waiting_to_pay', 'waiting-to-pay', 'active', 'unpaid']);
    return payable.has(status);
};

const resolveLinkCurrency = (linkData) => {
    if (!linkData || typeof linkData !== 'object') return { currencyCode: 'USD', currencySymbol: '$' };
    const obj = linkData.currency_object && typeof linkData.currency_object === 'object'
        ? linkData.currency_object : null;
    const nested = linkData.currency && typeof linkData.currency === 'object' && !Array.isArray(linkData.currency)
        ? linkData.currency : null;
    const rawCode = linkData.currency_code || nested?.currency_code || obj?.currency_code || obj?.code || '';
    const code = String(rawCode || 'USD').trim().toUpperCase();
    const rawSym = linkData.currency_symbol || nested?.currency_symbol || obj?.symbol || obj?.currency_symbol || '';
    let symbol = String(rawSym || '').trim();
    if (!symbol) symbol = code === 'USD' ? '$' : code;
    return { currencyCode: code, currencySymbol: symbol };
};

const parsePaymentMetadata = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
    return typeof raw === 'object' ? raw : {};
};

/** SoftPos may return intent fields top-level or nested under `data` (wrapped envelopes). */
const unwrapIntentEnvelope = (body) => {
    if (!body || typeof body !== 'object') return body;
    const inner = body.data;
    if (
        inner &&
        typeof inner === 'object' &&
        !Array.isArray(inner) &&
        ('payment_intent_id' in inner || 'client_secret' in inner || (inner.id && String(inner.id).startsWith('pi_')))
    ) {
        return inner;
    }
    return body;
};

const fmt = (currencyCode, val) =>
    `${currencyCode} ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Cypress E2E: use Stripe test PaymentMethod ids (e.g. pm_card_visa) without typing into Elements iframes. */
const isCypressRuntime = () =>
    typeof window !== 'undefined' && Boolean(window.Cypress);

const getCypressTestPaymentMethodId = () => {
    if (!isCypressRuntime()) return null;
    try {
        const fromEnv = window.Cypress?.env?.('STRIPE_TEST_PAYMENT_METHOD');
        if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
        const fromStorage =
            window.localStorage.getItem('STRIPE_TEST_PAYMENT_METHOD')
            || window.sessionStorage.getItem('STRIPE_TEST_PAYMENT_METHOD');
        if (fromStorage && String(fromStorage).trim()) return String(fromStorage).trim();
    } catch {
        /* ignore storage access errors */
    }
    return null;
};

/**
 * Stripe Payment Link / Checkout: allowed method type strings from the API (`payment_method_types`),
 * same enum Stripe uses (card, ideal, klarna, …).
 */
const normalizeStripePaymentMethodTypes = (link) => {
    const raw = link?.payment_method_types;
    if (Array.isArray(raw) && raw.length) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) return parsed;
            return raw ? [raw] : ['card'];
        } catch {
            return raw ? [raw] : ['card'];
        }
    }
    return ['card'];
};

/* ── icons ───────────────────────────────────────────────────────────────── */

const IconShield = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const IconLock = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);
const IconChevronRight = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const IconChevronUp = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
);
const IconChevronDown = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const IconArrowLeft = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);
const IconInfo = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);
const IconBag = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
    </svg>
);
const IconCard = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
);
const IconImage = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);
const IconLinkPlay = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.25)" />
        <polygon points="10 8 16 12 10 16 10 8" fill="white" />
    </svg>
);

/* ── item image with placeholder ─────────────────────────────────────────── */

const ItemImage = ({ src, name }) => {
    const { t } = useTranslation();
    const [errored, setErrored] = useState(false);
    const fallback = t('paymentCheckout.page.itemFallback');

    if (!src || errored) {
        return (
            <div className="pl-item-placeholder" title={name || fallback}>
                <IconImage size={22} />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={name || fallback}
            className="pl-item-img"
            onError={() => setErrored(true)}
        />
    );
};

/** Merchant circle: logo from API or shopping-bag fallback */
const MerchantAvatar = ({ logoUrl, name }) => {
    const { t } = useTranslation();
    const [failed, setFailed] = useState(false);
    if (logoUrl && !failed) {
        return (
            <img
                src={logoUrl}
                alt={name || t('paymentCheckout.page.merchantFallback')}
                className="pl-merchant-avatar-img"
                onError={() => setFailed(true)}
            />
        );
    }
    return <IconBag size={20} />;
};

/**
 * Stripe.js collects card details → PaymentMethod id only; backend confirms PaymentIntent.
 * Same layout/classes as before (card fields are Stripe iframes inside the same wrappers).
 */
const CardPaymentFormInner = ({
    uuid,
    linkData,
    displayAmount,
    cardName,
    setCardName,
    submitting,
    setSubmitting,
    onPaidSuccess,
    onPaidError,
    onCancelReturn,
}) => {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();

    const handleConfirmIntentResponse = async (confirmRes) => {
        if (!confirmRes.success) {
            const msg = typeof confirmRes.error === 'string' ? confirmRes.error : (confirmRes.details?.message || t('paymentCheckout.errors.requestFailed'));
            onPaidError(msg);
            return;
        }
        const body = unwrapIntentEnvelope(confirmRes.data);
        if (!body || body.success === false) {
            const msg = body?.message || t('paymentCheckout.errors.paymentFailed');
            onPaidError(typeof msg === 'string' ? msg : t('paymentCheckout.errors.paymentFailed'));
            return;
        }

        if (body.requires_action && body.redirect_url) {
            window.location.href = body.redirect_url;
            return;
        }

        if (body.requires_action && body.client_secret) {
            if (!stripe) {
                onPaidError(t('paymentCheckout.errors.authenticationFailed'));
                return;
            }
            const { error: confirmErr, paymentIntent } = await stripe.confirmCardPayment(body.client_secret);
            if (confirmErr) {
                onPaidError(confirmErr.message || t('paymentCheckout.errors.authenticationFailed'));
                return;
            }
            if (paymentIntent?.status === 'succeeded') {
                onPaidSuccess({ payment_intent_id: paymentIntent.id });
                return;
            }
            onPaidError(t('paymentCheckout.errors.paymentNotCompleted'));
            return;
        }

        if (body.status === 'succeeded') {
            onPaidSuccess(body);
            return;
        }

        onPaidError(t('paymentCheckout.errors.paymentNotCompleted'));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cypressPmId = getCypressTestPaymentMethodId();
        if (!cypressPmId && (!stripe || !elements)) {
            return;
        }
        if (!cardName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: t('paymentCheckout.errors.missingDetailsTitle'),
                text: t('paymentCheckout.errors.missingCardholderName'),
            });
            return;
        }
        const allowed = normalizeStripePaymentMethodTypes(linkData);
        if (!allowed.includes('card')) {
            Swal.fire({
                icon: 'warning',
                title: t('paymentCheckout.errors.notAllowedTitle'),
                text: t('paymentCheckout.errors.cardNotEnabled'),
            });
            return;
        }

        if (!cypressPmId) {
            const cardNumberEl = elements?.getElement(CardNumberElement);
            if (!cardNumberEl) {
                onPaidError(t('paymentCheckout.errors.cardFormNotReady'));
                return;
            }
        }

        setSubmitting(true);
        try {
            const intentRes = await apiPost(`${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}/create-intent`, {
                cardholder_name: cardName.trim(),
            });
            if (!intentRes.success) {
                const msg = typeof intentRes.error === 'string' ? intentRes.error : (intentRes.details?.message || t('paymentCheckout.errors.requestFailed'));
                onPaidError(msg);
                return;
            }
            const intentPayload = unwrapIntentEnvelope(intentRes.data);
            if (!intentPayload || intentPayload.success === false) {
                const msg = intentPayload?.message || t('paymentCheckout.errors.couldNotStartPayment');
                onPaidError(typeof msg === 'string' ? msg : t('paymentCheckout.errors.couldNotStartPayment'));
                return;
            }

            const paymentIntentId = intentPayload.payment_intent_id || intentPayload.id;
            if (!paymentIntentId) {
                onPaidError(t('paymentCheckout.errors.missingPaymentIntentId'));
                return;
            }

            let paymentMethodId = cypressPmId;
            if (!paymentMethodId) {
                const cardNumberEl = elements.getElement(CardNumberElement);
                const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardNumberEl,
                    billing_details: { name: cardName.trim() },
                });
                if (pmError || !paymentMethod) {
                    onPaidError(pmError?.message || t('paymentCheckout.errors.invalidCardDetails'));
                    return;
                }
                paymentMethodId = paymentMethod.id;
            }

            const confirmRes = await apiPost(`${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}/confirm-intent`, {
                payment_intent_id: paymentIntentId,
                payment_method_id: paymentMethodId,
            });
            await handleConfirmIntentResponse(confirmRes);
        } catch (err) {
            onPaidError(err?.message || t('paymentCheckout.errors.genericRequestFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit(e);
            }}
            autoComplete="off"
        >
            <div className="pl-link-section">
                <div className="pl-link-header">{t('paymentCheckout.form.payFaster')}</div>
                <div className="pl-link-sub">
                    {t('paymentCheckout.form.paySecurelyWithLink')}
                    <button type="button" className="pl-info-btn" title={t('paymentCheckout.form.linkInfoTitle')}>
                        <IconInfo size={14} />
                    </button>
                </div>
                <button type="button" className="pl-link-btn">
                    <IconLinkPlay size={20} />
                    <Trans i18nKey="paymentCheckout.form.payWithLink" components={{ strong: <strong /> }} />
                </button>
                <div className="pl-divider-or"><span>{t('paymentCheckout.form.orPayWithCard')}</span></div>
            </div>

            <div className="pl-card-info-section">
                <h3 className="pl-card-heading">{t('paymentCheckout.form.cardInformation')}</h3>

                <div className="pl-field">
                    <label className="pl-label">{t('paymentCheckout.form.cardNumber')}</label>
                    <div className="pl-input-icon-wrap">
                        <div className="pl-stripe-card-wrap pl-stripe-card-wrap--with-brand-icons">
                            <CardNumberElement options={STRIPE_ELEMENT_OPTIONS} />
                        </div>
                        <div className="pl-card-icons">
                            <img src="/visa.png" alt="Visa" className="pl-ci" />
                            <img src="/card.png" alt="Mastercard" className="pl-ci" />
                            <img src="/american-express.png" alt="American Express" className="pl-ci" />
                        </div>
                    </div>
                </div>

                <div className="pl-fields-row">
                    <div className="pl-field">
                        <label className="pl-label">{t('paymentCheckout.form.expiryDate')}</label>
                        <div className="pl-stripe-card-wrap">
                            <CardExpiryElement options={STRIPE_ELEMENT_OPTIONS} />
                        </div>
                    </div>
                    <div className="pl-field">
                        <label className="pl-label">{t('paymentCheckout.form.cvc')}</label>
                        <div className="pl-input-icon-wrap">
                            <div className="pl-stripe-card-wrap pl-stripe-card-wrap--cvc">
                                <CardCvcElement options={STRIPE_ELEMENT_OPTIONS} />
                            </div>
                            <div className="pl-cvc-icon">
                                <img src="/secure.png" alt="" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pl-field">
                    <label className="pl-label">{t('paymentCheckout.form.cardholderName')}</label>
                    <input
                        type="text"
                        className="pl-input"
                        placeholder={t('paymentCheckout.form.cardholderPlaceholder')}
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        autoComplete="cc-name"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="pl-pay-btn"
                disabled={submitting || (!stripe && !getCypressTestPaymentMethodId())}
            >
                <IconLock size={17} />
                {submitting ? t('paymentCheckout.form.processing') : t('paymentCheckout.form.payAmount', { amount: displayAmount })}
            </button>

            {typeof onCancelReturn === 'function' ? (
                <button
                    type="button"
                    className="pl-cancel-return-mobile"
                    onClick={onCancelReturn}
                >
                    <IconArrowLeft size={15} />
                    {t('paymentCheckout.form.cancelReturn')}
                </button>
            ) : null}

            <div className="pl-ssl-row">
                <IconShield size={13} />
                {t('paymentCheckout.form.sslRow')}
            </div>
        </form>
    );
};

const CardPaymentForm = (props) => {
    const [stripe, setStripe] = useState(null);
    const [stripeLoadState, setStripeLoadState] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        getStripePromise()
            .then((instance) => {
                if (cancelled) return;
                setStripe(instance);
                setStripeLoadState(instance ? 'ready' : 'unavailable');
            })
            .catch(() => {
                if (!cancelled) setStripeLoadState('unavailable');
            });
        return () => { cancelled = true; };
    }, []);

    const cypressPmId = getCypressTestPaymentMethodId();

    if (stripeLoadState === 'loading' && !cypressPmId) {
        return (
            <div className="pl-card-info-section d-flex justify-content-center py-4">
                <span className="spinner-border spinner-border-sm text-primary" role="status" />
            </div>
        );
    }
    if (!stripe && !cypressPmId) {
        return (
            <div className="pl-card-info-section">
                <p style={{ color: '#b45309', fontSize: 14, margin: 0 }}>
                    <Trans i18nKey="paymentCheckout.form.stripeUnavailable" components={{ code: <code /> }} />
                </p>
            </div>
        );
    }
    return (
        <Elements stripe={stripe}>
            <CardPaymentFormInner {...props} />
        </Elements>
    );
};

/* ── checkout page ───────────────────────────────────────────────────────── */

const CheckoutPage = ({
    uuid, linkData, linkUrl,
    amount, currencyCode, merchantName, merchantLogoUrl, merchantUuid, notes,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const [cardName, setCardName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [itemsOpen, setItemsOpen] = useState(true);

    const metadata  = useMemo(() => parsePaymentMetadata(linkData?.metadata), [linkData?.metadata]);
    const lineItems = useMemo(() => (Array.isArray(metadata.line_items) ? metadata.line_items : []), [metadata.line_items]);

    const summaryShipping = useMemo(() => {
        const v = metadata.shipping ?? metadata.shipping_total;
        return v != null && v !== '' ? Number(v) : 0;
    }, [metadata.shipping, metadata.shipping_total]);

    const summaryTax = useMemo(() => {
        const v = metadata.tax_total ?? metadata.tax;
        return v != null && v !== '' ? Number(v) : 0;
    }, [metadata.tax_total, metadata.tax]);

    /** Line-item sum, else explicit metadata.subtotal; if there are no line items, match Total minus fees so Subtotal is not stuck at 0. */
    const summarySubtotal = useMemo(() => {
        if (metadata.subtotal != null && metadata.subtotal !== '') return Number(metadata.subtotal);
        const fromLines = lineItems.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity ?? 1)) / 100, 0);
        if (lineItems.length > 0) return fromLines;
        return Math.max(0, Number(amount || 0) - summaryShipping - summaryTax);
    }, [metadata.subtotal, lineItems, amount, summaryShipping, summaryTax]);

    const displayAmount     = fmt(currencyCode, amount);
    const merchantCategory  = linkData?.merchant_category
        || linkData?.merchant?.business_type
        || linkData?.business_type
        || t('paymentCheckout.page.defaultBusiness');
    const itemCount         = lineItems.length;
    const taxLabel          = metadata.tax_rate
        ? t('paymentCheckout.summary.taxWithRate', { rate: metadata.tax_rate })
        : t('paymentCheckout.summary.tax');

    const cancelReturnPath = lang ? `/${lang}/payments/cancel/${uuid}` : `/payments/cancel/${uuid}`;

    return (
        <div className="pl-page">
            <PaymentCheckoutHeader />

            <main className="pl-main">

                {/* Full-width heading above both columns */}
                <div className="pl-main-intro">
                    <h1 className="pl-page-title">{t('paymentCheckout.page.title')}</h1>
                    <p className="pl-page-subtitle">{t('paymentCheckout.page.subtitle')}</p>
                </div>

                {/* ── LEFT: two stacked cards ──────────────────────────────── */}
                <div className="pl-left">

                    {/* Card 1 — merchant */}
                    <div className="pl-card pl-card-merchant">
                        <div className="pl-section-label">{t('paymentCheckout.page.payingTo')}</div>
                            <div className="pl-merchant-row">
                            <div className={`pl-merchant-avatar${merchantLogoUrl ? ' pl-merchant-avatar--logo' : ''}`}>
                                <MerchantAvatar logoUrl={merchantLogoUrl} name={merchantName} />
                            </div>
                            <div className="pl-merchant-info">
                                <div className="pl-merchant-name">{merchantName}</div>
                                <div className="pl-merchant-cat">{merchantCategory}</div>
                            </div>
                            <button
                                type="button"
                                className="pl-view-merchant-btn"
                                disabled={!merchantUuid}
                                onClick={() => {
                                    if (merchantUuid && lang) {
                                        navigate(`/${lang}/payments/merchant/${merchantUuid}`);
                                    }
                                }}
                            >
                                {t('paymentCheckout.page.viewMerchant')} <IconChevronRight size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Card 2 — order */}
                    <div className="pl-card pl-card-order">
                        <div className="pl-order-header">
                            <div className="pl-section-label" style={{ marginBottom: 0 }}>{t('paymentCheckout.page.yourOrder')}</div>
                            {itemCount > 0 && (
                                <button
                                    type="button"
                                    className="pl-items-toggle"
                                    onClick={() => setItemsOpen(o => !o)}
                                >
                                    {itemCount} {itemCount === 1 ? t('paymentCheckout.page.item') : t('paymentCheckout.page.items')}
                                    {itemsOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                                </button>
                            )}
                        </div>

                        {notes && <p className="pl-notes">{notes}</p>}

                        {itemsOpen && lineItems.length > 0 && (
                            <div className="pl-items-list">
                                {lineItems.map((item, idx) => {
                                    const qty       = Number(item.quantity ?? 1);
                                    const unitMajor = Number(item.price || 0) / 100;
                                    const lineMajor = unitMajor * qty;
                                    return (
                                        <div key={`item-${idx}`} className="pl-item-row">
                                            <div className="pl-item-thumb">
                                                <ItemImage src={item.image} name={item.name} />
                                            </div>
                                            <div className="pl-item-details">
                                                <div className="pl-item-name">{item.name || t('paymentCheckout.page.itemFallback')}</div>
                                                <div className="pl-item-qty">
                                                    {t('paymentCheckout.page.quantityPrefix', { qty })}
                                                </div>
                                                {item.description && (
                                                    <div className="pl-item-desc">{item.description}</div>
                                                )}
                                            </div>
                                            <div className="pl-item-price">
                                                {fmt(currencyCode, lineMajor)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="pl-summary-rows">
                            <div className="pl-summary-row">
                                <span>{t('paymentCheckout.summary.subtotal')}</span>
                                <span>{fmt(currencyCode, summarySubtotal)}</span>
                            </div>
                            {summaryShipping > 0 && (
                                <div className="pl-summary-row">
                                    <span>{t('paymentCheckout.summary.shipping')}</span>
                                    <span>{fmt(currencyCode, summaryShipping)}</span>
                                </div>
                            )}
                            {summaryTax > 0 && (
                                <div className="pl-summary-row">
                                    <span>{taxLabel}</span>
                                    <span>{fmt(currencyCode, summaryTax)}</span>
                                </div>
                            )}
                            <div className="pl-summary-row pl-summary-total">
                                <span>{t('paymentCheckout.summary.total')}</span>
                                <strong>{displayAmount}</strong>
                            </div>
                        </div>

                        {/* Trust badges inside order card */}
                        <div className="pl-trust-badges">
                            <div className="pl-trust-badge">
                                <IconShield size={13} />
                                {t('paymentCheckout.trust.sslEncryption')}
                            </div>
                            <div className="pl-trust-badge">
                                <IconLock size={13} />
                                {t('paymentCheckout.trust.dataProtected')}
                            </div>
                            <div className="pl-trust-badge">
                                <IconCard size={13} />
                                {t('paymentCheckout.trust.trustedThousands')}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── RIGHT: payment form ──────────────────────────────────── */}
                <div className="pl-right">
                    <div className="pl-card">
                        <CardPaymentForm
                            uuid={uuid}
                            linkData={linkData}
                            displayAmount={displayAmount}
                            cardName={cardName}
                            setCardName={setCardName}
                            submitting={submitting}
                            setSubmitting={setSubmitting}
                            onCancelReturn={() => navigate(cancelReturnPath)}
                            onPaidSuccess={() => {
                                if (lang) {
                                    navigate(`/${lang}/payments/success/${uuid}`);
                                } else {
                                    navigate(`/payments/success/${uuid}`);
                                }
                            }}
                            onPaidError={() => {
                                if (lang) {
                                    navigate(`/${lang}/payments/error/${uuid}`);
                                } else {
                                    navigate(`/payments/error/${uuid}`);
                                }
                            }}
                        />
                    </div>
                </div>
            </main>

            <PaymentCheckoutFooter onCancel={() => navigate(cancelReturnPath)} />
        </div>
    );
};

/* ── loading skeleton ────────────────────────────────────────────────────── */

const LoadingPage = () => (
    <div className="pl-page">
        <PaymentCheckoutHeader />
        <main className="pl-main">
            <div className="pl-main-intro">
                <div className="pl-sk pl-sk-title" />
                <div className="pl-sk pl-sk-sub pl-sk-sub--intro" />
            </div>
            <div className="pl-left">
                <div className="pl-card">
                    <div className="pl-sk-merchant">
                        <div className="pl-sk pl-sk-avatar" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div className="pl-sk pl-sk-name" />
                            <div className="pl-sk pl-sk-cat" />
                        </div>
                    </div>
                    <div className="pl-sk pl-sk-row" />
                    <div className="pl-sk pl-sk-row" />
                    <div className="pl-sk pl-sk-row" />
                    <div className="pl-sk pl-sk-total" />
                </div>
            </div>
            <div className="pl-right">
                <div className="pl-card">
                    <div className="pl-sk pl-sk-link-btn" />
                    <div className="pl-sk pl-sk-divider" />
                    <div className="pl-sk pl-sk-heading" />
                    <div className="pl-sk pl-sk-input" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="pl-sk pl-sk-input" />
                        <div className="pl-sk pl-sk-input" />
                    </div>
                    <div className="pl-sk pl-sk-input" />
                    <div className="pl-sk pl-sk-pay-btn" />
                </div>
            </div>
        </main>
        <PaymentCheckoutFooter />
    </div>
);

/* ── root component — fetches data ───────────────────────────────────────── */

const PaymentLinkRedirect = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang, uuid: uuidFromPath } = useParams();
    const [searchParams]        = useSearchParams();
    const uuid = (uuidFromPath || searchParams.get('uuid') || searchParams.get('id') || '').trim();

    const [loading,  setLoading]  = useState(true);
    const [linkData, setLinkData] = useState(null);
    const [linkUrl,  setLinkUrl]  = useState('');

    useEffect(() => {
        if (!uuid) { setLoading(false); return; }
        const basePath = lang ? `/${lang}` : '';

        const redirectForTerminalLinkStatus = (fetched) => {
            const status = String(fetched?.status || '').trim().toLowerCase();
            const paymentStatus = String(fetched?.payment_status || '').trim().toLowerCase();
            if (status === 'completed' || paymentStatus === 'paid') {
                navigate(`${basePath}/payments/error/${uuid}`, { replace: true });
                return;
            }
            if (status === 'canceled' || status === 'cancelled') {
                navigate(`${basePath}/payments/cancel/${uuid}`, { replace: true });
                return;
            }
            navigate(`${basePath}/payments/error/${uuid}`, { replace: true });
        };

        (async () => {
            try {
                const res = await apiGet(`${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}`);
                if (!res.success || !res.data) throw new Error(res.message || 'Payment link not found');
                const raw     = res.data;
                const fetched = raw?.data || raw;
                const url     = fetched?.link || raw?.link || '';
                const status  = getLinkStatus(fetched);

                if (!url) throw new Error('Payment link URL is missing');

                if (!isPayableStatus(status)) {
                    redirectForTerminalLinkStatus(fetched);
                    return;
                }

                setLinkData(fetched);
                setLinkUrl(url);
            } catch {
                navigate(`${basePath}/payments/error/${uuid}`, { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [uuid, lang, navigate]);

    const amount         = useMemo(() => Number(linkData?.amount || 0), [linkData]);
    const { currencyCode } = useMemo(() => resolveLinkCurrency(linkData), [linkData]);
    const merchantName = linkData?.merchant_name
        || linkData?.merchant?.business_name
        || linkData?.merchant?.name
        || t('paymentCheckout.page.merchantFallback');
    const merchantLogoUrl = linkData?.merchant_logo_url || linkData?.merchant?.logo_url || '';
    const merchantUuid    = linkData?.merchant_uuid || linkData?.merchant?.uuid || linkData?.merchant?.id || '';
    const orderTitle     = linkData?.title         || 'Payment Link Checkout';
    const notes          = linkData?.description   || '';

    if (loading) return <LoadingPage />;
    if (!uuid || !linkUrl) return null;

    return (
        <CheckoutPage
            uuid={uuid}
            linkData={linkData}
            linkUrl={linkUrl}
            amount={amount}
            currencyCode={currencyCode}
            merchantName={merchantName}
            merchantLogoUrl={merchantLogoUrl}
            merchantUuid={merchantUuid}
            orderTitle={orderTitle}
            notes={notes}
        />
    );
};

export default PaymentLinkRedirect;
