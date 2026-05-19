import React from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../../stores/authStore';

const TransactionStatistics = ({ statistics }) => {
    const { t, i18n } = useTranslation();
    const { formatCurrency } = useAuthStore();
    const loc = i18n.language === 'ar' ? 'ar' : undefined;
    const fmtInt = (v) => (v ?? 0).toLocaleString(loc);

    return (
        <div className="row gy-5 g-xl-10 mb-5">
            {/* Sale Transactions */}
            <div className="col-xl-4 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-success">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">
                                {t('merchant.transactions.statsSaleTitle')}
                            </span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">
                                {t('merchant.transactions.statsSaleSubtitle')}
                            </span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 row">
                        <div className="mb-2 col-6">
                            <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                {fmtInt(statistics.saleTransactions)}
                            </span>
                        </div>
                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                            <span className="fs-2x fw-semibold text-success">
                                {formatCurrency(statistics.saleTransactionsAmount || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Transactions */}
            <div className="col-xl-4 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-danger">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">
                                {t('merchant.transactions.statsRefundTitle')}
                            </span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">
                                {t('merchant.transactions.statsRefundSubtitle')}
                            </span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 row">
                        <div className="mb-2 col-6">
                            <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                {fmtInt(statistics.refundTransactions)}
                            </span>
                        </div>
                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                            <span className="fs-2x fw-semibold text-danger">
                                {formatCurrency(statistics.refundTransactionsAmount || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Void Transactions */}
            <div className="col-xl-4 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-dark">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">
                                {t('merchant.transactions.statsVoidTitle')}
                            </span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">
                                {t('merchant.transactions.statsVoidSubtitle')}
                            </span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 row">
                        <div className="mb-2 col-6">
                            <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                {fmtInt(statistics.voidTransactions)}
                            </span>
                        </div>
                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                            <span className="fs-2x fw-semibold text-dark">
                                {formatCurrency(statistics.voidTransactionsAmount || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionStatistics;
