import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const UserTableRow = ({ user, index, onDelete, onStatusChange, basePath = '/sales' }) => {
    const { t } = useTranslation();

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    const getStatusBadge = (status) => {
        if (status === 1) {
            return <span className="badge badge-light-success">{t('merchant.common.active')}</span>;
        }
        return <span className="badge badge-light-danger">{t('merchant.common.inactive')}</span>;
    };

    const getRolesDisplay = (userRoles) => {
        if (!userRoles || userRoles.length === 0) {
            return <span className="text-muted">-</span>;
        }

        return userRoles.map((role, idx) => (
            <span key={idx} className="badge badge-light-primary me-1">
                {role.name}
            </span>
        ));
    };

    const getUserTypeDisplay = () => {
        const rawType = user.type || user.user_type;
        if (!rawType) {
            return <span className="text-muted">-</span>;
        }

        const normalized = String(rawType).toLowerCase();
        let label = rawType;
        let badgeClass = 'badge-light-secondary';

        if (normalized === 'admin') {
            label = t('merchant.users.table.typeAdmin');
            badgeClass = 'badge-light-danger';
        } else if (normalized === 'supervisor') {
            label = t('merchant.users.table.typeSupervisor');
            badgeClass = 'badge-light-warning';
        } else if (normalized === 'cashier') {
            label = t('merchant.users.table.typeCashier');
            badgeClass = 'badge-light-primary';
        }

        return <span className={`badge ${badgeClass}`}>{label}</span>;
    };

    return (
        <tr>
            <td>
                <span className="text-gray-800 fw-bold">{index}</span>
            </td>
            <td>
                <div className="d-flex align-items-center">
                    <div className="symbol symbol-45px me-5">
                        {user.profile_image ? (
                            <img src={user.profile_image} alt={user.name} className="rounded-circle" />
                        ) : (
                            <div className="symbol-label bg-light-primary text-primary fs-6 fw-bolder">{getInitials(user.name)}</div>
                        )}
                    </div>

                    <div className="d-flex flex-column">
                        <Link to={`${basePath}/users/${user.id}`} className="text-gray-800 text-hover-primary mb-1 fw-bold">
                            {user.name}
                        </Link>
                        <span className="text-gray-500 fw-semibold d-block fs-7">{user.email}</span>
                    </div>
                </div>
            </td>
            <td>
                <span className="text-gray-800">{user.phone || '-'}</span>
            </td>
            <td>{getUserTypeDisplay()}</td>
            <td>
                <span className="text-gray-800">{user.branch ? user.branch.name : '-'}</span>
            </td>
            <td>{getRolesDisplay(user.roles)}</td>
            <td>{getStatusBadge(user.status)}</td>
            <td className="text-end">
                <button
                    type="button"
                    className="btn btn-sm btn-light btn-active-light-primary"
                    data-kt-menu-trigger="click"
                    data-kt-menu-placement="bottom-end"
                >
                    {t('merchant.users.table.actions')}
                    <i className="ki-duotone ki-down fs-5 ms-1"></i>
                </button>

                <div
                    className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px py-4"
                    data-kt-menu="true"
                >
                    <div className="menu-item px-3">
                        <Link to={`${basePath}/users/${user.id}`} className="menu-link px-3">
                            {t('merchant.users.table.view')}
                        </Link>
                    </div>
                    <div className="menu-item px-3">
                        <a
                            href="#"
                            className="menu-link px-3"
                            onClick={(e) => {
                                e.preventDefault();
                                onStatusChange(user.id, user.status);
                            }}
                        >
                            {user.status === 1 ? t('merchant.users.table.deactivate') : t('merchant.users.table.activate')}
                        </a>
                    </div>
                    <div className="menu-item px-3">
                        <Link to={`${basePath}/users/${user.id}/edit`} className="menu-link px-3">
                            {t('merchant.users.table.edit')}
                        </Link>
                    </div>
                    <div className="menu-item px-3">
                        <a
                            href="#"
                            className="menu-link px-3 text-danger"
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(user.id);
                            }}
                        >
                            {t('merchant.users.table.delete')}
                        </a>
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default UserTableRow;
