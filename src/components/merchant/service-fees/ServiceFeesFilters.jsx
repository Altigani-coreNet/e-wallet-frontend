import React, { useRef } from 'react';

const ServiceFeesFilters = ({ filters, types = [], onFilterChange, onClear }) => {
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange(prev => ({
            ...prev,
            [name]: value
        }));
        // Filters apply automatically on change - no need for Apply button
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
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-primary"
                        onClick={onClear}
                    >
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="row g-4">
                    {/* Search */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            name="search"
                            placeholder="Search by name, type, description..."
                            value={filters.search || ''}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Type</label>
                        <select
                            className="form-select"
                            name="type"
                            value={filters.type || ''}
                            onChange={handleChange}
                        >
                            <option value="">All Types</option>
                            {types.map((type) => (
                                <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Created Date From</label>
                        <input
                            ref={dateFromRef}
                            type="date"
                            className="form-control"
                            name="date_from"
                            value={filters.date_from || ''}
                            onChange={handleChange}
                            onClick={() => handleDateInputClick(dateFromRef)}
                            onFocus={() => handleDateInputClick(dateFromRef)}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Created Date To</label>
                        <input
                            ref={dateToRef}
                            type="date"
                            className="form-control"
                            name="date_to"
                            value={filters.date_to || ''}
                            onChange={handleChange}
                            onClick={() => handleDateInputClick(dateToRef)}
                            onFocus={() => handleDateInputClick(dateToRef)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceFeesFilters;

