import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import UserGroupFiltersPanel from './UserGroupFiltersPanel';
import UserGroupTableRow from './UserGroupTableRow';
import UserGroupTableSkeleton from './UserGroupTableSkeleton';
import BulkActionBar from '../../common/BulkActionBar';

const AdminUserGroupsIndex = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
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
        setTitle(t('admin.pages.userGroupsManagement'));
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
                    {t('admin.common.toggleFilters')}
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
                    {t('admin.common.export')}
                </button>

                {/* Add User Group Button */}
                {canCreateUserGroup && (
                    <Link to="/admin/user-groups/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('admin.common.addUserGroup')}
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t, i18n.language]);

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

    // Fetch user groups when pagination, filters change, or user navigates to this page again.
    useEffect(() => {
        fetchUserGroups();
    }, [
        location.key,
        pagination.current_page,
        pagination.per_page,
        filters.search,
        filters.status,
        filters.merchant_id,
        filters.branch_id,
        filters.date_from,
        filters.date_to
    ]);

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
                toast.error(t('admin.userGroupsIndex.fetchFailed'));
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
                    toast.error(t('admin.userGroupsIndex.exportNoData'));
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
                
                toast.success(t('admin.userGroupsIndex.exportSuccess'));
            } else {
                toast.error(t('admin.userGroupsIndex.exportNoData'));
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.exportFailed'));
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

        if (!window.confirm(t('admin.userGroupsIndex.bulkDeleteConfirm', { count: selectedIds.length }))) {
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
                toast.success(t('admin.userGroupsIndex.bulkDeleted', { count: selectedIds.length }));
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.deleteFailed'));
            console.error(error);
        }
    };

    const handleActivate = async (id) => {
        if (!window.confirm(t('admin.userGroupsIndex.activateConfirm'))) {
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
                toast.success(t('admin.userGroupsIndex.activated'));
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.activateFailed'));
            console.error(error);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm(t('admin.userGroupsIndex.deactivateConfirm'))) {
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
                toast.success(t('admin.userGroupsIndex.deactivated'));
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.deactivateFailed'));
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.userGroupsIndex.deleteOneConfirm'))) {
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
                toast.success(t('admin.userGroupsIndex.deleted'));
            }
        } catch (error) {
            toast.error(t('admin.userGroupsIndex.deleteFailed'));
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
                                        placeholder={t('admin.userGroupsIndex.searchPlaceholder')}
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
                                                <th className="text-dark">{t('admin.common.id')}</th>
                                                <th className="min-w-200px text-dark">{t('admin.userGroupsIndex.colGroupInfo')}</th>
                                                <th className="min-w-150px text-dark">{t('admin.userGroupsIndex.colMerchant')}</th>
                                                <th className="text-dark">{t('admin.userGroupsIndex.colBranch')}</th>
                                                <th className="text-dark">{t('admin.userGroupsIndex.colCountry')}</th>
                                                <th className="text-dark">{t('admin.userGroupsIndex.colUsers')}</th>
                                                <th className="text-dark">{t('admin.common.status')}</th>
                                                <th className="text-dark">{t('admin.common.createdAt')}</th>
                                                <th className="text-end text-dark">{t('admin.common.actions')}</th>
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
                                        {t('admin.common.showingEntries', {
                                            from: ((pagination.current_page - 1) * pagination.per_page) + 1,
                                            to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                            total: pagination.total
                                        })}
                                    </div>
                                    <ul className="pagination">
                                        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                                                disabled={pagination.current_page === 1}
                                            >
                                                {t('admin.common.previous')}
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
                                                {t('admin.common.next')}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {/* No Results */}
                            {!loading && userGroups.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-gray-600 fs-4">{t('admin.userGroupsIndex.noUserGroupsFound')}</p>
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

