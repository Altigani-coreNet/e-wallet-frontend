import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { salesReportService } from '../../../services/salesReportService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ErrorAlert from '../../common/ErrorAlert';
import Swal from 'sweetalert2';
import SalesFiltersPanel from './SalesFiltersPanel';

const DraftsIndex = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        customer_id: '',
        date_from: '',
        date_to: '',
        payment_method: '',
        payment_status: '',
    });
    
    // Pagination state
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });

    // Debounced filters
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    
    // Data fetching state
    const [drafts, setDrafts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);

    // Set toolbar
    useEffect(() => {
        setTitle('Draft Sales');
        setBreadcrumbs([
            { label: 'Dashboard', url: '/sales/dashboard' },
            { label: 'Sales Report', url: null },
            { label: 'Drafts', url: null },
        ]);
        setActions(
            <div className="d-flex gap-2">
                {/* Export – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-primary fw-bold"
                    onClick={handleExport}
                    aria-label="Export draft sales"
                >
                    <i className="ki-duotone ki-file-down fs-6 text-white me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Export
                    </span>
                </button>
                {/* Clear Filters – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-light fw-bold"
                    onClick={handleClearFilters}
                    aria-label="Clear filters"
                >
                    <i className="ki-duotone ki-cross fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Clear Filters
                    </span>
                </button>
                {/* Toggle Filters – icon only on small, icon + text on large */}
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
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setBreadcrumbs, setActions, showFilters, debouncedFilters]);

    // Debounce filters
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Build query params
    const queryParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...debouncedFilters
    }), [pagination.current_page, pagination.per_page, debouncedFilters, sortConfig.column, sortConfig.direction]);

    // Fetch drafts
    const fetchDrafts = async () => {
        setIsFetching(true);
        setError(null);

        try {
            const response = await salesReportService.getDrafts(queryParams);

            // Handle response - data is in response.data.data
            const apiData = response?.data?.data || response?.data || {};
            
            setDrafts(apiData.sales || []);
            setPagination(prev => ({
                ...prev,
                current_page: apiData.current_page || 1,
                per_page: apiData.per_page || 15,
                total: apiData.total || 0,
                last_page: apiData.last_page || Math.ceil((apiData.total || 0) / (apiData.per_page || 15))
            }));
        } catch (err) {
            console.error('Error fetching drafts:', err);
            setError(err.response?.data?.message || 'Failed to fetch drafts');
            toast.error('Failed to load drafts');
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    // Fetch drafts when query params change
    useEffect(() => {
        fetchDrafts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    // Re-initialize KTMenu after drafts data loads
    useEffect(() => {
        if (!isLoading && drafts.length > 0) {
            // Re-initialize Metronic dropdowns
            if (window.KTMenu) {
                window.KTMenu.createInstances();
            }
        }
    }, [isLoading, drafts]);

    // Handle sort
    const handleSort = (column) => {
        const newDirection = 
            sortConfig.column === column && sortConfig.direction === 'asc' 
                ? 'desc' 
                : 'asc';
        
        setSortConfig({ column, direction: newDirection });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    // Handle per page change
    const handlePerPageChange = (newPerPage) => {
        setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    // Get sort icon for table headers
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
            <i className="ki-duotone ki-arrow-up fs-5 ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    };

    // Clear filters
    const handleClearFilters = () => {
        setFilters({
            search: '',
            customer_id: '',
            date_from: '',
            date_to: '',
            payment_method: '',
            payment_status: '',
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    // Handle export
    const handleExport = async () => {
        try {
            const exportParams = {
                search: debouncedFilters.search,
                customer_id: debouncedFilters.customer_id,
                date_from: debouncedFilters.date_from,
                date_to: debouncedFilters.date_to,
            };

            await salesReportService.exportDrafts(exportParams);
            toast.success('Drafts exported successfully');
        } catch (err) {
            console.error('Error exporting drafts:', err);
            toast.error('Failed to export drafts');
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const getCurrencySymbol = (sale) => {
        return sale.currency_symbol || sale.currency_object?.symbol || sale.currency_object?.currency_symbol || '$';
    };

    const formatCurrency = (sale, value) => {
        const symbol = getCurrencySymbol(sale);
        const amount = typeof value === 'number' ? value : parseFloat(value || 0);
        return `${symbol}${amount.toFixed(2)}`;
    };

    // Handle view
    const handleView = (id) => {
        navigate(`/sales/sales-report/${id}`);
    };

    // Handle continue (go to POS)
    const handleContinue = async (id) => {
        try {
            // Fetch draft sale details
            const response = await salesReportService.getSaleDetails(id);
            const saleData = response?.data.data || {};
            
            if (!saleData || !saleData.products || saleData.products.length === 0) {
                toast.error('Draft sale has no products');
                return;
            }

            const { clearCart, addToCart, selectCustomer, applyDiscount, setAppliedCoupon, updateQuantity } = usePosStore.getState();

            // Clear current cart
            clearCart();

            // Load products into cart
            saleData.products.forEach((product) => {
                // Map sale product to cart product format
                const cartProduct = {
                    id: product.product_id || product.id,
                    name: product.name || product.product_name || 'N/A',
                    code: product.code || product.sku,
                    price: product.net_unit_price || product.price || 0,
                    quantity: 1, // Start with 1, will update quantity after
                    tax: product.tax || 0,
                    tax_rate: product.tax_rate || 0,
                    tax_type: product.tax_type || 'exclusive',
                    variant_id: product.variant_id || null,
                    serial_imei_number: product.serial_imei_number || null,
                    thumbnail: product.thumbnail || product.image || null,
                    image: product.image || product.thumbnail || null,
                };

                // Add product to cart first (adds with quantity 1)
                addToCart(cartProduct);
                
                // Then update to correct quantity if more than 1
                if (product.qty && product.qty > 1) {
                    updateQuantity(cartProduct.id, product.qty);
                }
            });

            // Set customer if exists
            if (saleData.customer) {
                selectCustomer(saleData.customer);
            }

            // Apply discount if exists
            if (saleData.order_discount && saleData.order_discount > 0) {
                applyDiscount(saleData.order_discount);
            }

            // Apply coupon if exists
            if (saleData.coupon_id || saleData.coupon_discount) {
                setAppliedCoupon({
                    id: saleData.coupon_id,
                    discount: saleData.coupon_discount || 0,
                });
            }

            // Navigate to POS
            navigate('/sales/sale');
            toast.success('Draft loaded into POS');
        } catch (err) {
            console.error('Error loading draft:', err);
            toast.error('Failed to load draft into POS');
        }
    };

    // Handle delete
    const handleDelete = async (id, reference_no) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete draft ${reference_no}. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await salesReportService.deleteSale(id);
                const message = response?.data?.message || 'Draft deleted successfully';

                toast.success(message);
                fetchDrafts(pagination.current_page);
            } catch (err) {
                console.error('Error deleting draft:', err);
                const apiMessage = err?.response?.data?.message || err?.message || 'An unexpected error occurred';
                toast.error(apiMessage);
            }
        }
    };

    const getPaymentTypeBadgeClass = (methodRaw) => {
        if (!methodRaw) return 'badge-light-secondary';

        const method = String(methodRaw).toLowerCase();

        if (method === 'cash') return 'badge-light-primary';
        if (method === 'card') return 'badge-light-info';
        if (method === 'payment_link' || method === 'payment link') {
            return 'badge-light-warning';
        }
        if (method === 'qr_code' || method === 'qr code') {
            return 'badge-light-warning';
        }
        // Legacy support for old combined value
        if (method === 'payment link qr code' || method === 'payment_link_qr_code') {
            return 'badge-light-warning';
        }

        return 'badge-light-secondary';
    };

    const getPaymentStatusLabel = (status) => {
        const value = Number(status);

        switch (value) {
            case 0:
                return 'Unpaid';
            case 1:
                return 'Paid';
            case 2:
                return 'Partially Paid';
            case 3:
                return 'Unpaid';
            case 5:
                return 'Canceled';
            default:
                return 'Unknown';
        }
    };

    const getPaymentStatusBadgeClass = (status) => {
        const value = Number(status);

        switch (value) {
            case 0:
                return 'badge-light-warning';
            case 1:
                return 'badge-light-success';
            case 2:
                return 'badge-light-info';
            case 3:
                return 'badge-light-danger';
            case 5:
                return 'badge-light-dark';
            default:
                return 'badge-light-secondary';
        }
    };

    // Skeleton row component
    const SkeletonRow = () => (
        <tr>
            <td><div className="skeleton-loader" style={{height: '20px', width: '80px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '120px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '60px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '80px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '80px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '100px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '100px'}}></div></td>
            <td className="text-end"><div className="skeleton-loader" style={{height: '30px', width: '80px', marginLeft: 'auto'}}></div></td>
        </tr>
    );

    return (
        <>
            {/* Filters Panel */}
            {showFilters && (
                <SalesFiltersPanel
                    filters={filters}
                    setFilters={setFilters}
                />
            )}

            <div className="card">
                {/* Card Header */}
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex justify-content-between align-items-center w-100">
                        {/* Search */}
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-13"
                                placeholder="Search drafts..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        {/* Per Page Selector */}
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">Per Page:</label>
                            <select 
                                className="form-select form-select-sm" 
                                style={{width: '80px'}}
                                value={pagination.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Card Body */}
                <div className="card-body pt-0">
                    {/* Loading Bar - Shows on top of existing data when fetching */}
                    {isFetching && !isLoading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                            </div>
                        </div>
                    )}
                    
                    {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
                
                    {/* Table */}
                    <div className="table-responsive" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                    <th 
                                        className="min-w-100px"
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('date')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Date {getSortIcon('date')}
                                        </span>
                                    </th>
                                    <th 
                                        className="min-w-125px"
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('reference_no')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Reference No {getSortIcon('reference_no')}
                                        </span>
                                    </th>
                                    <th className="min-w-100px">Tax</th>
                                    <th className="min-w-125px">Total Price</th>
                                    <th className="min-w-125px">Payment Type</th>
                                    <th className="min-w-125px">Status</th>
                                    <th 
                                        className="min-w-125px"
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('total')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Grand Total {getSortIcon('total')}
                                        </span>
                                    </th>
                                    <th className="text-end min-w-100px">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {isLoading && drafts.length === 0 ? (
                                    // Show skeleton loading
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : drafts.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-10">
                                            <div className="text-gray-500">No drafts found</div>
                                        </td>
                                    </tr>
                                ) : (
                                    drafts.map((draft) => (
                                        <tr key={draft.id}>
                                            <td>{draft.date}</td>
                                            <td>
                                                <span className="text-gray-800 text-hover-primary mb-1">
                                                    {draft.reference_no}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(draft, draft.tax)}</td>
                                            <td>{formatCurrency(draft, draft.total_price)}</td>
                                            <td>
                                                {draft.payment_method || draft.payment_type ? (
                                                    <span className={`badge ${getPaymentTypeBadgeClass(draft.payment_method || draft.payment_type)}`}>
                                                        {draft.payment_method || draft.payment_type}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${getPaymentStatusBadgeClass(draft.payment_status ?? draft.sale_status)}`}>
                                                    {getPaymentStatusLabel(draft.payment_status ?? draft.sale_status)}
                                                </span>
                                            </td>
                                            <td className="fw-bold">{formatCurrency(draft, draft.grand_total)}</td>
                                            <td className="text-end">
                                                <div className="d-inline-block" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                                    <button className="btn btn-sm btn-light btn-active-light-primary">
                                                        Actions
                                                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                                                    </button>
                                                    
                                                    <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-150px py-4" data-kt-menu="true">
                                                        <div className="menu-item px-3">
                                                            <button
                                                                className="menu-link px-3 w-100 text-start"
                                                                onClick={() => handleView(draft.id)}
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                        <div className="menu-item px-3">
                                                            <button
                                                                className="menu-link px-3 text-primary w-100 text-start"
                                                                onClick={() => handleContinue(draft.id)}
                                                            >
                                                                Continue
                                                            </button>
                                                        </div>
                                                        <div className="menu-item px-3">
                                                            <button
                                                                className="menu-link px-3 text-danger w-100 text-start"
                                                                onClick={() => handleDelete(draft.id, draft.reference_no)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap pt-5">
                            <div className="fs-6 fw-semibold text-gray-700">
                                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                {pagination.total} entries
                            </div>
                            
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 || isFetching ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1 || isFetching}
                                    >
                                        Previous
                                    </button>
                                </li>
                                
                                {[...Array(Math.min(pagination.last_page, 10))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <li
                                            key={pageNum}
                                            className={`page-item ${pagination.current_page === pageNum ? 'active' : ''} ${isFetching ? 'disabled' : ''}`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={isFetching}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                })}
                                {pagination.last_page > 10 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                
                                <li className={`page-item ${pagination.current_page === pagination.last_page || isFetching ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page || isFetching}
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

export default DraftsIndex;

