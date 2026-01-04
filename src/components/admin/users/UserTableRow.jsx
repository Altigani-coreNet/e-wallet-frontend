import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTranslatedText } from '../../../utils/helpers';
import { useCan } from '../../../utils/permissions';

const UserTableRow = ({ 
    user, 
    rowNumber, 
    isSelected, 
    onSelect, 
    onActivate, 
    onDeactivate, 
    onDelete 
}) => {
    const canEditUser = useCan('pos.users.edit_users');
    const canDeleteUser = useCan('pos.users.delete_users');
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
        onSelect(user.id, e.target.checked);
    };

    const getStatusBadge = (status) => {
        // Handle both string and numeric status values
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? 'Active' : 'Inactive';
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
                    <span className="text-muted">N/A</span>
                )}
            </td>

            {/* Branch */}
            <td>
                {user.branch ? (
                    <span className="text-gray-800">
                        {getTranslatedText(user.branch.name)}
                    </span>
                ) : (
                    <span className="text-muted">N/A</span>
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
                    <span className="text-muted">N/A</span>
                )}
            </td>

            {/* Status */}
            <td>
                {getStatusBadge(user.status)}
            </td>

            {/* Is Admin */}
            <td>
                {user.is_admin ? (
                    <span className="badge badge-light-primary">Yes</span>
                ) : (
                    <span className="badge badge-light-secondary">No</span>
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
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        onBlur={() => setTimeout(() => setShowActions(false), 200)}
                    >
                        Actions
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
                                to={`/admin/users/${user.id}`} 
                                className="dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                View
                            </Link>
                            
                            {canEditUser && (
                                <Link 
                                    to={`/admin/users/${user.id}/edit`} 
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
                            
                            {(user.status === 'active' || user.status === 1 || user.status === '1' || user.status === true) ? (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onDeactivate(user.id); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-cross-circle fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Deactivate
                                </button>
                            ) : (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onActivate(user.id); }} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-check-circle fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Activate
                                </button>
                            )}
                            
                            <div className="dropdown-divider"></div>
                            
                            {canDeleteUser && onDelete && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); onDelete(user.id); }} 
                                    className="dropdown-item text-danger"
                                >
                                    <i className="ki-duotone ki-trash fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                        <span className="path5"></span>
                                    </i>
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default UserTableRow;

