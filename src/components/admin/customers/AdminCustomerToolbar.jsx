import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminCustomerToolbar = ({
    onRefresh,
    loading,
    onToggleFilters,
    onExport,
    onImport,
    selectedCount = 0,
    onBulkDelete,
    canCreate = false,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <button
                className="btn btn-sm btn-flex btn-secondary fw-bold me-2"
                onClick={onToggleFilters}
            >
                <i className="ki-duotone ki-filter fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">{t('customers.filter')}</span>
            </button>

            {selectedCount > 0 && onBulkDelete && (
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
                    <span className="d-none d-md-inline ms-1">
                        {t('common.deleteSelected', { count: selectedCount })}
                    </span>
                </button>
            )}

            {onExport && (
                <button
                    className="btn btn-sm fw-bold btn-success me-2"
                    onClick={onExport}
                    disabled={loading}
                >
                    <i className="ki-duotone ki-exit-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('common.export')}</span>
                </button>
            )}

            <button
                className="btn btn-sm fw-bold btn-info me-2"
                onClick={onImport}
                disabled={loading}
            >
                <i className="ki-duotone ki-exit-down fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">{t('common.import')}</span>
            </button>

            <button
                className="btn btn-sm btn-icon btn-light me-2"
                onClick={onRefresh}
                disabled={loading}
                title={t('common.refresh')}
            >
                <i className={`ki-duotone ki-arrows-circle fs-3 ${loading ? 'spinner' : ''}`}>
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {canCreate && (
                <Link to="/admin/customers/create" className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('customers.addCustomer')}</span>
                </Link>
            )}
        </>
    );
};

export default AdminCustomerToolbar;
