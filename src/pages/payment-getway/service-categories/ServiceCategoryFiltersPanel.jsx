import React from 'react';

const ServiceCategoryFiltersPanel = ({ 
    filters, 
    setFilters, 
    onApply, 
    onReset 
}) => {
    return (
        <div className="card mb-5">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">Filters</h3>
                </div>
            </div>
            <div className="card-body pt-0">
                <div className="row g-4">
                    <div className="col-md-4">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select form-select-solid"
                            value={filters.is_active ?? ''}
                            onChange={(e) => setFilters({ ...filters, is_active: e.target.value === '' ? null : e.target.value === 'true' })}
                        >
                            <option value="">All</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div className="col-md-8 d-flex align-items-end gap-2">
                        <button
                            className="btn btn-primary"
                            onClick={onApply}
                        >
                            Apply Filters
                        </button>
                        <button
                            className="btn btn-light"
                            onClick={onReset}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCategoryFiltersPanel;

