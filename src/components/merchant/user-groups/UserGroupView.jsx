import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserGroup, deleteUserGroup, toggleUserGroupStatus } from '../../../services/userGroupsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const UserGroupView = () => {
    const { t } = useTranslation();
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
            setTitle(userGroup.name || t('merchant.userGroupsUI.pages.detailsTitle'));
            setBreadcrumbs([
                { label: t('merchant.breadcrumbs.userGroups'), path: '/merchant/user-groups' },
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
                        {t('merchant.userGroupsUI.view.edit')}
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
                        {userGroup.is_active
                            ? t('merchant.userGroupsUI.view.deactivate')
                            : t('merchant.userGroupsUI.view.activate')}
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={handleDelete}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.userGroupsUI.view.delete')}
                    </button>
                </div>
            );
        }

        return () => {
            setTitle(t('merchant.breadcrumbs.dashboard'));
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [userGroup, id, t, setTitle, setBreadcrumbs, setActions]);

    const fetchUserGroup = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getUserGroup(id);

            if (response.success) {
                const userGroupData = response.data?.data || response.data?.user_group || response.data;
                setUserGroup(userGroupData);
            } else {
                setError(response.error || t('merchant.userGroupsUI.form.loadFailed'));
            }
        } catch (err) {
            console.error('Error fetching user group:', err);
            setError(t('merchant.userGroupsUI.form.unexpectedError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('merchant.userGroupsIndex.deleteOneConfirm'))) {
            return;
        }

        try {
            const response = await deleteUserGroup(id);

            if (response.success) {
                toast.success(t('merchant.userGroupsUI.view.deleteSuccess'));
                navigate('/merchant/user-groups');
            } else {
                toast.error(response.error || t('merchant.userGroupsUI.view.deleteFailed'));
            }
        } catch (err) {
            console.error('Error deleting user group:', err);
            toast.error(t('merchant.userGroupsUI.form.unexpectedError'));
        }
    };

    const handleToggleStatus = async () => {
        try {
            const response = await toggleUserGroupStatus(id);

            if (response.success) {
                toast.success(response.data?.message || t('merchant.userGroupsUI.view.statusUpdated'));
                fetchUserGroup();
            } else {
                toast.error(response.error || t('merchant.userGroupsUI.view.statusUpdateFailed'));
            }
        } catch (err) {
            console.error('Error toggling status:', err);
            toast.error(t('merchant.userGroupsUI.form.unexpectedError'));
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
                                <p>{t('merchant.userGroupsUI.view.notFound')}</p>
                                <Link to="/merchant/user-groups" className="btn btn-primary">
                                    {t('merchant.userGroupsUI.view.backToUserGroups')}
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
                            <h2>{t('merchant.userGroupsUI.view.title')}</h2>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.groupName')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">{userGroup.name}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.groupId')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">{userGroup.group_id}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.branch')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {userGroup.branch?.name || t('merchant.common.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.status')}</label>
                            <div className="col-lg-8">
                                <span className={`badge ${userGroup.is_active ? 'badge-light-success' : 'badge-light-warning'}`}>
                                    {userGroup.is_active ? t('merchant.common.active') : t('merchant.common.inactive')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.description')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {userGroup.description || t('merchant.common.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.numberOfUsers')}</label>
                            <div className="col-lg-8">
                                <span className="badge badge-light-primary badge-lg">
                                    {userGroup.users_count || (userGroup.users?.length || 0)}
                                </span>
                            </div>
                        </div>

                        {userGroup.users && userGroup.users.length > 0 && (
                            <>
                                <div className="separator mb-7"></div>
                                <div className="mb-7">
                                    <label className="fw-bold text-muted mb-4 d-block">{t('merchant.userGroupsUI.view.assignedUsers')}</label>
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                            <thead>
                                                <tr className="fw-bolder text-muted">
                                                    <th className="min-w-150px">{t('merchant.userGroupsUI.view.colName')}</th>
                                                    <th className="min-w-150px">{t('merchant.userGroupsUI.view.colEmail')}</th>
                                                    <th className="min-w-100px">{t('merchant.userGroupsUI.view.colPhone')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userGroup.users.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>{user.name || t('merchant.common.na')}</td>
                                                        <td>{user.email || t('merchant.common.na')}</td>
                                                        <td>{user.phone || t('merchant.common.na')}</td>
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
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.createdAt')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {new Date(userGroup.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="row">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.userGroupsUI.view.lastUpdated')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-dark">
                                    {new Date(userGroup.updated_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer d-flex justify-content-end">
                        <Link to="/merchant/user-groups" className="btn btn-light me-2">
                            {t('merchant.userGroupsUI.view.backToList')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGroupView;
