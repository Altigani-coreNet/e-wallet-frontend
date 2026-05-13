import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getRole, deleteRole } from '../../../../services/adminRolesService';

const AdminRoleView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRole = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getRole(id);
            if (response.success) {
                setRole(response.data.data.role);
                setPermissions(response.data.data.permissions || []);
            } else {
                toast.error(response.error || t('admin.systemRoles.roleFetchFailed'));
            }
        } catch (error) {
            console.error('Error fetching role:', error);
            toast.error(t('admin.systemRoles.roleFetchFailed'));
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    const handleDelete = useCallback(async () => {
        if (!window.confirm(t('admin.systemRoles.deleteThisRoleConfirm'))) {
            return;
        }

        try {
            const response = await deleteRole(id);
            if (response.success) {
                toast.success(t('admin.systemRoles.roleDeleted'));
                navigate('/admin/system/roles');
            } else {
                toast.error(response.error || t('admin.systemRoles.roleDeleteFailed'));
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error(t('admin.systemRoles.roleDeleteFailed'));
        }
    }, [id, navigate, t]);

    useEffect(() => {
        setTitle(t('admin.systemRoles.viewTitle'));
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/roles/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.edit')}</span>
                </Link>
                <button type="button" onClick={handleDelete} className="btn btn-sm btn-danger">
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.delete')}</span>
                </button>
            </div>
        );
        return () => setActions(null);
    }, [id, setTitle, setActions, t, handleDelete]);

    useEffect(() => {
        fetchRole();
    }, [fetchRole]);

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!role) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>{t('admin.systemRoles.roleNotFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.systemRoles.roleInfo')}</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.systemRoles.labelRoleName')}</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">{role.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.systemRoles.labelPermissionsCount')}</label>
                    <div className="col-lg-8">
                        <span className="badge badge-light-success">
                            {t('admin.systemRoles.permissionsCountBadge', { count: permissions.length })}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.systemRoles.colCreatedAt')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(role.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.systemRoles.labelPermissions')}</label>
                    <div className="col-lg-8">
                        <div className="d-flex flex-wrap gap-2">
                            {permissions.length > 0 ? (
                                permissions.map((permId) => (
                                    <span key={permId} className="badge badge-light">
                                        {t('admin.systemRoles.permissionId', { id: permId })}
                                    </span>
                                ))
                            ) : (
                                <span className="text-muted">{t('admin.systemRoles.noPermissionsAssigned')}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRoleView;
