import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { 
    useSuppliers,
    deleteSupplier, 
    bulkDeleteSuppliers,
    exportSuppliers,
    suppliersKeys
} from '../../../services/suppliersService';
import SuppliersTable from './SuppliersTable';
import SupplierFilters from './SupplierFilters';
import SupplierToolbar from './SupplierToolbar';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import PlanUpgradeModal from '../../users/PlanUpgradeModal';
import Swal from 'sweetalert2';

const SuppliersIndex = () => {
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    // Dynamically determine base path from current location
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        country: '',
        city: '',
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

    // Use React Query to fetch suppliers
    const { 
        data: suppliersResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useSuppliers(queryParams, {
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
            console.error('Error fetching suppliers:', err);
            // Check if it's a plan limit error
            const errorCode = err?.response?.data?.data?.code || err?.response?.data?.code || err?.response?.data?.Error_Code;
            const errorMessage = err?.response?.data?.message || '';
            if (err?.response?.status === 406 || errorCode === 'PLAN_SUPPLIERS_LIMIT_REACHED' || errorMessage.toLowerCase().includes('limit reached')) {
                setShowPlanUpgradeModal(true);
            } else {
                toast.error('Failed to load suppliers');
            }
        }
    });

    // Extract suppliers from response
    const suppliers = useMemo(() => {
        const suppliersData = suppliersResponse?.data?.suppliers || [];
        return Array.isArray(suppliersData) ? suppliersData : [];
    }, [suppliersResponse]);

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
            const response = await deleteSupplier(id);
            
            if (response.success) {
                toast.success('Supplier deleted successfully');
                queryClient.invalidateQueries({ queryKey: suppliersKeys.list(queryParams) });
                refetch();
                // Remove from selected if it was selected
                setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
            } else {
                toast.error(response.error || 'Failed to delete supplier');
            }
            } catch (err) {
                console.error('Error deleting supplier:', err);
                // Check if it's a plan limit error
                const errorCode = err?.response?.data?.data?.code || err?.response?.data?.code || err?.response?.data?.Error_Code;
                const errorMessage = err?.response?.data?.message || '';
                if (err?.response?.status === 406 || errorCode === 'PLAN_SUPPLIERS_LIMIT_REACHED' || errorMessage.toLowerCase().includes('limit reached')) {
                    setShowPlanUpgradeModal(true);
                } else {
                    toast.error('An unexpected error occurred');
                }
            }
    };

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one supplier');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} supplier(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteSuppliers(selectedIds);
                
                if (response.success) {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Suppliers have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: suppliersKeys.list(queryParams) });
                    refetch();
                } else {
                    // Check if it's a plan limit error
                    const errorCode = response.errorCode || response.data?.code;
                    const errorMessage = response.error || '';
                    if (response.statusCode === 406 || errorCode === 'PLAN_SUPPLIERS_LIMIT_REACHED' || errorMessage.toLowerCase().includes('limit reached')) {
                        setShowPlanUpgradeModal(true);
                    } else {
                        Swal.fire('Error!', response.error || 'Failed to delete suppliers.', 'error');
                    }
                }
            } catch (error) {
                // Check if it's a plan limit error
                const errorCode = error?.response?.data?.data?.code || error?.response?.data?.code || error?.response?.data?.Error_Code;
                const errorMessage = error?.response?.data?.message || '';
                if (error?.response?.status === 406 || errorCode === 'PLAN_SUPPLIERS_LIMIT_REACHED' || errorMessage.toLowerCase().includes('limit reached')) {
                    setShowPlanUpgradeModal(true);
                } else {
                    Swal.fire('Error!', 'An unexpected error occurred.', 'error');
                }
            }
        }
    }, [selectedIds, pagination.current_page]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const blob = await exportSuppliers(filters);
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Suppliers exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export suppliers');
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
            country: '',
            city: '',
        });
    };

    // Set toolbar
    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Suppliers', path: `${basePath}/suppliers`, active: true }
        ];
        
        setTitle('Supplier Management');
        setBreadcrumbs(breadcrumbs);
        setActions(
            <SupplierToolbar 
                onRefresh={() => refetch()}
                loading={isFetching}
                basePath={basePath}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onExport={handleExport}
                selectedCount={selectedIds.length}
                onBulkDelete={handleBulkDelete}
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
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                
                {/* Filters */}
                {showFilters && (
                    <SupplierFilters
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
                                    placeholder="Search suppliers..."
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
                        
                        {queryError && <ErrorAlert error={queryError?.response?.data?.message || queryError?.message || 'Failed to fetch suppliers'} onClose={() => queryClient.invalidateQueries({ queryKey: suppliersKeys.list(queryParams) })} />}

                        {isLoading && suppliers.length === 0 ? (
                            <LoadingSpinner />
                        ) : (
                            <SuppliersTable
                                suppliers={suppliers}
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
            </div>

            {/* Plan Upgrade Modal */}
            <PlanUpgradeModal
                show={showPlanUpgradeModal}
                onHide={() => setShowPlanUpgradeModal(false)}
                resourceType="suppliers"
            />
        </div>
    );
};

export default SuppliersIndex;

