import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminBranchView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Branch Details');
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/branches/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit Branch
                </Link>
                <Link to="/admin/branches" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
            </div>
        );
        fetchBranchDetails();
        return () => setActions(null);
    }, [id, setTitle, setActions]);

    const fetchBranchDetails = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCH_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                setBranch(response.data.data.branch || response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load branch details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this branch?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.delete(ADMIN_ENDPOINTS.BRANCH_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch deleted successfully');
                navigate('/admin/branches');
            }
        } catch (error) {
            toast.error('Failed to delete branch');
            console.error(error);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this branch?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_APPROVE(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch approved successfully');
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error('Failed to approve branch');
            console.error(error);
        }
    };

    const handleReject = async () => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_REJECT(id), {
                rejection_reason: reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch rejected successfully');
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error('Failed to reject branch');
            console.error(error);
        }
    };

    const handleSuspend = async () => {
        const reason = window.prompt('Enter suspension reason:');
        if (!reason) return;

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_SUSPEND(id), {
                suspension_reason: reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch suspended successfully');
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error('Failed to suspend branch');
            console.error(error);
        }
    };

    const handleUnsuspend = async () => {
        if (!window.confirm('Are you sure you want to unsuspend this branch?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_UNSUSPEND(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch unsuspended successfully');
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error('Failed to unsuspend branch');
            console.error(error);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'badge-light-success';
            case 'pending': return 'badge-light-warning';
            case 'rejected': return 'badge-light-danger';
            case 'suspended': return 'badge-light-warning';
            default: return 'badge-light-secondary';
        }
    };

    const getCountryName = (country) => {
        if (!country) return 'N/A';
        return country.name?.en || country.name || country.text || 'N/A';
    };

    const getCityName = (city) => {
        if (!city) return 'N/A';
        return city.name?.en || city.name || city.text || 'N/A';
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <span className="spinner-border text-primary"></span>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p className="text-gray-600">Branch not found</p>
                    <Link to="/admin/branches" className="btn btn-primary">
                        Back to Branches
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Branch Details: {branch.name}</h3>
                        <div className="card-toolbar d-flex gap-2">
                            {/* Action Buttons */}
                            {branch.status === 'pending' && (
                                <>
                                    <button onClick={handleApprove} className="btn btn-sm btn-success">
                                        <i className="ki-duotone ki-check fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Approve
                                    </button>
                                    <button onClick={handleReject} className="btn btn-sm btn-danger">
                                        <i className="ki-duotone ki-cross fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Reject
                                    </button>
                                </>
                            )}
                            {branch.status !== 'suspended' && branch.status !== 'pending' && (
                                <button onClick={handleSuspend} className="btn btn-sm btn-warning">
                                    <i className="ki-duotone ki-lock fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Suspend
                                </button>
                            )}
                            {branch.status === 'suspended' && (
                                <button onClick={handleUnsuspend} className="btn btn-sm btn-success">
                                    <i className="ki-duotone ki-lock-2 fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Unsuspend
                                </button>
                            )}
                            <Link to={`/admin/branches/${id}/edit`} className="btn btn-sm btn-primary">
                                <i className="ki-duotone ki-pencil fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Edit
                            </Link>
                            <button onClick={handleDelete} className="btn btn-sm btn-danger">
                                <i className="ki-duotone ki-trash fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                    <span className="path4"></span>
                                    <span className="path5"></span>
                                </i>
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Branch Name</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{branch.name}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant</label>
                            <div className="col-lg-8">
                                {branch.merchant ? (
                                    <Link to={`/admin/merchants/${branch.merchant.id}`} className="text-primary text-hover-primary fw-semibold">
                                        {branch.merchant.business_name || branch.merchant.name}
                                    </Link>
                                ) : (
                                    <span className="text-gray-600">N/A</span>
                                )}
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Address</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{branch.address || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Country</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{getCountryName(branch.country)}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">City</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{getCityName(branch.city)}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Status</label>
                            <div className="col-lg-8">
                                <span className={`badge ${getStatusBadgeClass(branch.status)}`}>
                                    {branch.status ? branch.status.charAt(0).toUpperCase() + branch.status.slice(1) : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Active Status</label>
                            <div className="col-lg-8">
                                {branch.is_active ? (
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
                                    {new Date(branch.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">
                                    {new Date(branch.updated_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBranchView;


