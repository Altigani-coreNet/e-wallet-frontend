import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation();
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

    const profileTabs = useMemo(
        () => [
            { key: 'overview', label: t('admin.usersUI.view.tabs.overview'), icon: 'ki-profile-circle' },
            { key: 'terminals', label: t('admin.usersUI.view.tabs.terminals'), icon: 'ki-tablet' },
            { key: 'transactions', label: t('admin.usersUI.view.tabs.transactions'), icon: 'ki-credit-cart' },
            { key: 'user_groups', label: t('admin.usersUI.view.tabs.userGroups'), icon: 'ki-people' },
            { key: 'attachments', label: t('admin.usersUI.view.tabs.attachments'), icon: 'ki-folder' },
            { key: 'events', label: t('admin.usersUI.view.tabs.events'), icon: 'ki-abstract-44' },
        ],
        [t, i18n.language]
    );

    const profileStatsConfig = useMemo(
        () => [
            { key: 'total_terminals', label: t('admin.usersUI.view.headerStats.terminals'), icon: 'ki-devices-2' },
            { key: 'terminal_groups', label: t('admin.usersUI.view.headerStats.terminalGroups'), icon: 'ki-grid' },
            { key: 'user_groups', label: t('admin.usersUI.view.headerStats.userGroups'), icon: 'ki-people' },
            { key: 'attachments', label: t('admin.usersUI.view.headerStats.attachments'), icon: 'ki-folder' },
        ],
        [t, i18n.language]
    );

    useEffect(() => {
        setTitle(t('admin.usersUI.view.title'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`/admin/users/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.usersUI.view.editUser')}
                </Link>
                <Link to="/admin/users" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.usersUI.view.back')}
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id, t, i18n.language]);

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
            toast.error(t('admin.usersUI.view.loadFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm(t('admin.usersIndex.activateConfirm'))) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_ACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(t('admin.usersIndex.activated'));
                fetchUser();
            }
        } catch (error) {
            toast.error(t('admin.usersIndex.activateFailed'));
            console.error(error);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm(t('admin.usersIndex.deactivateConfirm'))) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_DEACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(t('admin.usersIndex.deactivated'));
                fetchUser();
            }
        } catch (error) {
            toast.error(t('admin.usersIndex.deactivateFailed'));
            console.error(error);
        }
    };

    const handleSendResetPassword = async () => {
        if (!user) return;
        if (!window.confirm(t('admin.usersUI.view.resetPasswordConfirm', { email: user.email }))) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_SEND_RESET_PASSWORD(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(response.data.data?.message || t('admin.usersUI.view.resetSuccess'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.usersUI.view.resetFailed'));
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('admin.usersUI.view.deleteConfirm'))) return;

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.USERS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(t('admin.usersUI.view.deleteSuccess'));
                navigate('/admin/users');
            }
        } catch (error) {
            toast.error(t('admin.usersUI.view.deleteFailed'));
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
                <p className="text-muted">{t('admin.usersUI.view.notFound')}</p>
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
                    tabs={profileTabs}
                    statsConfig={profileStatsConfig}
                    activeStatusLabel={t('admin.common.active')}
                    inactiveStatusLabel={t('admin.common.inactive')}
                    userStatusLabel={t('admin.usersUI.view.userStatusProgress')}
                    nameFallback={t('admin.common.na')}
                />

                <div className="row g-5 g-xl-8">
                    <div className="col-xl-8 order-2 order-xl-1">
                        {renderTabContent()}
                    </div>
                    <div className="col-xl-4 order-1 order-xl-2">
                        <div className="card mb-5">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bolder m-0">{t('admin.usersUI.view.quickActions')}</h3>
                                </div>
                            </div>
                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-4">
                                    <Link to={`/admin/users/${id}/edit`} className="btn btn-primary">
                                        <i className="ki-duotone ki-pencil fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.usersUI.view.editUser')}
                                    </Link>
                                    {isActive ? (
                                        <button className="btn btn-warning" onClick={handleDeactivate}>
                                            <i className="ki-duotone ki-cross-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.usersUI.view.deactivateUser')}
                                        </button>
                                    ) : (
                                        <button className="btn btn-success" onClick={handleActivate}>
                                            <i className="ki-duotone ki-check-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.usersUI.view.activateUser')}
                                        </button>
                                    )}
                                    <button className="btn btn-info" onClick={handleSendResetPassword}>
                                        <i className="ki-duotone ki-key fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.usersUI.view.sendResetPassword')}
                                    </button>
                                    <button className="btn btn-danger" onClick={handleDelete}>
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        {t('admin.usersUI.view.deleteUser')}
                                    </button>
                                </div>

                                <div className="separator my-7"></div>

                                <div>
                                    <h4 className="fw-bold mb-4">{t('admin.usersUI.view.terminalMetrics')}</h4>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>{t('admin.usersUI.view.totalTerminals')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.total_terminals ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>{t('admin.usersUI.view.online')}</span>
                                            <span className="fw-bold text-success">
                                                {statistics.online_terminals ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>{t('admin.usersUI.view.offline')}</span>
                                            <span className="fw-bold text-warning">
                                                {statistics.offline_terminals ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>{t('admin.usersUI.view.terminalGroups')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.terminal_groups ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>{t('admin.usersUI.view.userGroups')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.user_groups ?? 0}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between text-gray-600 fs-7">
                                            <span>{t('admin.usersUI.view.attachments')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {statistics.attachments ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {user.roles && user.roles.length > 0 && (
                                    <div className="mt-9">
                                        <h4 className="fw-bold mb-4">{t('admin.usersUI.view.roles')}</h4>
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
                                        <span>{t('admin.usersUI.view.userId')}</span>
                                        <span className="fw-bold text-gray-900">{user.id}</span>
                                    </div>
                                    {user.user_name && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('admin.usersUI.view.username')}</span>
                                            <span className="fw-bold text-gray-900">{user.user_name}</span>
                                        </div>
                                    )}
                                    {user.merchant_id && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('admin.usersUI.view.merchantId')}</span>
                                            <span className="fw-bold text-gray-900">{user.merchant_id}</span>
                                        </div>
                                    )}
                                    {user.branch_id && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('admin.usersUI.view.branchId')}</span>
                                            <span className="fw-bold text-gray-900">{user.branch_id}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between">
                                        <span>{t('admin.usersUI.view.createdAt')}</span>
                                        <span className="fw-bold text-gray-900">
                                            {new Date(user.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {user.updated_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('admin.usersUI.view.lastUpdated')}</span>
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

