import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../../../../utils/constants';
import { getToken } from '../../../../utils/api';
import PaginationControls from '../../../common/PaginationControls';

const MerchantEventsTab = ({ merchantId, initialLogs = [] }) => {
    const [logs, setLogs] = useState(initialLogs);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        last_page: 1,
        total: initialLogs.length || 0,
    });

    const fetchLogs = async (page = 1, searchTerm = '') => {
        if (!merchantId) return;

        try {
            setLoading(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANT_LOGS(merchantId), {
                params: {
                    page,
                    per_page: pagination.per_page,
                    search: searchTerm || undefined,
                },
                headers: { Authorization: `Bearer ${token}` },
            });

            const payload = response.data?.data;
            if (payload) {
                setLogs(payload.data || []);
                setPagination({
                    current_page: payload.current_page,
                    per_page: payload.per_page,
                    last_page: payload.last_page,
                    total: payload.total,
                });
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to fetch merchant logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialLogs.length > 0) {
            setLogs(initialLogs);
            setPagination((prev) => ({
                ...prev,
                total: initialLogs.length,
            }));
        } else {
            fetchLogs(1, search);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [merchantId]);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        fetchLogs(1, search);
    };

    return (
        <div className="card">
            <div className="card-header border-0 align-items-center">
                <div className="card-title">
                    <h3 className="fw-bold mb-0">Merchant Events</h3>
                </div>
                <form className="d-flex" onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="form-control form-control-sm me-3"
                        placeholder="Search events"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                <th className="min-w-160px">Timestamp</th>
                                <th className="min-w-140px">Action</th>
                                <th className="min-w-200px">Message</th>
                                <th className="min-w-150px">Performed By</th>
                            </tr>
                        </thead>
                        <tbody className="fw-semibold text-gray-600">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10">
                                        <span className="spinner-border spinner-border-sm text-primary"></span>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-600">
                                        No events found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="text-gray-700">
                                            {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge badge-light-${log.label || 'secondary'}`}>
                                                {log.action?.replace(/_/g, ' ') || 'Event'}
                                            </span>
                                        </td>
                                        <td className="text-gray-700">
                                            {log.metadata?.message || log.text || log.message || '—'}
                                        </td>
                                        <td className="text-gray-700">
                                            {log.user?.name || log.user?.email || 'System'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="card-footer">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <div className="text-gray-600 small mb-3 mb-md-0">
                        Showing {(pagination.current_page - 1) * pagination.per_page + (logs.length ? 1 : 0)} to{' '}
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} events
                    </div>
                    <PaginationControls
                        pagination={pagination}
                        onPageChange={(page) => fetchLogs(page, search)}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default MerchantEventsTab;


