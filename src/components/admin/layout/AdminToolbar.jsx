import React from 'react';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminToolbar = () => {
    const { title, actions } = useToolbar();

    return (
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
            <div id="kt_app_toolbar_container" className="app-container container-fluid d-flex flex-stack">
                {/* Page title */}
                <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                    <h1 className="page-heading d-flex text-dark fw-bold fs-3 flex-column justify-content-center my-0">
                        {title || 'Admin Dashboard'}
                    </h1>
                    <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                        <li className="breadcrumb-item text-muted">
                            <a href="/admin/dashboard" className="text-muted text-hover-primary">Admin</a>
                        </li>
                        <li className="breadcrumb-item">
                            <span className="bullet bg-gray-400 w-5px h-2px"></span>
                        </li>
                        <li className="breadcrumb-item text-muted">{title || 'Dashboard'}</li>
                    </ul>
                </div>

                {/* Actions */}
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



