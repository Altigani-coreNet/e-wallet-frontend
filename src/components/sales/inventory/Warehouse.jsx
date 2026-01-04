import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    fetchWarehouses, 
    deleteWarehouse, 
    toggleWarehouseStatus,
    bulkDeleteWarehouses,
    exportWarehouses,
    exportWarehouseTemplate,
    importWarehousesPreview,
    importWarehouses
} from '../../../services/inventoryService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import WarehouseTableRow from './WarehouseTableRow';
import InventoryToolbar from './InventoryToolbar';
import ImportInventoryModal from './ImportInventoryModal';
import Swal from 'sweetalert2';

const PAGE_SIZE = 10;

export default function Warehouse() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(PAGE_SIZE);
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        column: null,
        direction: 'asc'
    });

    useEffect(() => {
        loadWarehouses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, currentPage, perPage, sortConfig.column, sortConfig.direction]);

    useEffect(() => {
        setTitle('Warehouse Management');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Warehouse', path: '/sales/warehouse' },
            { label: 'List Warehouses', path: '/sales/warehouse', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set toolbar actions
    useEffect(() => {
        setActions(
            <InventoryToolbar
                onRefresh={() => loadWarehouses(true)}
                loading={loading}
                onExport={handleExport}
                onImport={() => setShowImportModal(true)}
                selectedCount={selectedWarehouseIds.length}
                onBulkDelete={handleBulkDelete}
                onAdd={() => window.location.href = '/sales/warehouse/create'}
                addButtonLabel="Add Warehouse"
            />
        );
        return () => setActions(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, selectedWarehouseIds.length]);

    const loadWarehouses = async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) {
            setLoading(true);
        }
        try {
            const params = {
                search: searchTerm,
                page: currentPage,
                per_page: perPage
            };

            // Add sorting parameters if sort is configured
            if (sortConfig.column) {
                params.sort_by = sortConfig.column;
                params.sort_direction = sortConfig.direction;
            }

            const response = await fetchWarehouses(params);

            const nextWarehouses = response.data?.warehouses || [];

            setWarehouses(nextWarehouses);
            setTotal(response.data?.total || 0);
            setTotalPages(response.data?.last_page || 1);
            setPerPage(response.data?.per_page || PAGE_SIZE);
            setSelectedWarehouseIds((prev) =>
                prev.filter((id) => nextWarehouses.some((warehouse) => warehouse.id === id))
            );
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            toast.error('Failed to fetch warehouses');
        } finally {
            if (showLoadingSpinner) {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteWarehouse(id);
            toast.success('Warehouse deleted successfully');
            loadWarehouses(false);
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            toast.error('Failed to delete warehouse');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await toggleWarehouseStatus(id);
            toast.success('Warehouse status updated');
            loadWarehouses(false);
            // Remove from selected if it was selected
            setSelectedWarehouseIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Error toggling warehouse status:', error);
            toast.error(error.response?.data?.message || 'Failed to change status');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedWarehouseIds.length === 0) {
            toast.warning('Please select at least one warehouse');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedWarehouseIds.length} warehouse(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteWarehouses(selectedWarehouseIds);
                
                if (response.success) {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Warehouses have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedWarehouseIds([]);
                    loadWarehouses(true);
                } else {
                    Swal.fire('Error!', response.error || 'Failed to delete warehouses.', 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [selectedWarehouseIds]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const exportParams = {
                search: searchTerm,
                page: currentPage,
                per_page: perPage
            };

            // Add sorting parameters if sort is configured
            if (sortConfig.column) {
                exportParams.sort_by = sortConfig.column;
                exportParams.sort_direction = sortConfig.direction;
            }

            const blob = await exportWarehouses(exportParams);
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `warehouses_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Warehouses exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export warehouses');
        }
    }, [searchTerm, currentPage, perPage, sortConfig]);

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        loadWarehouses(true);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = useCallback((column) => {
        setSortConfig(prev => {
            if (prev.column === column) {
                // Toggle direction if same column
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            // New column, default to ascending
            return {
                column,
                direction: 'asc'
            };
        });
        setCurrentPage(1); // Reset to first page when sorting changes
    }, []);

    // Get sort icon
    const getSortIcon = useCallback((column) => {
        if (sortConfig.column !== column) {
            return (
                <i className="ki-duotone ki-up-down fs-5 ms-1 text-muted">
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
    }, [sortConfig]);

    const allSelected = useMemo(() => {
        return warehouses.length > 0 && selectedWarehouseIds.length === warehouses.length;
    }, [warehouses, selectedWarehouseIds]);

    const selectedCount = selectedWarehouseIds.length;

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedWarehouseIds([]);
        } else {
            setSelectedWarehouseIds(warehouses.map((warehouse) => warehouse.id));
        }
    };

    const handleSelectWarehouse = (id) => {
        setSelectedWarehouseIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((warehouseId) => warehouseId !== id);
            }
            return [...prev, id];
        });
    };

    const showingRange = useMemo(() => {
        if (total === 0) {
            return { start: 0, end: 0 };
        }

        const start = (currentPage - 1) * perPage + 1;
        const end = Math.min(currentPage * perPage, total);

        return { start, end };
    }, [currentPage, perPage, total]);

    return (
        <>
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
                                placeholder="Search warehouses..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        
                        {/* Per Page Selector */}
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">Per Page:</label>
                            <select
                                className="form-select form-select-sm"
                                style={{width: '80px'}}
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
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

                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={handleSelectAll}
                                                aria-label="Select all warehouses"
                                            />
                                        </div>
                                    </th>
                                    <th 
                                        className="min-w-75px" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('id')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            ID
                                            {getSortIcon('id')}
                                        </div>
                                    </th>
                                    <th 
                                        className="min-w-175px" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            Name
                                            {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th 
                                        className="min-w-150px" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('phone')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            Phone
                                            {getSortIcon('phone')}
                                        </div>
                                    </th>
                                    <th 
                                        className="min-w-200px" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            Email
                                            {getSortIcon('email')}
                                        </div>
                                    </th>
                                    <th 
                                        className="min-w-125px" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('city')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            City
                                            {getSortIcon('city')}
                                        </div>
                                    </th>
                                    <th className="min-w-250px">Address</th>
                                    <th 
                                        className="min-w-125px" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            Status
                                            {getSortIcon('status')}
                                        </div>
                                    </th>
                                    <th className="text-end min-w-175px">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && warehouses.length === 0 ? (
                                    // Skeleton loading rows
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-9"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))
                                ) : warehouses.length > 0 ? (
                                    warehouses.map((warehouse) => (
                                        <WarehouseTableRow
                                            key={warehouse.id}
                                            warehouse={warehouse}
                                            isSelected={selectedWarehouseIds.includes(warehouse.id)}
                                            onSelect={() => handleSelectWarehouse(warehouse.id)}
                                            onDelete={handleDelete}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10">
                                            No warehouses found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center pt-4 flex-wrap gap-3">
                                    <div className="text-muted">
                                        Showing {showingRange.start} to {showingRange.end} of {total} warehouses
                                    </div>
                                <nav>
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                    </nav>
                                </div>
                            )}
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <ImportInventoryModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                    entityName="warehouse"
                    exportTemplate={exportWarehouseTemplate}
                    importPreview={importWarehousesPreview}
                    importData={importWarehouses}
                />
            )}
        </>
    );
}

