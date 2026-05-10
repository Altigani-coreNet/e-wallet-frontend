import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateways } from '../../../services/adminPaymentGatewaysService';
import PaymentGatewayTableRow from './PaymentGatewayTableRow';

const AdminPaymentGatewaysIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [paymentGateways, setPaymentGateways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });

    useEffect(() => {
        setTitle(t('admin.paymentGatewaysIndex.paymentProviders'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{showFilters ? t('admin.paymentGatewaysIndex.hideFilters') : t('admin.paymentGatewaysIndex.showFilters')}</span>
                </button>

                <Link to="/admin/payment-gateways/create" className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.paymentGatewaysIndex.addPaymentProvider')}</span>
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t]);

    useEffect(() => {
        fetchPaymentGateways();
    }, [pagination.current_page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.current_page === 1) {
                fetchPaymentGateways();
            } else {
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, modeFilter, statusFilter]);

    const fetchPaymentGateways = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: searchTerm,
            };

            if (modeFilter) {
                params.mode = modeFilter;
            }

            if (statusFilter !== '') {
                params.is_active = statusFilter;
            }

            const response = await getPaymentGateways(params);

            if (response.success) {
                setPaymentGateways(response.data.data?.data || []);
                if (response.data.data?.recordsTotal) {
                    setPagination(prev => ({
                        ...prev,
                        total: response.data.data.recordsTotal,
                        last_page: response.data.data.pagination?.last_page || Math.ceil(response.data.data.recordsTotal / prev.per_page)
                    }));
                }
            } else {
                toast.error(response.error || t('admin.paymentGatewaysIndex.failedToFetch'));
            }
        } catch (error) {
            console.error('Error fetching payment gateways:', error);
            toast.error(t('admin.paymentGatewaysIndex.failedToFetch'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paymentGateways.map(gateway => gateway.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setModeFilter('');
        setStatusFilter('');
    };

    return (
        <>
            {/* Filter Panel */}
            {showFilters && (
                <div className="row g-5 g-xl-8 mb-4">
                    <div className="col-12">
                        <div className="card mb-5">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">{t('admin.paymentGatewaysIndex.search')}</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm"
                                            value={searchTerm}
                                            placeholder={t('admin.paymentGatewaysIndex.searchPlaceholder')}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('admin.paymentGatewaysIndex.mode')}</label>
                                        <select 
                                            className="form-select form-select-sm"
                                            value={modeFilter}
                                            onChange={(e) => setModeFilter(e.target.value)}
                                        >
                                            <option value="">{t('admin.paymentGatewaysIndex.allModes')}</option>
                                            <option value="test">{t('admin.paymentGatewaysIndex.test')}</option>
                                            <option value="live">{t('admin.paymentGatewaysIndex.live')}</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('admin.paymentGatewaysIndex.status')}</label>
                                        <select 
                                            className="form-select form-select-sm"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="">{t('admin.paymentGatewaysIndex.allStatuses')}</option>
                                            <option value="1">{t('admin.paymentGatewaysIndex.active')}</option>
                                            <option value="0">{t('admin.paymentGatewaysIndex.inactive')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-end mt-4">
                                    <button onClick={resetFilters} className="btn btn-sm btn-light-primary">
                                        <i className="ki-duotone ki-arrows-circle fs-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.paymentGatewaysIndex.resetFilters')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-5 g-xl-8">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <div className="d-flex align-items-center position-relative my-1">
                                    <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-solid w-250px ps-13"
                                        placeholder={t('admin.paymentGatewaysIndex.searchProvidersPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card-body pt-0">
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                            <th className="w-10px pe-2">
                                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.length === paymentGateways.length && paymentGateways.length > 0}
                                                        onChange={handleSelectAll}
                                                    />
                                                </div>
                                            </th>
                                            <th>{t('admin.paymentGatewaysIndex.name')}</th>
                                            <th>{t('admin.paymentGatewaysIndex.title')}</th>
                                            <th>{t('admin.paymentGatewaysIndex.mode')}</th>
                                            <th>{t('admin.paymentGatewaysIndex.alias')}</th>
                                            <th>{t('admin.common.status')}</th>
                                            <th>{t('admin.common.createdAt')}</th>
                                            <th className="text-end min-w-100px">{t('admin.paymentGatewaysIndex.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paymentGateways.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5">
                                                    {t('admin.paymentGatewaysIndex.noGatewaysFound')}
                                                </td>
                                            </tr>
                                        ) : (
                                            paymentGateways.map(gateway => (
                                                <PaymentGatewayTableRow
                                                    key={gateway.id}
                                                    paymentGateway={gateway}
                                                    isSelected={selectedIds.includes(gateway.id)}
                                                    onSelect={handleSelectOne}
                                                    onRefresh={fetchPaymentGateways}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!loading && pagination.last_page > 1 && (
                                <div className="row">
                                    <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                        <div className="dataTables_length">
                                            {t('admin.paymentGatewaysIndex.showingPage', { current: pagination.current_page, total: pagination.last_page, records: pagination.total })}
                                        </div>
                                    </div>
                                    <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                        <div className="dataTables_paginate paging_simple_numbers">
                                            <ul className="pagination">
                                                <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                                        disabled={pagination.current_page === 1}
                                                    >
                                                        <i className="previous"></i>
                                                    </button>
                                                </li>
                                                {[...Array(pagination.last_page)].map((_, idx) => (
                                                    <li key={idx + 1} className={`paginate_button page-item ${pagination.current_page === idx + 1 ? 'active' : ''}`}>
                                                        <button 
                                                            className="page-link" 
                                                            onClick={() => handlePageChange(idx + 1)}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    </li>
                                                ))}
                                                <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                                        disabled={pagination.current_page === pagination.last_page}
                                                    >
                                                        <i className="next"></i>
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminPaymentGatewaysIndex;
