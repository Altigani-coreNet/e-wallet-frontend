import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';

const AdminTransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const canRefundTransaction = useCan('pos.transactions.refund_transactions');
    const canVoidTransaction = useCan('pos.transactions.void_transactions');
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [currency, setCurrency] = useState(null);
    const [currencyLoading, setCurrencyLoading] = useState(false);

    // Extract merchant ID from transaction
    const transactionMerchantId = useMemo(() => {
        if (!transaction) return null;
        const merchantId = transaction.merchant?.id || transaction.merchant_id;
        return merchantId ? String(merchantId) : null;
    }, [transaction]);

    // Fetch merchant and country info using the hook
    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(transactionMerchantId ? [transactionMerchantId] : []);

    // Helper function to get merchant info
    const getMerchantInfo = useCallback(() => {
        if (!transactionMerchantId) {
            return {
                merchantName: transaction?.merchant?.business_name || transaction?.merchant?.name || 'N/A',
                countryName: transaction?.merchant?.country?.name || 'N/A',
            };
        }

        const record = getMerchantInfoById(transactionMerchantId);

        if (record) {
            return {
                merchantName: record.name || transaction?.merchant?.business_name || transaction?.merchant?.name || 'N/A',
                countryName: record.countryName || 'N/A',
            };
        }

        return {
            merchantName: transaction?.merchant?.business_name || transaction?.merchant?.name || 'N/A',
            countryName: 'N/A',
        };
    }, [transaction, transactionMerchantId, getMerchantInfoById]);

    useEffect(() => {
        setTitle('Transaction Details');
        return () => setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        fetchTransaction();
    }, [id]);

    useEffect(() => {
        if (transaction) {
            const canRefund = ['approved', 'settled'].includes(transaction.status?.toLowerCase());
            const canVoid = ['authorized', 'captured', 'pending'].includes(transaction.status?.toLowerCase());
            
            setActions(
                <div className="d-flex align-items-center gap-2 gap-lg-3">
                    <button
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={handleSendReceipt}
                    >
                        <i className="ki-duotone ki-message-text-2 fs-3"></i>
                        Send Receipt
                    </button>
                    
                    <button
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={handleViewReceipt}
                    >
                        <i className="ki-duotone ki-eye fs-3"></i>
                        View Receipt
                    </button>
                    
                    {canRefundTransaction && (
                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => setShowRefundModal(true)}
                            disabled={!canRefund}
                        >
                            <i className="ki-duotone ki-arrow-left fs-3"></i>
                            Refund
                        </button>
                    )}
                    
                    {canVoidTransaction && (
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={handleVoid}
                            disabled={!canVoid}
                        >
                            <i className="ki-duotone ki-cross fs-3"></i>
                            Void
                        </button>
                    )}
                </div>
            );
        }
    }, [transaction, canRefundTransaction, canVoidTransaction]);

    const fetchTransaction = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_DETAILS(id), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const transactionData = response.data.data || response.data;
            setTransaction(transactionData);
            
            // No need to fetch currency separately - we have currency_symbol in transaction data
            // If currency_object exists, parse it for additional details
            if (transactionData.currency_object) {
                try {
                    const currencyObj = typeof transactionData.currency_object === 'string' 
                        ? JSON.parse(transactionData.currency_object) 
                        : transactionData.currency_object;
                    setCurrency(currencyObj);
                } catch (e) {
                    console.error('Error parsing currency_object:', e);
                }
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
            toast.error('Failed to load transaction details');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrency = async (currencyId) => {
        setCurrencyLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(`${AUTH_ENDPOINTS.CURRENCIES}/${currencyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            setCurrency(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching currency:', error);
            // Set default currency if fetch fails
            setCurrency({ currency_code: 'USD', symbol: '$' });
        } finally {
            setCurrencyLoading(false);
        }
    };

    const handleSendReceipt = async () => {
        const result = await Swal.fire({
            title: 'Send Receipt',
            html: `
                <input type="email" id="swal-email" class="swal2-input" placeholder="Email address" required>
                <textarea id="swal-message" class="swal2-textarea" placeholder="Optional message"></textarea>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Send',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const email = document.getElementById('swal-email').value;
                const message = document.getElementById('swal-message').value;
                if (!email) {
                    Swal.showValidationMessage('Email is required');
                }
                return { email, message };
            }
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                const response = await axios.post(ADMIN_ENDPOINTS.TRANSACTION_SEND_RECEIPT(id), {
                    email: result.value.email,
                    message: result.value.message
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                toast.success(response.data.message || 'Receipt sent successfully');
            } catch (error) {
                console.error('Send receipt error:', error);
                toast.error(error.response?.data?.message || 'Failed to send receipt');
            }
        }
    };

    const handleViewReceipt = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_RECEIPT(id), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.data.data?.receipt_url) {
                window.open(response.data.data.receipt_url, '_blank');
            } else {
                toast.info('Receipt view will be implemented');
            }
        } catch (error) {
            console.error('View receipt error:', error);
            toast.error('Failed to view receipt');
        }
    };

    const handleRefund = async () => {
        if (!refundAmount || !refundReason) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.TRANSACTION_REFUND(id), {
                amount: refundAmount,
                reason: refundReason
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            toast.success(response.data.message || 'Refund initiated successfully');
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundReason('');
            fetchTransaction();
        } catch (error) {
            console.error('Refund error:', error);
            toast.error(error.response?.data?.message || 'Failed to process refund');
        }
    };

    const handleVoid = async () => {
        const result = await Swal.fire({
            title: 'Void Transaction',
            text: 'Void confirmation',
            icon: 'warning',
            input: 'textarea',
            inputLabel: 'Void Reason',
            inputPlaceholder: 'Enter void reason',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Void',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                const response = await axios.post(ADMIN_ENDPOINTS.TRANSACTION_VOID(id), {
                    reason: result.value
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                toast.success(response.data.message || 'Transaction voided successfully');
                fetchTransaction();
            } catch (error) {
                console.error('Void error:', error);
                toast.error(error.response?.data?.message || 'Failed to void transaction');
            }
        }
    };

    if (loading) {
        return (
            <>
                {/* Transaction Status Card Skeleton */}
                <div className="row g-5 g-xl-8 mt-4">
                    <div className="col-md-12">
                        <div className="card bg-light-secondary hoverable card-xl-stretch mb-xl-8">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <div className="mb-2">
                                            <span className="placeholder placeholder-lg w-200px bg-secondary placeholder-wave"></span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="placeholder placeholder-sm w-300px bg-secondary placeholder-wave"></span>
                                        </div>
                                        <div>
                                            <span className="placeholder placeholder-sm w-250px bg-secondary placeholder-wave"></span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="mb-2">
                                            <span className="placeholder placeholder-lg w-150px bg-secondary placeholder-wave"></span>
                                        </div>
                                        <div>
                                            <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row gx-9 gy-6">
                    {/* Card Information Section Skeleton */}
                    <div className="col-xl-6">
                        <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                            <div className="d-flex flex-column py-2 w-100">
                                <div className="d-flex align-items-center mb-5">
                                    <span className="placeholder placeholder-lg w-200px bg-secondary me-2 placeholder-wave"></span>
                                    <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave"></span>
                                </div>
                                
                                <div className="d-flex align-items-center">
                                    <div className="me-4 w-50px h-35px bg-light-secondary rounded d-flex align-items-center justify-content-center placeholder-wave">
                                    </div>
                                    
                                    <div className="flex-grow-1">
                                        <div className="mb-2">
                                            <span className="placeholder placeholder-lg w-150px bg-secondary placeholder-wave"></span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="placeholder placeholder-sm w-200px bg-secondary placeholder-wave"></span>
                                        </div>
                                        <div>
                                            <span className="placeholder placeholder-sm w-180px bg-secondary placeholder-wave"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details Section Skeleton */}
                    <div className="col-xl-6">
                        <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                            <div className="d-flex flex-column py-2 w-100">
                                <div className="mb-5">
                                    <span className="placeholder placeholder-lg w-200px bg-secondary placeholder-wave"></span>
                                </div>
                                
                                <div className="row g-3">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="col-6">
                                            <div className="mb-2">
                                                <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave"></span>
                                            </div>
                                            <div>
                                                <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Transaction Information Skeleton */}
                <div className="row gx-9 gy-6 mt-4">
                    <div className="col-xl-12">
                        <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                            <div className="d-flex flex-column py-2 w-100">
                                <div className="mb-5">
                                    <span className="placeholder placeholder-lg w-200px bg-secondary placeholder-wave"></span>
                                </div>
                                
                                <div className="row g-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <div key={i} className="col-md-3">
                                            <div className="mb-2">
                                                <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave"></span>
                                            </div>
                                            <div>
                                                <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!transaction) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>Transaction not found</p>
                </div>
            </div>
        );
    }

    const getStatusClass = (status) => {
        return status === 'approved' || status === 'APPROVED' ? 'success' : 
               status === 'declined' || status === 'DECLINED' ? 'danger' : 'warning';
    };

    return (
        <>
            {/* Transaction Status Card */}
            <div className="row g-5 g-xl-8 mt-4">
                <div className="col-md-12">
                    <div className={`card bg-light-${getStatusClass(transaction.status)} hoverable card-xl-stretch mb-xl-8`}>
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <div className="text-black fw-bolder fs-2 mb-2">
                                        {transaction.status}
                                        {(transaction.status === 'approved' || transaction.status === 'APPROVED') && (
                                            <span className="badge badge-light-success fs-6 ms-2">Badge Number</span>
                                        )}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {transaction.transaction_type} - {transaction.transaction_id}
                                    </div>
                                    <div className="text-muted fs-6">
                                        {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'N/A'} (GMT+4)
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="text-black fw-bolder fs-1 mb-2">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {currency?.currency_code || 'USD'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6">
                {/* Card Information Section */}
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2">
                            <div className="d-flex align-items-center fs-4 fw-bolder mb-5">
                                {transaction.paymentMethod?.cardholder_name || 'Card Information'}
                                <span className="badge badge-light-primary fs-7 ms-2">
                                    {transaction.transaction_type}
                                </span>
                            </div>
                            
                            <div className="d-flex align-items-center">
                                <div className="me-4 w-50px h-35px bg-light-primary rounded d-flex align-items-center justify-content-center">
                                    <i className="ki-duotone ki-credit-cart fs-2x text-primary"></i>
                                </div>
                                
                                <div>
                                    <div className="fs-4 fw-bolder">
                                        {transaction.method ? transaction.method.toUpperCase() : 'Card'}
                                        {transaction.card_number && ` **** ${transaction.card_number.slice(-4)}`}
                                    </div>
                                    <div className="fs-6 fw-bold text-gray-400">
                                        {transaction.expiry ? `Card expires at ${transaction.expiry}` : 'Expiry information not available'}
                                    </div>
                                    {transaction.paymentMethod && (
                                        <div className="fs-7 text-muted">
                                            Entry mode: {transaction.paymentMethod.entry_mode}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Details Section */}
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">Transaction Details</div>
                            
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="fs-7 text-muted">RRN ID</div>
                                    <div className="fs-6 fw-bold">{transaction.rrn || 'Not available'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Batch No</div>
                                    <div className="fs-6 fw-bold">{transaction.batch_no || 'Not available'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Trace</div>
                                    <div className="fs-6 fw-bold">{transaction.trace_no || 'Not available'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Approval Code</div>
                                    <div className="fs-6 fw-bold">{transaction.auth_code || 'Not available'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Device Alias</div>
                                    <div className="fs-6 fw-bold">{transaction.terminal_id || 'Not available'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">SDK ID</div>
                                    <div className="fs-6 fw-bold">{transaction.sdk || transaction.sdk_id || 'Not available'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Transaction Information */}
            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-12">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">Additional Information</div>
                            
                            <div className="row g-4">
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Merchant</div>
                                    <div className="fs-6 fw-bold">
                                        {(() => {
                                            const merchantLoading = transactionMerchantId && (merchantInfoLoading || hasPendingRequest(transactionMerchantId));
                                            const info = getMerchantInfo();
                                            
                                            if (merchantLoading && !info.merchantName) {
                                                return <div className="skeleton" style={{width: '120px', height: '16px'}}></div>;
                                            }
                                            return info.merchantName;
                                        })()}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Country</div>
                                    <div className="fs-6 fw-bold">
                                        {(() => {
                                            const merchantLoading = transactionMerchantId && (merchantInfoLoading || hasPendingRequest(transactionMerchantId));
                                            const info = getMerchantInfo();
                                            
                                            if (merchantLoading && !info.countryName) {
                                                return <div className="skeleton" style={{width: '80px', height: '16px'}}></div>;
                                            }
                                            return info.countryName;
                                        })()}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Terminal</div>
                                    <div className="fs-6 fw-bold">{transaction.terminal_id || 'Not available'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Invoice No</div>
                                    <div className="fs-6 fw-bold">{transaction.invoice_no || 'Not available'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Linked Trans</div>
                                    <div className="fs-6 fw-bold">No linked transaction</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Geo Fence Result</div>
                                    <div className="fs-6 fw-bold">Not available</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">MID</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || 'Not available'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">TID</div>
                                    <div className="fs-6 fw-bold">{transaction.tid || 'Not available'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">ATC</div>
                                    <div className="fs-6 fw-bold">{transaction.atc || 'Not available'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Refund Transaction</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowRefundModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">Transaction ID</span>
                                    <span className="badge bg-light-primary">{transaction.transaction_id}</span>
                                </div>
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">Amount</span>
                                    <span className="badge bg-light-info">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">Refundable Amount</span>
                                    <span className="badge bg-light-success">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.refundable_amount || transaction.amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="refund-amount" className="form-label">Refund Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={transaction.refundable_amount || transaction.amount}
                                        className="form-control"
                                        id="refund-amount"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="refund-reason" className="form-label">Refund Reason</label>
                                    <textarea
                                        className="form-control"
                                        id="refund-reason"
                                        rows="2"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowRefundModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={handleRefund}
                                >
                                    Refund
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminTransactionDetail;
