import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportTaxes, useAdminTaxes } from '../../../services/adminTaxesService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import { fetchMerchantCountryInfo } from '../../../services/adminMerchantLookupService';
import TaxFiltersPanel from './TaxFiltersPanel';
import { getTranslatedText } from '../../../utils/helpers';
import { downloadCSV } from '../../../utils/export';

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
};

const AdminTaxesIndex = () => {
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
            const response = await exportTaxes({ ...appliedFilters });
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

                downloadCSV(transformedRows, exportPayload?.filename || 'taxes_export.csv');
                toast.success('Taxes export ready');
            } else {
                toast.info('No taxes to export');
            }
        } catch (error) {
            console.error('Error exporting taxes:', error);
            toast.error('Failed to export taxes');
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle('Taxes Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-1 ${showFilters ? '' : 'rotate-90'}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
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

    const taxParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...appliedFilters,
    }), [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const {
        data: taxesData,
        isLoading,
        isFetching,
        error: taxesError,
    } = useAdminTaxes(taxParams);

    useEffect(() => {
        if (!taxesData || taxesData.success === false || !taxesData.data) {
            return;
        }

        const { current_page, per_page, total, last_page } = taxesData.data || {};

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
    }, [taxesData]);

    useEffect(() => {
        if (!taxesData) return;
        if (taxesData.success === false) {
            const message = taxesData?.message || taxesData?.error || taxesData?.data?.message || 'Failed to load taxes';
            toast.error(message);
        }
    }, [taxesData]);

    useEffect(() => {
        if (!taxesError) return;
        const message = taxesError?.response?.data?.message || taxesError.message || 'Failed to load taxes';
        toast.error(message);
    }, [taxesError]);

    const taxes = useMemo(() => {
        if (!taxesData || taxesData.success === false) return [];
        const container = taxesData?.data?.taxes || taxesData?.data?.data || taxesData?.data?.items || [];
        return Array.isArray(container) ? container : [];
    }, [taxesData]);

    const taxShopIds = useMemo(() => {
        if (!taxes.length) return [];
        const ids = new Set();
        taxes.forEach((tax) => {
            const shopId = tax?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [taxes]);

    const merchantLookups = useMerchantCountryLookup(taxShopIds);
    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);

    const resolvedPagination = useMemo(() => {
        if (!taxesData || taxesData.success === false || !taxesData.data) {
            return pagination;
        }
        const { total, last_page } = taxesData.data || {};
        return {
            ...pagination,
            total: total !== undefined ? total : pagination.total,
            last_page: last_page !== undefined ? last_page : pagination.last_page,
        };
    }, [taxesData, pagination]);

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

    const countryPlaceholder = useMemo(() => (
        <span className="placeholder col-6"></span>
    ), []);

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
        <TaxFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (isLoading && !taxesData) {
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
                                    placeholder="Quick search: Tax name, rate..."
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
                                        <th className="min-w-50px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                            ID {getSortIcon('id')}
                                        </th>
                                        <th className="min-w-150px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('merchant_id')}>
                                            Merchant {getSortIcon('merchant_id')}
                                        </th>
                                        <th className="min-w-150px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                            Name {getSortIcon('name')}
                                        </th>
                                        <th className="min-w-100px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('rate')}>
                                            Rate (%) {getSortIcon('rate')}
                                        </th>
                                        <th className="min-w-150px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('type')}>
                                            Type {getSortIcon('type')}
                                        </th>
                                        <th className="min-w-150px">Country</th>
                                        <th className="min-w-100px text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td className="text-end"><span className="placeholder col-6"></span></td>
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
                                placeholder="Quick search: Tax name, rate..."
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
                            Refreshing taxes...
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                        <thead>
                            <tr className="fw-bold text-muted">
                                <th className="min-w-50px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                    ID {getSortIcon('id')}
                                </th>
                                <th className="min-w-150px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('merchant_id')}>
                                    Merchant {getSortIcon('merchant_id')}
                                </th>
                                <th className="min-w-150px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                    Name {getSortIcon('name')}
                                </th>
                                <th className="min-w-100px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('rate')}>
                                    Rate (%) {getSortIcon('rate')}
                                </th>
                                <th className="min-w-150px user-select-none" style={{ cursor: 'pointer' }} onClick={() => handleSort('type')}>
                                    Type {getSortIcon('type')}
                                </th>
                                <th className="min-w-150px">Country</th>
                                <th className="min-w-100px text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxes.length > 0 ? (
                                taxes.map((tax) => (
                                    <tr key={tax.id}>
                                        <td>
                                            <span className="text-dark fw-bold">{tax.id}</span>
                                        </td>
                                        <td>{renderMerchant(tax?.shop_id)}</td>
                                        <td>
                                            <span className="text-dark fw-bold">{getTranslatedText(tax.name) || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <span className="badge badge-light-primary">{tax.rate}%</span>
                                        </td>
                                        <td>
                                            <span className="text-muted">{tax.type || 'N/A'}</span>
                                        </td>
                                        <td>{renderCountry(tax?.shop_id)}</td>
                                        <td className="text-end">
                                            <Link
                                                to={`/admin/sales/taxes/${tax.id}`}
                                                className="btn btn-sm btn-light-primary"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <div className="text-muted">No taxes found</div>
                                    </td>
                                </tr>
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
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(resolvedPagination.last_page)].map((_, index) => (
                                    <li key={index + 1} className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${pagination.current_page === resolvedPagination.last_page ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === resolvedPagination.last_page}
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

export default AdminTaxesIndex;

