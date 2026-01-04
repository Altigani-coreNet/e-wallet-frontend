import React from 'react';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';

const CustomerFiltersPanel = ({ isVisible, filters, onFilterChange, onClearFilters, onApply }) => {

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
                    <h3 className="fw-bold m-0">Filters</h3>
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
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Card body */}
            <div className="card-body">
                <div className="row g-4">
                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={handleMerchantChange}
                        onCountryChange={handleCountryChange}
                        merchantPlaceholder="All Merchants"
                        countryPlaceholder="All Countries"
                    />

                    {/* Search */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            name="search"
                            value={filters.search || ''}
                            onChange={handleInputChange}
                            placeholder="Search by name, email, phone..."
                            onKeyPress={(e) => e.key === 'Enter' && onApply()}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Status</label>
                        <select
                            className="form-select"
                            name="status"
                            value={filters.status || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Created Date From</label>
                        <input
                            type="date"
                            className="form-control"
                            name="date_from"
                            value={filters.date_from || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Created Date To</label>
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
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerFiltersPanel;


