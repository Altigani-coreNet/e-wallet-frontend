import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getUsers, deleteUser, changeUserStatus, exportUsers } from '../../services/usersService';
import { getBranchesForSelect } from '../../services/branchesService';
import { getRoles } from '../../services/rolesService';
import UsersTable from './UsersTable';
import UsersSearch from './UsersSearch';
import UsersToolbar from './UsersToolbar';
import UserImportModal from './UserImportModal';
import SearchableDropdown from '../common/filters/SearchableDropdown';
import { useToolbar } from '../../contexts/ToolbarContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { toast } from 'react-toastify';

const UsersIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);
    
    // Keep users module under merchant routes only
    const basePath = '/merchant';
    const dashboardPath = `${basePath}/dashboard`;
    const isMerchant = basePath === '/merchant';
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        branch_id: '',
        role_id: '',
    });
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const branchSearchTimeoutRef = useRef(null);
    const roleSearchTimeoutRef = useRef(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1
    });
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });

    // Fetch users from AuthService API
    const fetchUsers = async (page = 1, search = '', status = '', sortBy = 'id', sortDirection = 'desc') => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                page,
                per_page: pagination.perPage,
                search,
                sort_by: sortBy,
                sort_direction: sortDirection
            };

            // Add status filter if selected
            if (status) {
                params.status = status;
            }

            // Always add date filters if they exist
            if (filters.date_from) {
                params.date_from = filters.date_from;
            }
            if (filters.date_to) {
                params.date_to = filters.date_to;
            }
            if (filters.role_id) {
                params.role_id = filters.role_id;
            }
            if (filters.branch_id) {
                params.branch_id = filters.branch_id;
            }

            const response = await getUsers(params);

            if (response.success) {
                // Extract users from nested data structure
                // API returns: { success: true, data: { status: true, data: { data: [...users...], current_page: 1, ... } } }
                const apiData = response.data.data || response.data;
                const usersArray = apiData.data || apiData.users || apiData || [];
                
                setUsers(usersArray);
                
                // Update pagination from the correct level
                if (apiData.current_page !== undefined) {
                    setPagination({
                        currentPage: apiData.current_page,
                        perPage: apiData.per_page,
                        total: apiData.total,
                        lastPage: apiData.last_page
                    });
                } else if (response.data.meta) {
                    setPagination({
                        currentPage: response.data.meta.current_page,
                        perPage: response.data.meta.per_page,
                        total: response.data.meta.total,
                        lastPage: response.data.meta.last_page
                    });
                }
            } else {
                setError(response.error || t('merchant.users.list.fetchFailed'));
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(t('merchant.users.list.unexpectedFetch'));
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchUsers(pagination.currentPage, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
    }, []);

    // Reinitialize KTMenu after users are loaded
    useEffect(() => {
        if (!loading && users.length > 0) {
            // Reinitialize Metronic menu components
            if (typeof KTMenu !== 'undefined' && typeof KTMenu.createInstances === 'function') {
                setTimeout(() => {
                    KTMenu.createInstances();
                }, 100);
            }
        }
    }, [loading, users]);

    // Real-time filtering - fetch when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) {
                fetchUsers(pagination.currentPage, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
            }
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timer);
    }, [filters.date_from, filters.date_to, filters.branch_id, filters.role_id]);

    // Handle search
    const handleSearch = (term) => {
        setSearchTerm(term);
        fetchUsers(1, term, statusFilter, sortConfig.column, sortConfig.direction);
    };

    // Handle status filter
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        fetchUsers(1, searchTerm, status, sortConfig.column, sortConfig.direction);
    };

    // Handle sort
    const handleSort = (column) => {
        const newDirection = 
            sortConfig.column === column && sortConfig.direction === 'asc' 
                ? 'desc' 
                : 'asc';
        
        setSortConfig({ column, direction: newDirection });
        fetchUsers(pagination.currentPage, searchTerm, statusFilter, column, newDirection);
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchUsers(page, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
    };

    // Handle delete user
    const handleDeleteUser = async (userId) => {
        if (!confirm(t('merchant.users.list.deleteConfirm'))) {
            return;
        }

        try {
            const response = await deleteUser(userId);
            
            if (response.success) {
                // Refresh users list
                fetchUsers(pagination.currentPage, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
                // You can add a success toast notification here
            } else {
                setError(response.error || t('merchant.users.list.deleteFailed'));
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            setError(t('merchant.users.list.unexpectedDelete'));
        }
    };

    // Handle status change
    const handleStatusChange = async (userId, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        
        try {
            const response = await changeUserStatus(userId, newStatus);
            
            if (response.success) {
                // Refresh users list
                fetchUsers(pagination.currentPage, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
            } else {
                setError(response.error || t('merchant.users.list.statusFailed'));
            }
        } catch (err) {
            console.error('Error changing user status:', err);
            setError(t('merchant.users.list.unexpectedStatus'));
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchUsers(pagination.currentPage, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
    };

    // Fetch branches for dropdown
    const fetchBranches = async (search = '') => {
        setLoadingBranches(true);
        try {
            const response = await getBranchesForSelect(search);
            if (response.success) {
                const branchesData = response.data?.data || response.data || [];
                setBranches(Array.isArray(branchesData) ? branchesData : []);
            } else {
                setBranches([]);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    // Fetch roles for dropdown
    const fetchRoles = async (search = '') => {
        setLoadingRoles(true);
        try {
            const params = { 
                per_page: 100,
                search: search || undefined
            };
            const response = await getRoles(params);
            if (response.success) {
                const responseData = response.data.data || {};
                const rolesList = response.data.data.data || response.data.data.roles || [];
                const rolesArray = Array.isArray(rolesList) ? rolesList : [];
                setRoles(rolesArray);
            } else {
                setRoles([]);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            setRoles([]);
        } finally {
            setLoadingRoles(false);
        }
    };

    // Load branches and roles when filter panel opens
    useEffect(() => {
        if (showFilters) {
            fetchBranches();
            fetchRoles();
        }
    }, [showFilters]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (branchSearchTimeoutRef.current) {
                clearTimeout(branchSearchTimeoutRef.current);
            }
            if (roleSearchTimeoutRef.current) {
                clearTimeout(roleSearchTimeoutRef.current);
            }
        };
    }, []);

    // Reset filters
    const resetFilters = () => {
        setFilters({
            date_from: '',
            date_to: '',
            branch_id: '',
            role_id: '',
        });
        // Clear search timeouts
        if (branchSearchTimeoutRef.current) {
            clearTimeout(branchSearchTimeoutRef.current);
        }
        if (roleSearchTimeoutRef.current) {
            clearTimeout(roleSearchTimeoutRef.current);
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm,
                status: statusFilter,
                date_from: filters.date_from,
                date_to: filters.date_to,
                branch_id: filters.branch_id,
                role_id: filters.role_id,
            };

            const blob = await exportUsers(params);
            
            // Check if blob is actually an error response (JSON error)
            if (blob.type === 'application/json') {
                const text = await blob.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || errorData.error || 'Export failed');
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success(t('merchant.users.list.exportSuccess'));
        } catch (err) {
            console.error('Error exporting users:', err);
            const errorMessage = err.response?.data?.message || err.message || t('merchant.users.list.exportFailed');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        fetchUsers(pagination.currentPage, searchTerm, statusFilter, sortConfig.column, sortConfig.direction);
    };

    // Handle date input click to open calendar
    const handleDateInputClick = (ref) => {
        if (ref && ref.current) {
            // Try to use the showPicker() method if available (modern browsers)
            if (ref.current.showPicker && typeof ref.current.showPicker === 'function') {
                ref.current.showPicker().catch((err) => {
                    // Fallback: if showPicker fails, just focus the input
                    ref.current.focus();
                });
            } else {
                // Fallback for browsers that don't support showPicker()
                ref.current.focus();
                // For some browsers, we need to trigger click after focus
                setTimeout(() => {
                    ref.current.click();
                }, 10);
            }
        }
    };

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { label: t('merchant.users.list.breadcrumbUsers'), path: `${basePath}/users`, active: true }
        ];
        
        setTitle(t('merchant.users.list.title'));
        setBreadcrumbs(breadcrumbs);
        setActions(
            <UsersToolbar 
                onRefresh={handleRefresh}
                loading={loading}
                basePath={basePath}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onImport={() => setShowImportModal(true)}
                onExport={handleExport}
            />
        );
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basePath, loading, t, i18n.language]);

    return (
        <>
        <style>{`
            @media print {
                .app-sidebar,
                .app-header,
                .breadcrumb,
                button,
                .btn,
                .card-header,
                .pagination,
                .filter-panel {
                    display: none !important;
                }
                .card {
                    border: none !important;
                    box-shadow: none !important;
                }
                .table {
                    font-size: 12px;
                }
            }
        `}</style>
        <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    
                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="card mb-5 filter-panel">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label 
                                            htmlFor="date_from"
                                            className="form-label"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => dateFromRef.current?.focus()}
                                        >
                                            {t('merchant.users.list.filterDateFrom')}
                                        </label>
                                        <input 
                                            id="date_from"
                                            ref={dateFromRef}
                                            type="date" 
                                            className="form-control form-control-sm"
                                            value={filters.date_from || ''}
                                            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                                            onClick={() => handleDateInputClick(dateFromRef)}
                                            onFocus={() => handleDateInputClick(dateFromRef)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label 
                                            htmlFor="date_to"
                                            className="form-label"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => dateToRef.current?.focus()}
                                        >
                                            {t('merchant.users.list.filterDateTo')}
                                        </label>
                                        <input 
                                            id="date_to"
                                            ref={dateToRef}
                                            type="date" 
                                            className="form-control form-control-sm"
                                            value={filters.date_to || ''}
                                            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                                            onClick={() => handleDateInputClick(dateToRef)}
                                            onFocus={() => handleDateInputClick(dateToRef)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <SearchableDropdown
                                            label={t('merchant.users.list.filterBranch')}
                                            placeholder={t('merchant.users.list.allBranches')}
                                            options={branches.map(branch => ({
                                                value: branch.id,
                                                label: branch.name || t('merchant.users.list.branchNamed', { id: branch.id })
                                            }))}
                                            selected={filters.branch_id || null}
                                            onSelect={(option) => {
                                                setFilters(prev => ({ ...prev, branch_id: option.value }));
                                            }}
                                            onClear={() => {
                                                setFilters(prev => ({ ...prev, branch_id: '' }));
                                            }}
                                            disabled={loadingBranches}
                                            loading={loadingBranches}
                                            showClear={true}
                                            name="branch_id"
                                            searchPlaceholder={t('merchant.users.list.searchBranches')}
                                            onSearchChange={(search) => {
                                                // Clear previous timeout
                                                if (branchSearchTimeoutRef.current) {
                                                    clearTimeout(branchSearchTimeoutRef.current);
                                                }
                                                // Debounce search
                                                branchSearchTimeoutRef.current = setTimeout(() => {
                                                    fetchBranches(search);
                                                }, 300);
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <SearchableDropdown
                                            label={t('merchant.users.list.filterRole')}
                                            placeholder={t('merchant.users.list.allRoles')}
                                            options={roles.map(role => ({
                                                value: role.id,
                                                label: role.name || t('merchant.users.list.roleNamed', { id: role.id })
                                            }))}
                                            selected={filters.role_id || null}
                                            onSelect={(option) => {
                                                setFilters(prev => ({ ...prev, role_id: option.value }));
                                            }}
                                            onClear={() => {
                                                setFilters(prev => ({ ...prev, role_id: '' }));
                                            }}
                                            disabled={loadingRoles}
                                            loading={loadingRoles}
                                            showClear={true}
                                            name="role_id"
                                            searchPlaceholder={t('merchant.users.list.searchRoles')}
                                            onSearchChange={(search) => {
                                                // Clear previous timeout
                                                if (roleSearchTimeoutRef.current) {
                                                    clearTimeout(roleSearchTimeoutRef.current);
                                                }
                                                // Debounce search
                                                roleSearchTimeoutRef.current = setTimeout(() => {
                                                    fetchRoles(search);
                                                }, 300);
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div className="text-muted fs-7">
                                        <i className="ki-duotone ki-information fs-5 text-primary me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        {t('merchant.users.list.filtersAutoApply')}
                                    </div>
                                    <button onClick={resetFilters} className="btn btn-sm btn-light-primary">
                                        <i className="ki-duotone ki-arrows-circle fs-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.users.list.resetFilters')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        {/* Card Header */}
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <UsersSearch 
                                    onSearch={handleSearch}
                                    searchTerm={searchTerm}
                                />
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="card-body pt-0">
                            {/* Error Alert */}
                            {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

                            {/* Loading Spinner */}
                            {loading && <LoadingSpinner />}

                            {/* Users Table */}
                            {!loading && (
                                <UsersTable
                                    users={users}
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onDelete={handleDeleteUser}
                                    onStatusChange={handleStatusChange}
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                    basePath={basePath}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

        {/* Import Modal */}
        {showImportModal && (
            <UserImportModal
                show={showImportModal}
                onHide={() => setShowImportModal(false)}
                onImportSuccess={handleImportSuccess}
            />
        )}
        </>
    );
};

export default UsersIndex;

