import React, { useRef } from 'react';

const PaymentLinksFilters = ({ filters, setFilters, onApply, onClear, onClose }) => {
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
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
        <div className="card mb-5">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="card-label">Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button
                        onClick={onClear}
                        className="btn btn-sm btn-light me-2"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-icon btn-active-color-primary"
                    >
                        <i className="ki-duotone ki-cross fs-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                </div>
            </div>
            <div className="card-body pt-0">
                <div className="row g-3 align-items-end">
                    {/* Search */}
                    <div className="col-md-3">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    {/* Customer */}
                    <div className="col-md-3">
                        <label className="form-label">Customer Name</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by customer name"
                            value={filters.customer}
                            onChange={(e) => handleFilterChange('customer', e.target.value)}
                        />
                    </div>

                    {/* From Date */}
                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input
                            ref={fromDateRef}
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.from_date || ''}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                            onClick={() => handleDateInputClick(fromDateRef)}
                            onFocus={() => handleDateInputClick(fromDateRef)}
                        />
                    </div>

                    {/* To Date */}
                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <input
                            ref={toDateRef}
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.to_date || ''}
                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                            onClick={() => handleDateInputClick(toDateRef)}
                            onFocus={() => handleDateInputClick(toDateRef)}
                        />
                    </div>

                    {/* Apply Button */}
                    <div className="col-md-12">
                        <button
                            onClick={onApply}
                            className="btn btn-sm btn-primary"
                        >
                            <i className="ki-duotone ki-search-list fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentLinksFilters;

