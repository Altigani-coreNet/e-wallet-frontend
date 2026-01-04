import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import MerchantFiltersPanel from './MerchantFiltersPanel';
import MerchantTableRow from './MerchantTableRow';
import MerchantImportModal from './MerchantImportModal';
import BulkActionBar from '../../common/BulkActionBar';
import MerchantRejectModal from './MerchantRejectModal';

const PLACEHOLDER_ROWS = 6;

const AdminMerchantsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const canCreateMerchant = useCan('pos.merchants.create_merchants');
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingMerchant, setRejectingMerchant] = useState(null);
    const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);
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
        setTitle('Merchants Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters Button */}
                <button
                    id="filters_button"
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Filter</span>
                </button>

                {/* Import Button */}
                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success"
                    onClick={() => setShowImportModal(true)}
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Import</span>
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
                    <span className="d-none d-md-inline ms-1">Export</span>
                </button>

                {/* Change Requests Button */}
                <Link to="/admin/merchants/change-requests" className="btn btn-sm fw-bold btn-light-warning">
                    <i className="ki-duotone ki-notepad fs-3 text-warning">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Requests</span>
                </Link>

                {/* Add Merchant Button */}
                {canCreateMerchant && (
                    <Link to="/admin/merchants/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">Add</span>
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

    // Fetch merchants when pagination or filters change
    useEffect(() => {
        fetchMerchants();
    }, [pagination.current_page, pagination.per_page, filters.search, filters.status, filters.merchant_id, filters.country_id, filters.date_from, filters.date_to]);

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Handle both 'success' and 'status' response formats
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setMerchants(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    per_page: response.data.data.per_page,
                    total: response.data.data.total,
                    last_page: response.data.data.last_page
                });
            }
        } catch (error) {
            toast.error('Failed to load merchants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANT_EXPORT, {
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
                link.setAttribute('download', filename || 'merchants_export.csv');
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
        // Refresh with cleared filters
        setTimeout(() => fetchMerchants(), 100);
    };

    const handleApplyFilters = () => {
        setPagination({ ...pagination, current_page: 1 });
        fetchMerchants();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(merchants.map(m => m.id));
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

        const confirmation = await Swal.fire({
            title: 'Delete merchants?',
            text: `Are you sure you want to delete ${selectedIds.length} merchant(s)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_BULK_DELETE,
                { ids: selectedIds },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(`${selectedIds.length} merchant(s) deleted successfully`);
                setSelectedIds([]);
                fetchMerchants();
            }
        } catch (error) {
            toast.error('Failed to delete merchants');
            console.error(error);
        }
    };

    const handleApprove = async (id) => {
        const confirmation = await Swal.fire({
            title: 'Approve merchant?',
            text: 'Are you sure you want to approve this merchant?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_APPROVE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Merchant approved successfully');
                fetchMerchants();
            }
        } catch (error) {
            toast.error('Failed to approve merchant');
            console.error(error);
        }
    };

    const handleReject = (merchant) => {
        setRejectingMerchant(merchant);
        setRejectModalOpen(true);
    };

    const handleRejectConfirm = async ({ merchantId, rejection_reason, invalid_fields }) => {
        try {
            setIsRejectSubmitting(true);
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_REJECT(merchantId),
                { rejection_reason, invalid_fields },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Merchant rejected successfully');
                setRejectModalOpen(false);
                setRejectingMerchant(null);
                fetchMerchants();
            } else {
                toast.error(response.data.message || 'Failed to reject merchant');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject merchant');
            console.error(error);
        } finally {
            setIsRejectSubmitting(false);
        }
    };

    const handleSuspend = async (merchant) => {
        const suspensionPrompt = await Swal.fire({
            title: 'Suspend merchant',
            text: 'Provide a reason for suspension (minimum 10 characters).',
            icon: 'warning',
            input: 'textarea',
            inputPlaceholder: 'Enter suspension reason...',
            showCancelButton: true,
            confirmButtonText: 'Suspend',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-warning',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false,
            preConfirm: (value) => {
                const trimmed = value?.trim();
                if (!trimmed || trimmed.length < 10) {
                    Swal.showValidationMessage('Suspension reason must be at least 10 characters.');
                    return;
                }
                return trimmed;
            }
        });

        if (!suspensionPrompt.isConfirmed || !suspensionPrompt.value) {
            return;
        }

        const reason = suspensionPrompt.value;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_SUSPEND(merchant.id),
                { suspension_reason: reason },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Merchant suspended successfully');
                fetchMerchants();
            }
        } catch (error) {
            toast.error('Failed to suspend merchant');
            console.error(error);
        }
    };

    const handleUnsuspend = async (id) => {
        const confirmation = await Swal.fire({
            title: 'Unsuspend merchant?',
            text: 'Are you sure you want to unsuspend this merchant?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Unsuspend',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_UNSUSPEND(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Merchant unsuspended successfully');
                fetchMerchants();
            }
        } catch (error) {
            toast.error('Failed to unsuspend merchant');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        const confirmation = await Swal.fire({
            title: 'Delete merchant?',
            text: 'Are you sure you want to delete this merchant?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.MERCHANTS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Merchant deleted successfully');
                fetchMerchants();
            }
        } catch (error) {
            toast.error('Failed to delete merchant');
            console.error(error);
        }
    };

    const handleResetPassword = async (merchant) => {
        if (!merchant.user_id && !merchant.user?.id) {
            toast.error('This merchant does not have an associated user account');
            return;
        }

        const confirmation = await Swal.fire({
            title: 'Reset Password?',
            text: `Are you sure you want to send a password reset link to ${merchant.user?.email || merchant.email}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, send reset link',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            const token = getToken();
            const userId = merchant.user_id || merchant.user?.id;
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_SEND_RESET_PASSWORD(userId),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(response.data.data?.message || 'Password reset link sent successfully');
            } else {
                toast.error(response.data.message || 'Failed to send reset password link');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset password link');
            console.error(error);
        }
    };

    const renderPlaceholderTable = useMemo(() => {
        if (!loading) return null;
        const columns = [
            'checkbox',
            'ID',
            'Logo',
            'Merchant Info',
            'Phone',
            'Business Type',
            'Plan',
            'Status',
            'Is Active',
            'Country',
            'Actions'
        ];

        return (
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                            {columns.map((column) => (
                                <th key={column}>
                                    {column === 'checkbox' ? (
                                        <div className="form-check form-check-sm form-check-custom form-check-solid me-3 placeholder-glow">
                                            <span className="placeholder col-12 rounded" style={{ height: '16px' }}></span>
                                        </div>
                                    ) : (
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-7" style={{ height: '12px' }}></span>
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: PLACEHOLDER_ROWS }).map((_, index) => (
                            <tr key={index} className="placeholder-glow">
                                <td>
                                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                                        <span className="placeholder col-12 rounded" style={{ height: '16px' }}></span>
                                    </div>
                                </td>
                                <td><span className="placeholder col-4" style={{ height: '14px' }}></span></td>
                                <td>
                                    <div className="symbol symbol-50px d-flex align-items-center">
                                        <span className="placeholder rounded-circle" style={{ width: '50px', height: '50px' }}></span>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex flex-column gap-2">
                                        <span className="placeholder col-8" style={{ height: '14px' }}></span>
                                        <span className="placeholder col-6" style={{ height: '12px' }}></span>
                                        <span className="placeholder col-7" style={{ height: '12px' }}></span>
                                    </div>
                                </td>
                                <td><span className="placeholder col-8" style={{ height: '14px' }}></span></td>
                                <td><span className="placeholder col-7" style={{ height: '22px' }}></span></td>
                                <td><span className="placeholder col-6" style={{ height: '22px' }}></span></td>
                                <td><span className="placeholder col-6" style={{ height: '22px' }}></span></td>
                                <td><span className="placeholder col-6" style={{ height: '22px' }}></span></td>
                                <td><span className="placeholder col-8" style={{ height: '14px' }}></span></td>
                                <td className="text-end">
                                    <div className="d-flex justify-content-end gap-2">
                                        <span className="placeholder rounded" style={{ width: '32px', height: '32px' }}></span>
                                        <span className="placeholder rounded" style={{ width: '32px', height: '32px' }}></span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }, [loading]);

    return (
        <>
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    {/* Filters Panel */}
                    <MerchantFiltersPanel
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
                                <div className="d-flex align-items-center position-relative me-5" style={{ minWidth: '250px' }}>
                                    <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 1 }}>
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-solid ps-13"
                                        placeholder="Quick search merchants..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        style={{ paddingLeft: '3rem' }}
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
                                renderPlaceholderTable
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
                                                            checked={selectedIds.length === merchants.length && merchants.length > 0}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="text-dark">ID</th>
                                                <th className="min-w-125px text-dark">Logo</th>
                                                <th className="min-w-200px text-dark">Merchant Info</th>
                                                <th className="text-dark">Phone</th>
                                                <th className="text-dark">Business Type</th>
                                                <th className="text-dark">Plan</th>
                                                <th className="text-dark">Status</th>
                                                <th className="text-dark">Is Active</th>
                                                <th className="text-dark">Country</th>
                                                <th className="text-end text-dark">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 fw-semibold">
                                            {merchants.map((merchant, index) => (
                                                <MerchantTableRow
                                                    key={merchant.id}
                                                    merchant={merchant}
                                                    rowNumber={((pagination.current_page - 1) * pagination.per_page) + index + 1}
                                                    isSelected={selectedIds.includes(merchant.id)}
                                                    onSelect={handleSelectOne}
                                                    onApprove={handleApprove}
                                                    onReject={handleReject}
                                                    onSuspend={handleSuspend}
                                                    onUnsuspend={handleUnsuspend}
                                                    onDelete={handleDelete}
                                                    onResetPassword={handleResetPassword}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && merchants.length > 0 && (
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
                                            // Show first, last, current, and adjacent pages
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
                            {!loading && merchants.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-gray-600 fs-4">No merchants found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <MerchantImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={fetchMerchants}
            />
            <MerchantRejectModal
                isOpen={rejectModalOpen}
                merchant={rejectingMerchant}
                onClose={() => {
                    if (isRejectSubmitting) return;
                    setRejectModalOpen(false);
                    setRejectingMerchant(null);
                }}
                onConfirm={handleRejectConfirm}
                isSubmitting={isRejectSubmitting}
            />

        </>
    );
};

export default AdminMerchantsIndex;



