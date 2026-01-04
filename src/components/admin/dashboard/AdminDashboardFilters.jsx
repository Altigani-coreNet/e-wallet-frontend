import React from 'react';

const AdminDashboardFilters = ({ filters, onFilterChange, onApplyFilters, onClearFilters, isCollapsed }) => {
    if (isCollapsed) return null;

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">Date From</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.datetime_from}
                            onChange={(e) => onFilterChange({ datetime_from: e.target.value })}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Date To</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.datetime_to}
                            onChange={(e) => onFilterChange({ datetime_to: e.target.value })}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Transaction Status</label>
                        <select
                            className="form-select"
                            value={filters.transaction_status}
                            onChange={(e) => onFilterChange({ transaction_status: e.target.value })}
                        >
                            <option value="">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="declined">Declined</option>
                            <option value="pending">Pending</option>
                        </select>
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



