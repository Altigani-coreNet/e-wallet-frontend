import React from 'react';
import MerchantCountryFilterFields from '../../../common/filters/MerchantCountryFilterFields';

const CityFiltersPanel = ({ searchTerm, onSearchChange, filters, onFiltersChange, onReset }) => {

    const handleFilterChange = (field, value) => {
        onFiltersChange(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label">Search</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Search cities..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label">Status</label>
                        <select className="form-select form-select-sm" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                        onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                        merchantPlaceholder="All Merchants"
                        countryPlaceholder="All Countries"
                        requireMerchant={false}
                        requireCountry={false}
                    />
                </div>
                <div className="d-flex justify-content-end mt-4">
                    <button onClick={onReset} className="btn btn-sm btn-light-primary">
                        <i className="ki-duotone ki-arrows-circle fs-3"><span className="path1"></span><span className="path2"></span></i>
                        Reset Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CityFiltersPanel;

