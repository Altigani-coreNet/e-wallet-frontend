import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { deleteTerminal, updateTerminal } from '../../../services/terminalsService';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';

const TerminalTableRow = ({ terminal, branch, isSelected, onSelect, onRefresh }) => {
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const canView = useCan('terminals.view');
    const canEdit = useCan('terminals.edit');
    const canDelete = useCan('terminals.delete');

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete terminal "${terminal.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            const response = await deleteTerminal(terminal.id);
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['terminals'] });
                queryClient.invalidateQueries({ queryKey: ['terminal-details', terminal.id] });
                
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Terminal deleted successfully!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: response.error || 'Failed to delete terminal',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error deleting terminal:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while deleting the terminal',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        const statusText = newStatus ? 'activate' : 'deactivate';
        const result = await Swal.fire({
            title: 'Confirm Status Change',
            text: `Are you sure you want to ${statusText} "${terminal.name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: `Yes, ${statusText}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setUpdating(true);
        try {
            const terminalData = {
                name: terminal.name,
                terminal_id: terminal.terminal_id,
                branch_id: terminal.branch_id,
                model: terminal.model,
                manufacturer: terminal.manufacturer,
                serial_no: terminal.serial_no,
                sdk_id: terminal.sdk_id,
                sdk_version: terminal.sdk_version,
                android_os: terminal.android_os,
                add_type: terminal.add_type,
                is_active: newStatus ? 'active' : 'inactive'
            };

            const response = await updateTerminal(terminal.id, terminalData);

            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['terminals'] });
                queryClient.invalidateQueries({ queryKey: ['terminal-details', terminal.id] });
                
                Swal.fire({
                    title: 'Success!',
                    text: `Terminal ${statusText}d successfully!`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: response.error || 'Failed to update terminal status',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error updating terminal:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while updating the terminal',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setUpdating(false);
        }
    };

    const isActive = terminal.is_active === 'active' || terminal.is_active === true || terminal.is_active === 1 || terminal.is_active === '1';

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={onSelect}
                    />
                </div>
            </td>
            <td>
                <Link to={`/merchant/terminals/${terminal.id}`} className="text-gray-800 text-hover-primary">
                    {terminal.name}
                </Link>
            </td>
            <td>
                <span className="badge badge-light-info">{terminal.terminal_id || 'N/A'}</span>
            </td>
            <td>{branch ? branch.name : (terminal.branch_id ? 'Loading...' : 'N/A')}</td>
            <td>{terminal.model || 'N/A'}</td>
            <td>{terminal.manufacturer || 'N/A'}</td>
            <td>
                {(terminal.is_active === 'active' || terminal.is_active === true || terminal.is_active === 1 || terminal.is_active === '1') ? (
                    <span className="badge badge-light-success">Active</span>
                ) : (
                    <span className="badge badge-light-danger">Inactive</span>
                )}
            </td>
            <td className="text-end">
                <div className="d-flex justify-content-end">
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-light btn-active-light-primary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            disabled={updating || deleting}
                        >
                            {updating || deleting ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            ) : null}
                            Actions
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            {/* View */}
                            {canView && (
                                <li>
                                    <Link 
                                        className="dropdown-item" 
                                        to={`/merchant/terminals/${terminal.id}`}
                                    >
                                        <i className="ki-duotone ki-eye fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        View Details
                                    </Link>
                                </li>
                            )}
                            
                            {/* Edit */}
                            {canEdit && (
                                <li>
                                    <Link 
                                        className="dropdown-item" 
                                        to={`/merchant/terminals/${terminal.id}/edit`}
                                    >
                                        <i className="ki-duotone ki-pencil fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Edit Terminal
                                    </Link>
                                </li>
                            )}
                            
                            <li><hr className="dropdown-divider" /></li>
                            
                            {/* Activate/Deactivate */}
                            {canEdit && (
                                isActive ? (
                                    <li>
                                        <button 
                                            className="dropdown-item text-warning" 
                                            onClick={() => handleStatusChange(false)}
                                            disabled={updating}
                                        >
                                            <i className="ki-duotone ki-cross-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Deactivate
                                        </button>
                                    </li>
                                ) : (
                                    <li>
                                        <button 
                                            className="dropdown-item text-success" 
                                            onClick={() => handleStatusChange(true)}
                                            disabled={updating}
                                        >
                                            <i className="ki-duotone ki-check-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Activate
                                        </button>
                                    </li>
                                )
                            )}
                            
                            <li><hr className="dropdown-divider" /></li>
                            
                            {/* Delete */}
                            {canDelete && (
                                <li>
                                    <button 
                                        className="dropdown-item text-danger" 
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        Delete Terminal
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default TerminalTableRow;

