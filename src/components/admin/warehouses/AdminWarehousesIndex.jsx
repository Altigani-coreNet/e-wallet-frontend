import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminWarehouses, exportWarehouses, adminWarehousesKeys } from '../../../services/adminWarehousesService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import { fetchMerchantCountryInfo } from '../../../services/adminMerchantLookupService';
import WarehouseFiltersPanel from './WarehouseFiltersPanel';
import { getTranslatedText } from '../../../utils/helpers';
import { downloadCSV } from '../../../utils/export';

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
};

const AdminWarehousesIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const { merchantsMap, countriesMap, loading: refDataLoading } = useAdminReferenceData();

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination state
    const [pagination, setPagination] = useState({ 
        current_page: 1, 
        per_page: 15, 
        total: 0, 
        last_page: 1 
    });
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });
    
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    
    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Debounced filters
    const [debouncedFilters, setDebouncedFilters] = useState(appliedFilters);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(appliedFilters);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [appliedFilters]);

    // Build query params for React Query
    const queryParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: debouncedSearchTerm || undefined,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...debouncedFilters
    }), [pagination.current_page, pagination.per_page, debouncedSearchTerm, sortConfig.column, sortConfig.direction, debouncedFilters]);

    // Use React Query to fetch warehouses
    const { 
        data: warehousesResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useAdminWarehouses(queryParams, {
        keepPreviousData: true,
        onSuccess: (response) => {
            // Update pagination from response
            if (response.data?.current_page !== undefined) {
                setPagination({
                    current_page: response.data.current_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                    last_page: response.data.last_page
                });
            } else if (response.data?.pagination) {
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }));
            }
        },
        onError: (err) => {
            console.error('Error fetching warehouses:', err);
            toast.error('Failed to load warehouses');
        }
    });

    // Extract warehouses from response
    const warehouses = useMemo(() => {
        const warehousesData = warehousesResponse?.data?.warehouses || warehousesResponse?.data?.data || [];
        return Array.isArray(warehousesData) ? warehousesData : [];
    }, [warehousesResponse]);

    const warehouseShopIds = useMemo(() => {
        if (!warehouses.length) return [];
        const ids = new Set();
        warehouses.forEach((warehouse) => {
            const shopId = warehouse?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [warehouses]);

    const merchantLookups = useMerchantCountryLookup(warehouseShopIds);
    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);

    const handleExport = useCallback(async () => {
        try {
            const response = await exportWarehouses({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || [];
            if (success && exportRows.length > 0) {
                // Extract unique merchant IDs from export rows
                const merchantIds = new Set();
                exportRows.forEach((row) => {
                    const merchantId = row?.shop_id ?? row?.merchant_id ?? row?.merchantId;
                    if (merchantId !== null && merchantId !== undefined) {
                        merchantIds.add(merchantId);
                    }
                });

                // Fetch merchant and country info
                const merchantInfo = await fetchMerchantCountryInfo(Array.from(merchantIds));

                // Transform export rows to include merchant_name and country_name
                const transformedRows = exportRows.map((row) => {
                    const merchantId = row?.shop_id ?? row?.merchant_id ?? row?.merchantId;
                    const merchantIdStr = merchantId ? String(merchantId) : null;
                    
                    const merchantRecord = merchantIdStr ? merchantInfo[merchantIdStr] : null;
                    const merchantName = merchantRecord?.name || 'N/A';
                    const countryName = merchantRecord?.countryName || 'N/A';

                    return {
                        ...row,
                        merchant_name: merchantName,
                        country_name: countryName,
                    };
                });

                downloadCSV(transformedRows, exportPayload?.filename || 'warehouses_export.csv');
                toast.success('Warehouses export ready');
            } else {
                toast.info('No warehouses to export');
            }
        } catch (error) {
            console.error('Error exporting warehouses:', error);
            toast.error('Failed to export warehouses');
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle('Warehouses Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button className="btn btn-sm btn-flex btn-secondary fw-bold" onClick={() => setShowFilters(!showFilters)}>
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-1 ${showFilters ? '' : 'rotate-90'}`}><span className="path1"></span><span className="path2"></span></i>
                    Toggle Filters
                </button>
                <button className="btn btn-sm btn-flex btn-light-primary fw-bold" onClick={handleExport}>
                    <i className="ki-duotone ki-file-down fs-6 text-primary me-1"><span className="path1"></span><span className="path2"></span></i>
                    Export
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, handleExport]);

    // Handle sort
    const handleSort = useCallback((column) => {
        setSortConfig(prev => {
            if (prev.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                column,
                direction: 'desc'
            };
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    }, []);

    // Get sort icon
    const getSortIcon = useCallback((column) => {
        if (sortConfig.column !== column) {
            return (
                <i className="ki-duotone ki-arrow-up-down fs-5 ms-1 text-muted">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-5 ms-1 text-primary">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1 text-primary">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    }, [sortConfig]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination(prev => ({ ...prev, current_page: page }));
        }
    }, [pagination.last_page]);

    // Handle per page change
    const handlePerPageChange = useCallback((newPerPage) => {
        setPagination(prev => ({
            ...prev,
            per_page: newPerPage,
            current_page: 1
        }));
    }, []);

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const countryPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);

    const renderMerchant = useCallback((shopId) => {
        if (!shopId) {
            return 'N/A';
        }

        const lookupRecord = merchantLookups.getMerchantRecord(shopId);
        if (lookupRecord?.name) {
            return lookupRecord.name;
        }

        if (isLookupLoading) {
            return merchantPlaceholder;
        }

        return merchantsMap[shopId] || `#${shopId}`;
    }, [isLookupLoading, merchantLookups, merchantPlaceholder, merchantsMap]);

    const renderCountry = useCallback((shopId) => {
        if (!shopId) {
            return 'N/A';
        }

        const remoteCountryName = merchantLookups.getCountryName(null, shopId);
        if (remoteCountryName) {
            return remoteCountryName;
        }

        if (refDataLoading || isLookupLoading) return countryPlaceholder;
        return 'N/A';
    }, [countryPlaceholder, isLookupLoading, merchantLookups, refDataLoading]);

    const filtersCard = showFilters ? (
        <WarehouseFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (isLoading && warehouses.length === 0) {
        return (
            <>
                {filtersCard}
                <div className="card">
                    <div className="card-body py-4">
                        <div className="table-responsive">
                            <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Country</th><th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(6)].map((_, j) => (<td key={j}><span className="placeholder col-7"></span></td>))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {filtersCard}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex justify-content-between align-items-center w-100">
                        {/* Search */}
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-13"
                                placeholder="Search warehouses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {/* Per Page Selector */}
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">Per Page:</label>
                            <select 
                                className="form-select form-select-sm" 
                                style={{width: '80px'}}
                                value={pagination.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="card-body pt-0">
                    {/* Loading Bar */}
                    {isFetching && !isLoading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                            </div>
                        </div>
                    )}
                    
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3" style={{ opacity: isFetching ? 0.6 : 1 }}>
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('id')}
                                    >
                                        <span className="d-flex align-items-center">
                                            ID {getSortIcon('id')}
                                        </span>
                                    </th>
                                    <th 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('name')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Name {getSortIcon('name')}
                                        </span>
                                    </th>
                                    <th 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('city')}
                                    >
                                        <span className="d-flex align-items-center">
                                            City {getSortIcon('city')}
                                        </span>
                                    </th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Merchant</th>
                                    <th>Country</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.length > 0 ? warehouses.map((warehouse) => (
                                    <tr key={warehouse.id}>
                                        <td><span className="text-dark fw-bold">{warehouse.id}</span></td>
                                        <td><span className="text-dark fw-bold">{getTranslatedText(warehouse.name) || 'N/A'}</span></td>
                                        <td><span className="text-muted">{warehouse.city || 'N/A'}</span></td>
                                        <td><span className="text-muted">{warehouse.phone || 'N/A'}</span></td>
                                        <td><span className="text-muted">{warehouse.email || 'N/A'}</span></td>
                                        <td>{renderMerchant(warehouse?.shop_id)}</td>
                                        <td>{renderCountry(warehouse?.shop_id)}</td>
                                        <td className="text-end">
                                            <Link to={`/admin/sales/warehouses/${warehouse.id}`} className="btn btn-sm btn-light-primary">View</Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" className="text-center py-5"><div className="text-muted">No warehouses found</div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap pt-5">
                            <div className="fs-6 fw-bold text-gray-700">
                                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                            </div>
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => handlePageChange(pagination.current_page - 1)} 
                                        disabled={pagination.current_page === 1 || isFetching}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(pagination.last_page)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === pagination.last_page ||
                                        (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)
                                    ) {
                                        return (
                                            <li key={i} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    disabled={isFetching}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    } else if (
                                        pageNum === pagination.current_page - 2 ||
                                        pageNum === pagination.current_page + 2
                                    ) {
                                        return (
                                            <li key={i} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}
                                <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => handlePageChange(pagination.current_page + 1)} 
                                        disabled={pagination.current_page === pagination.last_page || isFetching}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminWarehousesIndex;
