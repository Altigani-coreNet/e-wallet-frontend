import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionActions from '../../merchant/transactions/TransactionActions';
import { fetchTransactions } from '../../../services/transactionsService';
import useAuthStore from '../../../stores/authStore';
import { toast } from 'react-toastify';

const UserTransactionsTab = ({ userId, merchantId: propMerchantId }) => {
    const navigate = useNavigate();
    const { user, merchant } = useAuthStore();
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    const [perPage, setPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Sort states
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Data states
    const [transactionsData, setTransactionsData] = useState(null);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Extracted data
    const transactions = transactionsData?.data || [];
    const totalRows = transactionsData?.total || 0;
    const lastPage = transactionsData?.last_page || 1;

    // Fetch transactions when dependencies change
    useEffect(() => {
        if (!userId || !merchantId) return;

        const loadTransactions = async () => {
            setTransactionsLoading(true);
            setError(null);
            try {
                const data = await fetchTransactions({ 
                    merchantId, 
                    userId,
                    page: currentPage, 
                    perPage, 
                    filters: {}, 
                    sortBy, 
                    sortOrder 
                });
                setTransactionsData(data);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError(err.message);
                toast.error('Failed to load transactions');
            } finally {
                setTransactionsLoading(false);
            }
        };

        loadTransactions();
    }, [userId, merchantId, currentPage, perPage, sortBy, sortOrder]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage) {
            setCurrentPage(page);
        }
    };

    // Handle rows per page change
    const handlePerRowsChange = (e) => {
        setPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (column) => {
        if (sortBy === column) {
            // Toggle sort order if same column
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to ascending
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    // Get sort icon for column
    const getSortIcon = (column) => {
        if (sortBy !== column) {
            return (
                <i className="ki-duotone ki-arrows-up-down fs-7 text-muted ms-1">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            );
        }
        return sortOrder === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-7 text-primary ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-7 text-primary ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    };

    // Handle view transaction
    const handleView = (transaction) => {
        navigate(`/merchant/transactions/${transaction.id}`);
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const statusColors = {
            'APPROVED': 'success',
            'DECLINED': 'danger',
            'PENDING': 'warning',
            'CAPTURED': 'info',
            'VOIDED': 'dark',
            'REFUNDED': 'secondary'
        };
        return statusColors[status] || 'secondary';
    };

    // Generate pagination numbers
    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (lastPage <= maxVisible) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(lastPage);
            } else if (currentPage >= lastPage - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = lastPage - 3; i <= lastPage; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(lastPage);
            }
        }
        
        return pages;
    };

    if (!userId || !merchantId) {
        return (
            <div className="alert alert-warning d-flex align-items-center p-5 mb-0">
                <i className="ki-duotone ki-information fs-2x text-warning me-4">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                </i>
                <div className="d-flex flex-column">
                    <h4 className="mb-1 text-warning">User or Merchant Information Missing</h4>
                    <span>Unable to load transactions. Please ensure user and merchant information is available.</span>
                </div>
            </div>
        );
    }

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
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                
                .skeleton-text {
                    display: inline-block;
                }
                
                .skeleton-badge {
                    display: inline-block;
                }
                
                .skeleton-button {
                    display: inline-block;
                }
            `}</style>
            
            {/* Table */}
            <div className="card">
                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-7 gy-5" id="transactions-table">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('transaction_id')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Transaction ID {getSortIcon('transaction_id')}
                                    </th>
                                    <th className="text-dark">Card Number</th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('amount')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Amount {getSortIcon('amount')}
                                    </th>
                                    <th className="text-dark">Batch No</th>
                                    <th className="text-dark">SDK</th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('created_at')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Created Time {getSortIcon('created_at')}
                                    </th>
                                    <th className="text-dark">Payment Channel</th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('status')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Status {getSortIcon('status')}
                                    </th>
                                    <th className="text-end text-dark">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionsLoading ? (
                                    // Skeleton Loading Rows (separate loader for table)
                                    [...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '120px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '150px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '80px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '60px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '60px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '140px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-text" style={{width: '80px', height: '16px'}}></div>
                                            </td>
                                            <td>
                                                <div className="skeleton skeleton-badge" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div>
                                            </td>
                                            <td className="text-end">
                                                <div className="skeleton skeleton-button" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <div className="text-gray-500">
                                                <i className="ki-duotone ki-file fs-3x mb-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <p className="fw-bold">No transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.transaction_id || 'N/A'}</td>
                                            <td>
                                                {transaction.card_number 
                                                    ? `**** **** **** ${transaction.card_number.slice(-4)}` 
                                                    : 'N/A'}
                                            </td>
                                            <td>
                                                {transaction.currency_symbol || '$'} {parseFloat(transaction.amount).toFixed(2)}
                                            </td>
                                            <td>{transaction.batch_no || 'N/A'}</td>
                                            <td>{transaction.sdk_id || 'N/A'}</td>
                                            <td>{new Date(transaction.created_at).toLocaleString()}</td>
                                            <td>
                                                <span className="badge badge-light-primary">
                                                    {transaction.payment_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-light-${getStatusColor(transaction.status)}`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <TransactionActions
                                                    transaction={transaction}
                                                    onView={handleView}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!transactionsLoading && transactions.length > 0 && (
                        <div className="row mt-5">
                            <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                <div className="dataTables_length">
                                    <label className="d-flex align-items-center">
                                        <span className="me-2">Show</span>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={perPage}
                                            onChange={handlePerRowsChange}
                                            style={{ width: '75px' }}
                                        >
                                            <option value="10">10</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                        <span className="ms-2">entries</span>
                                    </label>
                                </div>
                                <div className="ms-5">
                                    <span className="text-muted">
                                        Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalRows)} of {totalRows} entries
                                    </span>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                <div className="dataTables_paginate">
                                    <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {getPaginationNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            ) : (
                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            )
                                        ))}
                                        <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === lastPage}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserTransactionsTab;
