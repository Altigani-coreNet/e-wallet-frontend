import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { 
    useTags, 
    createTag, 
    updateTag, 
    deleteTag, 
    toggleTagStatus,
    bulkDeleteTags,
    exportTags,
    exportTagTemplate,
    importTagsPreview,
    importTags,
    inventoryKeys 
} from '../../../services/inventoryService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import TagTableRow from './TagTableRow';
import InventoryToolbar from './InventoryToolbar';
import ImportInventoryModal from './ImportInventoryModal';
import Swal from 'sweetalert2';

export default function Tags() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
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
    
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: ''
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

    // Use React Query to fetch tags
    const { 
        data: tagsResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useTags(queryParams, {
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
                    last_page: response.data.last_page
                });
            }
        },
        onError: (err) => {
            console.error('Error fetching tags:', err);
            toast.error('Failed to load tags');
        }
    });

    // Extract tags from response
    const tags = useMemo(() => {
        const tagsData = tagsResponse?.data?.tags || [];
        return Array.isArray(tagsData) ? tagsData : [];
    }, [tagsResponse]);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Tags Management');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Tags', path: '/sales/tags' },
            { label: 'List Tags', path: '/sales/tags', active: true }
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
                onAdd={handleOpenModal}
                addButtonLabel="Add Tag"
            />
        );
        return () => setActions(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching, selectedIds.length]);

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

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);

        try {
            if (editingTag) {
                await updateTag(editingTag.id, formData);
                toast.success('Tag updated successfully');
            } else {
                await createTag(formData);
                toast.success('Tag created successfully');
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
            handleCloseModal();
            // Invalidate and refetch tags
            queryClient.invalidateQueries({ queryKey: inventoryKeys.tags.list(queryParams) });
            refetch();
        } catch (error) {
            console.error('Error saving tag:', error);
            toast.error(error.response?.data?.message || 'Failed to save tag');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTag(id);
            toast.success('Tag deleted successfully');
            // Invalidate and refetch tags
            queryClient.invalidateQueries({ queryKey: inventoryKeys.tags.list(queryParams) });
            refetch();
        } catch (error) {
            console.error('Error deleting tag:', error);
            toast.error('Failed to delete tag');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await toggleTagStatus(id);
            toast.success('Tag status updated successfully');
            // Refresh table without showing loading spinner
            queryClient.invalidateQueries({ queryKey: inventoryKeys.tags.list(queryParams) });
            refetch();
            // Remove from selected if it was selected
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Error toggling tag status:', error);
            toast.error(error.response?.data?.message || 'Failed to update tag status');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one tag');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} tag(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteTags(selectedIds);
                
                if (response.success) {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Tags have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: inventoryKeys.tags.list(queryParams) });
                    refetch();
                } else {
                    Swal.fire('Error!', response.error || 'Failed to delete tags.', 'error');
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [selectedIds, queryParams, queryClient, refetch]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            const blob = await exportTags({
                search: debouncedSearchTerm,
                ...queryParams
            });
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `tags_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Tags exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export tags');
        }
    }, [debouncedSearchTerm, queryParams]);

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: inventoryKeys.tags.list(queryParams) });
        refetch();
    };

    const handleEdit = (tag) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTag(null);
        setFormData({ name: '' });
    };

    const handleOpenModal = () => {
        setEditingTag(null);
        setFormData({ name: '' });
        setShowModal(true);
    };

    return (
        <>
            {/* Main Card */}
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
                                        placeholder="Search tags..."
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
                            
                            {/* Error Alert */}
                            {queryError && (
                                <div className="alert alert-danger alert-dismissible mb-4">
                                    <strong>Error:</strong> {queryError?.response?.data?.message || queryError?.message || 'Failed to load tags'}
                                    <button type="button" className="btn-close" onClick={() => queryClient.invalidateQueries({ queryKey: inventoryKeys.tags.list(queryParams) })}></button>
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
                                                        checked={selectedIds.length > 0 && selectedIds.length === tags.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedIds(tags.map(t => t.id));
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
                                                onClick={() => handleSort('slug')}
                                            >
                                                <span className="d-flex align-items-center">
                                                    Slug {getSortIcon('slug')}
                                                </span>
                                            </th>
                                            <th>Status</th>
                                            <th 
                                                style={{cursor: 'pointer'}}
                                                onClick={() => handleSort('created_at')}
                                            >
                                                <span className="d-flex align-items-center">
                                                    Created At {getSortIcon('created_at')}
                                                </span>
                                            </th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading && tags.length === 0 ? (
                                            // Skeleton loading rows
                                            [...Array(5)].map((_, index) => (
                                                <tr key={`skeleton-${index}`}>
                                                    <td><span className="placeholder col-6"></span></td>
                                                    <td><span className="placeholder col-4"></span></td>
                                                    <td><span className="placeholder col-8"></span></td>
                                                    <td><span className="placeholder col-8"></span></td>
                                                    <td><span className="placeholder col-6"></span></td>
                                                    <td><span className="placeholder col-7"></span></td>
                                                    <td><span className="placeholder col-6"></span></td>
                                                </tr>
                                            ))
                                        ) : tags.length > 0 ? (
                                            tags.map((tag) => (
                                                <TagTableRow
                                                    key={tag.id}
                                                    tag={tag}
                                                    isSelected={selectedIds.includes(tag.id)}
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
                                                <td colSpan="7" className="text-center py-10">
                                                    No tags found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                                    {/* Pagination */}
                                    {pagination.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center pt-4">
                                            <div className="text-muted">
                                                Showing {tags.length} of {pagination.total} tags
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    <li className={`page-item ${pagination.current_page === 1 || isFetching ? 'disabled' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => handlePageChange(Math.max(pagination.current_page - 1, 1))}
                                                            disabled={pagination.current_page === 1 || isFetching}
                                                        >
                                                            Previous
                                                        </button>
                                                    </li>
                                                    {[...Array(Math.min(pagination.last_page, 10))].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''} ${isFetching ? 'disabled' : ''}`}>
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

            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editingTag ? 'Edit Tag' : 'Add New Tag'}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label required">Tag Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter tag name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={formSubmitting}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                                        {formSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Please wait...
                                            </>
                                        ) : (
                                            editingTag ? 'Update' : 'Create'
                                        )}
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
                    entityName="tag"
                    exportTemplate={exportTagTemplate}
                    importPreview={importTagsPreview}
                    importData={importTags}
                />
            )}
        </>
    );
}

