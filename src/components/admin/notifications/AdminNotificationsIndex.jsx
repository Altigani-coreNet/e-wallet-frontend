import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { deleteNotification, getNotifications, resendNotification } from '../../../services/adminNotificationsService';

const targetBadgeClass = (targetType) => {
    if (targetType === 'public') return 'badge badge-light-primary';
    if (targetType === 'merchant') return 'badge badge-light-success';
    return 'badge badge-light-warning';
};

const AdminNotificationsIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        topic: '',
        target_type: '',
        is_admin: '1',
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setTitle(t('admin.pages.notificationsManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to="/admin/system/notifications/create" className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.common.addNotification')}
                </Link>
            </div>,
        );

        return () => setActions(null);
    }, [setActions, setTitle, t, i18n.language]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getNotifications({
                page: pagination.current_page,
                per_page: pagination.per_page,
                search,
                topic: filters.topic,
                target_type: filters.target_type,
                is_admin: filters.is_admin,
            });

            const payload = response?.data?.data;
            setItems(payload?.data || []);
            setPagination({
                current_page: payload?.current_page || 1,
                per_page: payload?.per_page || 15,
                total: payload?.total || 0,
                last_page: payload?.last_page || 1,
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.notificationsIndex.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current_page, filters.topic, filters.target_type, filters.is_admin]);

    const topicOptions = useMemo(
        () => [
            { value: '', label: t('admin.notificationsIndex.allTopics') },
            { value: 'payments', label: t('admin.notificationsIndex.topicPayments') },
            { value: 'service_updates', label: t('admin.notificationsIndex.topicServiceUpdates') },
            { value: 'logs', label: t('admin.notificationsIndex.topicLogs') },
            { value: 'alert', label: t('admin.notificationsIndex.topicAlert') },
        ],
        [t],
    );

    const targetOptions = useMemo(
        () => [
            { value: '', label: t('admin.notificationsIndex.allTargets') },
            { value: 'public', label: t('admin.notificationsIndex.targetPublic') },
            { value: 'merchant', label: t('admin.notificationsIndex.targetMerchant') },
            { value: 'user', label: t('admin.notificationsIndex.targetUser') },
        ],
        [t],
    );

    const adminOptions = useMemo(
        () => [
            { value: '1', label: t('admin.notificationsIndex.adminOnly') },
            { value: '0', label: t('admin.notificationsIndex.nonAdmin') },
            { value: 'all', label: t('admin.notificationsIndex.all') },
        ],
        [t],
    );

    const onSearchSubmit = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        fetchData();
    };

    const onDelete = async (id) => {
        if (!window.confirm(t('admin.notificationsIndex.deleteConfirm'))) return;
        try {
            await deleteNotification(id);
            toast.success(t('admin.notificationsIndex.deleted'));
            fetchData();
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.notificationsIndex.deleteFailed'));
        }
    };

    const onResend = async (id) => {
        try {
            await resendNotification(id);
            toast.success(t('admin.notificationsIndex.resent'));
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.notificationsIndex.resendFailed'));
        }
    };

    const getTargetEntityName = (item) => {
        if (item.target_type === 'merchant') {
            return item.merchant?.name || item.notifiable?.name || item.merchant_name || '-';
        }

        if (item.target_type === 'user') {
            return item.user?.name || item.notifiable?.name || item.notifiable?.email || item.user_name || '-';
        }

        return '-';
    };

    return (
        <div className="d-flex flex-column gap-7">
            {showFilters && <div className="card">
                <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h3 className="fw-bold m-0">{t('admin.common.filters')}</h3>
                        </div>
                </div>
                <div className="card-body pt-2 pb-6">
                    <div className="row g-4">
                        <div className="col-12 col-md-6 col-xl-4">
                            <div className="d-flex align-items-center position-relative">
                                <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <input
                                    type="text"
                                    className="form-control form-control-solid ps-13"
                                    placeholder={t('admin.notificationsIndex.searchPlaceholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-6 col-xl-2">
                            <select
                                className="form-select form-select-solid w-100"
                                value={filters.topic}
                                onChange={(e) => setFilters((prev) => ({ ...prev, topic: e.target.value }))}
                            >
                                {topicOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-6 col-xl-2">
                            <select
                                className="form-select form-select-solid w-100"
                                value={filters.target_type}
                                onChange={(e) => setFilters((prev) => ({ ...prev, target_type: e.target.value }))}
                            >
                                {targetOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-6 col-xl-2">
                            <select
                                className="form-select form-select-solid w-100"
                                value={filters.is_admin}
                                onChange={(e) => setFilters((prev) => ({ ...prev, is_admin: e.target.value }))}
                            >
                                {adminOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-xl-2">
                            <button className="btn btn-primary w-100" onClick={onSearchSubmit}>
                                {t('admin.common.search')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>}

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex justify-content-between align-items-center w-100 gap-3">
                        <h3 className="fw-bold m-0">{t('admin.notificationsIndex.notifications')}</h3>
                        <button className="btn btn-sm btn-light-primary" onClick={() => setShowFilters((prev) => !prev)}>
                            {showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                        </button>
                    </div>
                </div>
                <div className="card-body py-4">
                {loading ? (
                    <div className="text-center py-10">
                        <span className="spinner-border text-primary"></span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 fs-5">{t('admin.notificationsIndex.noNotificationsFound')}</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                    <th className="text-dark">{t('admin.notificationsIndex.colCode')}</th>
                                    <th className="text-dark">{t('admin.notificationsIndex.colTopic')}</th>
                                    <th className="text-dark">{t('admin.notificationsIndex.colTypeAndTarget')}</th>
                                    <th className="text-dark">{t('admin.notificationsIndex.colIsAdmin')}</th>
                                    <th className="text-dark">{t('admin.notificationsIndex.colTitle')}</th>
                                    <th className="text-dark">{t('admin.notificationsIndex.colSentAt')}</th>
                                    <th className="text-end text-dark">{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="fw-bold">{item.code || item.id}</td>
                                        <td className="text-capitalize">{(item.topic || '-').replace('_', ' ')}</td>
                                        <td>
                                            <div className="d-flex flex-wrap align-items-center gap-2">
                                                <span className={targetBadgeClass(item.target_type)}>
                                                    {t(`admin.notificationsIndex.targetType.${item.target_type}`) || item.target_type}
                                                </span>
                                                <span className="text-gray-800 fw-semibold">{getTargetEntityName(item)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${item.is_admin ? 'badge-light-primary' : 'badge-light-secondary'}`}>
                                                {item.is_admin ? t('admin.common.yes') : t('admin.common.no')}
                                            </span>
                                        </td>
                                        <td>{item.title}</td>
                                        <td>{item.sent_at ? new Date(item.sent_at).toLocaleString() : '-'}</td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-icon btn-light-info btn-sm me-2"
                                                onClick={() => onResend(item.id)}
                                                title={t('admin.common.resend')}
                                            >
                                                <i className="ki-duotone ki-arrows-circle fs-4">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </button>
                                            <button
                                                className="btn btn-icon btn-light-primary btn-sm me-2"
                                                onClick={() => navigate(`/admin/system/notifications/${item.id}/edit`)}
                                                title={t('admin.common.edit')}
                                            >
                                                <i className="ki-duotone ki-pencil fs-4">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </button>
                                            <button
                                                className="btn btn-icon btn-light-danger btn-sm"
                                                onClick={() => onDelete(item.id)}
                                                title={t('admin.common.delete')}
                                            >
                                                <i className="ki-duotone ki-trash fs-4">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                    <span className="path5"></span>
                                                </i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && items.length > 0 && (
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-4 pt-10">
                        <div className="fs-6 fw-semibold text-gray-700">
                            {t('admin.common.showingEntries', {
                                from: ((pagination.current_page - 1) * pagination.per_page) + 1,
                                to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                total: pagination.total,
                            })}
                        </div>
                        <ul className="pagination mb-0">
                            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPagination((prev) => ({ ...prev, current_page: prev.current_page - 1 }))}>
                                    {t('admin.common.previous')}
                                </button>
                            </li>
                            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPagination((prev) => ({ ...prev, current_page: prev.current_page + 1 }))}>
                                    {t('admin.common.next')}
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationsIndex;
