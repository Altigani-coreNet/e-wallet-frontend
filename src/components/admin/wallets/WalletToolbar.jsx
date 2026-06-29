import React from 'react';
import { useTranslation } from 'react-i18next';

const WalletToolbar = ({ onRefresh, loading, onToggleFilters, onExport }) => {
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
                <span className="d-none d-md-inline ms-1">{t('common.filter')}</span>
            </button>

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
        </>
    );
};

export default WalletToolbar;
