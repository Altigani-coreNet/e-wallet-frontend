import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getTranslatedText } from '../../../utils/helpers';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';

const TerminalGroupFiltersPanel = ({ 
    isVisible, 
    filters, 
    onFilterChange, 
    onClearFilters, 
    onApply,
    merchantsMap = {},
    countriesMap = {},
}) => {
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    useEffect(() => {
        if (filters.merchant_id) {
            fetchBranches(filters.merchant_id);
        } else {
            setBranches([]);
            // Clear branch_id when merchant is cleared
            if (filters.branch_id) {
                onFilterChange({ ...filters, branch_id: '' });
            }
        }
    }, [filters.merchant_id]);

    const fetchBranches = async (merchantId) => {
        setLoadingBranches(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCHES, {
                params: { merchant_id: merchantId, per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success || response.data.status) {
                setBranches(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const resolveMerchant = useCallback(
        (id) => merchantsMap[id] || merchantsMap[String(id)] || '',
        [merchantsMap]
    );

    const resolveCountry = useCallback(
        (id) => countriesMap[id] || countriesMap[String(id)] || '',
        [countriesMap]
    );

    if (!isVisible) return null;

    return (
        <div className="card mb-5 mb-xl-8">
            <div className="card-body py-6">
                <div className="row g-5">
                    {/* Search */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, group ID, description..."
                            value={filters.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Status</label>
                        <select
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Subgroup Filter */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Group Type</label>
                        <select
                            className="form-select"
                            value={filters.is_subgroup}
                            onChange={(e) => handleChange('is_subgroup', e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="no">Parent Groups Only</option>
                            <option value="yes">Subgroups Only</option>
                        </select>
                    </div>

                    {/* Merchant and Country Filters */}
                    <MerchantCountryFilterFields
                        merchantValue={filters.merchant_id}
                        countryValue={filters.country_id}
                        onMerchantChange={(value) => {
                            handleChange('merchant_id', value || '');
                            // Clear branch when merchant changes
                            if (filters.branch_id) {
                                handleChange('branch_id', '');
                            }
                        }}
                        onCountryChange={(value) => handleChange('country_id', value || '')}
                        merchantPlaceholder="All Merchants"
                        countryPlaceholder="All Countries"
                        merchantNameResolver={resolveMerchant}
                        countryNameResolver={resolveCountry}
                        merchantWrapperClassName="col-md-4"
                        countryWrapperClassName="col-md-4"
                    />

                    {/* Branch Filter */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Branch</label>
                        <select
                            className="form-select"
                            value={filters.branch_id}
                            onChange={(e) => handleChange('branch_id', e.target.value)}
                            disabled={loadingBranches || !filters.merchant_id}
                        >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {getTranslatedText(branch.name)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Date From</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.date_from}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Date To</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.date_to}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="row mt-6">
                    <div className="col-12 d-flex justify-content-end gap-3">
                        <button
                            type="button"
                            className="btn btn-light btn-active-light-primary"
                            onClick={onClearFilters}
                        >
                            Clear Filters
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onApply}
                        >
                            <i className="ki-duotone ki-filter fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalGroupFiltersPanel;

