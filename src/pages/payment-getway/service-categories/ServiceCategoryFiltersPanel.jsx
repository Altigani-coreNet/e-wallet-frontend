import React from 'react';
import { useTranslation } from 'react-i18next';

const ServiceCategoryFiltersPanel = ({ 
    filters, 
    setFilters, 
    onApply, 
    onReset 
}) => {
    const { t } = useTranslation();
    return (
        <div className="card mb-5">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('admin.plansIndex.filters')}</h3>
                </div>
            </div>
            <div className="card-body pt-0">
                <div className="row g-4">
                    <div className="col-md-4">
                        <label className="form-label">{t('admin.plansIndex.status')}</label>
                        <select
                            className="form-select form-select-solid"
                            value={filters.is_active ?? ''}
                            onChange={(e) => setFilters({ ...filters, is_active: e.target.value === '' ? null : e.target.value === 'true' })}
                        >
                            <option value="">{t('admin.plansIndex.all')}</option>
                            <option value="true">{t('admin.plansIndex.active')}</option>
                            <option value="false">{t('admin.plansIndex.inactive')}</option>
                        </select>
                    </div>
                    <div className="col-md-8 d-flex align-items-end gap-2">
                        <button
                            className="btn btn-primary"
                            onClick={onApply}
                        >
                            {t('admin.plansIndex.applyFilters')}
                        </button>
                        <button
                            className="btn btn-light"
                            onClick={onReset}
                        >
                            {t('admin.plansIndex.reset')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCategoryFiltersPanel;

