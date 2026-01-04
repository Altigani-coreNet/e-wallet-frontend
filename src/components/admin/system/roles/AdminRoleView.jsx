import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getRole, deleteRole } from '../../../../services/adminRolesService';

const AdminRoleView = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Role Details');
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/roles/${id}/edit`} className="btn btn-sm btn-primary">
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
        fetchRole();
        return () => setActions(null);
    }, [id, setTitle, setActions]);

    const fetchRole = async () => {
        setLoading(true);
        try {
            const response = await getRole(id);
            if (response.success) {
                setRole(response.data.data.role);
                setPermissions(response.data.data.permissions || []);
            } else {
                toast.error(response.error || 'Failed to fetch role');
            }
        } catch (error) {
            console.error('Error fetching role:', error);
            toast.error('Failed to fetch role');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this role?')) {
            return;
        }

        try {
            const response = await deleteRole(id);
            if (response.success) {
                toast.success('Role deleted successfully');
                navigate('/admin/system/roles');
            } else {
                toast.error(response.error || 'Failed to delete role');
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('Failed to delete role');
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!role) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>Role not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Role Information</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Role Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">{role.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Permissions Count</label>
                    <div className="col-lg-8">
                        <span className="badge badge-light-success">{permissions.length} permissions</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(role.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Permissions</label>
                    <div className="col-lg-8">
                        <div className="d-flex flex-wrap gap-2">
                            {permissions.length > 0 ? (
                                permissions.map(permId => (
                                    <span key={permId} className="badge badge-light">
                                        Permission ID: {permId}
                                    </span>
                                ))
                            ) : (
                                <span className="text-muted">No permissions assigned</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRoleView;


