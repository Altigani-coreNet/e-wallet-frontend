import React from 'react';

const UserGroupFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const handleInputChange = (field, value) => {
        onFilterChange({ [field]: value });
    };

    const hasActiveFilters = filters.search || filters.status || filters.branch_id || filters.date_from || filters.date_to;

    return (
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-body">
                <div className="row">
                    {/* Search */}
                    <div className="col-md-4 mb-3">
                        <label htmlFor="search" className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            id="search"
                            placeholder="Name, Group ID, Description"
                            value={filters.search || ''}
                            onChange={(e) => handleInputChange('search', e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="col-md-4 mb-3">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                            className="form-select"
                            id="status"
                            value={filters.status || ''}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="col-md-4 mb-3">
                        <label htmlFor="date_from" className="form-label">Date From</label>
                        <input
                            type="date"
                            className="form-control"
                            id="date_from"
                            value={filters.date_from || ''}
                            onChange={(e) => handleInputChange('date_from', e.target.value)}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-4 mb-3">
                        <label htmlFor="date_to" className="form-label">Date To</label>
                        <input
                            type="date"
                            className="form-control"
                            id="date_to"
                            value={filters.date_to || ''}
                            onChange={(e) => handleInputChange('date_to', e.target.value)}
                        />
                    </div>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted fs-7">
                            <i className="ki-duotone ki-information fs-5 text-primary me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            Filters apply automatically as you type
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-light-primary"
                            onClick={onClearFilters}
                        >
                            <i className="ki-duotone ki-arrows-circle fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserGroupFilters;

