import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getSaleReturns, exportSaleReturns } from '../../../services/adminReturnsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import ReturnFiltersPanel from './ReturnFiltersPanel';
import { downloadCSV } from '../../../utils/export';

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
};

const AdminReturnsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const { merchantsMap, countriesMap, loading: refDataLoading } = useAdminReferenceData();

    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });

    const handleExport = useCallback(async () => {
        try {
            const response = await exportSaleReturns({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || [];
            if (success && exportRows.length > 0) {
                downloadCSV(exportRows, exportPayload?.filename || 'sale_returns_export.csv');
                toast.success('Sale returns export ready');
            } else {
                toast.info('No sale returns to export');
            }
        } catch (error) {
            console.error('Error exporting sale returns:', error);
            toast.error('Failed to export sale returns');
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle('Sale Returns Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle filters – icon only on small screens, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle filters"
                >
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1 ${showFilters ? '' : 'rotate-90'}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Toggle Filters
                    </span>
                </button>

                {/* Export – icon only on small screens, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-light-primary fw-bold"
                    onClick={handleExport}
                    aria-label="Export sale returns"
                >
                    <i className="ki-duotone ki-file-down fs-6 text-primary me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Export
                    </span>
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, handleExport]);

    useEffect(() => {
        fetchReturns();
    }, [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await getSaleReturns({
                page: pagination.current_page,
                per_page: pagination.per_page,
                sort_by: sortConfig.column,
                sort_direction: sortConfig.direction,
                ...appliedFilters,
            });
            if (response.success && response.data) {
                setReturns(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: response.data.current_page || prev.current_page,
                    per_page: response.data.per_page || prev.per_page,
                    total: response.data.total || 0,
                    last_page: response.data.last_page || 1,
                }));
            }
        } catch (error) {
            console.error('Error fetching returns:', error);
            toast.error('Failed to load returns');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
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

    const handleQuickSearch = (value) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setAppliedFilters(newFilters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSort = (column) => {
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
    };

    const getSortIcon = (column) => {
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
    };

    const returnShopIds = useMemo(() => {
        if (!returns.length) return [];
        const ids = new Set();
        returns.forEach((returnItem) => {
            const shopId = returnItem?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [returns]);

    const merchantLookups = useMerchantCountryLookup(returnShopIds);
    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);
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
        <ReturnFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (loading) {
        return (
            <>
                {filtersCard}
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
                                placeholder="Quick search: Reference, Sale Ref..."
                                value={filters.search}
                                onChange={(e) => handleQuickSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">Show:</label>
                            <select 
                                className="form-select form-select-sm" 
                                value={pagination.per_page}
                                onChange={handlePerPageChange}
                                style={{ width: '75px' }}
                            >
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="card-body py-4">
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th>ID</th><th>Reference No</th><th>Sale Ref</th><th>Created At</th><th>Merchant</th><th>Country</th><th className="text-end">Actions</th>
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
                <div className="card-title">
                    <div className="d-flex align-items-center position-relative">
                        <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 10 }}>
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <input
                            type="text"
                            className="form-control form-control-solid w-250px ps-12"
                            placeholder="Quick search: Reference, Sale Ref..."
                            value={filters.search}
                            onChange={(e) => handleQuickSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="card-toolbar">
                    <div className="d-flex align-items-center gap-2">
                        <label className="form-label mb-0 text-nowrap">Show:</label>
                        <select 
                            className="form-select form-select-sm" 
                            value={pagination.per_page}
                            onChange={handlePerPageChange}
                            style={{ width: '75px' }}
                        >
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="card-body py-4" style={{ position: 'relative' }}>
                <div className="table-responsive">
                    <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                        <thead>
                            <tr className="fw-bold text-muted">
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')} className="user-select-none">
                                    ID {getSortIcon('id')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('reference_no')} className="user-select-none">
                                    Reference No {getSortIcon('reference_no')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sale_reference')} className="user-select-none">
                                    Sale Reference {getSortIcon('sale_reference')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')} className="user-select-none">
                                    Created At {getSortIcon('created_at')}
                                </th>
                                <th>Merchant</th>
                                <th>Country</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returns.length > 0 ? returns.map((returnItem) => (
                                <tr key={returnItem.id}>
                                    <td><span className="text-dark fw-bold">{returnItem.id}</span></td>
                                    <td><span className="text-dark fw-bold">{returnItem.reference_no || 'N/A'}</span></td>
                                    <td><span className="text-muted">{returnItem.sale_reference || 'N/A'}</span></td>
                                    <td><span className="text-muted">{new Date(returnItem.created_at).toLocaleDateString()}</span></td>
                                    <td>{renderMerchant(returnItem?.shop_id)}</td>
                                    <td>{renderCountry(returnItem?.shop_id)}</td>
                                    <td className="text-end">
                                        <Link to={`/admin/sales/returns/${returnItem.id}`} className="btn btn-sm btn-light-primary">View</Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="text-center py-5"><div className="text-muted">No returns found</div></td></tr>
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
                                <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}>Previous</button>
                            </li>
                            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}>Next</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default AdminReturnsIndex;
