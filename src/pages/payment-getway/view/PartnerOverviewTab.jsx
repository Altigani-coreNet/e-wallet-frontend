import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ServiceModel from '../../../services/ServiceModel';

const InfoRow = ({ label, value, fallback }) => (
    <div className="row mb-7">
        <label className="col-lg-4 fw-semibold text-muted">{label}</label>
        <div className="col-lg-8">
            <span className="fw-bold fs-6 text-gray-800">{value ?? fallback}</span>
        </div>
    </div>
);

const SectionCard = ({ title, action, children }) => (
    <div className="card mb-5 mb-xl-10">
        <div className="card-header cursor-pointer">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">{title}</h3>
            </div>
            <div className="card-toolbar">{action}</div>
        </div>
        <div className="card-body p-9">{children}</div>
    </div>
);

const formatDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString();
};

const PartnerOverviewTab = ({
    partner,
    canEdit = true,
    editUrl,
    partnerId,
    services = [],
    servicesLoading = false,
    lookupCountryName,
    lookupCountryCode,
    lookupLoading = false,
    onOpenServicesTab,
}) => {
    const { t } = useTranslation();

    if (!partner) {
        return null;
    }

    const countryLabel =
        lookupCountryName ||
        partner.country?.name?.en ||
        partner.country?.name ||
        (lookupLoading ? t('admin.paymentGetway.cpLoading') : null);
    const cityLabel = partner.city?.name?.en || partner.city?.name;

    const servicesToolbar = (
        <div className="d-flex gap-2 align-items-center flex-wrap">
            {typeof onOpenServicesTab === 'function' && (
                <button type="button" className="btn btn-sm btn-light-primary" onClick={onOpenServicesTab}>
                    {t('admin.paymentGetway.viewServicesTabBtn')}
                </button>
            )}
            {partnerId && (
                <Link
                    to={`/admin/services?partner_id=${encodeURIComponent(partnerId)}`}
                    className="btn btn-sm btn-light"
                >
                    {t('admin.paymentGetway.viewFullList')}
                </Link>
            )}
        </div>
    );

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <SectionCard
                    title={t('admin.paymentGetway.viewBasicInformation')}
                    action={
                        canEdit && editUrl ? (
                            <Link to={editUrl} className="btn btn-primary btn-sm">
                                {t('admin.paymentGetway.viewEditPartner')}
                            </Link>
                        ) : null
                    }
                >
                    <InfoRow label={t('admin.paymentGetway.viewBusinessBrandName')} value={partner.name} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow label={t('admin.paymentGetway.viewContactPersonName')} value={partner.business_name} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow label={t('admin.paymentGetway.viewCompanyName')} value={partner.owner_name} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow label={t('admin.paymentGetway.cpImportEmail')} value={partner.email} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow label={t('admin.paymentGetway.cpImportPhone')} value={partner.phone} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow label={t('admin.paymentGetway.viewBusinessPhone')} value={partner.business_phone} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow label={t('admin.paymentGetway.viewProfileSummary')} value={partner.address} fallback={t('admin.paymentGetway.na')} />
                    <InfoRow
                        label={t('admin.paymentGetway.viewCountryCol')}
                        value={
                            <div className="d-flex align-items-center">
                                {lookupCountryCode && (
                                    <img
                                        src={`/flags/${String(lookupCountryCode).toLowerCase()}.png`}
                                        alt={countryLabel || t('admin.paymentGetway.cpCountryAlt')}
                                        className="me-2"
                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <span>{countryLabel || t('admin.paymentGetway.na')}</span>
                            </div>
                        }
                        fallback={t('admin.paymentGetway.na')}
                    />
                    <InfoRow label={t('admin.paymentGetway.cpFieldCity')} value={cityLabel} fallback={t('admin.paymentGetway.na')} />
                    {partner.created_at && (
                        <InfoRow label={t('admin.paymentGetway.viewCreatedCol')} value={formatDateTime(partner.created_at)} fallback={t('admin.paymentGetway.na')} />
                    )}
                    {partner.updated_at && (
                        <InfoRow label={t('admin.paymentGetway.viewLastUpdated')} value={formatDateTime(partner.updated_at)} fallback={t('admin.paymentGetway.na')} />
                    )}
                </SectionCard>
            </div>

            <div className="col-xl-12">
                <SectionCard title={t('admin.paymentGetway.viewServicesForPartner')} action={servicesToolbar}>
                    {servicesLoading ? (
                        <div className="text-muted">{t('admin.paymentGetway.viewLoadingServices')}</div>
                    ) : services.length === 0 ? (
                        <div className="text-muted">{t('admin.paymentGetway.viewNoLinkedServicesYet')}</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th className="min-w-200px">{t('admin.paymentGetway.viewServiceCol')}</th>
                                        <th className="min-w-100px">{t('admin.paymentGetway.viewTypeCol')}</th>
                                        <th className="min-w-100px">{t('admin.paymentGetway.viewCountryCol')}</th>
                                        <th className="min-w-80px">{t('admin.paymentGetway.status')}</th>
                                        <th className="min-w-80px text-end">{t('admin.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <span className="text-gray-800 fw-semibold">
                                                    {ServiceModel.displayName(s) || t('admin.paymentGetway.na')}
                                                </span>
                                            </td>
                                            <td className="text-muted fs-7">
                                                {s.service_type_display || s.service_type || '—'}
                                            </td>
                                            <td className="text-muted fs-7">{ServiceModel.countryName(s) || t('admin.paymentGetway.na')}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        s.is_active ? 'badge-light-success' : 'badge-light-secondary'
                                                    }`}
                                                >
                                                    {s.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <Link
                                                    to={
                                                        partnerId
                                                            ? `/admin/services/${s.id}?partner_id=${encodeURIComponent(partnerId)}`
                                                            : `/admin/services/${s.id}`
                                                    }
                                                    className="btn btn-sm btn-light-primary"
                                                >
                                                    {t('admin.common.view')}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
};

export default PartnerOverviewTab;
