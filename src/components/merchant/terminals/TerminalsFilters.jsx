import React, { useRef } from 'react';

const TerminalsFilters = ({ filters, setFilters, onClear, onClose }) => {
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    const handleChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
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
        <div className="card card-flush mb-5">
            <div className="card-header">
                <h3 className="card-title">Filters</h3>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-primary me-2"
                        onClick={onClear}
                    >
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Clear Filters
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-sm btn-icon btn-active-light-primary"
                        onClick={onClose}
                    >
                        <i className="ki-duotone ki-cross fs-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-5">
                    {/* Search */}
                    <div className="col-md-6">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search terminals..."
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={filters.status || ''}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="col-md-6">
                        <label className="form-label">Date From</label>
                        <input
                            ref={dateFromRef}
                            type="date"
                            className="form-control"
                            value={filters.date_from || ''}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                            onClick={() => handleDateInputClick(dateFromRef)}
                            onFocus={() => handleDateInputClick(dateFromRef)}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-6">
                        <label className="form-label">Date To</label>
                        <input
                            ref={dateToRef}
                            type="date"
                            className="form-control"
                            value={filters.date_to || ''}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                            onClick={() => handleDateInputClick(dateToRef)}
                            onFocus={() => handleDateInputClick(dateToRef)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalsFilters;

