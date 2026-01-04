import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAdminTerminal, deleteAdminTerminal } from '../../../services/adminTerminalsService';

const AdminTerminalView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    // Fetch terminal data
    const { data: terminalResponse, isLoading, error } = useAdminTerminal(id);
    const terminal = terminalResponse?.data;

    useEffect(() => {
        setTitle(terminal ? `Terminal: ${terminal.name}` : 'Terminal Details');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminals', path: '/admin/terminals' },
            { label: terminal?.name || 'Details', path: `/admin/terminals/${id}`, active: true }
        ]);
        
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/terminals/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit
                </Link>
                <button 
                    className="btn btn-sm btn-danger"
                    onClick={handleDelete}
                >
                    <i className="ki-duotone ki-trash fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    Delete
                </button>
                <Link to="/admin/terminals" className="btn btn-sm btn-light-danger">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to List
                </Link>
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [id, terminal, setTitle, setBreadcrumbs, setActions]);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete terminal "${terminal?.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        const response = await deleteAdminTerminal(id);
        
        if (response.success) {
            toast.success(response.message);
            navigate('/admin/terminals');
        } else {
            toast.error(response.error);
        }
    };

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? 'Active' : 'Inactive';
        const statusClass = isActive ? 'badge-success' : 'badge-warning';
        
        return <span className={`badge ${statusClass}`}>{statusText}</span>;
    };

    const getTerminalStatusBadge = (terminalStatus) => {
        const statusMap = {
            'online': { text: 'Online', class: 'badge-success' },
            'offline': { text: 'Offline', class: 'badge-danger' },
            'testing': { text: 'Testing', class: 'badge-warning' },
            'maintenance': { text: 'Maintenance', class: 'badge-info' }
        };
        
        const status = statusMap[terminalStatus] || { text: 'Unknown', class: 'badge-secondary' };
        return <span className={`badge ${status.class}`}>{status.text}</span>;
    };

    const getAddTypeBadge = (addType) => {
        const isAuto = addType === 'auto';
        const text = isAuto ? 'Auto' : 'Static';
        const badgeClass = isAuto ? 'badge-success' : 'badge-warning';
        
        return <span className={`badge ${badgeClass}`}>{text}</span>;
    };

    if (isLoading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <span className="spinner-border text-primary"></span>
                    <p className="text-muted mt-3">Loading terminal...</p>
                </div>
            </div>
        );
    }

    if (error || !terminal) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <i className="ki-duotone ki-information-5 fs-5x text-danger mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <p className="text-danger fs-4">Terminal not found</p>
                    <Link to="/admin/terminals" className="btn btn-primary mt-3">
                        Back to Terminals
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Basic Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">Basic Information</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Terminal Name</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.name || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Terminal ID</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.terminal_id || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Device ID</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.device_id || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Status</label>
                        <div className="col-lg-8">
                            {getStatusBadge(terminal.is_active)}
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Terminal Status</label>
                        <div className="col-lg-8">
                            {getTerminalStatusBadge(terminal.terminal_status)}
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Add Type</label>
                        <div className="col-lg-8">
                            {getAddTypeBadge(terminal.add_type)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hardware Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">Hardware Information</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Brand</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.brand || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Model</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.model || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Manufacturer</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.manufacturer || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Serial Number</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.serial_no || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SDK Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">SDK Information</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">SDK ID</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.sdk_id || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">SDK Version</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.sdk_version || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Android OS</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.android_os || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Merchant & Branch Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">Assignment Information</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Merchant ID</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.merchant_id || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Branch ID</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.branch_id || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Country</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {(() => {
                                    const country = terminal.country;
                                    if (!country) return terminal.country_id || 'N/A';
                                    
                                    // Handle multilingual name object
                                    if (country.name && typeof country.name === 'object') {
                                        return country.name.en || country.name.ar || terminal.country_id || 'N/A';
                                    }
                                    
                                    return country.name || terminal.country_id || 'N/A';
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timestamps */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">Timestamps</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Created At</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.created_at ? new Date(terminal.created_at).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.updated_at ? new Date(terminal.updated_at).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminTerminalView;

