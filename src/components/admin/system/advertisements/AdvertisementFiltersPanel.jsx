import React from 'react';
import { useTranslation } from 'react-i18next';
import MerchantCountryFilterFields from '../../../common/filters/MerchantCountryFilterFields';

const AdvertisementFiltersPanel = ({ searchTerm, onSearchChange, filters, onFiltersChange, onReset }) => {
    const { t } = useTranslation();

    const handleFilterChange = (field, value) => {
        onFiltersChange(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.settings.advertisements.filterSearch')}</label>
                        <input type="text" className="form-control form-control-sm" placeholder={t('admin.settings.advertisements.searchPlaceholder')} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.settings.advertisements.filterStatus')}</label>
                        <select className="form-select form-select-sm" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                            <option value="">{t('admin.settings.advertisements.filterAllStatuses')}</option>
                            <option value="active">{t('admin.common.active')}</option>
                            <option value="inactive">{t('admin.common.inactive')}</option>
                        </select>
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                        onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                        merchantLabel={t('admin.settings.advertisements.merchantLabel')}
                        countryLabel={t('admin.settings.advertisements.countryLabel')}
                        merchantPlaceholder={t('admin.settings.advertisements.allMerchants')}
                        countryPlaceholder={t('admin.settings.advertisements.allCountries')}
                        requireMerchant={false}
                        requireCountry={false}
                        merchantSearchPlaceholder={t('admin.settings.advertisements.merchantSearchPlaceholder')}
                        countrySearchPlaceholder={t('admin.settings.advertisements.countrySearchPlaceholder')}
                    />

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.settings.advertisements.filterFromDate')}</label>
                        <input type="date" className="form-control form-control-sm" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.settings.advertisements.filterToDate')}</label>
                        <input type="date" className="form-control form-control-sm" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                    <button type="button" onClick={onReset} className="btn btn-sm btn-light-primary">
                        <i className="ki-duotone ki-arrows-circle fs-3"><span className="path1"></span><span className="path2"></span></i>
                        {t('admin.settings.clearFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvertisementFiltersPanel;
