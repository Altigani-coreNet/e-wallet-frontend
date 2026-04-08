import React from 'react';

const AdminDashboardFilters = ({ filters, onFilterChange, onApplyFilters, onClearFilters, isCollapsed }) => {
    if (isCollapsed) return null;

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3 align-items-end">
                    <div className="col-6">
                        <label className="form-label">From date &amp; time</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            step="60"
                            value={filters.datetime_from}
                            onChange={(e) => onFilterChange({ datetime_from: e.target.value })}
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label">To date &amp; time</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            step="60"
                            value={filters.datetime_to}
                            onChange={(e) => onFilterChange({ datetime_to: e.target.value })}
                        />
                    </div>
                    <div className="col-12 d-flex gap-2 justify-content-end">
                        <button className="btn btn-secondary" onClick={onClearFilters}>
                            Clear Filters
                        </button>
                        <button className="btn btn-primary" onClick={onApplyFilters}>
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardFilters;



