import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { deleteRole } from '../../../../services/adminRolesService';
import { useCan } from '../../../../utils/permissions';

const RoleTableRow = ({ role, isSelected, onSelect, onRefresh }) => {
    const { t } = useTranslation();
    const canEditRole = useCan('pos.roles.edit_roles');
    const canDeleteRole = useCan('pos.roles.delete_roles');
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

    const handleDelete = async () => {
        if (!window.confirm(t('admin.systemRoles.deleteThisRoleConfirm'))) {
            return;
        }

        try {
            const response = await deleteRole(role.id);
            if (response.success) {
                toast.success(t('admin.systemRoles.roleDeleted'));
                onRefresh();
            } else {
                toast.error(response.error || t('admin.systemRoles.roleDeleteFailed'));
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error(t('admin.systemRoles.roleDeleteFailed'));
        }
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(role.id)}
                    />
                </div>
            </td>
            <td>
                <Link to={`/admin/system/roles/${role.id}`} className="text-gray-800 text-hover-primary fw-bold">
                    {role.name}
                </Link>
            </td>
            <td>
                <span className="badge badge-light-success">
                    {t('admin.systemRoles.permissionsCountBadge', { count: role.permissions_count || 0 })}
                </span>
            </td>
            <td>{new Date(role.created_at).toLocaleDateString()}</td>
            <td className="text-end">
                <div className="dropdown">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        onBlur={() => setTimeout(() => setShowActions(false), 200)}
                    >
                        {t('admin.systemRoles.actionsMenu')}
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
                                to={`/admin/system/roles/${role.id}`} 
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
                            
                            {canEditRole && (
                                <Link 
                                    to={`/admin/system/roles/${role.id}/edit`} 
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
                            
                            {canDeleteRole && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    
                                    <button 
                                        onMouseDown={(e) => { e.preventDefault(); handleDelete(); }} 
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default RoleTableRow;
