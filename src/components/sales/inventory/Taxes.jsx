import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { 
    useTaxes, 
    createTax, 
    updateTax, 
    deleteTax,
    bulkDeleteTaxes,
    exportTaxes,
    exportTaxTemplate,
    importTaxesPreview,
    importTaxes,
    inventoryKeys 
} from '../../../services/inventoryService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import TaxTableRow from './TaxTableRow';
import InventoryToolbar from './InventoryToolbar';
import ImportInventoryModal from './ImportInventoryModal';
import Swal from 'sweetalert2';

export default function Taxes() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    
    // Selected IDs for bulk operations
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Pagination state
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
    });
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: { en: '' },
        rate: '',
        type: 'STANDARD',
        status: 1
    });

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    
    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Build query params for React Query
    const queryParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: debouncedSearchTerm || undefined,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
    }), [pagination.current_page, pagination.per_page, debouncedSearchTerm, sortConfig.column, sortConfig.direction]);

    // Use React Query to fetch taxes
    const { 
        data: taxesResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useTaxes(queryParams, {
        keepPreviousData: true,
        onSuccess: (response) => {
            // Update pagination from response
            if (response.data?.current_page !== undefined) {
                setPagination({
                    current_page: response.data.current_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                    last_page: response.data.last_page
                });
            }
        },
        onError: (err) => {
            console.error('Error fetching taxes:', err);
            toast.error('Failed to load taxes');
        }
    });

    // Extract taxes from response
    const taxes = useMemo(() => {
        const taxesData = taxesResponse?.data?.taxes || [];
        return Array.isArray(taxesData) ? taxesData : [];
    }, [taxesResponse]);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Taxes Management');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Taxes', path: '/sales/taxes' },
            { label: 'List Taxes', path: '/sales/taxes', active: true }
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
                onRefresh={() => refetch()}
                loading={isFetching}
                onExport={handleExport}
                onImport={() => setShowImportModal(true)}
                selectedCount={selectedIds.length}
                onBulkDelete={handleBulkDelete}
                onAdd={() => setShowModal(true)}
                addButtonLabel="Add Tax"
            />
        );
        return () => setActions(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching, selectedIds.length]);

    // Handle sort
    const handleSort = useCallback((column) => {
        setSortConfig(prev => {
            if (prev.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                column,
                direction: 'asc'
            };
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    }, []);

    // Get sort icon
    const getSortIcon = useCallback((column) => {
        if (sortConfig.column !== column) {
            return (
                <i className="ki-duotone ki-arrow-up-down fs-5 ms-1 text-muted">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-5 ms-1 text-primary">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1 text-primary">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    }, [sortConfig]);

    // Handle page change
    const handlePageChange = useCallback((newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    }, []);

    // Handle per page change
    const handlePerPageChange = useCallback((newPerPage) => {
        setPagination(prev => ({
            ...prev,
            per_page: newPerPage,
            current_page: 1
        }));
    }, []);

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);

        try {
            if (editingTax) {
                await updateTax(editingTax.id, formData);
                toast.success('Tax updated successfully');
            } else {
                await createTax(formData);
                toast.success('Tax created successfully');
            }
            handleCloseModal();
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: inventoryKeys.taxes.all });
            await refetch();
        } catch (error) {
            console.error('Error saving tax:', error);
            toast.error(error.response?.data?.message || 'Failed to save tax');
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await deleteTax(id);
            toast.success('Tax deleted successfully');
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: inventoryKeys.taxes.all });
            await refetch();
            // Remove from selected if it was selected
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Error deleting tax:', error);
            toast.error('Failed to delete tax');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one tax');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} tax(es). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteTaxes(selectedIds);
                
                if (response.success) {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Taxes have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: inventoryKeys.taxes.all });
                    await refetch();
                } else {
                    Swal.fire('Error!', response.error || 'Failed to delete taxes.', 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [selectedIds, queryClient, refetch]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const blob = await exportTaxes({
                search: debouncedSearchTerm,
                ...queryParams
            });
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `taxes_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Taxes exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export taxes');
        }
    }, [debouncedSearchTerm, queryParams]);

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: inventoryKeys.taxes.all });
        refetch();
    };

    // Handle edit
    const handleEdit = (tax) => {
        setEditingTax(tax);
        setFormData({
            name: { en: tax.name },
            rate: tax.rate,
            type: tax.type || 'STANDARD',
            status: tax.status
        });
        setShowModal(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTax(null);
        setFormData({ name: { en: '' }, rate: '', type: 'STANDARD', status: 1 });
    };

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
                                placeholder="Search taxes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                    
                    {/* Error Alert */}
                    {queryError && (
                        <div className="alert alert-danger alert-dismissible mb-4">
                            <strong>Error:</strong> {queryError?.response?.data?.message || queryError?.message || 'Failed to load taxes'}
                            <button type="button" className="btn-close" onClick={() => queryClient.invalidateQueries({ queryKey: inventoryKeys.taxes.list(queryParams) })}></button>
                        </div>
                    )}

                    <div className="table-responsive" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th className="w-25px">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedIds.length > 0 && selectedIds.length === taxes.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(taxes.map(t => t.id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('id')}
                                    >
                                        <span className="d-flex align-items-center">
                                            ID {getSortIcon('id')}
                                        </span>
                                    </th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('name')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Name {getSortIcon('name')}
                                        </span>
                                    </th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('rate')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Rate (%) {getSortIcon('rate')}
                                        </span>
                                    </th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && taxes.length === 0 ? (
                                    // Skeleton loading rows
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))
                                ) : taxes.length > 0 ? (
                                    taxes.map((tax) => (
                                        <TaxTableRow
                                            key={tax.id}
                                            tax={tax}
                                            isSelected={selectedIds.includes(tax.id)}
                                            onSelectChange={(id, checked) => {
                                                if (checked) {
                                                    setSelectedIds([...selectedIds, id]);
                                                } else {
                                                    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
                                                }
                                            }}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10">No taxes found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center pt-4">
                                    <div className="text-muted">Showing {taxes.length} of {pagination.total} entries</div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(Math.max(pagination.current_page - 1, 1))}
                                                    disabled={pagination.current_page === 1 || isFetching}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            {[...Array(pagination.last_page)].map((_, i) => {
                                                const pageNum = i + 1;
                                                // Show first page, last page, current page, and pages around current
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === pagination.last_page ||
                                                    (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)
                                                ) {
                                                    return (
                                                        <li key={i} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}>
                                                            <button
                                                                className="page-link"
                                                                onClick={() => handlePageChange(pageNum)}
                                                                disabled={isFetching}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                } else if (
                                                    pageNum === pagination.current_page - 2 ||
                                                    pageNum === pagination.current_page + 2
                                                ) {
                                                    return (
                                                        <li key={i} className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                                return null;
                                            })}
                                            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(Math.min(pagination.current_page + 1, pagination.last_page))}
                                                    disabled={pagination.current_page === pagination.last_page || isFetching}
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

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editingTax ? 'Edit Tax' : 'Add New Tax'}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label required">Tax Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name.en}
                                            onChange={(e) => setFormData({ ...formData, name: { en: e.target.value } })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label required">Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="STANDARD">Standard</option>
                                            <option value="EXEMPTED">Exempted</option>
                                            <option value="ZERO_RATED">Zero Rated</option>
                                            <option value="RCM">RCM</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                        >
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={formSubmitting}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                                        {formSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Please wait...</> : (editingTax ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <ImportInventoryModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                    entityName="tax"
                    exportTemplate={exportTaxTemplate}
                    importPreview={importTaxesPreview}
                    importData={importTaxes}
                />
            )}
        </>
    );
}
