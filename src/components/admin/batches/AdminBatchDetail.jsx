import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';
import { formatMerchantDateTime } from '../../../utils/dateUtils';
import { getBatchStatusLabel, getSettlementStatusLabel } from '../../../utils/batchHelpers';
import { getTransactionStatusLabel } from '../../../utils/transactionStatusHelpers';

const BD_NS = 'admin.batchDetail';
const BI_NS = 'admin.batchesIndex';
const SI_NS = 'admin.settlementsIndex';

const AdminBatchDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const na = t(`${BI_NS}.na`);
    const canCloseBatch = useCan('pos.batches.close_batches');
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState(null);
    const [currencyLoading, setCurrencyLoading] = useState(false);

    // Extract merchant ID from batch
    const batchMerchantId = useMemo(() => {
        if (!batch) return null;
        const merchantId = batch.merchant?.id || batch.merchant_id;
        return merchantId ? String(merchantId) : null;
    }, [batch]);

    // Fetch merchant and country info using the hook
    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(batchMerchantId ? [batchMerchantId] : []);

    // Helper function to get merchant info
    const getMerchantInfo = useCallback(() => {
        if (!batchMerchantId) {
            return {
                merchantName: batch?.merchant?.business_name || batch?.merchant?.name || na,
                countryName: batch?.merchant?.country?.name || na,
            };
        }

        const record = getMerchantInfoById(batchMerchantId);

        if (record) {
            return {
                merchantName: record.name || batch?.merchant?.business_name || batch?.merchant?.name || na,
                countryName: record.countryName || na,
            };
        }

        return {
            merchantName: batch?.merchant?.business_name || batch?.merchant?.name || na,
            countryName: na,
        };
    }, [batch, batchMerchantId, getMerchantInfoById, na]);

    const formatDate = useCallback(
        (date) => (date ? formatMerchantDateTime(date, i18n.language) : na),
        [i18n.language, na]
    );

    useEffect(() => {
        setTitle(t(`${BD_NS}.details`));
        return () => setActions(null);
    }, [setTitle, setActions, t]);

    useEffect(() => {
        fetchBatch();
    }, [id]);

    useEffect(() => {
        if (batch) {
            const isPending = batch.status?.toLowerCase() === 'pending';
            
            setActions(
                <div className="d-flex align-items-center gap-2 gap-lg-3">
                    <button
                        className="btn btn-sm btn-flex btn-secondary fw-bold"
                        onClick={() => navigate('/admin/batches')}
                    >
                        <i className="ki-duotone ki-arrow-left fs-6 text-muted me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t(`${BD_NS}.backToBatches`)}
                    </button>
                    
                    {isPending && canCloseBatch && (
                        <button
                            className="btn btn-sm btn-flex btn-success fw-bold"
                            onClick={handleProcessSettlement}
                        >
                            <i className="ki-duotone ki-check fs-6 text-white me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t(`${BD_NS}.processSettlement`)}
                        </button>
                    )}
                </div>
            );
        }
    }, [batch, navigate, setActions, t, canCloseBatch]);

    const fetchBatch = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BATCH_DETAILS(id), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const batchData = response.data.data || response.data;
            setBatch(batchData);
            
            // No need to fetch currency separately - we have currency_symbol in batch data
            // If currency_object exists in transactions, parse it for additional details
            if (batchData.currency_object) {
                try {
                    const currencyObj = typeof batchData.currency_object === 'string' 
                        ? JSON.parse(batchData.currency_object) 
                        : batchData.currency_object;
                    setCurrency(currencyObj);
                } catch (e) {
                    console.error('Error parsing currency_object:', e);
                }
            }
        } catch (error) {
            console.error('Error fetching batch:', error);
            toast.error(t(`${BD_NS}.loadFailed`));
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
                {/* Batch Information Card Skeleton */}
                <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                    <div className="col-md-12">
                        <div className="card">
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
                                <div className="d-flex flex-column flex-grow-1">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-100px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-120px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-150px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-50px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="placeholder placeholder-sm w-100px bg-secondary placeholder-wave me-2"></span>
                                        <span className="placeholder placeholder-md w-200px bg-secondary placeholder-wave"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Card Skeleton */}
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <div className="mb-2">
                                <span className="placeholder placeholder-lg w-150px bg-secondary placeholder-wave"></span>
                            </div>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                        <th className="text-dark">{t(`${BD_NS}.transactionId`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.amount`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.status`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.terminal`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.createdAt`)}</th>
                                    </tr>
                                </thead>
                                <tbody className="fw-semibold text-gray-600">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td>
                                                <span className="placeholder placeholder-md w-150px bg-secondary placeholder-wave"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder placeholder-md w-100px bg-secondary placeholder-wave"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder placeholder-sm w-80px bg-secondary placeholder-wave"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder placeholder-md w-120px bg-secondary placeholder-wave"></span>
                                            </td>
                                            <td>
                                                <span className="placeholder placeholder-md w-180px bg-secondary placeholder-wave"></span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!batch) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>{t(`${BD_NS}.notFound`)}</p>
                </div>
            </div>
        );
    }

    const handleProcessSettlement = async () => {
        const result = await Swal.fire({
            title: t(`${BD_NS}.processSettlementTitle`),
            text: t(`${BD_NS}.processSettlementText`),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t(`${BD_NS}.yesProcess`),
            cancelButtonText: t(`${BD_NS}.cancel`)
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                const response = await axios.post(ADMIN_ENDPOINTS.BATCH_PROCESS_SETTLEMENT(id), {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                toast.success(response.data.message || t(`${BD_NS}.processSuccess`));
                fetchBatch();
            } catch (error) {
                console.error('Process settlement error:', error);
                toast.error(error.response?.data?.message || t(`${BD_NS}.processFailed`));
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': 'badge-light-warning',
            'approved': 'badge-light-success',
            'captured': 'badge-light-success',
            'settled': 'badge-light-success',
            'declined': 'badge-light-danger',
            'failed': 'badge-light-danger',
            'voided': 'badge-light-danger',
            'refunded': 'badge-light-danger',
            'cancelled': 'badge-light-danger',
            'expired': 'badge-light-danger',
            'reversed': 'badge-light-danger'
        };
        return statusMap[status?.toLowerCase()] || 'badge-light-secondary';
    };

    return (
        <>
            {/* Batch Information Card */}
            <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header pt-5">
                            <div className="card-title d-flex flex-column">
                                <div className="d-flex align-items-center">
                                    <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                        {batch.batch_number}
                                    </span>
                                </div>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">{t(`${BD_NS}.batchInformation`)}</span>
                            </div>
                        </div>
                        <div className="card-body pt-2 pb-4 d-flex align-items-center">
                            <div className="d-flex flex-column flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.merchant`)}:</span>
                                    <span className="text-dark fw-bold fs-6">
                                        {(() => {
                                            const merchantLoading = batchMerchantId && (merchantInfoLoading || hasPendingRequest(batchMerchantId));
                                            const info = getMerchantInfo();
                                            
                                            if (merchantLoading && !info.merchantName) {
                                                return <div className="skeleton" style={{width: '120px', height: '16px', display: 'inline-block'}}></div>;
                                            }
                                            return info.merchantName;
                                        })()}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.country`)}:</span>
                                    <span className="text-dark fw-bold fs-6">
                                        {(() => {
                                            const merchantLoading = batchMerchantId && (merchantInfoLoading || hasPendingRequest(batchMerchantId));
                                            const info = getMerchantInfo();
                                            
                                            if (merchantLoading && !info.countryName) {
                                                return <div className="skeleton" style={{width: '80px', height: '16px', display: 'inline-block'}}></div>;
                                            }
                                            return info.countryName;
                                        })()}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.status`)}:</span>
                                    <span className={`badge ${getStatusBadge(batch.status)} fs-7`}>
                                        {getBatchStatusLabel(batch.status, t, BD_NS) || getTransactionStatusLabel(batch.status, t) || na}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.totalAmount`)}:</span>
                                    <span className="text-dark fw-bold fs-6">
                                        {batch.currency_symbol || '$'}{parseFloat(batch.total_amount || 0).toFixed(2)} {currency?.currency_code || 'USD'}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.transactionCount`)}:</span>
                                    <span className="text-dark fw-bold fs-6">{batch.transaction_count || 0}</span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.createdAt`)}:</span>
                                    <span className="text-dark fw-bold fs-6">
                                        {formatDate(batch.created_at)}
                                    </span>
                                </div>
                                {batch.settled_at && (
                                    <div className="d-flex align-items-center">
                                        <span className="text-gray-600 fw-semibold fs-6 me-2">{t(`${BD_NS}.settledAt`)}:</span>
                                        <span className="text-dark fw-bold fs-6">
                                            {formatDate(batch.settled_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Card */}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <h3 className="card-title">{t(`${BD_NS}.transactions`)}</h3>
                    </div>
                </div>
                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5" id="transactions-table">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="text-dark">{t(`${BD_NS}.transactionId`)}</th>
                                    <th className="text-dark">{t(`${BD_NS}.amount`)}</th>
                                    <th className="text-dark">{t(`${BD_NS}.status`)}</th>
                                    <th className="text-dark">{t(`${BD_NS}.terminal`)}</th>
                                    <th className="text-dark">{t(`${BD_NS}.createdAt`)}</th>
                                </tr>
                            </thead>
                            <tbody className="fw-semibold text-gray-600">
                                {batch.transactions && batch.transactions.length > 0 ? (
                                    batch.transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="text-dark fw-bold">{transaction.transaction_id}</td>
                                            <td className="text-dark fw-bold">{transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(transaction.status)} fs-7`}>
                                                    {getTransactionStatusLabel(transaction.status, t) || na}
                                                </span>
                                            </td>
                                            <td className="text-dark fw-bold">{transaction.terminal_id || na}</td>
                                            <td className="text-dark fw-bold">
                                                {formatDate(transaction.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted fs-6 py-8">
                                            <i className="ki-duotone ki-document fs-2hx text-muted mb-3">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            <div>{t(`${BD_NS}.noTransactions`)}</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Settlements Card */}
            {batch.settlements && batch.settlements.length > 0 && (
                <div className="card mt-5">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h3 className="card-title">{t(`${BD_NS}.settlements`)}</h3>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                        <th className="text-dark">{t(`${BD_NS}.settlementNumber`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.status`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.amount`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.transactions`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.settledAt`)}</th>
                                        <th className="text-dark">{t(`${BD_NS}.actions`)}</th>
                                    </tr>
                                </thead>
                                <tbody className="fw-semibold text-gray-600">
                                    {batch.settlements.map((settlement) => (
                                        <tr key={settlement.id}>
                                            <td className="text-dark fw-bold">{settlement.settlement_number || settlement.settlement_id}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(settlement.status)} fs-7`}>
                                                    {getSettlementStatusLabel(settlement.status, t, SI_NS) || na}
                                                </span>
                                            </td>
                                            <td className="text-dark fw-bold">{settlement.currency_symbol || '$'}{parseFloat(settlement.total_amount || 0).toFixed(2)}</td>
                                            <td className="text-dark fw-bold">{settlement.transaction_count || 0}</td>
                                            <td className="text-dark fw-bold">
                                                {formatDate(settlement.settled_at)}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                                                    onClick={() => navigate(`/admin/settlements/${settlement.id}`)}
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

export default AdminBatchDetail;
