import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../../utils/walletMoney';
import LoadingSpinner from '../../common/LoadingSpinner';

const CustomerLatestTransactions = ({
    customerId,
    transactions = [],
    isLoading,
    currencyCode = 'SDG',
    onViewAll,
}) => {
    const { t } = useTranslation();

    return (
        <div className="card pt-4 mb-6 mb-xl-9" data-testid="customer-latest-transactions">
            <div className="card-header border-0">
                <div className="card-title">
                    <h2>{t('customers.latestTransactions')}</h2>
                </div>
                {transactions.length > 0 && (
                    <div className="card-toolbar">
                        <button type="button" className="btn btn-sm btn-light-primary" onClick={onViewAll}>
                            {t('customers.viewAllTransactions')}
                        </button>
                    </div>
                )}
            </div>
            <div className="card-body pt-0 pb-5">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed gy-5">
                            <thead className="border-bottom border-gray-200 fs-7 fw-bold">
                                <tr className="text-start text-muted text-uppercase gs-0">
                                    <th className="min-w-100px">{t('common.date')}</th>
                                    <th>{t('admin.wallets.type')}</th>
                                    <th>{t('admin.wallets.direction')}</th>
                                    <th>{t('customers.transactionAmount')}</th>
                                    <th>{t('admin.wallets.balanceAfter')}</th>
                                    <th>{t('admin.wallets.counterparty')}</th>
                                    <th className="min-w-80px">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="fs-6 fw-semibold text-gray-600">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-10">
                                            {t('customers.noTransactionHistory')}
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const signed = tx.signedDisplay(currencyCode);
                                        const counterparty = tx.counterparty;

                                        return (
                                            <tr key={tx.id}>
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
                                                <td className={signed.className}>{signed.text}</td>
                                                <td>{fmtMoney(tx.balance_after)}</td>
                                                <td>
                                                    {counterparty ? (
                                                        <div>
                                                            <span className="fw-bold">{counterparty.wallet_id}</span>
                                                            <div className="text-muted fs-7">
                                                                {counterparty.owner_name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/admin/customers/${customerId}/transactions/${tx.id}`}
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
                )}
            </div>
        </div>
    );
};

export default CustomerLatestTransactions;
