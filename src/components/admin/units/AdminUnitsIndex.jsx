import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportUnits, useAdminUnits } from '../../../services/adminUnitsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import { fetchMerchantCountryInfo } from '../../../services/adminMerchantLookupService';
import UnitFiltersPanel from './UnitFiltersPanel';
import { downloadCSV } from '../../../utils/export';
import { formatDateTime, getTranslatedText } from '../../../utils/helpers';

const extractUnitsFromPayload = (payload) => {
    if (!payload) return null;

    const sources = [
        payload?.data?.data,
        payload?.data?.items,
        payload?.data?.units,
        payload?.data?.results,
        payload?.units,
        payload?.items,
        payload?.results,
    ];

    for (const source of sources) {
        if (Array.isArray(source)) {
            return source;
        }
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return null;
};

const extractPaginationFromPayload = (payload, fallbackTotal = 0, previous = {}) => {
    const defaultPagination = {
        current_page: previous.current_page ?? 1,
        per_page: previous.per_page ?? 15,
        total: fallbackTotal ?? previous.total ?? 0,
        last_page: previous.last_page ?? 1,
    };

    const candidates = [
        payload?.data?.pagination,
        payload?.pagination,
        payload?.data?.meta,
        payload?.meta,
        (typeof payload?.data === 'object' && !Array.isArray(payload?.data)) ? payload.data : null,
        (typeof payload === 'object' && !Array.isArray(payload)) ? payload : null,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            continue;
        }

        const currentPage = candidate.current_page ?? candidate.page ?? candidate.page_number;
        const perPage = candidate.per_page ?? candidate.limit ?? candidate.page_size ?? candidate.perPage;
        const total = candidate.total ?? candidate.total_items ?? candidate.count ?? candidate.total_count ?? candidate.records_total;
        const lastPage = candidate.last_page ?? candidate.total_pages ?? candidate.page_count;

        if ([currentPage, perPage, total, lastPage].some((value) => value !== undefined)) {
            const resolvedPerPage = perPage ?? defaultPagination.per_page;
            const resolvedTotal = total ?? defaultPagination.total;
            const resolvedLastPage = lastPage ?? (resolvedPerPage ? Math.max(1, Math.ceil(resolvedTotal / resolvedPerPage)) : defaultPagination.last_page);

            return {
                current_page: currentPage ?? defaultPagination.current_page,
                per_page: resolvedPerPage,
                total: resolvedTotal,
                last_page: resolvedLastPage,
            };
        }
    }

    return defaultPagination;
};

const isSuccessfulUnitsResponse = (payload) => {
    if (!payload) {
        return false;
    }

    if (payload.success === false || payload.status === false || payload.error) {
        return false;
    }

    if (payload.success === true || payload.status === true) {
        return true;
    }

    return Array.isArray(extractUnitsFromPayload(payload));
};

const getPayloadMessage = (payload) => {
    if (!payload) return null;
    return payload.message || payload.error || payload?.data?.message || null;
};

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
};

