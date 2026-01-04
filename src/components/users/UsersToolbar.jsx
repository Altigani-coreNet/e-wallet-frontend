import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCan } from '../../utils/permissions';

const UsersToolbar = ({ onRefresh, loading, basePath = '/sales', onToggleFilters, onImport, onExport }) => {
    // Initialize KTMenu for filter dropdown
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
            {/* Filter Toggle Button */}
            {onToggleFilters && (
                <button 
                    onClick={onToggleFilters}
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Filter</span>
                </button>
            )}

            {/* Export Button */}
            {onExport && (
                <button 
                    className="btn btn-sm btn-flex btn-light-success fw-bold"
                    onClick={onExport}
                    disabled={loading}
                    title="Export Users to Excel"
                >
                    <i className="ki-duotone ki-file-down fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Export</span>
                </button>
            )}

            {/* Import Button */}
            {onImport && (
                <button 
                    className="btn btn-sm btn-flex btn-light-primary fw-bold"
                    onClick={onImport}
                    disabled={loading}
                    title="Import Users"
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Import</span>
                </button>
            )}
            
            {/* Refresh Button - Icon only */}
            <button 
                className="btn btn-sm btn-icon btn-light" 
                onClick={onRefresh}
                disabled={loading}
                title="Refresh"
            >
                <i className={`ki-duotone ki-arrows-circle fs-3 ${loading ? 'spinner' : ''}`}>
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>
            
            {/* Add User Button */}
            {canCreate && (
                <Link 
                    to={`${basePath}/users/create`}
                    className="btn btn-sm fw-bold btn-primary"
                >
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Add User</span>
                </Link>
            )}
        </div>
    );
};

export default UsersToolbar;

