import React from 'react';

const renderStatusBadge = (status, displayName) => {
    const isActive = status === true || status === 1 || status === '1' || status === 'active';
    const label = displayName || (isActive ? 'Active' : 'Inactive');
    const badgeClass = `badge badge-light-${isActive ? 'success' : 'warning'}`;

    return <span className={badgeClass}>{label}</span>;
};

const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const UserUserGroupsTab = ({ userGroups = [] }) => {
    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Assigned User Groups</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">{userGroups.length} groups</span>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {userGroups.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-100 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-220px ps-9">Group Name</th>
                                            <th className="min-w-140px">Group ID</th>
                                            <th className="min-w-140px">Users Count</th>
                                            <th className="min-w-140px">Status</th>
                                            <th className="min-w-180px">Assigned At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userGroups.map((group) => (
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
                                                    <span className="fw-semibold text-gray-600">
                                                        {group.users_count ?? 0}
                                                    </span>
                                                </td>
                                                <td>{renderStatusBadge(group.is_active, group.status_display_name)}</td>
                                                <td>{formatDateTime(group.assigned_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <i className="ki-duotone ki-people fs-3x text-gray-400 mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <h4 className="fw-bold text-gray-800 mb-3">No User Groups</h4>
                                <p className="text-gray-500 fs-6 mb-0">
                                    Assign this user to a group to manage permissions collectively.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserUserGroupsTab;

