import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { 
    useCustomers,
    deleteCustomer, 
    bulkDeleteCustomers,
    exportCustomers,
    customersKeys
} from '../../../services/customersService';
import CustomersTable from './CustomersTable';
import CustomerFilters from './CustomerFilters';
import CustomerToolbar from './CustomerToolbar';
import ImportCustomersModal from './ImportCustomersModal';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import Swal from 'sweetalert2';
import { useCan, canExport } from '../../../utils/permissions';

const CustomersIndex = () => {
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    // Dynamically determine base path from current location
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        customer_group_id: '',
        country: '',
        date_from: '',
        date_to: '',
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

    // Build query params for React Query
    const queryParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...debouncedFilters
    }), [pagination.current_page, pagination.per_page, debouncedFilters, sortConfig.column, sortConfig.direction]);

    // Use React Query to fetch customers
    const { 
        data: customersResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useCustomers(queryParams, {
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
            console.error('Error fetching customers:', err);
            toast.error('Failed to load customers');
        }
    });

    // Extract customers from response
    const customers = useMemo(() => {
        const customersData = customersResponse?.data?.customers || [];
        return Array.isArray(customersData) ? customersData : [];
    }, [customersResponse]);

    const canDelete = useCan('customers.delete');

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

    // Handle delete
    const handleDelete = async (id) => {
        try {
            const response = await deleteCustomer(id);
            
            if (response.success) {
                toast.success('Customer deleted successfully');
                queryClient.invalidateQueries({ queryKey: customersKeys.list(queryParams) });
                refetch();
                // Remove from selected if it was selected
                setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
            } else {
                toast.error(response.error || 'Failed to delete customer');
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            toast.error('An unexpected error occurred');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one customer');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} customer(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteCustomers(selectedIds);
                
                if (response.success) {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Customers have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: customersKeys.list(queryParams) });
                    refetch();
                } else {
                    Swal.fire('Error!', response.error || 'Failed to delete customers.', 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [selectedIds, queryParams, queryClient, refetch]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const blob = await exportCustomers(filters);
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Customers exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export customers');
        }
    }, [filters]);

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setFilters({
            search: '',
            customer_group_id: '',
            country: '',
            date_from: '',
            date_to: '',
        });
    };

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: customersKeys.list(queryParams) });
        refetch();
    };

    // Set toolbar
    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Customers', path: `${basePath}/customers`, active: true }
        ];
        
        setTitle('Customer Management');
        setBreadcrumbs(breadcrumbs);
        setActions(
            <CustomerToolbar 
                onRefresh={() => refetch()}
                loading={isFetching}
                basePath={basePath}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onExport={canExport('customers') ? handleExport : undefined}
                onImport={() => setShowImportModal(true)}
                selectedCount={selectedIds.length}
                onBulkDelete={canDelete ? handleBulkDelete : undefined}
            />
        );
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basePath, isFetching, showFilters, selectedIds.length, handleExport, handleBulkDelete]);

    return (
        <>
            {/* Filters */}
            {showFilters && (
                <CustomerFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
            )}

            {/* Main Card */}
            <div className="card">
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
                                    placeholder="Search customers..."
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

                    <div className="card-body pt-0">
                        {/* Loading Bar - Shows on top of existing data when fetching */}
                        {isFetching && !isLoading && (
                            <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <div className="progress" style={{ height: '3px' }}>
                                    <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                                </div>
                            </div>
                        )}
                        
                        {queryError && <ErrorAlert error={queryError?.response?.data?.message || queryError?.message || 'Failed to fetch customers'} onClose={() => queryClient.invalidateQueries({ queryKey: customersKeys.list(queryParams) })} />}

                        {isLoading && customers.length === 0 ? (
                            <LoadingSpinner />
                        ) : (
                            <CustomersTable
                                customers={customers}
                                selectedIds={selectedIds}
                                onSelectChange={setSelectedIds}
                                onDelete={handleDelete}
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                basePath={basePath}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                getSortIcon={getSortIcon}
                                isFetching={isFetching}
                            />
                        )}
                    </div>
                </div>

            {/* Import Modal */}
            {showImportModal && (
                <ImportCustomersModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                />
            )}
        </>
    );
};

export default CustomersIndex;

