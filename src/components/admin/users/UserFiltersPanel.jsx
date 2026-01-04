import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getTranslatedText } from '../../../utils/helpers';

const UserFiltersPanel = ({ isVisible, filters, onFilterChange, onClearFilters, onApply }) => {
    const [merchants, setMerchants] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    useEffect(() => {
        if (isVisible) {
            fetchMerchants();
        }
    }, [isVisible]);

    useEffect(() => {
        if (filters.merchant_id) {
            fetchBranches(filters.merchant_id);
        } else {
            setBranches([]);
        }
    }, [filters.merchant_id]);

    const fetchMerchants = async () => {
        setLoadingMerchants(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params: { per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success || response.data.status) {
                setMerchants(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        } finally {
            setLoadingMerchants(false);
        }
    };

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
                            placeholder="Search by name, email, phone..."
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

                    {/* Merchant Filter */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Merchant</label>
                        <select
                            className="form-select"
                            value={filters.merchant_id}
                            onChange={(e) => handleChange('merchant_id', e.target.value)}
                            disabled={loadingMerchants}
                        >
                            <option value="">All Merchants</option>
                            {merchants.map((merchant) => (
                                <option key={merchant.id} value={merchant.id}>
                                    {getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Branch Filter */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Branch</label>
                        <select
                            className="form-select"
                            value={filters.branch_id}
                            onChange={(e) => handleChange('branch_id', e.target.value)}
                            disabled={!filters.merchant_id || loadingBranches}
                        >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {getTranslatedText(branch.name)}
                                </option>
                            ))}
                        </select>
                        {!filters.merchant_id && (
                            <div className="form-text">Select a merchant first</div>
                        )}
                    </div>

                    {/* Date From */}
                    <div className="col-md-4">
                        <label 
                            htmlFor="date_from"
                            className="form-label fw-bold"
                            style={{ cursor: 'pointer' }}
                            onClick={() => dateFromRef.current?.focus()}
                        >
                            Date From
                        </label>
                        <input
                            id="date_from"
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
                    <div className="col-md-4">
                        <label 
                            htmlFor="date_to"
                            className="form-label fw-bold"
                            style={{ cursor: 'pointer' }}
                            onClick={() => dateToRef.current?.focus()}
                        >
                            Date To
                        </label>
                        <input
                            id="date_to"
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

                {/* Action Buttons */}
                <div className="row mt-6">
                    <div className="col-12">
                        <div className="d-flex justify-content-end gap-3">
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
        </div>
    );
};

export default UserFiltersPanel;

