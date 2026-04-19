import React, { useEffect } from 'react';

const AdminLatestTransactions = ({ transactions, limit, onLimitChange, loading }) => {
    const sales = transactions?.sales || [];
    const refunds = transactions?.refunds || [];
    const voids = transactions?.voids || [];

    useEffect(() => {
        console.log('AdminLatestTransactions - Data:', {
            transactions,
            salesCount: sales.length,
            refundsCount: refunds.length,
            voidsCount: voids.length,
        });
    }, [transactions, sales, refunds, voids]);

    const buildRows = (transactionList, statusColor) =>
        transactionList.map((transaction) => {
            const terminalId =
                transaction?.terminal?.terminal_id ??
                transaction?.terminal_id ??
                transaction?.terminal?.id ??
                transaction?.terminal_uuid ??
                'N/A';

            const merchantName = transaction?.merchant_name || transaction?.merchant?.business_name || 'Unknown Merchant';
            const partnerName = transaction?.partner_name || null;
            const countryName = transaction?.country_name || null;
            const terminalName = transaction?.terminal_name || transaction?.terminal?.name || null;

            return (
                <tr key={`${statusColor}-${transaction.id}`}>
                <td>
                    <div className="d-flex align-items-center">
                        <div className="symbol symbol-40px me-3">
                            <div className={`symbol-label bg-light-${statusColor} text-${statusColor} fs-6 fw-bold`}>
                                {merchantName.charAt(0)?.toUpperCase() || 'M'}
                            </div>
                        </div>
                        <div className="d-flex justify-content-start flex-column">
                            <span className="text-gray-900 fw-bold text-hover-primary mb-1 fs-6">
                                    {terminalId}
                            </span>
                            <span className="text-muted fw-semibold d-block fs-7">
                                    {merchantName}
                            </span>
                                {terminalName && (
                                    <span className="text-muted fw-semibold d-block fs-7">
                                        {terminalName}
                                    </span>
                                )}
                                {partnerName && (
                                    <span className="text-muted fw-semibold d-block fs-7">
                                        Partner: {partnerName}
                                    </span>
                                )}
                                {countryName && (
                                    <span className="text-muted fw-semibold d-block fs-7">
                                        Country: {countryName}
                                    </span>
                                )}
                                {transaction.terminal?.branch_name && (
                                    <span className="text-muted fw-semibold d-block fs-7">
                                        {transaction.terminal.branch_name}
                                    </span>
                                )}
                        </div>
                    </div>
                </td>
                <td>
                    <span className="text-gray-800 fw-bold d-block mb-1 fs-6">
                        ${parseFloat(transaction.amount || 0).toFixed(2)}
                    </span>
                </td>
                <td>
                    <span className={`badge badge-light-${statusColor} fs-7 fw-bold`}>
                        {transaction.status || 'Unknown'}
                    </span>
                </td>
                <td className="text-end">
                    <a
                        href={`/admin/transactions/${transaction.id}`}
                        className="btn btn-sm btn-icon btn-bg-light btn-active-color-primary w-30px h-30px"
                        title="View Details"
                    >
                        <i className="ki-duotone ki-eye fs-2 text-gray-500"></i>
                    </a>
                </td>
            </tr>
            );
        });

    const tableRows = [
        ...buildRows(sales, 'success'),
        ...buildRows(refunds, 'danger'),
        ...buildRows(voids, 'dark'),
    ];

    const hasTransactions = tableRows.length > 0;

    return (
        <div className="card card-flush h-xl-100">
            <div className="card-header pt-7">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-800">Latest Transactions</span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Recent activity</span>
                </h3>
                <div className="card-toolbar">
                    <select
                        className="form-select form-select-sm w-auto"
                        value={limit}
                        onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
                    >
                        <option value="5">5 Items</option>
                        <option value="10">10 Items</option>
                        <option value="25">25 Items</option>
                        <option value="50">50 Items</option>
                    </select>
                </div>
            </div>
            <div className="card-body">
                {loading ? (
                    <div className="table-responsive">
                        <table className="table table-row-dashed align-middle gs-0 gy-4 my-0">
                            <thead>
                                <tr className="fs-7 fw-bold text-gray-500 border-bottom-0">
                                    <th className="p-0 min-w-150px">Merchant/Terminal</th>
                                    <th className="p-0 min-w-100px">Amount</th>
                                    <th className="p-0 min-w-100px">Status</th>
                                    <th className="p-0 w-50px">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(limit || 5)].map((_, index) => (
                                    <tr key={`skeleton-${index}`}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="symbol symbol-40px me-3">
                                                    <div className="symbol-label bg-light-secondary placeholder-wave"></div>
                                                </div>
                                                <div className="d-flex justify-content-start flex-column w-100">
                                                    <span className="placeholder placeholder-lg w-75 bg-secondary mb-1"></span>
                                                    <span className="placeholder placeholder-sm w-50 bg-secondary mb-1"></span>
                                                    <span className="placeholder placeholder-sm w-60 bg-secondary"></span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="placeholder placeholder-lg w-50 bg-secondary"></span>
                                        </td>
                                        <td>
                                            <span className="placeholder placeholder-sm w-75 bg-secondary"></span>
                                        </td>
                                        <td className="text-end">
                                            <span className="placeholder placeholder-sm w-30px bg-secondary"></span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-row-dashed align-middle gs-0 gy-4 my-0">
                            <thead>
                                <tr className="fs-7 fw-bold text-gray-500 border-bottom-0">
                                    <th className="p-0 min-w-150px">Merchant/Terminal</th>
                                    <th className="p-0 min-w-100px">Amount</th>
                                    <th className="p-0 min-w-100px">Status</th>
                                    <th className="p-0 w-50px">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hasTransactions ? (
                                    tableRows
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-4">
                                            <span className="fs-6">No transactions found</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLatestTransactions;



