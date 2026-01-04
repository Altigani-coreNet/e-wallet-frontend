import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserGroup, deleteUserGroup, toggleUserGroupStatus } from '../../../services/userGroupsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const UserGroupView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [userGroup, setUserGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserGroup();
    }, [id]);

    useEffect(() => {
        if (userGroup) {
            setTitle(userGroup.name || 'User Group Details');
            setBreadcrumbs([
                { label: 'User Groups', path: '/merchant/user-groups' },
                { label: userGroup.name, path: `/merchant/user-groups/${id}`, active: true }
            ]);

            setActions(
                <div className="d-flex gap-2">
                    <Link
                        to={`/merchant/user-groups/${id}/edit`}
                        className="btn btn-sm btn-primary"
                    >
                        <i className="ki-duotone ki-notepad-edit fs-3 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Edit
                    </Link>
                    <button
                        className={`btn btn-sm ${userGroup.is_active ? 'btn-warning' : 'btn-success'}`}
                        onClick={handleToggleStatus}
                    >
                        <i className="ki-duotone ki-information-5 fs-3 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        {userGroup.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={handleDelete}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Delete
                    </button>
                </div>
            );
        }

        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [userGroup, id]);

    const fetchUserGroup = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getUserGroup(id);

            if (response.success) {
                const userGroupData = response.data?.data || response.data?.user_group || response.data;
                setUserGroup(userGroupData);
            } else {
                setError(response.error || 'Failed to fetch user group');
            }
        } catch (err) {
            console.error('Error fetching user group:', err);
            setError('An unexpected error occurred while fetching the user group');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user group?')) {
            return;
        }

        try {
            const response = await deleteUserGroup(id);

            if (response.success) {
                toast.success('User group deleted successfully');
                navigate('/merchant/user-groups');
            } else {
                toast.error(response.error || 'Failed to delete user group');
            }
        } catch (err) {
            console.error('Error deleting user group:', err);
            toast.error('An unexpected error occurred');
        }
    };

    const handleToggleStatus = async () => {
        try {
            const response = await toggleUserGroupStatus(id);

            if (response.success) {
                toast.success(response.data?.message || 'Status updated successfully');
                fetchUserGroup();
            } else {
                toast.error(response.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error toggling status:', err);
            toast.error('An unexpected error occurred');
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <ErrorAlert error={error} />
                </div>
            </div>
        );
    }

    if (!userGroup) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body">
                            <div className="text-center py-10">
                                <p>User group not found</p>
                                <Link to="/merchant/user-groups" className="btn btn-primary">
                                    Back to User Groups
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h2>User Group Details</h2>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Group Name</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">{userGroup.name}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Group ID</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">{userGroup.group_id}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Branch</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {userGroup.branch?.name || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Status</label>
                            <div className="col-lg-8">
                                <span className={`badge ${userGroup.is_active ? 'badge-light-success' : 'badge-light-warning'}`}>
                                    {userGroup.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Description</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {userGroup.description || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Number of Users</label>
                            <div className="col-lg-8">
                                <span className="badge badge-light-primary badge-lg">
                                    {userGroup.users_count || (userGroup.users?.length || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Users List */}
                        {userGroup.users && userGroup.users.length > 0 && (
                            <>
                                <div className="separator mb-7"></div>
                                <div className="mb-7">
                                    <label className="fw-bold text-muted mb-4 d-block">Assigned Users</label>
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                            <thead>
                                                <tr className="fw-bolder text-muted">
                                                    <th className="min-w-150px">Name</th>
                                                    <th className="min-w-150px">Email</th>
                                                    <th className="min-w-100px">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userGroup.users.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>{user.name || 'N/A'}</td>
                                                        <td>{user.email || 'N/A'}</td>
                                                        <td>{user.phone || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="separator mb-7"></div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Created At</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {new Date(userGroup.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="row">
                            <label className="col-lg-4 fw-bold text-muted">Last Updated</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {new Date(userGroup.updated_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer d-flex justify-content-end">
                        <Link to="/merchant/user-groups" className="btn btn-light me-2">
                            Back to List
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGroupView;

