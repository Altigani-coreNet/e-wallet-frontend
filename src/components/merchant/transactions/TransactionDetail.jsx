import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    fetchTransactionDetails,
    voidTransaction,
    refundTransaction,
    sendReceipt
} from '../../../services/transactionsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    // State management
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voidLoading, setVoidLoading] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [sendReceiptLoading, setSendReceiptLoading] = useState(false);
    
    // Fetch transaction details
    useEffect(() => {
        if (!id) return;

        const loadTransaction = async () => {
            setLoading(true);
            try {
                const data = await fetchTransactionDetails(id);
                setTransaction(data);
            } catch (error) {
                console.error('Error fetching transaction details:', error);
                toast.error('Failed to load transaction details');
            } finally {
                setLoading(false);
            }
        };

        loadTransaction();
    }, [id]);
    
    // Refetch function (for after void/refund)
    const refetch = useCallback(async () => {
        if (!id) return;
        try {
            const data = await fetchTransactionDetails(id);
            setTransaction(data);
        } catch (error) {
            console.error('Error refetching transaction:', error);
        }
    }, [id]);

    // Handle void transaction
    const handleVoid = useCallback(async () => {
        if (!transaction) return;
        
        const { value: reason } = await Swal.fire({
            title: 'Void Transaction',
            input: 'textarea',
            inputLabel: 'Reason for void',
            inputPlaceholder: 'Enter reason...',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Void',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason!';
                }
            }
        });

        if (reason && transaction) {
            setVoidLoading(true);
            try {
                await voidTransaction({ 
                    transactionId: transaction.id, 
                    reason 
                });
                toast.success('Transaction voided successfully');
                await refetch(); // Refetch transaction details after void
            } catch (error) {
                console.error('Void error:', error);
                toast.error('Failed to void transaction');
            } finally {
                setVoidLoading(false);
            }
        }
    }, [transaction, refetch]);

    // Handle refund transaction
    const handleRefund = useCallback(async () => {
        if (!transaction) return;
        
        const { value: formValues } = await Swal.fire({
            title: 'Refund Transaction',
            html:
                `<input id="swal-input1" class="swal2-input" type="number" placeholder="Amount" max="${transaction.refundable_amount || transaction.amount}" step="0.01">` +
                '<textarea id="swal-input2" class="swal2-textarea" placeholder="Reason for refund"></textarea>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Refund',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const amount = document.getElementById('swal-input1').value;
                const reason = document.getElementById('swal-input2').value;
                
                if (!amount || amount <= 0) {
                    Swal.showValidationMessage('Please enter a valid amount');
                    return false;
                }
                
                if (!reason) {
                    Swal.showValidationMessage('Please enter a reason');
                    return false;
                }
                
                if (parseFloat(amount) > (transaction.refundable_amount || transaction.amount)) {
                    Swal.showValidationMessage('Amount exceeds refundable amount');
                    return false;
                }
                
                return { amount, reason };
            }
        });

        if (formValues) {
            setRefundLoading(true);
            try {
                await refundTransaction({ 
                    transactionId: transaction.id,
                    amount: formValues.amount,
                    reason: formValues.reason
                });
                toast.success('Refund initiated successfully');
                await refetch(); // Refetch transaction details after refund
            } catch (error) {
                console.error('Refund error:', error);
                toast.error('Failed to process refund');
            } finally {
                setRefundLoading(false);
            }
        }
    }, [transaction, refetch]);

    // Handle send receipt
    const handleSendReceipt = useCallback(async () => {
        if (!transaction) return;
        
        const { value: formValues } = await Swal.fire({
            title: 'Send Receipt',
            html:
                '<input id="swal-email" class="swal2-input" type="email" placeholder="Email address">' +
                '<textarea id="swal-message" class="swal2-textarea" placeholder="Optional message"></textarea>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Send',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const email = document.getElementById('swal-email').value;
                const message = document.getElementById('swal-message').value;
                
                if (!email) {
                    Swal.showValidationMessage('Please enter an email address');
                    return false;
                }
                
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    Swal.showValidationMessage('Please enter a valid email address');
                    return false;
                }
                
                return { email, message };
            }
        });

        if (formValues) {
            setSendReceiptLoading(true);
            try {
                await sendReceipt({ 
                    transactionId: transaction.id,
                    email: formValues.email,
                    message: formValues.message
                });
                toast.success('Receipt sent successfully');
            } catch (error) {
                console.error('Send receipt error:', error);
                toast.error('Failed to send receipt');
            } finally {
                setSendReceiptLoading(false);
            }
        }
    }, [transaction]);

    // Handle view receipt - open POS invoice print page using encrypted id
    const handleViewReceipt = useCallback(() => {
        if (!transaction) return;

        // Prefer backend-generated invoice_url (absolute URL to POS invoice page)
        if (transaction.transaction_encrypted_id) {
            window.open( '/pos-invoice/' + transaction.transaction_encrypted_id, '_blank');
            return;
        }

        // Fallback: use encrypted id if available, otherwise plain id
        const encryptedId = transaction.transaction_encrypted_id || transaction.id;
        if (!encryptedId) return;

        window.open(`/pos-invoice/${encryptedId}`, '_blank');
    }, [transaction]);

    // Set toolbar title and actions
    useEffect(() => {
        if (transaction) {
            console.log('Transaction status:', transaction.status, 'Upper:', transaction.status?.toUpperCase());
            setTitle(`Transaction Details - ${transaction.transaction_id || id}`);
            
            setActions(
                <>
                    <button 
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={handleSendReceipt}
                        disabled={sendReceiptLoading}
                    >
                        <i className="ki-duotone ki-message-text-2 fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {sendReceiptLoading ? 'Sending...' : 'Send Receipt'}
                    </button>

                    <button 
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={handleViewReceipt}
                    >
                        <i className="ki-duotone ki-eye fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        View Receipt
                    </button>

                    {/* Refund Button - Always visible, enabled only for APPROVED */}
                    {transaction && (
                        <button 
                            className="btn btn-sm btn-warning"
                            onClick={handleRefund}
                            disabled={refundLoading || transaction.status?.toUpperCase() !== 'APPROVED'}
                        >
                            <i className="ki-duotone ki-arrow-left fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {refundLoading ? 'Processing...' : 'Refund'}
                        </button>
                    )}

                    {/* Void Button - Always visible, enabled for PENDING and CAPTURED */}
                    {transaction && (
                        <button 
                            className="btn btn-sm btn-danger"
                            onClick={handleVoid}
                            disabled={voidLoading || (transaction.status?.toUpperCase() !== 'PENDING' && transaction.status?.toUpperCase() !== 'CAPTURED')}
                        >
                            <i className="ki-duotone ki-cross fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {voidLoading ? 'Processing...' : 'Void'}
                        </button>
                    )}
                </>
            );

            return () => {
                setActions(null);
            };
        }
    }, [transaction, id, voidLoading, refundLoading, sendReceiptLoading, handleSendReceipt, handleViewReceipt, handleRefund, handleVoid, setTitle, setActions]);

    // Get status color
    const getStatusColor = (status) => {
        const statusColors = {
            'APPROVED': 'success',
            'approved': 'success',
            'DECLINED': 'danger',
            'declined': 'danger',
            'PENDING': 'warning',
            'pending': 'warning',
            'CAPTURED': 'info',
            'captured': 'info',
            'VOIDED': 'dark',
            'voided': 'dark',
            'REFUNDED': 'secondary',
            'refunded': 'secondary'
        };
        return statusColors[status] || 'secondary';
    };

    // Get card logo
    const getCardLogo = (method) => {
        if (!method) return null;
        const methodLower = method.toLowerCase();
        if (methodLower === 'visa') {
            return '/assets/media/svg/card-logos/visa.svg';
        } else if (methodLower === 'mastercard') {
            return '/assets/media/svg/card-logos/mastercard.svg';
        } else if (methodLower === 'american_express') {
            return '/assets/media/svg/card-logos/american-express.svg';
        }
        return null;
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };


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
                <div className="d-flex flex-column-fluid">
                    <div className="container-xxl">
                        {/* Skeleton Toolbar */}
                        <div className="d-flex flex-wrap flex-stack mb-6">
                            <div className="skeleton" style={{width: '200px', height: '32px'}}></div>
                            <div className="d-flex gap-2">
                                <div className="skeleton" style={{width: '100px', height: '38px', borderRadius: '6px'}}></div>
                                <div className="skeleton" style={{width: '100px', height: '38px', borderRadius: '6px'}}></div>
                            </div>
                        </div>

                        {/* Skeleton Status Card */}
                        <div className="row g-5 g-xl-8 mt-4">
                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body p-8">
                                        <div className="skeleton" style={{width: '100%', height: '80px'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skeleton Info Cards */}
                        <div className="row gx-9 gy-6 mt-4">
                            <div className="col-xl-6">
                                <div className="card">
                                    <div className="card-body p-6">
                                        <div className="skeleton" style={{width: '100%', height: '150px'}}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-6">
                                <div className="card">
                                    <div className="card-body p-6">
                                        <div className="skeleton" style={{width: '100%', height: '150px'}}></div>
                                    </div>
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
            <div className="d-flex flex-column-fluid">
                <div className="container-xxl">
                    <div className="card">
                        <div className="card-body text-center py-20">
                            <i className="ki-duotone ki-information-5 fs-3x text-muted mb-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <h3 className="text-gray-800 mb-2">Transaction Not Found</h3>
                            <p className="text-gray-600 mb-5">The transaction you're looking for doesn't exist or you don't have access to it.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/merchant/transactions')}>
                                <i className="ki-duotone ki-arrow-left fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Back to Transactions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex flex-wrap flex-stack mb-6">
                <button 
                    className="btn btn-sm btn-light btn-active-light-primary me-3"
                    onClick={() => navigate('/merchant/transactions')}
                >
                    <i className="ki-duotone ki-arrow-left fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </button>
            </div>

            {/* Transaction Status Card */}
            <div className="row g-5 g-xl-8 mb-5">
                <div className="col-md-12">
                    <div className={`card bg-light-${getStatusColor(transaction.status)} card-xl-stretch`}>
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <div className="text-black fw-bolder fs-2 mb-2">
                                        <span className={`badge badge-${getStatusColor(transaction.status)}`}>
                                            {transaction.status}
                                        </span>
                                    </div>
                                    <div className="fw-bold text-black">{transaction.transaction_type} - {transaction.transaction_id}</div>
                                    <div className="text-muted fs-6">{formatDate(transaction.created_at)}</div>
                                </div>
                                <div className="text-end">
                                    <div className="text-black fw-bolder fs-1 mb-2">
                                        {transaction.currency_symbol || '$'} {Number(transaction.amount).toFixed(2)}
                                    </div>
                                    <div className="fw-bold text-black">{transaction.currency?.currency_code || 'USD'}</div>
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
                                {transaction.payment_method?.cardholder_name || 'Card Information'}
                                <span className="badge badge-light-primary fs-7 ms-2">{transaction.transaction_type}</span>
                            </div>
                            
                            <div className="d-flex align-items-center">
                                {getCardLogo(transaction.method) ? (
                                    <img src={getCardLogo(transaction.method)} alt="" className="me-4" style={{height: '35px'}} />
                                ) : (
                                    <div className="me-4 w-50px h-35px bg-light-primary rounded d-flex align-items-center justify-content-center">
                                        <i className="ki-duotone ki-credit-cart fs-2x text-primary">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </div>
                                )}
                                
                                <div>
                                    <div className="fs-4 fw-bolder">
                                        {transaction.method ? transaction.method.charAt(0).toUpperCase() + transaction.method.slice(1) : 'Card'}
                                        {transaction.card_number && ` **** ${transaction.card_number.slice(-4)}`}
                                    </div>
                                    <div className="fs-6 fw-bold text-gray-400">
                                        {transaction.expiry ? `Card expires ${transaction.expiry}` : 'Expiry information not available'}
                                    </div>
                                    {transaction.payment_method?.entry_mode && (
                                        <div className="fs-7 text-muted">
                                            Entry mode: {transaction.payment_method.entry_mode}
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
                                    <div className="fs-6 fw-bold">{transaction.rrn || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Batch No</div>
                                    <div className="fs-6 fw-bold">{transaction.batch_no || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Trace</div>
                                    <div className="fs-6 fw-bold">{transaction.trace_no || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Approval Code</div>
                                    <div className="fs-6 fw-bold">{transaction.auth_code || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">Device Alias</div>
                                    <div className="fs-6 fw-bold">{transaction.terminal?.name || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">SDK ID</div>
                                    <div className="fs-6 fw-bold">{transaction.sdk_id || transaction.sdk || 'N/A'}</div>
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
                                    <div className="fs-6 fw-bold">{transaction.merchant?.name || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Terminal</div>
                                    <div className="fs-6 fw-bold">{transaction.terminal?.name || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Invoice No</div>
                                    <div className="fs-6 fw-bold">{transaction.invoice_no || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">MID</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">TID</div>
                                    <div className="fs-6 fw-bold">{transaction.tid || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">ATC</div>
                                    <div className="fs-6 fw-bold">{transaction.atc || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Payment Type</div>
                                    <div className="fs-6 fw-bold">
                                        <span className="badge badge-light-primary">
                                            {transaction.payment_type || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">Created By</div>
                                    <div className="fs-6 fw-bold">{transaction.user?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Request Section */}
            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-12">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5 text-primary">
                                <i className="ki-duotone ki-send fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Payment Request
                            </div>
                            
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">Amount</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.currency_symbol || '$'} {Number(transaction.original_amount || transaction.amount).toFixed(2)}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">Transaction Type</div>
                                    <div className="fs-6 fw-bold">{transaction.transaction_type}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">Currency</div>
                                    <div className="fs-6 fw-bold">{transaction.currency_symbol || '$'} ({transaction.currency?.currency_code || 'USD'})</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">Request Timestamp</div>
                                    <div className="fs-6 fw-bold">{formatDate(transaction.timestamp || transaction.created_at)}</div>
                                </div>
                                {transaction.payment_method && (
                                    <>
                                        <div className="col-md-4">
                                            <div className="fs-7 text-muted">Cardholder Name</div>
                                            <div className="fs-6 fw-bold">{transaction.payment_method.cardholder_name}</div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="fs-7 text-muted">Entry Mode</div>
                                            <div className="fs-6 fw-bold">{transaction.payment_method.entry_mode}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Response Section */}
            <div className="row gx-9 gy-6 mt-4 mb-5">
                <div className="col-xl-12">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5 text-success">
                                <i className="ki-duotone ki-message-text-2 fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Payment Response
                            </div>
                            
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">SDK Status</div>
                                    <div className="fs-6 fw-bold">
                                        <span className={`badge badge-light-${getStatusColor(transaction.state || transaction.status)}`}>
                                            {transaction.state || transaction.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">RRN ID</div>
                                    <div className="fs-6 fw-bold">{transaction.rrn || 'N/A'}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">Approval Code</div>
                                    <div className="fs-6 fw-bold">{transaction.auth_code || 'N/A'}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">MID</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || 'N/A'}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">TID</div>
                                    <div className="fs-6 fw-bold">{transaction.tid || 'N/A'}</div>
                                </div>
                                {transaction.atc && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">ATC</div>
                                        <div className="fs-6 fw-bold">{transaction.atc}</div>
                                    </div>
                                )}
                                {transaction.sdk && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">SDK ID</div>
                                        <div className="fs-6 fw-bold">{transaction.sdk}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TransactionDetail;

