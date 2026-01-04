import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { 
    useCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    toggleCategoryStatus,
    bulkDeleteCategories,
    exportCategories,
    exportCategoryTemplate,
    importCategoriesPreview,
    importCategories,
    fetchParentCategories, 
    inventoryKeys 
} from '../../../services/inventoryService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import CategoryTableRow from './CategoryTableRow';
import InventoryToolbar from './InventoryToolbar';
import ImportInventoryModal from './ImportInventoryModal';
import Swal from 'sweetalert2';

export default function Categories() {
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
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: { en: '' },
        parent_id: '',
        status: 1,
        image: null
    });
    
    // Parent categories for dropdown
    const [parentCategories, setParentCategories] = useState([]);

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

    // Load parent categories on mount
    useEffect(() => {
        loadParentCategories();
    }, []);

    // Build query params for React Query
    const queryParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: debouncedSearchTerm || undefined,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
    }), [pagination.current_page, pagination.per_page, debouncedSearchTerm, sortConfig.column, sortConfig.direction]);

    // Use React Query to fetch categories
    const { 
        data: categoriesResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useCategories(queryParams, {
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
            console.error('Error fetching categories:', err);
            toast.error('Failed to load categories');
        }
    });

    // Extract categories from response
    const categories = useMemo(() => {
        const categoriesData = categoriesResponse?.data?.categories || [];
        return Array.isArray(categoriesData) ? categoriesData : [];
    }, [categoriesResponse]);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Categories Management');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Categories', path: '/sales/categories' },
            { label: 'List Categories', path: '/sales/categories', active: true }
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
                addButtonLabel="Add Category"
            />
        );
        return () => setActions(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching, selectedIds.length]);

    // Load parent categories
    const loadParentCategories = async () => {
        try {
            const response = await fetchParentCategories();
            setParentCategories(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching parent categories:', error);
        }
    };

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
            const data = new FormData();
            data.append('name[en]', formData.name.en);
            if (formData.parent_id) data.append('parent_id', formData.parent_id);
            data.append('status', formData.status);
            console.log(formData.image);
            if (formData.image) data.append('image', formData.image);

            if (editingCategory) {
                await updateCategory(editingCategory.id, data);
                toast.success('Category updated successfully');
            } else {
                await createCategory(data);
                toast.success('Category created successfully');
            }
            handleCloseModal();
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.all });
            await refetch();
        } catch (error) {
            console.error('Error saving category:', error);

            const status = error?.response?.status;
            const code = error?.response?.data?.data?.code;

            // Plan limit reached: show toast then upgrade modal
            if (!editingCategory && status === 406 && code === 'PLAN_CATEGORIES_LIMIT_REACHED') {
                toast.error(error.response?.data?.message || 'Category limit reached for your current plan.');
                setShowUpgradeModal(true);
            } else {
                toast.error(error.response?.data?.message || 'Failed to save category');
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await deleteCategory(id);
            toast.success('Category deleted successfully');
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.all });
            await refetch();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (id) => {
        try {
            // Optimistically update the cache before API call
            queryClient.setQueryData(
                inventoryKeys.categories.list(queryParams),
                (oldData) => {
                    if (!oldData?.data?.categories) return oldData;
                    
                    return {
                        ...oldData,
                        data: {
                            ...oldData.data,
                            categories: oldData.data.categories.map(category =>
                                category.id === id
                                    ? { ...category, status: category.status ? 0 : 1 }
                                    : category
                            )
                        }
                    };
                }
            );

            await toggleCategoryStatus(id);
            toast.success('Category status updated successfully');
            
            // Remove from selected if it was selected
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            
            // Invalidate and refetch in background to ensure data consistency
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.all });
        } catch (error) {
            console.error('Error toggling category status:', error);
            toast.error(error.response?.data?.message || 'Failed to update category status');
            
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.all });
            await refetch();
        }
    };

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one category');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} category(ies). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteCategories(selectedIds);
                
                if (response.success) {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Categories have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.all });
                    await refetch();
                } else {
                    Swal.fire('Error!', response.error || 'Failed to delete categories.', 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [selectedIds, queryClient, refetch]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const blob = await exportCategories({
                search: debouncedSearchTerm,
                ...queryParams
            });
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `categories_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Categories exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export categories');
        }
    }, [debouncedSearchTerm, queryParams]);

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.all });
        refetch();
    };

    // Handle edit
    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: { en: category.name },
            parent_id: category.parent_category_id || '',
            status: category.status || 1,
            image: null
        });
        setShowModal(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: { en: '' }, parent_id: '', status: 1, image: null });
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
                                placeholder="Search categories..."
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
                    {/* Loading Bar */}
                    {isFetching && !isLoading && (
                        <div className="position-sticky top-0" style={{ zIndex: 10 }}>
                            <div className="progress" style={{ height: '4px' }}>
                                <div 
                                    className="progress-bar progress-bar-striped progress-bar-animated" 
                                    role="progressbar" 
                                    style={{ width: '100%' }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover" style={{ opacity: isFetching ? 0.6 : 1 }}>
                            <thead>
                                <tr>
                                    <th>
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedIds.length > 0 && selectedIds.length === categories.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(categories.map(cat => cat.id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </th>
                                    <th 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('id')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            ID
                                            {getSortIcon('id')}
                                        </div>
                                    </th>
                                    <th>Image</th>
                                    <th 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            Name
                                            {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th>Parent Category</th>
                                    <th>Products</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && categories.length === 0 ? (
                                    // Skeleton loading rows
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))
                                ) : categories.length > 0 ? (
                                    categories.map((category) => (
                                        <CategoryTableRow
                                            key={category.id}
                                            category={category}
                                            isSelected={selectedIds.includes(category.id)}
                                            onSelectChange={(id, checked) => {
                                                if (checked) {
                                                    setSelectedIds([...selectedIds, id]);
                                                } else {
                                                    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
                                                }
                                            }}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-10">No categories found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center pt-4">
                                    <div className="text-muted">Showing {categories.length} of {pagination.total} entries</div>
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
                                <h5 className="modal-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label required">Category Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name.en}
                                            onChange={(e) => setFormData({ ...formData, name: { en: e.target.value } })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Parent Category</label>
                                        <select
                                            className="form-select"
                                            value={formData.parent_id}
                                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                        >
                                            <option value="">None (Top Level)</option>
                                            {parentCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Category Image</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                        />
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
                                        {formSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Please wait...</> : (editingCategory ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Plan upgrade modal when category limit is reached */}
            {showUpgradeModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Upgrade Required</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowUpgradeModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-2 fw-bold">
                                    You have reached the maximum number of categories allowed on your current plan.
                                </p>
                                <p className="mb-0">
                                    To create more categories, please upgrade your subscription to the
                                    <span className="fw-bold"> Enterprise</span> plan.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => {
                                        // View all plans page (adjust path if needed)
                                        window.open('/plans', '_blank');
                                    }}
                                >
                                    View all plans
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        // Direct upgrade to Enterprise (adjust path if needed)
                                        window.location.href = '/plans/enterprise';
                                    }}
                                >
                                    Upgrade to Enterprise
                                </button>
                            </div>
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
                    entityName="category"
                    exportTemplate={exportCategoryTemplate}
                    importPreview={importCategoriesPreview}
                    importData={importCategories}
                />
            )}
        </>
    );
}
