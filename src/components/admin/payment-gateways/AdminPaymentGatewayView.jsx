import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateway } from '../../../services/adminPaymentGatewaysService';

const AdminPaymentGatewayView = () => {
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [paymentGateway, setPaymentGateway] = useState(null);

    React.useEffect(() => {
        setTitle('Payment Provider Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to="/admin/payment-gateways" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
                <Link to={`/admin/payment-gateways/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id]);

    useEffect(() => {
        fetchPaymentGateway();
    }, [id]);

    const fetchPaymentGateway = async () => {
        setLoading(true);
        try {
            const response = await getPaymentGateway(id);
            if (response.success) {
                const data = response.data.data?.data || response.data.data;
                setPaymentGateway(data);
            } else {
                toast.error(response.error || 'Failed to fetch payment gateway');
                navigate('/admin/payment-gateways');
            }
        } catch (error) {
            console.error('Error fetching payment gateway:', error);
            toast.error('Failed to fetch payment gateway');
            navigate('/admin/payment-gateways');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!paymentGateway) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <p>Payment gateway not found</p>
                </div>
            </div>
        );
    }

    const logoUrl = paymentGateway.logo 
        ? `/${paymentGateway.logo}`
        : paymentGateway.alias 
            ? `/payment-gateway/${paymentGateway.alias}.png`
            : null;

    const config = paymentGateway.config && typeof paymentGateway.config === 'object'
        ? paymentGateway.config
        : {};

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Payment Provider Details</h3>
            </div>

            <div className="card-body">
                <div className="mb-8">
                    {logoUrl && (
                        <div className="d-flex justify-content-center mb-4">
                            <div className="symbol symbol-100px">
                                <img src={logoUrl} alt={paymentGateway.name} className="w-100" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">Name</label>
                            <div className="form-control form-control-solid">{paymentGateway.name}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">Title</label>
                            <div className="form-control form-control-solid">{paymentGateway.title}</div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">Alias</label>
                            <div className="form-control form-control-solid">{paymentGateway.alias || '-'}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">Mode</label>
                            <div>
                                <span className={`badge badge-${paymentGateway.mode === 'live' ? 'success' : 'warning'}`}>
                                    {paymentGateway.mode}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">Status</label>
                            <div>
                                <span className={`badge badge-${paymentGateway.is_active ? 'success' : 'danger'}`}>
                                    {paymentGateway.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-5">
                            <label className="form-label fw-bold">Created At</label>
                            <div className="form-control form-control-solid">
                                {new Date(paymentGateway.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {Object.keys(config).length > 0 && (
                    <div className="mb-5">
                        <label className="form-label fw-bold mb-4">Configuration</label>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(config).map(([key, value]) => (
                                        <tr key={key}>
                                            <td className="fw-bold">{key}</td>
                                            <td>{String(value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {Object.keys(config).length === 0 && (
                    <div className="mb-5">
                        <label className="form-label fw-bold mb-4">Configuration</label>
                        <div className="form-control form-control-solid">No configuration set</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPaymentGatewayView;
