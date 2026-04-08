import React from 'react';
import { Link } from 'react-router-dom';

const InfoRow = ({ label, value, fallback = 'N/A' }) => (
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

const resolveServiceName = (service) => {
    if (!service) return 'N/A';
    if (service.service_name_en || service.service_name_ar) {
        return service.service_name_en || service.service_name_ar || service.id || 'N/A';
    }
    if (service.service_name_text) return service.service_name_text;
    if (service.service_name && typeof service.service_name === 'object') {
        return service.service_name.en || service.service_name.ar || service.id || 'N/A';
    }
    return service.service_name || service.id || 'N/A';
};

const resolveCountry = (service) => {
    const c = service?.country;
    if (!c) return 'N/A';
    const n = c.name;
    if (typeof n === 'string') return n;
    if (n && typeof n === 'object') return n.en || n.ar || 'N/A';
    return 'N/A';
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
    if (!partner) {
        return null;
    }

    const countryLabel =
        lookupCountryName ||
        partner.country?.name?.en ||
        partner.country?.name ||
        (lookupLoading ? 'Loading…' : null);
    const cityLabel = partner.city?.name?.en || partner.city?.name;

    const servicesToolbar = (
        <div className="d-flex gap-2 align-items-center flex-wrap">
            {typeof onOpenServicesTab === 'function' && (
                <button type="button" className="btn btn-sm btn-light-primary" onClick={onOpenServicesTab}>
                    Services tab
                </button>
            )}
            {partnerId && (
                <Link
                    to={`/admin/services?partner_id=${encodeURIComponent(partnerId)}`}
                    className="btn btn-sm btn-light"
                >
                    Full list
                </Link>
            )}
        </div>
    );

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <SectionCard
                    title="Basic Information"
                    action={
                        canEdit && editUrl ? (
                            <Link to={editUrl} className="btn btn-primary btn-sm">
                                Edit Partner
                            </Link>
                        ) : null
                    }
                >
                    <InfoRow label="Business /Brand Name" value={partner.name} />
                    <InfoRow label="Contact Person Name" value={partner.business_name} />
                    <InfoRow label="Company Name" value={partner.owner_name} />
                    <InfoRow label="Email" value={partner.email} />
                    <InfoRow label="Phone" value={partner.phone} />
                    <InfoRow label="Business Phone" value={partner.business_phone} />
                    <InfoRow label="Profile Summary" value={partner.address} />
                    <InfoRow
                        label="Country"
                        value={
                            <div className="d-flex align-items-center">
                                {lookupCountryCode && (
                                    <img
                                        src={`/flags/${String(lookupCountryCode).toLowerCase()}.png`}
                                        alt={countryLabel || 'Country'}
                                        className="me-2"
                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <span>{countryLabel || 'N/A'}</span>
                            </div>
                        }
                    />
                    <InfoRow label="City" value={cityLabel} />
                    {partner.created_at && (
                        <InfoRow label="Created At" value={formatDateTime(partner.created_at)} />
                    )}
                    {partner.updated_at && (
                        <InfoRow label="Last Updated" value={formatDateTime(partner.updated_at)} />
                    )}
                </SectionCard>
            </div>

            <div className="col-xl-12">
                <SectionCard title="Services for this partner" action={servicesToolbar}>
                    {servicesLoading ? (
                        <div className="text-muted">Loading services…</div>
                    ) : services.length === 0 ? (
                        <div className="text-muted">No services linked to this partner yet.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th className="min-w-200px">Service</th>
                                        <th className="min-w-100px">Type</th>
                                        <th className="min-w-100px">Country</th>
                                        <th className="min-w-80px">Status</th>
                                        <th className="min-w-80px text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <span className="text-gray-800 fw-semibold">
                                                    {resolveServiceName(s)}
                                                </span>
                                            </td>
                                            <td className="text-muted fs-7">
                                                {s.service_type_display || s.service_type || '—'}
                                            </td>
                                            <td className="text-muted fs-7">{resolveCountry(s)}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        s.is_active ? 'badge-light-success' : 'badge-light-secondary'
                                                    }`}
                                                >
                                                    {s.is_active ? 'Active' : 'Inactive'}
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
                                                    View
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
