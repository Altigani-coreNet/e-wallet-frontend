import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { deleteAdmin, changeAdminStatus } from '../../../../services/adminAdminsService';
import { useCan } from '../../../../utils/permissions';

const AdminTableRow = ({ admin, isSelected, onSelect, onRefresh }) => {
    const canEditAdmin = useCan('pos.admins.edit_admins');
    const canDeleteAdmin = useCan('pos.admins.delete_admins');
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
        if (!window.confirm('Are you sure you want to delete this admin?')) return;
        const response = await deleteAdmin(admin.id);
        response.success ? (toast.success('Admin deleted'), onRefresh()) : toast.error(response.error || 'Failed to delete');
    };

    const handleStatusChange = async () => {
        const response = await changeAdminStatus(admin.id);
        response.success ? (toast.success('Status changed'), onRefresh()) : toast.error(response.error || 'Failed to change status');
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input className="form-check-input" type="checkbox" checked={isSelected} onChange={() => onSelect(admin.id)} />
                </div>
            </td>
            <td>
                <div className="d-flex align-items-center">
                    {admin.profile_image && (
                        <div className="symbol symbol-35px me-3">
                            <img src={admin.profile_image} alt={admin.name} />
                        </div>
                    )}
                    <div>
                        <Link to={`/admin/system/admins/${admin.id}`} className="text-gray-800 text-hover-primary fw-bold">
                            {admin.name}
                        </Link>
                    </div>
                </div>
            </td>
            <td>{admin.email}</td>
            <td>{admin.phone || 'N/A'}</td>
            <td>
                {admin.roles && Array.isArray(admin.roles) && admin.roles.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                        {admin.roles.map((role, index) => (
                            <span key={index} className="badge badge-light-primary">
                                {typeof role === 'object' ? (role.name || role) : role}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted">No roles</span>
                )}
            </td>
            <td>
                <span className={`badge badge-light-${admin.custom_region ? 'success' : 'secondary'}`}>
                    {admin.custom_region ? 'Yes' : 'No'}
                </span>
            </td>
            <td>
                {admin.custom_region ? (
                    admin.regions && Array.isArray(admin.regions) && admin.regions.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                            {admin.regions.slice(0, 3).map((region, index) => {
                                let displayText = region;
                                try {
                                    if (typeof region === 'string' && region.startsWith('{')) {
                                        const parsed = JSON.parse(region);
                                        displayText = parsed.en || parsed.ar || region;
                                    } else if (typeof region === 'object') {
                                        displayText = region.name?.en || region.name?.ar || region.name || region;
                                    }
                                } catch (e) {}
                                return (
                                    <span key={index} className="badge badge-light">{displayText}</span>
                                );
                            })}
                            {admin.regions.length > 3 && (
                                <span className="badge badge-light">+{admin.regions.length - 3} more</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted">No region</span>
                    )
                ) : (
                    <span className="badge badge-light-info">Any Region</span>
                )}
            </td>
            <td>
                <button
                    onClick={handleStatusChange}
                    className={`badge badge-light-${admin.status === 'active' ? 'success' : 'danger'} cursor-pointer border-0`}
                >
                    {admin.status === 'active' ? 'Active' : 'Inactive'}
                </button>
            </td>
            <td>{new Date(admin.created_at).toLocaleDateString()}</td>
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
                            style={{ position: 'fixed', top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px`, left: 'auto', zIndex: 1050 }}
                        >
                            <Link to={`/admin/system/admins/${admin.id}`} className="dropdown-item" onMouseDown={(e) => e.preventDefault()}>
                                <i className="ki-duotone ki-eye fs-5 me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                                View
                            </Link>
                            {canEditAdmin && (
                                <Link to={`/admin/system/admins/${admin.id}/edit`} className="dropdown-item" onMouseDown={(e) => e.preventDefault()}>
                                    <i className="ki-duotone ki-pencil fs-5 me-2"><span className="path1"></span><span className="path2"></span></i>
                                    Edit
                                </Link>
                            )}
                            <button onMouseDown={(e) => { e.preventDefault(); handleStatusChange(); }} className="dropdown-item">
                                <i className="ki-duotone ki-toggle-on fs-5 me-2"><span className="path1"></span><span className="path2"></span></i>
                                Toggle Status
                            </button>
                            {canDeleteAdmin && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <button onMouseDown={(e) => { e.preventDefault(); handleDelete(); }} className="dropdown-item text-danger">
                                        <i className="ki-duotone ki-trash fs-5 me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span><span className="path4"></span><span className="path5"></span></i>
                                        Delete
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

export default AdminTableRow;
