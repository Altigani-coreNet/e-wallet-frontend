import React from 'react';

const CurrencyFiltersPanel = ({ searchTerm, onSearchChange, filters, onFiltersChange, onReset }) => {
    return (
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button type="button" className="btn btn-sm btn-light-primary" onClick={onReset}>
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
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Search</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by country, name, or code"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Start Date</label>
                        <input 
                            type="date" 
                            className="form-control"
                            value={filters.date_from || ''}
                            onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
                        />
                    </div>
                    
                    <div className="col-md-4">
                        <label className="form-label fw-bold">End Date</label>
                        <input 
                            type="date" 
                            className="form-control"
                            value={filters.date_to || ''}
                            onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrencyFiltersPanel;


