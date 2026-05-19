import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getTransactionStatusLabel } from '../../../utils/transactionStatusHelpers';
import { getServiceTransactionStatusLabel } from '../../../utils/serviceTransactionStatusHelpers';

const STD_NS = 'admin.serviceTransactionDetail';

const JsonBlock = ({ value }) => (
    <pre className="bg-light p-4 rounded fs-7 mb-0" style={{ maxHeight: 420, overflow: 'auto' }}>
        {JSON.stringify(value ?? {}, null, 2)}
    </pre>
);

const getStatusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'success';
    if (s === 'failed') return 'danger';
    if (s === 'pending') return 'warning';
    return 'secondary';
};

function pickLocalized(value, lang) {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (lang === 'ar') return value.ar || value.en || '';
        return value.en || value.ar || '';
    }
    return '';
}

const AdminServiceTransactionDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);

    const na = t('admin.common.na');

    const getServiceStatusLabel = useCallback(
        (status) => {
            const s = String(status || '').toLowerCase();
            const map = {
                pending: 'admin.serviceTransactionsIndex.statusPending',
                completed: 'admin.serviceTransactionsIndex.statusCompleted',
                failed: 'admin.serviceTransactionsIndex.statusFailed',
                skipped: 'admin.serviceTransactionsIndex.statusSkipped',
            };
            if (map[s]) return t(map[s]);
            return status ? String(status) : na;
        },
        [t, na]
    );

    useEffect(() => {
        setTitle(t(`${STD_NS}.title`));
        setActions(
            <div className="d-flex gap-2">
                {item?.transaction?.id && (
                    <button
                        className="btn btn-sm btn-light-primary"
                        onClick={() => navigate(`/admin/transactions/${item.transaction.id}`)}
                    >
                        {t(`${STD_NS}.transactionDetails`)}
                    </button>
                )}
                <button className="btn btn-sm btn-light" onClick={() => navigate('/admin/service-transactions')}>
                    {t(`${STD_NS}.back`)}
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate, item, t]);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_TRANSACTION_DETAILS(id), {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            setItem(response.data?.data || null);
        } catch (error) {
            console.error('Error fetching service transaction detail:', error);
            toast.error(t(`${STD_NS}.loadFailed`));
        } finally {
            setLoading(false);
        }
    };

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

                <div className="row g-5 g-xl-8 mt-4">
                    <div className="col-md-12">
                        <div className="card bg-light-secondary card-xl-stretch mb-xl-8">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className="skeleton mb-2" style={{ width: 200, height: 28 }}></div>
                                        <div className="skeleton mb-2" style={{ width: 250, height: 16 }}></div>
                                        <div className="skeleton" style={{ width: 170, height: 14 }}></div>
                                    </div>
                                    <div className="text-end">
                                        <div className="skeleton mb-2" style={{ width: 180, height: 20 }}></div>
                                        <div className="skeleton" style={{ width: 140, height: 14 }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row gx-9 gy-6">
                    <div className="col-xl-6">
                        <div className="card card-dashed h-xl-100 p-6">
                            <div className="skeleton mb-5" style={{ width: 180, height: 22 }}></div>
                            <div className="skeleton mb-3" style={{ width: '100%', height: 16 }}></div>
                            <div className="skeleton" style={{ width: '80%', height: 16 }}></div>
                        </div>
                    </div>
                    <div className="col-xl-6">
                        <div className="card card-dashed h-xl-100 p-6">
                            <div className="skeleton mb-5" style={{ width: 180, height: 22 }}></div>
                            <div className="skeleton mb-3" style={{ width: '100%', height: 16 }}></div>
                            <div className="skeleton" style={{ width: '80%', height: 16 }}></div>
                        </div>
                    </div>
                </div>

                <div className="row gx-9 gy-6 mt-4">
                    <div className="col-xl-12">
                        <div className="card card-dashed p-6">
                            <div className="skeleton mb-4" style={{ width: 220, height: 22 }}></div>
                            <div className="row g-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div className="col-md-3" key={i}>
                                        <div className="skeleton mb-2" style={{ width: 120, height: 12 }}></div>
                                        <div className="skeleton" style={{ width: '90%', height: 16 }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row gx-9 gy-6 mt-4 mb-5">
                    <div className="col-xl-6">
                        <div className="card card-dashed h-xl-100">
                            <div className="card-header">
                                <div className="skeleton" style={{ width: 180, height: 20 }}></div>
                            </div>
                            <div className="card-body">
                                <div className="skeleton" style={{ width: '100%', height: 260 }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-6">
                        <div className="card card-dashed h-xl-100">
                            <div className="card-header">
                                <div className="skeleton" style={{ width: 180, height: 20 }}></div>
                            </div>
                            <div className="card-body">
                                <div className="skeleton" style={{ width: '100%', height: 260 }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!item) {
        return (
            <div className="card">
                <div className="card-body py-10 text-center">{t(`${STD_NS}.notFound`)}</div>
            </div>
        );
    }

    const lang = i18n.language;
    const serviceName =
        item.service_name ||
        pickLocalized(item.service?.service_name, lang) ||
        na;
    const productName =
        item.product_name ||
        pickLocalized(item.product?.name, lang) ||
        na;
    const merchantName =
        item.merchant_name ||
        item.merchant?.business_name ||
        item.merchant?.name ||
        na;
    const partnerName =
        item.partner_name ||
        item.partner?.name ||
        item.partner?.business_name ||
        na;

    const txStatus = item.transaction?.status;
    const txStatusLabel = txStatus ? getTransactionStatusLabel(txStatus, t) || txStatus : na;

    return (
        <>
            <div className="row g-5 g-xl-8 mt-4">
                <div className="col-md-12">
                    <div className={`card bg-light-${getStatusClass(item.status)} hoverable card-xl-stretch mb-xl-8`}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="text-black fw-bolder fs-2 mb-2 text-capitalize">
                                        {getServiceTransactionStatusLabel(item.status, t) || na}
                                    </div>
                                    <div className="fw-bold text-black">
                                        {t(`${STD_NS}.serviceTransactionId`, { id: item.id })}
                                    </div>
                                    <div className="text-muted fs-6">
                                        {item.created_at
                                            ? new Date(item.created_at).toLocaleString(lang)
                                            : na}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="fw-bold text-black fs-5">{serviceName}</div>
                                    <div className="text-muted">{productName}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6">
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 p-6">
                        <div className="fs-4 fw-bolder mb-5">{t(`${STD_NS}.sectionMerchantPartner`)}</div>
                        <div className="row g-4">
                            <div className="col-12">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.merchant`)}</div>
                                <div className="fs-6 fw-bold">{merchantName}</div>
                            </div>
                            <div className="col-12">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.partner`)}</div>
                                <div className="fs-6 fw-bold">{partnerName}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 p-6">
                        <div className="fs-4 fw-bolder mb-5">{t(`${STD_NS}.sectionServiceProduct`)}</div>
                        <div className="row g-4">
                            <div className="col-12">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.service`)}</div>
                                <div className="fs-6 fw-bold">{serviceName}</div>
                            </div>
                            <div className="col-12">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.product`)}</div>
                                <div className="fs-6 fw-bold">{productName}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-12">
                    <div className="card card-dashed p-6">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="fs-4 fw-bolder">{t(`${STD_NS}.sectionBasePosTransaction`)}</div>
                            {item.transaction?.id && (
                                <button
                                    className="btn btn-sm btn-light-primary"
                                    onClick={() => navigate(`/admin/transactions/${item.transaction.id}`)}
                                >
                                    {t(`${STD_NS}.openTransactionDetails`)}
                                </button>
                            )}
                        </div>
                        <div className="row g-4">
                            <div className="col-md-3">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.transactionId`)}</div>
                                <div className="fs-6 fw-bold">
                                    {item.transaction?.transaction_id || item.transaction_id || na}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.status`)}</div>
                                <div className="fs-6 fw-bold">{txStatusLabel}</div>
                            </div>
                            <div className="col-md-3">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.amount`)}</div>
                                <div className="fs-6 fw-bold">
                                    {item.transaction?.currency_symbol || '$'}{' '}
                                    {item.transaction?.amount || '0.00'}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="fs-7 text-muted">{t(`${STD_NS}.created`)}</div>
                                <div className="fs-6 fw-bold">
                                    {item.transaction?.created_at
                                        ? new Date(item.transaction.created_at).toLocaleString(lang)
                                        : na}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4 mb-5">
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100">
                        <div className="card-header">
                            <h3 className="card-title text-primary">{t(`${STD_NS}.userRequestPayload`)}</h3>
                        </div>
                        <div className="card-body">
                            <JsonBlock value={item.request_payload} />
                        </div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100">
                        <div className="card-header">
                            <h3 className="card-title text-success">{t(`${STD_NS}.thirdPartyResponse`)}</h3>
                        </div>
                        <div className="card-body">
                            <JsonBlock value={item.service_response} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminServiceTransactionDetail;
