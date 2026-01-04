import React from 'react';

/**
 * Reusable Bulk Action Bar Component
 * Shows selection count and provides actions for selected items
 */
const BulkActionBar = ({ selectedCount, onClear, onDelete, deleteLabel = 'Delete Selected' }) => {
    if (selectedCount === 0) return null;

    return (
        <div className="d-flex justify-content-end align-items-center" data-kt-customer-table-toolbar="selected">
            <div className="fw-bold me-5">
                <span className="me-2">{selectedCount}</span>
                Selected
            </div>
            {onClear && (
                <button
                    type="button"
                    className="btn btn-sm btn-light me-2"
                    onClick={onClear}
                >
                    <i className="ki-duotone ki-cross fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Clear Selection
                </button>
            )}
            {onDelete && (
                <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={onDelete}
                >
                    <i className="ki-duotone ki-trash fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    {deleteLabel}
                </button>
            )}
        </div>
    );
};

export default BulkActionBar;


