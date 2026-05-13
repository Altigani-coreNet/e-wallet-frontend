import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiGet } from '../../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../../utils/constants';
import { PaymentCheckoutHeader, PaymentCheckoutFooter } from './PaymentCheckoutChrome';
import './MerchantPublicProfile.css';

/* ── icons (inline SVG for colored tiles) ──────────────────────────────── */

const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconId = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="M15 9h2M15 13h2M9 15h5" />
    </svg>
);

const IconEmail = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const IconPhone = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
);

const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);

const IconBriefcase = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
);

const IconPin = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const IconRowShield = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

/* ── helpers ───────────────────────────────────────────────────────────── */

/** @param {import('i18next').TFunction} t */
const activationLabel = (status, t) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return { label: t('merchantPublicProfile.activation.activated'), success: true };
    if (s === 'pending' || s === 'viewed') return { label: t('merchantPublicProfile.activation.pending'), success: false };
    if (s === 'suspended') return { label: t('merchantPublicProfile.activation.suspended'), success: false };
    if (s === 'rejected') return { label: t('merchantPublicProfile.activation.rejected'), success: false };
    return {
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : t('merchantPublicProfile.emptyValue'),
        success: false,
    };
};

/* ── skeleton (shimmer layout mirroring final UI) ──────────────────────── */

