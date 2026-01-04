import React from 'react';

const InventoryToolbar = ({ 
    onRefresh, 
    loading, 
    onExport,
    onImport,
    selectedCount = 0,
    onBulkDelete,
    onAdd,
    addButtonLabel = 'Add'
}) => {
    return (
        <>
            {/* Bulk Delete Button (shown when items selected) */}
            {selectedCount > 0 && onBulkDelete && (
                <button
                    className="btn btn-sm fw-bold btn-danger me-2"
                    onClick={onBulkDelete}
                    aria-label={`Delete selected items (${selectedCount})`}
                >
                    <i className="ki-duotone ki-trash fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        Delete Selected ({selectedCount})
                    </span>
                </button>
            )}

            {/* Export Button */}
            {onExport && (
                <button
                    className="btn btn-sm fw-bold btn-success me-2"
                    onClick={onExport}
                    disabled={loading}
                    aria-label="Export inventory"
                >
                    <i className="ki-duotone ki-exit-up fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        Export
                    </span>
                </button>
            )}

            {/* Import Button */}
            {onImport && (
                <button
                    className="btn btn-sm fw-bold btn-info me-2"
                    onClick={onImport}
                    disabled={loading}
                    aria-label="Import inventory"
                >
                    <i className="ki-duotone ki-exit-down fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        Import
                    </span>
                </button>
            )}

            {/* Refresh Button - Icon only on all screens */}
            {onRefresh && (
                <button
                    className="btn btn-sm btn-icon btn-light me-2"
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh"
                    aria-label="Refresh inventory"
                >
                    <i className={`ki-duotone ki-arrows-circle fs-3 ${loading ? 'spinner' : ''}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                </button>
            )}

            {/* Add Button */}
            {onAdd && (
                <button
                    className="btn btn-sm fw-bold btn-primary"
                    onClick={onAdd}
                    aria-label={addButtonLabel}
                >
                    <i className="ki-duotone ki-plus fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        {addButtonLabel}
                    </span>
                </button>
            )}
        </>
    );
};

export default InventoryToolbar;

