import React from 'react';
import { getTranslatedText } from '../../../utils/helpers';

const DEFAULT_TABS = [
    { key: 'overview', label: 'Overview', icon: 'ki-profile-circle' },
    { key: 'terminals', label: 'Terminals', icon: 'ki-tablet' },
    { key: 'transactions', label: 'Transactions', icon: 'ki-credit-cart' },
    { key: 'user_groups', label: 'User Groups', icon: 'ki-people' },
    { key: 'attachments', label: 'Attachments', icon: 'ki-folder' },
    { key: 'events', label: 'Events', icon: 'ki-abstract-44' },
];

const getStatusMeta = (status, labels = {}) => {
    const isActive = status === true || status === 1 || status === '1' || status === 'active';
    const activeLabel = labels.activeLabel ?? 'Active';
    const inactiveLabel = labels.inactiveLabel ?? 'Inactive';

    return {
        isActive,
        label: isActive ? activeLabel : inactiveLabel,
        badgeClass: `badge badge-light-${isActive ? 'success' : 'danger'}`,
        progressClass: `bg-${isActive ? 'success' : 'danger'}`,
        progressValue: isActive ? 100 : 0,
    };
};

const getInitials = (name = '') =>
    name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase() || 'US';

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
    { key: 'total_terminals', label: 'Terminals', icon: 'ki-devices-2' },
    { key: 'terminal_groups', label: 'Terminal Groups', icon: 'ki-grid' },
    { key: 'user_groups', label: 'User Groups', icon: 'ki-people' },
    { key: 'attachments', label: 'Attachments', icon: 'ki-folder' },
];

const UserProfileHeader = ({
    user,
    statistics = {},
    statsConfig = DEFAULT_STATS_CONFIG,
    activeTab,
    onTabChange,
    tabs = DEFAULT_TABS,
    activeStatusLabel,
    inactiveStatusLabel,
    userStatusLabel,
    nameFallback = 'N/A',
}) => {
    if (!user) {
        return null;
    }

    const statusMeta = getStatusMeta(user.status, {
        activeLabel: activeStatusLabel,
        inactiveLabel: inactiveStatusLabel,
    });
    const fullMerchantName = user.merchant
        ? getTranslatedText(user.merchant.business_name) || getTranslatedText(user.merchant.name)
        : null;
    const branchName = user.branch ? getTranslatedText(user.branch.name) : null;

    return (
        <div className="card mb-5 mb-xl-10">
            <div className="card-body pt-9 pb-0">
                <div className="d-flex flex-wrap flex-sm-nowrap mb-6">
                    <div className="me-7 mb-4">
                        <div className="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                            {user.profile_image_url ? (
                                <img src={user.profile_image_url} alt={user.name} className="rounded" />
                            ) : (
                                <div className="symbol-label fs-3 bg-light-primary text-primary">
                                    {getInitials(user.name)}
                                </div>
                            )}
                            <span className="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></span>
                        </div>
                    </div>

                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                            <div className="d-flex flex-column">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-900 fs-2 fw-bolder me-3">{user.name || 'N/A'}</span>
                                    <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                                </div>
                                <div className="d-flex flex-wrap fw-semibold fs-6 text-gray-500 pe-2">
                                    {fullMerchantName && (
                                        <span className="d-flex align-items-center text-hover-primary me-5 mb-2">
                                            <i className="ki-duotone ki-buildings fs-2 me-2 text-primary">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {fullMerchantName}
                                        </span>
                                    )}
                                    {branchName && (
                                        <span className="d-flex align-items-center text-hover-primary me-5 mb-2">
                                            <i className="ki-duotone ki-shop fs-2 me-2 text-info">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {branchName}
                                        </span>
                                    )}
                                    {user.email && (
                                        <span className="d-flex align-items-center me-5 mb-2">
                                            <i className="ki-duotone ki-sms fs-2 me-2 text-success">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {user.email}
                                        </span>
                                    )}
                                    {user.phone && (
                                        <span className="d-flex align-items-center mb-2">
                                            <i className="ki-duotone ki-call fs-2 me-2 text-warning">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {user.phone}
                                        </span>
                                    )}
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
                                        <span className="fw-bold fs-7 text-gray-500">{userStatusLabel ?? 'User Status'}</span>
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
                                    <span className={`fw-bold fs-8 text-${statusMeta.isActive ? 'success' : 'danger'}`}>
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
                                    className={`nav-link text-active-primary ms-0 me-10 py-5 ${activeTab === tab.key ? 'active' : ''}`}
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

export default UserProfileHeader;

