import React from 'react';
import { Link } from 'react-router-dom';

const CustomerToolbar = ({ 
    onRefresh, 
    loading, 
    onToggleFilters,
    onExport,
    onImport,
    selectedCount = 0,
    onBulkDelete,
    basePath = '/merchant'
}) => {
    return (
        <>
            {/* Filter Button */}
            <button
                className="btn btn-sm btn-flex btn-secondary fw-bold me-2"
                onClick={onToggleFilters}
            >
                <i className="ki-duotone ki-filter fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Filter</span>
            </button>

            {/* Bulk Delete Button (shown when items selected) */}
            {selectedCount > 0 && (
                <button
                    className="btn btn-sm fw-bold btn-danger me-2"
                    onClick={onBulkDelete}
                >
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Delete Selected ({selectedCount})</span>
                </button>
            )}

            {/* Export Button */}
            <button
                className="btn btn-sm fw-bold btn-success me-2"
                onClick={onExport}
                disabled={loading}
            >
                <i className="ki-duotone ki-exit-up fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Export</span>
            </button>

            {/* Import Button */}
            <button
                className="btn btn-sm fw-bold btn-info me-2"
                onClick={onImport}
                disabled={loading}
            >
                <i className="ki-duotone ki-exit-down fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Import</span>
            </button>

            {/* Refresh Button - Icon only on all screens */}
            <button
                className="btn btn-sm btn-icon btn-light me-2"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh"
            >
                <i className={`ki-duotone ki-arrows-circle fs-3 ${loading ? 'spinner' : ''}`}>
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {/* Add Customer Button */}
            <Link
                to={`${basePath}/customers/create`}
                className="btn btn-sm fw-bold btn-primary"
            >
                <i className="ki-duotone ki-plus fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Add Customer</span>
            </Link>
        </>
    );
};

export default CustomerToolbar;

