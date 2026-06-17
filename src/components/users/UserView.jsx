import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../contexts/ToolbarContext';
import { getUser, changeUserStatus, deleteUser } from '../../services/usersService';
import UserViewSkeleton from './view/UserViewSkeleton';
import UserProfileHeader from './view/UserProfileHeader';
import UserOverviewTab from './view/UserOverviewTab';
import UserUserGroupsTab from './view/UserUserGroupsTab';
import UserTransactionsTab from './view/UserTransactionsTab';

const UserView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    const basePath = '/merchant';
    const usersPath = `${basePath}/users`;

    const [user, setUser] = useState(null);
    const [statistics, setStatistics] = useState({});
    const [collections, setCollections] = useState({
        user_groups: [],
    });
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle(t('merchant.users.view.title'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`${usersPath}/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.users.view.editUser')}
                </Link>
                <Link to={usersPath} className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.back')}
                </Link>
            </div>
        );

        return () => {
            setTitle('Dashboard');
            setActions(null);
        };
    }, [id, basePath, usersPath, setTitle, setActions, t, i18n.language]);

    const statsConfig = useMemo(
        () => [
            { key: 'user_groups', label: t('merchant.users.view.userGroups'), icon: 'ki-people' },
            { key: 'total_terminals', label: t('merchant.users.view.statsTerminals'), icon: 'ki-devices-2' },
        ],
        [t, i18n.language]
    );

    const fetchUser = async () => {
        setLoading(true);
        try {
            const response = await getUser(id);

            if (response.success) {
                const payload = response.data?.data ?? response.data ?? null;

                if (payload) {
                    const userGroups = payload.user_groups ?? payload.userGroups ?? [];
                    const terminals = Array.isArray(payload.terminals) ? payload.terminals : [];
                    const attachments = payload.attachments ?? [];
                    const terminalGroups = payload.terminal_groups ?? [];

                    const normalizedUser = {
                        ...payload,
                        user_groups: userGroups,
                        profile_image_url: payload.profile_image_url || payload.profile_image || null,
                    };

                    setUser(normalizedUser);

                    setStatistics({
                        total_terminals: terminals.length,
                        terminal_groups: Array.isArray(terminalGroups) ? terminalGroups.length : 0,
                        user_groups: userGroups.length,
                        attachments: Array.isArray(attachments) ? attachments.length : 0,
                    });

                    setCollections({
                        user_groups: userGroups,
                    });

                    setActiveTab('overview');
                } else {
                    setUser(null);
                }
            } else {
                toast.error(response.error || t('merchant.users.view.fetchUserError'));
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            toast.error(t('merchant.users.view.loadUserError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!user) return;
        const userGroups = user.user_groups ?? [];
        setTabs([
            { key: 'overview', label: t('merchant.users.view.overview') },
            ...(userGroups.length ? [{ key: 'user_groups', label: t('merchant.users.view.userGroups') }] : []),
            { key: 'transactions', label: t('merchant.users.view.transactions') },
        ]);
    }, [t, i18n.language, user]);

    const handleStatusToggle = async () => {
        if (!user) return;

        const isActive =
            user.status === true || user.status === 1 || user.status === '1' || user.status === 'active';
        const newStatus = isActive ? 0 : 1;

        try {
            const response = await changeUserStatus(id, newStatus);

            if (response.success) {
                toast.success(t('merchant.users.view.statusUpdated'));
                fetchUser();
            } else {
                toast.error(response.error || t('merchant.users.view.statusUpdateFailed'));
            }
        } catch (error) {
            console.error('Failed to update user status', error);
            toast.error(t('merchant.users.view.statusUpdateFailed'));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('merchant.users.view.deleteConfirm'))) {
            return;
        }

        try {
            const response = await deleteUser(id);
            if (response.success) {
                toast.success(t('merchant.users.view.deletedSuccess'));
                navigate(usersPath);
            } else {
                toast.error(response.error || t('merchant.users.view.deleteFailed'));
            }
        } catch (error) {
            console.error('Failed to delete user', error);
            toast.error(t('merchant.users.view.deleteFailed'));
        }
    };

    const isActive =
        user?.status === true || user?.status === 1 || user?.status === '1' || user?.status === 'active';

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <UserOverviewTab
                        user={user}
                        canEdit
                        editUrl={`${usersPath}/${id}/edit`}
                        showMerchantDetails={false}
                        showBranchDetails={!!user.branch}
                        branchLink={user.branch ? `${basePath}/branches/${user.branch.id}` : undefined}
                    />
                );
            case 'user_groups':
                return <UserUserGroupsTab userGroups={collections.user_groups} />;
            case 'transactions':
                return <UserTransactionsTab userId={user?.id} merchantId={user?.merchant_id} />;
            default:
                return <UserOverviewTab user={user} canEdit editUrl={`${usersPath}/${id}/edit`} />;
        }
    };

    if (loading) {
        return <UserViewSkeleton />;
    }

    if (!user) {
        return (
            <div className="text-center py-10">
                <p className="text-muted">{t('merchant.users.view.notFound')}</p>
                <Link to={usersPath} className="btn btn-primary mt-3">
                    {t('merchant.users.view.backToUsers')}
                </Link>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <UserProfileHeader
                    user={user}
                    statistics={statistics}
                    statsConfig={statsConfig}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={tabs}
                    activeStatusLabel={t('merchant.common.active')}
                    inactiveStatusLabel={t('merchant.common.inactive')}
                    userStatusLabel={t('merchant.profile.userStatus')}
                    nameFallback={t('merchant.common.na')}
                />

                <div className="row g-5 g-xl-8">
                    <div className="col-xl-8 order-2 order-xl-1">{renderTabContent()}</div>
                    <div className="col-xl-4 order-1 order-xl-2">
                        <div className="card mb-5">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bolder m-0">{t('merchant.users.view.quickActions')}</h3>
                                </div>
                            </div>
                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-4">
                                    <Link to={`${usersPath}/${id}/edit`} className="btn btn-primary">
                                        <i className="ki-duotone ki-pencil fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.users.view.editUser')}
                                    </Link>
                                    <button
                                        className={`btn btn-${isActive ? 'warning' : 'success'}`}
                                        onClick={handleStatusToggle}
                                    >
                                        <i
                                            className={`ki-duotone ${isActive ? 'ki-cross-circle' : 'ki-check-circle'} fs-3 me-2`}
                                        >
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {isActive ? t('merchant.users.view.deactivateUser') : t('merchant.users.view.activateUser')}
                                    </button>
                                    <button className="btn btn-danger" onClick={handleDelete}>
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        {t('merchant.users.view.deleteUser')}
                                    </button>
                                </div>

                                <div className="separator my-7"></div>

                                <div className="d-flex flex-column gap-3 text-gray-600 fs-7">
                                    <div className="d-flex justify-content-between">
                                        <span>{t('merchant.users.view.userId')}</span>
                                        <span className="fw-bold text-gray-900">{user.id}</span>
                                    </div>
                                    {user.branch_id && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('merchant.users.view.branchId')}</span>
                                            <span className="fw-bold text-gray-900">{user.branch_id}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between">
                                        <span>{t('merchant.users.view.createdAt')}</span>
                                        <span className="fw-bold text-gray-900">{new Date(user.created_at).toLocaleString()}</span>
                                    </div>
                                    {user.updated_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('merchant.users.view.lastUpdated')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {new Date(user.updated_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {user.roles && user.roles.length > 0 && (
                                    <>
                                        <div className="separator my-7"></div>
                                        <div>
                                            <h4 className="fw-bold mb-4">{t('merchant.users.view.roles')}</h4>
                                            <div className="d-flex flex-wrap gap-2">
                                                {user.roles.map((role) => (
                                                    <span key={role.id || role.name} className="badge badge-light-info">
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserView;
