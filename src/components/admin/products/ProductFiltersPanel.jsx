import React, { useCallback } from 'react';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';

const ProductFiltersPanel = ({ filters, setFilters, onApply, onReset, merchantsMap = {}, countriesMap = {} }) => {
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
                        <label className="form-label fw-bold">Search</label>
                        <input
                            type="text"
                            className="form-control form-control-solid"
                            placeholder="Search by name, SKU, code..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => setFilters({ ...filters, merchant_id: value || '' })}
                        onCountryChange={(value) => setFilters({ ...filters, country_id: value || '' })}
                        merchantPlaceholder="All Merchants"
                        countryPlaceholder="All Countries"
                        merchantNameResolver={resolveMerchant}
                        countryNameResolver={resolveCountry}
                    />

                    {/* Status Filter */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">Status</label>
                        <select
                            className="form-select form-select-solid"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="row mb-6">
                    {/* Date From */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">Date From</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            value={filters.date_from}
                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-lg-3 mb-4">
                        <label className="form-label fw-bold">Date To</label>
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
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                        onClick={onApply}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductFiltersPanel;
