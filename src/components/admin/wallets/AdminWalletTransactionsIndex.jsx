import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fmtMoney } from '../../../utils/walletMoney';
import {
    useAllWalletTransactions,
    downloadWalletTransactionsExport,
    triggerBlobDownload,
} from '../../../services/adminWalletsService';
import WalletTransactionFiltersPanel from './WalletTransactionFiltersPanel';
import WalletToolbar from './WalletToolbar';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const AdminWalletTransactionsIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        direction: '',
        type: '',
        wallet_id: '',
        date_from: '',
        date_to: '',
        min_amount: '',
        max_amount: '',
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const queryParams = useMemo(
        () => ({
            page: pagination.current_page,
            per_page: pagination.per_page,
            ...debouncedFilters,
        }),
        [pagination.current_page, pagination.per_page, debouncedFilters]
    );

    const {
        data: txResponse,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useAllWalletTransactions(queryParams);

    useEffect(() => {
        if (txResponse?.current_page !== undefined) {
            setPagination({
                current_page: txResponse.current_page,
                per_page: txResponse.per_page,
                total: txResponse.total,
                last_page: txResponse.last_page || Math.ceil(txResponse.total / txResponse.per_page),
            });
        }
    }, [txResponse]);

    const transactions = useMemo(() => {
        if (!txResponse?.data) return [];
        return txResponse.data;
    }, [txResponse]);

    const handleExport = useCallback(async () => {
        try {
            const blob = await downloadWalletTransactionsExport(debouncedFilters);
            triggerBlobDownload(blob, `wallet_transactions_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success(t('admin.wallets.exportSuccess'));
        } catch (err) {
            console.error(err);
            toast.error(t('admin.wallets.exportFailed'));
        }
    }, [debouncedFilters, t]);

    const handleClearFilters = () => {
        setFilters({
            search: '',
            direction: '',
            type: '',
            wallet_id: '',
            date_from: '',
            date_to: '',
            min_amount: '',
            max_amount: '',
        });
    };

    useEffect(() => {
        setTitle(t('admin.wallets.allTransactions'));
        setBreadcrumbs([
            { title: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { title: t('admin.wallets.title'), path: '/admin/wallets' },
            { title: t('admin.wallets.allTransactions'), path: '/admin/wallets/transactions' },
        ]);
        setActions(
            <WalletToolbar
                onRefresh={refetch}
                loading={isFetching}
                onToggleFilters={() => setShowFilters((prev) => !prev)}
                onExport={handleExport}
            />
        );
        return () => {
            setTitle('');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions, t, refetch, isFetching, handleExport]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const currentPage = pagination.current_page || 1;
    const perPage = pagination.per_page || 15;

    return (
        <>
            {queryError && <ErrorAlert message={t('admin.wallets.failedToLoadTransactions')} />}

            {showFilters && (
                <WalletTransactionFiltersPanel
                    filters={filters}
                    onChange={setFilters}
                    onClear={handleClearFilters}
                />
            )}

            <div className="card">
                <div className="card-body pt-0">
                    <div
                        className="table-responsive"
                        style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}
                    >
                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th>{t('common.date')}</th>
                                    <th>{t('admin.wallets.walletId')}</th>
                                    <th>{t('admin.wallets.walletType')}</th>
                                    <th>{t('admin.wallets.owner')}</th>
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
                                        <td colSpan="10" className="text-center py-10 text-muted">
                                            {t('admin.wallets.noTransactionsFound')}
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const signed = tx.signedDisplay();
                                        const owner = tx.owner || {};
                                        const walletMeta = tx.wallet;
                                        const counterparty = tx.counterparty;

                                        return (
                                            <tr key={tx.id}>
                                                <td>{tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}</td>
                                                <td>
                                                    {walletMeta?.id ? (
                                                        <Link to={`/admin/wallets/${walletMeta.id}`} className="fw-bold">
                                                            {walletMeta.wallet_id}
                                                        </Link>
                                                    ) : (
                                                        walletMeta?.wallet_id || '-'
                                                    )}
                                                </td>
                                                <td>
                                                    {walletMeta && (
                                                        <span className={`badge ${walletMeta.typeBadgeClass}`}>
                                                            {t(walletMeta.typeLabelKey)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="fw-bold">{owner.name || '-'}</div>
                                                    <div className="text-muted fs-7">{owner.phone || '-'}</div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-primary text-capitalize">{tx.type}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${tx.direction === 'debit' ? 'badge-light-danger' : 'badge-light-success'}`}>
                                                        {tx.direction}
                                                    </span>
                                                </td>
                                                <td className={`text-end ${signed.className}`}>{signed.text}</td>
                                                <td className="text-end">{fmtMoney(tx.balance_after)}</td>
                                                <td>
                                                    {counterparty ? (
                                                        <div>
                                                            {counterparty.wallet_uuid ? (
                                                                <Link to={`/admin/wallets/${counterparty.wallet_uuid}`} className="fw-bold">
                                                                    {counterparty.wallet_id}
                                                                </Link>
                                                            ) : (
                                                                <span className="fw-bold">{counterparty.wallet_id}</span>
                                                            )}
                                                            <div className="text-muted fs-7">{counterparty.owner_name}</div>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/admin/wallets/transactions/${tx.id}`}
                                                        className="btn btn-sm btn-light-primary"
                                                    >
                                                        {t('common.viewDetails')}
                                                    </Link>
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
                            <ul className="pagination">
                                <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() => setPagination((p) => ({ ...p, current_page: p.current_page - 1 }))}
                                    >
                                        {t('common.previous')}
                                    </button>
                                </li>
                                <li className="page-item active">
                                    <span className="page-link">{currentPage}</span>
                                </li>
                                <li className={`page-item ${currentPage >= pagination.last_page ? 'disabled' : ''}`}>
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() => setPagination((p) => ({ ...p, current_page: p.current_page + 1 }))}
                                    >
                                        {t('common.next')}
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

export default AdminWalletTransactionsIndex;
