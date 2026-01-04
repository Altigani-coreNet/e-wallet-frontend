import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTerminalDetails, deleteTerminal } from '../../../services/terminalsService';
import { useQueryClient } from '@tanstack/react-query';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Swal from 'sweetalert2';

const TerminalView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const { 
        data: terminalData, 
        isLoading: loading, 
        error: fetchError 
    } = useTerminalDetails(id);

    const terminal = terminalData?.data || terminalData;

    const handleDelete = useCallback(async () => {
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

        if (result.isConfirmed) {
            try {
                const response = await deleteTerminal(id);
                if (response.success) {
                    queryClient.invalidateQueries({ queryKey: ['terminals'] });
                    
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Terminal has been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    navigate('/merchant/terminals');
                } else {
                    Swal.fire('Error!', response.error || 'Failed to delete terminal.', 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [id, terminal?.name, navigate, queryClient]);

    useEffect(() => {
        setTitle('Terminal Details');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Terminals', path: '/merchant/terminals' },
            { label: terminal?.name || 'Terminal Details', path: `/merchant/terminals/${id}`, active: true }
        ]);
        
        setActions(
            <>
                <button
                    className="btn btn-sm btn-light btn-active-light-primary me-2"
                    onClick={() => navigate('/merchant/terminals')}
                >
                    <i className="ki-duotone ki-arrow-left fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to List
                </button>
                <Link
                    to={`/merchant/terminals/${id}/edit`}
                    className="btn btn-sm btn-primary me-2"
                >
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit
                </Link>
                <button
                    className="btn btn-sm btn-danger"
                    onClick={handleDelete}
                >
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    Delete
                </button>
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate, id, terminal?.name, handleDelete]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (fetchError || !terminal) {
        return (
            <div className="alert alert-danger">
                <strong>Error:</strong> {fetchError?.message || 'Terminal not found'}
                <div className="mt-3">
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/terminals')}>
                        Back to Terminals
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Terminal Information</h3>
            </div>
            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Terminal ID</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.terminal_id || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Branch</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.branch?.name || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Model</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.model || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Manufacturer</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.manufacturer || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Serial Number</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.serial_no || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">SDK ID</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.sdk_id || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">SDK Version</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.sdk_version || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Android OS</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">{terminal.android_os || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Add Type</label>
                    <div className="col-lg-8">
                        <span className="badge badge-light-primary">{terminal.add_type || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Status</label>
                    <div className="col-lg-8">
                        {terminal.is_active ? (
                            <span className="badge badge-light-success">Active</span>
                        ) : (
                            <span className="badge badge-light-danger">Inactive</span>
                        )}
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">
                            {terminal.created_at ? new Date(terminal.created_at).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800 fs-6">
                            {terminal.updated_at ? new Date(terminal.updated_at).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="card-footer d-flex justify-content-end">
                <button 
                    onClick={() => navigate('/merchant/terminals')} 
                    className="btn btn-light"
                >
                    Back to List
                </button>
            </div>
        </div>
    );
};

export default TerminalView;
