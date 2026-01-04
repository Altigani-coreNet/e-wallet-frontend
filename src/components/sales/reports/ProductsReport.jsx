import React, { useState, useEffect, useCallback } from 'react';
import { fetchProductsData, fetchProductsSummary } from '../../../services/reportsService';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { POS_ENDPOINTS } from '../../../utils/constants';

export default function ProductsReport() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState({
        total_purchase_amount: 0,
        total_sale_amount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    // Filter states - separate temp filters from applied filters
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({
        start_date: '',
        end_date: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Define server-side export function
    const exportToCSV = useCallback(async () => {
        try {
            setExporting(true);
            const token = localStorage.getItem('token');
            
            // Build query params, only include non-empty filters
            const params = new URLSearchParams();
            Object.keys(appliedFilters).forEach(key => {
                if (appliedFilters[key]) {
                    params.append(key, appliedFilters[key]);
                }
            });
            
            const response = await fetch(`${POS_ENDPOINTS.REPORTS_PRODUCTS_EXPORT}?${params}`, {
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
            a.download = `products-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (err) {
            console.error('Error exporting report:', err);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    }, [appliedFilters]);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Products Reports');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Reports', path: '#' },
            { label: 'Products Reports', path: '/sales/reports/products', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

    // Set toolbar actions (separate useEffect to avoid initialization order issue)
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
    }, [setActions, showFilters, exportToCSV, products.length]);

    useEffect(() => {
        fetchProducts();
        fetchSummaryData();
    }, [appliedFilters.start_date, appliedFilters.end_date, pagination.current_page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetchProductsData({
                ...appliedFilters,
                page: pagination.current_page,
                per_page: pagination.per_page,
            });

            // API returns data nested in response.data.data
            const productsData = response.data?.data || [];
            const paginationData = response.data?.pagination || pagination;
            
            setProducts(productsData);
            setPagination(paginationData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.response?.data?.message || 'Failed to load products');
            setLoading(false);
            toast.error('Failed to load products data');
        }
    };

    const fetchSummaryData = async () => {
        try {
            const response = await fetchProductsSummary(appliedFilters);
            // fetchProductsSummary returns response.data, which is { message: "...", data: { ... } }
            const summaryData = response.data || {};
            
            // Only update if we have valid data
            if (summaryData && (summaryData.total_purchase_amount !== undefined || summaryData.total_sale_amount !== undefined)) {
                setSummary({
                    total_purchase_amount: summaryData.total_purchase_amount ?? 0,
                    total_sale_amount: summaryData.total_sale_amount ?? 0,
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
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    return (
        <>
            {/* Filters */}
            {showFilters && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    className="form-control"
                                    value={filters.start_date}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    className="form-control"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="col-12">
                                <button className="btn btn-primary" onClick={handleApplyFilters}>
                                    <i className="bx bx-check me-1"></i> Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {loading && products.length === 0 ? (
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
                                <h4 className="mb-0 text-primary">${summary.total_purchase_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h6 className="text-muted mb-2">Total Sale Amount</h6>
                                <h4 className="mb-0 text-success">${summary.total_sale_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
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
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Purchase Qty</th>
                                    <th>Purchase Amount</th>
                                    <th>Sale Qty</th>
                                    <th>Sale Amount</th>
                                    <th>Returns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && products.length === 0 ? (
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-5"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-5"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-5"></span></td>
                                        </tr>
                                    ))
                                ) : products.length > 0 ? (
                                    products.map(product => (
                                        <tr key={product.id}>
                                            <td>{product.product_name}</td>
                                            <td>{product.sku}</td>
                                            <td>{product.total_purchase_qty}</td>
                                            <td>${product.total_purchase_price.toFixed(2)}</td>
                                            <td>{product.total_sale_qty}</td>
                                            <td>${product.total_sale_price.toFixed(2)}</td>
                                            <td>{product.total_sale_returns}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            No products found
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

