import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getTranslatedText } from '../../../utils/helpers';
import { useCan, USER_GROUP_EDIT_PERMISSIONS } from '../../../utils/permissions';
import UserGroupViewSkeleton from './UserGroupViewSkeleton';

const AdminUserGroupView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const canEditUserGroup = useCan(USER_GROUP_EDIT_PERMISSIONS);
    const [userGroup, setUserGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('User Group Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                {canEditUserGroup && (
                    <Link to={`/admin/user-groups/${id}/edit`} className="btn btn-sm btn-primary">
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Edit Group
                    </Link>
                )}
                <Link to="/admin/user-groups" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id, canEditUserGroup]);

    useEffect(() => {
        fetchUserGroup();
    }, [id]);

    const fetchUserGroup = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USER_GROUP_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success || response.data.status) {
                setUserGroup(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load user group');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm('Are you sure you want to activate this user group?')) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_ACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success('User group activated successfully');
                fetchUserGroup();
            }
        } catch (error) {
            toast.error('Failed to activate user group');
            console.error(error);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm('Are you sure you want to deactivate this user group?')) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_DEACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success('User group deactivated successfully');
                fetchUserGroup();
            }
        } catch (error) {
            toast.error('Failed to deactivate user group');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user group? This action cannot be undone.')) return;

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.USER_GROUPS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success('User group deleted successfully');
                navigate('/admin/user-groups');
            }
        } catch (error) {
            toast.error('Failed to delete user group');
            console.error(error);
        }
    };

    if (loading) {
        return <UserGroupViewSkeleton />;
    }

    if (!userGroup) {
        return (
            <div className="text-center py-10">
                <p className="text-muted">User group not found</p>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="row g-5 g-xl-8">
                    {/* Group Info Card */}
                    <div className="col-xl-8">
                        <div className="card mb-5 mb-xl-10">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bold m-0">Group Information</h3>
                                </div>
                            </div>

                            <div className="card-body border-top p-9">
                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Group Name</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bold fs-6 text-gray-800">{userGroup.name}</span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Group ID</label>
                                    <div className="col-lg-8">
                                        <span className="fw-semibold text-gray-800 fs-6">{userGroup.group_id}</span>
                                    </div>
                                </div>

                                {userGroup.description && (
                                    <div className="row mb-7">
                                        <label className="col-lg-4 fw-semibold text-muted">Description</label>
                                        <div className="col-lg-8">
                                            <span className="fw-bold fs-6 text-gray-800">{userGroup.description}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Status</label>
                                    <div className="col-lg-8">
                                        <span className={`badge badge-light-${userGroup.is_active ? 'success' : 'warning'} fw-bold`}>
                                            {userGroup.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Merchant</label>
                                    <div className="col-lg-8">
                                        {userGroup.merchant ? (
                                            <div>
                                                <span className="fw-bold fs-6 text-gray-800 d-block mb-1">
                                                    {getTranslatedText(userGroup.merchant.business_name) || getTranslatedText(userGroup.merchant.name)}
                                                </span>
                                                {userGroup.merchant.email && (
                                                    <div className="text-muted fs-7 mb-1">
                                                        <i className="ki-duotone ki-sms fs-5 me-1">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {userGroup.merchant.email}
                                                    </div>
                                                )}
                                                {userGroup.merchant.phone && (
                                                    <div className="text-muted fs-7 mb-1">
                                                        <i className="ki-duotone ki-phone fs-5 me-1">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {userGroup.merchant.phone}
                                                    </div>
                                                )}
                                                {userGroup.merchant.merchant_code && (
                                                    <div className="text-muted fs-7">
                                                        <span className="badge badge-light-info">Code: {userGroup.merchant.merchant_code}</span>
                                                    </div>
                                                )}
                                                {userGroup.merchant.country && (
                                                    <div className="mt-2 d-flex align-items-center">
                                                        {userGroup.merchant.country.code && (
                                                            <img 
                                                                src={`/flags/${userGroup.merchant.country.code.toLowerCase()}.png`} 
                                                                alt={getTranslatedText(userGroup.merchant.country.name)}
                                                                className="me-2"
                                                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        )}
                                                        <span className="text-muted fs-7">
                                                            {getTranslatedText(userGroup.merchant.country.name)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">N/A</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Branch</label>
                                    <div className="col-lg-8">
                                        {userGroup.branch ? (
                                            <div>
                                                <span className="fw-bold fs-6 text-gray-800 d-block mb-1">
                                                    {getTranslatedText(userGroup.branch.name)}
                                                </span>
                                                {userGroup.branch.address && (
                                                    <div className="text-muted fs-7 mb-1">
                                                        <i className="ki-duotone ki-geolocation fs-5 me-1">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {userGroup.branch.address}
                                                    </div>
                                                )}
                                                {userGroup.branch.phone && (
                                                    <div className="text-muted fs-7 mb-1">
                                                        <i className="ki-duotone ki-phone fs-5 me-1">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {userGroup.branch.phone}
                                                    </div>
                                                )}
                                                {userGroup.branch.email && (
                                                    <div className="text-muted fs-7">
                                                        <i className="ki-duotone ki-sms fs-5 me-1">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {userGroup.branch.email}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">N/A</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Country</label>
                                    <div className="col-lg-8">
                                        {userGroup.merchant?.country ? (
                                            <div className="d-flex align-items-center">
                                                {userGroup.merchant.country.code && (
                                                    <img 
                                                        src={`/flags/${userGroup.merchant.country.code.toLowerCase()}.png`} 
                                                        alt={getTranslatedText(userGroup.merchant.country.name)}
                                                        className="me-2"
                                                        style={{ width: '24px', height: '18px', objectFit: 'cover' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                                <span className="fw-bold fs-6 text-gray-800">
                                                    {getTranslatedText(userGroup.merchant.country.name)}
                                                </span>
                                                {userGroup.merchant.country.code && (
                                                    <span className="badge badge-light-primary ms-2">
                                                        {userGroup.merchant.country.code}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">N/A</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bold fs-6 text-gray-800">
                                            {new Date(userGroup.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">
                                    <h3 className="fw-bold m-0">Users in Group ({userGroup.users?.length || 0})</h3>
                                </div>
                            </div>
                            <div className="card-body">
                                {userGroup.users && userGroup.users.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered">
                                            <thead>
                                                <tr className="fw-bold fs-6 text-gray-800">
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userGroup.users.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>{user.name}</td>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <span className={`badge badge-light-${user.status === 'active' ? 'success' : 'warning'}`}>
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">No users in this group</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="col-xl-4">
                        <div className="card">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bold m-0">Actions</h3>
                                </div>
                            </div>

                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-5">
                                    {canEditUserGroup && (
                                        <Link 
                                            to={`/admin/user-groups/${id}/edit`}
                                            className="btn btn-primary"
                                        >
                                            <i className="ki-duotone ki-pencil fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Edit Group
                                        </Link>
                                    )}

                                    {userGroup.is_active ? (
                                        <button
                                            className="btn btn-warning"
                                            onClick={handleDeactivate}
                                        >
                                            <i className="ki-duotone ki-cross-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Deactivate Group
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-success"
                                            onClick={handleActivate}
                                        >
                                            <i className="ki-duotone ki-check-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Activate Group
                                        </button>
                                    )}

                                    <button
                                        className="btn btn-danger"
                                        onClick={handleDelete}
                                    >
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        Delete Group
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserGroupView;

