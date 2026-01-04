import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import {
    getChangeRequests,
    getChangeRequestStatistics,
} from '../../../services/adminChangeRequestsService';
import PaginationControls from '../../common/PaginationControls';

const initialFilters = {
    search: '',
    status: '',
    type: '',
};

const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
];

const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'merchant', label: 'Merchant' },
    { value: 'branch', label: 'Branch' },
];

const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const statusBadgeClass = (status) => {
    switch (status) {
        case 'pending':
            return 'badge-light-warning';
        case 'approved':
            return 'badge-light-success';
        case 'rejected':
            return 'badge-light-danger';
        case 'suspended':
            return 'badge-light-secondary';
        default:
            return 'badge-light';
    }
};

const AdminChangeRequestsIndex = () => {
    const { setTitle, setActions } = useToolbar();

    const [changeRequests, setChangeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ merchant: 0, branch: 0, total: 0 });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [paginationMeta, setPaginationMeta] = useState({ total: 0, last_page: 1 });
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);

    const loadStats = useCallback(async () => {
        const response = await getChangeRequestStatistics();
        const success = response?.status ?? response?.success ?? false;
        if (!success) {
            throw new Error(response?.message || 'Failed to load change request statistics');
        }
        const pending = response?.data?.pending ?? {};
        setStats({
            merchant: pending.merchant ?? 0,
            branch: pending.branch ?? 0,
            total:
                pending.total ??
                ((pending.merchant ?? 0) + (pending.branch ?? 0)),
        });
    }, []);

    const fetchChangeRequests = useCallback(async () => {
        const params = {
            page,
            per_page: perPage,
        };

        if (appliedFilters.status) {
            params.status = appliedFilters.status;
        }
        if (appliedFilters.type) {
            params.type = appliedFilters.type;
        }
        if (appliedFilters.search) {
            params.search = appliedFilters.search;
        }

        const response = await getChangeRequests(params);
        const success = response?.status ?? response?.success ?? false;
        if (!success) {
            throw new Error(response?.message || 'Failed to load change requests');
        }

        const payload = response?.data ?? {};
        const items = payload?.data ?? [];

        setChangeRequests(items);

        const nextTotal = payload?.total ?? items.length ?? 0;
        const nextLastPage = payload?.last_page ?? 1;
        setPaginationMeta({
            total: nextTotal,
            last_page: nextLastPage,
        });

        const nextPage = payload?.current_page ?? page;
        if (nextPage !== page) {
            setPage(nextPage);
        }

        const nextPerPage = payload?.per_page ?? perPage;
        if (nextPerPage !== perPage) {
            setPerPage(nextPerPage);
        }
    }, [appliedFilters, page, perPage]);

    useEffect(() => {
        setTitle('Change Request History');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    type="button"
                    className="btn btn-sm btn-light-primary"
                    onClick={async () => {
                        setLoading(true);
                        try {
                            await Promise.all([loadStats(), fetchChangeRequests()]);
                        } catch (error) {
                            console.error('Error refreshing change requests:', error);
                            toast.error('Failed to refresh change requests');
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <i className="ki-duotone ki-arrows-circle fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Refresh
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, fetchChangeRequests, loadStats]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                await loadStats();
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading change request statistics:', error);
                    toast.error(error?.message || 'Failed to load change request counts');
                }
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [loadStats]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                await fetchChangeRequests();
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading change requests:', error);
                    toast.error(error?.message || 'Failed to load change requests');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [page, perPage, appliedFilters, fetchChangeRequests]);

    const handleApplyFilters = () => {
        setPage(1);
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPage(1);
        setPerPage(15);
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage === page || nextPage > paginationMeta.last_page) {
            return;
        }
        setPage(nextPage);
    };

    const handlePerPageChange = (event) => {
        const nextPerPage = Number(event.target.value) || 15;
        setPerPage(nextPerPage);
        setPage(1);
    };

    const renderRequester = (requester) => {
        if (!requester) {
            return <span className="text-muted">System</span>;
        }
        return requester.name || requester.email || `#${requester.id}`;
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`loading-${index}`}>
                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                <td key={cellIndex}>
                                    <span className="placeholder col-7"></span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </>
            );
        }

        if (!changeRequests.length) {
            return (
                <tr>
                    <td colSpan={7} className="text-center text-muted py-10">
                        No change requests found for the selected filters.
                    </td>
                </tr>
            );
        }

        return changeRequests.map((request) => {
            const createdAt = request.created_at
                ? new Date(request.created_at).toLocaleString()
                : 'N/A';
            const changeableLabel = request.changeable_label || 'Unknown';
            const changeableName = request.changeable_name || 'N/A';
            return (
                <tr key={request.id}>
                    <td>
                        <Link
                            to={`/admin/merchants/change-requests/${request.id}`}
                            className="fw-semibold text-primary"
                        >
                            #{request.id}
                        </Link>
                    </td>
                    <td>
                        <div className="d-flex align-items-center">
                            <span className="badge badge-light-info me-2 text-capitalize">
                                {request.changeable_type || 'unknown'}
                            </span>
                            <span className="fw-semibold">{changeableLabel}</span>
                        </div>
                    </td>
                    <td>
                        <div className="d-flex flex-column">
                            <span className="fw-semibold">{changeableName}</span>
                            {request.reason && (
                                <span className="text-muted fs-7">{request.reason}</span>
                            )}
                        </div>
                    </td>
                    <td>
                        <span className={`badge ${statusBadgeClass(request.status)}`}>
                            {formatStatus(request.status)}
                        </span>
                    </td>
                    <td>{renderRequester(request.requester)}</td>
                    <td>{createdAt}</td>
                    <td className="text-end">
                        <Link
                            to={`/admin/merchants/change-requests/${request.id}`}
                            className="btn btn-sm btn-light-primary"
                        >
                            View
                        </Link>
                    </td>
                </tr>
            );
        });
    };

    const startEntry = (page - 1) * perPage + 1;
    const endEntry = page * perPage;
    const displayStart = paginationMeta.total === 0 ? 0 : Math.min(startEntry, paginationMeta.total);
    const displayEnd = paginationMeta.total === 0 ? 0 : Math.min(endEntry, paginationMeta.total);

    return (
        <>
            <div className="row g-5 g-xl-8 mb-5">
                <div className="col-sm-4">
                    <div className="card card-flush h-md-100">
                        <div className="card-body d-flex flex-column justify-content-center">
                            <span className="text-muted fw-semibold fs-7">Pending Merchant Requests</span>
                            <span className="fs-2hx fw-bold text-warning">
                                {stats.merchant}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="card card-flush h-md-100">
                        <div className="card-body d-flex flex-column justify-content-center">
                            <span className="text-muted fw-semibold fs-7">Pending Branch Requests</span>
                            <span className="fs-2hx fw-bold text-warning">
                                {stats.branch}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="card card-flush h-md-100">
                        <div className="card-body d-flex flex-column justify-content-center">
                            <span className="text-muted fw-semibold fs-7">Total Pending</span>
                            <span className="fs-2hx fw-bold text-danger">
                                {stats.total}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-body">
                    <div className="row g-4">
                        <div className="col-md-4">
                            <label className="form-label fw-semibold">Search</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name, reason or notes"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Type</label>
                            <select
                                className="form-select"
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <div className="d-flex w-100 justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleApplyFilters}
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={handleResetFilters}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

    <div className="card">
        <div className="card-body py-4">
            <div className="table-responsive">
                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                    <thead>
                        <tr className="fw-bold text-muted">
                            <th>ID</th>
                            <th>Type</th>
                            <th>Subject / Reason</th>
                            <th>Status</th>
                            <th>Requested By</th>
                            <th>Created At</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>{renderTableBody()}</tbody>
                </table>
            </div>

            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mt-5">
                <div className="text-muted">
                    {paginationMeta.total > 0
                        ? (
                            <span>
                                Showing <strong>{displayStart}</strong> to{' '}
                                <strong>{displayEnd}</strong> of{' '}
                                <strong>{paginationMeta.total}</strong> change requests
                            </span>
                        )
                        : (
                            <span>No change requests to display</span>
                        )}
                </div>

                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted">Rows per page:</span>
                        <select
                            className="form-select form-select-sm w-auto"
                            value={perPage}
                            onChange={handlePerPageChange}
                        >
                            {[10, 15, 25, 50].map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <PaginationControls
                        pagination={{ current_page: page, last_page: paginationMeta.last_page }}
                        onPageChange={handlePageChange}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    </div>
</>
    );
};

export default AdminChangeRequestsIndex;


