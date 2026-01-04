import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSettlementDetails } from '../../../services/settlementsService';
import { useToolbar } from '../../../contexts/ToolbarContext';

const SettlementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Use React Query hook
    const { data: settlement, isLoading: loading } = useSettlementDetails(id);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        if (settlement) {
            setTitle(`Settlement Details - ${settlement.settlement_number || id}`);
            
            setBreadcrumbs([
                { label: 'Dashboard', path: '/merchant/dashboard' },
                { label: 'Settlements', path: '/merchant/settlements' },
                { label: settlement.settlement_number || 'Settlement Details', path: `/merchant/settlements/${id}`, active: true }
            ]);
            
            setActions(
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
            );
        }

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [settlement, id, navigate, setTitle, setBreadcrumbs, setActions]);

    // Get status badge color
    const getStatusColor = (status) => {
        const statusMap = {
            'pending': 'warning',
            'settled': 'success',
            'failed': 'danger'
        };
        return statusMap[status?.toLowerCase()] || 'secondary';
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
            second: '2-digit',
            hour12: false
        }).replace(',', '');
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

                {/* Settlement Info Card Skeleton */}
                <div className="card mb-5">
                    <div className="card-header">
                        <div className="skeleton" style={{width: '200px', height: '24px'}}></div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <div className="col-md-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="mb-5">
                                        <div className="skeleton" style={{width: '100px', height: '16px', marginBottom: '8px'}}></div>
                                        <div className="skeleton" style={{width: '180px', height: '18px'}}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="col-md-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="mb-5">
                                        <div className="skeleton" style={{width: '100px', height: '16px', marginBottom: '8px'}}></div>
                                        <div className="skeleton" style={{width: '180px', height: '18px'}}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Transactions Card Skeleton */}
                <div className="card">
                    <div className="card-header">
                        <div className="skeleton" style={{width: '180px', height: '24px'}}></div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th><div className="skeleton" style={{width: '100px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '70px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '70px', height: '14px'}}></div></th>
                                        <th><div className="skeleton" style={{width: '80px', height: '14px'}}></div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map((i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '140px', height: '16px'}}></div></td>
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

    if (!settlement) {
        return (
            <div className="card">
                <div className="card-body text-center py-20">
                    <i className="ki-duotone ki-information-5 fs-3x text-muted mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <h3 className="text-gray-800 mb-2">Settlement Not Found</h3>
                    <p className="text-gray-600 mb-5">The settlement you're looking for doesn't exist or you don't have access to it.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/settlements')}>
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Back to Settlements
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Settlement Info Card */}
            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">Settlement Information</h3>
                </div>
                <div className="card-body">
                    <div className="row mb-7">
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label fw-bold">Settlement Number</label>
                                <div className="text-gray-800">{settlement.settlement_number || 'N/A'}</div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label fw-bold">Merchant</label>
                                <div className="text-gray-800">{settlement.merchant?.name || 'N/A'}</div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label fw-bold">Batch Number</label>
                                <div className="text-gray-800">{settlement.batch?.batch_number || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label fw-bold">Status</label>
                                <div>
                                    <span className={`badge badge-light-${getStatusColor(settlement.status)}`}>
                                        {settlement.status ? settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label fw-bold">Total Amount</label>
                                <div className="text-gray-800">
                                    {settlement.currency_symbol || '$'}{parseFloat(settlement.total_amount || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label fw-bold">Settlement Date</label>
                                <div className="text-gray-800">
                                    {settlement.settlement_date ? new Date(settlement.settlement_date).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="mb-5">
                                <label className="form-label fw-bold">Created At</label>
                                <div className="text-gray-800">
                                    {formatDate(settlement.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Transactions (if available) */}
            {settlement.batch?.transactions && settlement.batch.transactions.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Batch Transactions</h3>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>Transaction ID</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settlement.batch.transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.transaction_id || 'N/A'}</td>
                                            <td>
                                                {transaction.currency_symbol || '$'} {parseFloat(transaction.amount || 0).toFixed(2)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-light-${transaction.status === 'APPROVED' ? 'success' : 'secondary'}`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(transaction.created_at)}</td>
                                            <td>
                                                <Link 
                                                    to={`/merchant/transactions/${transaction.id}`}
                                                    className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                                                    title="View Transaction"
                                                >
                                                    <i className="ki-duotone ki-eye fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                </Link>
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

export default SettlementDetail;

