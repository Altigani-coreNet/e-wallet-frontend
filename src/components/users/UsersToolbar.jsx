import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../utils/permissions';

const UsersToolbar = ({ onRefresh, loading, basePath = '/merchant', onToggleFilters, onImport, onExport }) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (typeof KTMenu !== 'undefined' && typeof KTMenu.createInstances === 'function') {
            setTimeout(() => {
                KTMenu.createInstances();
            }, 100);
        }
    }, []);

    const canCreate = useCan('users.create');

    return (
        <div className="d-flex align-items-center gap-2 gap-lg-3">
            {onToggleFilters && (
                <button onClick={onToggleFilters} className="btn btn-sm btn-flex btn-secondary fw-bold">
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('merchant.users.toolbar.filter')}</span>
                </button>
            )}

            {onExport && (
                <button
                    className="btn btn-sm btn-flex btn-light-success fw-bold"
                    onClick={onExport}
                    disabled={loading}
                    title={t('merchant.users.toolbar.exportTitle')}
                >
                    <i className="ki-duotone ki-file-down fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('merchant.users.toolbar.export')}</span>
                </button>
            )}

            {onImport && (
                <button
                    className="btn btn-sm btn-flex btn-light-primary fw-bold"
                    onClick={onImport}
                    disabled={loading}
                    title={t('merchant.users.toolbar.importTitle')}
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('merchant.users.toolbar.import')}</span>
                </button>
            )}

            <button
                className="btn btn-sm btn-icon btn-light"
                onClick={onRefresh}
                disabled={loading}
                title={t('merchant.users.toolbar.refreshTitle')}
            >
                <i className={`ki-duotone ki-arrows-circle fs-3 ${loading ? 'spinner' : ''}`}>
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {canCreate && (
                <Link to={`${basePath}/users/create`} className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('merchant.users.toolbar.addUser')}</span>
                </Link>
            )}
        </div>
    );
};

export default UsersToolbar;
