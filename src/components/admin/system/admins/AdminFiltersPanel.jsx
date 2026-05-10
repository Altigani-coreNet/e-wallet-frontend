import React from 'react';
import { useTranslation } from 'react-i18next';
import MerchantCountryFilterFields from '../../../common/filters/MerchantCountryFilterFields';

const AdminFiltersPanel = ({ filters, searchTerm, onSearchChange, onFiltersChange, onReset }) => {
    const { t } = useTranslation();

    const handleFilterChange = (field, value) => {
        onFiltersChange(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.adminsIndex.search')}</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('admin.adminsIndex.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.adminsIndex.status')}</label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">{t('admin.adminsIndex.allStatuses')}</option>
                            <option value="active">{t('admin.adminsIndex.active')}</option>
                            <option value="inactive">{t('admin.adminsIndex.inactive')}</option>
                        </select>
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                        onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                        merchantPlaceholder={t('admin.adminsIndex.allMerchants')}
                        countryPlaceholder={t('admin.adminsIndex.allCountries')}
                        requireMerchant={false}
                        requireCountry={false}
                        showFlags
                    />

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.adminsIndex.fromDate')}</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.from_date}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.adminsIndex.toDate')}</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.to_date}
                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                        />
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                    <button onClick={onReset} className="btn btn-sm btn-light-primary">
                        <i className="ki-duotone ki-arrows-circle fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('admin.adminsIndex.resetFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminFiltersPanel;