const AdminUnitsIndex = () => {
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
            const response = await exportUnits({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || exportPayload?.units || [];
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

                downloadCSV(transformedRows, exportPayload?.filename || 'units_export.csv');
                toast.success('Units export ready');
            } else {
                toast.info('No units to export');
            }
        } catch (error) {
            console.error('Error exporting units:', error);
            toast.error('Failed to export units');
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle('Units Management');
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

    const unitParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...appliedFilters,
    }), [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const {
        data: unitsData,
        isLoading,
        isFetching,
        error: unitsError,
    } = useAdminUnits(unitParams);

    useEffect(() => {
        if (!unitsData || !isSuccessfulUnitsResponse(unitsData)) {
            return;
        }

        setPagination(prev => {
            const unitsList = extractUnitsFromPayload(unitsData) ?? [];
            const paginationMeta = extractPaginationFromPayload(unitsData, unitsList.length, prev);
            const next = {
                ...prev,
                ...paginationMeta,
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
    }, [unitsData]);

    useEffect(() => {
        if (!unitsData) return;
        if (!isSuccessfulUnitsResponse(unitsData)) {
            const message = getPayloadMessage(unitsData) || 'Failed to load units';
            toast.error(message);
        }
    }, [unitsData]);

    useEffect(() => {
        if (!unitsError) return;
        const message = unitsError?.response?.data?.message || unitsError.message || 'Failed to load units';
        toast.error(message);
    }, [unitsError]);

    const units = useMemo(() => {
        if (!unitsData || !isSuccessfulUnitsResponse(unitsData)) return [];
        return extractUnitsFromPayload(unitsData) ?? [];
    }, [unitsData]);

    const unitShopIds = useMemo(() => {
        if (!units.length) return [];
        const ids = new Set();
        units.forEach((unit) => {
            const shopId = unit?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [units]);

    const merchantLookups = useMerchantCountryLookup(unitShopIds);
    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);
    const resolvedPagination = useMemo(() => {
        if (!unitsData || !isSuccessfulUnitsResponse(unitsData)) {
            return pagination;
        }
        const unitsList = extractUnitsFromPayload(unitsData) ?? [];
        return extractPaginationFromPayload(unitsData, unitsList.length, pagination);
    }, [unitsData, pagination]);

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
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

    const handlePageChange = (page) => {
        const totalPages = Math.max(1, resolvedPagination.last_page || pagination.last_page || 1);
        if (page >= 1 && page <= totalPages) {
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
        if (!countryId) return 'N/A';
        return countriesMap[countryId] || `#${countryId}`;
    }, [countriesMap, countryPlaceholder, isLookupLoading, merchantLookups, refDataLoading]);

    const filtersCard = showFilters ? (
        <UnitFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (isLoading && !unitsData) {
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
                                    placeholder="Quick search: Unit name, code..."
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
                                        <th>ID</th><th>Merchant</th><th>Name</th><th>Slug</th><th>Country</th><th>Created At</th><th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(7)].map((_, j) => (
                                                <td key={j}><span className="placeholder col-7"></span></td>
                                            ))}
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
                                placeholder="Quick search: Unit name, code..."
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
                        <div className="alert alert-info py-3 mb-5 d-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm"></span>
                            <span>Refreshing units...</span>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th>ID</th><th>Merchant</th><th>Name</th><th>Slug</th><th>Country</th><th>Created At</th><th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {units.length > 0 ? units.map((unit) => (
                                    <tr key={unit.id}>
                                        <td><span className="text-dark fw-bold">{unit.id}</span></td>
                                        <td>{renderMerchant(unit?.shop_id)}</td>
                                        <td><span className="text-dark fw-bold">{getTranslatedText(unit.name) || 'N/A'}</span></td>
                                        <td><span className="badge badge-light-primary">{unit.slug || 'N/A'}</span></td>
                                        <td>{renderCountry(unit?.shop_id)}</td>
                                        <td><span className="text-muted">{formatDateTime(unit.created_at) || 'N/A'}</span></td>
                                        <td className="text-end">
                                            <Link to={`/admin/sales/units/${unit.id}`} className="btn btn-sm btn-light-primary">View</Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-5"><div className="text-muted">No units found</div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {resolvedPagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap pt-5">
                            <div className="fs-6 fw-bold text-gray-700">
                                {(() => {
                                    const total = resolvedPagination.total ?? 0;
                                    const perPage = resolvedPagination.per_page ?? pagination.per_page ?? 15;
                                    const currentPage = pagination.current_page ?? 1;
                                    if (total === 0) {
                                        return 'Showing 0 to 0 of 0 entries';
                                    }
                                    const start = ((currentPage - 1) * perPage) + 1;
                                    const end = Math.min(currentPage * perPage, total);
                                    return `Showing ${start} to ${end} of ${total} entries`;
                                })()}
                            </div>
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}>Previous</button>
                                </li>
                                {[...Array(resolvedPagination.last_page)].map((_, index) => (
                                    <li key={index + 1} className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${pagination.current_page === resolvedPagination.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === resolvedPagination.last_page}>Next</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminUnitsIndex;


