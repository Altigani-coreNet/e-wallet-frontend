import React from 'react';
import { useTranslation } from 'react-i18next';

const CountryFiltersPanel = ({ searchTerm, onSearchChange, statusFilter, onStatusChange, onReset }) => {
    const { t } = useTranslation();

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">{t('admin.common.search')}</label>
                        <input type="text" className="form-control form-control-sm" placeholder={t('admin.countriesIndex.filterSearchPlaceholder')} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">{t('admin.common.status')}</label>
                        <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
                            <option value="">{t('admin.countriesIndex.allStatuses')}</option>
                            <option value="1">{t('admin.common.active')}</option>
                            <option value="0">{t('admin.common.inactive')}</option>
                        </select>
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                    <button onClick={onReset} className="btn btn-sm btn-light-primary">
                        <i className="ki-duotone ki-arrows-circle fs-3"><span className="path1"></span><span className="path2"></span></i>
                        {t('admin.countriesIndex.resetFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CountryFiltersPanel;
