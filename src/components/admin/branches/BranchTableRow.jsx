import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';

const BranchTableRow = ({
    branch,
    rowNumber,
    isSelected,
    onSelect,
    onApprove,
    onReject,
    onSuspend,
    onUnsuspend,
    onDelete
}) => {
    const { t, i18n } = useTranslation();
    const canEditBranch = useCan('pos.branches.edit_branches');
    const canDeleteBranch = useCan('pos.branches.delete_branches');
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

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'badge-light-success';
            case 'pending':
                return 'badge-light-warning';
            case 'rejected':
                return 'badge-light-danger';
            case 'suspended':
                return 'badge-light-warning';
            case 'viewed':
                return 'badge-light-info';
            default:
                return 'badge-light-secondary';
        }
    };

    const getCountryName = (country) => {
        if (!country) return t('admin.common.na');
        let name = country.name;
        if (typeof name === 'object' && name !== null) {
            name = name[i18n.language] || name.en || name.ar || '';
        }
        return name || country.text || t('admin.common.na');
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(branch.id, e.target.checked)}
                    />
                </div>
            </td>

            {/* ID */}
            <td>
                <span className="text-gray-800">{rowNumber}</span>
            </td>

            {/* Branch Name */}
            <td>
                <Link to={`/admin/branches/${branch.id}`} className="text-gray-800 text-hover-primary fw-bold">
                    {branch.name}
                </Link>
            </td>

            {/* Merchant */}
            <td>
                {branch.merchant ? (
                    <Link to={`/admin/merchants/${branch.merchant.id}`} className="text-gray-600 text-hover-primary">
                        {branch.merchant.business_name || branch.merchant.name}
                    </Link>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Address */}
            <td>
                <span className="text-gray-600">
                    {branch.address || t('admin.common.na')}
                </span>
            </td>

            {/* Country */}
            <td>
                <span className="text-gray-600">
                    {getCountryName(branch.country)}
                </span>
            </td>

            {/* Status */}
            <td>
                <span className={`badge ${getStatusBadgeClass(branch.status)}`}>
                    {branch.status ? t(`admin.common.${branch.status.toLowerCase()}`) : t('admin.common.na')}
                </span>
            </td>

            {/* Is Active */}
            <td>
                {branch.is_active ? (
                    <span className="badge badge-light-success">{t('admin.common.active')}</span>
                ) : (
                    <span className="badge badge-light-danger">{t('admin.common.inactive')}</span>
                )}
            </td>

            {/* Created At */}
            <td>
                <span className="text-gray-600">
                    {new Date(branch.created_at).toLocaleDateString(i18n.language)}
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
                        {t('admin.common.actions')}
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
                                to={`/admin/branches/${branch.id}`} 
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

                            {canEditBranch && (
                                <Link 
                                    to={`/admin/branches/${branch.id}/edit`} 
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
                            
                            {branch.status === 'pending' && onApprove && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onApprove(branch.id); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-check fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.approve')}
                                </button>
                            )}
                            
                            {branch.status === 'pending' && onReject && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onReject(branch); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-cross fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.reject')}
                                </button>
                            )}
                            
                            {branch.status !== 'suspended' && branch.status !== 'pending' && onSuspend && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onSuspend(branch); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-lock fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.suspend')}
                                </button>
                            )}
                            
                            {branch.status === 'suspended' && onUnsuspend && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onUnsuspend(branch.id); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-lock-2 fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.unsuspend')}
                                </button>
                            )}
                            
                            <div className="dropdown-divider"></div>
                            
                            {canDeleteBranch && onDelete && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onDelete(branch.id); }} 
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

export default BranchTableRow;


