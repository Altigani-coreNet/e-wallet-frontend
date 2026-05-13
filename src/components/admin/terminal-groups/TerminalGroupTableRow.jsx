import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';

const TerminalGroupTableRow = ({ 
    group, 
    rowNumber, 
    isSelected, 
    onSelect, 
    onDelete 
}) => {
    const { t } = useTranslation();
    const canEditTerminalGroup = useCan('pos.terminal_groups.edit_terminal_assignments');
    const canDeleteTerminalGroup = useCan('pos.terminal_groups.delete_terminal_assignments');
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

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? t('admin.common.active') : t('admin.common.inactive');
        const statusClass = isActive ? 'badge-light-success' : 'badge-light-warning';
        
        return (
            <span className={`badge ${statusClass}`}>
                {statusText}
            </span>
        );
    };

    const handleDelete = () => {
        Swal.fire({
            title: t('admin.terminalGroupsUI.tableRow.deleteTitle'),
            text: t('admin.terminalGroupsUI.tableRow.deleteText', { name: group.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.terminalGroupsUI.tableRow.yesDelete'),
            cancelButtonText: t('admin.terminalGroupsUI.tableRow.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(group.id);
            }
        });
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
                        to={`/admin/terminal-groups/${group.id}`} 
                        className="text-gray-800 text-hover-primary fw-bold mb-1"
                    >
                        {group.name}
                    </Link>
                    <span className="text-muted fs-7">{t('admin.terminalGroupsUI.tableRow.idPrefix')} {group.group_id}</span>
                    {group.description && (
                        <span className="text-muted fs-7">{group.description.substring(0, 50)}{group.description.length > 50 ? '...' : ''}</span>
                    )}
                </div>
            </td>

            {/* Merchant ID */}
            <td>
                <span className="text-gray-800">
                    {group.merchant_id || t('admin.common.na')}
                </span>
            </td>

            {/* Branch ID */}
            <td>
                <span className="text-gray-800">
                    {group.branch_id || t('admin.common.na')}
                </span>
            </td>

            {/* Terminals Count */}
            <td>
                <span className="badge badge-light-primary">
                    {t('admin.terminalGroupsUI.tableRow.terminalsCount', { count: group.terminals_count || 0 })}
                </span>
            </td>

            {/* User Groups Count */}
            <td>
                <span className="badge badge-light-info">
                    {t('admin.terminalGroupsUI.tableRow.userGroupsCount', { count: group.user_groups_count || 0 })}
                </span>
            </td>

            {/* Subgroups Count */}
            <td>
                <span className="badge badge-light-warning">
                    {group.children_count || 0} Subgroups
                </span>
            </td>

            {/* Is Subgroup */}
            <td>
                {group.parent_id ? (
                    <span className="badge badge-light-secondary">{t('admin.terminalGroupsUI.tableRow.badgeSubgroup')}</span>
                ) : (
                    <span className="badge badge-light-primary">{t('admin.terminalGroupsUI.tableRow.badgeParent')}</span>
                )}
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
                        {t('admin.terminalGroupsUI.tableRow.actions')}
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
                                to={`/admin/terminal-groups/${group.id}`} 
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
                            
                            {canEditTerminalGroup && (
                                <Link 
                                    to={`/admin/terminal-groups/${group.id}/edit`} 
                                    className="dropdown-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Edit
                                </Link>
                            )}
                            
                            <div className="dropdown-divider"></div>
                            
                            {canDeleteTerminalGroup && onDelete && (
                                <button 
                                    onMouseDown={(e) => { 
                                        e.preventDefault(); 
                                        setShowActions(false);
                                        handleDelete();
                                    }} 
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

export default TerminalGroupTableRow;

