import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { deleteBranch, updateBranch } from '../../../services/branchesService';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';

const BranchTableRow = ({ branch, isSelected, onSelect, onRefresh }) => {
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const canView = useCan('branches.view');
    const canEdit = useCan('branches.edit');
    const canDelete = useCan('branches.delete');

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${branch.name}". This action cannot be undone!`,
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
            const response = await deleteBranch(branch.id);
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['branches'] });
                queryClient.invalidateQueries({ queryKey: ['branch-details', branch.id] });
                
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Branch deleted successfully!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: response.error || 'Failed to delete branch',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error deleting branch:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while deleting the branch',
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
            text: `Are you sure you want to ${statusText} "${branch.name}"?`,
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
            const response = await updateBranch(branch.id, {
                name: branch.name,
                address: branch.address,
                is_active: newStatus
            });

            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['branches'] });
                queryClient.invalidateQueries({ queryKey: ['branch-details', branch.id] });
                
                Swal.fire({
                    title: 'Success!',
                    text: `Branch ${statusText}d successfully!`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: response.error || 'Failed to update branch status',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error updating branch:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while updating the branch',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { class: 'badge-warning', text: 'PENDING' },
            'approved': { class: 'badge-success', text: 'APPROVED' },
            'rejected': { class: 'badge-danger', text: 'REJECTED' },
            'suspended': { class: 'badge-secondary', text: 'SUSPENDED' },
            'viewed': { class: 'badge-info', text: 'VIEWED' }
        };
        const config = statusConfig[status] || { class: 'badge-secondary', text: status?.toUpperCase() || 'N/A' };
        return `badge ${config.class}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    // Check if branch is pending
    const isPending = branch.status === 'pending';

    return (
        <tr className={isPending ? 'bg-light-secondary opacity-75' : ''}>
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
            <td>
                <span className="text-gray-800 fw-bold">#{branch.sequential_id || branch.id}</span>
            </td>
            <td>
                <span className="text-dark fw-bolder d-block fs-6">{branch.name}</span>
            </td>
            <td>
                <span className="text-gray-600">{branch.address || 'N/A'}</span>
            </td>
            <td>
                <div className="d-flex flex-column">
                    <span className={getStatusBadge(branch.status)}>
                        {branch.status?.toUpperCase() || 'N/A'}
                    </span>
                    <span className={`badge ${branch.is_active ? 'badge-light-success' : 'badge-light-secondary'} mt-1`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </td>
            <td>
                <span className="text-gray-600" title={new Date(branch.created_at).toLocaleString()}>
                    {formatDate(branch.created_at)}
                </span>
            </td>
            <td className="text-end">
                <div className="d-flex justify-content-end">
                    {isPending ? (
                        /* Disabled dropdown for pending branches */
                        <button
                            className="btn btn-sm btn-light btn-active-light-primary"
                            disabled
                            style={{ cursor: 'not-allowed', opacity: 0.5 }}
                        >
                            Actions 
                            <i className="ki-duotone ki-down fs-5 ms-1"></i>
                        </button>
                    ) : (
                        /* Actions dropdown for approved/other branches */
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
                                            to={`/merchant/branches/${branch.id}`}
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
                                            to={`/merchant/branches/${branch.id}/edit`}
                                        >
                                            <i className="ki-duotone ki-pencil fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Edit Branch
                                        </Link>
                                    </li>
                                )}
                                
                                <li><hr className="dropdown-divider" /></li>
                                
                                {/* Activate/Deactivate */}
                                {canEdit && (
                                    branch.is_active ? (
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
                                            Delete Branch
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default BranchTableRow;


