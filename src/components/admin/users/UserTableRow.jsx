import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTranslatedText } from '../../../utils/helpers';
import { useCan } from '../../../utils/permissions';

const UserTableRow = ({ 
    user, 
    rowNumber, 
    isSelected, 
    onSelect, 
    onActivate, 
    onDeactivate, 
    onDelete,
    onSendResetPassword
}) => {
    const { t } = useTranslation();
    const canEditUser = useCan('pos.users.edit_users');
    const canDeleteUser = useCan('pos.users.delete_users');

    const handleCheckboxChange = (e) => {
        onSelect(user.id, e.target.checked);
    };

    const getStatusBadge = (status, isActiveFallback) => {
        // Handle both string and numeric status values, and fall back to `is_active`.
        const isActive =
            status === 'active' ||
            status === 1 ||
            status === '1' ||
            status === true ||
            isActiveFallback === true;
        const statusText = isActive ? t('admin.common.active') : t('admin.common.inactive');
        const statusClass = isActive ? 'badge-light-success' : 'badge-light-warning';
        
        return (
            <span className={`badge ${statusClass}`}>
                {statusText}
            </span>
        );
    };

    return (
        <tr>
            {/* Checkbox */}
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                    />
                </div>
            </td>

            {/* ID */}
            <td>
                <span className="text-gray-800 fw-bold">{rowNumber}</span>
            </td>

            {/* User Info */}
            <td>
                <div className="d-flex flex-column">
                    <Link 
                        to={`/admin/users/${user.id}`} 
                        className="text-gray-800 text-hover-primary fw-bold mb-1"
                    >
                        {user.name}
                    </Link>
                    <span className="text-muted fs-7">{user.email}</span>
                    {user.phone && (
                        <span className="text-muted fs-7">{user.phone}</span>
                    )}
                </div>
            </td>

            {/* Merchant */}
            <td>
                {user.merchant ? (
                    <div className="d-flex flex-column">
                        <span className="text-gray-800 fw-bold">
                            {getTranslatedText(user.merchant.business_name) || getTranslatedText(user.merchant.name)}
                        </span>
                        {user.merchant.email && (
                            <span className="text-muted fs-7">{user.merchant.email}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Branch */}
            <td>
                {user.branch ? (
                    <span className="text-gray-800">
                        {getTranslatedText(user.branch.name)}
                    </span>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Country */}
            <td>
                {user.merchant?.country ? (
                    <div className="d-flex align-items-center">
                        {user.merchant.country.code && (
                            <img 
                                src={`/flags/${user.merchant.country.code.toLowerCase()}.png`} 
                                alt={getTranslatedText(user.merchant.country.name)}
                                className="me-2"
                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <span className="text-gray-800">
                            {getTranslatedText(user.merchant.country.name)}
                        </span>
                    </div>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Status */}
            <td>
                {getStatusBadge(user.status, user.is_active)}
            </td>

            {/* Is Admin */}
            <td>
                {user.is_admin ? (
                    <span className="badge badge-light-primary">{t('admin.common.yes')}</span>
                ) : (
                    <span className="badge badge-light-secondary">{t('admin.common.no')}</span>
                )}
            </td>

            {/* Created At */}
            <td>
                <span className="text-gray-800">
                    {new Date(user.created_at).toLocaleDateString()}
                </span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="dropdown">
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-bg-light btn-active-light-primary"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        title={t('admin.usersUI.tableRow.actionsTitle')}
                    >
                        <i className="ki-duotone ki-dots-square fs-2">
                            <span className="path1" />
                            <span className="path2" />
                            <span className="path3" />
                            <span className="path4" />
                        </i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                            <Link className="dropdown-item" to={`/admin/users/${user.id}`}>
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1" />
                                    <span className="path2" />
                                    <span className="path3" />
                                </i>
                                {t('admin.common.view')}
                            </Link>
                        </li>
                        {canEditUser && (
                            <li>
                                <Link className="dropdown-item" to={`/admin/users/${user.id}/edit`}>
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    {t('admin.common.edit')}
                                </Link>
                            </li>
                        )}
                        <li>
                            {(user.status === 'active' || user.status === 1 || user.status === '1' || user.status === true || user.is_active === true) ? (
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onDeactivate(user.id)}
                                >
                                    <i className="ki-duotone ki-cross-circle fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    {t('admin.terminalGroupsUI.view.deactivate')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onActivate(user.id)}
                                >
                                    <i className="ki-duotone ki-check-circle fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    {t('admin.terminalGroupsUI.view.activate')}
                                </button>
                            )}
                        </li>
                        <li>
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => onSendResetPassword?.(user.id)}
                            >
                                <i className="ki-duotone ki-shield-tick fs-5 me-2">
                                    <span className="path1" />
                                    <span className="path2" />
                                </i>
                                {t('admin.usersUI.tableRow.resetPassword')}
                            </button>
                        </li>
                        {canDeleteUser && onDelete && (
                            <>
                                <li>
                                    <hr className="dropdown-divider" />
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item text-danger"
                                        onClick={() => onDelete(user.id)}
                                    >
                                        <i className="ki-duotone ki-trash fs-5 me-2">
                                            <span className="path1" />
                                            <span className="path2" />
                                            <span className="path3" />
                                            <span className="path4" />
                                            <span className="path5" />
                                        </i>
                                        {t('admin.common.delete')}
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </td>
        </tr>
    );
};

export default UserTableRow;

