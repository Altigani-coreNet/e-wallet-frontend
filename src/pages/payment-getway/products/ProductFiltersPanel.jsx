import React, { useCallback } from 'react';
import MerchantCountryFilterFields from '../../../common/filters/MerchantCountryFilterFields';
import { useTranslation } from 'react-i18next';

const ProductFiltersPanel = ({ filters, setFilters, onApply, onReset, merchantsMap = {}, countriesMap = {} }) => {
    const { t } = useTranslation();
    const resolveMerchant = useCallback(
        (id) => merchantsMap[id] || merchantsMap[String(id)] || '',
        [merchantsMap]
    );

    const resolveCountry = useCallback(
        (id) => countriesMap[id] || countriesMap[String(id)] || '',
        [countriesMap]
    );

    return (
        <div className="card mb-5">
            <div className="card-body p-9">
                <div className="row mb-6">
                    {/* Search */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">{t('admin.paymentGetway.searchLabel')}</label>
                        <input
                            type="text"
                            className="form-control form-control-solid"
                            placeholder={t('admin.paymentGetway.productFiltersSearchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => setFilters({ ...filters, merchant_id: value || '' })}
                        onCountryChange={(value) => setFilters({ ...filters, country_id: value || '' })}
                        merchantPlaceholder={t('admin.paymentGetway.cpAllParentPartners')}
                        countryPlaceholder={t('admin.paymentGetway.cpAllCountries')}
                        merchantNameResolver={resolveMerchant}
                        countryNameResolver={resolveCountry}
                    />

                    {/* Status Filter */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">{t('admin.paymentGetway.status')}</label>
                        <select
                            className="form-select form-select-solid"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">{t('admin.paymentGetway.productFiltersAllStatus')}</option>
                            <option value="published">{t('admin.paymentGetway.productFiltersPublished')}</option>
                            <option value="draft">{t('admin.paymentGetway.productFiltersDraft')}</option>
                            <option value="scheduled">{t('admin.paymentGetway.productFiltersScheduled')}</option>
                            <option value="inactive">{t('admin.common.inactive')}</option>
                        </select>
                    </div>
                </div>

                <div className="row mb-6">
                    {/* Date From */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">{t('admin.paymentGetway.cpCreatedFrom')}</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            value={filters.date_from}
                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">{t('admin.paymentGetway.cpCreatedTo')}</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            value={filters.date_to}
                            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end">
                    <button
                        type="reset"
                        className="btn btn-sm btn-light btn-active-light-primary me-2"
                        onClick={onReset}
                    >
                        {t('admin.common.reset')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                        onClick={onApply}
                    >
                        {t('admin.paymentGetway.cpApplyFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductFiltersPanel;
