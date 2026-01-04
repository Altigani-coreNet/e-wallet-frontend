import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    getUserGroups, 
    deleteUserGroup, 
    bulkDeleteUserGroups,
    toggleUserGroupStatus 
} from '../../../services/userGroupsService';
import UserGroupsTable from './UserGroupsTable';
import UserGroupFilters from './UserGroupFilters';
import UserGroupToolbar from './UserGroupToolbar';
import UserGroupStatistics from './UserGroupStatistics';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const UserGroupsIndex = () => {
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const basePath = '/merchant';
    
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        branch_id: '',
        date_from: '',
        date_to: '',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 15,
        total: 0,
        lastPage: 1
    });

    // Fetch user groups
    const fetchUserGroups = async (page = 1) => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                page,
                per_page: pagination.perPage,
                ...filters
            };

            // Add status filter if selected from toolbar
            if (statusFilter) {
                params.status = statusFilter;
            }

            const response = await getUserGroups(params);

            if (response.success) {
                const apiData = response.data?.data || response.data;
                const userGroupsArray = apiData.data || apiData.user_groups || apiData || [];
                
                setUserGroups(userGroupsArray);
                
                // Update pagination
                if (apiData.current_page !== undefined) {
                    setPagination({
                        currentPage: apiData.current_page,
                        perPage: apiData.per_page,
                        total: apiData.total,
                        lastPage: apiData.last_page
                    });
                } else if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
            } else {
                setError(response.error || 'Failed to fetch user groups');
            }
        } catch (err) {
            console.error('Error fetching user groups:', err);
            setError('An unexpected error occurred while fetching user groups');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchUserGroups(pagination.currentPage);
    }, []);

    // Fetch when filters or status change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) {
                fetchUserGroups(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filters, statusFilter]);

    // Calculate statistics
    const statistics = {
        total: pagination.total || userGroups.length,
        active: userGroups.filter(ug => ug.is_active).length,
        inactive: userGroups.filter(ug => !ug.is_active).length,
        total_users: userGroups.reduce((sum, ug) => sum + (ug.users_count || 0), 0)
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchUserGroups(page);
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            const response = await deleteUserGroup(id);
            
            if (response.success) {
                toast.success('User group deleted successfully');
                fetchUserGroups(pagination.currentPage);
            } else {
                toast.error(response.error || 'Failed to delete user group');
            }
        } catch (err) {
            console.error('Error deleting user group:', err);
            toast.error('An unexpected error occurred');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one user group');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} user group(s)?`)) {
            return;
        }

        try {
            const response = await bulkDeleteUserGroups(selectedIds);
            
            if (response.success) {
                toast.success(response.data?.message || 'User groups deleted successfully');
                setSelectedIds([]);
                fetchUserGroups(pagination.currentPage);
            } else {
                toast.error(response.error || 'Failed to delete user groups');
            }
        } catch (err) {
            console.error('Error deleting user groups:', err);
            toast.error('An unexpected error occurred');
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (id) => {
        try {
            const response = await toggleUserGroupStatus(id);
            
            if (response.success) {
                toast.success(response.data?.message || 'Status updated successfully');
                fetchUserGroups(pagination.currentPage);
            } else {
                toast.error(response.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error toggling status:', err);
            toast.error('An unexpected error occurred');
        }
    };

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setFilters({
            search: '',
            status: '',
            branch_id: '',
            date_from: '',
            date_to: '',
        });
        setStatusFilter('');
    };

    // Set toolbar
    useEffect(() => {
        const breadcrumbs = [
            { label: 'User Groups', path: `${basePath}/user-groups`, active: true }
        ];
        
        setTitle('User Groups Management');
        setBreadcrumbs(breadcrumbs);
        setActions(
            <UserGroupToolbar 
                onRefresh={() => fetchUserGroups(pagination.currentPage)}
                loading={loading}
                statusFilter={statusFilter}
                onStatusFilter={setStatusFilter}
                basePath={basePath}
                onToggleFilters={() => setShowFilters(!showFilters)}
            />
        );
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, loading, statusFilter, pagination.currentPage]);

    return (
        <>
            {/* Statistics */}
            <UserGroupStatistics statistics={statistics} />

            {/* Filters */}
            {showFilters && (
                <UserGroupFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
            )}

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                    <div className="card mb-5">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="fw-bold">
                                    <span className="me-2">{selectedIds.length}</span>
                                    selected
                                </div>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleBulkDelete}
                                >
                                    <i className="ki-duotone ki-trash fs-3 me-1">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Delete Selected
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title"></div>
                    </div>

                    <div className="card-body pt-0">
                        {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

                        {loading && <LoadingSpinner />}

                        {!loading && (
                            <UserGroupsTable
                                userGroups={userGroups}
                                selectedIds={selectedIds}
                                onSelectChange={setSelectedIds}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                basePath={basePath}
                            />
                        )}
                    </div>
                </div>
        </>
    );
};

export default UserGroupsIndex;

