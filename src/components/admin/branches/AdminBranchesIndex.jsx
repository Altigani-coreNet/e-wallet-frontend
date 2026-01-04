import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import BranchFiltersPanel from './BranchFiltersPanel';
import BranchTableRow from './BranchTableRow';
import BulkActionBar from '../../common/BulkActionBar';

const AdminBranchesIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const canCreateBranch = useCan('pos.branches.create_branches');
    const [branches, setBranches] = useState([]);
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
        country_id: '',
        date_from: '',
        date_to: ''
    });
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        setTitle('Branches Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters */}
                <button 
                    className="btn btn-sm fw-bold btn-secondary" 
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-6 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Toggle Filters
                </button>

                {/* Export */}
                <button className="btn btn-sm fw-bold btn-success" onClick={handleExport}>
                    <i className="ki-duotone ki-file-down fs-6 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Export
                </button>

                {/* Add Branch */}
                {canCreateBranch && (
                    <Link to="/admin/branches/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Add Branch
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

    // Fetch branches when pagination or filters change
    useEffect(() => {
        fetchBranches();
    }, [pagination.current_page, pagination.per_page, filters.search, filters.status, filters.merchant_id, filters.country_id, filters.date_from, filters.date_to]);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.BRANCHES, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                // Handle nested data structure: response.data.data.data contains the branches array
                const paginationData = response.data.data;
                setBranches(paginationData.data || []);
                setPagination({
                    current_page: paginationData.current_page,
                    per_page: paginationData.per_page,
                    total: paginationData.total,
                    last_page: paginationData.last_page
                });
            }
        } catch (error) {
            toast.error('Failed to load branches');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCH_EXPORT, {
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

                // Download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename || 'branches_export.csv');
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
            country_id: '',
            date_from: '',
            date_to: ''
        });
        setTimeout(() => fetchBranches(), 100);
    };

    const handleApplyFilters = () => {
        setPagination({ ...pagination, current_page: 1 });
        fetchBranches();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(branches.map(b => b.id));
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

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} branch(es)?`)) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.BRANCH_BULK_DELETE,
                { ids: selectedIds },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(`${selectedIds.length} branch(es) deleted successfully`);
                setSelectedIds([]);
                fetchBranches();
            }
        } catch (error) {
            toast.error('Failed to delete branches');
            console.error(error);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this branch?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_APPROVE(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch approved successfully');
                fetchBranches();
            }
        } catch (error) {
            toast.error('Failed to approve branch');
            console.error(error);
        }
    };

    const handleReject = async (branch) => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_REJECT(branch.id), {
                rejection_reason: reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch rejected successfully');
                fetchBranches();
            }
        } catch (error) {
            toast.error('Failed to reject branch');
            console.error(error);
        }
    };

    const handleSuspend = async (branch) => {
        const reason = window.prompt('Enter suspension reason:');
        if (!reason) return;

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_SUSPEND(branch.id), {
                suspension_reason: reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch suspended successfully');
                fetchBranches();
            }
        } catch (error) {
            toast.error('Failed to suspend branch');
            console.error(error);
        }
    };

    const handleUnsuspend = async (id) => {
        if (!window.confirm('Are you sure you want to unsuspend this branch?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_UNSUSPEND(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch unsuspended successfully');
                fetchBranches();
            }
        } catch (error) {
            toast.error('Failed to unsuspend branch');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this branch?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.delete(ADMIN_ENDPOINTS.BRANCH_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Branch deleted successfully');
                fetchBranches();
            }
        } catch (error) {
            toast.error('Failed to delete branch');
            console.error(error);
        }
    };

    return (
        <>
            {/* Filters Panel */}
            <BranchFiltersPanel 
                isVisible={showFilters}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onApply={handleApplyFilters}
            />

            {/* Main Card */}
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
                                placeholder="Quick search branches..."
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
                        <div className="d-flex justify-content-end" data-kt-customer-table-toolbar="base">
                            {selectedIds.length === 0 ? (
                                <div></div>
                            ) : (
                                <BulkActionBar
                                    selectedCount={selectedIds.length}
                                    onClear={() => setSelectedIds([])}
                                    onDelete={handleBulkDelete}
                                />
                            )}
                        </div>
                    </div>
                </div>

            <div className="card-body py-4">
                {loading ? (
                    <div className="text-center py-10">
                        <span className="spinner-border text-primary"></span>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-gray-600 fs-5">No branches found</div>
                    </div>
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
                                                checked={selectedIds.length === branches.length && branches.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-dark">ID</th>
                                    <th className="min-w-200px text-dark">Branch Name</th>
                                    <th className="min-w-150px text-dark">Merchant</th>
                                    <th className="min-w-200px text-dark">Address</th>
                                    <th className="text-dark">Country</th>
                                    <th className="text-dark">Status</th>
                                    <th className="text-dark">Is Active</th>
                                    <th className="text-dark">Created At</th>
                                    <th className="text-end text-dark">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {branches.map((branch, index) => (
                                    <BranchTableRow
                                        key={branch.id}
                                        branch={branch}
                                        rowNumber={((pagination.current_page - 1) * pagination.per_page) + index + 1}
                                        isSelected={selectedIds.includes(branch.id)}
                                        onSelect={handleSelectOne}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onSuspend={handleSuspend}
                                        onUnsuspend={handleUnsuspend}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && branches.length > 0 && (
                    <div className="d-flex flex-stack flex-wrap pt-10">
                        <div className="fs-6 fw-semibold text-gray-700">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                        </div>
                        <ul className="pagination">
                            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}>
                                    Previous
                                </button>
                            </li>
                            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}>
                                    Next
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default AdminBranchesIndex;



