import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAdminTerminalGroup, deleteAdminTerminalGroup, toggleTerminalGroupStatus, removeTerminalFromGroup } from '../../../services/adminTerminalGroupsService';

const AdminTerminalGroupView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    // Fetch terminal group data
    const { data: groupResponse, isLoading, error, refetch } = useAdminTerminalGroup(id);
    const terminalGroup = groupResponse?.data;

    useEffect(() => {
        setTitle('Terminal Group Details');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminal Groups', path: '/admin/terminal-groups' },
            { label: 'Terminal Group Details', path: `/admin/terminal-groups/${id}`, active: true }
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
                    Edit
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
                    {isTogglingStatus ? 'Processing...' : (terminalGroup?.is_active ? 'Deactivate' : 'Activate')}
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
                    Delete Group
                </button>
                
                <Link 
                    to="/admin/terminal-groups" 
                    className="btn btn-sm btn-light-danger"
                >
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [id, terminalGroup, isLoading, isTogglingStatus, setTitle, setBreadcrumbs, setActions]);

    const handleToggleStatus = async () => {
        if (!terminalGroup) return;

        const action = terminalGroup.is_active ? 'deactivate' : 'activate';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to ${action} this terminal group.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: terminalGroup.is_active ? '#f1416c' : '#50cd89',
            cancelButtonColor: '#7e8299',
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: 'Cancel'
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
            title: 'Are you sure?',
            text: `You want to delete this terminal group?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
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
            title: 'Are you sure?',
            text: `You want to remove this terminal from the group?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'Cancel'
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
                                            {['ID', 'Name', 'Terminal ID', 'Model', 'Manufacturer', 'Status', 'Actions'].map((header, idx) => (
                                                <th key={idx} className={idx === 6 ? 'text-end' : ''}>
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
                    <p className="text-danger fs-4">Terminal group not found</p>
                    <Link to="/admin/terminal-groups" className="btn btn-primary mt-3">
                        Back to Terminal Groups
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
                            <h2 className="fw-bold">Terminal Group Details</h2>
                        </div>
                    </div>
                    
                    <div className="card-body pt-0">
                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">Group Name</label>
                                <p className="form-control-plaintext">{terminalGroup.name}</p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">Group ID</label>
                                <p className="form-control-plaintext">
                                    <span className="badge badge-primary fs-6">{terminalGroup.group_id}</span>
                                </p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">Merchant</label>
                                <p className="form-control-plaintext">{terminalGroup.merchant_id || 'N/A'}</p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">Status</label>
                                <p className="form-control-plaintext">
                                    <span className={`badge badge-${terminalGroup.is_active ? 'success' : 'danger'} fs-6`}>
                                        {terminalGroup.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">Created Date</label>
                                <p className="form-control-plaintext">
                                    {terminalGroup.created_at ? new Date(terminalGroup.created_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'N/A'}
                                </p>
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label fw-bold text-muted">Updated Date</label>
                                <p className="form-control-plaintext">
                                    {terminalGroup.updated_at ? new Date(terminalGroup.updated_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'N/A'}
                                </p>
                            </div>
                            
                            {terminalGroup.description && (
                                <div className="col-12 mb-4">
                                    <label className="form-label fw-bold text-muted">Description</label>
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
                            <h3 className="fw-bold">Terminals in this Group</h3>
                        </div>
                        <div className="card-toolbar">
                            <div className="d-flex justify-content-end">
                                <span className="badge badge-light-primary fs-7">
                                    {terminalGroup.terminals?.length || 0} Total
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
                                            <th className="text-dark">ID</th>
                                            <th className="min-w-125px text-dark">Name</th>
                                            <th className="min-w-125px text-dark">Terminal ID</th>
                                            <th className="min-w-125px text-dark">Model</th>
                                            <th className="min-w-125px text-dark">Manufacturer</th>
                                            <th className="text-dark">Status</th>
                                            <th className="text-end min-w-125px text-dark">Actions</th>
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
                                                <td>{terminal.model || 'N/A'}</td>
                                                <td>{terminal.manufacturer || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge badge-light-${terminal.is_active ? 'success' : 'danger'} fs-7`}>
                                                        {terminal.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <Link 
                                                        to={`/admin/terminals/${terminal.id}`} 
                                                        className="btn btn-sm btn-light-primary me-2"
                                                    >
                                                        View
                                                    </Link>
                                                    <button 
                                                        type="button"
                                                        className="btn btn-sm btn-light-danger"
                                                        onClick={() => handleRemoveTerminal(terminal.id, terminal.name)}
                                                        title="Remove from Group"
                                                    >
                                                        <i className="ki-duotone ki-cross fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        Unsign The Device
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
                                <h3 className="text-gray-600 mb-2">No Terminals Assigned</h3>
                                <p className="text-muted fs-6">This terminal group doesn't have any terminals assigned to it yet.</p>
                                <Link 
                                    to={`/admin/terminal-groups/${id}/edit`} 
                                    className="btn btn-primary"
                                >
                                    <i className="ki-duotone ki-plus fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Assign Terminals
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
