import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportDrafts, useAdminDrafts } from '../../../services/adminDraftsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import DraftFiltersPanel from './DraftFiltersPanel';
import { downloadCSV } from '../../../utils/export';

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
};

const AdminDraftsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const { merchantsMap, countriesMap, loading: refDataLoading } = useAdminReferenceData();

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
            const response = await exportDrafts({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || [];
            if (success && exportRows.length > 0) {
                downloadCSV(exportRows, exportPayload?.filename || 'drafts_export.csv');
                toast.success('Drafts export ready');
            } else {
                toast.info('No drafts to export');
            }
        } catch (error) {
            console.error('Error exporting drafts:', error);
            toast.error('Failed to export drafts');
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle('Drafts Management');
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

    const draftParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...appliedFilters,
    }), [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const {
        data: draftsData,
        isLoading,
        isFetching,
        error: draftsError,
    } = useAdminDrafts(draftParams);

    useEffect(() => {
        if (!draftsData || draftsData.success === false || !draftsData.data) {
            return;
        }

        const { current_page, per_page, total, last_page } = draftsData.data || {};

        setPagination(prev => {
            const next = {
                ...prev,
                current_page: current_page !== undefined ? current_page : prev.current_page,
                per_page: per_page !== undefined ? per_page : prev.per_page,
                total: total !== undefined ? total : prev.total,
                last_page: last_page !== undefined ? last_page : prev.last_page,
            };

            if (
                next.current_page === prev.current_page &&
                next.per_page === prev.per_page &&
                next.total === prev.total &&
                next.last_page === prev.last_page
            ) {
                return prev;
            }

            return next;
        });
    }, [draftsData]);

    useEffect(() => {
        if (!draftsData) return;
        if (draftsData.success === false) {
            const message = draftsData?.message || draftsData?.error || draftsData?.data?.message || 'Failed to load drafts';
            toast.error(message);
        }
    }, [draftsData]);

    useEffect(() => {
        if (!draftsError) return;
        const message = draftsError?.response?.data?.message || draftsError.message || 'Failed to load drafts';
        toast.error(message);
    }, [draftsError]);

    const drafts = useMemo(() => {
        if (!draftsData || draftsData.success === false) return [];
        const container = draftsData?.data?.data || draftsData?.data?.items || [];
        return Array.isArray(container) ? container : [];
    }, [draftsData]);

    const draftShopIds = useMemo(() => {
        if (!drafts.length) return [];
        const ids = new Set();
        drafts.forEach((draft) => {
            const shopId = draft?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [drafts]);

    const merchantLookups = useMerchantCountryLookup(draftShopIds);
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


    const filtersCard = showFilters ? (
        <DraftFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (isLoading && !draftsData) {
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
                                    placeholder="Quick search: Reference, Customer..."
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
                    {isFetching && !isLoading && (
                        <div className="alert alert-info py-3 mb-5">
                            <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                            Refreshing drafts...
                        </div>
                    )}
                        <div className="table-responsive">
                            <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>ID</th><th>Reference</th><th>Customer</th><th>Total</th><th>Created</th><th>Merchant</th><th>Country</th><th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(7)].map((_, j) => (<td key={j}><span className="placeholder col-7"></span></td>))}
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
                                placeholder="Quick search: Reference, Customer..."
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
                                        Reference {getSortIcon('reference_no')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_id')} className="user-select-none">
                                        Customer {getSortIcon('customer_id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('grand_total')} className="user-select-none">
                                        Grand Total {getSortIcon('grand_total')}
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
                                {drafts.length > 0 ? drafts.map((draft) => (
                                    <tr key={draft.id}>
                                        <td><span className="text-dark fw-bold">{draft.id}</span></td>
                                        <td><span className="text-dark fw-bold">{draft.reference_no}</span></td>
                                        <td><span className="text-muted">{draft.customer?.name || 'Walk-in'}</span></td>
                                        <td><span className="badge badge-light-warning">${parseFloat(draft.grand_total || 0).toFixed(2)}</span></td>
                                        <td><span className="text-muted">{new Date(draft.created_at).toLocaleDateString()}</span></td>
                                        <td>{renderMerchant(draft?.shop_id)}</td>
                                        <td>{renderCountry(draft?.shop_id)}</td>
                                        <td className="text-end">
                                            <Link to={`/admin/sales/drafts/${draft.id}`} className="btn btn-sm btn-light-primary">View</Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" className="text-center py-5"><div className="text-muted">No drafts found</div></td></tr>
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

export default AdminDraftsIndex;
