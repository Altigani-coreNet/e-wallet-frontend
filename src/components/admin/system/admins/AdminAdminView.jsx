import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getAdmin, deleteAdmin, changeAdminStatus } from '../../../../services/adminAdminsService';

const AdminAdminView = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusChanging, setStatusChanging] = useState(false);

    useEffect(() => {
        setTitle('Admin Details');
        fetchAdmin();
        return () => setActions(null);
    }, [id, setTitle, setActions]);

    useEffect(() => {
        if (!admin) return;

        setActions(
            <div className="d-flex gap-2">
                <button
                    type="button"
                    className={`btn btn-sm ${admin.status === 'active' ? 'btn-light-danger' : 'btn-light-success'}`}
                    onClick={handleStatusToggle}
                    disabled={statusChanging}
                >
                    <i className="ki-duotone ki-toggle-on fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">
                        {statusChanging
                            ? 'Changing...'
                            : admin.status === 'active'
                                ? 'Deactivate'
                                : 'Activate'}
                    </span>
                </button>
                <Link to={`/admin/system/admins/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Edit</span>
                </Link>
                <button onClick={handleDelete} className="btn btn-sm btn-danger">
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Delete</span>
                </button>
            </div>
        );
    }, [admin, statusChanging, id, setActions]);

    const fetchAdmin = async () => {
        setLoading(true);
        try {
            const response = await getAdmin(id);
            if (response.success) {
                setAdmin(response.data);
            } else {
                toast.error(response.error || 'Failed to fetch admin');
            }
        } catch (error) {
            console.error('Error fetching admin:', error);
            toast.error('Failed to fetch admin');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const targetAdminId = admin?.id || id;
        if (!targetAdminId) {
            toast.error('Admin ID is missing');
            return;
        }
        setStatusChanging(true);
        try {
            const response = await changeAdminStatus(targetAdminId);
            if (response.success) {
                const updated = response.data;
                setAdmin(updated);
                toast.success('Status changed successfully');
            } else {
                toast.error(response.error || 'Failed to change status');
            }
        } catch (error) {
            console.error('Error changing status:', error);
            toast.error('Failed to change status');
        } finally {
            setStatusChanging(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this admin?')) {
            return;
        }

        try {
            const response = await deleteAdmin(id);
            if (response.success) {
                toast.success('Admin deleted successfully');
                navigate('/admin/system/admins');
            } else {
                toast.error(response.error || 'Failed to delete admin');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            toast.error('Failed to delete admin');
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="skeleton w-150px h-20px bg-light rounded" />
                    </div>
                </div>
                <div className="card-body">
                    {[1, 2, 3, 4, 5].map((row) => (
                        <div className="row mb-7" key={row}>
                            <div className="col-lg-4">
                                <div className="skeleton w-100px h-16px bg-light rounded" />
                            </div>
                            <div className="col-lg-8">
                                <div className="skeleton w-250px h-16px bg-light rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!admin) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>Admin not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Admin Information</h3>
            </div>

            <div className="card-body">
                {admin.profile_image && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-semibold text-muted">Profile Image</label>
                        <div className="col-lg-8">
                            <img src={admin.profile_image} alt={admin.name} className="img-thumbnail" style={{maxWidth: '200px'}} />
                        </div>
                    </div>
                )}

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">{admin.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Email</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{admin.email}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Phone</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{admin.phone || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Status</label>
                    <div className="col-lg-8">
                        <button
                            type="button"
                            onClick={handleStatusToggle}
                            disabled={statusChanging}
                            className={`badge border-0 cursor-pointer badge-light-${admin.status === 'active' ? 'success' : 'danger'}`}
                        >
                            {statusChanging
                                ? 'Changing...'
                                : admin.status === 'active'
                                    ? 'Active (click to deactivate)'
                                    : 'Inactive (click to activate)'}
                        </button>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Roles</label>
                    <div className="col-lg-8">
                        <div className="d-flex flex-wrap gap-2">
                            {admin.roles && Array.isArray(admin.roles) && admin.roles.length > 0 ? (
                                admin.roles.map((role, index) => (
                                    <span key={index} className="badge badge-light-primary">
                                        {typeof role === 'object' ? (role.name || role) : role}
                                    </span>
                                ))
                            ) : (
                                <span className="text-muted">No roles assigned</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Custom Region</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${admin.custom_region ? 'success' : 'secondary'}`}>
                            {admin.custom_region ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                {admin.custom_region && admin.regions && Array.isArray(admin.regions) && admin.regions.length > 0 && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-semibold text-muted">Regions</label>
                        <div className="col-lg-8">
                            <div className="d-flex flex-wrap gap-2">
                                {admin.regions.map((region, index) => (
                                    <span key={index} className="badge badge-light">
                                        {typeof region === 'object'
                                            ? (typeof region.name === 'object' ? (region.name.en || region.name.ar || '') : (region.name || region.code || 'N/A'))
                                            : region}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(admin.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAdminView;

