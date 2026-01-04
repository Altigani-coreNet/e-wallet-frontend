import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import {
    useAdminSalesReport,
    useAdminSalesSummary,
} from '../../../services/adminReportsService';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';
import SearchableDropdown from '../../common/filters/SearchableDropdown';
import useAdminReportSelectOptions from '../../../hooks/useAdminReportSelectOptions';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';

const AdminSalesReport = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const merchantHelperDefault = 'Filter by merchant (shop)';

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        customer_id: '',
        warehouse_id: '',
        shop_id: '',
        country_id: '',
    });
    const [warehousesEnabled, setWarehousesEnabled] = useState(false);
    const [customersEnabled, setCustomersEnabled] = useState(false);
    const [warehouseSearch, setWarehouseSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    useEffect(() => {
        setTitle('Sales Reports');
        setActions(null);
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Sales', path: '/admin/sales/sales-list' },
            { label: 'Reports', path: '/admin/sales/reports/sales' },
            { label: 'Sales Reports', path: '/admin/sales/reports/sales', active: true },
        ]);

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setActions, setBreadcrumbs]);

    const {
        merchantOptionsForCountry,
        countryMerchantIds,
        warehouseOptions,
        customerOptions,
        isMerchantsLoading,
        isWarehousesLoading,
        isCustomersLoading,
        ensureMerchantOptionsLoaded,
    } = useAdminReportSelectOptions({
        countryId: filters.country_id,
        shopId: filters.shop_id,
        includeCustomers: true,
        loadWarehouses: warehousesEnabled,
        loadCustomers: customersEnabled,
        warehouseSearch,
        customerSearch,
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

    const selectedWarehouseOption = useMemo(() => {
        if (!filters.warehouse_id) {
            return null;
        }

        return (
            warehouseOptions.find(
                (option) =>
                    String(option.value) === String(filters.warehouse_id)
            ) || {
                value: String(filters.warehouse_id),
                label: `#${filters.warehouse_id}`,
            }
        );
    }, [warehouseOptions, filters.warehouse_id]);

    const selectedCustomerOption = useMemo(() => {
        if (!filters.customer_id) {
            return null;
        }

        return (
            customerOptions.find(
                (option) =>
                    String(option.value) === String(filters.customer_id)
            ) || {
                value: String(filters.customer_id),
                label: `#${filters.customer_id}`,
            }
        );
    }, [customerOptions, filters.customer_id]);

    const reportParams = useMemo(() => {
        const params = {
            from_date: filters.from_date || undefined,
            to_date: filters.to_date || undefined,
            warehouse_id: filters.warehouse_id || undefined,
            customer_id: filters.customer_id || undefined,
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

    const {
        data: salesData,
        isLoading: isSalesLoading,
        isFetching: isSalesFetching,
        error: salesError,
    } = useAdminSalesReport(reportParams);

    const summaryParams = useMemo(() => {
        const params = {
            from_date: filters.from_date || undefined,
            to_date: filters.to_date || undefined,
            warehouse_id: filters.warehouse_id || undefined,
            customer_id: filters.customer_id || undefined,
            country_id: filters.country_id || undefined,
        };

        if (filters.shop_id) {
            params.shop_id = filters.shop_id;
        } else if (filters.country_id && countryMerchantIds.length > 0) {
            params.shop_ids = countryMerchantIds;
        }

        return params;
    }, [filters, countryMerchantIds]);

    const [summaryEnabled, setSummaryEnabled] = useState(false);

    const {
        data: summaryData,
        isLoading: isSummaryLoading,
        error: summaryError,
    } = useAdminSalesSummary(summaryParams, {
        enabled: summaryEnabled,
    });

    useEffect(() => {
        if (!salesData || salesData.success === false) {
            return;
        }

        const paginationData = salesData.data?.pagination || {};

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
    }, [salesData]);

    useEffect(() => {
        if (!salesError) return;
        const message = salesError?.response?.data?.message || salesError.message || 'Failed to load sales data';
        toast.error(message);
    }, [salesError]);

    useEffect(() => {
        if (!summaryError) return;
        const message = summaryError?.response?.data?.message || summaryError.message || 'Failed to load sales summary';
        toast.error(message);
    }, [summaryError]);

    useEffect(() => {
        if (summaryEnabled) return;
        if (salesData || salesError) {
            setSummaryEnabled(true);
        }
    }, [salesData, salesError, summaryEnabled]);

    const sales = useMemo(() => {
        if (!salesData || salesData.success === false) return [];
        return (
            salesData.data?.data ||
            salesData.data?.items ||
            salesData.data ||
            []
        );
    }, [salesData]);

    const saleMerchantIds = useMemo(() => {
        if (!sales.length) return [];

        return [
            ...new Set(
                sales
                    .map((sale) => getShopId(sale))
                    .filter((id) => id !== null && id !== undefined && id !== '')
                    .map((id) => String(id))
            ),
        ];
    }, [sales]);

    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(saleMerchantIds);

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
                total_sales: 0,
                total_items: 0,
                total_paid: 0,
                total_amount: 0,
                total_due: 0,
            };
        }
        return summaryData.data || summaryData;
    }, [summaryData]);


    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const setFilterValue = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleMerchantChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            shop_id: value || '',
            warehouse_id: '',
            customer_id: '',
        }));
        setWarehousesEnabled(false);
        setWarehouseSearch('');
        setCustomersEnabled(false);
        setCustomerSearch('');
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleCountryChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            country_id: value || '',
            shop_id: value ? '' : prev.shop_id,
            warehouse_id: '',
            customer_id: '',
        }));
        setWarehousesEnabled(false);
        setWarehouseSearch('');
        setCustomersEnabled(false);
        setCustomerSearch('');
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleWarehouseSelect = (option) => {
        setFilterValue('warehouse_id', option?.id ?? option?.value ?? '');
    };

    const handleCustomerSelect = (option) => {
        setFilterValue('customer_id', option?.id ?? option?.value ?? '');
    };

    const handleClearFilters = () => {
        setFilters({
            from_date: '',
            to_date: '',
            customer_id: '',
            warehouse_id: '',
            shop_id: '',
            country_id: '',
        });
        setWarehousesEnabled(false);
        setWarehouseSearch('');
        setCustomersEnabled(false);
        setCustomerSearch('');
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination((prev) => ({ ...prev, current_page: page }));
    };

    const exportToCSV = () => {
        const headers = ['Reference', 'Date', 'Merchant', 'Country', 'Customer', 'Warehouse', 'Biller', 'Total', 'Paid', 'Due', 'Status'];
        const rows = sales.map((sale) => {
            const shopId = getShopId(sale);
            const info = getMerchantInfo(shopId, sale);

            return [
                sale.reference_no,
                sale.sale_date,
                info.merchantName || '',
                info.countryName || '',
                sale.customer,
                sale.warehouse,
                sale.biller,
                sale.grand_total,
                sale.paid_amount,
                sale.due,
                sale.payment_status,
            ];
        });

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Report exported successfully');
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            paid: 'badge bg-success',
            unpaid: 'badge bg-danger',
            partial: 'badge bg-warning',
        };
        return badges[status] || 'badge bg-secondary';
    };

    return (
        <>
            {(isSalesLoading || isSummaryLoading) && sales.length === 0 ? (
                <div className="row mb-4">
                    {[...Array(4)].map((_, index) => (
                        <div className="col-md-3" key={`skeleton-card-${index}`}>
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
                    ))}
                </div>
            ) : (
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Sales</h6>
                                <h4 className="mb-0">{summary.total_sales}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Items</h6>
                                <h4 className="mb-0">{summary.total_items?.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Paid</h6>
                                <h4 className="mb-0 text-success">
                                    ${summary.total_paid?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Due</h6>
                                <h4 className="mb-0 text-danger">
                                    ${summary.total_due?.toLocaleString(undefined, {
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
                        <MerchantCountryFilterFields
                            merchantValue={filters.shop_id}
                            countryValue={filters.country_id}
                            onMerchantChange={handleMerchantChange}
                            onCountryChange={handleCountryChange}
                            merchantPlaceholder="All Merchants"
                            countryPlaceholder="All Countries"
                            merchantWrapperClassName="col-md-3"
                            countryWrapperClassName="col-md-3"
                            merchantOptionsOverride={merchantOptionsForCountry}
                            merchantLoadingOverride={isMerchantsLoading}
                            merchantHelper={filters.country_id ? 'Showing merchants within the selected country' : merchantHelperDefault}
                            autoLoadOptions={false}
                            onMerchantOpen={ensureMerchantOptionsLoaded}
                            onCountryOpen={ensureMerchantOptionsLoaded}
                        />
                        <div className="col-md-3">
                            <SearchableDropdown
                                label="Warehouse"
                                placeholder="All Warehouses"
                                options={warehouseOptions}
                                selected={selectedWarehouseOption}
                                onSelect={handleWarehouseSelect}
                                onClear={() => setFilterValue('warehouse_id', '')}
                                loading={isWarehousesLoading}
                                onOpen={() => setWarehousesEnabled(true)}
                                onSearchChange={(value) => {
                                    setWarehouseSearch(value);
                                    setWarehousesEnabled(true);
                                }}
                                searchPlaceholder="Search warehouses..."
                            />
                        </div>
                        <div className="col-md-3">
                            <SearchableDropdown
                                label="Customer"
                                placeholder="All Customers"
                                options={customerOptions}
                                selected={selectedCustomerOption}
                                onSelect={handleCustomerSelect}
                                onClear={() => setFilterValue('customer_id', '')}
                                loading={isCustomersLoading}
                                onOpen={() => setCustomersEnabled(true)}
                                onSearchChange={(value) => {
                                    setCustomerSearch(value);
                                    setCustomersEnabled(true);
                                }}
                                searchPlaceholder="Search customers..."
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">From Date</label>
                            <input
                                type="date"
                                name="from_date"
                                className="form-control"
                                value={filters.from_date}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">To Date</label>
                            <input
                                type="date"
                                name="to_date"
                                className="form-control"
                                value={filters.to_date}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-12">
                            <button className="btn btn-secondary me-2" onClick={handleClearFilters}>
                                <i className="bx bx-x me-1"></i> Clear Filters
                            </button>
                            <button className="btn btn-success" onClick={exportToCSV} disabled={sales.length === 0}>
                                <i className="bx bx-download me-1"></i> Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {(salesError && !isSalesLoading) && (
                        <div className="alert alert-danger" role="alert">
                            {salesError?.response?.data?.message || salesError.message || 'Failed to load sales data'}
                        </div>
                    )}

                    {isSalesFetching && !isSalesLoading && (
                        <div className="alert alert-info d-flex align-items-center gap-2" role="status">
                            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                            <span>Refreshing sales data...</span>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Date</th>
                                    <th>Merchant</th>
                                    <th>Country</th>
                                    <th>Customer</th>
                                    <th>Warehouse</th>
                                    <th>Biller</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isSalesLoading && sales.length === 0 ? (
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-9"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))
                                ) : sales.length > 0 ? (
                                    sales.map((sale) => {
                                        const shopId = getShopId(sale);
                                        const info = getMerchantInfo(shopId, sale);
                                        const merchantLoading =
                                            Boolean(shopId) &&
                                            (merchantInfoLoading || hasPendingRequest(shopId)) &&
                                            !info.merchantName;
                                        const countryLoading =
                                            Boolean(shopId) &&
                                            (merchantInfoLoading || hasPendingRequest(shopId)) &&
                                            !info.countryName;

                                        return (
                                            <tr key={sale.id}>
                                                <td>{sale.reference_no}</td>
                                                <td>{sale.sale_date}</td>
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
                                                <td>{sale.customer || 'N/A'}</td>
                                                <td>{sale.warehouse || 'N/A'}</td>
                                                <td>{sale.biller || 'N/A'}</td>
                                                <td>${Number(sale.grand_total).toFixed(2)}</td>
                                                <td>${Number(sale.paid_amount).toFixed(2)}</td>
                                                <td>${Number(sale.due).toFixed(2)}</td>
                                                <td>
                                                    <span className={getPaymentStatusBadge(sale.payment_status)}>
                                                        {sale.payment_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="text-center py-4">
                                            No sales found
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

export default AdminSalesReport;

