import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    PaymentRequestButtonElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../../utils/constants';
import './PaymentLinkRedirect.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const ELEMENT_OPTIONS = {
    // Disable Stripe Link “Autofill” prompt in card fields
    disableLink: true,
    style: {
        base: {
            fontSize: '15px',
            color: '#1a1a2e',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
};

const getLinkStatus = (link) =>
    String(link?.status || link?.payment_status || '').trim().toLowerCase();

const isPayableStatus = (status) => {
    // Payable states requested by user: pending / waiting to pay.
    const payable = new Set(['pending', 'waiting', 'waiting_to_pay', 'waiting-to-pay', 'active', 'unpaid']);
    return payable.has(status);
};

/* ─────────────────────────────────────────────────
   Inner form — must be rendered inside <Elements>
───────────────────────────────────────────────── */
const CheckoutForm = ({ uuid, linkData, amount, currencySymbol, currencyCode, merchantName, orderTitle, notes }) => {
    const stripe   = useStripe();
    const elements = useElements();

    const [submitting, setSubmitting] = useState(false);
    const [cardName, setCardName]     = useState('');
    const [cardBrand, setCardBrand]   = useState('unknown');
    const [paymentRequest, setPaymentRequest] = useState(null);
    const [walletReady, setWalletReady] = useState(false);
    const isCypress = typeof window !== 'undefined' && Boolean(window.Cypress);
    const redirectToError = (message) => {
        const params = new URLSearchParams({
            reason: message || 'Payment failed',
            uuid: uuid || '',
        });
        window.location.assign(`/payment/error?${params.toString()}`);
    };

    const displayAmount = `${currencyCode} ${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
    const formatMoney = (val) =>
        `${currencySymbol}${Number(val || 0).toFixed(2)} ${currencyCode}`;

    const onPayNow = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        if (!cardName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing details', text: 'Please enter the cardholder name.' });
            return;
        }

        setSubmitting(true);
        try {
            // ── Step 1: Ask backend to create a PaymentIntent ──────────────────
            const intentRes = await apiPost(
                `${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}/create-intent`,
                { cardholder_name: cardName },
            );

            if (!intentRes.success || !intentRes.data?.client_secret) {
                const intentError = intentRes.error || intentRes.data?.message || 'Failed to initialise payment.';
                redirectToError(intentError);
                return;
            }

            const { client_secret } = intentRes.data;

            // ── Step 2: Confirm card payment entirely on the client via Stripe.js ─
            // Card data is tokenised inside the Stripe-hosted CardNumberElement iframe
            // and sent directly to Stripe — it never touches our servers.
            // Cypress E2E mode: use Stripe test payment method directly because
            // Stripe Elements iframes are not reliably typeable in Cypress.
            const cypressPaymentMethod =
                isCypress && typeof window !== 'undefined' && window.Cypress?.env
                    ? window.Cypress.env('STRIPE_TEST_PAYMENT_METHOD')
                    : null;

            const confirmPayload = isCypress
                ? {
                      payment_method: cypressPaymentMethod || 'pm_card_visa',
                  }
                : {
                      payment_method: {
                          card: elements.getElement(CardNumberElement),
                          billing_details: {
                              name: cardName,
                          },
                      },
                  };

            const { paymentIntent, error } = await stripe.confirmCardPayment(client_secret, confirmPayload);

            if (error) {
                redirectToError(error.message || 'Card was rejected. Please try another payment method.');
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Payment successful',
                    text: 'Your payment was completed successfully.',
                    confirmButtonText: 'OK',
                });
                const successParams = new URLSearchParams({
                    amount: String(amount || 0),
                    currency: currencyCode || 'USD',
                    merchant: merchantName || 'Merchant',
                    method: 'Card',
                    uuid: uuid || '',
                    intent: paymentIntent.id || '',
                });
                window.location.assign(`/payment/success?${successParams.toString()}`);
                return;
            }

            redirectToError(`Payment not completed (status: ${paymentIntent?.status || 'unknown'}).`);
        } catch (err) {
            redirectToError(err.message || 'Unable to complete payment.');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!stripe) return;
        if (!amount || amount <= 0) return;

        const pr = stripe.paymentRequest({
            country: 'US',
            currency: String(currencyCode || 'USD').toLowerCase(),
            total: {
                label: orderTitle || 'Total',
                amount: Math.round(Number(amount) * 100),
            },
            requestPayerName: true,
        });

        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
                setWalletReady(true);
            } else {
                setPaymentRequest(null);
                setWalletReady(false);
            }
        });

        pr.on('paymentmethod', async (ev) => {
            try {
                // Create PaymentIntent server-side
                const intentRes = await apiPost(
                    `${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}/create-intent`,
                    { cardholder_name: ev.payerName || cardName || undefined },
                );

                if (!intentRes.success || !intentRes.data?.client_secret) {
                    const msg = intentRes.error || intentRes.data?.message || 'Failed to initialise payment.';
                    ev.complete('fail');
                    redirectToError(msg);
                    return;
                }

                const { client_secret } = intentRes.data;

                // Confirm with the wallet-provided payment method id
                const { paymentIntent, error } = await stripe.confirmCardPayment(
                    client_secret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false },
                );

                if (error) {
                    ev.complete('fail');
                    redirectToError(error.message || 'Payment failed.');
                    return;
                }

                ev.complete('success');

                if (paymentIntent?.status === 'requires_action') {
                    const { error: actionError, paymentIntent: pi2 } = await stripe.confirmCardPayment(client_secret);
                    if (actionError) {
                        redirectToError(actionError.message || 'Payment failed.');
                        return;
                    }

                    if (pi2?.status === 'succeeded') {
                        const successParams = new URLSearchParams({
                            amount: String(amount || 0),
                            currency: currencyCode || 'USD',
                            merchant: merchantName || 'Merchant',
                            method: 'Wallet',
                            uuid: uuid || '',
                            intent: pi2.id || '',
                        });
                        window.location.assign(`/payment/success?${successParams.toString()}`);
                        return;
                    }
                }

                if (paymentIntent?.status === 'succeeded') {
                    const successParams = new URLSearchParams({
                        amount: String(amount || 0),
                        currency: currencyCode || 'USD',
                        merchant: merchantName || 'Merchant',
                        method: 'Wallet',
                        uuid: uuid || '',
                        intent: paymentIntent.id || '',
                    });
                    window.location.assign(`/payment/success?${successParams.toString()}`);
                    return;
                }

                redirectToError(`Payment not completed (status: ${paymentIntent?.status || 'unknown'}).`);
            } catch (err) {
                ev.complete('fail');
                redirectToError(err.message || 'Payment failed.');
            }
        });
    }, [stripe, amount, currencyCode, orderTitle, uuid, merchantName, cardName]);

    return (
        <div className="pl-checkout-page">
            <div className="pl-checkout-grid">
                {/* ── Left: order summary ── */}
                <aside className="pl-summary-panel">
                    <div className="pl-platform-brand">
                        <div className="pl-platform-logo" aria-hidden="true">FP</div>
                        <div className="pl-platform-text">
                            <strong>FastPay</strong>
                            <span>Payment Platform</span>
                        </div>
                        <em>Sandbox</em>
                    </div>
                    <div className="pl-product-title">{orderTitle}</div>
                    <div className="pl-product-amount">{displayAmount}</div>
                    {notes && <div className="pl-summary-note">{notes}</div>}
                    <div className="pl-summary-meta">
                        <div className="pl-item-row">
                            <span>Subtotal</span>
                            <strong>{formatMoney(amount)}</strong>
                        </div>
                        <div className="pl-item-row">
                            <span>Tax</span>
                            <strong>{formatMoney(0)}</strong>
                        </div>
                        <div className="pl-divider" />
                        <div className="pl-grand-row">
                            <span>Total due</span>
                            <strong>{formatMoney(amount)}</strong>
                        </div>
                    </div>
                </aside>

                {/* ── Right: payment form ── */}
                <section className="pl-payment-panel">
                    <form onSubmit={onPayNow} className="pl-form" autoComplete="off">
                        <h4>Enter your card details</h4>
                        {walletReady && paymentRequest ? (
                            <div className="pl-wallet-box">
                                <div className="pl-wallet-title">Pay faster</div>
                                <PaymentRequestButtonElement
                                    options={{ paymentRequest }}
                                    className="pl-wallet-btn"
                                />
                                <div className="pl-wallet-sep">
                                    <span>or pay with card</span>
                                </div>
                            </div>
                        ) : null}
                        <div className="pl-card-box">
                            <div className="pl-card-method-row">
                                <div className="pl-card-method">Card</div>
                            </div>

                            <label>Card number</label>
                            <div className="pl-stripe-input">
                                <CardNumberElement
                                    options={ELEMENT_OPTIONS}
                                    onChange={(e) => setCardBrand(e?.brand || 'unknown')}
                                />
                                <span className="pl-card-icons" aria-hidden="true">
                                    <img
                                        className={`pl-card-icon ${cardBrand === 'visa' ? 'is-active' : ''}`}
                                        src="/visa.png"
                                        alt=""
                                    />
                                    <img
                                        className={`pl-card-icon ${cardBrand === 'mastercard' ? 'is-active' : ''}`}
                                        src="/card.png"
                                        alt=""
                                    />
                                    <img
                                        className={`pl-card-icon ${cardBrand === 'amex' ? 'is-active' : ''}`}
                                        src="/american-express.png"
                                        alt=""
                                    />
                                </span>
                            </div>

                            <div className="pl-form-row">
                                <div>
                                    <label>Expiry date</label>
                                    <div className="pl-stripe-input">
                                        <CardExpiryElement options={ELEMENT_OPTIONS} />
                                    </div>
                                </div>
                                <div>
                                    <label>CVC</label>
                                    <div className="pl-stripe-input">
                                        <CardCvcElement options={ELEMENT_OPTIONS} />
                                    </div>
                                </div>
                            </div>

                            <label>Cardholder name</label>
                            <input
                                type="text"
                                placeholder="Full name on card"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                autoComplete="off"
                                name="cardholder_name"
                            />
                        </div>

                        <label className="pl-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span>Save my information for faster checkout.</span>
                        </label>

                        <button type="submit" className="pl-pay-btn" disabled={submitting || !stripe}>
                            {submitting ? (
                                <>
                                    <Loader2 size={18} className="pl-btn-spinner" />
                                    Processing…
                                </>
                            ) : (
                                `Pay ${displayAmount}`
                            )}
                        </button>
                        <button
                            type="button"
                            className="pl-cancel-btn"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </button>

                        <div className="pl-powered">
                            <div className="pl-powered-top">
                                <span>Powered by</span>
                                <strong>FastPay</strong>
                                <span className="pl-powered-sep">•</span>
                                <a className="pl-powered-link" href="/terms">Terms</a>
                                <span className="pl-powered-sep">•</span>
                                <a className="pl-powered-link" href="/privacy">Privacy</a>
                            </div>
                            <div className="pl-powered-icons" aria-hidden="true">
                                <img className="pl-powered-icon" src="/visa.png" alt="" />
                                <img className="pl-powered-icon" src="/card.png" alt="" />
                                <img className="pl-powered-icon" src="/american-express.png" alt="" />
                                <img className="pl-powered-icon" src="/apple-pay.png" alt="" />
                                <img className="pl-powered-icon" src="/google-pay.png" alt="" />
                            </div>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   Outer wrapper — loads link data, wraps in Elements
───────────────────────────────────────────────── */
const PaymentLinkRedirect = () => {
    const { uuid }        = useParams();
    const [loading, setLoading]   = useState(true);
    const [linkData, setLinkData] = useState(null);
    const [linkUrl, setLinkUrl]   = useState('');

    useEffect(() => {
        if (!uuid) { setLoading(false); return; }
        (async () => {
            try {
                const res = await apiGet(`${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}`);
                if (!res.success || !res.data) throw new Error(res.message || 'Payment link not found');
                const fetchedRaw = res.data;
                const fetched = fetchedRaw?.data || fetchedRaw;
                const url = fetched?.link || fetchedRaw?.link || '';
                const status = getLinkStatus(fetched);

                if (!url) {
                    throw new Error('Payment link URL is missing');
                }

                if (!isPayableStatus(status)) {
                    const reason = status
                        ? `Payment link status is "${status}" and cannot be paid.`
                        : 'Payment link status is invalid.';
                    const params = new URLSearchParams({ reason, uuid: uuid || '' });
                    window.location.assign(`/payment/error?${params.toString()}`);
                    return;
                }

                setLinkData(fetched);
                setLinkUrl(url);
            } catch (err) {
                const params = new URLSearchParams({
                    reason: err.message || 'Unable to load payment link.',
                    uuid: uuid || '',
                });
                window.location.assign(`/payment/error?${params.toString()}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [uuid]);

    const amount         = useMemo(() => Number(linkData?.amount || 0), [linkData]);
    const currencySymbol = linkData?.currency_symbol || '$';
    const currencyCode   = linkData?.currency_code   || 'USD';
    const merchantName   = linkData?.merchant_name   || 'Merchant';
    const orderTitle     = linkData?.title           || 'Payment Link Checkout';
    const notes          = linkData?.description     || '';

    if (loading) {
        return (
            <div className="pl-checkout-page pl-checkout-page-loading">
                <div className="pl-checkout-grid pl-checkout-grid-loading">
                    <aside className="pl-summary-panel pl-summary-panel-loading">
                        <div className="pl-merchant-pill">
                            <span className="pl-loader-line pl-loader-pill-main" />
                        </div>
                        <div className="pl-product-title pl-loader-line pl-loader-title" />
                        <div className="pl-product-amount pl-loader-line pl-loader-amount" />
                        <div className="pl-summary-note pl-loader-line pl-loader-note" />
                        <div className="pl-summary-meta">
                            <div className="pl-item-row">
                                <span className="pl-loader-line pl-loader-label-inline" />
                                <strong className="pl-loader-line pl-loader-value-inline" />
                            </div>
                            <div className="pl-item-row">
                                <span className="pl-loader-line pl-loader-label-inline" />
                                <strong className="pl-loader-line pl-loader-value-inline" />
                            </div>
                            <div className="pl-divider" />
                            <div className="pl-grand-row">
                                <span className="pl-loader-line pl-loader-label-inline" />
                                <strong className="pl-loader-line pl-loader-value-inline" />
                            </div>
                        </div>
                    </aside>

                    <section className="pl-payment-panel pl-payment-panel-loading">
                        <div className="pl-form pl-form-loading">
                            <h4 className="pl-loader-line pl-loader-heading" />
                            <label className="pl-loader-line pl-loader-label" />
                            <div className="pl-loader-line pl-loader-input" />
                            <h4 className="pl-loader-line pl-loader-heading" />
                            <div className="pl-loader-cardbox">
                                <div className="pl-loader-line pl-loader-card-method" />
                                <label className="pl-loader-line pl-loader-label" />
                                <div className="pl-loader-line pl-loader-input" />
                                <div className="pl-loader-row-2">
                                    <div className="pl-loader-line pl-loader-input" />
                                    <div className="pl-loader-line pl-loader-input" />
                                </div>
                                <label className="pl-loader-line pl-loader-label" />
                                <div className="pl-loader-line pl-loader-input" />
                            </div>
                            <div className="pl-loader-line pl-loader-checkbox" />
                            <div className="pl-loader-btn pl-loader-pay" />
                            <div className="pl-loader-btn pl-loader-cancel" />

                            {/* Footer skeleton (Powered by / Terms / Privacy + cards row) */}
                            <div className="pl-loader-footer">
                                <div className="pl-loader-footer-top">
                                    <span className="pl-loader-line pl-loader-foot-text" />
                                    <span className="pl-loader-line pl-loader-foot-strong" />
                                    <span className="pl-loader-line pl-loader-foot-link" />
                                    <span className="pl-loader-line pl-loader-foot-link" />
                                </div>
                                <div className="pl-loader-footer-icons">
                                    <span className="pl-loader-line pl-loader-foot-card" />
                                    <span className="pl-loader-line pl-loader-foot-card" />
                                    <span className="pl-loader-line pl-loader-foot-card" />
                                    <span className="pl-loader-line pl-loader-foot-card" />
                                    <span className="pl-loader-line pl-loader-foot-card" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    if (!uuid || !linkUrl) {
        return null;
    }

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm
                uuid={uuid}
                linkData={linkData}
                amount={amount}
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
                merchantName={merchantName}
                orderTitle={orderTitle}
                notes={notes}
            />
        </Elements>
    );
};

export default PaymentLinkRedirect;
