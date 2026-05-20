import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import {
    fetchAdminTransactionDetails,
    sendAdminTransactionReceipt,
    refundAdminTransaction,
    voidAdminTransaction,
} from '../../../services/adminTransactionsService';
import { AdminTransactionDetailModel } from '../../../services/AdminTransactionModel';
import ContentProviderModel from '../../../services/ContentProviderModel';
import ServiceModel from '../../../services/ServiceModel';
import { getTransactionStatusLabel } from '../../../utils/transactionStatusHelpers';
import {
    getPaymentCardBrandOrMethodLabel,
    getPaymentChannelLabel,
    getEntryModeLabel,
    getTransactionPaymentTypeFieldLabel,
} from '../../../utils/transactionPaymentHelpers';

const TD_NS = 'admin.transactionDetail';

const AdminTransactionDetail = () => {
    const { t, i18n } = useTranslation();
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

    const na = t('admin.common.na');

    const detail = useMemo(
        () => (transaction ? AdminTransactionDetailModel.ensure(transaction) : null),
        [transaction]
    );

    const getMerchantInfo = useCallback(() => {
        if (!detail) {
            return { merchantName: na, countryName: na };
        }
        return {
            merchantName: detail.getMerchantName(na),
            countryName: detail.getMerchantCountryName(i18n.language, na),
        };
    }, [detail, i18n.language, na]);

    /** Opens SoftPOS invoice page; URL segment should use encrypted transaction id. */
    const handleViewReceipt = useCallback(() => {
        const invoiceToken =
            transaction?.transaction_encrypted_id ||
            transaction?.encrypted_id ||
            transaction?.id;
        if (!invoiceToken) {
            toast.error(t(`${TD_NS}.invoiceLinkNotAvailable`));
            return;
        }
        const invoiceUrl = `/pos-invoice/${encodeURIComponent(String(invoiceToken))}`;
        try {
            const newWindow = window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                toast.error(t(`${TD_NS}.allowPopupsForInvoice`));
            }
        } catch (error) {
            console.error('Error opening invoice page:', error);
            toast.error(t(`${TD_NS}.unableToOpenInvoice`));
        }
    }, [transaction, t]);

    useEffect(() => {
        if (transaction) {
            setTitle(t(`${TD_NS}.title`, { id: transaction.transaction_id || id }));
        } else {
            setTitle(t(`${TD_NS}.pageTitle`));
        }
        return () => setActions(null);
    }, [setTitle, setActions, transaction, id, t]);

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
                        {t(`${TD_NS}.sendReceipt`)}
                    </button>
                    
                    <button
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={handleViewReceipt}
                    >
                        <i className="ki-duotone ki-eye fs-3"></i>
                        {t(`${TD_NS}.viewReceipt`)}
                    </button>
                    
                    {canRefundTransaction && (
                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => setShowRefundModal(true)}
                            disabled={!canRefund}
                        >
                            <i className="ki-duotone ki-arrow-left fs-3"></i>
                            {t(`${TD_NS}.refund`)}
                        </button>
                    )}
                    
                    {canVoidTransaction && (
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={handleVoid}
                            disabled={!canVoid}
                        >
                            <i className="ki-duotone ki-cross fs-3"></i>
                            {t(`${TD_NS}.void`)}
                        </button>
                    )}
                </div>
            );
        }
    }, [transaction, canRefundTransaction, canVoidTransaction, handleViewReceipt, t]);

    const fetchTransaction = async () => {
        setLoading(true);
        try {
            const transactionData = await fetchAdminTransactionDetails(id);
            setTransaction(transactionData);
            setCurrency(transactionData.currency || null);
        } catch (error) {
            console.error('Error fetching transaction:', error);
            toast.error(t(`${TD_NS}.loadFailed`));
        } finally {
            setLoading(false);
        }
    };

    const handleSendReceipt = async () => {
        const result = await Swal.fire({
            title: t(`${TD_NS}.sendReceiptTitle`),
            html: `
                <input type="email" id="swal-email" class="swal2-input" placeholder="${t(`${TD_NS}.emailPlaceholder`)}" required>
                <textarea id="swal-message" class="swal2-textarea" placeholder="${t(`${TD_NS}.messagePlaceholder`)}"></textarea>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t(`${TD_NS}.sendConfirm`),
            cancelButtonText: t('admin.common.cancel'),
            preConfirm: () => {
                const email = document.getElementById('swal-email').value;
                const message = document.getElementById('swal-message').value;
                if (!email) {
                    Swal.showValidationMessage(t(`${TD_NS}.emailRequired`));
                }
                return { email, message };
            }
        });

        if (result.isConfirmed) {
            try {
                const response = await sendAdminTransactionReceipt(id, {
                    email: result.value.email,
                    message: result.value.message,
                });

                toast.success(response.message || t(`${TD_NS}.receiptSentSuccess`));
            } catch (error) {
                console.error('Send receipt error:', error);
                toast.error(error.response?.data?.message || t(`${TD_NS}.receiptSentFailed`));
            }
        }
    };

    const handleRefund = async () => {
        if (!refundAmount || !refundReason) {
            toast.error(t(`${TD_NS}.fillAllFieldsRequired`));
            return;
        }

        try {
            const response = await refundAdminTransaction(id, {
                amount: refundAmount,
                reason: refundReason,
            });

            toast.success(response.message || t(`${TD_NS}.refundSuccess`));
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundReason('');
            fetchTransaction();
        } catch (error) {
            console.error('Refund error:', error);
            toast.error(error.response?.data?.message || t(`${TD_NS}.refundFailed`));
        }
    };

    const handleVoid = async () => {
        const result = await Swal.fire({
            title: t(`${TD_NS}.voidTitle`),
            text: t(`${TD_NS}.voidConfirmText`),
            icon: 'warning',
            input: 'textarea',
            inputLabel: t(`${TD_NS}.voidReasonLabel`),
            inputPlaceholder: t(`${TD_NS}.voidPlaceholder`),
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t(`${TD_NS}.voidConfirm`),
            cancelButtonText: t('admin.common.cancel')
        });

        if (result.isConfirmed) {
            try {
                const response = await voidAdminTransaction(id, {
                    reason: result.value,
                });

                toast.success(response.message || t(`${TD_NS}.voidSuccess`));
                fetchTransaction();
            } catch (error) {
                console.error('Void error:', error);
                toast.error(error.response?.data?.message || t(`${TD_NS}.voidFailed`));
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
                    <p>{t(`${TD_NS}.notFoundTitle`)}</p>
                </div>
            </div>
        );
    }

    const getStatusClass = (status) => {
        return status === 'approved' || status === 'APPROVED' ? 'success' : 
               status === 'declined' || status === 'DECLINED' ? 'danger' : 'warning';
    };

    const partner = detail?.getPartner() || (transaction?.partner ? ContentProviderModel.ensure(transaction.partner) : null);
    const service = detail?.getService() || (transaction?.service ? ServiceModel.fromApiResponse(transaction.service) : null);
    const notAvail = t(`${TD_NS}.notAvailable`);

    const paymentChannelRaw =
        transaction.paymentMethod?.payment_channel || transaction.payment_method?.payment_channel;
    const entryModeRaw =
        transaction.paymentMethod?.entry_mode || transaction.payment_method?.entry_mode;
    const paymentMethodRaw =
        transaction.method ||
        transaction.payment_method?.card_type ||
        transaction.paymentMethod?.card_type;

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
                                        {getTransactionStatusLabel(transaction.status, t) || transaction.status}
                                        {(transaction.status === 'approved' || transaction.status === 'APPROVED') && (
                                            <span className="badge badge-light-success fs-6 ms-2">
                                                {t(`${TD_NS}.badgeNumber`)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {t(`${TD_NS}.typeAndTransactionId`, {
                                            type: transaction.transaction_type || na,
                                            id: transaction.transaction_id || na,
                                        })}
                                    </div>
                                    <div className="text-muted fs-6">
                                        {transaction.created_at
                                            ? `${new Date(transaction.created_at).toLocaleString(i18n.language)} ${t(`${TD_NS}.gmtSuffix`)}`
                                            : na}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="text-black fw-bolder fs-1 mb-2">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {currency?.currency_code || t(`${TD_NS}.defaultCurrencyCode`)}
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
                                {transaction.paymentMethod?.cardholder_name ||
                                    transaction.payment_method?.cardholder_name ||
                                    t(`${TD_NS}.cardInformation`)}
                                <span className="badge badge-light-primary fs-7 ms-2">
                                    {transaction.transaction_type || na}
                                </span>
                            </div>
                            
                            <div className="d-flex align-items-center">
                                <div className="me-4 w-50px h-35px bg-light-primary rounded d-flex align-items-center justify-content-center">
                                    <i className="ki-duotone ki-credit-cart fs-2x text-primary"></i>
                                </div>
                                
                                <div>
                                    <div className="fs-4 fw-bolder">
                                        {getPaymentCardBrandOrMethodLabel(paymentMethodRaw, t, TD_NS) ||
                                            t(`${TD_NS}.methodCard`)}
                                        {transaction.card_number &&
                                            t(`${TD_NS}.cardMaskedLast4`, {
                                                last4: transaction.card_number.slice(-4),
                                            })}
                                    </div>
                                    <div className="fs-6 fw-bold text-gray-400">
                                        {transaction.expiry
                                            ? t(`${TD_NS}.cardExpiresAt`, { expiry: transaction.expiry })
                                            : t(`${TD_NS}.cardExpiryNotAvailable`)}
                                    </div>
                                    <div className="mt-3">
                                        <div className="fs-7 text-muted">
                                            {t(`${TD_NS}.paymentTypeInline`)}:{' '}
                                            {getTransactionPaymentTypeFieldLabel(transaction.payment_type, t) ||
                                                getTransactionPaymentTypeFieldLabel(transaction.transaction_type, t) ||
                                                na}
                                        </div>
                                        <div className="fs-7 text-muted">
                                            {t(`${TD_NS}.paymentMethodInline`)}:{' '}
                                            {getPaymentCardBrandOrMethodLabel(paymentMethodRaw, t, TD_NS) || na}
                                        </div>
                                        <div className="fs-7 text-muted">
                                            {t(`${TD_NS}.paymentChannelInline`)}:{' '}
                                            {getPaymentChannelLabel(paymentChannelRaw, t, TD_NS) || na}
                                        </div>
                                        <div className="fs-7 text-muted">
                                            {t(`${TD_NS}.entryModeInline`)}:{' '}
                                            {getEntryModeLabel(entryModeRaw, t, TD_NS) || na}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Details Section */}
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 flex-row flex-stack flex-wrap p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">{t(`${TD_NS}.sectionTransactionDetails`)}</div>
                            
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.rrnId`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.rrn || notAvail}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.batchNo`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.batch_no || notAvail}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.trace`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.trace_no || notAvail}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.approvalCode`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.auth_code || notAvail}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.deviceAlias`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.terminal_id || notAvail}</div>
                                </div>
                                <div className="col-6">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.sdkId`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.sdk || transaction.sdk_id || notAvail}</div>
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
                            <div className="fs-4 fw-bolder mb-5">{t(`${TD_NS}.sectionAdditionalInformation`)}</div>
                            
                            <div className="row g-4">
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.merchant`)}</div>
                                    <div className="fs-6 fw-bold">{getMerchantInfo().merchantName}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.country`)}</div>
                                    <div className="fs-6 fw-bold">{getMerchantInfo().countryName}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.terminal`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.terminal_id || notAvail}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.invoiceNo`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.invoice_no || notAvail}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.linkedTrans`)}</div>
                                    <div className="fs-6 fw-bold">{t(`${TD_NS}.noLinkedTransaction`)}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.geoFenceResult`)}</div>
                                    <div className="fs-6 fw-bold">{notAvail}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.mid`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || notAvail}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.tid`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.tid || notAvail}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.atc`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.atc || notAvail}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Partner and Service Information */}
            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">{t(`${TD_NS}.sectionPartnerInformation`)}</div>
                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="d-flex align-items-center mb-3">
                                        {(partner?.getLogoCandidate() || partner?.logo_url || partner?.logo) ? (
                                            <img
                                                src={partner?.getLogoCandidate() || partner?.logo_url || partner?.logo}
                                                alt={t(`${TD_NS}.partnerLogoAlt`)}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '8px',
                                                    objectFit: 'cover',
                                                    border: '1px solid #e4e6ef'
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="d-flex align-items-center justify-content-center bg-light-primary text-primary fw-bold"
                                                style={{ width: '48px', height: '48px', borderRadius: '8px' }}
                                            >
                                                P
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.partnerName`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {partner
                                            ? ContentProviderModel.displayName(partner)
                                            : (transaction.partner_name || notAvail)}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.ownerName`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {partner?.owner_name || notAvail}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.description`)}</div>
                                    <div className="fs-6 fw-bold text-wrap">
                                        {partner?.address ||
                                            partner?.business_name ||
                                            partner?.name ||
                                            notAvail}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">Partner ID</div>
                                    <div className="fs-6 fw-bold">{transaction.partner_id || notAvail}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 p-6">
                        <div className="d-flex flex-column py-2 w-100">
                            <div className="fs-4 fw-bolder mb-5">{t(`${TD_NS}.sectionServiceInformation`)}</div>
                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="d-flex align-items-center mb-3">
                                        {(service?.getImagePreviewUrl() || service?.image_url) ? (
                                            <img
                                                src={service?.getImagePreviewUrl() || service?.image_url}
                                                alt={t(`${TD_NS}.serviceImageAlt`)}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '8px',
                                                    objectFit: 'cover',
                                                    border: '1px solid #e4e6ef'
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="d-flex align-items-center justify-content-center bg-light-info text-info fw-bold"
                                                style={{ width: '48px', height: '48px', borderRadius: '8px' }}
                                            >
                                                S
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.serviceCategory`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {service
                                            ? ServiceModel.categoryName(service)
                                            : (transaction.service_category?.name_en ||
                                                transaction.service_category_name ||
                                                notAvail)}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.serviceName`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {service
                                            ? ServiceModel.displayName(service)
                                            : (transaction.service_name || notAvail)}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.description`)}</div>
                                    <div className="fs-6 fw-bold text-wrap">
                                        {service?.description_text ||
                                            service?.description_en ||
                                            (typeof service?.description === 'string'
                                                ? service.description
                                                : service?.description?.en) ||
                                            notAvail}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.serviceId`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.service_id || notAvail}</div>
                                </div>
                                <div className="col-12">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.serviceCategoryId`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.service_category_id || notAvail}</div>
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
                                {t(`${TD_NS}.sectionPaymentRequest`)}
                            </div>

                            <div className="row g-4">
                                {/* Core request details */}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.transactionId`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.transaction_id || na}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.amount`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.original_amount || transaction.amount || 0).toFixed(2)}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.currency`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {(transaction.currency_symbol || '$')} ({currency?.currency_code || transaction.currency?.currency_code || t(`${TD_NS}.defaultCurrencyCode`)})
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.requestTimestamp`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.timestamp || transaction.created_at
                                            ? new Date(transaction.timestamp || transaction.created_at).toLocaleString(i18n.language)
                                            : na}
                                    </div>
                                </div>

                                {/* Merchant / terminal on request */}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.merchantIdMid`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || na}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.terminalIdTid`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.tid || transaction.terminal_id || na}</div>
                                </div>

                                {/* Payment routing on request */}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.paymentTypeInline`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {getTransactionPaymentTypeFieldLabel(transaction.payment_type, t) ||
                                            getTransactionPaymentTypeFieldLabel(transaction.transaction_type, t) ||
                                            na}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.paymentMethodInline`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.method || transaction.payment_method?.card_type || transaction.paymentMethod?.card_type || na}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.paymentChannelInline`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.paymentMethod?.payment_channel || transaction.payment_method?.payment_channel || na}
                                    </div>
                                </div>

                                {/* Cardholder & entry details */}
                                {(transaction.paymentMethod || transaction.payment_method) && (
                                    <>
                                        <div className="col-md-4">
                                            <div className="fs-7 text-muted">{t(`${TD_NS}.cardholderName`)}</div>
                                            <div className="fs-6 fw-bold">
                                                {transaction.paymentMethod?.cardholder_name || transaction.payment_method?.cardholder_name || na}
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="fs-7 text-muted">{t(`${TD_NS}.entryMode`)}</div>
                                            <div className="fs-6 fw-bold">
                                                {getEntryModeLabel(entryModeRaw, t, TD_NS) || na}
                                            </div>
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
                                {t(`${TD_NS}.sectionPaymentResponse`)}
                            </div>

                            <div className="row g-4">
                                {/* Status / basic identifiers */}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.sdkStatus`)}</div>
                                    <div className="fs-6 fw-bold">
                                        <span className={`badge badge-light-${getStatusClass(transaction.state || transaction.status)}`}>
                                            {getTransactionStatusLabel(transaction.state || transaction.status, t) ||
                                                (transaction.state || transaction.status || na)}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.rrnId`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.rrn || na}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.approvalCode`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.auth_code || na}</div>
                                </div>

                                {/* Merchant / terminal / routing */}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.merchantIdMid`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.mid || na}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.terminalIdTid`)}</div>
                                    <div className="fs-6 fw-bold">{transaction.tid || transaction.terminal_id || na}</div>
                                </div>
                                {(transaction.sdk || transaction.sdk_id) && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t(`${TD_NS}.sdkId`)}</div>
                                        <div className="fs-6 fw-bold">{transaction.sdk || transaction.sdk_id}</div>
                                    </div>
                                )}

                                {/* Card / EMV technical data */}
                                {transaction.atc && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t(`${TD_NS}.atc`)}</div>
                                        <div className="fs-6 fw-bold">{transaction.atc}</div>
                                    </div>
                                )}
                                {transaction.tvr && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t(`${TD_NS}.fieldTvr`)}</div>
                                        <div className="fs-6 fw-bold">{transaction.tvr}</div>
                                    </div>
                                )}
                                {transaction.tsi && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t(`${TD_NS}.fieldTsi`)}</div>
                                        <div className="fs-6 fw-bold">{transaction.tsi}</div>
                                    </div>
                                )}
                                {transaction.app_name && (
                                    <div className="col-md-4">
                                        <div className="fs-7 text-muted">{t(`${TD_NS}.applicationName`)}</div>
                                        <div className="fs-6 fw-bold">{transaction.app_name}</div>
                                    </div>
                                )}

                                {/* Payment method breakdown */}
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.paymentTypeInline`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {getTransactionPaymentTypeFieldLabel(transaction.payment_type, t) ||
                                            getTransactionPaymentTypeFieldLabel(transaction.transaction_type, t) ||
                                            na}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.paymentMethodInline`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.method || transaction.payment_method?.card_type || transaction.paymentMethod?.card_type || na}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.paymentChannelInline`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {transaction.paymentMethod?.payment_channel || transaction.payment_method?.payment_channel || na}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fs-7 text-muted">{t(`${TD_NS}.entryMode`)}</div>
                                    <div className="fs-6 fw-bold">
                                        {getEntryModeLabel(entryModeRaw, t, TD_NS) || na}
                                    </div>
                                </div>

                                {/* Response / error details */}
                                {(transaction.decline_reason || transaction.error_message) && (
                                    <div className="col-md-8">
                                        <div className="fs-7 text-muted">{t(`${TD_NS}.gatewayResponse`)}</div>
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

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t(`${TD_NS}.refundTitle`)}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowRefundModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">{t(`${TD_NS}.transactionId`)}</span>
                                    <span className="badge bg-light-primary">{transaction.transaction_id}</span>
                                </div>
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">{t(`${TD_NS}.amount`)}</span>
                                    <span className="badge bg-light-info">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">{t(`${TD_NS}.refundableAmount`)}</span>
                                    <span className="badge bg-light-success">
                                        {transaction.currency_symbol || '$'} {parseFloat(transaction.refundable_amount || transaction.amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="refund-amount" className="form-label">{t(`${TD_NS}.refundAmountLabel`)}</label>
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
                                    <label htmlFor="refund-reason" className="form-label">{t(`${TD_NS}.refundReasonLabel`)}</label>
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
                                    {t('admin.common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={handleRefund}
                                >
                                    {t(`${TD_NS}.refundConfirm`)}
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
