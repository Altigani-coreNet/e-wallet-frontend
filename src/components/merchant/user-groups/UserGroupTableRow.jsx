import React from 'react';
import { Link } from 'react-router-dom';

const UserGroupTableRow = ({ userGroup, onDelete, onToggleStatus, basePath, onSelect, isSelected }) => {
    const handleDelete = (e) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to delete this user group?')) {
            onDelete(userGroup.id);
        }
    };

    const handleToggleStatus = (e) => {
        e.preventDefault();
        onToggleStatus(userGroup.id);
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(userGroup.id)}
                    />
                </div>
            </td>
            <td>{userGroup.id}</td>
            <td>
                <div>
                    <div className="fw-bold">{userGroup.name}</div>
                    <div className="text-muted fs-7">{userGroup.group_id}</div>
                </div>
            </td>
            <td>{userGroup.branch?.name || 'N/A'}</td>
            <td>
                <span className="badge badge-light-primary badge-sm">
                    {userGroup.users_count || (userGroup.users?.length || 0)}
                </span>
            </td>
            <td>
                <span className={`badge ${userGroup.is_active ? 'badge-light-success' : 'badge-light-warning'}`}>
                    {userGroup.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="text-end">
                <div className="menu menu-sub menu-sub-dropdown w-250px w-md-300px" data-kt-menu="true">
                    <div className="menu-item px-3">
                        <div className="menu-content fs-6 text-dark fw-bold px-3 py-4">Quick Actions</div>
                    </div>

                    <div className="separator mb-3 opacity-75"></div>

                    <div className="menu-item px-3">
                        <Link
                            to={`${basePath}/user-groups/${userGroup.id}`}
                            className="menu-link px-3"
                        >
                            <i className="ki-duotone ki-eye fs-4 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            View Details
                        </Link>
                    </div>

                    <div className="menu-item px-3">
                        <Link
                            to={`${basePath}/user-groups/${userGroup.id}/edit`}
                            className="menu-link px-3"
                        >
                            <i className="ki-duotone ki-notepad-edit fs-4 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit
                        </Link>
                    </div>

                    <div className="separator my-3"></div>

                    <div className="menu-item px-3">
                        <a
                            href="#"
                            className="menu-link px-3 text-warning"
                            onClick={handleToggleStatus}
                        >
                            <i className="ki-duotone ki-information-5 fs-4 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            {userGroup.is_active ? 'Deactivate' : 'Activate'}
                        </a>
                    </div>

                    <div className="menu-item px-3">
                        <a
                            href="#"
                            className="menu-link px-3 text-danger"
                            onClick={handleDelete}
                        >
                            <i className="ki-duotone ki-trash fs-4 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Delete
                        </a>
                    </div>
                </div>

                <button
                    className="btn btn-light btn-active-light-primary btn-sm"
                    data-kt-menu-trigger="click"
                    data-kt-menu-placement="bottom-end"
                >
                    Actions
                    <i className="ki-duotone ki-down fs-5 ms-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                </button>
            </td>
        </tr>
    );
};

export default UserGroupTableRow;

