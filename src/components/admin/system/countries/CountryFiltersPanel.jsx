import React from 'react';

const CountryFiltersPanel = ({ searchTerm, onSearchChange, statusFilter, onStatusChange, onReset }) => {
    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Search</label>
                        <input type="text" className="form-control form-control-sm" placeholder="Search countries..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
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

export default CountryFiltersPanel;

