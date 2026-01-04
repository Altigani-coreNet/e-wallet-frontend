import React, { useState, useEffect } from 'react';
import { getCustomerGroups } from '../../../services/customersService';

const CustomerFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const [customerGroups, setCustomerGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Fetch customer groups on mount
    useEffect(() => {
        const fetchCustomerGroups = async () => {
            setLoadingGroups(true);
            try {
                const response = await getCustomerGroups();
                if (response.success) {
                    setCustomerGroups(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                console.error('Error fetching customer groups:', error);
            } finally {
                setLoadingGroups(false);
            }
        };

        fetchCustomerGroups();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    {/* Search */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold fs-6">Search</label>
                        <input
                            type="text"
                            name="search"
                            className="form-control form-control-solid"
                            placeholder="Search by name, email, phone..."
                            value={filters.search || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Customer Group */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold fs-6">Customer Group</label>
                        <select
                            name="customer_group_id"
                            className="form-select form-select-solid"
                            value={filters.customer_group_id || ''}
                            onChange={handleInputChange}
                            disabled={loadingGroups}
                        >
                            <option value="">All Groups</option>
                            {customerGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Country */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold fs-6">Country</label>
                        <input
                            type="text"
                            name="country"
                            className="form-control form-control-solid"
                            placeholder="Filter by country..."
                            value={filters.country || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Date From */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold fs-6">Date From</label>
                        <input
                            type="date"
                            name="date_from"
                            className="form-control form-control-solid"
                            value={filters.date_from || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold fs-6">Date To</label>
                        <input
                            type="date"
                            name="date_to"
                            className="form-control form-control-solid"
                            value={filters.date_to || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="col-md-4 d-flex align-items-end">
                        <button
                            type="button"
                            className="btn btn-light btn-active-light-primary me-2"
                            onClick={onClearFilters}
                        >
                            <i className="ki-duotone ki-arrows-circle fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerFilters;

