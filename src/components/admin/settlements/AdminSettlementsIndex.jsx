import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportSettlements } from '../../../utils/settlementExport';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';

const AdminSettlementsIndex = () => {
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Filter dropdown data
    const [merchantsList, setMerchantsList] = useState([]);
    const [countriesList, setCountriesList] = useState([]);
    const [dropdownsLoading, setDropdownsLoading] = useState(false);
    
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 25,
        total: 0,
        last_page: 1
    });
    
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        merchant_id: '',
        country_id: '',
        from_date: '',
        to_date: ''
    });

    // Refs for date inputs
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    useEffect(() => {
        setTitle('Settlements Management');
        
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Filter</span>
                </button>

                <button
                    className="btn btn-sm btn-flex btn-success fw-bold"
                    onClick={handleExport}
                >
                    <i className="ki-duotone ki-file-down fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Export</span>
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters]);

    useEffect(() => {
        fetchSettlements();
    }, [pagination.current_page, pagination.per_page, filters]);

    useEffect(() => {
        fetchFilterDropdowns();
    }, []);

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENTS, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                const settlementsData = response.data.data.data || [];
                setSettlements(settlementsData);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || 0,
                    last_page: response.data.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Error fetching settlements:', error);
            toast.error('Failed to load settlements');
        } finally {
            setLoading(false);
        }
    };

    // Extract merchant IDs from settlements
    const settlementMerchantIds = useMemo(() => {
        if (!settlements.length) return [];
        return [
            ...new Set(
                settlements
                    .map((settlement) => settlement.merchant?.id || settlement.merchant_id)
                    .filter((id) => id !== null && id !== undefined && id !== '')
                    .map((id) => String(id))
            ),
        ];
    }, [settlements]);

    // Fetch merchant and country info using the hook
    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(settlementMerchantIds);

    // Helper function to get merchant info for a settlement
    const getMerchantInfo = useCallback(
        (settlement) => {
            const merchantId = settlement.merchant?.id || settlement.merchant_id;
            
            if (!merchantId) {
                return {
                    merchantName: settlement.merchant?.business_name || settlement.merchant?.name || 'N/A',
                    countryName: settlement.merchant?.country?.name || 'N/A',
                };
            }

            const record = getMerchantInfoById(String(merchantId));

            if (record) {
                return {
                    merchantName: record.name || settlement.merchant?.business_name || settlement.merchant?.name || 'N/A',
                    countryName: record.countryName || 'N/A',
                };
            }

            return {
                merchantName: settlement.merchant?.business_name || settlement.merchant?.name || 'N/A',
                countryName: 'N/A',
            };
        },
        [getMerchantInfoById]
    );

    const fetchFilterDropdowns = async () => {
        setDropdownsLoading(true);
        try {
            const token = getToken();
            
            const [merchantsRes, countriesRes] = await Promise.all([
                axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                    params: { per_page: 1000 },
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                }).catch(err => {
                    console.error('Error fetching merchants:', err);
                    return { data: { data: [] } };
                }),
                
                axios.get(AUTH_ENDPOINTS.COUNTRIES, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                }).catch(err => {
                    console.error('Error fetching countries:', err);
                    return { data: { data: [] } };
                })
            ]);
            
            const merchants = merchantsRes.data?.data?.data || merchantsRes.data?.data || [];
            setMerchantsList(Array.isArray(merchants) ? merchants : []);
            
            const countriesData = countriesRes.data?.data || countriesRes.data || [];
            setCountriesList(Array.isArray(countriesData) ? countriesData : []);
            
        } catch (error) {
            console.error('Error fetching filter dropdowns:', error);
        } finally {
            setDropdownsLoading(false);
        }
    };

    const handleExport = async () => {
        const filterInfo = Object.values(filters).some(v => v) ? ' with current filters' : '';
        const exportMessage = `Export settlements${filterInfo}? Maximum 1000 settlements will be exported.`;
        
        const result = await Swal.fire({
            title: 'Export Settlements',
            text: exportMessage,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Export',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                // Show loading state with progress
                Swal.fire({
                    title: 'Exporting Settlements...',
                    html: '<div id="export-progress">Fetching settlements...</div>',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Progress callback to update UI
                const progressCallback = (message) => {
                    const progressEl = document.getElementById('export-progress');
                    if (progressEl) {
                        progressEl.textContent = message;
                    }
                };

                // Call export function from separate file
                const exportResult = await exportSettlements(filters, progressCallback);

                // Close loading and show success
                Swal.close();
                toast.success(`Successfully exported ${exportResult.count} settlements to Excel!`);
            } catch (error) {
                console.error('Export error:', error);
                Swal.close();
                toast.error(error.message || 'Failed to export settlements. Please try again.');
            }
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
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

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            merchant_id: '',
            country_id: '',
            from_date: '',
            to_date: ''
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(settlements.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination(prev => ({ ...prev, current_page: page }));
        }
    };

    const handlePerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(e.target.value),
            current_page: 1
        }));
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'settled': 'badge-light-success',
            'pending': 'badge-light-warning',
            'failed': 'badge-light-danger'
        };
        return statusMap[status?.toLowerCase()] || 'badge-light-secondary';
    };

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(v => v).length;
    };

    return (
        <>
            <style>{`
                #filter-summary {
                    transition: all 0.3s ease;
                }
                #filter-summary:hover {
                    background-color: rgba(0,0,0,0.05);
                    border-radius: 4px;
                    padding: 4px 8px;
                    margin: -4px -8px;
                }
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            {/* Filters Card */}
            {showFilters && (
                <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    className="form-control"
                                    placeholder="Search settlements"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="settled">Settled</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Merchant</label>
                                <select
                                    className="form-select"
                                    value={filters.merchant_id}
                                    onChange={(e) => handleFilterChange('merchant_id', e.target.value)}
                                    disabled={dropdownsLoading}
                                >
                                    <option value="">All Merchants</option>
                                    {merchantsList.map((merchant) => (
                                        <option key={merchant.id} value={merchant.id}>
                                            {merchant.business_name || merchant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Country</label>
                                <select
                                    className="form-select"
                                    value={filters.country_id}
                                    onChange={(e) => handleFilterChange('country_id', e.target.value)}
                                    disabled={dropdownsLoading}
                                >
                                    <option value="">All Countries</option>
                                    {countriesList.map((country) => (
                                        <option key={country.id} value={country.id}>
                                            {typeof country.name === 'object' ? (country.name.en || country.name.ar || 'N/A') : country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">From Date</label>
                                <input
                                    ref={fromDateRef}
                                    type="date"
                                    name="from_date"
                                    className="form-control"
                                    value={filters.from_date}
                                    onChange={(e) => handleFilterChange('from_date', e.target.value)}
                                    onClick={() => handleDateInputClick(fromDateRef)}
                                    onFocus={() => handleDateInputClick(fromDateRef)}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">To Date</label>
                                <input
                                    ref={toDateRef}
                                    type="date"
                                    name="to_date"
                                    className="form-control"
                                    value={filters.to_date}
                                    onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                    onClick={() => handleDateInputClick(toDateRef)}
                                    onFocus={() => handleDateInputClick(toDateRef)}
                                />
                            </div>
                        </div>
                        <div className="row mt-3">
                            {getActiveFiltersCount() > 0 && (
                                <div className="col-8">
                                    <div id="filter-summary" className="text-muted fs-7">
                                        <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <span>{getActiveFiltersCount()} active filter(s)</span>
                                    </div>
                                </div>
                            )}
                            <div className={getActiveFiltersCount() > 0 ? "col-4 text-end" : "col-12 text-end"}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={clearFilters}
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
            )}

            {/* Main Table Card */}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 10 }}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-12"
                                placeholder="Quick search: Settlement ID, Batch, Merchant..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        {selectedIds.length > 0 && (
                            <div className="d-flex justify-content-end align-items-center">
                                <div className="fw-bolder me-5">
                                    <span className="me-2">{selectedIds.length}</span>Selected
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedIds.length === settlements.length && settlements.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-dark">ID</th>
                                    <th className="min-w-125px text-dark">Settlement Number</th>
                                    <th className="min-w-125px text-dark">Batch</th>
                                    <th className="text-dark">Merchant</th>
                                    <th className="text-dark">Status</th>
                                    <th className="text-dark">Amount</th>
                                    <th className="text-dark">Transactions</th>
                                    <th className="text-dark">Created At</th>
                                    <th className="text-dark">Country</th>
                                    <th className="text-end text-dark">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(pagination.per_page)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton" style={{width: '20px', height: '20px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '60px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '150px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '60px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '140px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '100px', height: '16px'}}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))
                                ) : settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center py-10">
                                            <div className="text-gray-500">
                                                <i className="ki-duotone ki-file fs-3x mb-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <p className="fw-bold">No settlements found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    settlements.map((settlement) => (
                                        <tr key={settlement.id}>
                                            <td>
                                                <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.includes(settlement.id)}
                                                        onChange={() => handleSelectRow(settlement.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td>{settlement.id}</td>
                                            <td>{settlement.settlement_id || 'N/A'}</td>
                                            <td>{settlement.batch?.batch_number || 'N/A'}</td>
                                            <td>
                                                {(() => {
                                                    const merchantId = settlement.merchant?.id || settlement.merchant_id;
                                                    const merchantLoading = Boolean(merchantId) && (merchantInfoLoading || hasPendingRequest(String(merchantId)));
                                                    const info = getMerchantInfo(settlement);
                                                    const record = merchantId ? getMerchantInfoById(String(merchantId)) : null;
                                                    
                                                    if (merchantLoading && !record) {
                                                        return <div className="skeleton" style={{width: '120px', height: '16px'}}></div>;
                                                    }
                                                    return info.merchantName;
                                                })()}
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(settlement.status)}`}>
                                                    {settlement.status ? settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1) : 'N/A'}
                                                </span>
                                            </td>
                                            <td>{settlement.currency_symbol || '$'}{parseFloat(settlement.total_amount || 0).toFixed(2)}</td>
                                            <td>{settlement.transaction_count || 0}</td>
                                            <td>{settlement.created_at ? new Date(settlement.created_at).toLocaleString() : 'N/A'}</td>
                                            <td>
                                                {(() => {
                                                    const merchantId = settlement.merchant?.id || settlement.merchant_id;
                                                    const countryLoading = Boolean(merchantId) && (merchantInfoLoading || hasPendingRequest(String(merchantId)));
                                                    const info = getMerchantInfo(settlement);
                                                    const record = merchantId ? getMerchantInfoById(String(merchantId)) : null;
                                                    
                                                    if (countryLoading && !record) {
                                                        return <div className="skeleton" style={{width: '80px', height: '16px'}}></div>;
                                                    }
                                                    return info.countryName;
                                                })()}
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-light btn-active-light-primary"
                                                    onClick={() => navigate(`/admin/settlements/${settlement.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && settlements.length > 0 && (
                        <div className="row mt-5">
                            <div className="col-sm-12 col-md-5 d-flex align-items-center">
                                <div className="dataTables_length">
                                    <label className="d-flex align-items-center">
                                        <span className="me-2">Show</span>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={pagination.per_page}
                                            onChange={handlePerPageChange}
                                            style={{ width: '75px' }}
                                        >
                                            <option value="15">15</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                        <span className="ms-2">entries</span>
                                    </label>
                                </div>
                                <div className="ms-5">
                                    <span className="text-muted">
                                        Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                                    </span>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-end">
                                <div className="dataTables_paginate">
                                    <ul className="pagination">
                                        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                                disabled={pagination.current_page === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        <li className="page-item active">
                                            <span className="page-link">{pagination.current_page}</span>
                                        </li>
                                        <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                                disabled={pagination.current_page === pagination.last_page}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminSettlementsIndex;
