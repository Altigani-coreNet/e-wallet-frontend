import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fmtMoney } from '../../../utils/walletMoney';
import { useWalletTransaction } from '../../../services/adminWalletsService';
import { fetchAdminCustomer } from '../../../services/adminCustomersService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const DetailRow = ({ label, children }) => (
    <div className="col-md-6 col-lg-4 mb-4">
        <div className="text-muted fs-7 mb-1">{label}</div>
        <div className="fw-bold">{children ?? '-'}</div>
    </div>
);

const WalletCell = ({ walletMeta, owner, t }) => {
    if (!walletMeta) return '-';

    return (
        <div>
            <Link to={`/admin/wallets/${walletMeta.id}`} className="fw-bold">
                {walletMeta.wallet_id}
            </Link>
            <div className="text-muted fs-7">{owner?.name || t('admin.wallets.typeMaster')}</div>
            {walletMeta.type && (
                <span className={`badge ${walletMeta.typeBadgeClass} mt-1`}>
                    {t(walletMeta.typeLabelKey)}
                </span>
            )}
        </div>
    );
};

const AdminWalletTransactionShow = () => {
    const { transactionId, customerId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [customerName, setCustomerName] = useState(null);

    const { data: detail, isLoading, error, refetch } = useWalletTransaction(transactionId);

    const tx = detail?.transaction;
    const related = detail?.related_transactions ?? [];
    const operation = detail?.operation ?? {};
    const fromCustomerContext = Boolean(customerId);

    useEffect(() => {
        if (!customerId) {
            setCustomerName(null);
            return;
        }

        let cancelled = false;

        fetchAdminCustomer(customerId)
            .then((response) => {
                if (!cancelled && (response?.success || response?.status)) {
                    setCustomerName(response.data?.name || null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCustomerName(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [customerId]);

    const handleBack = useCallback(() => {
        if (fromCustomerContext) {
            navigate(`/admin/customers/${customerId}`, { state: { activeTab: 'transactions' } });
            return;
        }

        navigate('/admin/wallets/transactions');
    }, [fromCustomerContext, customerId, navigate]);

    useEffect(() => {
        const title = tx
            ? `${t('admin.wallets.transactionDetails')} — ${tx.type}`
            : t('admin.wallets.transactionDetails');

        setTitle(title);

        if (fromCustomerContext) {
            setBreadcrumbs([
                { title: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
                { title: t('customers.customers'), path: '/admin/customers' },
                {
                    title: customerName || t('customers.customerNamed', { name: customerId }),
                    path: `/admin/customers/${customerId}`,
                },
                {
                    title: t('customers.transactions'),
                    path: `/admin/customers/${customerId}`,
                },
                {
                    title: tx?.id?.slice(0, 8) || transactionId,
                    path: `/admin/customers/${customerId}/transactions/${transactionId}`,
                },
            ]);
        } else {
            setBreadcrumbs([
                { title: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
                { title: t('admin.wallets.title'), path: '/admin/wallets' },
                { title: t('admin.wallets.allTransactions'), path: '/admin/wallets/transactions' },
                { title: tx?.id?.slice(0, 8) || transactionId, path: `/admin/wallets/transactions/${transactionId}` },
            ]);
        }

        setActions(
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-light" onClick={() => refetch()}>
                    {t('common.refresh')}
                </button>
                <button type="button" className="btn btn-sm btn-light" onClick={handleBack}>
                    {fromCustomerContext ? t('customers.backToCustomer') : t('admin.wallets.backToTransactions')}
                </button>
            </div>
        );

        return () => {
            setTitle('');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [
        setTitle,
        setBreadcrumbs,
        setActions,
        t,
        tx,
        transactionId,
        customerId,
        customerName,
        fromCustomerContext,
        refetch,
        handleBack,
    ]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !tx) {
        return <ErrorAlert message={t('admin.wallets.failedToLoadTransaction')} />;
    }

    const signed = tx.signedDisplay();
    const owner = tx.owner || {};
    const walletMeta = tx.wallet;

    return (
        <>
            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title fw-bold">{t('admin.wallets.transactionDetails')}</h3>
                </div>
                <div className="card-body">
                    <div className="row">
                        <DetailRow label={t('common.date')}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.type')}>
                            <span className="badge badge-light-primary text-capitalize">{tx.type}</span>
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.direction')}>
                            <span className={`badge ${tx.direction === 'debit' ? 'badge-light-danger' : 'badge-light-success'}`}>
                                {tx.direction}
                            </span>
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.amount')}>
                            <span className={signed.className}>{signed.text}</span>
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.balanceAfter')}>
                            {fmtMoney(tx.balance_after)}
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.walletId')}>
                            <WalletCell walletMeta={walletMeta} owner={owner} t={t} />
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.owner')}>
                            <div>{owner.name || '-'}</div>
                            <div className="text-muted fs-7">{owner.phone || owner.email || '-'}</div>
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.reference')}>
                            {tx.reference || '-'}
                        </DetailRow>
                        <DetailRow label={t('admin.wallets.referenceId')}>
                            {tx.reference_id || '-'}
                        </DetailRow>
                        <DetailRow label={t('common.description')}>
                            {tx.description || '-'}
                        </DetailRow>
                        {tx.note && (
                            <DetailRow label={t('common.notes')}>
                                {tx.note}
                            </DetailRow>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title fw-bold">{t('admin.wallets.relatedEntries')}</h3>
                    {operation.entry_count > 0 && (
                        <span className="badge badge-light-info ms-2">
                            {t('admin.wallets.entryCount', { count: operation.entry_count })}
                        </span>
                    )}
                </div>
                <div className="card-body pt-0">
                    {related.length === 0 ? (
                        <div className="text-muted py-8 text-center">
                            {t('admin.wallets.noRelatedEntries')}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>{t('admin.wallets.walletId')}</th>
                                        <th>{t('admin.wallets.owner')}</th>
                                        <th>{t('admin.wallets.type')}</th>
                                        <th>{t('admin.wallets.direction')}</th>
                                        <th className="text-end">{t('admin.wallets.amount')}</th>
                                        <th className="text-end">{t('admin.wallets.balanceAfter')}</th>
                                        <th>{t('common.description')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[tx, ...related].map((entry) => {
                                        const entrySigned = entry.signedDisplay();
                                        const entryOwner = entry.owner || {};
                                        const entryWallet = entry.wallet;
                                        const isCurrent = entry.id === tx.id;

                                        return (
                                            <tr key={entry.id} className={isCurrent ? 'bg-light-primary' : ''}>
                                                <td>
                                                    {entryWallet?.id ? (
                                                        <Link to={`/admin/wallets/${entryWallet.id}`} className="fw-bold">
                                                            {entryWallet.wallet_id}
                                                        </Link>
                                                    ) : (
                                                        entryWallet?.wallet_id || '-'
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="fw-bold">{entryOwner.name || '-'}</div>
                                                    <div className="text-muted fs-7">{entryOwner.phone || '-'}</div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-primary text-capitalize">{entry.type}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${entry.direction === 'debit' ? 'badge-light-danger' : 'badge-light-success'}`}>
                                                        {entry.direction}
                                                    </span>
                                                </td>
                                                <td className={`text-end ${entrySigned.className}`}>{entrySigned.text}</td>
                                                <td className="text-end">{fmtMoney(entry.balance_after)}</td>
                                                <td>{entry.description || '-'}</td>
                                                <td>
                                                    {isCurrent ? (
                                                        <span className="badge badge-light-primary">{t('admin.wallets.currentEntry')}</span>
                                                    ) : (
                                                        <Link
                                                            to={
                                                                fromCustomerContext
                                                                    ? `/admin/customers/${customerId}/transactions/${entry.id}`
                                                                    : `/admin/wallets/transactions/${entry.id}`
                                                            }
                                                            className="btn btn-sm btn-light-primary"
                                                        >
                                                            {t('common.viewDetails')}
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminWalletTransactionShow;
