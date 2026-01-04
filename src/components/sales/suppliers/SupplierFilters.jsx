import React from 'react';

const SupplierFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    return (
        <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
                <div className="card-title">
                    <h3 className="card-label">Supplier Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-danger" 
                        onClick={onClearFilters}
                    >
                        <i className="ki-duotone ki-trash">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        Reset
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-4">
                    <div className="col-md-4">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            name="search"
                            className="form-control form-control-solid"
                            placeholder="Name, email, phone..."
                            value={filters.search || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <input
                            type="text"
                            name="country"
                            className="form-control form-control-solid"
                            placeholder="Filter by country"
                            value={filters.country || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">City</label>
                        <input
                            type="text"
                            name="city"
                            className="form-control form-control-solid"
                            placeholder="Filter by city"
                            value={filters.city || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierFilters;

