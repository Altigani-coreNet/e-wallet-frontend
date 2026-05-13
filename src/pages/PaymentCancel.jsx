import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Home, Loader2, RotateCcw } from 'lucide-react';
import { apiGet } from '../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../utils/constants';
import { PaymentCheckoutFooter, PaymentCheckoutHeader } from '../components/payment-links/PaymentCheckoutChrome';
import '../components/payment-links/PaymentLinkRedirect.css';
import './PaymentError.css';

const linkErrMessage = (res) => {
    if (typeof res.error === 'string' && res.error) return res.error;
    const d = res.details;
    if (d?.message) return d.message;
    return 'Could not load payment details.';
};

/**
 * `/:lang/payments/cancel/:uuid` — context from `GET .../payment-links/uuid/{uuid}`.
 */
const PaymentCancel = () => {
    const navigate = useNavigate();
    const { lang, uuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [linkData, setLinkData] = useState(null);
    const [loadError, setLoadError] = useState(null);

    const uuidTrim = uuid ? String(uuid).trim() : '';

    useEffect(() => {
        if (!uuidTrim) {
            setLoading(false);
            setLoadError('Missing payment reference.');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await apiGet(
                    `${SOFTPOS_API_BASE}/payment-links/uuid/${encodeURIComponent(uuidTrim)}`,
                );
                if (cancelled) return;
                if (!res.success) {
                    setLoadError(linkErrMessage(res));
                    setLoading(false);
                    return;
                }
                const root = res.data;
                if (root?.success === false) {
                    setLoadError(root?.message || 'Payment link not found.');
                    setLoading(false);
                    return;
                }
                setLinkData(root?.data ?? null);
            } catch (e) {
                if (!cancelled) setLoadError(e?.message || linkErrMessage({}));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [uuidTrim]);

    const amount = linkData?.amount != null && linkData.amount !== '' ? String(linkData.amount) : '';
    const currency = linkData?.currency_code || '';

    const formattedAmount = useMemo(() => {
        if (amount === '' || Number.isNaN(Number(amount))) return '';
        const sym = linkData?.currency_symbol || currency || '';
        return `${sym} ${Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }, [amount, currency, linkData?.currency_symbol]);

    const homePath = lang ? `/${lang}` : '/';
    const checkoutPath = lang && uuidTrim ? `/${lang}/payments/${uuidTrim}` : '/';

    if (loading) {
        return (
            <div className="pl-page">
                <PaymentCheckoutHeader onBack={() => navigate(-1)} />
                <main className="pl-main pl-main--result pe-result-layout">
                    <div className="pe-page pe-result-page">
                        <div className="pe-card pe-card--loading" style={{ textAlign: 'center' }}>
                            <Loader2 size={40} className="pe-loading-spin" style={{ marginBottom: 16 }} />
                            <p style={{ margin: 0, color: '#6b7280' }}>Loading…</p>
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
            <main className="pl-main pl-main--result pe-result-layout">
                <div className="pe-page pe-result-page">
                    <div className="pe-card">
                        <div className="pe-header">
                            <div className="pe-error-icon">
                                <CircleAlert size={52} strokeWidth={2.5} />
                            </div>
                            <div className="pe-header-text">
                                <h1>Payment cancelled</h1>
                                <h2>You returned before completing payment</h2>
                                <p>You can go back to the checkout page to try again whenever you are ready.</p>
                            </div>
                        </div>

                        <div className="pe-line" />

                        <div className="pe-content">
                            {loadError ? (
                                <div className="pe-note">
                                    <strong>Details</strong>
                                    <p className="pe-reason-text">{loadError}</p>
                                </div>
                            ) : null}
                            {!loadError && (linkData?.merchant_name || formattedAmount) ? (
                                <div className="pe-details">
                                    {linkData?.merchant_name ? (
                                        <div className="pe-detail-row">
                                            <span>Merchant</span>
                                            <strong>{linkData.merchant_name}</strong>
                                        </div>
                                    ) : null}
                                    {formattedAmount ? (
                                        <div className="pe-detail-row">
                                            <span>Amount</span>
                                            <strong>{formattedAmount}</strong>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="pe-actions">
                            <button type="button" className="pe-btn pe-btn-light" onClick={() => navigate(checkoutPath)}>
                                <RotateCcw size={16} />
                                Back to checkout
                            </button>
                            <Link className="pe-btn pe-btn-primary" to={homePath}>
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

export default PaymentCancel;
