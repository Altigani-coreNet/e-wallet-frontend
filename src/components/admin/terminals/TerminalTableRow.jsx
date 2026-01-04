import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';

const TerminalTableRow = ({ 
    terminal, 
    rowNumber, 
    isSelected, 
    onSelect, 
    onDelete 
}) => {
    const canEditTerminal = useCan('pos.terminals.edit_terminals');
    const canDeleteTerminal = useCan('pos.terminals.delete_terminals');
    const [showMenu, setShowMenu] = useState(false);

    const handleCheckboxChange = (e) => {
        onSelect(terminal.id, e.target.checked);
    };

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? 'Active' : 'Inactive';
        const statusClass = isActive ? 'badge-light-success' : 'badge-light-warning';
        
        return (
            <span className={`badge ${statusClass}`}>
                {statusText}
            </span>
        );
    };

    const getTerminalStatusBadge = (terminalStatus) => {
        const statusMap = {
            'online': { text: 'Online', class: 'badge-light-success' },
            'offline': { text: 'Offline', class: 'badge-light-danger' },
            'testing': { text: 'Testing', class: 'badge-light-warning' },
            'maintenance': { text: 'Maintenance', class: 'badge-light-info' }
        };
        
        const status = statusMap[terminalStatus] || { text: 'Unknown', class: 'badge-light-secondary' };
        
        return (
            <span className={`badge ${status.class}`}>
                {status.text}
            </span>
        );
    };

    const getAddTypeBadge = (addType) => {
        const isAuto = addType === 'auto';
        const text = isAuto ? 'Auto' : 'Static';
        const badgeClass = isAuto ? 'badge-light-success' : 'badge-light-warning';
        
        return (
            <span className={`badge ${badgeClass}`}>
                {text}
            </span>
        );
    };

    const handleDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete terminal "${terminal.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(terminal.id);
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

            {/* Terminal Info */}
            <td>
                <div className="d-flex flex-column">
                    <Link 
                        to={`/admin/terminals/${terminal.id}`} 
                        className="text-gray-800 text-hover-primary fw-bold mb-1"
                    >
                        {terminal.name}
                    </Link>
                    <span className="text-muted fs-7">ID: {terminal.terminal_id}</span>
                    {terminal.model && (
                        <span className="text-muted fs-7">Model: {terminal.model}</span>
                    )}
                </div>
            </td>

            {/* Merchant */}
            <td>
                <span className="text-gray-800">
                    {terminal.merchant?.business_name || terminal.merchant?.name || 'N/A'}
                </span>
            </td>

            {/* Branch */}
            <td>
                <span className="text-gray-800">
                    {terminal.branch?.name || 'N/A'}
                </span>
            </td>

            {/* Manufacturer */}
            <td>
                <span className="text-gray-800">
                    {terminal.manufacturer || 'N/A'}
                </span>
            </td>

            {/* Brand */}
            <td>
                <span className="text-gray-800">
                    {terminal.brand || 'N/A'}
                </span>
            </td>

            {/* SDK Info */}
            <td>
                {terminal.sdk_id || terminal.sdk_version ? (
                    <div className="d-flex flex-column">
                        {terminal.sdk_id && (
                            <span className="text-gray-800 fs-7">ID: {terminal.sdk_id}</span>
                        )}
                        {terminal.sdk_version && (
                            <span className="text-muted fs-7">Ver: {terminal.sdk_version}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted">N/A</span>
                )}
            </td>

            {/* Add Type */}
            <td>
                {getAddTypeBadge(terminal.add_type)}
            </td>

            {/* Status (is_active) */}
            <td>
                {getStatusBadge(terminal.is_active)}
            </td>

            {/* Terminal Status */}
            <td>
                {getTerminalStatusBadge(terminal.terminal_status)}
            </td>

            {/* Country */}
            <td>
                <span className="text-gray-800">
                    {(() => {
                        const country = terminal.country || terminal.merchant?.country;
                        if (!country) return 'N/A';
                        
                        // Handle multilingual name object
                        if (country.name && typeof country.name === 'object') {
                            return country.name.en || country.name.ar || 'N/A';
                        }
                        
                        return country.name || 'N/A';
                    })()}
                </span>
            </td>

            {/* Created At */}
            <td>
                <span className="text-gray-800">
                    {new Date(terminal.created_at).toLocaleDateString()}
                </span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="dropdown">
                    <button
                        className="btn btn-sm btn-light btn-active-light-primary"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded={showMenu}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        Actions
                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>
                    <ul className={`dropdown-menu dropdown-menu-end ${showMenu ? 'show' : ''}`}>
                        <li>
                            <Link 
                                to={`/admin/terminals/${terminal.id}`} 
                                className="dropdown-item"
                            >
                                <i className="ki-duotone ki-eye fs-6 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                View
                            </Link>
                        </li>
                        {canEditTerminal && (
                            <li>
                                <Link 
                                    to={`/admin/terminals/${terminal.id}/edit`} 
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-pencil fs-6 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Edit
                                </Link>
                            </li>
                        )}
                        {canDeleteTerminal && (
                            <>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button 
                                        className="dropdown-item text-danger"
                                        onClick={handleDelete}
                                    >
                                        <i className="ki-duotone ki-trash fs-6 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        Delete
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

export default TerminalTableRow;

