import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Home, Loader2, RotateCcw } from 'lucide-react';
import { apiGet } from '../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../utils/constants';
import { PaymentCheckoutFooter, PaymentCheckoutHeader } from '../components/payment-links/PaymentCheckoutChrome';
import '../components/payment-links/PaymentLinkRedirect.css';
import './PaymentError.css';

const linkErrMessage = (res, t) => {
    if (typeof res.error === 'string' && res.error) return res.error;
    const d = res.details;
    if (d?.message) return d.message;
    return t('paymentCheckout.errorPage.couldNotLoadDetails');
};

/**
 * Prefer `/:lang/payments/error/:uuid` so merchant/amount/reason come from the API.
 * Legacy `/payments/error` without uuid still renders a generic message.
 */
const PaymentError = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang, uuid } = useParams();
    const [loading, setLoading] = useState(!!uuid?.trim());
    const [linkData, setLinkData] = useState(null);
    const [loadError, setLoadError] = useState(null);

    const uuidTrim = uuid ? String(uuid).trim() : '';

    useEffect(() => {
        if (!uuidTrim) {
            setLoading(false);
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
                    setLoadError(linkErrMessage(res, t));
                    setLoading(false);
                    return;
                }
                const root = res.data;
                if (root?.success === false) {
                    setLoadError(root?.message || t('paymentCheckout.errorPage.paymentLinkNotFound'));
                    setLoading(false);
                    return;
                }
                setLinkData(root?.data ?? null);
            } catch (e) {
                if (!cancelled) setLoadError(e?.message || linkErrMessage({}, t));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [uuidTrim, t]);

    const isAlreadyPaid = useMemo(() => {
        if (!linkData) return false;
        const s = String(linkData.status || '').trim().toLowerCase();
        const ps = String(linkData.payment_status || '').trim().toLowerCase();
        return s === 'completed' || ps === 'paid';
    }, [linkData]);

    const reason = useMemo(() => {
        if (loadError && !linkData) return loadError;
        if (isAlreadyPaid) {
            return t('paymentCheckout.errorPage.alreadyPaidReason');
        }
        const m = linkData?.metadata;
        const meta = typeof m === 'object' && m !== null && !Array.isArray(m) ? m : {};
        return meta.payment_last_error || t('paymentCheckout.errorPage.paymentIncompleteFallback');
    }, [linkData, loadError, isAlreadyPaid, t]);

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
                            <p style={{ margin: 0, color: '#6b7280' }}>{t('paymentCheckout.errorPage.loading')}</p>
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
                                {isAlreadyPaid ? (
                                    <>
                                        <h1>{t('paymentCheckout.errorPage.alreadyPaidTitle')}</h1>
                                        <h2>{t('paymentCheckout.errorPage.alreadyPaidSubtitle')}</h2>
                                        <p>{t('paymentCheckout.errorPage.alreadyPaidBody')}</p>
                                    </>
                                ) : (
                                    <>
                                        <h1>{t('paymentCheckout.errorPage.failedTitle')}</h1>
                                        <h2>{t('paymentCheckout.errorPage.failedSubtitle')}</h2>
                                        <p>{t('paymentCheckout.errorPage.failedBody')}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pe-line" />

                        <div className="pe-content">
                            <div className="pe-note">
                                <strong>{t('paymentCheckout.errorPage.details')}</strong>
                                <p className="pe-reason-text">{reason}</p>
                            </div>
                            {!uuidTrim ? (
                                <div className="pe-note pe-note-muted">
                                    {t('paymentCheckout.errorPage.openFromLinkHint')}
                                </div>
                            ) : null}
                            {(linkData?.merchant_name || formattedAmount) ? (
                                <div className="pe-details">
                                    {linkData?.merchant_name ? (
                                        <div className="pe-detail-row">
                                            <span>{t('paymentCheckout.errorPage.merchant')}</span>
                                            <strong>{linkData.merchant_name}</strong>
                                        </div>
                                    ) : null}
                                    {formattedAmount ? (
                                        <div className="pe-detail-row">
                                            <span>
                                                {isAlreadyPaid
                                                    ? t('paymentCheckout.errorPage.amountPaid')
                                                    : t('paymentCheckout.errorPage.attemptedAmount')}
                                            </span>
                                            <strong>{formattedAmount}</strong>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            <div className="pe-note pe-note-muted">
                                {isAlreadyPaid
                                    ? t('paymentCheckout.errorPage.helpAlreadyPaid')
                                    : t('paymentCheckout.errorPage.tryAgainHint')}
                            </div>
                        </div>

                        <div className={`pe-actions${isAlreadyPaid ? ' pe-actions--single' : ''}`}>
                            {isAlreadyPaid ? (
                                <Link className="pe-btn pe-btn-primary" to={homePath}>
                                    <Home size={16} />
                                    {t('paymentCheckout.errorPage.backToHome')}
                                </Link>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="pe-btn pe-btn-light"
                                        onClick={() => (uuidTrim ? navigate(checkoutPath) : navigate(-1))}
                                    >
                                        <RotateCcw size={16} />
                                        {t('paymentCheckout.errorPage.tryAgain')}
                                    </button>
                                    <Link className="pe-btn pe-btn-primary" to={homePath}>
                                        <Home size={16} />
                                        {t('paymentCheckout.errorPage.backToHome')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <PaymentCheckoutFooter onCancel={() => navigate(checkoutPath)} />
        </div>
    );
};

export default PaymentError;
