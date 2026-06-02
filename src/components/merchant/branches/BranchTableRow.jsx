import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { deleteBranch, updateBranch } from '../../../services/branchesService';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';

const BranchTableRow = ({ branch, isSelected, onSelect, onRefresh }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const canView = useCan('branches.view');
    const canEdit = useCan('branches.edit');
    const canDelete = useCan('branches.delete');

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.branchesIndex.deleteConfirm'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDelete'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            const response = await deleteBranch(branch.id);
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['branches'] });
                queryClient.invalidateQueries({ queryKey: ['branch-details', branch.id] });
                
                Swal.fire({
                    title: t('merchant.common.deleted'),
                    text: t('merchant.branchesIndex.deleteSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: t('merchant.common.error'),
                    text: response.error || t('merchant.branchesIndex.deleteFailed'),
                    icon: 'error',
                    confirmButtonText: t('merchant.common.ok')
                });
            }
        } catch (error) {
            console.error('Error deleting branch:', error);
            Swal.fire({
                title: t('merchant.common.error'),
                text: t('merchant.branches.deleteError'),
                icon: 'error',
                confirmButtonText: t('merchant.common.ok')
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: newStatus
                ? t('merchant.userGroupsIndex.activateConfirm')
                : t('merchant.userGroupsIndex.deactivateConfirm'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: newStatus
                ? t('merchant.users.table.activate')
                : t('merchant.users.table.deactivate'),
            cancelButtonText: t('merchant.common.cancel')
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
                    title: t('merchant.common.success'),
                    text: t('merchant.branchesIndex.statusUpdateSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: t('merchant.common.error'),
                    text: response.error || t('merchant.branchesIndex.statusUpdateFailed'),
                    icon: 'error',
                    confirmButtonText: t('merchant.common.ok')
                });
            }
        } catch (error) {
            console.error('Error updating branch:', error);
            Swal.fire({
                title: t('merchant.common.error'),
                text: t('merchant.branches.deleteError'),
                icon: 'error',
                confirmButtonText: t('merchant.common.ok')
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
        const config = statusConfig[status] || { class: 'badge-secondary', text: status?.toUpperCase() || t('merchant.common.na') };
        return `badge ${config.class}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('merchant.common.na');
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
                <span className="text-gray-600">{branch.address || t('merchant.common.na')}</span>
            </td>
            <td>
                <div className="d-flex flex-column">
                    <span className={getStatusBadge(branch.status)}>
                        {branch.status?.toUpperCase() || t('merchant.common.na')}
                    </span>
                    <span className={`badge ${branch.is_active ? 'badge-light-success' : 'badge-light-secondary'} mt-1`}>
                        {branch.is_active ? t('merchant.common.active') : t('merchant.common.inactive')}
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
                            {t('merchant.branchesIndex.actions')}
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
                                {t('merchant.branchesIndex.actions')}
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
                                            {t('merchant.common.viewDetails')}
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
                                            {t('merchant.breadcrumbs.editBranch')}
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
                                                {t('merchant.users.table.deactivate')}
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
                                                {t('merchant.users.table.activate')}
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
                                            {t('merchant.common.delete')}
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


