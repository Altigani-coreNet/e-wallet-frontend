import React from 'react';
import { useTranslation } from 'react-i18next';
import MerchantCountryFilterFields from '../../../common/filters/MerchantCountryFilterFields';

const CityFiltersPanel = ({ searchTerm, onSearchChange, filters, onFiltersChange, onReset }) => {
    const { t } = useTranslation();

    const handleFilterChange = (field, value) => {
        onFiltersChange(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label">{t('admin.common.search')}</label>
                        <input type="text" className="form-control form-control-sm" placeholder={t('admin.citiesIndex.filterSearchPlaceholder')} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label">{t('admin.common.status')}</label>
                        <select className="form-select form-select-sm" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                            <option value="">{t('admin.citiesIndex.allStatuses')}</option>
                            <option value="1">{t('admin.common.active')}</option>
                            <option value="0">{t('admin.common.inactive')}</option>
                        </select>
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                        onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                        merchantPlaceholder={t('admin.citiesIndex.allMerchants')}
                        countryPlaceholder={t('admin.citiesIndex.allCountries')}
                        requireMerchant={false}
                        requireCountry={false}
                    />
                </div>
                <div className="d-flex justify-content-end mt-4">
                    <button onClick={onReset} className="btn btn-sm btn-light-primary">
                        <i className="ki-duotone ki-arrows-circle fs-3"><span className="path1"></span><span className="path2"></span></i>
                        {t('admin.citiesIndex.resetFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CityFiltersPanel;
