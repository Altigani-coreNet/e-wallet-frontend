import React from 'react';
import { useTranslation } from 'react-i18next';

const renderStatusBadge = (status, terminalStatus, displayName, t) => {
    let label = displayName || t('merchant.common.inactive');
    let badgeClass = 'badge-light-danger';

    if (terminalStatus) {
        const normalized = terminalStatus.toLowerCase();

        switch (normalized) {
            case 'online':
                label = displayName || t('merchant.common.online');
                badgeClass = 'badge-light-success';
                break;
            case 'active':
                label = displayName || t('merchant.common.active');
                badgeClass = 'badge-light-success';
                break;
            case 'offline':
                label = displayName || t('merchant.common.offline');
                badgeClass = 'badge-light-warning';
                break;
            default:
                label = displayName || terminalStatus.charAt(0).toUpperCase() + terminalStatus.slice(1);
                badgeClass = 'badge-light-secondary';
                break;
        }
    } else if (status === true || status === 1 || status === '1' || status === 'active') {
        label = displayName || t('merchant.common.active');
        badgeClass = 'badge-light-success';
    }

    return <span className={`badge ${badgeClass}`}>{label}</span>;
};

const formatDateTime = (value, na) => {
    if (!value) return na;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const EmptyState = ({ title, description, icon = 'ki-information' }) => (
    <div className="text-center py-10">
        <i className={`ki-duotone ${icon} fs-3x text-gray-400 mb-5`}>
            <span className="path1"></span>
            <span className="path2"></span>
            <span className="path3"></span>
        </i>
        <h4 className="fw-bold text-gray-800 mb-3">{title}</h4>
        <p className="text-gray-500 fs-6 mb-0">{description}</p>
    </div>
);

const UserTerminalsTab = ({ terminals = [], terminalGroups = [] }) => {
    const { t } = useTranslation();
    const na = t('merchant.common.na');

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card mb-5 mb-xl-10">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">{t('merchant.users.terminalsTab.terminalGroupsTitle')}</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">
                                {t('merchant.users.terminalsTab.groupsBadge', { count: terminalGroups.length })}
                            </span>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {terminalGroups.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-100 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-200px ps-9">{t('merchant.users.terminalsTab.colGroupName')}</th>
                                            <th className="min-w-150px">{t('merchant.users.terminalsTab.colGroupId')}</th>
                                            <th className="min-w-150px">{t('merchant.users.terminalsTab.colTerminals')}</th>
                                            <th className="min-w-150px">{t('merchant.users.terminalsTab.colStatus')}</th>
                                            <th className="min-w-175px">{t('merchant.users.terminalsTab.colAssignedAt')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {terminalGroups.map((group) => (
                                            <tr key={group.id}>
                                                <td className="ps-9">
                                                    <div className="d-flex flex-column">
                                                        <span className="text-dark fw-bold text-hover-primary fs-6">{group.name}</span>
                                                        {group.description && (
                                                            <span className="text-muted fs-7">{group.description}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-info">{group.group_id}</span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-gray-800">{group.terminals_count ?? 0}</span>
                                                </td>
                                                <td>{renderStatusBadge(group.is_active, null, group.status_display_name, t)}</td>
                                                <td>{formatDateTime(group.assigned_at, na)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                title={t('merchant.users.terminalsTab.emptyGroupsTitle')}
                                description={t('merchant.users.terminalsTab.emptyGroupsHint')}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">{t('merchant.users.terminalsTab.terminalsTitle')}</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">
                                {t('merchant.users.terminalsTab.terminalsBadge', { count: terminals.length })}
                            </span>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {terminals.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-100 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-200px ps-9">{t('merchant.users.terminalsTab.colTerminalName')}</th>
                                            <th className="min-w-150px">{t('merchant.users.terminalsTab.colDeviceId')}</th>
                                            <th className="min-w-150px">{t('merchant.users.terminalsTab.colTerminalId')}</th>
                                            <th className="min-w-150px">{t('merchant.users.terminalsTab.colSerialNumber')}</th>
                                            <th className="min-w-125px">{t('merchant.users.terminalsTab.colStatus')}</th>
                                            <th className="min-w-175px">{t('merchant.users.terminalsTab.colAssignedAt')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {terminals.map((terminal) => (
                                            <tr key={terminal.id}>
                                                <td className="ps-9">
                                                    <div className="d-flex flex-column">
                                                        <span className="text-dark fw-bold text-hover-primary fs-6">
                                                            {terminal.name || t('merchant.users.terminalsTab.unnamedTerminal')}
                                                        </span>
                                                        {terminal.model && (
                                                            <span className="text-muted fs-7">
                                                                {terminal.brand ? `${terminal.brand} • ` : ''}
                                                                {terminal.model}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="fw-semibold text-gray-600">{terminal.device_id || na}</span>
                                                </td>
                                                <td>
                                                    <span className="fw-semibold text-gray-600">{terminal.terminal_id || na}</span>
                                                </td>
                                                <td>
                                                    <span className="fw-semibold text-gray-600">{terminal.serial_no || na}</span>
                                                </td>
                                                <td>
                                                    {renderStatusBadge(
                                                        terminal.is_active,
                                                        terminal.terminal_status,
                                                        terminal.status_display_name,
                                                        t
                                                    )}
                                                </td>
                                                <td>{formatDateTime(terminal.assigned_at, na)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon="ki-tablet"
                                title={t('merchant.users.terminalsTab.emptyTerminalsTitle')}
                                description={t('merchant.users.terminalsTab.emptyTerminalsHint')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTerminalsTab;
