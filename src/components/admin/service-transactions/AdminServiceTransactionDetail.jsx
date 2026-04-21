import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

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

const AdminServiceTransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);

    useEffect(() => {
        setTitle('Service Transaction Details');
        setActions(
            <div className="d-flex gap-2">
                {item?.transaction?.id && (
                    <button className="btn btn-sm btn-light-primary" onClick={() => navigate(`/admin/transactions/${item.transaction.id}`)}>
                        Transaction Details
                    </button>
                )}
                <button className="btn btn-sm btn-light" onClick={() => navigate('/admin/service-transactions')}>
                    Back
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate, item]);

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
            toast.error('Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="card"><div className="card-body py-10 text-center">Loading...</div></div>;
    if (!item) return <div className="card"><div className="card-body py-10 text-center">Not found</div></div>;

    const serviceName = item.service?.service_name?.en || item.service?.service_name?.ar || item.service_id || 'N/A';
    const productName = item.product?.name?.en || item.product?.name?.ar || item.product_id || 'N/A';
    const merchantName = item.merchant?.business_name || item.merchant?.name || item.merchant_id || 'N/A';
    const partnerName = item.partner?.name || item.partner?.business_name || item.partner_id || 'N/A';

    return (
        <>
            <div className="row g-5 g-xl-8 mt-4">
                <div className="col-md-12">
                    <div className={`card bg-light-${getStatusClass(item.status)} hoverable card-xl-stretch mb-xl-8`}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="text-black fw-bolder fs-2 mb-2 text-capitalize">{item.status || 'N/A'}</div>
                                    <div className="fw-bold text-black">Service Transaction #{item.id}</div>
                                    <div className="text-muted fs-6">{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</div>
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
                        <div className="fs-4 fw-bolder mb-5">Merchant & Partner</div>
                        <div className="row g-4">
                            <div className="col-12"><div className="fs-7 text-muted">Merchant</div><div className="fs-6 fw-bold">{merchantName}</div></div>
                            <div className="col-12"><div className="fs-7 text-muted">Partner</div><div className="fs-6 fw-bold">{partnerName}</div></div>
                            <div className="col-12"><div className="fs-7 text-muted">Merchant ID</div><div className="fs-6 fw-bold">{item.merchant_id || 'N/A'}</div></div>
                            <div className="col-12"><div className="fs-7 text-muted">Partner ID</div><div className="fs-6 fw-bold">{item.partner_id || 'N/A'}</div></div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100 p-6">
                        <div className="fs-4 fw-bolder mb-5">Service & Product</div>
                        <div className="row g-4">
                            <div className="col-12"><div className="fs-7 text-muted">Service</div><div className="fs-6 fw-bold">{serviceName}</div></div>
                            <div className="col-12"><div className="fs-7 text-muted">Product</div><div className="fs-6 fw-bold">{productName}</div></div>
                            <div className="col-12"><div className="fs-7 text-muted">Service ID</div><div className="fs-6 fw-bold">{item.service_id || 'N/A'}</div></div>
                            <div className="col-12"><div className="fs-7 text-muted">Product ID</div><div className="fs-6 fw-bold">{item.product_id || 'N/A'}</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4">
                <div className="col-xl-12">
                    <div className="card card-dashed p-6">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="fs-4 fw-bolder">Base POS Transaction</div>
                            {item.transaction?.id && (
                                <button className="btn btn-sm btn-light-primary" onClick={() => navigate(`/admin/transactions/${item.transaction.id}`)}>
                                    Open Transaction Details
                                </button>
                            )}
                        </div>
                        <div className="row g-4">
                            <div className="col-md-3"><div className="fs-7 text-muted">Transaction ID</div><div className="fs-6 fw-bold">{item.transaction?.transaction_id || item.transaction_id || 'N/A'}</div></div>
                            <div className="col-md-3"><div className="fs-7 text-muted">Status</div><div className="fs-6 fw-bold">{item.transaction?.status || 'N/A'}</div></div>
                            <div className="col-md-3"><div className="fs-7 text-muted">Amount</div><div className="fs-6 fw-bold">{item.transaction?.currency_symbol || '$'} {item.transaction?.amount || '0.00'}</div></div>
                            <div className="col-md-3"><div className="fs-7 text-muted">Created</div><div className="fs-6 fw-bold">{item.transaction?.created_at ? new Date(item.transaction.created_at).toLocaleString() : 'N/A'}</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row gx-9 gy-6 mt-4 mb-5">
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100">
                        <div className="card-header"><h3 className="card-title text-primary">User Request Payload</h3></div>
                        <div className="card-body"><JsonBlock value={item.request_payload} /></div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="card card-dashed h-xl-100">
                        <div className="card-header"><h3 className="card-title text-success">Third-Party Response</h3></div>
                        <div className="card-body"><JsonBlock value={item.service_response} /></div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminServiceTransactionDetail;

