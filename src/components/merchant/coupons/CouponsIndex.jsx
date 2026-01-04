import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';
import {
    useCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    bulkDeleteCoupons,
    exportCoupons,
    exportCouponTemplate,
    importCouponsPreview,
    importCoupons,
} from '../../../services/couponsService';
import InventoryToolbar from '../..//sales/inventory/InventoryToolbar';
import ImportInventoryModal from '../..//sales/inventory/ImportInventoryModal';

const CouponsIndex = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Pagination
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    });

    // Sorting
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc',
    });

    // Selection and modals
    const [selectedIds, setSelectedIds] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'percentage',
        amount: '',
        min_amount: '',
        max_amount: '',
        qty: '',
        expired_at: '',
    });

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Build query params
    const queryParams = useMemo(
        () => ({
            page: pagination.current_page,
            per_page: pagination.per_page,
            search: debouncedSearchTerm || undefined,
            status: statusFilter || undefined,
            sort_by: sortConfig.column,
            sort_direction: sortConfig.direction,
        }),
        [
            pagination.current_page,
            pagination.per_page,
            debouncedSearchTerm,
            statusFilter,
            sortConfig.column,
            sortConfig.direction,
        ]
    );

    const {
        data: couponsResponse,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useCoupons(queryParams, {
        keepPreviousData: true,
        onSuccess: (response) => {
            if (response.data?.current_page !== undefined) {
                setPagination({
                    current_page: response.data.current_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                    last_page: response.data.last_page,
                });
            }
        },
        onError: (err) => {
            console.error('Error fetching coupons:', err);
            toast.error('Failed to load coupons');
        },
    });

    const coupons = useMemo(() => {
        const couponsData = couponsResponse?.data?.coupons || [];
        return Array.isArray(couponsData) ? couponsData : [];
    }, [couponsResponse]);

    // Title & breadcrumbs
    useEffect(() => {
        setTitle('Coupons Management');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Coupons', path: '/sales/coupons' },
            { label: 'List Coupons', path: '/sales/coupons', active: true },
        ]);

        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Toolbar actions (Add, Import, Export, Bulk delete)
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
                addButtonLabel="Add Coupon"
            />
        );
        return () => setActions(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching, selectedIds.length]);

    // Sorting
    const handleSort = useCallback((column) => {
        setSortConfig((prev) => {
            if (prev.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return {
                column,
                direction: 'asc',
            };
        });
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    }, []);

    const getSortIcon = useCallback(
        (column) => {
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
        },
        [sortConfig]
    );

    // Pagination handlers
    const handlePageChange = useCallback((newPage) => {
        setPagination((prev) => ({ ...prev, current_page: newPage }));
    }, []);

    const handlePerPageChange = useCallback((newPerPage) => {
        setPagination((prev) => ({
            ...prev,
            per_page: newPerPage,
            current_page: 1,
        }));
    }, []);

    // CRUD handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);

        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                type: formData.type,
                amount: parseFloat(formData.amount || 0),
                min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
                max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
                qty: formData.qty ? parseInt(formData.qty, 10) : 0,
                expired_at: formData.expired_at || null,
            };

            if (editingCoupon) {
                await updateCoupon(editingCoupon.id, payload);
                toast.success('Coupon updated successfully');
            } else {
                await createCoupon(payload);
                toast.success('Coupon created successfully');
            }

            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            await refetch();
        } catch (error) {
            console.error('Error saving coupon:', error);
            const errorMessage =
                error.response?.data?.message ||
                (error.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat().join(', ')
                    : 'Failed to save coupon');
            toast.error(errorMessage);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCoupon(id);
            toast.success('Coupon deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            await refetch();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon');
        }
    };

    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one coupon');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} coupon(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteCoupons(selectedIds);

                if (response.success === false) {
                    Swal.fire('Error!', response.error || 'Failed to delete coupons.', 'error');
                } else {
                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Coupons have been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: ['coupons'] });
                    await refetch();
                }
            } catch (error) {
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            }
        }
    }, [selectedIds, queryClient, refetch]);

    const handleExport = useCallback(async () => {
        try {
            const blob = await exportCoupons({
                search: debouncedSearchTerm,
                status: statusFilter || undefined,
                ...queryParams,
            });

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `coupons_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            toast.success('Coupons exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export coupons');
        }
    }, [debouncedSearchTerm, statusFilter, queryParams]);

    const handleImportSuccess = () => {
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: ['coupons'] });
        refetch();
    };

    // Modal helpers
    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            name: coupon.name || '',
            code: coupon.code || '',
            type: coupon.type || 'percentage',
            amount: coupon.amount ?? '',
            min_amount: coupon.min_amount ?? '',
            max_amount: coupon.max_amount ?? '',
            qty: coupon.qty ?? '',
            expired_at: coupon.expired_at ? coupon.expired_at.substring(0, 10) : '',
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCoupon(null);
        setFormData({
            name: '',
            code: '',
            type: 'percentage',
            amount: '',
            min_amount: '',
            max_amount: '',
            qty: '',
            expired_at: '',
        });
    };

    const handleOpenModal = () => {
        setEditingCoupon(null);
        setFormData({
            name: '',
            code: '',
            type: 'percentage',
            amount: '',
            min_amount: '',
            max_amount: '',
            qty: '',
            expired_at: '',
        });
        setShowModal(true);
    };

    const { current_page, per_page, total, last_page } = pagination;

    return (
        <>
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-13"
                                placeholder="Search coupons..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '150px' }}
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination((prev) => ({ ...prev, current_page: 1 }));
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                            </select>
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 text-nowrap">Per Page:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: '80px' }}
                                    value={per_page}
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
                </div>

                <div className="card-body pt-0">
                    {isFetching && !isLoading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                            </div>
                        </div>
                    )}

                    {queryError && (
                        <div className="alert alert-danger alert-dismissible mb-4">
                            <strong>Error:</strong>{' '}
                            {queryError?.response?.data?.message ||
                                queryError.message ||
                                'Failed to load coupons'}
                        </div>
                    )}

                    <div
                        className="table-responsive"
                        style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}
                    >
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th className="w-25px">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    selectedIds.length > 0 &&
                                                    selectedIds.length === coupons.length
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(coupons.map((c) => c.id));
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
                                        <span className="d-flex align-items-center">
                                            ID {getSortIcon('id')}
                                        </span>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('code')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Code {getSortIcon('code')}
                                        </span>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('name')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Name {getSortIcon('name')}
                                        </span>
                                    </th>
                                    <th>Type</th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('amount')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Amount {getSortIcon('amount')}
                                        </span>
                                    </th>
                                    <th>Usage</th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('expired_at')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Expires At {getSortIcon('expired_at')}
                                        </span>
                                    </th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && coupons.length === 0 ? (
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td>
                                                <span className="placeholder col-6"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-4"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-8"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-6"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-6"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-6"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-7"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-6"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder col-6"></span>
                                            </td>
                                        </tr>
                                    ))
                                ) : coupons.length > 0 ? (
                                    coupons.map((coupon) => {
                                        const isSelected = selectedIds.includes(coupon.id);
                                        const isPercentage =
                                            String(coupon.type).toLowerCase() === 'percentage';
                                        const usageLabel = `${coupon.used || 0} / ${
                                            coupon.qty ?? 0
                                        }`;
                                        return (
                                            <tr key={coupon.id}>
                                                <td>
                                                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) {
                                                                    setSelectedIds((prev) =>
                                                                        prev.filter(
                                                                            (id) => id !== coupon.id
                                                                        )
                                                                    );
                                                                } else {
                                                                    setSelectedIds((prev) => [
                                                                        ...prev,
                                                                        coupon.id,
                                                                    ]);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-dark fw-bold">
                                                        {coupon.id}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-primary">
                                                        {coupon.code}
                                                    </span>
                                                </td>
                                                <td>{coupon.name}</td>
                                                <td className="text-capitalize">{coupon.type}</td>
                                                <td>
                                                    {isPercentage
                                                        ? `${coupon.amount}%`
                                                        : coupon.amount}
                                                </td>
                                                <td>{usageLabel}</td>
                                                <td>
                                                    {coupon.expired_at
                                                        ? coupon.expired_at
                                                        : 'No expiry'}
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-light-primary me-2"
                                                        onClick={() => handleEdit(coupon)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-light-danger"
                                                        onClick={() => handleDelete(coupon.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center py-10">
                                            No coupons found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center pt-4">
                            <div className="text-muted">
                                Showing {coupons.length} of {total} coupons
                            </div>
                            <nav>
                                <ul className="pagination mb-0">
                                    <li
                                        className={`page-item ${
                                            current_page === 1 || isFetching ? 'disabled' : ''
                                        }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() =>
                                                handlePageChange(Math.max(current_page - 1, 1))
                                            }
                                            disabled={current_page === 1 || isFetching}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {[...Array(Math.min(last_page, 10))].map((_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${
                                                    current_page === pageNum ? 'active' : ''
                                                } ${isFetching ? 'disabled' : ''}`}
                                            >
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
                                    {last_page > 10 && (
                                        <li className="page-item disabled">
                                            <span className="page-link">...</span>
                                        </li>
                                    )}
                                    <li
                                        className={`page-item ${
                                            current_page === last_page || isFetching
                                                ? 'disabled'
                                                : ''
                                        }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() =>
                                                handlePageChange(
                                                    Math.min(current_page + 1, last_page)
                                                )
                                            }
                                            disabled={current_page === last_page || isFetching}
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
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label required">Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label required">Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value.toUpperCase(),
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    type: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label required">Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={formData.amount}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    amount: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Min Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={formData.min_amount}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        min_amount: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={formData.max_amount}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        max_amount: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.qty}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    qty: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Expiration Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.expired_at}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    expired_at: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloseModal}
                                        disabled={formSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={formSubmitting}
                                    >
                                        {formSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Please wait...
                                            </>
                                        ) : editingCoupon ? (
                                            'Update'
                                        ) : (
                                            'Create'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showImportModal && (
                <ImportInventoryModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                    entityName="coupon"
                    exportTemplate={exportCouponTemplate}
                    importPreview={importCouponsPreview}
                    importData={importCoupons}
                />
            )}
        </>
    );
};

export default CouponsIndex;


