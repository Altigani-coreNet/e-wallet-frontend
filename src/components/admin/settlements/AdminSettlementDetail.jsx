import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';
import { formatMerchantDateTime } from '../../../utils/dateUtils';
import { getBatchStatusLabel, getSettlementStatusLabel } from '../../../utils/batchHelpers';
import { getTransactionStatusLabel } from '../../../utils/transactionStatusHelpers';

const SD_NS = 'admin.settlementDetail';
const SI_NS = 'admin.settlementsIndex';
const BD_NS = 'admin.batchDetail';

const AdminSettlementDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [settlement, setSettlement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState(null);
    const [currencyLoading, setCurrencyLoading] = useState(false);

    // Extract merchant ID from settlement
    const settlementMerchantId = useMemo(() => {
        if (!settlement) return null;
        const merchantId = settlement.merchant?.id || settlement.merchant_id;
        return merchantId ? String(merchantId) : null;
    }, [settlement]);

    // Fetch merchant and country info using the hook
    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(settlementMerchantId ? [settlementMerchantId] : []);

    // Helper function to get merchant info
    const getMerchantInfo = useCallback(() => {
        if (!settlementMerchantId) {
            return {
                merchantName: settlement?.merchant?.business_name || settlement?.merchant?.name || t('admin.paymentLinksIndex.na'),
                countryName: settlement?.merchant?.country?.name || t('admin.paymentLinksIndex.na'),
            };
        }

        const record = getMerchantInfoById(settlementMerchantId);

        if (record) {
            return {
                merchantName: record.name || settlement?.merchant?.business_name || settlement?.merchant?.name || t('admin.paymentLinksIndex.na'),
                countryName: record.countryName || t('admin.paymentLinksIndex.na'),
            };
        }

        return {
            merchantName: settlement?.merchant?.business_name || settlement?.merchant?.name || t('admin.paymentLinksIndex.na'),
            countryName: t('admin.paymentLinksIndex.na'),
        };
    }, [settlement, settlementMerchantId, getMerchantInfoById, t]);

    const na = t('admin.paymentLinksIndex.na');

    const formatDate = useCallback(
        (date) => (date ? formatMerchantDateTime(date, i18n.language) : na),
        [i18n.language, na]
    );

    useEffect(() => {
        setTitle(t(`${SD_NS}.details`));
        return () => setActions(null);
    }, [setTitle, setActions, t]);

    useEffect(() => {
        fetchSettlement();
    }, [id]);

    useEffect(() => {
        if (settlement) {
            setActions(
                <div className="d-flex align-items-center gap-2 gap-lg-3">
                    <button
                        className="btn btn-sm btn-secondary fw-bold"
                        onClick={() => navigate('/admin/settlements')}
                    >
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t(`${SD_NS}.backToSettlements`)}
                    </button>
                </div>
            );
        }
    }, [settlement, navigate, setActions, t]);

    const fetchSettlement = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENT_DETAILS(id), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const settlementData = response.data.data || response.data;
            setSettlement(settlementData);
            
            // No need to fetch currency separately - we have currency_symbol in settlement data
            // If currency_object exists, parse it for additional details
            if (settlementData.currency_object) {
                try {
                    const currencyObj = typeof settlementData.currency_object === 'string' 
                        ? JSON.parse(settlementData.currency_object) 
                        : settlementData.currency_object;
                    setCurrency(currencyObj);
                } catch (e) {
                    console.error('Error parsing currency_object:', e);
                }
            }
        } catch (error) {
            console.error('Error fetching settlement:', error);
            toast.error(t(`${SD_NS}.loadFailed`));
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

    if (loading) {
        return (
            <>
                {/* First Row Skeleton */}
                <div className="row g-5 g-xl-8 mb-5">
                    {/* Settlement Details Skeleton */}
                    <div className="col-md-6">
                        <div className="card card-flush h-100">
                            <div className="card-header pt-5">
                                <div className="card-title d-flex flex-column">
                                    <div className="mb-2">
                                        <span className="placeholder placeholder-lg w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div>
                                        <span className="placeholder placeholder-sm w-150px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body pt-2 pb-4">
                                <div className="d-flex flex-column flex-grow-1 pe-8">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-100px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-50px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Batch Information Skeleton */}
                    <div className="col-md-6">
                        <div className="card card-flush h-100">
                            <div className="card-header pt-5">
                                <div className="card-title d-flex flex-column">
                                    <div className="mb-2">
                                        <span className="placeholder placeholder-lg w-180px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div>
                                        <span className="placeholder placeholder-sm w-120px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body pt-2 pb-4">
                                <div className="d-flex flex-column flex-grow-1 pe-8">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-100px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-50px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="placeholder placeholder-md w-120px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row Skeleton */}
                <div className="row g-5 g-xl-8 mb-5">
                    {/* Merchant Information Skeleton */}
                    <div className="col-md-6">
                        <div className="card card-flush h-100">
                            <div className="card-header pt-5">
                                <div className="card-title d-flex flex-column">
                                    <div className="mb-2">
                                        <span className="placeholder placeholder-lg w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div>
                                        <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body pt-2 pb-4">
                                <div className="d-flex flex-column flex-grow-1 pe-8">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-60px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-70px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="placeholder placeholder-sm w-120px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-100px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settlement Timeline Skeleton */}
                    <div className="col-md-6">
                        <div className="card card-flush h-100">
                            <div className="card-header pt-5">
                                <div className="card-title d-flex flex-column">
                                    <div className="mb-2">
                                        <span className="placeholder placeholder-lg w-120px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div>
                                        <span className="placeholder placeholder-sm w-150px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body pt-2 pb-4">
                                <div className="d-flex flex-column flex-grow-1 pe-8">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settlement Details Card Skeleton */}
                <div className="card mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-5">
                        <div className="mb-2">
                            <span className="placeholder placeholder-lg w-200px bg-secondary placeholder-wave"></span>
                        </div>
                        <div>
                            <span className="placeholder placeholder-sm w-250px bg-secondary placeholder-wave"></span>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="col-md-6">
                                    <div className="d-flex flex-column mb-7">
                                        <div className="mb-2">
                                            <span className="placeholder placeholder-sm w-150px bg-secondary placeholder-wave"></span>
                                        </div>
                                        <div>
                                            <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!settlement) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>{t(`${SD_NS}.notFound`)}</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': 'badge-light-warning',
            'settled': 'badge-light-success',
            'failed': 'badge-light-danger'
        };
        return statusMap[status?.toLowerCase()] || 'badge-light-secondary';
    };

    return (
        <>
            {/* First Row */}
            <div className="row g-5 g-xl-8 mb-5">
                {/* Settlement Details */}
                <div className="col-md-6">
                    <div className="card card-flush h-100">
                        <div className="card-header pt-5">
                            <div className="card-title d-flex flex-column">
                                <div className="d-flex align-items-center">
                                    <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                        {settlement.settlement_id || settlement.settlement_number}
                                    </span>
                                </div>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">{t(`${SD_NS}.number`)}</span>
                            </div>
                        </div>
                        <div className="card-body pt-2 pb-4 d-flex align-items-center flex-wrap">
                            <div className="d-flex flex-column flex-grow-1 pe-8">
                                <div className="d-flex align-items-center">
                                    <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.statusLabel`)}</span>
                                    <span className={`badge ${getStatusBadge(settlement.status)} fs-7 fw-bold`}>
                                        {getSettlementStatusLabel(settlement.status, t, SI_NS) || na}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mt-2">
                                    <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.amountLabel`)}</span>
                                    <span className="fs-6 fw-bold text-dark">
                                        {settlement.currency_symbol || '$'}{parseFloat(settlement.total_amount || 0).toFixed(2)} {currency?.currency_code || 'USD'}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mt-2">
                                    <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.transactionsLabel`)}</span>
                                    <span className="fs-6 fw-bold text-dark">{settlement.transaction_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Information */}
                {settlement.batch && (
                    <div className="col-md-6">
                        <div className="card card-flush h-100">
                            <div className="card-header pt-5">
                                <div className="card-title d-flex flex-column">
                                    <div className="d-flex align-items-center">
                                        <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                            {settlement.batch.batch_number}
                                        </span>
                                    </div>
                                    <span className="text-gray-400 pt-1 fw-semibold fs-6">{t(`${SD_NS}.relatedBatch`)}</span>
                                </div>
                            </div>
                            <div className="card-body pt-2 pb-4 d-flex align-items-center flex-wrap">
                                <div className="d-flex flex-column flex-grow-1 pe-8">
                                    <div className="d-flex align-items-center">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.statusLabel`)}</span>
                                        <span className={`badge ${getStatusBadge(settlement.batch.status)} fs-7 fw-bold`}>
                                            {getBatchStatusLabel(settlement.batch.status, t, BD_NS) || na}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.amountLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">
                                            {settlement.batch.currency_symbol || '$'}{parseFloat(settlement.batch.total_amount || 0).toFixed(2)} {currency?.currency_code || 'USD'}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.transactionsLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">{settlement.batch.transaction_count || 0}</span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <button
                                            className="btn btn-sm btn-light-primary"
                                            onClick={() => navigate(`/admin/batches/${settlement.batch.id}`)}
                                        >
                                            <i className="ki-duotone ki-eye fs-3">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            {t(`${SD_NS}.viewBatch`)}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Second Row */}
            <div className="row g-5 g-xl-8 mb-5">
                {/* Merchant Information */}
                {settlement.merchant && (
                    <div className="col-md-6">
                        <div className="card card-flush h-100">
                            <div className="card-header pt-5">
                                <div className="card-title d-flex flex-column">
                                    <div className="d-flex align-items-center">
                                        <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                            {settlement.merchant.business_name || settlement.merchant.name}
                                        </span>
                                    </div>
                                    <span className="text-gray-400 pt-1 fw-semibold fs-6">{t(`${SD_NS}.merchant`)}</span>
                                </div>
                            </div>
                            <div className="card-body pt-2 pb-4 d-flex align-items-center flex-wrap">
                                <div className="d-flex flex-column flex-grow-1 pe-8">
                                    <div className="d-flex align-items-center">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.emailLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">{settlement.merchant.email || na}</span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.phoneLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">{settlement.merchant.phone || na}</span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.countryLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">
                                            {(() => {
                                                const merchantLoading = settlementMerchantId && (merchantInfoLoading || hasPendingRequest(settlementMerchantId));
                                                const info = getMerchantInfo();
                                                
                                                if (merchantLoading && !info.countryName) {
                                                    return <div className="skeleton" style={{width: '80px', height: '16px', display: 'inline-block'}}></div>;
                                                }
                                                return info.countryName;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.businessTypeLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">{settlement.merchant.business_type || na}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settlement Timeline */}
                <div className="col-md-6">
                    <div className="card card-flush h-100">
                        <div className="card-header pt-5">
                            <div className="card-title d-flex flex-column">
                                <div className="d-flex align-items-center">
                                    <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">{t(`${SD_NS}.timeline`)}</span>
                                </div>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">{t(`${SD_NS}.history`)}</span>
                            </div>
                        </div>
                        <div className="card-body pt-2 pb-4 d-flex align-items-center flex-wrap">
                            <div className="d-flex flex-column flex-grow-1 pe-8">
                                <div className="d-flex align-items-center">
                                    <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.createdLabel`)}</span>
                                    <span className="fs-6 fw-bold text-dark">
                                        {formatDate(settlement.created_at)}
                                    </span>
                                </div>
                                {settlement.settled_at && (
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.settledLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">
                                            {formatDate(settlement.settled_at)}
                                        </span>
                                    </div>
                                )}
                                {settlement.failed_at && (
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="fs-6 fw-semibold text-gray-400 d-block align-self-start me-2">{t(`${SD_NS}.failedLabel`)}</span>
                                        <span className="fs-6 fw-bold text-dark">
                                            {formatDate(settlement.failed_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settlement Details Card */}
            <div className="card mb-5 mb-xl-8">
                <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold fs-3 mb-1">{t(`${SD_NS}.details`)}</span>
                        <span className="text-muted mt-1 fw-semibold fs-7">{t(`${SD_NS}.completeInfo`)}</span>
                    </h3>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="d-flex flex-column mb-7">
                                <span className="fs-6 fw-semibold mb-2 text-muted">{t(`${SD_NS}.number`)}</span>
                                <span className="fs-5 fw-bold">{settlement.settlement_id || settlement.settlement_number}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex flex-column mb-7">
                                <span className="fs-6 fw-semibold mb-2 text-muted">{t(`${SI_NS}.status`)}</span>
                                <span className="fs-5 fw-bold">
                                    {getSettlementStatusLabel(settlement.status, t, SI_NS) || na}
                                </span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex flex-column mb-7">
                                <span className="fs-6 fw-semibold mb-2 text-muted">{t(`${SD_NS}.totalAmount`)}</span>
                                <span className="fs-5 fw-bold text-success">
                                    {settlement.currency_symbol || '$'}{parseFloat(settlement.total_amount || 0).toFixed(2)} {currency?.currency_code || 'USD'}
                                </span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex flex-column mb-7">
                                <span className="fs-6 fw-semibold mb-2 text-muted">{t(`${SD_NS}.transactionCount`)}</span>
                                <span className="fs-5 fw-bold">{settlement.transaction_count || 0}</span>
                            </div>
                        </div>
                        {settlement.settlement_reference && (
                            <div className="col-md-6">
                                <div className="d-flex flex-column mb-7">
                                    <span className="fs-6 fw-semibold mb-2 text-muted">{t(`${SD_NS}.reference`)}</span>
                                    <span className="fs-5 fw-bold">{settlement.settlement_reference}</span>
                                </div>
                            </div>
                        )}
                        {settlement.notes && (
                            <div className="col-12">
                                <div className="d-flex flex-column mb-7">
                                    <span className="fs-6 fw-semibold mb-2 text-muted">{t(`${SD_NS}.notes`)}</span>
                                    <span className="fs-5">{settlement.notes}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Transactions Card */}
            {settlement.batch?.transactions && settlement.batch.transactions.length > 0 && (
                <div className="card mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold fs-3 mb-1">{t(`${SD_NS}.relatedTransactions`)}</span>
                            <span className="text-muted mt-1 fw-semibold fs-7">{t(`${SD_NS}.transactionsInSettlement`)}</span>
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th className="min-w-150px">{t(`${SD_NS}.transactionId`)}</th>
                                        <th className="min-w-140px">{t(`${SI_NS}.amount`)}</th>
                                        <th className="min-w-120px">{t(`${SI_NS}.status`)}</th>
                                        <th className="min-w-120px">{t(`${SD_NS}.cardNumber`)}</th>
                                        <th className="min-w-100px">{t(`${SI_NS}.createdAt`)}</th>
                                        <th className="min-w-100px text-end">{t(`${SD_NS}.actions`)}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settlement.batch.transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>
                                                <span className="text-dark fw-bold text-hover-primary fs-6">
                                                    {transaction.transaction_id}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-dark fw-bold text-hover-primary fs-6">
                                                    {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(transaction.status)}`}>
                                                    {getTransactionStatusLabel(transaction.status, t) || na}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-dark fw-bold text-hover-primary fs-6">
                                                    {transaction.card_number || na}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-muted fw-semibold text-muted d-block fs-7">
                                                    {formatDate(transaction.created_at)}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                                                    onClick={() => navigate(`/admin/transactions/${transaction.id}`)}
                                                >
                                                    <i className="ki-duotone ki-eye fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminSettlementDetail;
