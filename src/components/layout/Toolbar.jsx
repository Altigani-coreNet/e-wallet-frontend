import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Toolbar = ({ title, breadcrumbs, actions }) => {
    const location = useLocation();
    
    // Generate default breadcrumbs based on path if not provided
    const getDefaultBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(Boolean);
        return paths.map((path, index) => ({
            label: path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' '),
            path: '/' + paths.slice(0, index + 1).join('/'),
            active: index === paths.length - 1
        }));
    };

    const breadcrumbItems = breadcrumbs || getDefaultBreadcrumbs();

    // Normalize breadcrumb items to support both formats: {text, href} and {label, path}
    const normalizedBreadcrumbs = breadcrumbItems.map(item => ({
        label: item.label || item.text || '',
        path: item.path || item.href || '',
        active: item.active !== undefined ? item.active : !(item.path || item.href)
    }));

    // Always prepend "Home" as the first breadcrumb item
    const allBreadcrumbs = [
        { label: 'Home', path: '/merchant/dashboard', active: false },
        ...normalizedBreadcrumbs
    ];

    return (
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
            <div id="kt_app_toolbar_container" className="app-container container-fluid d-flex flex-stack">
                {/* Page title */}
                <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                    {/* Title */}
                    <h1 className="page-heading d-flex text-dark fw-bold fs-3 flex-column justify-content-center my-0">
                        {title || 'Dashboard'}
                    </h1>
                    
                    {/* Breadcrumb - always show Home first, then other breadcrumbs */}
                    {allBreadcrumbs.length > 0 && (
                        <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                            {allBreadcrumbs.map((item, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && (
                                        <li className="breadcrumb-item">
                                            <span className="bullet bg-gray-400 w-5px h-2px"></span>
                                        </li>
                                    )}
                                    <li className={`breadcrumb-item ${item.active ? 'text-dark' : 'text-muted'}`}>
                                        {item.active || !item.path ? (
                                            <span>{item.label}</span>
                                        ) : (
                                            <Link to={item.path} className="text-muted text-hover-primary">
                                                {item.label}
                                            </Link>
                                        )}
                                    </li>
                                </React.Fragment>
                            ))}
                        </ul>
                    )}
                </div>
                
                {/* Actions */}
                <div className="d-flex align-items-center gap-2 gap-lg-3 py-2 py-md-1">
                    {actions}
                </div>
            </div>
        </div>
    );
};

export default Toolbar;

