import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Reusable Bulk Action Bar Component
 * Shows selection count and provides actions for selected items
 */
const BulkActionBar = ({ selectedCount, onClear, onDelete, deleteLabel }) => {
    const { t } = useTranslation();
    const resolvedDeleteLabel = deleteLabel ?? t('admin.common.bulkDeleteSelected');

    if (selectedCount === 0) return null;

    return (
        <div className="d-flex justify-content-end align-items-center" data-kt-customer-table-toolbar="selected">
            <div className="fw-bold me-5">
                {t('admin.common.bulkSelected', { count: selectedCount })}
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
                    {t('admin.common.bulkClearSelection')}
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
                    {resolvedDeleteLabel}
                </button>
            )}
        </div>
    );
};

export default BulkActionBar;


