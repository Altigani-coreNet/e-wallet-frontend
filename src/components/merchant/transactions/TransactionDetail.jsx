import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';
import { getTransactionStatusLabel } from '../../../utils/transactionStatusHelpers';
import {
    getPaymentCardBrandOrMethodLabel,
    getPaymentChannelLabel,
    getEntryModeLabel,
    getTransactionPaymentTypeFieldLabel,
} from '../../../utils/transactionPaymentHelpers';

/** Matches API CountryResource: `name` may be a string or { en, ar }. */
function formatCountryNameLabel(country, lang) {
    if (!country?.name && country?.name !== '') return '';
    const n = country.name;
    if (typeof n === 'string') return n;
    if (n && typeof n === 'object') {
        if (lang === 'ar') return n.ar || n.en || '';
        return n.en || n.ar || '';
    }
    return '';
}

const TransactionDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    // State management
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voidLoading, setVoidLoading] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [sendReceiptLoading, setSendReceiptLoading] = useState(false);
    const [currency, setCurrency] = useState(null);

    const transactionMerchantId = useMemo(() => {
        if (!transaction) return null;
        const merchantId = transaction.merchant?.id || transaction.merchant_id;
        return merchantId ? String(merchantId) : null;
    }, [transaction]);

    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(transactionMerchantId ? [transactionMerchantId] : []);

    const getMerchantInfo = useCallback(() => {
        const na = t('merchant.common.na');
        const m = transaction?.merchant;
        if (m?.business_name || m?.name) {
            return {
                merchantName: m.business_name || m.name || na,
                countryName: formatCountryNameLabel(m.country, i18n.language) || na,
            };
        }
        if (!transactionMerchantId) {
            return {
                merchantName: na,
                countryName: formatCountryNameLabel(transaction?.country, i18n.language) || na,
            };
        }
        const record = getMerchantInfoById(transactionMerchantId);
        if (record) {
            return {
                merchantName: record.name || na,
                countryName:
                    record.countryName ||
                    formatCountryNameLabel(transaction?.country, i18n.language) ||
                    na,
            };
        }
        return {
            merchantName: na,
            countryName: formatCountryNameLabel(transaction?.country, i18n.language) || na,
        };
    }, [transaction, transactionMerchantId, getMerchantInfoById, t, i18n.language]);

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
                toast.error(t('merchant.transactionDetail.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadTransaction();
    }, [id, t]);

    useEffect(() => {
        if (!transaction?.currency_object) {
            setCurrency(transaction?.currency || null);
            return;
        }
        try {
            const currencyObj =
                typeof transaction.currency_object === 'string'
                    ? JSON.parse(transaction.currency_object)
                    : transaction.currency_object;
            setCurrency(currencyObj);
        } catch (e) {
            console.error('Error parsing currency_object:', e);
            setCurrency(transaction?.currency || null);
        }
    }, [transaction]);

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
            title: t('merchant.transactionDetail.voidTitle'),
            input: 'textarea',
            inputLabel: t('merchant.transactionDetail.voidReasonLabel'),
            inputPlaceholder: t('merchant.transactionDetail.voidPlaceholder'),
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t('merchant.transactionDetail.voidConfirm'),
            cancelButtonText: t('merchant.common.cancel'),
            inputValidator: (value) => {
                if (!value) {
                    return t('merchant.transactionDetail.voidReasonRequired');
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
                toast.success(t('merchant.transactionDetail.voidSuccess'));
                await refetch(); // Refetch transaction details after void
            } catch (error) {
                console.error('Void error:', error);
                toast.error(t('merchant.transactionDetail.voidFailed'));
            } finally {
                setVoidLoading(false);
            }
        }
    }, [transaction, refetch, t]);

    // Handle refund transaction
    const handleRefund = useCallback(async () => {
        if (!transaction) return;
        
        const { value: formValues } = await Swal.fire({
            title: t('merchant.transactionDetail.refundTitle'),
            html:
                `<input id="swal-input1" class="swal2-input" type="number" placeholder="${t('merchant.transactionDetail.refundAmountPlaceholder')}" max="${transaction.refundable_amount || transaction.amount}" step="0.01">` +
                `<textarea id="swal-input2" class="swal2-textarea" placeholder="${t('merchant.transactionDetail.refundReasonPlaceholder')}"></textarea>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t('merchant.transactionDetail.refundConfirm'),
            cancelButtonText: t('merchant.common.cancel'),
            preConfirm: () => {
                const amount = document.getElementById('swal-input1').value;
                const reason = document.getElementById('swal-input2').value;
                
                if (!amount || amount <= 0) {
                    Swal.showValidationMessage(t('merchant.transactionDetail.refundAmountInvalid'));
                    return false;
                }
                
                if (!reason) {
                    Swal.showValidationMessage(t('merchant.transactionDetail.refundReasonRequired'));
                    return false;
                }
                
                if (parseFloat(amount) > (transaction.refundable_amount || transaction.amount)) {
                    Swal.showValidationMessage(t('merchant.transactionDetail.refundExceeds'));
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
                toast.success(t('merchant.transactionDetail.refundSuccess'));
                await refetch(); // Refetch transaction details after refund
            } catch (error) {
                console.error('Refund error:', error);
                toast.error(t('merchant.transactionDetail.refundFailed'));
            } finally {
                setRefundLoading(false);
            }
        }
    }, [transaction, refetch, t]);

    // Handle send receipt
    const handleSendReceipt = useCallback(async () => {
        if (!transaction) return;
        
        const { value: formValues } = await Swal.fire({
            title: t('merchant.transactionDetail.sendReceiptTitle'),
            html:
                `<input id="swal-email" class="swal2-input" type="email" placeholder="${t('merchant.transactionDetail.emailPlaceholder')}">` +
                `<textarea id="swal-message" class="swal2-textarea" placeholder="${t('merchant.transactionDetail.messagePlaceholder')}"></textarea>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t('merchant.transactionDetail.sendConfirm'),
            cancelButtonText: t('merchant.common.cancel'),
            preConfirm: () => {
                const email = document.getElementById('swal-email').value;
                const message = document.getElementById('swal-message').value;
                
                if (!email) {
                    Swal.showValidationMessage(t('merchant.transactionDetail.emailRequired'));
                    return false;
                }
                
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    Swal.showValidationMessage(t('merchant.transactionDetail.emailInvalid'));
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
                toast.success(t('merchant.transactionDetail.receiptSentSuccess'));
            } catch (error) {
                console.error('Send receipt error:', error);
                toast.error(t('merchant.transactionDetail.receiptSentFailed'));
            } finally {
                setSendReceiptLoading(false);
            }
        }
    }, [transaction, t]);

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
            setTitle(t('merchant.transactionDetail.title', { id: transaction.transaction_id || id }));
            
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
                        {sendReceiptLoading ? t('merchant.transactionDetail.sendingReceipt') : t('merchant.transactionDetail.sendReceipt')}
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
                        {t('merchant.transactionDetail.viewReceipt')}
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
                            {refundLoading ? t('merchant.transactionDetail.processing') : t('merchant.transactionDetail.refund')}
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
                            {voidLoading ? t('merchant.transactionDetail.processing') : t('merchant.transactionDetail.void')}
                        </button>
                    )}
                </>
            );

            return () => {
                setActions(null);
            };
        }
    }, [transaction, id, voidLoading, refundLoading, sendReceiptLoading, handleSendReceipt, handleViewReceipt, handleRefund, handleVoid, setTitle, setActions, t, i18n.language]);

    /** Status strip styling — aligned with admin transaction detail */
    const getStatusClass = (status) => {
        return status === 'approved' || status === 'APPROVED'
            ? 'success'
            : status === 'declined' || status === 'DECLINED'
              ? 'danger'
              : 'warning';
    };

    const formatDate = (date) => {
        if (!date) return t('merchant.common.na');
        const loc = i18n.language === 'ar' ? 'ar' : 'en-US';
        return new Date(date).toLocaleString(loc, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
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
                            <h3 className="text-gray-800 mb-2">{t('merchant.transactionDetail.notFoundTitle')}</h3>
                            <p className="text-gray-600 mb-5">{t('merchant.transactionDetail.notFoundDescription')}</p>
                            <button className="btn btn-primary" onClick={() => navigate('/merchant/transactions')}>
                                <i className="ki-duotone ki-arrow-left fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.transactionDetail.backToTransactions')}
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
                    {t('merchant.transactionDetail.back')}
                </button>
            </div>

            {/* Transaction Status Card — aligned with admin */}
            <div className="row g-5 g-xl-8 mt-4">
                <div className="col-md-12">
                    <div className={`card bg-light-${getStatusClass(transaction.status)} hoverable card-xl-stretch mb-xl-8`}>
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <div className="text-black fw-bolder fs-2 mb-2">
                                        {getTransactionStatusLabel(transaction.status, t)}
                                        {(transaction.status === 'approved' || transaction.status === 'APPROVED') && (
                                            <span className="badge badge-light-success fs-6 ms-2">
                                                {t('merchant.transactionDetail.badgeNumber')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {transaction.transaction_type} - {transaction.transaction_id}
                                    </div>
                                    <div className="text-muted fs-6">
                                        {transaction.created_at
                                            ? `${formatDate(transaction.created_at)} ${t('merchant.transactionDetail.gmtSuffix')}`
                                            : t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="text-black fw-bolder fs-1 mb-2">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {currency?.currency_code || transaction.currency?.currency_code || 'USD'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6">
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2">
                            <div className="d-flex align-items-center fs-4 fw-bolder mb-5">
                                {transaction.paymentMethod?.cardholder_name ||
                                    transaction.payment_method?.cardholder_name ||
                                    t('merchant.transactionDetail.cardInformation')}
                                <span className="badge badge-light-primary fs-7 ms-2">
                                    {transaction.transaction_type || t('merchant.common.na')}
                                </span>
                            </div>

                            <div className="d-flex align-items-center">
                                <div className="me-4 w-50px h-35px bg-light-primary rounded d-flex align-items-center justify-content-center">
                                    <i className="ki-duotone ki-credit-cart fs-2x text-primary"></i>
                                </div>

                                <div>
                                    <div className="fs-4 fw-bolder">
                                        {getPaymentCardBrandOrMethodLabel(
                                            transaction.method ||
                                                transaction.payment_method?.card_type ||
                                                transaction.paymentMethod?.card_type,
                                            t
                                        ) || t('merchant.transactionDetail.methodCard')}
                                        {transaction.card_number && ` **** ${transaction.card_number.slice(-4)}`}
                                    </div>
                                    <div className="fs-6 fw-bold text-gray-400">
                                        {transaction.expiry
                                            ? t('merchant.transactionDetail.cardExpiresAt', {
                                                  expiry: transaction.expiry,
                                              })
                                            : t('merchant.transactionDetail.cardExpiryNotAvailable')}
                                    </div>
                                    <div className="mt-3">
                                        <div className="fs-7 text-muted">
                                            {t('merchant.transactionDetail.paymentTypeInline')}:{' '}
                                            {getTransactionPaymentTypeFieldLabel(transaction.payment_type, t) ||
                                                getTransactionPaymentTypeFieldLabel(
                                                    transaction.transaction_type,
                                                    t
                                                ) ||
                                                t('merchant.common.na')}
                                        </div>
                                        <div className="fs-7 text-muted">
                                            {t('merchant.transactionDetail.paymentMethodInline')}:{' '}
                                            {getPaymentCardBrandOrMethodLabel(
                                                transaction.method ||
                                                    transaction.payment_method?.card_type ||
                                                    transaction.paymentMethod?.card_type,
                                                t
                                            ) || t('merchant.common.na')}
                                        </div>
                                        <div className="fs-7 text-muted">
                                            {t('merchant.transactionDetail.paymentChannelInline')}:{' '}
                                            {(() => {
                                                const ch =
                                                    transaction.paymentMethod?.payment_channel ||
                                                    transaction.payment_method?.payment_channel;
                                                return (
                                                    getPaymentChannelLabel(ch, t) || t('merchant.common.na')
                                                );
                                            })()}
                                        </div>
                                        <div className="fs-7 text-muted">
                                            {t('merchant.transactionDetail.entryModeInline')}:{' '}
                                            {(() => {
                                                const em =
                                                    transaction.paymentMethod?.entry_mode ||
                                                    transaction.payment_method?.entry_mode;
                                                return getEntryModeLabel(em, t) || t('merchant.common.na');
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">
                                {t('merchant.transactionDetail.sectionTransactionDetails')}
                            </div>

                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.rrnId')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.rrn || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.batchNo')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.batch_no || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.trace')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.trace_no || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.approvalCode')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.auth_code || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.deviceAlias')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.terminal_id ||
                                            transaction.terminal?.name ||
                                            t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.sdkId')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.sdk ||
                                            transaction.sdk_id ||
                                            t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-12">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">
                                {t('merchant.transactionDetail.sectionAdditionalInformation')}
                            </div>

                            <div className="row g-4">
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.merchant')}</div>
                                    <div className="fs-6 fw-bold">
                                        {(() => {
                                            const merchantLoading =
                                                transactionMerchantId &&
                                                (merchantInfoLoading || hasPendingRequest(transactionMerchantId));
                                            const info = getMerchantInfo();
                                            if (merchantLoading && !info.merchantName) {
                                                return (
                                                    <span className="text-muted">{t('merchant.common.loading')}</span>
                                                );
                                            }
                                            return info.merchantName;
                                        })()}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.merchantCountry')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {(() => {
                                            const merchantLoading =
                                                transactionMerchantId &&
                                                (merchantInfoLoading || hasPendingRequest(transactionMerchantId));
                                            const info = getMerchantInfo();
                                            if (merchantLoading && !info.countryName) {
                                                return (
                                                    <span className="text-muted">{t('merchant.common.loading')}</span>
                                                );
                                            }
                                            return info.countryName;
                                        })()}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.terminal')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.terminal_id ||
                                            transaction.terminal?.name ||
                                            t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.invoiceNo')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.invoice_no || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.linkedTrans')}</div>
                                    <div className="fs-6 fw-bold">
                                        {t('merchant.transactionDetail.noLinkedTransaction')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.geoFenceResult')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.mid')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.mid || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.tid')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.tid || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.atc')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.atc || t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.createdBy')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.user_name ||
                                            transaction.user?.name ||
                                            t('merchant.transactionDetail.notAvailable')}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.transactionCountry')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {formatCountryNameLabel(transaction.country, i18n.language) ||
                                            t('merchant.common.na')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-12">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5 text-primary">
                                <i className="ki-duotone ki-send fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.transactionDetail.sectionPaymentRequest')}
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.transactionId')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.transaction_id || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.amount')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.currency_symbol || '$'}{' '}
                                        {parseFloat(transaction.original_amount || transaction.amount || 0).toFixed(2)}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.currency')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.currency_symbol || '$'} (
                                        {currency?.currency_code || transaction.currency?.currency_code || 'USD'})
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.requestTimestamp')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.timestamp || transaction.created_at
                                            ? formatDate(transaction.timestamp || transaction.created_at)
                                            : t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.merchantIdMid')}
                                    </div>
                                    <div className="fs-6 fw-bold">{transaction.mid || t('merchant.common.na')}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.terminalIdTid')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.tid || transaction.terminal_id || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.paymentTypeInline')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {getTransactionPaymentTypeFieldLabel(transaction.payment_type, t) ||
                                            getTransactionPaymentTypeFieldLabel(
                                                transaction.transaction_type,
                                                t
                                            ) ||
                                            t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.paymentMethodInline')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {getPaymentCardBrandOrMethodLabel(
                                            transaction.method ||
                                                transaction.payment_method?.card_type ||
                                                transaction.paymentMethod?.card_type,
                                            t
                                        ) || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.paymentChannelInline')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {getPaymentChannelLabel(
                                            transaction.paymentMethod?.payment_channel ||
                                                transaction.payment_method?.payment_channel,
                                            t
                                        ) || t('merchant.common.na')}
                                    </div>
                                </div>
                                {(transaction.paymentMethod || transaction.payment_method) && (
                                    <>
                                        <div className="col-md-4">
                                            <div className="fs-7 text-muted">
                                                {t('merchant.transactionDetail.cardholderName')}
                                            </div>
                                            <div className="fs-6 fw-bold">
                                                {transaction.paymentMethod?.cardholder_name ||
                                                    transaction.payment_method?.cardholder_name ||
                                                    t('merchant.common.na')}
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="fs-7 text-muted">{t('merchant.transactionDetail.entryMode')}</div>
                                            <div className="fs-6 fw-bold">
                                                {getEntryModeLabel(
                                                    transaction.paymentMethod?.entry_mode ||
                                                        transaction.payment_method?.entry_mode,
                                                    t
                                                ) || t('merchant.common.na')}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4 mb-5">
                <div className="col-xl-12">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5 text-success">
                                <i className="ki-duotone ki-message-text-2 fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.transactionDetail.sectionPaymentResponse')}
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.sdkStatus')}</div>
                                    <div className="fs-6 fw-bold">
                                        <span className={`badge badge-light-${getStatusClass(transaction.state || transaction.status)}`}>
                                            {transaction.state || transaction.status
                                                ? getTransactionStatusLabel(
                                                      transaction.state || transaction.status,
                                                      t
                                                  )
                                                : t('merchant.common.na')}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.rrnId')}</div>
                                    <div className="fs-6 fw-bold">{transaction.rrn || t('merchant.common.na')}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.approvalCode')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.auth_code || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.merchantIdMid')}</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || t('merchant.common.na')}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.terminalIdTid')}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.tid || transaction.terminal_id || t('merchant.common.na')}
                                    </div>
                                </div>
                                {(transaction.sdk || transaction.sdk_id) && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t('merchant.transactionDetail.sdkId')}</div>
                                        <div className="fs-6 fw-bold">{transaction.sdk || transaction.sdk_id}</div>
                                    </div>
                                )}
                                {transaction.atc && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t('merchant.transactionDetail.atc')}</div>
                                        <div className="fs-6 fw-bold">{transaction.atc}</div>
                                    </div>
                                )}
                                {transaction.tvr && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">TVR</div>
                                        <div className="fs-6 fw-bold">{transaction.tvr}</div>
                                    </div>
                                )}
                                {transaction.tsi && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">TSI</div>
                                        <div className="fs-6 fw-bold">{transaction.tsi}</div>
                                    </div>
                                )}
                                {transaction.app_name && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">
                                            {t('merchant.transactionDetail.applicationName')}
                                        </div>
                                        <div className="fs-6 fw-bold">{transaction.app_name}</div>
                                    </div>
                                )}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.paymentTypeInline')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {getTransactionPaymentTypeFieldLabel(transaction.payment_type, t) ||
                                            getTransactionPaymentTypeFieldLabel(
                                                transaction.transaction_type,
                                                t
                                            ) ||
                                            t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.paymentMethodInline')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {getPaymentCardBrandOrMethodLabel(
                                            transaction.method ||
                                                transaction.payment_method?.card_type ||
                                                transaction.paymentMethod?.card_type,
                                            t
                                        ) || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">
                                        {t('merchant.transactionDetail.paymentChannelInline')}
                                    </div>
                                    <div className="fs-6 fw-bold">
                                        {getPaymentChannelLabel(
                                            transaction.paymentMethod?.payment_channel ||
                                                transaction.payment_method?.payment_channel,
                                            t
                                        ) || t('merchant.common.na')}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t('merchant.transactionDetail.entryMode')}</div>
                                    <div className="fs-6 fw-bold">
                                        {getEntryModeLabel(
                                            transaction.paymentMethod?.entry_mode ||
                                                transaction.payment_method?.entry_mode,
                                            t
                                        ) || t('merchant.common.na')}
                                    </div>
                                </div>
                                {(transaction.decline_reason || transaction.error_message) && (
                                    <div className="col-md-8">
                                        <div className="fs-7 text-muted">
                                            {t('merchant.transactionDetail.gatewayResponse')}
                                        </div>
                                        <div className="fs-6 fw-bold text-wrap">
                                            {transaction.decline_reason || transaction.error_message}
                                        </div>
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

