import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import UserViewSkeleton from '../../users/view/UserViewSkeleton';
import UserProfileHeader from '../../users/view/UserProfileHeader';
import UserOverviewTab from '../../users/view/UserOverviewTab';
import UserTerminalsTab from '../../users/view/UserTerminalsTab';
import UserUserGroupsTab from '../../users/view/UserUserGroupsTab';
import UserAttachmentsTab from '../../users/view/UserAttachmentsTab';
import UserEventsTimeline from '../../users/view/UserEventsTimeline';
import UserTransactionsTab from '../../users/view/UserTransactionsTab';

const AdminUserView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [user, setUser] = useState(null);
    const [statistics, setStatistics] = useState({});
    const [collections, setCollections] = useState({
        terminals: [],
        terminal_groups: [],
        user_groups: [],
        attachments: []
    });
    const [latestLogs, setLatestLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('User Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`/admin/users/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit User
                </Link>
                <Link to="/admin/users" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id]);

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USER_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success || response.data.status) {
                const payload = response.data.data || {};
                const userPayload = payload.user || payload;

                const normalizedCollections = {
                    terminals: payload.collections?.terminals ?? userPayload.terminals ?? [],
                    terminal_groups: payload.collections?.terminal_groups ?? userPayload.terminal_groups ?? [],
                    user_groups: payload.collections?.user_groups ?? userPayload.user_groups ?? [],
                    attachments: payload.collections?.attachments ?? userPayload.attachments ?? []
                };

                const logs =
                    payload.latest_logs ??
                    userPayload.latest_logs ??
                    userPayload.LatestLogs ??
                    [];

                const sanitizedUser = { ...userPayload };
                delete sanitizedUser.terminals;
                delete sanitizedUser.terminal_groups;
                delete sanitizedUser.user_groups;
                delete sanitizedUser.attachments;
                delete sanitizedUser.LatestLogs;
                delete sanitizedUser.latest_logs;

                setUser(sanitizedUser);
                setStatistics(payload.statistics || {});
                setCollections(normalizedCollections);
                setLatestLogs(Array.isArray(logs) ? logs : []);
                setActiveTab('overview');
            }
        } catch (error) {
            toast.error('Failed to load user');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm('Are you sure you want to activate this user?')) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_ACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success('User activated successfully');
                fetchUser();
            }
        } catch (error) {
            toast.error('Failed to activate user');
            console.error(error);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_DEACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success('User deactivated successfully');
                fetchUser();
            }
        } catch (error) {
            toast.error('Failed to deactivate user');
            console.error(error);
        }
    };

    const handleSendResetPassword = async () => {
        if (!user) return;
        if (!window.confirm('Send reset password link to ' + user.email + '?')) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_SEND_RESET_PASSWORD(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(response.data.data?.message || 'Reset password link sent successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset password link');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.USERS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success('User deleted successfully');
                navigate('/admin/users');
            }
        } catch (error) {
            toast.error('Failed to delete user');
            console.error(error);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <UserOverviewTab user={user} />;
            case 'terminals':
                return (
                    <UserTerminalsTab
                        terminals={collections.terminals}
                        terminalGroups={collections.terminal_groups}
                    />
                );
            case 'transactions':
                return <UserTransactionsTab />;
            case 'user_groups':
                return <UserUserGroupsTab userGroups={collections.user_groups} />;
            case 'attachments':
                return <UserAttachmentsTab attachments={collections.attachments} />;
            case 'events':
                return <UserEventsTimeline latestLogs={latestLogs} />;
            default:
                return <UserOverviewTab user={user} />;
        }
    };

    if (loading) {
        return <UserViewSkeleton />;
    }

    if (!user) {
        return (
            <div className="text-center py-10">
                <p className="text-muted">User not found</p>
            </div>
        );
    }

    const isActive =
        user.status === 'active' || user.status === 1 || user.status === '1' || user.status === true;

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <UserProfileHeader
                    user={user}
                    statistics={statistics}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="row g-5 g-xl-8">
                    <div className="col-xl-8 order-2 order-xl-1">
                        {renderTabContent()}
                    </div>
                    <div className="col-xl-4 order-1 order-xl-2">
                        <div className="card mb-5">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bolder m-0">Quick Actions</h3>
                                </div>
                            </div>
                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-4">
                                    <Link to={`/admin/users/${id}/edit`} className="btn btn-primary">
                                        <i className="ki-duotone ki-pencil fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Edit User
                                    </Link>
                                    {isActive ? (
                                        <button className="btn btn-warning" onClick={handleDeactivate}>
                                            <i className="ki-duotone ki-cross-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Deactivate User
                                        </button>
                                    ) : (
                                        <button className="btn btn-success" onClick={handleActivate}>
                                            <i className="ki-duotone ki-check-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Activate User
                                        </button>
                                    )}
                                    <button className="btn btn-info" onClick={handleSendResetPassword}>
                                        <i className="ki-duotone ki-key fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Send Reset Password Link
                                    </button>
                                    <button className="btn btn-danger" onClick={handleDelete}>
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        Delete User
                                    </button>
                                </div>

                                <div className="separator my-7"></div>

                                <div>
                                    <h4 className="fw-bold mb-4">Terminal Metrics</h4>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>Total Terminals</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.total_terminals ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>Online</span>
                                            <span className="fw-bold text-success">
                                                {statistics.online_terminals ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>Offline</span>
                                            <span className="fw-bold text-warning">
                                                {statistics.offline_terminals ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>Terminal Groups</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.terminal_groups ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>User Groups</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.user_groups ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>Attachments</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.attachments ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {user.roles && user.roles.length > 0 && (
                                    <div className="mt-9">
                                        <h4 className="fw-bold mb-4">Roles</h4>
                                        <div className="d-flex flex-wrap gap-2">
                                            {user.roles.map((role) => (
                                                <span key={role.id || role.name} className="badge badge-light-info">
                                                    {role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="separator my-7"></div>

                                <div className="d-flex flex-column gap-3 text-gray-600 fs-7">
                                    <div className="d-flex justify-content-between">
                                        <span>User ID</span>
                                        <span className="fw-bold text-gray-900">{user.id}</span>
                                    </div>
                                    {user.merchant_id && (
                                        <div className="d-flex justify-content-between">
                                            <span>Merchant ID</span>
                                            <span className="fw-bold text-gray-900">{user.merchant_id}</span>
                                        </div>
                                    )}
                                    {user.branch_id && (
                                        <div className="d-flex justify-content-between">
                                            <span>Branch ID</span>
                                            <span className="fw-bold text-gray-900">{user.branch_id}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between">
                                        <span>Created At</span>
                                        <span className="fw-bold text-gray-900">
                                            {new Date(user.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {user.updated_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>Last Updated</span>
                                            <span className="fw-bold text-gray-900">
                                                {new Date(user.updated_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserView;

