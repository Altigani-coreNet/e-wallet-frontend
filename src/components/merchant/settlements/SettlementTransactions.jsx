import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSettlementTransactions, useSettlementTransactionsStatistics } from '../../../services/settlementsService';
import useAuthStore from '../../../stores/authStore';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { SOFTPOS_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

const SettlementTransactions = ({ merchantId: propMerchantId }) => {
    const navigate = useNavigate();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [terminals, setTerminals] = useState([]);
    const [filteredTerminals, setFilteredTerminals] = useState([]);
    const [terminalSearchTerm, setTerminalSearchTerm] = useState('');
    const [showTerminalList, setShowTerminalList] = useState(false);
    const [selectedTerminal, setSelectedTerminal] = useState(null);
    const terminalDropdownRef = useRef(null);
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    const [perPage, setPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: '',
        terminal_id: '',
        start_date: '',
        end_date: ''
    });
    
    const [showFilters, setShowFilters] = useState(false);

    // Fetch terminals
    useEffect(() => {
        fetchTerminals();
    }, []);

    // Filter terminals based on search term
    useEffect(() => {
        if (!terminalSearchTerm.trim()) {
            setFilteredTerminals(terminals);
        } else {
            const filtered = terminals.filter(terminal =>
                terminal.name?.toLowerCase().includes(terminalSearchTerm.toLowerCase()) ||
                terminal.terminal_id?.toLowerCase().includes(terminalSearchTerm.toLowerCase()) ||
                terminal.id?.toString().includes(terminalSearchTerm)
            );
            setFilteredTerminals(filtered);
        }
    }, [terminalSearchTerm, terminals]);

    // Set selected terminal when terminal_id filter changes
    useEffect(() => {
        if (filters.terminal_id) {
            const terminal = terminals.find(t => t.id === parseInt(filters.terminal_id) || t.id.toString() === filters.terminal_id);
            setSelectedTerminal(terminal || null);
        } else {
            setSelectedTerminal(null);
        }
    }, [filters.terminal_id, terminals]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (terminalDropdownRef.current && !terminalDropdownRef.current.contains(event.target)) {
                setShowTerminalList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchTerminals = async () => {
        try {
            const token = getToken();
            const response = await axios.get(SOFTPOS_ENDPOINTS.TERMINALS, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const terminalsData = response.data.data || response.data;
            setTerminals(terminalsData);
            setFilteredTerminals(terminalsData);
        } catch (error) {
            console.error('Error fetching terminals:', error);
        }
    };

    const handleTerminalSearch = (searchTerm) => {
        setTerminalSearchTerm(searchTerm);
        setShowTerminalList(true);
    };

    const handleTerminalSelect = (terminal) => {
        setSelectedTerminal(terminal);
        setTerminalSearchTerm('');
        setShowTerminalList(false);
        handleFilterChange({ terminal_id: terminal.id });
    };

    const handleRemoveTerminal = () => {
        setSelectedTerminal(null);
        setTerminalSearchTerm('');
        setShowTerminalList(false);
        handleFilterChange({ terminal_id: '' });
    };

    // Use React Query hooks
    const { 
        data: transactionsData, 
        isLoading: transactionsLoading,
        refetch: refetchTransactions
    } = useSettlementTransactions(merchantId, currentPage, perPage, filters);
    
    const { 
        data: statisticsData, 
        isLoading: statisticsLoading
    } = useSettlementTransactionsStatistics(merchantId);

    // Extracted data
    const transactions = transactionsData?.data || [];
    const totalRows = transactionsData?.total || 0;
    const lastPage = transactionsData?.last_page || 1;
    const statistics = statisticsData || {};

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        queryClient.invalidateQueries({ queryKey: ['settlement-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['settlement-transactions-statistics'] });
        await refetchTransactions();
    }, [queryClient, refetchTransactions]);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle('Settlement Transactions');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Settlements', path: '/merchant/settlements' },
            { label: 'Settlement Transactions', path: '/merchant/settlements/transactions', active: true }
        ]);
        
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

                <button
                    className="btn btn-sm btn-light btn-active-light-primary"
                    onClick={() => navigate('/merchant/settlements')}
                >
                    <i className="ki-duotone ki-arrow-left fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to Settlements
                </button>
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [showFilters, transactionsLoading, statisticsLoading, handleRefresh, navigate, setTitle, setBreadcrumbs, setActions]);

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
        setCurrentPage(1);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            type: '',
            terminal_id: '',
            start_date: '',
            end_date: ''
        });
        setCurrentPage(1);
    };

    // Handle date input click to open calendar
    const handleDateInputClick = (ref) => {
        if (ref && ref.current) {
            // Try to use the showPicker() method if available (modern browsers)
            if (ref.current.showPicker && typeof ref.current.showPicker === 'function') {
                ref.current.showPicker().catch((err) => {
                    // Fallback: if showPicker fails, just focus the input
                    ref.current.focus();
                });
            } else {
                // Fallback for browsers that don't support showPicker()
                ref.current.focus();
                // For some browsers, we need to trigger click after focus
                setTimeout(() => {
                    ref.current.click();
                }, 10);
            }
        }
    };

    // Get transaction type badge color
    const getTypeColor = (type) => {
        const typeColors = {
            'refunded': 'warning',
            'voided': 'danger',
            'sale': 'success'
        };
        return typeColors[type?.toLowerCase()] || 'secondary';
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const statusColors = {
            'approved': 'success',
            'completed': 'success',
            'pending': 'warning',
            'declined': 'danger',
            'failed': 'danger',
            'refunded': 'warning',
            'voided': 'danger'
        };
        return statusColors[status?.toLowerCase()] || 'secondary';
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
                
                .rotate-180 {
                    transform: rotate(180deg);
                    transition: transform 0.3s ease;
                }
                
                .hover-bg-light:hover {
                    background-color: #f5f8fa !important;
                }
            `}</style>

            {/* Info Alert */}
            <div className="row g-5 g-xl-8 mb-5">
                <div className="col-md-12">
                    <div className="alert alert-info d-flex align-items-center p-5">
                        <i className="ki-duotone ki-information fs-2hx text-info me-4">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1">Settlement Transactions</h4>
                            <span>Showing refunded and voided transactions</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics - Separate loader */}
            {statisticsLoading ? (
                <div className="row gy-5 g-xl-10 mb-5">
                    <div className="col-xl-6">
                        <div className="card card-flush h-xl-100 bg-light-warning">
                            <div className="card-body">
                                <div className="skeleton" style={{width: '100%', height: '120px'}}></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-6">
                        <div className="card card-flush h-xl-100 bg-light-danger">
                            <div className="card-body">
                                <div className="skeleton" style={{width: '100%', height: '120px'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row gy-5 g-xl-10 mb-5">
                    {/* Refund Transactions */}
                    <div className="col-xl-6 mb-xl-10">
                        <div className="card card-flush h-xl-100 bg-light-warning">
                            <div className="card-header pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label fw-bold text-gray-800">Refunded Transactions</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Total refunded transactions and amount</span>
                                </h3>
                            </div>
                            <div className="card-body pt-2 row">
                                <div className="mb-2 col-6">
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {statistics.refundTransactions || 0}
                                    </span>
                                </div>
                                <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                                    <span className="fs-2x fw-semibold text-warning">
                                        ${parseFloat(statistics.refundTransactionsAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Void Transactions */}
                    <div className="col-xl-6 mb-xl-10">
                        <div className="card card-flush h-xl-100 bg-light-danger">
                            <div className="card-header pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label fw-bold text-gray-800">Voided Transactions</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Total voided transactions and amount</span>
                                </h3>
                            </div>
                            <div className="card-body pt-2 row">
                                <div className="mb-2 col-6">
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {statistics.voidTransactions || 0}
                                    </span>
                                </div>
                                <div className="mb-2 col-6 d-flex justify-content-center align-items-center">
                                    <span className="fs-2x fw-semibold text-danger">
                                        ${parseFloat(statistics.voidTransactionsAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <div className="card bg-white card-xl-stretch mb-5">
                    <div className="card-body">
                        <div className="row">
                            {/* Search */}
                            <div className="col-md-3">
                                <label className="form-label">Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    className="form-control form-control-sm"
                                    placeholder="Search by transaction ID..."
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                                />
                            </div>

                            {/* Status */}
                            <div className="col-md-3">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    className="form-select form-select-sm"
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilterChange({ status: e.target.value })}
                                >
                                    <option value="">All</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="DECLINED">Declined</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="CAPTURED">Captured</option>
                                    <option value="VOIDED">Voided</option>
                                    <option value="REFUNDED">Refunded</option>
                                </select>
                            </div>

                            {/* Type */}
                            <div className="col-md-3">
                                <label className="form-label">Type</label>
                                <select
                                    name="type"
                                    className="form-select form-select-sm"
                                    value={filters.type || ''}
                                    onChange={(e) => handleFilterChange({ type: e.target.value })}
                                >
                                    <option value="">All</option>
                                    <option value="refunded">Refunded</option>
                                    <option value="voided">Voided</option>
                                </select>
                            </div>

                            {/* Terminal - Searchable Dropdown */}
                            <div className="col-md-3">
                                <label className="form-label">Terminal</label>
                                <div className="position-relative" ref={terminalDropdownRef}>
                                    <div 
                                        className="form-control form-control-sm d-flex align-items-center justify-content-between"
                                        onClick={() => setShowTerminalList(!showTerminalList)}
                                        style={{ cursor: 'pointer', minHeight: '31px' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedTerminal ? (
                                                <span className="text-gray-800">
                                                    {selectedTerminal.name || selectedTerminal.terminal_id || `Terminal ${selectedTerminal.id}`}
                                                </span>
                                            ) : (
                                                <span className="text-muted">All Terminals</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedTerminal && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveTerminal(); }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showTerminalList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>
                                    
                                    {showTerminalList && (
                                        <div 
                                            className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" 
                                            style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}
                                        >
                                            <div className="p-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm mb-2" 
                                                    placeholder="Search terminals..."
                                                    value={terminalSearchTerm}
                                                    onChange={(e) => handleTerminalSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {filteredTerminals.length > 0 ? (
                                                <>
                                                    {!filters.terminal_id && (
                                                        <div 
                                                            className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                            onMouseDown={(e) => { e.preventDefault(); handleRemoveTerminal(); }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="text-gray-800">All Terminals</div>
                                                        </div>
                                                    )}
                                                    {filteredTerminals.map((terminal) => (
                                                        <div 
                                                            key={terminal.id}
                                                            className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                            onMouseDown={(e) => { e.preventDefault(); handleTerminalSelect(terminal); }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="text-gray-800">
                                                                {terminal.name || terminal.terminal_id || `Terminal ${terminal.id}`}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="p-3 text-muted text-center">
                                                    No terminals found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="row mt-3">
                            {/* Start Date */}
                            <div className="col-md-3">
                                <label className="form-label">From Date</label>
                                <input
                                    ref={startDateRef}
                                    type="date"
                                    name="start_date"
                                    className="form-control form-control-sm"
                                    value={filters.start_date || ''}
                                    onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                                    onClick={() => handleDateInputClick(startDateRef)}
                                    onFocus={() => handleDateInputClick(startDateRef)}
                                />
                            </div>

                            {/* End Date */}
                            <div className="col-md-3">
                                <label className="form-label">To Date</label>
                                <input
                                    ref={endDateRef}
                                    type="date"
                                    name="end_date"
                                    className="form-control form-control-sm"
                                    value={filters.end_date || ''}
                                    onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                                    onClick={() => handleDateInputClick(endDateRef)}
                                    onFocus={() => handleDateInputClick(endDateRef)}
                                />
                            </div>

                            {/* Clear Filters */}
                            <div className="col-md-6 d-flex align-items-end">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm"
                                    onClick={clearFilters}
                                >
                                    <i className="ki-duotone ki-filter-remove fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-7 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="text-dark">Transaction ID</th>
                                    <th className="text-dark">Batch Number</th>
                                    <th className="text-dark">Payment Channel</th>
                                    <th className="text-dark">Type</th>
                                    <th className="text-dark">Status</th>
                                    <th className="text-dark">Amount</th>
                                    <th className="text-dark">Created At</th>
                                    <th className="text-end text-dark">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionsLoading ? (
                                    // Skeleton Loading Rows
                                    [...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton skeleton-text" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-badge" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton skeleton-badge" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '90px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '140px', height: '16px'}}></div></td>
                                            <td className="text-end"><div className="skeleton skeleton-button" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5">
                                            <div className="text-gray-500">
                                                <i className="ki-duotone ki-file fs-3x mb-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <p className="fw-bold">No settlement transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.transaction_id || 'N/A'}</td>
                                            <td>{transaction.batch_number || 'N/A'}</td>
                                            <td>
                                                <span className="badge badge-light-primary">
                                                    {transaction.payment_channel || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-light-${getTypeColor(transaction.type)}`}>
                                                    {transaction.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-light-${getStatusColor(transaction.status)}`}>
                                                    {transaction.status ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) : 'N/A'}
                                                </span>
                                            </td>
                                            <td>${parseFloat(transaction.amount || 0).toFixed(2)}</td>
                                            <td>{transaction.created_at || 'N/A'}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-light btn-active-light-primary"
                                                    onClick={() => navigate(`/merchant/transactions/${transaction.id}`)}
                                                    title="View Transaction"
                                                >
                                                    <i className="ki-duotone ki-eye fs-5">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                    View
                                                </button>
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

export default SettlementTransactions;

