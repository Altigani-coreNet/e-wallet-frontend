import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportBrands, useAdminBrands } from '../../../services/adminBrandsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import { fetchMerchantCountryInfo } from '../../../services/adminMerchantLookupService';
import BrandFiltersPanel from './BrandFiltersPanel';
import { downloadCSV } from '../../../utils/export';
import { formatDateTime, getTranslatedText } from '../../../utils/helpers';

const extractBrandsFromPayload = (payload) => {
    if (!payload) return null;

    const sources = [
        payload?.data?.data,
        payload?.data?.items,
        payload?.data?.brands,
        payload?.data?.results,
        payload?.brands,
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

const isSuccessfulBrandsResponse = (payload) => {
    if (!payload) {
        return false;
    }

    if (payload.success === false || payload.status === false || payload.error) {
        return false;
    }

    if (payload.success === true || payload.status === true) {
        return true;
    }

    return Array.isArray(extractBrandsFromPayload(payload));
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

const AdminBrandsIndex = () => {
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
            const response = await exportBrands({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || exportPayload?.brands || [];
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

                downloadCSV(transformedRows, exportPayload?.filename || 'brands_export.csv');
                toast.success('Brands export ready');
            } else {
                toast.info('No brands to export');
            }
        } catch (error) {
            console.error('Error exporting brands:', error);
            toast.error('Failed to export brands');
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle('Brands Management');
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

    const brandParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...appliedFilters,
    }), [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const {
        data: brandsData,
        isLoading,
        isFetching,
        error: brandsError,
    } = useAdminBrands(brandParams);

    useEffect(() => {
        if (!brandsData || !isSuccessfulBrandsResponse(brandsData)) {
            return;
        }

        setPagination(prev => {
            const brandsList = extractBrandsFromPayload(brandsData) ?? [];
            const paginationMeta = extractPaginationFromPayload(brandsData, brandsList.length, prev);
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
    }, [brandsData]);

    useEffect(() => {
        if (!brandsData) return;
        if (!isSuccessfulBrandsResponse(brandsData)) {
            const message = getPayloadMessage(brandsData) || 'Failed to load brands';
            toast.error(message);
        }
    }, [brandsData]);

    useEffect(() => {
        if (!brandsError) return;
        const message = brandsError?.response?.data?.message || brandsError.message || 'Failed to load brands';
        toast.error(message);
    }, [brandsError]);

    const brands = useMemo(() => {
        if (!brandsData || !isSuccessfulBrandsResponse(brandsData)) return [];
        return extractBrandsFromPayload(brandsData) ?? [];
    }, [brandsData]);

    const brandShopIds = useMemo(() => {
        if (!brands.length) return [];
        const ids = new Set();
        brands.forEach((brand) => {
            const shopId = brand?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [brands]);

    const merchantLookups = useMerchantCountryLookup(brandShopIds);
    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);
    const resolvedPagination = useMemo(() => {
        if (!brandsData || !isSuccessfulBrandsResponse(brandsData)) {
            return pagination;
        }
        const brandsList = extractBrandsFromPayload(brandsData) ?? [];
        return extractPaginationFromPayload(brandsData, brandsList.length, pagination);
    }, [brandsData, pagination]);

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
        return 'N/A';
    }, [countryPlaceholder, isLookupLoading, merchantLookups, refDataLoading]);

    const filtersCard = showFilters ? (
        <BrandFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (isLoading && !brandsData) {
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
                                    placeholder="Quick search: Brand name, slug..."
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
                                placeholder="Quick search: Brand name, slug..."
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
                            <span>Refreshing brands...</span>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')} className="user-select-none">
                                        ID {getSortIcon('id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('merchant_id')} className="user-select-none">
                                        Merchant {getSortIcon('merchant_id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')} className="user-select-none">
                                        Name {getSortIcon('name')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('slug')} className="user-select-none">
                                        Slug {getSortIcon('slug')}
                                    </th>
                                    <th>Country</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')} className="user-select-none">
                                        Created At {getSortIcon('created_at')}
                                    </th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brands.length > 0 ? brands.map((brand) => (
                                    <tr key={brand.id}>
                                        <td><span className="text-dark fw-bold">{brand.id}</span></td>
                                        <td>{renderMerchant(brand?.shop_id)}</td>
                                        <td><span className="text-dark fw-bold">{getTranslatedText(brand.name) || 'N/A'}</span></td>
                                        <td><span className="badge badge-light-primary">{brand.slug || 'N/A'}</span></td>
                                        <td>{renderCountry(brand?.shop_id)}</td>
                                        <td><span className="text-muted">{formatDateTime(brand.created_at) || 'N/A'}</span></td>
                                        <td className="text-end">
                                            <Link to={`/admin/sales/brands/${brand.id}`} className="btn btn-sm btn-light-primary">View</Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-5"><div className="text-muted">No brands found</div></td></tr>
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

export default AdminBrandsIndex;


