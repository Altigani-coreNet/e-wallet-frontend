import React from 'react';
import MerchantCountryFilterFields from '../../../common/filters/MerchantCountryFilterFields';

const AdvertisementFiltersPanel = ({ searchTerm, onSearchChange, filters, onFiltersChange, onReset }) => {

    const handleFilterChange = (field, value) => {
        onFiltersChange(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">Search</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Search advertisements..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select className="form-select form-select-sm" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
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

                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input type="date" className="form-control form-control-sm" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <input type="date" className="form-control form-control-sm" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
                    </div>
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

export default AdvertisementFiltersPanel;

