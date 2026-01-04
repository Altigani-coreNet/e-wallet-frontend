import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import UserGroupFiltersPanel from './UserGroupFiltersPanel';
import UserGroupTableRow from './UserGroupTableRow';
import UserGroupTableSkeleton from './UserGroupTableSkeleton';
import BulkActionBar from '../../common/BulkActionBar';

const AdminUserGroupsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const canCreateUserGroup = useCan('pos.user_groups.create_users_groups');
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        merchant_id: '',
        branch_id: '',
        date_from: '',
        date_to: ''
    });
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        setTitle('User Groups Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters Button */}
                <button
                    id="filters_button"
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-1 ${showFilters ? '' : 'rotate-90'}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Toggle Filters
                </button>

                {/* Export Button */}
                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success"
                    onClick={handleExport}
                >
                    <i className="ki-duotone ki-download fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Export
                </button>

                {/* Add User Group Button */}
                {canCreateUserGroup && (
                    <Link to="/admin/user-groups/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Add User Group
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters]);

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

    // Fetch user groups when pagination or filters change
    useEffect(() => {
        fetchUserGroups();
    }, [pagination.current_page, pagination.per_page, filters.search, filters.status, filters.merchant_id, filters.branch_id, filters.date_from, filters.date_to]);

    const fetchUserGroups = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.USER_GROUPS, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setUserGroups(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    per_page: response.data.data.per_page,
                    total: response.data.data.total,
                    last_page: response.data.data.last_page
                });
            }
        } catch (error) {
            toast.error('Failed to load user groups');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USER_GROUP_EXPORT, {
                params: filters,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                const { data, filename } = response.data.data;
                
                if (!data || data.length === 0) {
                    toast.error('No data to export');
                    return;
                }

                // Convert to CSV
                const headers = Object.keys(data[0]);
                let csvContent = headers.join(',') + '\n';
                
                data.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return '"' + stringValue.replace(/"/g, '""') + '"';
                        }
                        return stringValue;
                    });
                    csvContent += values.join(',') + '\n';
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename || 'user_groups_export.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                toast.success('Export successful!');
            } else {
                toast.error('No data to export');
            }
        } catch (error) {
            toast.error('Export failed');
            console.error(error);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setFilters({
            search: '',
            status: '',
            merchant_id: '',
            branch_id: '',
            date_from: '',
            date_to: ''
        });
        setTimeout(() => fetchUserGroups(), 100);
    };

    const handleApplyFilters = () => {
        setPagination({ ...pagination, current_page: 1 });
        fetchUserGroups();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(userGroups.map(g => g.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} user group(s)?`)) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_BULK_DELETE,
                { ids: selectedIds },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setUserGroups(userGroups.filter(group => !selectedIds.includes(group.id)));
                setPagination(prev => ({
                    ...prev,
                    total: prev.total - selectedIds.length
                }));
                setSelectedIds([]);
                toast.success(`${selectedIds.length} user group(s) deleted successfully`);
            }
        } catch (error) {
            toast.error('Failed to delete user groups');
            console.error(error);
        }
    };

    const handleActivate = async (id) => {
        if (!window.confirm('Are you sure you want to activate this user group?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_ACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setUserGroups(userGroups.map(group => 
                    group.id === id ? { ...group, is_active: true } : group
                ));
                toast.success('User group activated successfully');
            }
        } catch (error) {
            toast.error('Failed to activate user group');
            console.error(error);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this user group?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_GROUP_DEACTIVATE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setUserGroups(userGroups.map(group => 
                    group.id === id ? { ...group, is_active: false } : group
                ));
                toast.success('User group deactivated successfully');
            }
        } catch (error) {
            toast.error('Failed to deactivate user group');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user group?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.USER_GROUPS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setUserGroups(userGroups.filter(group => group.id !== id));
                setPagination(prev => ({
                    ...prev,
                    total: prev.total - 1
                }));
                toast.success('User group deleted successfully');
            }
        } catch (error) {
            toast.error('Failed to delete user group');
            console.error(error);
        }
    };

    return (
        <>
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    {/* Filters Panel */}
                    <UserGroupFiltersPanel
                        isVisible={showFilters}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onApply={handleApplyFilters}
                    />

                    {/* Main Card */}
                    <div className="card">
                        {/* Card Header */}
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
                                        placeholder="Quick search user groups..."
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
                                {/* Bulk Action Bar */}
                                {selectedIds.length > 0 ? (
                                    <BulkActionBar
                                        selectedCount={selectedIds.length}
                                        onClear={() => setSelectedIds([])}
                                        onDelete={handleBulkDelete}
                                    />
                                ) : null}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="card-body pt-0">
                            {loading ? (
                                <UserGroupTableSkeleton rows={pagination.per_page} />
                            ) : (
                                <div className="table-responsive">
                                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                                        <thead>
                                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                                <th className="w-10px pe-2">
                                                    <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedIds.length === userGroups.length && userGroups.length > 0}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="text-dark">ID</th>
                                                <th className="min-w-200px text-dark">Group Info</th>
                                                <th className="min-w-150px text-dark">Merchant</th>
                                                <th className="text-dark">Branch</th>
                                                <th className="text-dark">Country</th>
                                                <th className="text-dark">Users</th>
                                                <th className="text-dark">Status</th>
                                                <th className="text-dark">Created At</th>
                                                <th className="text-end text-dark">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 fw-semibold">
                                            {userGroups.map((group, index) => (
                                                <UserGroupTableRow
                                                    key={group.id}
                                                    group={group}
                                                    rowNumber={((pagination.current_page - 1) * pagination.per_page) + index + 1}
                                                    isSelected={selectedIds.includes(group.id)}
                                                    onSelect={handleSelectOne}
                                                    onActivate={handleActivate}
                                                    onDeactivate={handleDeactivate}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && userGroups.length > 0 && (
                                <div className="d-flex flex-stack flex-wrap pt-10">
                                    <div className="fs-6 fw-semibold text-gray-700">
                                        Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                                    </div>
                                    <ul className="pagination">
                                        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                                                disabled={pagination.current_page === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(pagination.last_page)].map((_, idx) => {
                                            const pageNum = idx + 1;
                                            if (
                                                pageNum === 1 ||
                                                pageNum === pagination.last_page ||
                                                (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)
                                            ) {
                                                return (
                                                    <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setPagination({ ...pagination, current_page: pageNum })}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            } else if (
                                                pageNum === pagination.current_page - 2 ||
                                                pageNum === pagination.current_page + 2
                                            ) {
                                                return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                            }
                                            return null;
                                        })}
                                        <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                                                disabled={pagination.current_page === pagination.last_page}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {/* No Results */}
                            {!loading && userGroups.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-gray-600 fs-4">No user groups found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminUserGroupsIndex;

