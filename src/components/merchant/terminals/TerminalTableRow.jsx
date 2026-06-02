import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { deleteTerminal, updateTerminal } from '../../../services/terminalsService';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';

const TerminalTableRow = ({ terminal, branch, isSelected, onSelect, onRefresh }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const canView = useCan('terminals.view');
    const canEdit = useCan('terminals.edit');
    const canDelete = useCan('terminals.delete');

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.terminals.deleteOneConfirm', { name: terminal.name }),
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
            const response = await deleteTerminal(terminal.id);
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['terminals'] });
                queryClient.invalidateQueries({ queryKey: ['terminal-details', terminal.id] });
                
                Swal.fire({
                    title: t('merchant.common.deleted'),
                    text: t('merchant.terminals.deletedOne'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: t('merchant.common.error'),
                    text: response.error || t('merchant.terminals.deleteOneFailed'),
                    icon: 'error',
                    confirmButtonText: t('merchant.common.ok')
                });
            }
        } catch (error) {
            console.error('Error deleting terminal:', error);
            Swal.fire({
                title: t('merchant.common.error'),
                text: t('merchant.terminals.deleteError'),
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
                    title: t('merchant.common.success'),
                    text: t('merchant.terminalsIndex.statusUpdateSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                if (onRefresh) onRefresh();
            } else {
                Swal.fire({
                    title: t('merchant.common.error'),
                    text: response.error || t('merchant.terminalsIndex.statusUpdateFailed'),
                    icon: 'error',
                    confirmButtonText: t('merchant.common.ok')
                });
            }
        } catch (error) {
            console.error('Error updating terminal:', error);
            Swal.fire({
                title: t('merchant.common.error'),
                text: t('merchant.terminals.deleteError'),
                icon: 'error',
                confirmButtonText: t('merchant.common.ok')
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
                <span className="badge badge-light-info">{terminal.terminal_id || t('merchant.common.na')}</span>
            </td>
            <td>{branch ? branch.name : (terminal.branch_id ? t('merchant.terminalsIndex.loadingBranch') : t('merchant.common.na'))}</td>
            <td>{terminal.model || t('merchant.common.na')}</td>
            <td>{terminal.manufacturer || t('merchant.common.na')}</td>
            <td>
                {(terminal.is_active === 'active' || terminal.is_active === true || terminal.is_active === 1 || terminal.is_active === '1') ? (
                    <span className="badge badge-light-success">{t('merchant.common.active')}</span>
                ) : (
                    <span className="badge badge-light-danger">{t('merchant.common.inactive')}</span>
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
                            {t('merchant.terminalsIndex.colActions')}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
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
                                        {t('merchant.common.viewDetails')}
                                    </Link>
                                </li>
                            )}
                            
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
                                        {t('merchant.breadcrumbs.editTerminal')}
                                    </Link>
                                </li>
                            )}
                            
                            <li><hr className="dropdown-divider" /></li>
                            
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
                                        {t('merchant.terminals.delete')}
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

