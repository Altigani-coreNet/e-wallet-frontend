import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCan } from '../../../utils/permissions';

const UserGroupToolbar = ({ onRefresh, loading, statusFilter, onStatusFilter, onToggleFilters, basePath }) => {
    const { t } = useTranslation();
    const canCreate = useCan('userGroups.create');

    return (
        <div className="d-flex align-items-center gap-2 gap-lg-3">
            <button
                type="button"
                className="btn btn-sm btn-flex btn-secondary fw-bold"
                onClick={onToggleFilters}
            >
                <i className="ki-duotone ki-filter fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">{t('merchant.userGroupsUI.toolbar.filter')}</span>
            </button>

            <select
                className="form-select form-select-sm w-150px"
                value={statusFilter || ''}
                onChange={(e) => onStatusFilter(e.target.value)}
            >
                <option value="">{t('merchant.userGroupsUI.toolbar.allStatus')}</option>
                <option value="active">{t('merchant.userGroupsUI.filters.active')}</option>
                <option value="inactive">{t('merchant.userGroupsUI.filters.inactive')}</option>
            </select>

            <button
                type="button"
                className="btn btn-sm btn-icon btn-light"
                onClick={onRefresh}
                disabled={loading}
                title={t('merchant.userGroupsUI.toolbar.refresh')}
            >
                <i className="ki-duotone ki-arrows-circle fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {canCreate && (
                <Link
                    to={`${basePath}/user-groups/create`}
                    className="btn btn-sm fw-bold btn-primary"
                >
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('merchant.userGroupsUI.toolbar.addUserGroup')}</span>
                </Link>
            )}
        </div>
    );
};

export default UserGroupToolbar;
