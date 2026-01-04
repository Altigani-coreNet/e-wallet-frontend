import React from 'react';

const PlanFiltersPanel = ({ filters, setFilters, onApply }) => {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({
            search: '',
            plan_type: '',
            status: '',
            has_discount: ''
        });
    };

    return (
        <div className="card mb-5">
            <div className="card-header">
                <div className="card-title">
                    <h3 className="card-label">Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        type="button"
                        className="btn btn-sm btn-light-danger"
                        onClick={handleReset}
                    >
                        <i className="ki-duotone ki-trash fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        Reset
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-3">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or description"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Plan Type</label>
                        <select
                            className="form-select"
                            value={filters.plan_type}
                            onChange={(e) => handleFilterChange('plan_type', e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Onetime">Onetime</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Has Discount</label>
                        <select
                            className="form-select"
                            value={filters.has_discount}
                            onChange={(e) => handleFilterChange('has_discount', e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="1">Yes</option>
                            <option value="0">No</option>
                        </select>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-12">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onApply}
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanFiltersPanel;
