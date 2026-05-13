import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAdminTerminalGroup, deleteAdminTerminalGroup, toggleTerminalGroupStatus, removeTerminalFromGroup } from '../../../services/adminTerminalGroupsService';

const AdminTerminalGroupView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    // Fetch terminal group data
    const { data: groupResponse, isLoading, error, refetch } = useAdminTerminalGroup(id);
    const terminalGroup = groupResponse?.data;

    useEffect(() => {
        setTitle(t('admin.terminalGroupsUI.view.pageTitle'));
        
        setBreadcrumbs([
            { label: t('admin.terminalGroupsUI.pages.breadcrumbDashboard'), path: '/admin/dashboard' },
            { label: t('admin.terminalGroupsUI.pages.breadcrumbList'), path: '/admin/terminal-groups' },
            { label: t('admin.terminalGroupsUI.view.breadcrumbDetail'), path: `/admin/terminal-groups/${id}`, active: true }
        ]);
        
        setActions(
            <div className="d-flex justify-content-end" data-kt-roles-table-toolbar="base">
                <Link 
                    to={`/admin/terminal-groups/${id}/edit`} 
                    className="btn btn-primary btn-sm me-3"
                >
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalGroupsUI.view.edit')}
                </Link>
                
                <button 
                    type="button"
                    className={`btn btn-${terminalGroup?.is_active ? 'success' : 'secondary'} btn-sm me-3`}
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus || isLoading}
                >
                    <i className={`ki-duotone ${terminalGroup?.is_active ? 'ki-check' : 'ki-cross'} fs-2`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {isTogglingStatus ? t('admin.terminalGroupsUI.view.processing') : (terminalGroup?.is_active ? t('admin.terminalGroupsUI.view.deactivate') : t('admin.terminalGroupsUI.view.activate'))}
                </button>
                
                <button 
                    className="btn btn-danger btn-sm me-3"
                    onClick={handleDelete}
                    disabled={isLoading}
                >
                    <i className="ki-duotone ki-trash fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalGroupsUI.view.deleteGroup')}
                </button>
                
                <Link 
                    to="/admin/terminal-groups" 
                    className="btn btn-sm btn-light-danger"
                >
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalGroupsUI.view.back')}
                </Link>
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [id, terminalGroup, isLoading, isTogglingStatus, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    const handleToggleStatus = async () => {
        if (!terminalGroup) return;

        const result = await Swal.fire({
            title: t('admin.terminalGroupsUI.view.toggleTitle'),
            text: terminalGroup.is_active ? t('admin.terminalGroupsUI.view.toggleTextDeactivate') : t('admin.terminalGroupsUI.view.toggleTextActivate'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: terminalGroup.is_active ? '#f1416c' : '#50cd89',
            cancelButtonColor: '#7e8299',
            confirmButtonText: terminalGroup.is_active ? t('admin.terminalGroupsUI.view.yesDeactivate') : t('admin.terminalGroupsUI.view.yesActivate'),
            cancelButtonText: t('admin.terminalGroupsUI.view.cancel')
        });

        if (!result.isConfirmed) return;

        setIsTogglingStatus(true);
        const response = await toggleTerminalGroupStatus(id);
        setIsTogglingStatus(false);
        
        if (response.success) {
            toast.success(response.message);
            refetch(); // Refresh the data
        } else {
            toast.error(response.error);
        }
    };

    const handleDelete = async () => {
        if (!terminalGroup) return;

        const result = await Swal.fire({
            title: t('admin.terminalGroupsUI.view.deleteTitle'),
            text: t('admin.terminalGroupsUI.view.deleteText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.terminalGroupsUI.view.yesDelete'),
            cancelButtonText: t('admin.terminalGroupsUI.view.cancel')
        });

        if (!result.isConfirmed) return;

        const response = await deleteAdminTerminalGroup(id);
        
        if (response.success) {
            toast.success(response.message);
            navigate('/admin/terminal-groups');
        } else {
            toast.error(response.error);
        }
    };

    const handleRemoveTerminal = async (terminalId, terminalName) => {
        const result = await Swal.fire({
            title: t('admin.terminalGroupsUI.view.removeTerminalTitle'),
            text: t('admin.terminalGroupsUI.view.removeTerminalText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.terminalGroupsUI.view.yesRemove'),
            cancelButtonText: t('admin.terminalGroupsUI.view.cancel')
        });

        if (!result.isConfirmed) return;

        const response = await removeTerminalFromGroup(id, terminalId);
        
        if (response.success) {
            toast.success(response.message);
            refetch(); // Refresh the data
        } else {
            toast.error(response.error);
        }
    };

    // Skeleton Loading
    if (isLoading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    {/* Terminal Group Information Card Skeleton */}
                    <div className="card mb-5 mb-xl-8">
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-6" style={{ height: '28px' }}></span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-body pt-0">
                            <div className="row">
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <div key={item} className="col-md-6 mb-4">
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-4 mb-2" style={{ height: '16px' }}></span>
                                            <span className="placeholder col-8" style={{ height: '20px' }}></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Terminals Table Card Skeleton */}
                    <div className="card">
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-6" style={{ height: '24px' }}></span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-body pt-0">
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                            {[
                                                'colId',
                                                'colName',
                                                'colTerminalId',
                                                'colModel',
                                                'colManufacturer',
                                                'colStatus',
                                                'colActions'
                                            ].map((colKey, idx) => (
                                                <th key={colKey} className={idx === 6 ? 'text-end' : ''}>
                                                    <div className="placeholder-glow">
                                                        <span className="placeholder col-8" style={{ height: '16px' }}></span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                        {[1, 2, 3].map((row) => (
                                            <tr key={row}>
                                                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                                                    <td key={col}>
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-10" style={{ height: '16px' }}></span>
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !terminalGroup) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <i className="ki-duotone ki-information-5 fs-5x text-danger mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <p className="text-danger fs-4">{t('admin.terminalGroupsUI.view.notFound')}</p>
                    <Link to="/admin/terminal-groups" className="btn btn-primary mt-3">
                        {t('admin.terminalGroupsUI.view.backToList')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                {/* Terminal Group Information Card */}
                <div className="card mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h2 className="fw-bold">{t('admin.terminalGroupsUI.view.cardTitle')}</h2>
                        </div>
                    </div>
                    
                    <div className="card-body pt-0">
                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.groupName')}</label>
                                <p className="form-control-plaintext">{terminalGroup.name}</p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.groupId')}</label>
                                <p className="form-control-plaintext">
                                    <span className="badge badge-primary fs-6">{terminalGroup.group_id}</span>
                                </p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.merchant')}</label>
                                <p className="form-control-plaintext">{terminalGroup.merchant_id || t('admin.common.na')}</p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.status')}</label>
                                <p className="form-control-plaintext">
                                    <span className={`badge badge-${terminalGroup.is_active ? 'success' : 'danger'} fs-6`}>
                                        {terminalGroup.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                    </span>
                                </p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.createdDate')}</label>
                                <p className="form-control-plaintext">
                                    {terminalGroup.created_at ? new Date(terminalGroup.created_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : t('admin.common.na')}
                                </p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.updatedDate')}</label>
                                <p className="form-control-plaintext">
                                    {terminalGroup.updated_at ? new Date(terminalGroup.updated_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : t('admin.common.na')}
                                </p>
                            </div>
                            
                            {terminalGroup.description && (
                                <div className="col-12 mb-4">
                                    <label className="form-label fw-bold text-muted">{t('admin.terminalGroupsUI.view.description')}</label>
                                    <p className="form-control-plaintext">{terminalGroup.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Terminals Table Card */}
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h3 className="fw-bold">{t('admin.terminalGroupsUI.view.terminalsCardTitle')}</h3>
                        </div>
                        <div className="card-toolbar">
                            <div className="d-flex justify-content-end">
                                <span className="badge badge-light-primary fs-7">
                                    {t('admin.terminalGroupsUI.view.total', { count: terminalGroup.terminals?.length || 0 })}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card-body pt-0">
                        {terminalGroup.terminals && terminalGroup.terminals.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5" id="terminals-table">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                            <th className="text-dark">{t('admin.terminalGroupsUI.view.colId')}</th>
                                            <th className="min-w-125px text-dark">{t('admin.terminalGroupsUI.view.colName')}</th>
                                            <th className="min-w-125px text-dark">{t('admin.terminalGroupsUI.view.colTerminalId')}</th>
                                            <th className="min-w-125px text-dark">{t('admin.terminalGroupsUI.view.colModel')}</th>
                                            <th className="min-w-125px text-dark">{t('admin.terminalGroupsUI.view.colManufacturer')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsUI.view.colStatus')}</th>
                                            <th className="text-end min-w-125px text-dark">{t('admin.terminalGroupsUI.view.colActions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                        {terminalGroup.terminals.map((terminal) => (
                                            <tr key={terminal.id}>
                                                <td>{terminal.id}</td>
                                                <td>{terminal.name}</td>
                                                <td>
                                                    <span className="badge badge-light-info fs-7">{terminal.terminal_id}</span>
                                                </td>
                                                <td>{terminal.model || t('admin.common.na')}</td>
                                                <td>{terminal.manufacturer || t('admin.common.na')}</td>
                                                <td>
                                                    <span className={`badge badge-light-${terminal.is_active ? 'success' : 'danger'} fs-7`}>
                                                        {terminal.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <Link 
                                                        to={`/admin/terminals/${terminal.id}`} 
                                                        className="btn btn-sm btn-light-primary me-2"
                                                    >
                                                        {t('admin.terminalGroupsUI.view.viewTerminal')}
                                                    </Link>
                                                    <button 
                                                        type="button"
                                                        className="btn btn-sm btn-light-danger"
                                                        onClick={() => handleRemoveTerminal(terminal.id, terminal.name)}
                                                        title={t('admin.terminalGroupsUI.view.removeFromGroup')}
                                                    >
                                                        <i className="ki-duotone ki-cross fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {t('admin.terminalGroupsUI.view.unsignDevice')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="symbol symbol-100px symbol-circle mb-5">
                                    <div className="symbol-label bg-light-warning">
                                        <i className="ki-duotone ki-warning fs-2x text-warning">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </div>
                                </div>
                                <h3 className="text-gray-600 mb-2">{t('admin.terminalGroupsUI.view.noTerminalsTitle')}</h3>
                                <p className="text-muted fs-6">{t('admin.terminalGroupsUI.view.noTerminalsHint')}</p>
                                <Link 
                                    to={`/admin/terminal-groups/${id}/edit`} 
                                    className="btn btn-primary"
                                >
                                    <i className="ki-duotone ki-plus fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.terminalGroupsUI.view.assignTerminals')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTerminalGroupView;
