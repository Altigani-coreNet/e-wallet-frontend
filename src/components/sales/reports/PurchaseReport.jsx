import React, { useState, useEffect, useCallback } from 'react';
import { fetchPurchaseData, fetchPurchaseSummary } from '../../../services/reportsService';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { get } from '../../../utils/api';
import { POS_ENDPOINTS } from '../../../utils/constants';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

export default function PurchaseReport() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [purchases, setPurchases] = useState([]);
    const [summary, setSummary] = useState({
        total_purchases: 0,
        total_items: 0,
        total_paid: 0,
        total_amount: 0,
        total_due: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    // Filter states
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        supplier_id: '',
        warehouse_id: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // Dropdown lists
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Define server-side export function
    const exportToCSV = useCallback(async () => {
        try {
            setExporting(true);
            const token = localStorage.getItem('token');
            
            // Build query params, only include non-empty filters
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });
            
            const response = await fetch(`${POS_ENDPOINTS.REPORTS_PURCHASES_EXPORT}?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv',
                },
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `purchase-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (err) {
            console.error('Error exporting report:', err);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    }, [filters]);

    // Fetch suppliers and warehouses lists
    useEffect(() => {
        fetchSuppliers();
        fetchWarehouses();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            const response = await get(POS_ENDPOINTS.SUPPLIERS, {
                params: {
                    per_page: 1000, // Get all suppliers
                }
            });
            // Handle different response structures
            let suppliersData = [];
            if (response.data?.data) {
                if (Array.isArray(response.data.data)) {
                    suppliersData = response.data.data;
                } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
                    suppliersData = response.data.data.data;
                } else if (response.data.data.suppliers && Array.isArray(response.data.data.suppliers)) {
                    suppliersData = response.data.data.suppliers;
                }
            }
            setSuppliers(suppliersData);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const endpoint = POS_ENDPOINTS.WAREHOUSES_SELECT || POS_ENDPOINTS.WAREHOUSES;
            const response = await get(endpoint, {
                params: endpoint === POS_ENDPOINTS.WAREHOUSES_SELECT ? {} : {
                    per_page: 1000, // Get all warehouses
                }
            });
            // Handle different response structures
            let warehousesData = [];
            if (response.data?.data) {
                if (Array.isArray(response.data.data)) {
                    warehousesData = response.data.data;
                } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
                    warehousesData = response.data.data.data;
                } else if (response.data.data.warehouses && Array.isArray(response.data.data.warehouses)) {
                    warehousesData = response.data.data.warehouses;
                }
            }
            setWarehouses(warehousesData);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Purchase Reports');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Reports', path: '#' },
            { label: 'Purchase Reports', path: '/sales/reports/purchases', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

    // Set toolbar actions
    useEffect(() => {
        setActions(
            <>
                <button 
                    className="btn btn-sm btn-light-primary" 
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className={`bx ${showFilters ? 'bx-hide' : 'bx-filter'} me-1`}></i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button 
                    className="btn btn-sm btn-success" 
                    onClick={exportToCSV}
                    disabled={exporting}
                >
                    <i className={`bx ${exporting ? 'bx-loader-alt bx-spin' : 'bx-download'} me-1`}></i>
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </>
        );

        return () => {
            setActions(null);
        };
    }, [setActions, showFilters, exportToCSV, exporting]);

    useEffect(() => {
        fetchPurchases();
        fetchSummaryData();
    }, [filters.from_date, filters.to_date, filters.supplier_id, filters.warehouse_id, pagination.current_page]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchPurchaseData({
                ...filters,
                page: pagination.current_page,
                per_page: pagination.per_page,
            });

            // API returns data nested in response.data.data
            const purchasesData = response.data?.data || [];
            const paginationData = response.data?.pagination || pagination;
            
            setPurchases(purchasesData);
            setPagination(paginationData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching purchases:', err);
            setError(err.response?.data?.message || 'Failed to load purchases');
            setLoading(false);
            toast.error('Failed to load purchase data');
        }
    };

    const fetchSummaryData = async () => {
        try {
            const response = await fetchPurchaseSummary(filters);
            // fetchPurchaseSummary returns response.data, which is { message: "...", data: { ... } }
            const summaryData = response.data || {};
            
            // Only update if we have valid data
            if (summaryData && (summaryData.total_purchases !== undefined || summaryData.total_amount !== undefined)) {
                setSummary({
                    total_purchases: summaryData.total_purchases ?? 0,
                    total_items: summaryData.total_items ?? 0,
                    total_paid: summaryData.total_paid ?? 0,
                    total_amount: summaryData.total_amount ?? 0,
                    total_due: summaryData.total_due ?? 0,
                });
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
            console.error('Error details:', err.response?.data);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            paid: 'badge bg-success',
            unpaid: 'badge bg-danger',
            partial: 'badge bg-warning'
        };
        return badges[status] || 'badge bg-secondary';
    };

    return (
        <>
            {/* Filters */}
            {showFilters && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
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
                            <div className="col-md-3">
                                <SearchableDropdown
                                    label="Supplier"
                                    placeholder="All Suppliers"
                                    options={suppliers.map(supplier => ({
                                        value: supplier.id,
                                        label: supplier.name || supplier.supplier_name || `Supplier #${supplier.id}`
                                    }))}
                                    selected={filters.supplier_id || null}
                                    onSelect={(option) => {
                                        setFilters(prev => ({ ...prev, supplier_id: option.value }));
                                        setPagination(prev => ({ ...prev, current_page: 1 }));
                                    }}
                                    onClear={() => {
                                        setFilters(prev => ({ ...prev, supplier_id: '' }));
                                        setPagination(prev => ({ ...prev, current_page: 1 }));
                                    }}
                                    disabled={loadingSuppliers}
                                    loading={loadingSuppliers}
                                    showClear={true}
                                    name="supplier_id"
                                />
                            </div>
                            <div className="col-md-3">
                                <SearchableDropdown
                                    label="Warehouse"
                                    placeholder="All Warehouses"
                                    options={warehouses.map(warehouse => ({
                                        value: warehouse.id,
                                        label: warehouse.name || warehouse.warehouse_name || `Warehouse #${warehouse.id}`
                                    }))}
                                    selected={filters.warehouse_id || null}
                                    onSelect={(option) => {
                                        setFilters(prev => ({ ...prev, warehouse_id: option.value }));
                                        setPagination(prev => ({ ...prev, current_page: 1 }));
                                    }}
                                    onClear={() => {
                                        setFilters(prev => ({ ...prev, warehouse_id: '' }));
                                        setPagination(prev => ({ ...prev, current_page: 1 }));
                                    }}
                                    disabled={loadingWarehouses}
                                    loading={loadingWarehouses}
                                    showClear={true}
                                    name="warehouse_id"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {loading && purchases.length === 0 ? (
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
                                <h6 className="text-muted mb-2">Total Purchases</h6>
                                <h4 className="mb-0">{summary.total_purchases}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Items</h6>
                                <h4 className="mb-0">{summary.total_items.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Paid</h6>
                                <h4 className="mb-0 text-success">${summary.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Due</h6>
                                <h4 className="mb-0 text-danger">${summary.total_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="card">
                <div className="card-body">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Date</th>
                                    <th>Supplier</th>
                                    <th>Warehouse</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && purchases.length === 0 ? (
                                    // Skeleton rows
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-9"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))
                                ) : purchases.length > 0 ? (
                                    purchases.map(purchase => (
                                        <tr key={purchase.id}>
                                            <td>{purchase.reference_no}</td>
                                            <td>{purchase.purchase_date}</td>
                                            <td>{purchase.supplier}</td>
                                            <td>{purchase.warehouse}</td>
                                            <td>${purchase.grand_total.toFixed(2)}</td>
                                            <td>${purchase.paid_amount.toFixed(2)}</td>
                                            <td>${purchase.due.toFixed(2)}</td>
                                            <td>
                                                <span className={getPaymentStatusBadge(purchase.payment_status)}>
                                                    {purchase.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            No purchases found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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
}

