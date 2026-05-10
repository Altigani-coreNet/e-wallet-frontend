import React from 'react';
import { useTranslation } from 'react-i18next';

const PlanFiltersPanel = ({ filters, setFilters, onApply }) => {
    const { t } = useTranslation();
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({
            search: '',
            plan_type: '',
            status: '',
            has_discount: ''
        });
    };

    return (
        <div className="card mb-5">
            <div className="card-header">
                <div className="card-title">
                    <h3 className="card-label">{t('admin.plansIndex.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        type="button"
                        className="btn btn-sm btn-light-danger"
                        onClick={handleReset}
                    >
                        <i className="ki-duotone ki-trash fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        {t('admin.plansIndex.reset')}
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.plansIndex.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('admin.plansIndex.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.plansIndex.planType')}</label>
                        <select
                            className="form-select"
                            value={filters.plan_type}
                            onChange={(e) => handleFilterChange('plan_type', e.target.value)}
                        >
                            <option value="">{t('admin.plansIndex.allTypes')}</option>
                            <option value="Onetime">{t('admin.plansIndex.onetime')}</option>
                            <option value="Weekly">{t('admin.plansIndex.weekly')}</option>
                            <option value="Monthly">{t('admin.plansIndex.monthly')}</option>
                            <option value="Yearly">{t('admin.plansIndex.yearly')}</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.plansIndex.status')}</label>
                        <select
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">{t('admin.plansIndex.allStatuses')}</option>
                            <option value="1">{t('admin.plansIndex.active')}</option>
                            <option value="0">{t('admin.plansIndex.inactive')}</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.plansIndex.hasDiscount')}</label>
                        <select
                            className="form-select"
                            value={filters.has_discount}
                            onChange={(e) => handleFilterChange('has_discount', e.target.value)}
                        >
                            <option value="">{t('admin.plansIndex.all')}</option>
                            <option value="1">{t('admin.plansIndex.yes')}</option>
                            <option value="0">{t('admin.plansIndex.no')}</option>
                        </select>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-12">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onApply}
                        >
                            {t('admin.plansIndex.applyFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanFiltersPanel;
