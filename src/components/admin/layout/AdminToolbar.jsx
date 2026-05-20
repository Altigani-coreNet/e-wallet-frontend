import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { resolveAdminPath } from '../../../i18n/localePaths';

const AdminToolbar = () => {
    const { t, i18n } = useTranslation();
    const { title, actions } = useToolbar();
    const location = useLocation();
    const dashboardPath = resolveAdminPath('/admin/dashboard', location.pathname);
    const pageTitle = title || t('admin.pages.adminDashboard');
    const breadcrumbCurrent = title || t('admin.header.dashboard');

    return (
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6" dir={i18n.dir()}>
            <div
                id="kt_app_toolbar_container"
                className="app-container container-fluid d-flex flex-stack"
                dir={i18n.dir()}
            >
                <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3 align-items-start text-start">
                    <h1 className="page-heading d-flex text-dark fw-bold fs-3 flex-column justify-content-center my-0 text-start">
                        {pageTitle}
                    </h1>
                    <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1 justify-content-start text-start">
                        <li className="breadcrumb-item text-muted">
                            <Link to={dashboardPath} className="text-muted text-hover-primary">
                                {t('admin.header.adminBadge')}
                            </Link>
                        </li>
                        <li className="breadcrumb-item">
                            <span className="bullet bg-gray-400 w-5px h-2px"></span>
                        </li>
                        <li className="breadcrumb-item text-muted">{breadcrumbCurrent}</li>
                    </ul>
                </div>

                {actions && (
                    <div className="d-flex align-items-center gap-2 gap-lg-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminToolbar;
