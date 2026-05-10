import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation();
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

    // Always force fresh list when this page is entered.
    useEffect(() => {
        queryClient.removeQueries({ queryKey: ['admin-terminal-groups'] });
        refetch();
    }, [queryClient, refetch]);

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
        setTitle(t('admin.pages.terminalGroupsManagement'));
        
        setBreadcrumbs([
            { label: t('admin.header.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.terminalGroups'), path: '/admin/terminal-groups', active: true }
        ]);
        
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters Button – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label={showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        {t('admin.common.filter')}
                    </span>
                </button>

                {/* Bulk Actions - Show when items selected */}
                {selectedIds.length > 0 && (
                    <button
                        className="btn btn-sm fw-bold btn-danger"
                        onClick={handleBulkDelete}
                        aria-label={t('admin.terminalGroupsIndex.ariaDeleteSelected', { count: selectedIds.length })}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        <span className="d-none d-lg-inline">
                            {t('admin.terminalGroupsIndex.deleteSelected', { count: selectedIds.length })}
                        </span>
                    </button>
                )}

                {/* Export Button – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm fw-bold btn-success"
                    onClick={handleExport}
                    disabled={exportLoading}
                    aria-label={t('admin.common.ariaExportTerminalGroups')}
                >
                    <i className="ki-duotone ki-download fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        {t('admin.common.export')}
                    </span>
                </button>

                {/* Add Terminal Group Button – icon only on small, icon + text on large */}
                {canCreateTerminalGroup && (
                    <Link
                        to="/admin/terminal-groups/create"
                        className="btn btn-sm fw-bold btn-primary"
                        aria-label={t('admin.common.ariaAddTerminalGroup')}
                    >
                        <i className="ki-duotone ki-plus fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-lg-inline">
                            {t('admin.common.add')}
                        </span>
                    </Link>
                )}
            </div>
        );
        
        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, showFilters, selectedIds.length, exportLoading, t, i18n.language]);

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
            
            toast.success(t('admin.terminalGroupsIndex.exportSuccess'));
        } catch (error) {
            console.error('Export error:', error);
            if (error.message === 'No data to export') {
                toast.warning(t('admin.terminalGroupsIndex.exportNoData'));
            } else {
                toast.error(error.response?.data?.message || t('admin.terminalGroupsIndex.exportFailed'));
            }
        } finally {
            setExportLoading(false);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: t('admin.terminalGroupsIndex.bulkDeleteTitle'),
            text: t('admin.terminalGroupsIndex.bulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.terminalGroupsIndex.yesDelete'),
            cancelButtonText: t('admin.terminalGroupsIndex.cancel')
        });

        if (!result.isConfirmed) return;

        const response = await bulkDeleteAdminTerminalGroups(selectedIds);
        
        if (response.success) {
            Swal.fire(t('admin.terminalGroupsIndex.deleted'), response.message, 'success');
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['admin-terminal-groups'] });
            await refetch();
        } else {
            Swal.fire(t('admin.terminalGroupsIndex.deleteError'), response.error, 'error');
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
                                placeholder={t('admin.terminalGroupsIndex.searchPlaceholder')}
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
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colHash')}</th>
                                        <th className="min-w-200px text-dark">{t('admin.terminalGroupsIndex.colGroupInfo')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colMerchant')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colBranch')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colTerminals')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colUserGroups')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colSubgroups')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colType')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colStatus')}</th>
                                        <th className="text-dark">{t('admin.terminalGroupsIndex.colCreatedAt')}</th>
                                        <th className="text-end text-dark">{t('admin.terminalGroupsIndex.colActions')}</th>
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
                            <p className="text-muted fs-4">{t('admin.terminalGroupsIndex.noTerminalGroupsFound')}</p>
                            <Link to="/admin/terminal-groups/create" className="btn btn-primary mt-3">
                                {t('admin.terminalGroupsIndex.addFirstTerminalGroup')}
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
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colHash')}</th>
                                            <th className="min-w-200px text-dark">{t('admin.terminalGroupsIndex.colGroupInfo')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colMerchant')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colBranch')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colTerminals')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colUserGroups')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colSubgroups')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colType')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colStatus')}</th>
                                            <th className="text-dark">{t('admin.terminalGroupsIndex.colCreatedAt')}</th>
                                            <th className="text-end text-dark">{t('admin.terminalGroupsIndex.colActions')}</th>
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
                                    {t('admin.common.showingEntries', {
                                        from: ((paginationData.current_page - 1) * paginationData.per_page) + 1,
                                        to: Math.min(paginationData.current_page * paginationData.per_page, paginationData.total),
                                        total: paginationData.total
                                    })}
                                </div>
                                <ul className="pagination">
                                    <li className={`page-item ${paginationData.current_page === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => handlePageChange(paginationData.current_page - 1)}
                                            disabled={paginationData.current_page === 1}
                                        >
                                            {t('admin.common.previous')}
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
                                            {t('admin.common.next')}
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

