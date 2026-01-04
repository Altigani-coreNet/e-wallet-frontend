import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminCoupons, exportCoupons } from '../../../services/adminCouponsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import { downloadCSV } from '../../../utils/export';
import CouponFiltersPanel from './CouponFiltersPanel';

const initialFilters = {
    search: '',
    date_from: '',
    date_to: '',
};

const AdminCouponsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const { merchantsMap, countriesMap, loading: refDataLoading } = useAdminReferenceData();

    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);

    useEffect(() => {
        setTitle('Coupons Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle filters"
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Toggle Filters
                    </span>
                </button>
                {/* Export – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-light-primary fw-bold"
                    onClick={handleExport}
                    aria-label="Export coupons"
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTitle, setActions, showFilters]);

    const couponParams = useMemo(
        () => ({
            page: pagination.current_page,
            per_page: pagination.per_page,
            ...appliedFilters,
        }),
        [pagination.current_page, pagination.per_page, appliedFilters]
    );

    const {
        data: couponsData,
        isLoading,
        isFetching,
        error: couponsError,
    } = useAdminCoupons(couponParams);

    useEffect(() => {
        if (!couponsData || couponsData.success === false || !couponsData.data) {
            return;
        }

        const { current_page, per_page, total, last_page } = couponsData.data || {};

        setPagination((prev) => ({
            ...prev,
            current_page: current_page ?? prev.current_page,
            per_page: per_page ?? prev.per_page,
            total: total ?? prev.total,
            last_page: last_page ?? prev.last_page,
        }));
    }, [couponsData]);

    useEffect(() => {
        if (!couponsData) return;
        if (couponsData.success === false) {
            const message =
                couponsData?.message ||
                couponsData?.error ||
                couponsData?.data?.message ||
                'Failed to load coupons';
            toast.error(message);
        }
    }, [couponsData]);

    useEffect(() => {
        if (!couponsError) return;
        const message = couponsError?.response?.data?.message || couponsError.message || 'Failed to load coupons';
        toast.error(message);
    }, [couponsError]);

    const coupons = useMemo(() => {
        if (!couponsData || couponsData.success === false) return [];
        const container = couponsData?.data?.data || couponsData?.data?.coupons || [];
        return Array.isArray(container) ? container : [];
    }, [couponsData]);

    const couponShopIds = useMemo(() => {
        if (!coupons.length) return [];
        const ids = new Set();
        coupons.forEach((coupon) => {
            const shopId = coupon?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [coupons]);

    const merchantLookups = useMerchantCountryLookup(couponShopIds);
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

    const resolvedPagination = useMemo(() => {
        if (!couponsData || couponsData.success === false || !couponsData.data) {
            return pagination;
        }
        const { total, last_page } = couponsData.data || {};
        return {
            ...pagination,
            total: total ?? pagination.total,
            last_page: last_page ?? pagination.last_page,
        };
    }, [couponsData, pagination]);

    const handleApplyFilters = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleQuickSearch = (value) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setAppliedFilters(newFilters);
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        const totalPages = Math.max(1, resolvedPagination.last_page || pagination.last_page || 1);
        if (page >= 1 && page <= totalPages) {
            setPagination((prev) => ({ ...prev, current_page: page }));
        }
    };

    const handlePerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(e.target.value),
            current_page: 1
        }));
    };

    const handleExport = useCallback(async () => {
        try {
            const response = await exportCoupons({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || [];
            if (success && exportRows.length > 0) {
                downloadCSV(exportRows, exportPayload?.filename || 'coupons_export.csv');
                toast.success('Coupons export ready');
            } else {
                toast.info('No coupons to export');
            }
        } catch (error) {
            console.error('Error exporting coupons:', error);
            toast.error('Failed to export coupons');
        }
    }, [appliedFilters]);

    if (isLoading && !couponsData) {
        return (
            <>
                {showFilters && (
                    <CouponFiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                    />
                )}
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
                                    placeholder="Quick search: Coupon code, name..."
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
                                        <th className="min-w-50px">ID</th>
                                        <th className="min-w-150px">Code</th>
                                        <th className="min-w-150px">Name</th>
                                        <th className="min-w-100px">Type</th>
                                        <th className="min-w-100px">Amount</th>
                                        <th className="min-w-100px">Usage</th>
                                        <th className="min-w-150px">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
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
            {showFilters && (
                <CouponFiltersPanel
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                />
            )}

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
                                placeholder="Quick search: Coupon code, name..."
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
                            Refreshing coupons...
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th className="min-w-50px">ID</th>
                                    <th className="min-w-150px">Code</th>
                                    <th className="min-w-150px">Name</th>
                                    <th className="min-w-100px">Type</th>
                                    <th className="min-w-100px">Amount</th>
                                    <th className="min-w-100px">Usage</th>
                                    <th>Merchant</th>
                                    <th>Country</th>
                                    <th className="min-w-150px">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.length > 0 ? (
                                    coupons.map((coupon) => (
                                        <tr key={coupon.id}>
                                            <td>
                                                <span className="text-dark fw-bold">{coupon.id}</span>
                                            </td>
                                            <td>
                                                <span className="badge badge-light-primary">{coupon.code}</span>
                                            </td>
                                            <td>{coupon.name}</td>
                                            <td className="text-capitalize">{coupon.type}</td>
                                            <td>{coupon.amount}</td>
                                            <td>
                                                {(coupon.used ?? 0) + ' / ' + (coupon.qty ?? 0)}
                                            </td>
                                            <td>{renderMerchant(coupon?.shop_id)}</td>
                                            <td>{renderCountry(coupon?.shop_id)}</td>
                                            <td>
                                                {coupon.created_at || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <div className="text-muted">No coupons found</div>
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
                                    const start = (currentPage - 1) * perPage + 1;
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
                                    <li
                                        key={index + 1}
                                        className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${
                                        pagination.current_page === resolvedPagination.last_page ? 'disabled' : ''
                                    }`}
                                >
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

export default AdminCouponsIndex;


