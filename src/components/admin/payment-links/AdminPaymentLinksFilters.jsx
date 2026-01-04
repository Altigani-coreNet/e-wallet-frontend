import React, { useCallback } from 'react';
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
                    <h3 className="card-label">Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        onClick={onClear}
                        className="btn btn-sm btn-light me-2"
                    >
                        Reset
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
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Customer Name</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by customer name"
                            value={filters.customer}
                            onChange={(e) => handleFilterChange('customer', e.target.value)}
                        />
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                        onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                        merchantPlaceholder="All Merchants"
                        countryPlaceholder="All Countries"
                        merchantNameResolver={resolveMerchant}
                        countryNameResolver={resolveCountry}
                        merchantWrapperClassName="col-md-3"
                        countryWrapperClassName="col-md-3"
                    />

                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.from_date}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
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
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPaymentLinksFilters;

