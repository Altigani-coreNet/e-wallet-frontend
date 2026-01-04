import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBranchDetails } from '../../../services/branchesService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';

const BranchView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const { 
        data: branchData, 
        isLoading: loading, 
        error: fetchError 
    } = useBranchDetails(id);

    const branch = branchData?.data || branchData;

    useEffect(() => {
        setTitle('Branch Details');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Branches', path: '/merchant/branches' },
            { label: branch?.name || 'Branch Details', path: `/merchant/branches/${id}`, active: true }
        ]);
        
        setActions(
            <>
                <button
                    className="btn btn-sm btn-light btn-active-light-primary me-2"
                    onClick={() => navigate('/merchant/branches')}
                >
                    <i className="ki-duotone ki-arrow-left fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to List
                </button>
                <Link
                    to={`/merchant/branches/${id}/edit`}
                    className="btn btn-sm btn-primary"
                >
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit Branch
                </Link>
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate, id, branch?.name]);

    const getStatusBadge = (status) => {
        const statusColors = {
            'pending': 'badge-warning',
            'approved': 'badge-success',
            'rejected': 'badge-danger',
            'suspended': 'badge-secondary',
            'viewed': 'badge-info'
        };
        return statusColors[status] || 'badge-secondary';
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (fetchError || !branch) {
        return (
            <div className="alert alert-danger">
                <strong>Error:</strong> {fetchError?.message || 'Branch not found'}
                <div className="mt-3">
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/branches')}>
                        Back to Branches
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Branch Information</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Branch Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{branch.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Address</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">
                            {branch.address || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Status</label>
                    <div className="col-lg-8">
                        <span className={`badge ${getStatusBadge(branch.status)}`}>
                            {branch.status ? branch.status.toUpperCase() : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Active Status</label>
                    <div className="col-lg-8">
                        <span className={`badge ${branch.is_active ? 'badge-success' : 'badge-secondary'}`}>
                            {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">
                            {branch.created_at ? new Date(branch.created_at).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">
                            {branch.updated_at ? new Date(branch.updated_at).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="card-footer d-flex justify-content-end">
                <button 
                    onClick={() => navigate('/merchant/branches')} 
                    className="btn btn-light"
                >
                    Back to List
                </button>
            </div>
        </div>
    );
};

export default BranchView;
