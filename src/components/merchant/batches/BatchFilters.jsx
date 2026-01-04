import React, { useRef } from 'react';

const BatchFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    const handleDateInputClick = (ref) => {
        if (ref && ref.current) {
            // Try to use the showPicker() method if available (modern browsers)
            if (ref.current.showPicker && typeof ref.current.showPicker === 'function') {
                ref.current.showPicker().catch((err) => {
                    // Fallback: if showPicker fails, just focus the input
                    ref.current.focus();
                });
            } else {
                // Fallback for browsers that don't support showPicker()
                ref.current.focus();
                // For some browsers, we need to trigger click after focus
                setTimeout(() => {
                    ref.current.click();
                }, 10);
            }
        }
    };

    return (
        <div className="card bg-white card-xl-stretch mb-5">
            <div className="card-body">
                <div className="row">
                    {/* Search */}
                    <div className="col-md-3">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            name="search"
                            className="form-control form-control-sm"
                            placeholder="Search by batch number..."
                            value={filters.search || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Status */}
                    <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select
                            name="status"
                            className="form-select form-select-sm"
                            value={filters.status || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">All</option>
                            <option value="settled">Settled</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input
                            ref={fromDateRef}
                            type="date"
                            name="from_date"
                            className="form-control form-control-sm"
                            value={filters.from_date || ''}
                            onChange={handleInputChange}
                            onClick={() => handleDateInputClick(fromDateRef)}
                            onFocus={() => handleDateInputClick(fromDateRef)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <input
                            ref={toDateRef}
                            type="date"
                            name="to_date"
                            className="form-control form-control-sm"
                            value={filters.to_date || ''}
                            onChange={handleInputChange}
                            onClick={() => handleDateInputClick(toDateRef)}
                            onFocus={() => handleDateInputClick(toDateRef)}
                        />
                    </div>
                </div>

                {/* Filter Summary and Clear Button */}
                <div className="row mt-3">
                    <div className="col-8">
                        {(filters.search || filters.status || filters.from_date || filters.to_date) && (
                            <div className="text-muted fs-7">
                                <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <span>
                                    {[
                                        filters.search && `Search: "${filters.search}"`,
                                        filters.status && `Status: ${filters.status}`,
                                        filters.from_date && `From: ${filters.from_date}`,
                                        filters.to_date && `To: ${filters.to_date}`
                                    ].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="col-4 text-end">
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={onClearFilters}
                        >
                            <i className="ki-duotone ki-filter-remove fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchFilters;

