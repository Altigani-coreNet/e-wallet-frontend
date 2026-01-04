import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

const RoleTableRow = ({ role, onDelete, typeParam, basePath = '/sales' }) => {
    const [searchParams] = useSearchParams();
    const type = typeParam || searchParams.get('type');
    
    const handleDelete = () => {
        onDelete(role.id);
    };

    const editUrl = `${basePath}/roles/${role.id}/edit${type ? `?type=${type}` : ''}`;
    const viewUrl = `${basePath}/roles/${role.id}${type ? `?type=${type}` : ''}`;

    const isSystemRole = role.name === 'Super Admin' || role.is_system_role;

    return (
        <tr>
            <td>
                <span className="badge badge-light-primary">{role.id}</span>
            </td>
            <td>
                <div className="d-flex flex-column">
                    <span className="text-dark fw-bold">{role.name}</span>
                    {role.display_name && (
                        <span className="text-muted fs-7">{role.display_name}</span>
                    )}
                </div>
            </td>
            <td>
                <span className="badge badge-light-success">
                    {role.permissions_count || role.permissions?.length || 0} permissions
                </span>
            </td>
            <td>
                <span className="text-muted">{formatDate(role.created_at)}</span>
            </td>
            <td className="text-end">
                {/* Actions Dropdown */}
                <button
                    className="btn btn-sm btn-light btn-active-light-primary"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    Actions
                    <i className="ki-duotone ki-down fs-5 ms-1"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                    {/* View Action */}
                    <li>
                        <Link className="dropdown-item" to={viewUrl}>
                            <i className="ki-duotone ki-eye fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            View Details
                        </Link>
                    </li>
                    
                    {/* Edit Action */}
                    <li>
                        <Link className="dropdown-item" to={editUrl}>
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Role
                        </Link>
                    </li>

                    {/* Divider */}
                    {!isSystemRole && <li><hr className="dropdown-divider" /></li>}
                    
                    {/* Delete Action */}
                    {!isSystemRole && (
                        <li>
                            <button
                                className="dropdown-item text-danger"
                                onClick={handleDelete}
                            >
                                <i className="ki-duotone ki-trash fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                    <span className="path4"></span>
                                    <span className="path5"></span>
                                </i>
                                Delete Role
                            </button>
                        </li>
                    )}

                    {/* System Role Message */}
                    {isSystemRole && (
                        <li>
                            <span className="dropdown-item text-muted disabled">
                                <i className="ki-duotone ki-shield-tick fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                System Role (Protected)
                            </span>
                        </li>
                    )}
                </ul>
            </td>
        </tr>
    );
};

export default RoleTableRow;

