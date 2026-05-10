import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';

const AdminPaymentLinksFilters = ({
    filters,
    setFilters,
    onApply,
    onClear,
    onClose,
    merchantsMap = {},
    countriesMap = {},
}) => {
    const { t } = useTranslation();
    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

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
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="card-label">{t('admin.paymentLinksIndex.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        onClick={onClear}
                        className="btn btn-sm btn-light me-2"
                    >
                        {t('admin.paymentLinksIndex.reset')}
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-icon btn-active-color-primary"
                    >
                        <i className="ki-duotone ki-cross fs-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                </div>
            </div>
            <div className="card-body pt-0">
                <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.paymentLinksIndex.search')}</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('admin.paymentLinksIndex.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.paymentLinksIndex.customerName')}</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('admin.paymentLinksIndex.customerPlaceholder')}
                            value={filters.customer}
                            onChange={(e) => handleFilterChange('customer', e.target.value)}
                        />
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                        onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                        merchantPlaceholder={t('admin.paymentLinksIndex.allMerchants')}
                        countryPlaceholder={t('admin.paymentLinksIndex.allCountries')}
                        merchantNameResolver={resolveMerchant}
                        countryNameResolver={resolveCountry}
                        merchantWrapperClassName="col-md-3"
                        countryWrapperClassName="col-md-3"
                    />

                    <div className="col-md-3">
                        <label className="form-label">{t('admin.paymentLinksIndex.fromDate')}</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.from_date}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.paymentLinksIndex.toDate')}</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.to_date}
                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                        />
                    </div>
                    <div className="col-md-12">
                        <button
                            onClick={onApply}
                            className="btn btn-sm btn-primary"
                        >
                            <i className="ki-duotone ki-search-list fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            {t('admin.paymentLinksIndex.applyFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPaymentLinksFilters;

