import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { get } from '../../../../utils/api';
import { ADMIN_ENDPOINTS } from '../../../../utils/constants';
import PaginationControls from '../../../common/PaginationControls';

const MerchantEventsTab = ({ merchantId, initialLogs = [] }) => {
    const { t } = useTranslation();
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
            const response = await get(ADMIN_ENDPOINTS.MERCHANT_LOGS(merchantId), {
                params: {
                    page,
                    per_page: pagination.per_page,
                    search: searchTerm || undefined,
                },
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
                    <h3 className="fw-bold mb-0">{t('admin.merchantsUI.eventsTab.title')}</h3>
                </div>
                <form className="d-flex" onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="form-control form-control-sm me-3"
                        placeholder={t('admin.merchantsUI.eventsTab.searchPlaceholder')}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                        {loading ? t('admin.merchantsUI.eventsTab.searching') : t('admin.merchantsUI.eventsTab.search')}
                    </button>
                </form>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                <th className="min-w-160px">{t('admin.merchantsUI.eventsTab.colTimestamp')}</th>
                                <th className="min-w-140px">{t('admin.merchantsUI.eventsTab.colAction')}</th>
                                <th className="min-w-200px">{t('admin.merchantsUI.eventsTab.colMessage')}</th>
                                <th className="min-w-150px">{t('admin.merchantsUI.eventsTab.colPerformedBy')}</th>
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
                                        {t('admin.merchantsUI.eventsTab.noEvents')}
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
                                                {log.action?.replace(/_/g, ' ') || t('admin.merchantsUI.eventsTab.eventFallback')}
                                            </span>
                                        </td>
                                        <td className="text-gray-700">
                                            {log.metadata?.message || log.text || log.message || '—'}
                                        </td>
                                        <td className="text-gray-700">
                                            {log.user?.name || log.user?.email || t('admin.merchantsUI.system')}
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
                        {t('admin.merchantsUI.eventsTab.showing', {
                            from: (pagination.current_page - 1) * pagination.per_page + (logs.length ? 1 : 0),
                            to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                            total: pagination.total
                        })}
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
