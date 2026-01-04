import React from 'react';

const renderStatusBadge = (status, terminalStatus, displayName) => {
    let label = displayName || 'Inactive';
    let badgeClass = 'badge-light-danger';

    if (terminalStatus) {
        const normalized = terminalStatus.toLowerCase();

        switch (normalized) {
            case 'online':
            case 'active':
                label = terminalStatus.charAt(0).toUpperCase() + terminalStatus.slice(1);
                badgeClass = 'badge-light-success';
                break;
            case 'offline':
                label = 'Offline';
                badgeClass = 'badge-light-warning';
                break;
            default:
                label = terminalStatus.charAt(0).toUpperCase() + terminalStatus.slice(1);
                badgeClass = 'badge-light-secondary';
                break;
        }
    } else if (status === true || status === 1 || status === '1' || status === 'active') {
        label = 'Active';
        badgeClass = 'badge-light-success';
    }

    return <span className={`badge ${badgeClass}`}>{label}</span>;
};

const formatDateTime = (value) => {
    if (!value) return 'N/A';
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
    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card mb-5 mb-xl-10">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Assigned Terminal Groups</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">{terminalGroups.length} groups</span>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {terminalGroups.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-100 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-200px ps-9">Group Name</th>
                                            <th className="min-w-150px">Group ID</th>
                                            <th className="min-w-150px">Terminals</th>
                                            <th className="min-w-150px">Status</th>
                                            <th className="min-w-175px">Assigned At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {terminalGroups.map((group) => (
                                            <tr key={group.id}>
                                                <td className="ps-9">
                                                    <div className="d-flex flex-column">
                                                        <span className="text-dark fw-bold text-hover-primary fs-6">
                                                            {group.name}
                                                        </span>
                                                        {group.description && (
                                                            <span className="text-muted fs-7">{group.description}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-info">{group.group_id}</span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-gray-800">
                                                        {group.terminals_count ?? 0}
                                                    </span>
                                                </td>
                                                <td>{renderStatusBadge(group.is_active, null, group.status_display_name)}</td>
                                                <td>{formatDateTime(group.assigned_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                title="No Terminal Groups"
                                description="This user is not assigned to any terminal groups yet."
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Assigned Terminals</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">{terminals.length} terminals</span>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {terminals.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-100 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-200px ps-9">Terminal Name</th>
                                            <th className="min-w-150px">Device ID</th>
                                            <th className="min-w-150px">Terminal ID</th>
                                            <th className="min-w-150px">Serial Number</th>
                                            <th className="min-w-125px">Status</th>
                                            <th className="min-w-175px">Assigned At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {terminals.map((terminal) => (
                                            <tr key={terminal.id}>
                                                <td className="ps-9">
                                                    <div className="d-flex flex-column">
                                                        <span className="text-dark fw-bold text-hover-primary fs-6">
                                                            {terminal.name || 'Unnamed Terminal'}
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
                                                    <span className="fw-semibold text-gray-600">
                                                        {terminal.device_id || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-semibold text-gray-600">
                                                        {terminal.terminal_id || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-semibold text-gray-600">
                                                        {terminal.serial_no || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {renderStatusBadge(
                                                        terminal.is_active,
                                                        terminal.terminal_status,
                                                        terminal.status_display_name
                                                    )}
                                                </td>
                                                <td>{formatDateTime(terminal.assigned_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon="ki-tablet"
                                title="No Terminals Assigned"
                                description="Assign terminals to this user to grant device access."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTerminalsTab;

