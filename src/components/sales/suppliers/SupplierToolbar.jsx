import React from 'react';
import { Link } from 'react-router-dom';

const SupplierToolbar = ({ 
    onRefresh, 
    loading, 
    basePath,
    onToggleFilters,
    onExport,
    selectedCount,
    onBulkDelete
}) => {
    return (
        <div className="d-flex align-items-center gap-2 gap-lg-3">
            {/* Filter Button */}
            <button 
                className="btn btn-sm btn-flex btn-secondary fw-bold" 
                onClick={onToggleFilters}
            >
                <i className="ki-duotone ki-filter fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Filter</span>
            </button>

            {/* Export Button */}
            <button 
                className="btn btn-sm btn-flex btn-success fw-bold" 
                onClick={onExport}
            >
                <i className="ki-duotone ki-exit-up fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Export</span>
            </button>

            {/* Bulk Delete Button */}
            {selectedCount > 0 && (
                <button 
                    className="btn btn-sm btn-flex btn-danger fw-bold" 
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

            {/* Refresh Button - Icon only */}
            <button 
                className="btn btn-sm btn-icon btn-light" 
                onClick={onRefresh}
                disabled={loading}
                title="Refresh"
            >
                <i className="ki-duotone ki-arrows-circle fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {/* Add Supplier Button */}
            <Link 
                to={`${basePath}/suppliers/create`} 
                className="btn btn-sm fw-bold btn-primary"
            >
                <i className="ki-duotone ki-plus fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Add Supplier</span>
            </Link>
        </div>
    );
};

export default SupplierToolbar;

