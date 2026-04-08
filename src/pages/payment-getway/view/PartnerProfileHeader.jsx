import React, { useState, useEffect } from 'react';

const getStatusBadgeClass = (status) => {
    const key = status != null ? String(status).toLowerCase() : '';
    switch (key) {
        case 'approved':
            return 'badge-light-success';
        case 'pending':
            return 'badge-light-warning';
        case 'requesting_updated':
            return 'badge-light-warning';
        case 'rejected':
            return 'badge-light-danger';
        case 'suspended':
            return 'badge-light-dark';
        case 'viewed':
            return 'badge-light-info';
        default:
            return 'badge-light-secondary';
    }
};

const getStatusMeta = (partner) => {
    const isActive =
        partner?.is_active === true ||
        partner?.is_active === 1 ||
        partner?.is_active === '1';

    return {
        isActive,
        label: isActive ? 'Active' : 'Inactive',
        badgeClass: `badge badge-light-${isActive ? 'success' : 'danger'}`,
        progressClass: `bg-${isActive ? 'success' : 'danger'}`,
        progressValue: isActive ? 100 : 0,
    };
};

const getInitials = (name = '') => {
    const trimmed = name.trim();
    if (!trimmed) return 'P';
    const parts = trimmed.split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0)).join('').toUpperCase() || 'P';
};

const formatWorkflowStatus = (status) => {
    if (!status) return 'N/A';
    const s = String(status);
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
};

const StatItem = ({ value = 0, label, iconClass }) => (
    <div className="border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3">
        <div className="d-flex align-items-center">
            {iconClass && (
                <i className={`ki-duotone ${iconClass} text-primary fs-2 me-2`}>
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            )}
            <div className="fs-2 fw-bolder">{value}</div>
        </div>
        <div className="fw-bold fs-7 text-gray-500">{label}</div>
    </div>
);

const DEFAULT_STATS_CONFIG = [
    { key: 'events', label: 'Events', icon: 'ki-abstract-44' },
    { key: 'attachments', label: 'Attachments', icon: 'ki-folder' },
];

const PartnerProfileHeader = ({
    partner,
    logoUrl,
    logoError,
    onLogoError,
    statistics = {},
    statsConfig = DEFAULT_STATS_CONFIG,
    activeTab,
    onTabChange,
    tabs = [],
    countryName,
    countryCode,
}) => {
    const [localLogoError, setLocalLogoError] = useState(false);

    useEffect(() => {
        setLocalLogoError(!!logoError);
    }, [logoError, partner?.logo]);

    if (!partner) {
        return null;
    }

    const statusMeta = getStatusMeta(partner);
    const displayName = partner.business_name || partner.name || 'Partner';
    const workflowBadgeClass = getStatusBadgeClass(partner.status);
    const showLogo = logoUrl && !localLogoError;

    return (
        <div className="card mb-5 mb-xl-10">
            <div className="card-body pt-9 pb-0">
                <div className="d-flex flex-wrap flex-sm-nowrap mb-6">
                    <div className="me-7 mb-4">
                        <div className="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                            {showLogo ? (
                                <img
                                    src={logoUrl}
                                    alt={displayName}
                                    className="rounded"
                                    onError={() => {
                                        setLocalLogoError(true);
                                        onLogoError?.();
                                    }}
                                />
                            ) : (
                                <div className="symbol-label fs-3 bg-light-primary text-primary">
                                    {getInitials(displayName)}
                                </div>
                            )}
                            <span className="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></span>
                        </div>
                    </div>

                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                            <div className="d-flex flex-column">
                                <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                                    <span className="text-gray-900 fs-2 fw-bolder me-3">{displayName}</span>
                                    <span className={`badge ${workflowBadgeClass}`}>
                                        {formatWorkflowStatus(partner.status)}
                                    </span>
                                    <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                                </div>
                                <div className="d-flex flex-wrap fw-semibold fs-6 text-gray-500 pe-2">
                                    {partner.email && (
                                        <span className="d-flex align-items-center me-5 mb-2">
                                            <i className="ki-duotone ki-sms fs-2 me-2 text-success">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {partner.email}
                                        </span>
                                    )}
                                    {(partner.phone || partner.business_phone) && (
                                        <span className="d-flex align-items-center mb-2">
                                            <i className="ki-duotone ki-call fs-2 me-2 text-warning">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {partner.phone || partner.business_phone}
                                        </span>
                                    )}
                                    <span className="d-flex align-items-center mb-2 ms-0 ms-sm-4">
                                        {countryCode && (
                                            <img
                                                src={`/flags/${String(countryCode).toLowerCase()}.png`}
                                                alt={countryName || 'Country'}
                                                className="me-2"
                                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <i className="ki-duotone ki-geolocation fs-2 me-2 text-primary">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {countryName || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {statsConfig?.length > 0 && (
                            <div className="d-flex flex-wrap flex-stack align-items-center">
                                <div className="d-flex flex-wrap">
                                    {statsConfig.map(({ key, label, icon }) => (
                                        <StatItem
                                            key={key}
                                            value={statistics[key] ?? 0}
                                            label={label}
                                            iconClass={icon}
                                        />
                                    ))}
                                </div>
                                <div className="d-flex flex-column align-items-center w-200px w-sm-300px mt-6 mt-sm-0">
                                    <div className="d-flex justify-content-between w-100 mb-2">
                                        <span className="fw-bold fs-7 text-gray-500">Account status</span>
                                        <span className="fw-bold fs-7">{statusMeta.progressValue}%</span>
                                    </div>
                                    <div className="h-5px mx-3 w-100 bg-light mb-2">
                                        <div
                                            className={`${statusMeta.progressClass} rounded h-5px`}
                                            role="progressbar"
                                            style={{ width: `${statusMeta.progressValue}%` }}
                                            aria-valuenow={statusMeta.progressValue}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                    <span
                                        className={`fw-bold fs-8 text-${statusMeta.isActive ? 'success' : 'danger'}`}
                                    >
                                        {statusMeta.label}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {tabs && tabs.length > 0 && (
                    <ul className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-nav-line-tabs mb-5 fs-6">
                        {tabs.map((tab) => (
                            <li className="nav-item mt-2" key={tab.key}>
                                <button
                                    type="button"
                                    className={`nav-link text-active-primary ms-0 me-10 py-5 ${
                                        activeTab === tab.key ? 'active' : ''
                                    }`}
                                    onClick={() => onTabChange?.(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PartnerProfileHeader;
