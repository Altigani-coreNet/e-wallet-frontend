import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTH_SERVICE_BASE } from '../../../utils/constants';

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
};

const MerchantProfileHeader = ({
    merchant,
    profileCompletion,
    statistics = {},
    basePath = '#',
    activeTab = 'overview',
    pendingChangeRequests = 0,
    onApprove,
    onReject,
    onSuspend,
    onUnsuspend,
    onDelete,
    disableActions = false
}) => {
    const { t } = useTranslation();
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        setLogoError(false);
    }, [merchant?.logo]);

    if (!merchant) return null;

    const logoUrl = resolveAuthAssetUrl(merchant.logo);
    const displayLogoInitial = logoError || !logoUrl;
    const fallbackSource = (merchant.name || merchant.business_name || 'M').trim();
    const fallbackText = fallbackSource
        ? fallbackSource.substring(0, Math.min(2, fallbackSource.length)).toUpperCase()
        : 'M';

    const completion = profileCompletion?.completion ?? 0;
    const missing = profileCompletion?.missing ?? [];

    const statusBadge = merchant.span_status_html || null;

    const canApprove = ['pending', 'viewed', null].includes(merchant.status);
    const canReject = merchant.status === 'pending';
    const canSuspend = merchant.status && !['suspended', 'pending'].includes(merchant.status);
    const canUnsuspend = merchant.status === 'suspended';

    const handleAction = (handler) => {
        if (disableActions || !handler) return;
        handler();
    };

    const renderNavLink = (slug, label) => (
        <li className="nav-item mt-2" key={slug}>
            <a className="nav-link text-active-primary ms-0 me-10 py-5" href={`#${slug}`}>
                {label}
                {slug === 'change-requests' && pendingChangeRequests > 0 && (
                    <span className="badge badge-danger ms-2">{pendingChangeRequests}</span>
                )}
            </a>
        </li>
    );

    const stats = useMemo(() => [
        {
            value: statistics.total_branches ?? merchant?.branches?.length ?? 0,
            label: t('admin.merchantsUI.statsBranches'),
            iconClass: 'svg-icon-success'
        },
        {
            value: statistics.total_terminals ?? merchant?.terminals?.length ?? 0,
            label: t('admin.merchantsUI.statsTerminals'),
            iconClass: 'svg-icon-primary'
        },
        {
            value: statistics.total_users ?? merchant?.users?.length ?? 0,
            label: t('admin.merchantsUI.statsUsers'),
            iconClass: 'svg-icon-dark'
        },
        {
            value: statistics.total_transactions ?? merchant?.transactions_count ?? 0,
            label: t('admin.merchantsUI.statsTransactions'),
            iconClass: 'svg-icon-danger'
        }
    ], [statistics.total_branches, statistics.total_terminals, statistics.total_users, statistics.total_transactions, merchant?.branches?.length, merchant?.terminals?.length, merchant?.users?.length, merchant?.transactions_count, t]);

    const latestLogs = merchant.latest_logs || merchant.logs || [];
    const missingTooltip = missing.length > 0 ? missing.join('\n') : '';

    const navItems = useMemo(() => [
        { key: 'overview', label: t('admin.merchantsUI.tabOverview'), path: basePath },
        { key: 'events', label: t('admin.merchantsUI.tabEvents'), path: `${basePath}/events` },
        { key: 'transactions', label: t('admin.merchantsUI.tabTransactions'), path: `${basePath}/transactions` },
        { key: 'users', label: t('admin.merchantsUI.tabUsers'), path: `${basePath}/users` },
        { key: 'terminals', label: t('admin.merchantsUI.tabTerminals'), path: `${basePath}/terminals` },
        { key: 'branches', label: t('admin.merchantsUI.tabBranches'), path: `${basePath}/branches` },
        { key: 'attachments', label: t('admin.merchantsUI.tabAttachments'), path: `${basePath}/attachments` },
        { key: 'change-requests', label: t('admin.merchantsUI.tabChangeRequests'), path: `${basePath}/change-requests` },
    ], [basePath, t]);

    return (
        <div className={`card mb-5 ${pendingChangeRequests > 0 ? 'mb-xl-10' : ''}`}>
            <div className="card-body pt-9 pb-0">
                <div className="d-flex flex-wrap flex-sm-nowrap mb-3">
                    <div className="me-7 mb-4">
                        <div className="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                            {!displayLogoInitial && logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={merchant.business_name || merchant.name}
                                    className="rounded"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <div className="symbol-label fs-3 bg-light-primary text-primary">
                                    {fallbackText}
                                </div>
                            )}
                            <div className="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></div>
                        </div>
                    </div>

                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                            <div className="d-flex flex-column">
                                <div className="d-flex align-items-center mb-2">
                                    <a href="#overview" className="text-gray-900 text-hover-primary fs-2 fw-bold me-1">
                                        {merchant.business_name || merchant.name}
                                    </a>
                                    <span className="svg-icon svg-icon-1 svg-icon-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                            <path d="M10.0813 3.7242C10.8849 2.16438 13.1151 2.16438 13.9187 3.7242V3.7242C14.4016 4.66147 15.4909 5.1127 16.4951 4.79139V4.79139C18.1663 4.25668 19.7433 5.83365 19.2086 7.50485V7.50485C18.8873 8.50905 19.3385 9.59842 20.2758 10.0813V10.0813C21.8356 10.8849 21.8356 13.1151 20.2758 13.9187V13.9187C19.3385 14.4016 18.8873 15.491 19.2086 16.4951V16.4951C19.7433 18.1663 18.1663 19.7433 16.4951 19.2086V19.2086C15.491 18.8873 14.4016 19.3385 13.9187 20.2758V20.2758C13.1151 21.8356 10.8849 21.8356 10.0813 20.2758V20.2758C9.59842 19.3385 8.50905 18.8873 7.50485 19.2086V19.2086C5.83365 19.7433 4.25668 18.1663 4.79139 16.4951V16.4951C5.1127 15.491 4.66147 14.4016 3.7242 13.9187V13.9187C2.16438 13.1151 2.16438 10.8849 3.7242 10.0813V10.0813C4.66147 9.59842 5.1127 8.50905 4.79139 7.50485V7.50485C4.25668 5.83365 5.83365 4.25668 7.50485 4.79139V4.79139C8.50905 5.1127 9.59842 4.66147 10.0813 3.7242V3.7242Z" fill="#00A3FF"></path>
                                            <path className="permanent" d="M14.8563 9.1903C15.0606 8.94984 15.3771 8.9385 15.6175 9.14289C15.858 9.34728 15.8229 9.66433 15.6185 9.9048L11.863 14.6558C11.6554 14.9001 11.2876 14.9258 11.048 14.7128L8.47656 12.4271C8.24068 12.2174 8.21944 11.8563 8.42911 11.6204C8.63877 11.3845 8.99996 11.3633 9.23583 11.5729L11.3706 13.4705L14.8563 9.1903Z" fill="white"></path>
                                        </svg>
                                    </span>
                                </div>
                                <div className="d-flex flex-wrap fw-semibold fs-6 mb-4 pe-2">
                                    {merchant.address && (
                                        <a href="#" className="d-flex align-items-center text-gray-400 text-hover-primary me-5 mb-2">
                                            <i className="ki-duotone ki-geolocation fs-4 me-1">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {merchant.address}
                                        </a>
                                    )}
                                    {merchant.email && (
                                        <a href={`mailto:${merchant.email}`} className="d-flex align-items-center text-gray-400 text-hover-primary me-5 mb-2">
                                            <i className="ki-duotone ki-sms fs-4 me-1">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {merchant.email}
                                        </a>
                                    )}
                                    {merchant.phone && (
                                        <a href={`tel:${merchant.phone}`} className="d-flex align-items-center text-gray-400 text-hover-primary mb-2">
                                            <i className="ki-duotone ki-call fs-4 me-1">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {merchant.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="d-flex my-4">
                                <div className="me-0">
                                    <div className="btn-group">
                                        <Link to={`/admin/merchants/${merchant.id}/edit`} className="btn btn-sm btn-primary me-2">
                                            <i className="ki-duotone ki-pencil fs-2 me-1">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.common.edit')}
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light btn-active-light-primary"
                                            data-kt-menu-trigger="click"
                                            data-kt-menu-placement="bottom-end"
                                        >
                                            {t('admin.merchantsIndex.colActions')}
                                            <i className="ki-duotone ki-down fs-5 ms-1"></i>
                                        </button>
                                        <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-150px py-4">
                                            {canApprove && (
                                                <button className="menu-link px-3 bg-light-success text-success border-0 w-100 text-start" onClick={() => handleAction(onApprove)} disabled={disableActions}>
                                                    {t('admin.common.approve')}
                                                </button>
                                            )}
                                            {canReject && (
                                                <button className="menu-link px-3 bg-light-danger text-danger border-0 w-100 text-start" onClick={() => handleAction(onReject)} disabled={disableActions}>
                                                    {t('admin.common.reject')}
                                                </button>
                                            )}
                                            {canSuspend && (
                                                <button className="menu-link px-3 text-warning border-0 w-100 text-start" onClick={() => handleAction(onSuspend)} disabled={disableActions}>
                                                    {t('admin.common.suspend')}
                                                </button>
                                            )}
                                            {canUnsuspend && (
                                                <button className="menu-link px-3 text-success border-0 w-100 text-start" onClick={() => handleAction(onUnsuspend)} disabled={disableActions}>
                                                    {t('admin.common.unsuspend')}
                                                </button>
                                            )}
                                            <div className="menu-item px-3">
                                                <button className="menu-link px-3 text-danger border-0 w-100 text-start" onClick={() => handleAction(onDelete)} disabled={disableActions}>
                                                    {t('admin.common.delete')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-wrap flex-stack">
                            <div className="d-flex flex-column flex-grow-1 pe-8">
                                <div className="d-flex flex-wrap">
                                    {stats.map((stat, idx) => (
                                        <div key={stat.label} className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                            <div className="d-flex align-items-center">
                                                <div className={`svg-icon svg-icon-3 ${stat.iconClass} me-2`}></div>
                                                <div className="fs-2 fw-bolder">{stat.value}</div>
                                            </div>
                                            <div className="fw-bold fs-6 text-gray-400">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="d-flex align-items-center w-200px w-sm-300px flex-column mt-3">
                                <div
                                    className="d-flex justify-content-between w-100 mt-auto mb-2"
                                    title={missingTooltip}
                                >
                                    <span className="fw-bold fs-6 text-gray-400">{t('admin.merchantsUI.profileCompletion')}</span>
                                    <span className="fw-bolder fs-6">{completion}%</span>
                                </div>
                                <div className="h-5px mx-3 w-100 bg-light mb-3" title={missingTooltip}>
                                    <div className="bg-success rounded h-5px" role="progressbar" style={{ width: `${completion}%` }} aria-valuenow={completion} aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                {missing.length === 0 ? (
                                    <div className="text-success fw-semibold">{t('admin.merchantsUI.profileComplete')}</div>
                                ) : (
                                    <div className="text-muted small">{t('admin.merchantsUI.hoverMissingHint')}</div>
                                )}
                                <div className="text-center w-100 mt-3">
                                    {statusBadge ? (
                                        <span dangerouslySetInnerHTML={{ __html: statusBadge }}></span>
                                    ) : (
                                        <span className={`btn btn-sm btn-${merchant.status === 'approved' ? 'light-success' : 'light-warning'} px-9 py-4`}>
                                            <span className="indicator-label">{merchant.status ? merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1) : t('admin.common.pending')}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {pendingChangeRequests > 0 && (
                    <div className="alert alert-warning d-flex align-items-center p-5 mb-5">
                        <i className="ki-duotone ki-shield-cross fs-2hx text-warning me-4">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-warning">{t('admin.merchantsUI.pendingChangeRequestsTitle')}</h4>
                            <span>{t('admin.merchantsUI.pendingChangeRequestsProfile', { count: pendingChangeRequests })}</span>
                            <div className="mt-2">
                                <a href="#change-requests" className="btn btn-warning btn-sm">
                                    <i className="ki-duotone ki-eye fs-5">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    {t('admin.merchantsUI.reviewChanges')}
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                <ul className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-nav-line-tabs mb-5 fs-6">
                    {navItems.map(({ key, label, path }) => (
                        <li className="nav-item mt-2" key={key}>
                            <Link
                                className={`nav-link text-active-primary ms-0 me-10 py-5 ${activeTab === key ? 'active' : ''}`}
                                to={path}
                            >
                                {label}
                                {key === 'change-requests' && pendingChangeRequests > 0 && (
                                    <span className="badge badge-danger ms-2">{pendingChangeRequests}</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MerchantProfileHeader;
