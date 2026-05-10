import React from 'react';
import { useTranslation } from 'react-i18next';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';

const BranchFiltersPanel = ({ isVisible, filters, onFilterChange, onClearFilters, onApply }) => {
    const { t } = useTranslation();
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const handleMerchantChange = (value) => {
        onFilterChange({ ...filters, merchant_id: value || '' });
    };

    const handleCountryChange = (value) => {
        onFilterChange({ ...filters, country_id: value || '' });
    };

    if (!isVisible) return null;

    return (
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            {/* Card header */}
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('admin.branchesIndex.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        type="button"
                        className="btn btn-sm btn-light-primary"
                        onClick={onClearFilters}
                    >
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('admin.branchesIndex.clearFilters')}
                    </button>
                </div>
            </div>

            {/* Card body */}
            <div className="card-body">
                <div className="row g-4">
                    {/* Search */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">{t('admin.branchesIndex.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            name="search"
                            value={filters.search || ''}
                            onChange={handleInputChange}
                            placeholder={t('admin.branchesIndex.searchPlaceholder')}
                            onKeyPress={(e) => e.key === 'Enter' && onApply()}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">{t('admin.branchesIndex.status')}</label>
                        <select
                            className="form-select"
                            name="status"
                            value={filters.status || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">{t('admin.branchesIndex.allStatuses')}</option>
                            <option value="pending">{t('admin.common.pending')}</option>
                            <option value="approved">{t('admin.common.approved')}</option>
                            <option value="rejected">{t('admin.common.rejected')}</option>
                            <option value="suspended">{t('admin.common.suspended')}</option>
                        </select>
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={handleMerchantChange}
                        onCountryChange={handleCountryChange}
                        merchantPlaceholder={t('admin.branchesIndex.allMerchants')}
                        countryPlaceholder={t('admin.branchesIndex.allCountries')}
                    />

                    {/* Date From */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">{t('admin.branchesIndex.dateFrom')}</label>
                        <input
                            type="date"
                            className="form-control"
                            name="date_from"
                            value={filters.date_from || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">{t('admin.branchesIndex.dateTo')}</label>
                        <input
                            type="date"
                            className="form-control"
                            name="date_to"
                            value={filters.date_to || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {/* Apply Button */}
                <div className="row mt-4">
                    <div className="col-12">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onApply}
                        >
                            <i className="ki-duotone ki-filter fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('admin.branchesIndex.applyFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchFiltersPanel;


