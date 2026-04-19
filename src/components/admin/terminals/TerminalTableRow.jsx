import React from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';

const TerminalTableRow = ({ 
    terminal, 
    merchantsMap = {},
    branchesMap = {},
    countriesMap = {},
    rowNumber, 
    isSelected, 
    onSelect, 
    onDelete 
}) => {
    const canEditTerminal = useCan('pos.terminals.edit_terminals');
    const canDeleteTerminal = useCan('pos.terminals.delete_terminals');

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
                    {terminal.merchant?.business_name ||
                        terminal.merchant?.name ||
                        terminal.merchant_name ||
                        merchantsMap[terminal.merchant_id] ||
                        terminal.merchant_id ||
                        'N/A'}
                </span>
            </td>

            {/* Branch */}
            <td>
                <span className="text-gray-800">
                    {terminal.branch?.name ||
                        terminal.branch_name ||
                        branchesMap[terminal.branch_id] ||
                        terminal.branch_id ||
                        'N/A'}
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
                        if (!country) {
                            return countriesMap[terminal.country_id] || terminal.country_id || 'N/A';
                        }
                        
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
                    {terminal.created_at ? new Date(terminal.created_at).toLocaleDateString() : 'N/A'}
                </span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="d-flex justify-content-end gap-2 flex-nowrap">
                    <Link
                        to={`/admin/terminals/${terminal.id}`}
                        className="btn btn-icon btn-sm btn-light-primary"
                        title="View"
                    >
                        <i className="ki-duotone ki-eye fs-6">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </Link>

                    {canEditTerminal && (
                        <Link
                            to={`/admin/terminals/${terminal.id}/edit`}
                            className="btn btn-icon btn-sm btn-light-warning"
                            title="Edit"
                        >
                            <i className="ki-duotone ki-pencil fs-6">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </Link>
                    )}

                    {canDeleteTerminal && (
                        <button
                            className="btn btn-icon btn-sm btn-light-danger"
                            onClick={handleDelete}
                            title="Delete"
                        >
                            <i className="ki-duotone ki-trash fs-6">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                                <span className="path5"></span>
                            </i>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TerminalTableRow;

