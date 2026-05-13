import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getTranslatedText } from '../../../utils/helpers';
import { useCan, USER_GROUP_EDIT_PERMISSIONS } from '../../../utils/permissions';
import UserGroupViewSkeleton from './UserGroupViewSkeleton';

const AdminUserGroupView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const canEditUserGroup = useCan(USER_GROUP_EDIT_PERMISSIONS);
    const [userGroup, setUserGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle(t('admin.userGroupsUI.view.title'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                {canEditUserGroup && (
                    <Link to={`/admin/user-groups/${id}/edit`} className="btn btn-sm btn-primary">
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('admin.userGroupsUI.view.editGroup')}
                    </Link>
                )}
                <Link to="/admin/user-groups" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.userGroupsUI.view.back')}
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id, canEditUserGroup, t, i18n.language]);

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
            toast.error(t('admin.userGroupsUI.form.loadFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm(t('admin.userGroupsIndex.activateConfirm'))) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_ACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(t('admin.userGroupsIndex.activated'));
                fetchUserGroup();
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.activateFailed'));
            console.error(error);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm(t('admin.userGroupsIndex.deactivateConfirm'))) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_DEACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(t('admin.userGroupsIndex.deactivated'));
                fetchUserGroup();
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.deactivateFailed'));
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('admin.userGroupsIndex.deleteOneConfirm'))) return;

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.USER_GROUPS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success || response.data.status) {
                toast.success(t('admin.userGroupsIndex.deleted'));
                navigate('/admin/user-groups');
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.deleteFailed'));
            console.error(error);
        }
    };

    if (loading) {
        return <UserGroupViewSkeleton />;
    }

    if (!userGroup) {
        return (
            <div className="text-center py-10">
                <p className="text-muted">{t('admin.userGroupsUI.view.notFound')}</p>
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
                                    <h3 className="fw-bold m-0">{t('admin.userGroupsUI.view.groupInfo')}</h3>
                                </div>
                            </div>

                            <div className="card-body border-top p-9">
                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.groupName')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bold fs-6 text-gray-800">{userGroup.name}</span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.groupId')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-semibold text-gray-800 fs-6">{userGroup.group_id}</span>
                                    </div>
                                </div>

                                {userGroup.description && (
                                    <div className="row mb-7">
                                        <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.description')}</label>
                                        <div className="col-lg-8">
                                            <span className="fw-bold fs-6 text-gray-800">{userGroup.description}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.status')}</label>
                                    <div className="col-lg-8">
                                        <span className={`badge badge-light-${userGroup.is_active ? 'success' : 'warning'} fw-bold`}>
                                            {userGroup.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.merchant')}</label>
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
                                                        <span className="badge badge-light-info">{t('admin.userGroupsUI.view.codeLabel', { code: userGroup.merchant.merchant_code })}</span>
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
                                            <span className="text-muted">{t('admin.common.na')}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.branch')}</label>
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
                                            <span className="text-muted">{t('admin.common.na')}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.country')}</label>
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
                                            <span className="text-muted">{t('admin.common.na')}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.userGroupsUI.view.createdAt')}</label>
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
                                    <h3 className="fw-bold m-0">{t('admin.userGroupsUI.view.usersInGroup', { count: userGroup.users?.length || 0 })}</h3>
                                </div>
                            </div>
                            <div className="card-body">
                                {userGroup.users && userGroup.users.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered">
                                            <thead>
                                                <tr className="fw-bold fs-6 text-gray-800">
                                                    <th>{t('admin.userGroupsUI.view.colName')}</th>
                                                    <th>{t('admin.userGroupsUI.view.colEmail')}</th>
                                                    <th>{t('admin.userGroupsUI.view.colStatus')}</th>
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
                                    <p className="text-muted">{t('admin.userGroupsUI.view.noUsers')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="col-xl-4">
                        <div className="card">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bold m-0">{t('admin.userGroupsUI.view.actions')}</h3>
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
                                            {t('admin.userGroupsUI.view.editGroup')}
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
                                            {t('admin.userGroupsUI.view.deactivateGroup')}
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
                                            {t('admin.userGroupsUI.view.activateGroup')}
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
                                        {t('admin.userGroupsUI.view.deleteGroup')}
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

