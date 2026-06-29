import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useParams, Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { toast } from 'react-toastify';

import Swal from 'sweetalert2';

import { useToolbar } from '../../../contexts/ToolbarContext';

import { useCan } from '../../../utils/permissions';

import { fmtMoney } from '../../../utils/walletMoney';

import {

    useAdminWallet,

    useWalletTransactions,

    useWalletMutations,

    suspendWallet,

    activateWallet,

    deleteWallet,

} from '../../../services/adminWalletsService';

import LoadingSpinner from '../../common/LoadingSpinner';

import ErrorAlert from '../../common/ErrorAlert';



const AdminWalletShow = () => {

    const { id } = useParams();

    const { t } = useTranslation();

    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const canEdit = useCan(['sales.customers.edit_customers', 'edit_customers']);

    const canDelete = useCan(['sales.customers.delete_customers', 'delete_customers']);

    const canCashIn = useCan(['accounting.wallets.cash_in_wallets', 'cash_in_wallets']);

    const canCashOut = useCan(['accounting.wallets.cash_out_wallets', 'cash_out_wallets']);



    const { cashInMutation, cashOutMutation } = useWalletMutations();



    const [txPagination, setTxPagination] = useState({

        current_page: 1,

        per_page: 15,

        total: 0,

        last_page: 1,

    });



    const txParams = useMemo(

        () => ({

            page: txPagination.current_page,

            per_page: txPagination.per_page,

        }),

        [txPagination.current_page, txPagination.per_page]

    );



    const { data: wallet, isLoading, error, refetch: refetchWallet } = useAdminWallet(id);

    const {

        data: txResponse,

        isLoading: txLoading,

        isFetching: txFetching,

        refetch: refetchTx,

    } = useWalletTransactions(id, txParams);



    useEffect(() => {

        if (txResponse?.current_page !== undefined) {

            setTxPagination({

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



    const handleSuspend = async () => {

        const result = await Swal.fire({

            title: t('admin.wallets.suspend'),

            text: t('admin.wallets.confirmSuspend'),

            icon: 'warning',

            showCancelButton: true,

            confirmButtonColor: '#f1416c',

            cancelButtonColor: '#6c757d',

            confirmButtonText: t('common.yesActionIt', { action: t('admin.wallets.suspend') }),

            cancelButtonText: t('common.cancel'),

        });

        if (!result.isConfirmed) return;

        try {

            await suspendWallet(id);

            toast.success(t('admin.wallets.suspendSuccess'));

            refetchWallet();

        } catch (err) {

            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));

        }

    };



    const handleActivate = async () => {

        const result = await Swal.fire({

            title: t('admin.wallets.activate'),

            text: t('admin.wallets.confirmActivate'),

            icon: 'question',

            showCancelButton: true,

            confirmButtonColor: '#3085d6',

            cancelButtonColor: '#6c757d',

            confirmButtonText: t('common.yesActionIt', { action: t('admin.wallets.activate') }),

            cancelButtonText: t('common.cancel'),

        });

        if (!result.isConfirmed) return;

        try {

            await activateWallet(id);

            toast.success(t('admin.wallets.activateSuccess'));

            refetchWallet();

        } catch (err) {

            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));

        }

    };



    const handleDelete = async () => {

        const result = await Swal.fire({

            title: t('common.areYouSure'),

            text: t('admin.wallets.confirmDelete'),

            icon: 'warning',

            showCancelButton: true,

            confirmButtonColor: '#d33',

            cancelButtonColor: '#3085d6',

            confirmButtonText: t('common.yesDeleteIt'),

            cancelButtonText: t('common.cancel'),

        });

        if (!result.isConfirmed) return;

        try {

            await deleteWallet(id);

            toast.success(t('admin.wallets.deleteSuccess'));

            refetchWallet();

        } catch (err) {

            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));

        }

    };



    const promptMoneyAction = async (actionLabel) => {

        const result = await Swal.fire({

            title: actionLabel,

            html:

                '<input id="swal-amount" type="number" min="0.01" step="0.01" class="swal2-input" placeholder="Amount" />' +

                '<input id="swal-description" type="text" class="swal2-input" placeholder="Description (optional)" />',

            showCancelButton: true,

            confirmButtonText: actionLabel,

            preConfirm: () => {

                const amount = parseFloat(document.getElementById('swal-amount')?.value || '0');

                const description = document.getElementById('swal-description')?.value || '';

                if (!amount || amount <= 0) {

                    Swal.showValidationMessage('Amount must be greater than zero');

                    return false;

                }

                return { amount, description };

            },

        });

        return result.isConfirmed ? result.value : null;

    };



    const handleCashIn = async () => {

        const payload = await promptMoneyAction(t('admin.wallets.cashIn', 'Cash in'));

        if (!payload) return;

        try {

            const result = await cashInMutation.mutateAsync({

                walletId: id,

                payload,

                idempotencyKey: `cash-in-${Date.now()}`,

            });

            const balance = result?.wallet?.balance;

            toast.success(

                balance != null

                    ? `${t('admin.wallets.cashInSuccess', 'Cash-in completed')} — ${fmtMoney(balance)} ${wallet?.currency_code || 'SDG'}`

                    : t('admin.wallets.cashInSuccess', 'Cash-in completed')

            );

            refetchWallet();

            refetchTx();

        } catch (err) {

            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));

        }

    };



    const handleCashOut = async () => {

        const payload = await promptMoneyAction(t('admin.wallets.cashOut', 'Cash out'));

        if (!payload) return;

        try {

            const result = await cashOutMutation.mutateAsync({

                walletId: id,

                payload,

                idempotencyKey: `cash-out-${Date.now()}`,

            });

            const balance = result?.wallet?.balance;

            toast.success(

                balance != null

                    ? `${t('admin.wallets.cashOutSuccess', 'Cash-out completed')} — ${fmtMoney(balance)} ${wallet?.currency_code || 'SDG'}`

                    : t('admin.wallets.cashOutSuccess', 'Cash-out completed')

            );

            refetchWallet();

            refetchTx();

        } catch (err) {

            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));

        }

    };



    const handleRefresh = useCallback(() => {

        refetchWallet();

        refetchTx();

    }, [refetchWallet, refetchTx]);



    useEffect(() => {

        setTitle(wallet?.wallet_id || t('admin.wallets.walletDetails'));

        setBreadcrumbs([

            { title: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },

            { title: t('admin.wallets.title'), path: '/admin/wallets' },

            { title: wallet?.wallet_id || id, path: `/admin/wallets/${id}` },

        ]);

        setActions(

            <button className="btn btn-sm btn-light" onClick={handleRefresh}>

                <i className="ki-duotone ki-arrows-circle fs-3">

                    <span className="path1"></span>

                    <span className="path2"></span>

                </i>

                {t('common.refresh')}

            </button>

        );

        return () => {

            setTitle('');

            setBreadcrumbs([]);

            setActions(null);

        };

    }, [setTitle, setBreadcrumbs, setActions, t, wallet, id, handleRefresh]);



    if (isLoading) {

        return <LoadingSpinner />;

    }



    if (error || !wallet) {

        return <ErrorAlert message={t('admin.wallets.failedToLoadWallet')} />;

    }



    const owner = wallet.owner || {};

    const summary = wallet.summary || {};

    const isMaster = wallet.isMaster;



    return (

        <>

            <div className="card mb-5">

                <div className="card-body">

                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-4">

                        <div>

                            <h2 className="fw-bold mb-2">{wallet.wallet_id}</h2>

                            <div className="text-muted mb-3">{wallet.user_number}</div>

                            <span className={`badge ${wallet.statusBadgeClass} me-2`}>

                                {t(`admin.wallets.status${wallet.status.charAt(0).toUpperCase()}${wallet.status.slice(1)}`, wallet.status)}

                            </span>

                            <span className={`badge ${wallet.typeBadgeClass}`}>

                                {t(wallet.typeLabelKey)}

                            </span>

                            {isMaster && (

                                <div className="text-muted fs-7 mt-2">{t('admin.wallets.masterEquityHint')}</div>

                            )}

                        </div>

                        <div className="d-flex gap-2 flex-wrap">

                            {canCashIn && wallet.status === 'active' && (

                                <button type="button" className="btn btn-sm btn-success" onClick={handleCashIn}>

                                    {t('admin.wallets.cashIn', 'Cash in')}

                                </button>

                            )}

                            {canCashOut && wallet.status === 'active' && (

                                <button type="button" className="btn btn-sm btn-primary" onClick={handleCashOut}>

                                    {t('admin.wallets.cashOut', 'Cash out')}

                                </button>

                            )}

                            {canEdit && wallet.status === 'active' && !isMaster && (

                                <button type="button" className="btn btn-sm btn-warning" onClick={handleSuspend}>

                                    {t('admin.wallets.suspend')}

                                </button>

                            )}

                            {canEdit && wallet.status === 'frozen' && !isMaster && (

                                <button type="button" className="btn btn-sm btn-success" onClick={handleActivate}>

                                    {t('admin.wallets.activate')}

                                </button>

                            )}

                            {canDelete && wallet.status !== 'closed' && !isMaster && (

                                <button type="button" className="btn btn-sm btn-danger" onClick={handleDelete}>

                                    {t('common.delete')}

                                </button>

                            )}

                        </div>

                    </div>



                    <div className="row g-5 mt-2">

                        <div className="col-md-3">

                            <div className="border border-dashed rounded p-4">

                                <div className="text-muted fs-7">{t('admin.wallets.balance')}</div>

                                <div className="fs-2 fw-bold">{fmtMoney(wallet.balance)} {wallet.currency_code}</div>

                            </div>

                        </div>

                        <div className="col-md-3">

                            <div className="border border-dashed rounded p-4">

                                <div className="text-muted fs-7">{t('admin.wallets.availableBalance')}</div>

                                <div className="fs-2 fw-bold">{fmtMoney(wallet.available_balance)} {wallet.currency_code}</div>

                            </div>

                        </div>

                        <div className="col-md-3">

                            <div className="border border-dashed rounded p-4">

                                <div className="text-muted fs-7">{t('admin.wallets.totalCredits')}</div>

                                <div className="fs-2 fw-bold text-success">+{fmtMoney(summary.total_credits)}</div>

                            </div>

                        </div>

                        <div className="col-md-3">

                            <div className="border border-dashed rounded p-4">

                                <div className="text-muted fs-7">{t('admin.wallets.totalDebits')}</div>

                                <div className="fs-2 fw-bold text-danger">-{fmtMoney(summary.total_debits)}</div>

                            </div>

                        </div>

                    </div>



                    <div className="separator my-5" />



                    <div className="row g-4">

                        <div className="col-md-4">

                            <div className="text-muted fs-7">{t('admin.wallets.owner')}</div>

                            <div className="fw-bold">{wallet.ownerDisplayName}</div>

                            <div className="text-muted">{owner.description || owner.phone || owner.email || '-'}</div>

                        </div>

                        <div className="col-md-4">

                            <div className="text-muted fs-7">{t('admin.wallets.merchant')}</div>

                            <div className="fw-bold">{owner.merchant_name || '-'}</div>

                        </div>

                        <div className="col-md-4">

                            <div className="text-muted fs-7">{t('admin.wallets.transactionCount')}</div>

                            <div className="fw-bold">{summary.transaction_count ?? 0}</div>

                        </div>

                    </div>

                </div>

            </div>



            <div className="card">

                <div className="card-header">

                    <h3 className="card-title fw-bold">{t('admin.wallets.transactionsForWallet')}</h3>

                </div>

                <div className="card-body pt-0">

                    {txLoading ? (

                        <LoadingSpinner />

                    ) : (

                        <div className="table-responsive" style={{ opacity: txFetching ? 0.7 : 1 }}>

                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">

                                <thead>

                                    <tr className="fw-bold text-muted">

                                        <th>{t('common.date')}</th>

                                        <th>{t('admin.wallets.type')}</th>

                                        <th>{t('admin.wallets.direction')}</th>

                                        <th className="text-end">{t('admin.wallets.amount')}</th>

                                        <th className="text-end">{t('admin.wallets.balanceAfter')}</th>

                                        <th>{t('admin.wallets.counterparty')}</th>

                                        <th>{t('common.description')}</th>

                                        <th>{t('common.actions')}</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {transactions.length === 0 ? (

                                        <tr>

                                            <td colSpan="8" className="text-center py-10 text-muted">

                                                {t('admin.wallets.noTransactionsFound')}

                                            </td>

                                        </tr>

                                    ) : (

                                        transactions.map((tx) => {

                                            const signed = tx.signedDisplay(wallet.currency_code);

                                            const counterparty = tx.counterparty;

                                            return (

                                                <tr key={tx.id}>

                                                    <td>{tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}</td>

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

                                                    <td>{tx.description || tx.reference || '-'}</td>

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

                    )}



                    {txPagination.total > txPagination.per_page && (

                        <div className="d-flex justify-content-end pt-4">

                            <ul className="pagination">

                                <li className={`page-item ${txPagination.current_page <= 1 ? 'disabled' : ''}`}>

                                    <button

                                        type="button"

                                        className="page-link"

                                        onClick={() => setTxPagination((p) => ({ ...p, current_page: p.current_page - 1 }))}

                                    >

                                        {t('common.previous')}

                                    </button>

                                </li>

                                <li className="page-item active">

                                    <span className="page-link">{txPagination.current_page}</span>

                                </li>

                                <li className={`page-item ${txPagination.current_page >= txPagination.last_page ? 'disabled' : ''}`}>

                                    <button

                                        type="button"

                                        className="page-link"

                                        onClick={() => setTxPagination((p) => ({ ...p, current_page: p.current_page + 1 }))}

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



export default AdminWalletShow;

