import React from 'react';
import { Link } from 'react-router-dom';

const UserTableRow = ({ user, index, onDelete, onStatusChange, basePath = '/sales' }) => {
    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    // Get status badge
    const getStatusBadge = (status) => {
        if (status === 1) {
            return <span className="badge badge-light-success">Active</span>;
        }
        return <span className="badge badge-light-danger">Inactive</span>;
    };

    // Get roles display
    const getRolesDisplay = (userRoles) => {
        if (!userRoles || userRoles.length === 0) {
            return <span className="text-muted">-</span>;
        }
        
        return userRoles.map((role, idx) => (
            <span key={idx} className="badge badge-light-primary me-1">
                {role.name}
            </span>
        ));
    };

    return (
        <tr>
            <td>
                <span className="text-gray-800 fw-bold">
                    {index}
                </span>
            </td>
            <td>
                <div className="d-flex align-items-center">
                    {/* Avatar */}
                    <div className="symbol symbol-45px me-5">
                        {user.profile_image ? (
                            <img src={user.profile_image} alt={user.name} className="rounded-circle" />
                        ) : (
                            <div className="symbol-label bg-light-primary text-primary fs-6 fw-bolder">
                                {getInitials(user.name)}
                            </div>
                        )}
                    </div>
                    
                    {/* User Info */}
                    <div className="d-flex flex-column">
                        <Link to={`${basePath}/users/${user.id}`} className="text-gray-800 text-hover-primary mb-1 fw-bold">
                            {user.name}
                        </Link>
                        <span className="text-gray-500 fw-semibold d-block fs-7">
                            {user.email}
                        </span>
                    </div>
                </div>
            </td>
            <td>
                <span className="text-gray-800">{user.phone || '-'}</span>
            </td>
            <td>
                {/* User Type (from backend "type" or optional user_type) */}
                {(() => {
                    const rawType = user.type || user.user_type;
                    if (!rawType) {
                        return <span className="text-muted">-</span>;
                    }

                    const normalized = String(rawType).toLowerCase();
                    let label = rawType;
                    let badgeClass = 'badge-light-secondary';

                    if (normalized === 'admin') {
                        label = 'Admin';
                        badgeClass = 'badge-light-danger';
                    } else if (normalized === 'supervisor') {
                        label = 'Supervisor';
                        badgeClass = 'badge-light-warning';
                    } else if (normalized === 'cashier') {
                        label = 'Cashier';
                        badgeClass = 'badge-light-primary';
                    }

                    return (
                        <span className={`badge ${badgeClass}`}>
                            {label}
                        </span>
                    );
                })()}
            </td>
            <td>
                <span className="text-gray-800">
                    {user.branch ? user.branch.name : '-'}
                </span>
            </td>
            <td>
                {getRolesDisplay(user.roles)}
            </td>
            <td>
                {getStatusBadge(user.status)}
            </td>
            <td className="text-end">
                <button 
                    type="button" 
                    className="btn btn-sm btn-light btn-active-light-primary" 
                    data-kt-menu-trigger="click" 
                    data-kt-menu-placement="bottom-end"
                >
                    Actions
                    <i className="ki-duotone ki-down fs-5 ms-1"></i>
                </button>
                
                {/* Actions Dropdown Menu */}
                <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px py-4" data-kt-menu="true">
                    <div className="menu-item px-3">
                        <Link to={`${basePath}/users/${user.id}`} className="menu-link px-3">
                            View
                        </Link>
                    </div>
                    <div className="menu-item px-3">
                        <a 
                            href="#" 
                            className="menu-link px-3" 
                            onClick={(e) => {
                                e.preventDefault();
                                onStatusChange(user.id, user.status);
                            }}
                        >
                            {user.status === 1 ? 'Deactivate' : 'Activate'}
                        </a>
                    </div>
                    <div className="menu-item px-3">
                        <Link to={`${basePath}/users/${user.id}/edit`} className="menu-link px-3">
                            Edit
                        </Link>
                    </div>
                    <div className="menu-item px-3">
                        <a 
                            href="#" 
                            className="menu-link px-3 text-danger" 
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(user.id);
                            }}
                        >
                            Delete
                        </a>
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default UserTableRow;