const MerchantPublicProfileSkeleton = () => {
    const navigate = useNavigate();
    return (
        <div className="pl-page">
            <PaymentCheckoutHeader onBack={() => navigate(-1)} />
            <main className="mpp-main">
                <div className="mpp-page">
                    <div className="mpp-hero mpp-sk-hero">
                        <div className="pl-header-blob mpp-hero-blob" aria-hidden="true" />
                        <div className="mpp-hero-inner">
                            <div className="mpp-shimmer mpp-sk-avatar" />
                            <div className="mpp-shimmer mpp-sk-title" />
                            <div className="mpp-shimmer mpp-sk-sub" />
                        </div>
                    </div>
                    <div className="mpp-sk-body">
                        <div className="mpp-sk-grid">
                            <div>
                                <div className="mpp-shimmer mpp-sk-h" />
                                <div className="mpp-sk-card">
                                    {[1, 2, 3].map((k) => (
                                        <div key={k} className="mpp-sk-row">
                                            <div className="mpp-shimmer mpp-sk-icon" />
                                            <div className="mpp-sk-lines">
                                                <div className="mpp-shimmer mpp-sk-line-sm" />
                                                <div className="mpp-shimmer mpp-sk-line-lg" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="mpp-shimmer mpp-sk-h" />
                                <div className="mpp-sk-card">
                                    {[1, 2, 3].map((k) => (
                                        <div key={k} className="mpp-sk-row">
                                            <div className="mpp-shimmer mpp-sk-icon" />
                                            <div className="mpp-sk-lines">
                                                <div className="mpp-shimmer mpp-sk-line-sm" />
                                                <div className="mpp-shimmer mpp-sk-line-lg" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <PaymentCheckoutFooter onCancel={() => navigate(-1)} />
        </div>
    );
};

/* ── page ─────────────────────────────────────────────────────────────── */

const MerchantPublicProfile = () => {
    const { t, i18n } = useTranslation();
    const { merchantUuid } = useParams();
    const navigate = useNavigate();
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatMemberSince = useCallback(
        (value) => {
            if (!value) return t('merchantPublicProfile.emptyValue');
            const loc = (i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar-SA' : 'en-US';
            return new Date(value).toLocaleDateString(loc, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        },
        [i18n.language, t],
    );

    useEffect(() => {
        if (!merchantUuid) {
            setLoading(false);
            setError(t('merchantPublicProfile.errors.missingMerchant'));
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await apiGet(`${SOFTPOS_API_BASE}/merchants/public/${merchantUuid}`);
                if (!res.success) {
                    throw new Error(
                        typeof res.error === 'string' ? res.error : t('merchantPublicProfile.errors.merchantNotFound'),
                    );
                }
                const raw = res.data;
                const payload = raw?.data ?? raw;
                if (!payload) {
                    throw new Error(raw?.message || t('merchantPublicProfile.errors.merchantNotFound'));
                }
                if (!cancelled) setMerchant(payload);
            } catch (e) {
                if (!cancelled) setError(e.message || t('merchantPublicProfile.errors.loadFailed'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [merchantUuid, t]);

    const displayName = merchant?.business_name || merchant?.name || t('merchant.profile.na');
    const subtitleLine = merchant?.merchant_code || merchant?.business_type || '';
    const showVerified = String(merchant?.status || '').toLowerCase() === 'approved';
    const act = activationLabel(merchant?.status, t);

    if (loading) {
        return <MerchantPublicProfileSkeleton />;
    }

    if (error || !merchant) {
        return (
            <div className="pl-page">
                <PaymentCheckoutHeader onBack={() => navigate(-1)} />
                <main className="mpp-main">
                    <div className="mpp-page">
                        <div className="mpp-error">
                            <div className="alert alert-danger shadow-sm rounded-3">{error || t('merchant.profile.na')}</div>
                            <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
                                {t('merchantPublicProfile.back')}
                            </button>
                        </div>
                    </div>
                </main>
                <PaymentCheckoutFooter onCancel={() => navigate(-1)} />
            </div>
        );
    }

    return (
        <div className="pl-page">
            <PaymentCheckoutHeader onBack={() => navigate(-1)} />
            <main className="mpp-main">
                <div className="mpp-page">
            <header className="mpp-hero">
                <div className="pl-header-blob mpp-hero-blob" aria-hidden="true" />
                <div className="mpp-hero-inner">
                    <div className="mpp-avatar-wrap">
                        {merchant.logo_url ? (
                            <img src={merchant.logo_url} alt={t('merchantPublicProfile.logoAlt')} className="mpp-avatar" />
                        ) : (
                            <div className="mpp-avatar-fallback">{displayName.substring(0, 2).toUpperCase()}</div>
                        )}
                        {showVerified && (
                            <div className="mpp-verified" aria-hidden="true">
                                <IconCheck />
                            </div>
                        )}
                    </div>
                    <h1 className="mpp-title">{displayName}</h1>
                    {subtitleLine ? (
                        <p className="mpp-subtitle">
                            <IconId />
                            <span>{subtitleLine}</span>
                        </p>
                    ) : null}
                </div>
            </header>

            <div className="mpp-body">
                <div className="mpp-grid">
                    <section>
                        <h2 className="mpp-section-title">{t('merchantPublicProfile.sections.accountDetails')}</h2>
                        <div className="mpp-card">
                            <div className="mpp-row">
                                <div className="mpp-icon-box mpp-icon-box--email">
                                    <IconEmail />
                                </div>
                                <div className="mpp-row-text">
                                    <span className="mpp-label">{t('merchantPublicProfile.labels.email')}</span>
                                    <span className="mpp-value">{merchant.email || t('merchantPublicProfile.emptyValue')}</span>
                                </div>
                            </div>
                            <div className="mpp-row">
                                <div className="mpp-icon-box mpp-icon-box--phone">
                                    <IconPhone />
                                </div>
                                <div className="mpp-row-text">
                                    <span className="mpp-label">{t('merchantPublicProfile.labels.phoneNumber')}</span>
                                    <span className="mpp-value">{merchant.phone || t('merchantPublicProfile.emptyValue')}</span>
                                </div>
                            </div>
                            <div className="mpp-row">
                                <div className="mpp-icon-box mpp-icon-box--calendar">
                                    <IconCalendar />
                                </div>
                                <div className="mpp-row-text">
                                    <span className="mpp-label">{t('merchantPublicProfile.labels.memberSince')}</span>
                                    <span className="mpp-value">{formatMemberSince(merchant.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="mpp-section-title">{t('merchantPublicProfile.sections.organization')}</h2>
                        <div className="mpp-card">
                            <div className="mpp-row">
                                <div className="mpp-icon-box mpp-icon-box--org">
                                    <IconBriefcase />
                                </div>
                                <div className="mpp-row-text">
                                    <span className="mpp-label">{t('merchantPublicProfile.labels.organization')}</span>
                                    <span className="mpp-value">
                                        {merchant.business_name || merchant.name || t('merchantPublicProfile.emptyValue')}
                                    </span>
                                </div>
                            </div>
                            <div className="mpp-row">
                                <div className="mpp-icon-box mpp-icon-box--branch">
                                    <IconPin />
                                </div>
                                <div className="mpp-row-text">
                                    <span className="mpp-label">{t('merchantPublicProfile.labels.branch')}</span>
                                    <span className="mpp-value">{t('merchantPublicProfile.emptyValue')}</span>
                                </div>
                            </div>
                            <div className="mpp-row">
                                <div className="mpp-icon-box mpp-icon-box--shield">
                                    <IconRowShield />
                                </div>
                                <div className="mpp-row-text">
                                    <span className="mpp-label">{t('merchantPublicProfile.labels.activationStatus')}</span>
                                    <span
                                        className={`mpp-value${act.success ? ' mpp-value--success' : ''}`}
                                    >
                                        {act.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
                </div>
            </main>
            <PaymentCheckoutFooter onCancel={() => navigate(-1)} />
        </div>
    );
};

export default MerchantPublicProfile;
