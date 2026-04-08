import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useSales, salesReportService, salesKeys } from '../../../services/salesReportService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ErrorAlert from '../../common/ErrorAlert';
import Swal from 'sweetalert2';
import SalesFiltersPanel from './SalesFiltersPanel';
import useUserInfo from '../../../hooks/useUserInfo';

const SalesIndex = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        customer_id: '',
        user_id: '',
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
    
    // Debounce filters
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Normalize filters so API receives the expected values
    const normalizePaymentMethod = (value) => {
        if (!value) return '';
        return String(value).trim().toLowerCase().replace(/\s+/g, '_');
    };

    const normalizePaymentStatus = (value) => {
        if (value === '' || value === null || value === undefined) return '';
        return Number(value);
    };

    // Build query params for React Query
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
            user_id: debouncedFilters.user_id || undefined,
            date_from: debouncedFilters.date_from,
            date_to: debouncedFilters.date_to,
            // Send both keys to match API variations
            payment_method: paymentMethod || undefined,
            payment_type: paymentMethod || undefined,
            payment_status: paymentStatus === '' ? undefined : paymentStatus,
            sale_status: paymentStatus === '' ? undefined : paymentStatus,
        };
    }, [pagination.current_page, pagination.per_page, debouncedFilters, sortConfig.column, sortConfig.direction]);

    // Use React Query to fetch sales
    const { 
        data: salesResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useSales(queryParams, {
        keepPreviousData: true,
        onSuccess: (response) => {
            // Update pagination from response
            if (response.data?.pagination) {
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }));
            } else if (response.data?.current_page !== undefined) {
                setPagination({
                    current_page: response.data.current_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                    last_page: response.data.last_page || Math.ceil(response.data.total / response.data.per_page)
                });
            }
        },
        onError: (err) => {
            console.error('Error fetching sales:', err);
            toast.error('Failed to load sales');
        }
    });

    // Extract sales from response
    const sales = useMemo(() => {
        const salesData = salesResponse?.data?.sales || [];
        return Array.isArray(salesData) ? salesData : [];
    }, [salesResponse]);

    // User info lookup (batch from AuthService)
    const userIds = useMemo(() => {
        if (!sales || !sales.length) return [];
        return [
            ...new Set(
                sales
                    .map(sale =>
                        sale.user_id
                        ?? sale.created_by
                        ?? sale.creator_id
                        ?? sale.staff_id
                        ?? sale.staff?.id
                        ?? sale.user?.id
                        ?? null
                    )
                    .filter(id => id !== null && id !== undefined && id !== '')
                    .map(id => String(id))
            ),
        ];
    }, [sales]);
    const {
        loading: userInfoLoading,
        getUserInfoById,
        hasPendingRequest: hasPendingUserRequest,
    } = useUserInfo(userIds);

    // Set toolbar
    useEffect(() => {
        setTitle('Sales');
        setBreadcrumbs([
            { label: 'Dashboard', url: '/sales/dashboard' },
            { label: 'Sales Report', url: null },
            { label: 'Sales', url: null },
        ]);
        setActions(
            <div className="d-flex gap-2">
                {/* Export – icon only on small screens, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-primary fw-bold"
                    onClick={handleExport}
                    aria-label="Export sales"
                >
                    <i className="ki-duotone ki-file-down fs-6 text-white me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Export
                    </span>
                </button>

                {/* Clear filters – icon only on small screens, icon + text on large */}
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

                {/* Toggle filters – icon only on small screens, icon + text on large */}
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFilters, debouncedFilters, sortConfig]);

    // Re-initialize KTMenu after sales data loads
    useEffect(() => {
        if (!isLoading && sales.length > 0) {
            // Re-initialize Metronic dropdowns
            if (window.KTMenu) {
                window.KTMenu.createInstances();
            }
        }
    }, [isLoading, sales]);

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

    // Get sort icon for table headers (explicit arrows for visibility)
    const getSortIcon = (column) => {
        const style = { fontSize: '0.9rem', marginLeft: '6px' };
        if (sortConfig.column !== column) {
            return <span style={style} aria-hidden="true">⇅</span>;
        }
        return sortConfig.direction === 'asc'
            ? <span style={style} aria-hidden="true">▲</span>
            : <span style={style} aria-hidden="true">▼</span>;
    };

    // Clear filters
    const handleClearFilters = () => {
        setFilters({
            search: '',
            customer_id: '',
            user_id: '',
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
            // Build export params from current filters and sorting
            const paymentMethod = normalizePaymentMethod(debouncedFilters.payment_method);
            const paymentStatus = normalizePaymentStatus(debouncedFilters.payment_status);

            const exportParams = {
                search: debouncedFilters.search,
                customer_id: debouncedFilters.customer_id,
                user_id: debouncedFilters.user_id || undefined,
                date_from: debouncedFilters.date_from,
                date_to: debouncedFilters.date_to,
                sort_by: sortConfig.column,
                sort_direction: sortConfig.direction,
                payment_method: paymentMethod || undefined,
                payment_type: paymentMethod || undefined,
                payment_status: paymentStatus === '' ? undefined : paymentStatus,
                sale_status: paymentStatus === '' ? undefined : paymentStatus,
            };

            await salesReportService.exportSales(exportParams);
            toast.success('Sales exported successfully');
        } catch (err) {
            console.error('Error exporting sales:', err);
            toast.error('Failed to export sales');
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    // Handle view
    const handleView = (id) => {
        navigate(`/sales/sales-report/${id}`);
    };

    // Handle delete
    const handleDelete = async (id, reference_no) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete sale ${reference_no}. This action cannot be undone!`,
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
                const message = response?.data?.message || 'Sale deleted successfully';

                toast.success(message);
                queryClient.invalidateQueries({ queryKey: salesKeys.list(queryParams) });
                refetch();
            } catch (err) {
                console.error('Error deleting sale:', err);
                const apiMessage = err?.response?.data?.message || err?.message || 'An unexpected error occurred';
                toast.error(apiMessage);
            }
        }
    };

    const getCurrencySymbol = (sale) => {
        return sale.currency_symbol || sale.currency_object?.symbol || sale.currency_object?.currency_symbol || '$';
    };

    const formatCurrency = (sale, value) => {
        const symbol = getCurrencySymbol(sale);
        const amount = typeof value === 'number' ? value : parseFloat(value || 0);
        return `${symbol}${amount.toFixed(2)}`;
    };

    const getCustomerName = (sale) => {
        return sale.customer?.name
            || sale.customer_name
            || sale.customer?.full_name
            || [sale.customer?.first_name, sale.customer?.last_name].filter(Boolean).join(' ').trim()
            || '-';
    };

    const getUserName = (sale) => {
        return sale.user?.name
            || sale.created_by?.name
            || sale.staff?.name
            || sale.user_name
            || '';
    };

    const renderUserCell = (sale) => {
        const userId =
            sale.user_id ??
            sale.created_by ??
            sale.creator_id ??
            sale.staff_id ??
            sale.staff?.id ??
            sale.user?.id;

        const lookup = getUserInfoById(userId);
        if (lookup?.name) {
            return lookup.name;
        }

        const name = getUserName(sale);
        if (name) return name;

        if (userId && (userInfoLoading || hasPendingUserRequest(userId))) {
            return <span className="placeholder col-8 d-inline-block">&nbsp;</span>;
        }

        return '-';
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
            <td><div className="skeleton-loader" style={{height: '20px', width: '120px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '120px'}}></div></td>
            <td><div className="skeleton-loader" style={{height: '20px', width: '100px'}}></div></td>
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
                                placeholder="Search sales..."
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
                    
                    {queryError && <ErrorAlert message={queryError?.response?.data?.message || queryError?.message || 'Failed to fetch sales'} onClose={() => queryClient.invalidateQueries({ queryKey: salesKeys.list(queryParams) })} />}
                
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
                                <th 
                                    className="min-w-150px"
                                    style={{cursor: 'pointer'}}
                                    onClick={() => handleSort('customer')}
                                >
                                    <span className="d-flex align-items-center">
                                        Customer {getSortIcon('customer')}
                                    </span>
                                </th>
                                <th 
                                    className="min-w-150px"
                                    style={{cursor: 'pointer'}}
                                    onClick={() => handleSort('user')}
                                >
                                    <span className="d-flex align-items-center">
                                        User {getSortIcon('user')}
                                    </span>
                                </th>
                                <th 
                                    className="min-w-125px"
                                    style={{cursor: 'pointer'}}
                                    onClick={() => handleSort('payment_method')}
                                >
                                    <span className="d-flex align-items-center">
                                        Payment Type {getSortIcon('payment_method')}
                                    </span>
                                </th>
                                <th 
                                    className="min-w-125px"
                                    style={{cursor: 'pointer'}}
                                    onClick={() => handleSort('payment_status')}
                                >
                                    <span className="d-flex align-items-center">
                                        Status {getSortIcon('payment_status')}
                                    </span>
                                </th>
                                <th 
                                    className="min-w-125px"
                                    style={{cursor: 'pointer'}}
                                    onClick={() => handleSort('grand_total')}
                                >
                                    <span className="d-flex align-items-center">
                                        Grand Total {getSortIcon('grand_total')}
                                    </span>
                                </th>
                                <th className="text-end min-w-100px">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 fw-semibold">
                                {isLoading && sales.length === 0 ? (
                                // Show skeleton loading
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-10">
                                        <div className="text-gray-500">No sales found</div>
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{sale.date}</td>
                                        <td>
                                            <span className="text-gray-800 text-hover-primary mb-1" style={{ fontSize: '0.875rem' }}>
                                                {sale.reference_no}
                                            </span>
                                        </td>
                                        <td>{getCustomerName(sale)}</td>
                                        <td>{renderUserCell(sale)}</td>
                                        <td>
                                            {sale.payment_method || sale.payment_type ? (
                                                <span className={`badge ${getPaymentTypeBadgeClass(sale.payment_method || sale.payment_type)}`}>
                                                    {sale.payment_method || sale.payment_type}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${getPaymentStatusBadgeClass(sale.payment_status ?? sale.sale_status)}`}>
                                                {getPaymentStatusLabel(sale.payment_status ?? sale.sale_status)}
                                            </span>
                                        </td>
                                        <td className="fw-bold">{formatCurrency(sale, sale.grand_total)}</td>
                                        <td className="text-end">
                                            <div className="d-inline-block" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                                <button className="btn btn-sm btn-light btn-active-light-primary">
                                                    Actions
                                                    <i className="ki-duotone ki-down fs-5 ms-1"></i>
                                                </button>
                                                
                                                <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px py-4" data-kt-menu="true">
                                                    <div className="menu-item px-3">
                                                        <button
                                                            className="menu-link px-3 w-100 text-start"
                                                            onClick={() => handleView(sale.id)}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                    <div className="menu-item px-3">
                                                        <button
                                                            className="menu-link px-3 text-danger w-100 text-start"
                                                            onClick={() => handleDelete(sale.id, sale.reference_no)}
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

export default SalesIndex;
