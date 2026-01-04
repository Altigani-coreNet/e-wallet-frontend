import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { salesReportService } from '../../../services/salesReportService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ErrorAlert from '../../common/ErrorAlert';
import Swal from 'sweetalert2';
import SalesFiltersPanel from './SalesFiltersPanel';
import SearchSaleModal from './SearchSaleModal';

const ReturnsIndex = () => {
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
    const [returns, setReturns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Debounce filters
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const normalizePaymentMethod = (value) => {
        if (!value) return '';
        return String(value).trim().toLowerCase().replace(/\s+/g, '_');
    };

    const normalizePaymentStatus = (value) => {
        if (value === '' || value === null || value === undefined) return '';
        return Number(value);
    };

    // Build query params
    const queryParams = useMemo(() => {
        const paymentMethod = normalizePaymentMethod(debouncedFilters.payment_method);
        const paymentStatus = normalizePaymentStatus(debouncedFilters.payment_status);

        return {
            page: pagination.current_page,
            per_page: pagination.per_page,
            sort_by: sortConfig.column,
            sort_direction: sortConfig.direction,
            search: debouncedFilters.search,
            customer_id: debouncedFilters.customer_id,
            date_from: debouncedFilters.date_from,
            date_to: debouncedFilters.date_to,
            payment_method: paymentMethod || undefined,
            payment_type: paymentMethod || undefined,
            payment_status: paymentStatus === '' ? undefined : paymentStatus,
            sale_status: paymentStatus === '' ? undefined : paymentStatus,
        };
    }, [pagination.current_page, pagination.per_page, debouncedFilters, sortConfig.column, sortConfig.direction]);

    // Clear filters
    const handleClearFilters = useCallback(() => {
        setFilters({
            search: '',
            customer_id: '',
            date_from: '',
            date_to: '',
            payment_method: '',
            payment_status: '',
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    }, []);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const exportParams = {
                search: debouncedFilters.search,
                date_from: debouncedFilters.date_from,
                date_to: debouncedFilters.date_to,
            };

            await salesReportService.exportReturns(exportParams);
            toast.success('Returns exported successfully');
        } catch (err) {
            console.error('Error exporting returns:', err);
            toast.error('Failed to export returns');
        }
    }, [debouncedFilters]);

    // Set toolbar
    useEffect(() => {
        setTitle('Return Sales');
        setBreadcrumbs([
            { label: 'Dashboard', url: '/sales/dashboard' },
            { label: 'Sales Report', url: null },
            { label: 'Returns', url: null },
        ]);
        setActions(
            <div className="d-flex gap-2">
                {/* Return Sale – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-success fw-bold"
                    onClick={() => setShowSearchModal(true)}
                    aria-label="Return Sale"
                >
                    <i className="ki-duotone ki-arrow-left fs-6 text-white me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Return Sale
                    </span>
                </button>
                {/* Export – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-primary fw-bold"
                    onClick={handleExport}
                    aria-label="Export returns"
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
    }, [setTitle, setBreadcrumbs, setActions, showFilters, debouncedFilters, handleExport, handleClearFilters]);

    // Fetch returns
    const fetchReturns = async () => {
        setIsFetching(true);
        setError(null);

        try {
            const response = await salesReportService.getReturns(queryParams);

            // Handle response - data is in response.data.data
            const apiData = response?.data?.data || response?.data || {};
            
            setReturns(apiData.returns || []);
            setPagination(prev => ({
                ...prev,
                current_page: apiData.current_page || 1,
                per_page: apiData.per_page || 15,
                total: apiData.total || 0,
                last_page: apiData.last_page || Math.ceil((apiData.total || 0) / (apiData.per_page || 15))
            }));
        } catch (err) {
            console.error('Error fetching returns:', err);
            setError(err.response?.data?.message || 'Failed to fetch returns');
            toast.error('Failed to load returns');
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    // Fetch returns when query params change
    useEffect(() => {
        fetchReturns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    // Re-initialize KTMenu after returns data loads
    useEffect(() => {
        if (!isLoading && returns.length > 0) {
            // Re-initialize Metronic dropdowns
            if (window.KTMenu) {
                window.KTMenu.createInstances();
            }
        }
    }, [isLoading, returns]);

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

    // Handle view original sale
    const handleViewOriginalSale = (saleId) => {
        if (saleId) {
            navigate(`/sales/sales-report/${saleId}`);
        }
    };

    // Handle delete
    const handleDelete = async (id, reference_no) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete return ${reference_no}. This action cannot be undone!`,
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
                const message = response?.data?.message || 'Return deleted successfully';

                toast.success(message);
                fetchReturns(pagination.current_page);
            } catch (err) {
                console.error('Error deleting return:', err);
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
            <td><div className="skeleton-loader" style={{height: '20px', width: '100px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '150px'}}></div></td>
            <td className="text-end"><div className="skeleton-loader" style={{height: '30px', width: '100px', marginLeft: 'auto'}}></div></td>
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
                                placeholder="Search returns..."
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
                                    <th 
                                        className="min-w-125px"
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('total')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Grand Total {getSortIcon('total')}
                                        </span>
                                    </th>
                                    <th className="min-w-150px">Note</th>
                                    <th className="text-end min-w-100px">Original Sale</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {isLoading && returns.length === 0 ? (
                                    // Show skeleton loading
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : returns.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10">
                                            <div className="text-gray-500">No returns found</div>
                                        </td>
                                    </tr>
                                ) : (
                                    returns.map((returnItem) => (
                                        <tr key={returnItem.id}>
                                            <td>{returnItem.date}</td>
                                            <td>
                                                <span className="text-gray-800 text-hover-primary mb-1">
                                                    {returnItem.reference_no}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(returnItem, returnItem.tax || returnItem.total_tax || 0)}</td>
                                            <td>{formatCurrency(returnItem, returnItem.total_price)}</td>
                                            <td className="fw-bold">{formatCurrency(returnItem, returnItem.grand_total)}</td>
                                            <td>
                                                <span className="text-gray-600">
                                                    {returnItem.sale_note || returnItem.note || '-'}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                {returnItem.sale_id || returnItem.sale?.id ? (
                                                    <button
                                                        className="btn btn-sm btn-light-primary"
                                                        onClick={() => handleViewOriginalSale(returnItem.sale_id || returnItem.sale?.id)}
                                                        title="View Original Sale"
                                                    >
                                                        <i className="ki-duotone ki-arrow-right fs-6 me-1">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        View Sale
                                                    </button>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
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

            {/* Search Sale Modal */}
            <SearchSaleModal
                show={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onSaleFound={(sale) => {
                    // Navigate to return sale page with sale data
                    navigate(`/sales/return-sale/${sale.id}`, { state: { sale } });
                }}
            />
        </>
    );
};

export default ReturnsIndex;

