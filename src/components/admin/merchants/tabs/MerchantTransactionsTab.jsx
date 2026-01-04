import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../../utils/constants';
import { getToken } from '../../../../utils/api';
import PaginationControls from '../../../common/PaginationControls';

const DEFAULT_PAGINATION = {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
};

const MerchantTransactionsTab = ({ merchantId }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(() => ({ ...DEFAULT_PAGINATION }));

    useEffect(() => {
        if (!merchantId) {
            setTransactions([]);
            setPagination({ ...DEFAULT_PAGINATION });
        } else {
            setPagination((prev) => (prev.current_page === 1 ? prev : { ...prev, current_page: 1 }));
        }
    }, [merchantId]);

    useEffect(() => {
        if (!merchantId) return;

        let isMounted = true;

        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = getToken();
                const params = {
                    page: pagination.current_page,
                    per_page: pagination.per_page,
                    merchant_id: merchantId,
                };

                const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTIONS, {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (!isMounted) {
                    return;
                }

                const payload = response.data?.data ?? response.data ?? {};
                const list = payload.data ?? [];

                setTransactions(list);

                const nextPagination = {
                    current_page: Number(payload.current_page ?? params.page ?? 1),
                    per_page: Number(payload.per_page ?? params.per_page ?? DEFAULT_PAGINATION.per_page),
                    last_page: Number(payload.last_page ?? 1),
                    total: Number(payload.total ?? list.length ?? 0),
                };

                setPagination((prev) => {
                    if (
                        prev.current_page === nextPagination.current_page &&
                        prev.per_page === nextPagination.per_page &&
                        prev.last_page === nextPagination.last_page &&
                        prev.total === nextPagination.total
                    ) {
                        return prev;
                    }
                    return nextPagination;
                });
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                console.error('Failed to load transactions', err);
                const message = err.response?.data?.message || 'Failed to load transactions';
                setError(message);
                setTransactions([]);
                setPagination((prev) => ({
                    ...prev,
                    total: 0,
                    last_page: 1,
                }));
                toast.error(message);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTransactions();

        return () => {
            isMounted = false;
        };
    }, [merchantId, pagination.current_page, pagination.per_page]);

    const handlePageChange = (page) => {
        setPagination((prev) => {
            if (page === prev.current_page) {
                return prev;
            }
            return { ...prev, current_page: page };
        });
    };

    const handlePerPageChange = (event) => {
        const value = Number(event.target.value) || DEFAULT_PAGINATION.per_page;
        setPagination((prev) => {
            if (prev.per_page === value && prev.current_page === 1) {
                return prev;
            }
            return {
                ...prev,
                per_page: value,
                current_page: 1,
            };
        });
    };

    const hasTransactions = transactions.length > 0;
    const startEntry = hasTransactions ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
    const endEntry = hasTransactions ? Math.min(pagination.current_page * pagination.per_page, pagination.total) : 0;

    return (
        <div className="card">
            <div className="card-header border-0">
                <div className="card-title">
                    <h3 className="fw-bold mb-0">Transactions</h3>
                </div>
            </div>

            <div className="card-body border-top py-5">
                {!merchantId ? (
                    <div className="alert alert-info mb-0">
                        Select a merchant to view their transactions.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                    <th className="min-w-150px">Transaction ID</th>
                                    <th className="min-w-140px">Amount</th>
                                    <th className="min-w-150px">Payment Method</th>
                                    <th className="min-w-120px">Status</th>
                                    <th className="min-w-180px">Created At</th>
                                    <th className="text-end min-w-100px">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="fw-semibold text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10">
                                            <span className="spinner-border spinner-border-sm text-primary"></span>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-danger">
                                            {error}
                                        </td>
                                    </tr>
                                ) : !hasTransactions ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-600">
                                            No transactions found for this merchant.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => {
                                        const rawStatus = transaction?.status;
                                        const normalizedStatus = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
                                        const statusBadgeVariant = normalizedStatus === 'approved'
                                            ? 'success'
                                            : normalizedStatus === 'pending'
                                                ? 'warning'
                                                : normalizedStatus === 'failed' || normalizedStatus === 'declined'
                                                    ? 'danger'
                                                    : 'secondary';
                                        const statusLabel = normalizedStatus
                                            ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
                                            : 'N/A';

                                        return (
                                        <tr key={transaction.id}>
                                            <td className="text-gray-800 fw-semibold">
                                                {transaction.transaction_id || transaction.id || 'N/A'}
                                            </td>
                                            <td className="text-gray-700">
                                                {transaction.currency_symbol || ''}
                                                {Number(transaction.amount ?? 0).toFixed(2)}
                                            </td>
                                            <td className="text-gray-700">
                                                {transaction.payment_method?.name || transaction.payment_method || 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`badge badge-light-${statusBadgeVariant}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="text-gray-700">
                                                {transaction.created_at
                                                    ? new Date(transaction.created_at).toLocaleString()
                                                    : 'N/A'}
                                            </td>
                                            <td className="text-end">
                                                <Link to={`/admin/transactions/${transaction.id}`} className="btn btn-sm btn-light-primary">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {merchantId && (
                <div className="card-footer d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-gray-600 small">Show</span>
                        <select
                            className="form-select form-select-sm w-auto"
                            value={pagination.per_page}
                            onChange={handlePerPageChange}
                            disabled={loading}
                        >
                            {[10, 25, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span className="text-gray-600 small">entries</span>
                    </div>

                    <div className="text-gray-600 small">
                        {hasTransactions
                            ? `Showing ${startEntry} to ${endEntry} of ${pagination.total} entries`
                            : 'No entries to display'}
                    </div>

                    <PaginationControls
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        disabled={loading || !hasTransactions}
                    />
                </div>
            )}
        </div>
    );
};

export default MerchantTransactionsTab;