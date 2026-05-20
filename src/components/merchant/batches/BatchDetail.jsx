import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { useMerchantBatchDetail } from '../../../hooks/useMerchantBatchDetail';

const BatchDetail = () => {
    const { t } = useTranslation();
    const { formatRecordCurrency } = useAuthStore();
    const {
        batch,
        loading,
        navigate,
        batchStatusLabel,
        getBatchStatusColor,
        getTransactionStatusColor,
        txStatusLabel,
        formatDate,
        formatTerminal,
    } = useMerchantBatchDetail();

    // Skeleton placeholder for loading
    if (loading) {
        return (
            <>
                <style>{`
                    .skeleton {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeleton-loading 1.5s ease-in-out infinite;
                        border-radius: 4px;
                    }
                    
                    @keyframes skeleton-loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>

                {/* Breadcrumbs Skeleton */}
                <div className="d-flex flex-wrap flex-stack mb-6">
                    <div className="skeleton" style={{width: '300px', height: '20px'}}></div>
                    <div className="skeleton" style={{width: '150px', height: '38px'}}></div>
                </div>

                {/* Batch Info Card Skeleton */}
                <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header pt-5">
                                <div className="skeleton" style={{width: '200px', height: '48px'}}></div>
                            </div>
                            <div className="card-body pt-2 pb-4">
                                <div className="d-flex flex-column flex-grow-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="d-flex align-items-center mb-3">
                                            <div className="skeleton" style={{width: '120px', height: '18px', marginRight: '10px'}}></div>
                                            <div className="skeleton" style={{width: '200px', height: '18px'}}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Table Skeleton */}
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="skeleton" style={{width: '150px', height: '24px'}}></div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                        <th><div className="skeleton" style={{width: '100px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '80px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '70px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '80px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '100px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '70px', height: '14px'}}></div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '140px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '40px', height: '32px', borderRadius: '6px'}}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!batch) {
        return (
            <div className="card">
                <div className="card-body text-center py-20">
                    <i className="ki-duotone ki-information-5 fs-3x text-muted mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <h3 className="text-gray-800 mb-2">{t('merchant.batches.detailNotFound')}</h3>
                    <p className="text-gray-600 mb-5">{t('merchant.batches.detailNotFoundDesc')}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/batches')}>
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.batches.backToBatches')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Breadcrumbs */}
            <div className="d-flex flex-wrap flex-stack mb-6">
                <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                    <li className="breadcrumb-item text-muted">
                        <Link to="/merchant/dashboard" className="text-muted text-hover-primary">{t('merchant.common.home')}</Link>
                    </li>
                    <li className="breadcrumb-item">
                        <span className="bullet bg-gray-500 w-5px h-2px"></span>
                    </li>
                    <li className="breadcrumb-item text-muted">
                        <Link to="/merchant/batches" className="text-muted text-hover-primary">{t('merchant.breadcrumbs.batches')}</Link>
                    </li>
                    <li className="breadcrumb-item">
                        <span className="bullet bg-gray-500 w-5px h-2px"></span>
                    </li>
                    <li className="breadcrumb-item text-muted">{t('merchant.batches.batchDetails')}</li>
                </ul>
            </div>

            <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                <div className="col-md-12">
                    {/* Batch Info Card */}
                    <div className="card">
                        <div className="card-header pt-5">
                            <div className="card-title d-flex flex-column">
                                <div className="d-flex align-items-center">
                                    <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">{batch.batch_number || t('merchant.common.na')}</span>
                                </div>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">{t('merchant.batches.batchInformation')}</span>
                            </div>
                        </div>
                        <div className="card-body pt-2 pb-4 d-flex align-items-center">
                            <div className="d-flex flex-column flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t('merchant.batches.merchant')}:</span>
                                    <span className="text-dark fw-bold fs-6">{batch.merchant?.name || t('merchant.common.na')}</span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t('merchant.batches.colStatus')}:</span>
                                    <span className={`badge badge-light-${getBatchStatusColor(batch.status)} fs-7`}>
                                        {batchStatusLabel(batch.status)}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t('merchant.batches.totalAmount')}:</span>
                                    <span className="text-dark fw-bold fs-6">
                                        {formatRecordCurrency(
                                            batch.total_amount,
                                            batch.toRecord ? batch.toRecord() : batch
                                        )}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t('merchant.batches.transactionCount')}:</span>
                                    <span className="text-dark fw-bold fs-6">{batch.transaction_count || 0}</span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t('merchant.batches.createdAt')}:</span>
                                    <span className="text-dark fw-bold fs-6">
                                        {formatDate(batch.created_at)}
                                    </span>
                                </div>
                                {batch.settled_at && (
                                    <div className="d-flex align-items-center">
                                        <span className="text-gray-600 fw-semibold fs-6 me-2">{t('merchant.batches.settledAt')}:</span>
                                        <span className="text-dark fw-bold fs-6">
                                            {formatDate(batch.settled_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Card */}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <h3 className="card-title">{t('merchant.batches.transactions')}</h3>
                    </div>
                </div>
                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="text-dark">{t('merchant.batches.transactionId')}</th>
                                    <th className="text-dark">{t('merchant.batches.amount')}</th>
                                    <th className="text-dark">{t('merchant.batches.colStatus')}</th>
                                    <th className="text-dark">{t('merchant.batches.terminal')}</th>
                                    <th className="text-dark">{t('merchant.batches.createdAt')}</th>
                                    <th className="text-dark">{t('merchant.batches.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody className="fw-semibold text-gray-600">
                                {batch.transactions && batch.transactions.length > 0 ? (
                                    batch.transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="text-dark fw-bold">{transaction.transaction_id || t('merchant.common.na')}</td>
                                            <td className="text-dark fw-bold">
                                                {formatRecordCurrency(
                                                    transaction.amount,
                                                    transaction.toRecord
                                                        ? transaction.toRecord()
                                                        : transaction
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-light-${getTransactionStatusColor(transaction.status)} fs-7`}>
                                                    {txStatusLabel(transaction.status)}
                                                </span>
                                            </td>
                                            <td className="text-dark fw-bold">{formatTerminal(transaction)}</td>
                                            <td className="text-dark fw-bold">
                                                {formatDate(transaction.created_at)}
                                            </td>
                                            <td>
                                                <Link 
                                                    to={`/merchant/transactions/${transaction.id}`}
                                                    className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                                                    title={t('merchant.common.viewTransaction')}
                                                >
                                                    <i className="ki-duotone ki-eye fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted fs-6 py-8">
                                            <i className="ki-duotone ki-document fs-2hx text-muted mb-3">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            <div>{t('merchant.batches.noTransactions')}</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BatchDetail;

