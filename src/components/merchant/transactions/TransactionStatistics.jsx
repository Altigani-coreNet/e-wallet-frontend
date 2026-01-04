import React from 'react';

const TransactionStatistics = ({ statistics }) => {
    return (
        <div className="row gy-5 g-xl-10 mb-5">
            {/* Sale Transactions */}
            <div className="col-xl-4 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-success">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Sale Transactions</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Approved, Pending, Capture</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 row">
                        <div className="mb-2 col-6">
                            <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                {statistics.saleTransactions?.toLocaleString() || 0}
                            </span>
                        </div>
                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                            <span className="fs-2x fw-semibold text-success">
                                ${statistics.saleTransactionsAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
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
                            <span className="card-label fw-bold text-gray-800">Refund Transactions</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Refunded transactions</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 row">
                        <div className="mb-2 col-6">
                            <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                {statistics.refundTransactions?.toLocaleString() || 0}
                            </span>
                        </div>
                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                            <span className="fs-2x fw-semibold text-danger">
                                ${statistics.refundTransactionsAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
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
                            <span className="card-label fw-bold text-gray-800">Void Transactions</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Voided transactions</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2 row">
                        <div className="mb-2 col-6">
                            <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                {statistics.voidTransactions?.toLocaleString() || 0}
                            </span>
                        </div>
                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                            <span className="fs-2x fw-semibold text-dark">
                                ${statistics.voidTransactionsAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionStatistics;

