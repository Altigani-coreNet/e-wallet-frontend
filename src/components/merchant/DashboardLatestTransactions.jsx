import React, { useState } from 'react';

const DashboardLatestTransactions = ({ transactions, limit, onLimitChange, loading }) => {
    const [showLimitMenu, setShowLimitMenu] = useState(false);
    const limitOptions = [10, 20, 50, 100];

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'approved': 'badge-success',
            'pending': 'badge-warning',
            'declined': 'badge-danger',
            'failed': 'badge-danger',
            'processed': 'badge-info',
            'refunded': 'badge-secondary',
            'captured': 'badge-primary',
            'voided': 'badge-dark',
            'cancelled': 'badge-secondary',
            'expired': 'badge-light',
            'reversed': 'badge-warning'
        };
        return statusMap[status?.toLowerCase()] || 'badge-secondary';
    };

    const handleLimitChange = (newLimit) => {
        onLimitChange(newLimit);
        setShowLimitMenu(false);
    };

    return (
        <div className="col-xl-12 mb-5 mb-xl-10">
            <div className="card card-flush h-xl-100">
                <div className="card-header pt-7">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold text-gray-800">Latest Transactions</span>
                        <span className="text-gray-500 mt-1 fw-semibold fs-6">Recent activity</span>
                    </h3>
                    <div className="card-toolbar">
                        <div style={{ minWidth: '100px' }} className="position-relative">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-light btn-active-light-primary"
                                onClick={() => setShowLimitMenu(!showLimitMenu)}
                            >
                                Show <span className="fw-bold ms-1">{limit}</span>
                                <i className="ki-duotone ki-down fs-5 ms-1"></i>
                            </button>
                            
                            {showLimitMenu && (
                                <div 
                                    className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px py-4 show"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        zIndex: 105,
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    {limitOptions.map(option => (
                                        <div key={option} className="menu-item px-3">
                                            <a 
                                                href="#" 
                                                className="menu-link px-3"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleLimitChange(option);
                                                }}
                                            >
                                                {option}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-row-dashed align-middle gs-0 gy-4 my-0">
                            <thead>
                                <tr className="fs-7 fw-bold text-gray-500 border-bottom-0">
                                    <th className="p-0 min-w-150px">Terminal</th>
                                    <th className="p-0 min-w-100px">Amount</th>
                                    <th className="p-0 min-w-100px">Status</th>
                                    <th className="p-0 min-w-150px">Date</th>
                                    <th className="p-0 w-50px">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (!transactions || transactions.length === 0) ? (
                                    // Placeholder skeleton rows
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-8 bg-secondary" style={{ height: '20px', display: 'block', marginBottom: '4px' }}></span>
                                                    <span className="placeholder col-6 bg-secondary" style={{ height: '16px', display: 'block' }}></span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-7 bg-secondary" style={{ height: '20px', display: 'block' }}></span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-5 bg-secondary" style={{ height: '24px', display: 'block', borderRadius: '4px' }}></span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-9 bg-secondary" style={{ height: '20px', display: 'block' }}></span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-6 bg-secondary" style={{ height: '32px', display: 'block', borderRadius: '4px' }}></span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : transactions && transactions.length > 0 ? (
                                    transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="d-flex justify-content-start flex-column">
                                                        <span className="text-gray-900 fw-bold text-hover-primary mb-1 fs-6">
                                                            {transaction.terminal?.serial_number || 'N/A'}
                                                        </span>
                                                        <span className="text-gray-500 fw-semibold d-block fs-7">
                                                            {transaction?.terminal_name || transaction?.terminal?.name || 'Terminal'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-gray-900 fw-bold d-block fs-6">
                                                    {formatAmount(transaction.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>
                                                    {transaction.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-gray-900 fw-bold d-block fs-6">
                                                    {formatDate(transaction.created_at)}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <a 
                                                    href={`/merchant/transactions/${transaction.id}`}
                                                    className="btn btn-sm btn-icon btn-bg-light btn-active-color-primary"
                                                    title="View Details"
                                                >
                                                    <i className="ki-duotone ki-arrow-right fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <div className="text-gray-600 fs-6">No transactions found</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLatestTransactions;

