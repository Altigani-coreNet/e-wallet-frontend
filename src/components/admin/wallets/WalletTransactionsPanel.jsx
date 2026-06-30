import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../../utils/walletMoney';
import CustomerTransactionFiltersPanel from '../customers/CustomerTransactionFiltersPanel';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const WalletTransactionsPanel = ({
    transactions = [],
    isLoading = false,
    isFetching = false,
    error = null,
    errorMessage,
    emptyMessage,
    pagination,
    onPaginationChange,
    filters,
    onFiltersChange,
    onClearFilters,
    onRefetch,
    currencyCode = 'SDG',
    getTransactionLink,
    testIdPrefix = 'wallet',
    cardTitle,
}) => {
    const { t } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);

    const currentPage = pagination.current_page || 1;
    const perPage = pagination.per_page || 15;

    const handlePerPageChange = (e) => {
        const nextPerPage = Number(e.target.value);
        onPaginationChange({ ...pagination, per_page: nextPerPage, current_page: 1 });
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div data-testid={`${testIdPrefix}-transactions-panel`}>
            {error && <ErrorAlert message={errorMessage || t('admin.wallets.failedToLoadTransactions')} />}

            <div className="d-flex flex-wrap gap-3 mb-5">
                <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => onRefetch?.()}
                    disabled={isFetching}
                >
                    <i className="ki-duotone ki-arrows-circle fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('common.refresh')}
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-light-primary"
                    onClick={() => setShowFilters((prev) => !prev)}
                >
                    {t('common.filter')}
                </button>
                <div className="ms-auto d-flex align-items-center gap-2">
                    <label className="form-label mb-0 text-muted fs-7">{t('common.perPage')}</label>
                    <select
                        className="form-select form-select-sm form-select-solid w-auto"
                        value={perPage}
                        onChange={handlePerPageChange}
                        data-testid={`${testIdPrefix}-tx-per-page`}
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {showFilters && (
                <CustomerTransactionFiltersPanel
                    filters={filters}
                    onChange={onFiltersChange}
                    onClear={onClearFilters}
                />
            )}

            <div className="card">
                {cardTitle && (
                    <div className="card-header">
                        <h3 className="card-title fw-bold">{cardTitle}</h3>
                    </div>
                )}
                <div className="card-body pt-0">
                    <div
                        className="table-responsive"
                        style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}
                    >
                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th>{t('common.date')}</th>
                                    <th>{t('admin.wallets.type')}</th>
                                    <th>{t('admin.wallets.direction')}</th>
                                    <th className="text-end">{t('admin.wallets.amount')}</th>
                                    <th className="text-end">{t('admin.wallets.balanceAfter')}</th>
                                    <th>{t('admin.wallets.counterparty')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-muted">
                                            {emptyMessage || t('admin.wallets.noTransactionsFound')}
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const signed = tx.signedDisplay(currencyCode);
                                        const counterparty = tx.counterparty;
                                        const detailLink = getTransactionLink?.(tx);

                                        return (
                                            <tr key={tx.id} data-testid={`${testIdPrefix}-tx-row`}>
                                                <td>
                                                    {tx.created_at
                                                        ? new Date(tx.created_at).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-primary text-capitalize">
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            tx.direction === 'debit'
                                                                ? 'badge-light-danger'
                                                                : 'badge-light-success'
                                                        }`}
                                                    >
                                                        {tx.direction}
                                                    </span>
                                                </td>
                                                <td className={`text-end ${signed.className}`}>{signed.text}</td>
                                                <td className="text-end">{fmtMoney(tx.balance_after)}</td>
                                                <td>
                                                    {counterparty ? (
                                                        <div>
                                                            {counterparty.wallet_uuid ? (
                                                                <Link
                                                                    to={`/admin/wallets/${counterparty.wallet_uuid}`}
                                                                    className="fw-bold"
                                                                >
                                                                    {counterparty.wallet_id}
                                                                </Link>
                                                            ) : (
                                                                <span className="fw-bold">
                                                                    {counterparty.wallet_id}
                                                                </span>
                                                            )}
                                                            <div className="text-muted fs-7">
                                                                {counterparty.owner_name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    {detailLink ? (
                                                        <Link
                                                            to={detailLink}
                                                            className="btn btn-sm btn-light-primary"
                                                        >
                                                            {t('common.viewDetails')}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.total > 0 && (
                        <div className="d-flex flex-stack flex-wrap pt-5">
                            <span className="text-muted fs-7">
                                {t('common.showingEntries', {
                                    from: (currentPage - 1) * perPage + 1,
                                    to: Math.min(currentPage * perPage, pagination.total),
                                    total: pagination.total,
                                })}
                            </span>
                            <ul className="pagination" data-testid={`${testIdPrefix}-tx-pagination`}>
                                <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                                    <button
                                        type="button"
                                        className="page-link"
                                        data-testid={`${testIdPrefix}-tx-prev`}
                                        onClick={() =>
                                            onPaginationChange({
                                                ...pagination,
                                                current_page: currentPage - 1,
                                            })
                                        }
                                    >
                                        {t('common.previous')}
                                    </button>
                                </li>
                                <li className="page-item active">
                                    <span className="page-link">{currentPage}</span>
                                </li>
                                <li
                                    className={`page-item ${
                                        currentPage >= pagination.last_page ? 'disabled' : ''
                                    }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link"
                                        data-testid={`${testIdPrefix}-tx-next`}
                                        onClick={() =>
                                            onPaginationChange({
                                                ...pagination,
                                                current_page: currentPage + 1,
                                            })
                                        }
                                    >
                                        {t('common.next')}
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletTransactionsPanel;
