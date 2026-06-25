import React from 'react';
import { useTranslation } from 'react-i18next';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';

const CustomerFiltersPanel = ({ filters, onFilterChange, onClearFilters }) => {
    const { t } = useTranslation();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    const handleCountryChange = (value) => {
        onFilterChange({ country_id: value || '' });
    };

    return (
        <div className="card mb-5">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('customers.filter')}</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        type="button"
                        className="btn btn-sm btn-light-primary"
                        onClick={onClearFilters}
                    >
                        <i className="ki-duotone ki-arrows-circle fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('customers.clear')}
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="row g-4">
                    <MerchantCountryFilterFields
                        hideMerchant
                        merchantValue=""
                        countryValue={filters.country_id}
                        onMerchantChange={() => {}}
                        onCountryChange={handleCountryChange}
                        countryPlaceholder={t('admin.customers.allCountries')}
                    />
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('customers.search')}</label>
                        <input
                            type="text"
                            className="form-control form-control-solid"
                            name="search"
                            value={filters.search || ''}
                            onChange={handleInputChange}
                            placeholder={t('customers.searchByNameEmailPhone')}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('common.status')}</label>
                        <select
                            className="form-select form-select-solid"
                            name="status"
                            value={filters.status || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">{t('admin.customers.allStatuses')}</option>
                            <option value="pending">{t('customers.pending')}</option>
                            <option value="active">{t('customers.active')}</option>
                            <option value="suspended">{t('customers.suspended')}</option>
                            <option value="inactive">{t('customers.inactive')}</option>
                        </select>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('customers.dateFrom')}</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            name="date_from"
                            value={filters.date_from || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('customers.dateTo')}</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            name="date_to"
                            value={filters.date_to || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerFiltersPanel;
