import React from 'react';
import { useTranslation } from 'react-i18next';

const CurrencyFiltersPanel = ({ searchTerm, onSearchChange, filters, onFiltersChange, onReset }) => {
    const { t } = useTranslation();

    return (
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('admin.settings.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button type="button" className="btn btn-sm btn-light-primary" onClick={onReset}>
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('admin.settings.clearFilters')}
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-4">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.common.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('admin.settings.currencies.filterSearchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.settings.fromDate')}</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.date_from || ''}
                            onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.settings.toDate')}</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.date_to || ''}
                            onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrencyFiltersPanel;
