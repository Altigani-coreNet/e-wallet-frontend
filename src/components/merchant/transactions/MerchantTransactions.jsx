import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TransactionFilters from './TransactionFilters';
import TransactionStatistics from './TransactionStatistics';
import TransactionActions from './TransactionActions';
import { 
    fetchTransactions, 
    fetchStatistics,
    exportTransactions
} from '../../../services/transactionsService';
import useAuthStore from '../../../stores/authStore';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import { canExport } from '../../../utils/permissions';

const MerchantTransactions = ({ merchantId: propMerchantId, initialType = null }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, merchant } = useAuthStore();
    const can = useAuthStore(state => state.can);
    const { setTitle, setActions } = useToolbar();
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    const [perPage, setPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Get type from URL query parameter
    const urlType = searchParams.get('type') || initialType || '';
    
    // Sort states
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        payment_type: '',
        terminal_id: '',
        start_date: '',
        end_date: '',
        type: urlType
    });
    
    // Update filters when URL type changes
    useEffect(() => {
        const newType = searchParams.get('type') || initialType || '';
        setFilters(prev => ({ ...prev, type: newType }));
    }, [searchParams, initialType]);
    
    const [showFilters, setShowFilters] = useState(false);
    
    // Data states
    const [transactionsData, setTransactionsData] = useState(null);
    const [statisticsData, setStatisticsData] = useState(null);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [statisticsLoading, setStatisticsLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [error, setError] = useState(null);

    // Extracted data
    const transactions = transactionsData?.data || [];
    const totalRows = transactionsData?.total || 0;
    const lastPage = transactionsData?.last_page || 1;
    const statistics = statisticsData;

    // Fetch transactions when dependencies change
    useEffect(() => {
        console.log('useEffect triggered - merchantId:', merchantId, 'page:', currentPage, 'perPage:', perPage, 'filters:', filters, 'sortBy:', sortBy, 'sortOrder:', sortOrder);

        const loadTransactions = async () => {
            console.log('Loading transactions - Making API call...');
            setTransactionsLoading(true);
            setError(null);
            try {
                const data = await fetchTransactions({ merchantId, page: currentPage, perPage, filters, sortBy, sortOrder });
                console.log('Transactions loaded successfully:', data);
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
    }, [merchantId, currentPage, perPage, filters.search, filters.status, filters.payment_type, filters.terminal_id, filters.start_date, filters.end_date, filters.type, sortBy, sortOrder]);

    // Fetch statistics when dependencies change (only if no type filter)
    useEffect(() => {
        if (filters.type) {
            setStatisticsData(null);
            return;
        }

        const loadStatistics = async () => {
            setStatisticsLoading(true);
            try {
                const data = await fetchStatistics({ merchantId, type: filters.type });
                setStatisticsData(data);
            } catch (err) {
                console.error('Error fetching statistics:', err);
                // Don't show toast for statistics errors (non-critical)
            } finally {
                setStatisticsLoading(false);
            }
        };

        loadStatistics();
    }, [merchantId, filters.type]);

    // Handle refresh - fetch fresh data from server
    const handleRefresh = useCallback(async () => {
        try {
            // Refetch transactions
            setTransactionsLoading(true);
            const transactionsData = await fetchTransactions({ merchantId, page: currentPage, perPage, filters, sortBy, sortOrder });
            setTransactionsData(transactionsData);
            setTransactionsLoading(false);

            // Refetch statistics (if not filtered by type)
            if (!filters.type) {
                setStatisticsLoading(true);
                const statisticsData = await fetchStatistics({ merchantId, type: filters.type });
                setStatisticsData(statisticsData);
                setStatisticsLoading(false);
            }

            toast.success('Data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Failed to refresh data');
            setTransactionsLoading(false);
            setStatisticsLoading(false);
        }
    }, [merchantId, currentPage, perPage, filters, sortBy, sortOrder]);

    // Handle export
    const handleExport = useCallback(async () => {
        const result = await Swal.fire({
            title: 'Export Transactions',
            text: 'Export transactions with current filters applied?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Export',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
            return;
        }

        setExportLoading(true);
        try {
            const blob = await exportTransactions({ merchantId, filters });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Export completed successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export transactions');
        } finally {
            setExportLoading(false);
        }
    }, [merchantId, filters]);

    // Set toolbar title and actions
    useEffect(() => {
        setTitle('Transactions');
        
        setActions(
            <>
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Filter
                </button>

                <button
                    className="btn btn-sm btn-flex btn-light fw-bold"
                    onClick={handleRefresh}
                    disabled={transactionsLoading || statisticsLoading}
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Refresh
                </button>

                {canExport('transactions') && (
                    <button
                        className="btn btn-sm fw-bold btn-success"
                        onClick={handleExport}
                        disabled={transactionsLoading || exportLoading}
                    >
                        <i className="ki-duotone ki-file-down fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Export
                    </button>
                )}
            </>
        );

        return () => {
            setActions(null);
        };
    }, [showFilters, transactionsLoading, statisticsLoading, exportLoading, handleRefresh, handleExport, setTitle, setActions]);

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

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page on filter change
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

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            payment_type: '',
            terminal_id: '',
            start_date: '',
            end_date: '',
            type: initialType || ''
        });
        setCurrentPage(1);
    };

    // Handle view transaction
    const handleView = (transaction) => {
        navigate(`/merchant/transactions/${transaction.id}`);
    };

    /** Aligned with admin transactions index badge styles */
    const getStatusBadgeClass = (status) => {
        const statusMap = {
            APPROVED: 'badge-light-success',
            DECLINED: 'badge-light-danger',
            PENDING: 'badge-light-warning',
            FAILED: 'badge-light-danger',
            VOIDED: 'badge-light-secondary',
            REFUNDED: 'badge-light-info',
            PROCESSED: 'badge-light-success',
            CAPTURED: 'badge-light-info',
            CANCELLED: 'badge-light-secondary',
            EXPIRED: 'badge-light-dark',
            REVERSED: 'badge-light-dark',
        };
        return statusMap[status?.toUpperCase?.()] || 'badge-light-secondary';
    };

    const formatTableAmount = (value) => {
        const numeric = Number(value ?? 0);
        return Number.isNaN(numeric)
            ? '0.00'
            : numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            {/* Toolbar - Top */}
            <div className="d-flex flex-wrap flex-stack mb-6">
                <h3 className="fw-bolder my-2">
                    Transactions
                    <span className="fs-6 text-gray-400 fw-bold ms-1">({totalRows} total)</span>
                </h3>
            </div>

            {/* Filters */}
            {showFilters && (
                <TransactionFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                />
            )}

            {/* Type Alert */}
            {filters.type && (
                <div className="row g-5 g-xl-8 mb-5">
                    <div className="col-md-12">
                        <div className="alert alert-info d-flex align-items-center p-5">
                            <i className="ki-duotone ki-information fs-2hx text-info me-4">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h4 className="mb-1 text-capitalize">{filters.type} Transactions</h4>
                                <span>Showing transactions with type: {filters.type}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics - After Toolbar (separate loader) */}
            {!filters.type && (
                statisticsLoading ? (
                    // Skeleton Loading for Statistics
                    <div className="row gy-5 g-xl-10 mb-5">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="col-xl-4 mb-xl-10">
                                <div className="card card-flush h-xl-100">
                                    <div className="card-header pt-5">
                                        <h3 className="card-title align-items-start flex-column">
                                            <div className="skeleton" style={{width: '180px', height: '20px', marginBottom: '8px'}}></div>
                                            <div className="skeleton" style={{width: '140px', height: '14px'}}></div>
                                        </h3>
                                    </div>
                                    <div className="card-body pt-2 row">
                                        <div className="mb-2 col-6">
                                            <div className="skeleton" style={{width: '100px', height: '48px'}}></div>
                                        </div>
                                        <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                                            <div className="skeleton" style={{width: '120px', height: '36px'}}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : statistics ? (
                    <TransactionStatistics statistics={statistics} />
                ) : null
            )}

            {/* Table */}
            <div className="card">
                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-7 gy-5" id="transactions-table">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="text-dark">Country</th>
                                    <th className="text-dark">Partner</th>
                                    <th className="text-dark">Merchant</th>
                                    <th className="text-dark">Service Category</th>
                                    <th className="text-dark">Payment Method</th>
                                    <th
                                        className="text-dark cursor-pointer"
                                        onClick={() => handleSort('transaction_id')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Transaction ID {getSortIcon('transaction_id')}
                                    </th>
                                    <th
                                        className="text-dark cursor-pointer"
                                        onClick={() => handleSort('created_at')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Date and Time {getSortIcon('created_at')}
                                    </th>
                                    <th
                                        className="text-dark cursor-pointer"
                                        onClick={() => handleSort('amount')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Amount {getSortIcon('amount')}
                                    </th>
                                    <th
                                        className="text-dark cursor-pointer"
                                        onClick={() => handleSort('status')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Status {getSortIcon('status')}
                                    </th>
                                    <th className="text-end text-dark">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionsLoading ? (
                                    // Skeleton Loading Rows (separate loader for table)
                                    [...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => (
                                                <td key={c}>
                                                    <div className="skeleton skeleton-text" style={{ width: c === 9 ? '80px' : '100px', height: '16px' }}></div>
                                                </td>
                                            ))}
                                            <td className="text-end">
                                                <div className="skeleton skeleton-button" style={{width: '120px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-5">
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
                                            <td>{transaction.country_name || transaction.country?.name || 'N/A'}</td>
                                            <td>{transaction.partner?.name || transaction.partner?.business_name || transaction.partner_name || 'N/A'}</td>
                                            <td>{transaction.merchant_name || transaction.merchant?.business_name || transaction.merchant?.name || 'N/A'}</td>
                                            <td>{transaction.service_category?.name_en || transaction.service_category_name || 'N/A'}</td>
                                            <td>
                                                {transaction.method ||
                                                    transaction.payment_method?.card_type ||
                                                    transaction.paymentMethod?.card_type ||
                                                    transaction.payment_type ||
                                                    'N/A'}
                                            </td>
                                            <td>{transaction.transaction_id || transaction.id || 'N/A'}</td>
                                            <td>
                                                {transaction.created_at
                                                    ? new Date(transaction.created_at).toLocaleString()
                                                    : 'N/A'}
                                            </td>
                                            <td>
                                                {transaction.currency_symbol || '$'}
                                                {formatTableAmount(transaction.amount)}
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>
                                                    {transaction.status || 'N/A'}
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

export default MerchantTransactions;

