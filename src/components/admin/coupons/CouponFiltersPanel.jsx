import React from 'react';

const CouponFiltersPanel = ({ filters, setFilters, onApply, onReset }) => {
    return (
        <div className="card mb-5">
            <div className="card-body p-9">
                <div className="row mb-6">
                    {/* Search */}
                    <div className="col-lg-4 mb-4">
                        <label className="form-label fw-bold">Search</label>
                        <input
                            type="text"
                            className="form-control form-control-solid"
                            placeholder="Search by code or name..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

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

export default CouponFiltersPanel;




