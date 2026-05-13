import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTranslatedText } from '../../../utils/helpers';
import { useCan, USER_GROUP_EDIT_PERMISSIONS } from '../../../utils/permissions';

const UserGroupTableRow = ({ 
    group, 
    rowNumber, 
    isSelected, 
    onSelect, 
    onActivate, 
    onDeactivate, 
    onDelete 
}) => {
    const { t } = useTranslation();
    const canEditUserGroup = useCan(USER_GROUP_EDIT_PERMISSIONS);
    const canDeleteUserGroup = useCan('pos.user_groups.delete_users_groups');
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                right: window.innerWidth - rect.right + window.scrollX
            });
        }
    }, [showActions]);

    const handleCheckboxChange = (e) => {
        onSelect(group.id, e.target.checked);
    };

    const getStatusBadge = (isActive) => {
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

            {/* Group Info */}
            <td>
                <div className="d-flex flex-column">
                    <Link 
                        to={`/admin/user-groups/${group.id}`} 
                        className="text-gray-800 text-hover-primary fw-bold mb-1"
                    >
                        {group.name}
                    </Link>
                    <span className="text-muted fs-7">{group.group_id}</span>
                    {group.description && (
                        <span className="text-muted fs-7">{group.description}</span>
                    )}
                </div>
            </td>

            {/* Merchant */}
            <td>
                {group.merchant ? (
                    <div className="d-flex flex-column">
                        <span className="text-gray-800 fw-bold">
                            {getTranslatedText(group.merchant.business_name) || getTranslatedText(group.merchant.name)}
                        </span>
                        {group.merchant.email && (
                            <span className="text-muted fs-7">{group.merchant.email}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted">N/A</span>
                )}
            </td>

            {/* Branch */}
            <td>
                {group.branch ? (
                    <span className="text-gray-800">
                        {getTranslatedText(group.branch.name)}
                    </span>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Country */}
            <td>
                {group.merchant?.country ? (
                    <div className="d-flex align-items-center">
                        {group.merchant.country.code && (
                            <img 
                                src={`/flags/${group.merchant.country.code.toLowerCase()}.png`} 
                                alt={getTranslatedText(group.merchant.country.name)}
                                className="me-2"
                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <span className="text-gray-800">
                            {getTranslatedText(group.merchant.country.name)}
                        </span>
                    </div>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Users Count */}
            <td>
                <span className="badge badge-light-primary">
                    {t('admin.userGroupsUI.tableRow.usersCount', { count: group.users?.length || 0 })}
                </span>
            </td>

            {/* Status */}
            <td>
                {getStatusBadge(group.is_active)}
            </td>

            {/* Created At */}
            <td>
                <span className="text-gray-800">
                    {new Date(group.created_at).toLocaleDateString()}
                </span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="dropdown">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        onBlur={() => setTimeout(() => setShowActions(false), 200)}
                    >
                        {t('admin.userGroupsUI.tableRow.actions')}
                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>
                    {showActions && (
                        <div 
                            className="dropdown-menu dropdown-menu-end show" 
                            style={{ 
                                position: 'fixed', 
                                top: `${dropdownPosition.top}px`, 
                                right: `${dropdownPosition.right}px`,
                                left: 'auto',
                                zIndex: 1050 
                            }}
                        >
                            <Link 
                                to={`/admin/user-groups/${group.id}`} 
                                className="dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                {t('admin.common.view')}
                            </Link>
                            
                            {canEditUserGroup && (
                                <Link 
                                    to={`/admin/user-groups/${group.id}/edit`} 
                                    className="dropdown-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.edit')}
                                </Link>
                            )}
                            
                            {group.is_active ? (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onDeactivate(group.id); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-cross-circle fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.terminalGroupsUI.view.deactivate')}
                                </button>
                            ) : (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onActivate(group.id); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-check-circle fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.terminalGroupsUI.view.activate')}
                                </button>
                            )}
                            
                            <div className="dropdown-divider"></div>
                            
                            {canDeleteUserGroup && onDelete && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onDelete(group.id); }} 
                                    className="dropdown-item text-danger"
                                >
                                    <i className="ki-duotone ki-trash fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                        <span className="path5"></span>
                                    </i>
                                    {t('admin.common.delete')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default UserGroupTableRow;

