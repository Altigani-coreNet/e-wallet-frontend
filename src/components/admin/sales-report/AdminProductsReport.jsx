import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import {
    useAdminProductsReport,
    useAdminProductsSummary,
} from '../../../services/adminReportsService';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';
import useAdminReportSelectOptions from '../../../hooks/useAdminReportSelectOptions';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';

const AdminProductsReport = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const merchantHelperDefault = 'Filter by merchant (shop)';

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        status: '',
        shop_id: '',
        country_id: '',
    });

    useEffect(() => {
        setTitle('Products Reports');
        setActions(null);
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Sales', path: '/admin/sales/sales-list' },
            { label: 'Reports', path: '/admin/sales/reports/products' },
            { label: 'Products Reports', path: '/admin/sales/reports/products', active: true },
        ]);

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setActions, setBreadcrumbs]);

    const {
        merchantOptionsForCountry,
        countryMerchantIds,
        isMerchantsLoading,
        ensureMerchantOptionsLoaded,
    } = useAdminReportSelectOptions({
        countryId: filters.country_id,
        shopId: filters.shop_id,
        autoLoadMerchants: false,
    });

    const getShopId = (entry) => {
        if (!entry) return '';
        return (
            entry.shop_id ??
            entry.merchant_id ??
            entry.shopId ??
            entry.merchantId ??
            entry.shop?.id ??
            entry.merchant?.id ??
            ''
        );
    };

    const reportParams = useMemo(() => {
        const params = {
            start_date: filters.start_date || undefined,
            end_date: filters.end_date || undefined,
            status: filters.status || undefined,
            country_id: filters.country_id || undefined,
            page: pagination.current_page,
            per_page: pagination.per_page,
        };

        if (filters.shop_id) {
            params.shop_id = filters.shop_id;
        } else if (filters.country_id && countryMerchantIds.length > 0) {
            params.shop_ids = countryMerchantIds;
        }

        return params;
    }, [filters, pagination.current_page, pagination.per_page, countryMerchantIds]);

    const summaryParams = useMemo(() => {
        const params = {
            start_date: filters.start_date || undefined,
            end_date: filters.end_date || undefined,
            status: filters.status || undefined,
            country_id: filters.country_id || undefined,
        };

        if (filters.shop_id) {
            params.shop_id = filters.shop_id;
        } else if (filters.country_id && countryMerchantIds.length > 0) {
            params.shop_ids = countryMerchantIds;
        }

        return params;
    }, [filters, countryMerchantIds]);

    const {
        data: productsData,
        isLoading: isProductsLoading,
        isFetching: isProductsFetching,
        error: productsError,
    } = useAdminProductsReport(reportParams);

    const [summaryEnabled, setSummaryEnabled] = useState(false);

    const {
        data: summaryData,
        isLoading: isSummaryLoading,
        error: summaryError,
    } = useAdminProductsSummary(summaryParams, {
        enabled: summaryEnabled,
    });

    useEffect(() => {
        if (!productsData || productsData.success === false) {
            return;
        }

        const paginationData = productsData.data?.pagination || {};

        setPagination((prev) => {
            const next = {
                ...prev,
                ...paginationData,
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
    }, [productsData]);

    useEffect(() => {
        if (!productsError) return;
        const message = productsError?.response?.data?.message || productsError.message || 'Failed to load products data';
        toast.error(message);
    }, [productsError]);

    useEffect(() => {
        if (summaryEnabled) return;
        if (productsData || productsError) {
            setSummaryEnabled(true);
        }
    }, [productsData, productsError, summaryEnabled]);

    useEffect(() => {
        if (!summaryError) return;
        const message = summaryError?.response?.data?.message || summaryError.message || 'Failed to load product summary';
        toast.error(message);
    }, [summaryError]);

    const products = useMemo(() => {
        if (!productsData || productsData.success === false) return [];
        return (
            productsData.data?.data ||
            productsData.data?.items ||
            productsData.data ||
            []
        );
    }, [productsData]);

    const productMerchantIds = useMemo(() => {
        if (!products.length) return [];
        return [
            ...new Set(
                products
                    .map((product) => getShopId(product))
                    .filter((id) => id !== null && id !== undefined && id !== '')
                    .map((id) => String(id))
            ),
        ];
    }, [products]);

    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(productMerchantIds);

    const getMerchantInfo = useCallback(
        (shopId, entry) => {
            if (!shopId) {
                return {
                    merchantName:
                        entry?.merchant_name ||
                        entry?.merchant?.name ||
                        entry?.merchant ||
                        '',
                    countryName:
                        entry?.country_name ||
                        entry?.country?.name ||
                        entry?.country ||
                        '',
                };
            }

            const record = getMerchantInfoById(shopId);

            if (record) {
                return {
                    merchantName: record.name || '',
                    countryName: record.countryName || '',
                };
            }

            return {
                merchantName: '',
                countryName: '',
            };
        },
        [getMerchantInfoById]
    );

    const summary = useMemo(() => {
        if (!summaryData || summaryData.success === false) {
            return {
                total_purchase_amount: 0,
                total_sale_amount: 0,
            };
        }
        return summaryData.data || summaryData;
    }, [summaryData]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleMerchantChange = (value) => {
        setFilters((prev) => ({ ...prev, shop_id: value || '' }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleCountryChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            country_id: value || '',
            shop_id: value ? '' : prev.shop_id,
        }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleClearFilters = () => {
        setFilters({
            start_date: '',
            end_date: '',
            status: '',
            shop_id: '',
            country_id: '',
        });
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination((prev) => ({ ...prev, current_page: page }));
    };

    const exportToCSV = () => {
        const headers = ['Product Name', 'SKU', 'Merchant', 'Country', 'Purchase Qty', 'Purchase Amount', 'Sale Qty', 'Sale Amount', 'Returns'];
        const rows = products.map((product) => {
            const shopId = getShopId(product);
            const info = getMerchantInfo(shopId, product);

            return [
                product.product_name,
                product.sku,
                info.merchantName || '',
                info.countryName || '',
                product.total_purchase_qty,
                product.total_purchase_price,
                product.total_sale_qty,
                product.total_sale_price,
                product.total_sale_returns,
            ];
        });

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-products-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Report exported successfully');
    };

    return (
        <>
            {(isProductsLoading || isSummaryLoading) && products.length === 0 ? (
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-6"></span>
                                    <h4 className="mb-0 mt-2">
                                        <span className="placeholder col-4"></span>
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-6"></span>
                                    <h4 className="mb-0 mt-2">
                                        <span className="placeholder col-4"></span>
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Purchase Amount</h6>
                                <h4 className="mb-0 text-primary">
                                    ${summary.total_purchase_amount?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Sale Amount</h6>
                                <h4 className="mb-0 text-success">
                                    ${summary.total_sale_amount?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                className="form-control"
                                value={filters.start_date}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                className="form-control"
                                value={filters.end_date}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Status</label>
                            <select
                                name="status"
                                className="form-select"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <MerchantCountryFilterFields
                            merchantValue={filters.shop_id}
                            countryValue={filters.country_id}
                            onMerchantChange={handleMerchantChange}
                            onCountryChange={handleCountryChange}
                            merchantPlaceholder="All Merchants"
                            countryPlaceholder="All Countries"
                            merchantWrapperClassName="col-md-4"
                            countryWrapperClassName="col-md-4"
                            merchantOptionsOverride={merchantOptionsForCountry}
                            merchantLoadingOverride={isMerchantsLoading}
                            merchantHelper={filters.country_id ? 'Showing merchants within the selected country' : merchantHelperDefault}
                            autoLoadOptions={false}
                            onMerchantOpen={ensureMerchantOptionsLoaded}
                            onCountryOpen={ensureMerchantOptionsLoaded}
                        />
                        <div className="col-12">
                            <button className="btn btn-secondary me-2" onClick={handleClearFilters}>
                                <i className="bx bx-x me-1"></i> Clear Filters
                            </button>
                            <button className="btn btn-success" onClick={exportToCSV} disabled={products.length === 0}>
                                <i className="bx bx-download me-1"></i> Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {(productsError && !isProductsLoading) && (
                        <div className="alert alert-danger" role="alert">
                            {productsError?.response?.data?.message || productsError.message || 'Failed to load products data'}
                        </div>
                    )}

                    {isProductsFetching && !isProductsLoading && (
                        <div className="alert alert-info d-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm"></span>
                            <span>Refreshing product report...</span>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Merchant</th>
                                    <th>Country</th>
                                    <th>Purchase Qty</th>
                                    <th>Purchase Amount</th>
                                    <th>Sale Qty</th>
                                    <th>Sale Amount</th>
                                    <th>Returns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isProductsLoading && products.length === 0 ? (
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-5"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-5"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-5"></span></td>
                                        </tr>
                                    ))
                                ) : products.length > 0 ? (
                                    products.map((product) => {
                                        const shopId = getShopId(product);
                                        const info = getMerchantInfo(shopId, product);
                                        const merchantLoading =
                                            Boolean(shopId) &&
                                            (merchantInfoLoading || hasPendingRequest(shopId)) &&
                                            !info.merchantName;
                                        const countryLoading =
                                            Boolean(shopId) &&
                                            (merchantInfoLoading || hasPendingRequest(shopId)) &&
                                            !info.countryName;

                                        return (
                                            <tr key={product.id}>
                                                <td>{product.product_name}</td>
                                                <td>{product.sku}</td>
                                                <td>
                                                    {merchantLoading ? (
                                                        <span className="placeholder col-8"></span>
                                                    ) : info.merchantName}
                                                </td>
                                                <td>
                                                    {countryLoading ? (
                                                        <span className="placeholder col-6"></span>
                                                    ) : info.countryName}
                                                </td>
                                                <td>{Number(product.total_purchase_qty)}</td>
                                                <td>${Number(product.total_purchase_price).toFixed(2)}</td>
                                                <td>{Number(product.total_sale_qty)}</td>
                                                <td>${Number(product.total_sale_price).toFixed(2)}</td>
                                                <td>{Number(product.total_sale_returns)}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.last_page > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(pagination.last_page)].map((_, index) => (
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
                        </nav>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminProductsReport;

