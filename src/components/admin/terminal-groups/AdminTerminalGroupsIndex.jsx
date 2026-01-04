import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useQueryClient } from '@tanstack/react-query';
import { useCan } from '../../../utils/permissions';
import Swal from 'sweetalert2';
import TerminalGroupFiltersPanel from './TerminalGroupFiltersPanel';
import TerminalGroupTableRow from './TerminalGroupTableRow';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import { 
    useAdminTerminalGroups, 
    deleteAdminTerminalGroup, 
    bulkDeleteAdminTerminalGroups, 
    exportAdminTerminalGroups
} from '../../../services/adminTerminalGroupsService';

const AdminTerminalGroupsIndex = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const canCreateTerminalGroup = useCan('pos.terminal_groups.assign_terminals');
    const queryClient = useQueryClient();
    const {
        merchantsMap,
        countriesMap,
    } = useAdminReferenceData();
    
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15
    });
    
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        is_subgroup: '',
        merchant_id: '',
        branch_id: '',
        country_id: '',
        date_from: '',
        date_to: ''
    });
    const [searchInput, setSearchInput] = useState('');
    
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch terminal groups using React Query
    const { 
        data: groupsData, 
        isLoading, 
        refetch 
    } = useAdminTerminalGroups(pagination.current_page, pagination.per_page, filters);

    // Extract data
    const groups = groupsData?.data?.data || groupsData?.data || [];
    const paginationData = {
        current_page: groupsData?.data?.current_page || 1,
        per_page: groupsData?.data?.per_page || 15,
        total: groupsData?.data?.total || 0,
        last_page: groupsData?.data?.last_page || 1
    };

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle('Terminal Groups Management');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminal Groups', path: '/admin/terminal-groups', active: true }
        ]);
        
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters Button – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Filter
                    </span>
                </button>

                {/* Bulk Actions - Show when items selected */}
                {selectedIds.length > 0 && (
                    <button
                        className="btn btn-sm fw-bold btn-danger"
                        onClick={handleBulkDelete}
                        aria-label={`Delete selected terminal groups (${selectedIds.length})`}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        <span className="d-none d-lg-inline">
                            Delete Selected ({selectedIds.length})
                        </span>
                    </button>
                )}

                {/* Export Button – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm fw-bold btn-success"
                    onClick={handleExport}
                    disabled={exportLoading}
                    aria-label="Export terminal groups"
                >
                    <i className="ki-duotone ki-download fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        Export
                    </span>
                </button>

                {/* Add Terminal Group Button – icon only on small, icon + text on large */}
                {canCreateTerminalGroup && (
                    <Link
                        to="/admin/terminal-groups/create"
                        className="btn btn-sm fw-bold btn-primary"
                        aria-label="Add terminal group"
                    >
                        <i className="ki-duotone ki-plus fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-lg-inline">
                            Add 
                        </span>
                    </Link>
                )}
            </div>
        );
        
        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, showFilters, selectedIds.length, exportLoading]);

    // Debounced search effect - updates filters
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters(prev => ({ ...prev, search: searchInput }));
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Handle export
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const blob = await exportAdminTerminalGroups(filters);
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `terminal_groups_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Export completed successfully');
        } catch (error) {
            console.error('Export error:', error);
            if (error.message === 'No data to export') {
                toast.warning('No data available to export with the current filters');
            } else {
                toast.error(error.response?.data?.message || 'Failed to export terminal groups');
            }
        } finally {
            setExportLoading(false);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} terminal group(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        const response = await bulkDeleteAdminTerminalGroups(selectedIds);
        
        if (response.success) {
            Swal.fire('Deleted!', response.message, 'success');
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['admin-terminal-groups'] });
            await refetch();
        } else {
            Swal.fire('Error!', response.error, 'error');
        }
    };

    // Handle single delete
    const handleDelete = async (groupId) => {
        const response = await deleteAdminTerminalGroup(groupId);
        
        if (response.success) {
            toast.success(response.message);
            queryClient.invalidateQueries({ queryKey: ['admin-terminal-groups'] });
            await refetch();
        } else {
            toast.error(response.error);
        }
    };

    // Handle select/deselect
    const handleSelect = (groupId, checked) => {
        if (checked) {
            setSelectedIds([...selectedIds, groupId]);
        } else {
            setSelectedIds(selectedIds.filter(id => id !== groupId));
        }
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(groups.map(g => g.id));
        } else {
            setSelectedIds([]);
        }
    };

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchInput('');
        setFilters({
            search: '',
            status: '',
            is_subgroup: '',
            merchant_id: '',
            branch_id: '',
            country_id: '',
            date_from: '',
            date_to: ''
        });
        setPagination({ ...pagination, current_page: 1 });
    };

    // Handle apply filters
    const handleApplyFilters = () => {
        setPagination({ ...pagination, current_page: 1 });
        refetch();
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setPagination({ ...pagination, current_page: newPage });
    };

    return (
        <>
            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }
                
                @keyframes skeleton-loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>

            {/* Filters */}
            <TerminalGroupFiltersPanel
                isVisible={showFilters}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                onApply={handleApplyFilters}
                merchantsMap={merchantsMap}
                countriesMap={countriesMap}
            />

            {/* Table */}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        {/* Quick Search Input */}
                        <div className="d-flex align-items-center position-relative me-5" style={{ minWidth: '350px' }}>
                            <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 1 }}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid ps-13"
                                placeholder="Quick search terminal groups..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                style={{ paddingLeft: '3rem', fontSize: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            />
                            {searchInput && (
                                <button
                                    className="btn btn-icon btn-sm btn-active-color-primary position-absolute end-0 me-2"
                                    onClick={() => {
                                        setSearchInput('');
                                        setFilters(prev => ({ ...prev, search: '' }));
                                    }}
                                    style={{ zIndex: 1 }}
                                >
                                    <i className="ki-duotone ki-cross fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="card-toolbar">
                        {/* Empty for now, can add bulk actions here if needed */}
                    </div>
                </div>
                <div className="card-body pt-0">
                    {isLoading ? (
                        // Skeleton Loading
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                        <th className="w-10px pe-2"></th>
                                        <th className="text-dark">#</th>
                                        <th className="min-w-200px text-dark">Group Info</th>
                                        <th className="text-dark">Merchant</th>
                                        <th className="text-dark">Branch</th>
                                        <th className="text-dark">Terminals</th>
                                        <th className="text-dark">User Groups</th>
                                        <th className="text-dark">Subgroups</th>
                                        <th className="text-dark">Type</th>
                                        <th className="text-dark">Status</th>
                                        <th className="text-dark">Created At</th>
                                        <th className="text-end text-dark">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(10)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton" style={{width: '20px', height: '20px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '30px', height: '16px'}}></div></td>
                                            <td>
                                                <div className="d-flex flex-column gap-2">
                                                    <div className="skeleton" style={{width: '150px', height: '16px'}}></div>
                                                    <div className="skeleton" style={{width: '120px', height: '14px'}}></div>
                                                </div>
                                            </td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '60px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '60px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '90px', height: '16px'}}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : groups.length === 0 ? (
                        // Empty state
                        <div className="text-center py-10">
                            <i className="ki-duotone ki-information-5 fs-5x text-muted mb-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <p className="text-muted fs-4">No terminal groups found</p>
                            <Link to="/admin/terminal-groups/create" className="btn btn-primary mt-3">
                                Add Your First Terminal Group
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                            <th className="w-10px pe-2">
                                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.length === groups.length && groups.length > 0}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th className="text-dark">#</th>
                                            <th className="min-w-200px text-dark">Group Info</th>
                                            <th className="text-dark">Merchant</th>
                                            <th className="text-dark">Branch</th>
                                            <th className="text-dark">Terminals</th>
                                            <th className="text-dark">User Groups</th>
                                            <th className="text-dark">Subgroups</th>
                                            <th className="text-dark">Type</th>
                                            <th className="text-dark">Status</th>
                                            <th className="text-dark">Created At</th>
                                            <th className="text-end text-dark">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 fw-semibold">
                                        {groups.map((group, index) => (
                                            <TerminalGroupTableRow
                                                key={group.id}
                                                group={group}
                                                rowNumber={(paginationData.current_page - 1) * paginationData.per_page + index + 1}
                                                isSelected={selectedIds.includes(group.id)}
                                                onSelect={handleSelect}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex flex-stack flex-wrap pt-10">
                                <div className="fs-6 fw-semibold text-gray-700">
                                    Showing {((paginationData.current_page - 1) * paginationData.per_page) + 1} to {Math.min(paginationData.current_page * paginationData.per_page, paginationData.total)} of {paginationData.total} entries
                                </div>
                                <ul className="pagination">
                                    <li className={`page-item ${paginationData.current_page === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => handlePageChange(paginationData.current_page - 1)}
                                            disabled={paginationData.current_page === 1}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {[...Array(Math.min(5, paginationData.last_page))].map((_, idx) => {
                                        const page = idx + 1;
                                        return (
                                            <li 
                                                key={page} 
                                                className={`page-item ${paginationData.current_page === page ? 'active' : ''}`}
                                            >
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li className={`page-item ${paginationData.current_page === paginationData.last_page ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => handlePageChange(paginationData.current_page + 1)}
                                            disabled={paginationData.current_page === paginationData.last_page}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminTerminalGroupsIndex;

