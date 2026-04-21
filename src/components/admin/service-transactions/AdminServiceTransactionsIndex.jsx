import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const getStatusBadgeClass = (status) => {
    const map = {
        completed: 'badge-light-success',
        failed: 'badge-light-danger',
        pending: 'badge-light-warning',
        skipped: 'badge-light-secondary',
    };
    return map[String(status || '').toLowerCase()] || 'badge-light-secondary';
};

const AdminServiceTransactionsIndex = () => {
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1 });
    const [filters, setFilters] = useState({ search: '', status: '' });

    useEffect(() => {
        setTitle('Service Transactions');
        setActions(null);
        return () => setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        fetchItems();
    }, [pagination.current_page, pagination.per_page, filters]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_TRANSACTIONS, {
                params: {
                    page: pagination.current_page,
                    per_page: pagination.per_page,
                    ...filters,
                },
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            const data = response.data?.data;
            setItems(data?.data || []);
            setPagination((prev) => ({
                ...prev,
                total: data?.total || 0,
                last_page: data?.last_page || 1,
            }));
        } catch (error) {
            console.error('Error fetching service transactions:', error);
            toast.error('Failed to load service transactions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header border-0 pt-6">
                <div className="card-title d-flex gap-2">
                    <input
                        type="text"
                        className="form-control form-control-solid w-250px"
                        placeholder="Search transaction / merchant / partner"
                        value={filters.search}
                        onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                    />
                    <select
                        className="form-select w-180px"
                        value={filters.status}
                        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">pending</option>
                        <option value="completed">completed</option>
                        <option value="failed">failed</option>
                        <option value="skipped">skipped</option>
                    </select>
                </div>
            </div>
            <div className="card-body pt-0">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-7 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                <th>Status</th>
                                <th>Merchant</th>
                                <th>Partner</th>
                                <th>Service</th>
                                <th>Product</th>
                                <th>Base Transaction</th>
                                <th>Date</th>
                                <th className="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center py-8">Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-8">No service transactions found</td></tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td><span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status || 'N/A'}</span></td>
                                        <td>{item.merchant?.business_name || item.merchant?.name || item.merchant_id || 'N/A'}</td>
                                        <td>{item.partner?.name || item.partner?.business_name || item.partner_id || 'N/A'}</td>
                                        <td>{item.service?.service_name?.en || item.service?.service_name?.ar || item.service_id || 'N/A'}</td>
                                        <td>{item.product?.name?.en || item.product?.name?.ar || item.product_id || 'N/A'}</td>
                                        <td>{item.transaction?.transaction_id || item.transaction_id}</td>
                                        <td>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button
                                                    className="btn btn-sm btn-light btn-active-light-primary"
                                                    onClick={() => navigate(`/admin/service-transactions/${item.id}`)}
                                                >
                                                    Service Details
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-light-primary"
                                                    onClick={() => {
                                                        const baseId = item.transaction?.id || item.transaction_id;
                                                        if (baseId) navigate(`/admin/transactions/${baseId}`);
                                                    }}
                                                    disabled={!item.transaction?.id && !item.transaction_id}
                                                >
                                                    Transaction Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminServiceTransactionsIndex;

