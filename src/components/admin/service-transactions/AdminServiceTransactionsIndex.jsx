import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import SearchableDropdown from '../../../common/filters/SearchableDropdown';
import ServiceModel from '../../../services/ServiceModel';

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
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1 });
    const [dropdownsLoading, setDropdownsLoading] = useState(false);
    const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
    const [merchantsList, setMerchantsList] = useState([]);
    const [partnersList, setPartnersList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        merchant_id: '',
        partner_id: '',
        service_id: '',
        product_id: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        setTitle(t('admin.pages.serviceTransactions'));
        setActions(
            <div className="d-flex gap-2">
                <button className="btn btn-sm btn-light" onClick={() => setShowFilters((v) => !v)}>
                    <i className="ki-duotone ki-filter fs-3 me-1"><span className="path1"></span><span className="path2"></span></i>
                    {showFilters ? t('admin.common.hideFilters') : t('admin.common.filter')}
                </button>
                <button className="btn btn-sm btn-light-danger" onClick={clearFilters}>
                    <i className="ki-duotone ki-filter-remove fs-3 me-1"><span className="path1"></span><span className="path2"></span></i>
                    {t('admin.common.clearFilters')}
                </button>
                <button className="btn btn-sm btn-success" onClick={handleExport}>
                    <i className="ki-duotone ki-file-down fs-3 me-1"><span className="path1"></span><span className="path2"></span></i>
                    {t('admin.common.export')}
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, filters, t, i18n.language]);

    useEffect(() => {
        fetchItems();
    }, [pagination.current_page, pagination.per_page, filters]);

    useEffect(() => {
        if (showFilters && !dropdownsLoaded) {
            fetchFilterDropdowns();
        }
    }, [showFilters, dropdownsLoaded]);

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
            toast.error(t('admin.serviceTransactionsIndex.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterDropdowns = async () => {
        setDropdownsLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

            const [merchantsRes, partnersRes, servicesRes, productsRes] = await Promise.all([
                axios.get(ADMIN_ENDPOINTS.MERCHANTS, { params: { per_page: 1000 }, headers }).catch(() => ({ data: { data: [] } })),
                axios.get(ADMIN_ENDPOINTS.CONTENT_PROVIDERS, { params: { per_page: 1000 }, headers }).catch(() => ({ data: { data: [] } })),
                axios.get(ADMIN_ENDPOINTS.SERVICES_SELECT, { params: { limit: 1000 }, headers }).catch(() => ({ data: { data: [] } })),
                axios.get(ADMIN_ENDPOINTS.PRODUCTS_SELECT, { params: { limit: 1000 }, headers }).catch(() => ({ data: { data: [] } })),
            ]);

            const merchants = merchantsRes.data?.data?.data || merchantsRes.data?.data || [];
            const partners = partnersRes.data?.data?.data || partnersRes.data?.data || [];
            const services = servicesRes.data?.data || [];
            const products = productsRes.data?.data || [];

            setMerchantsList(Array.isArray(merchants) ? merchants : []);
            setPartnersList(Array.isArray(partners) ? partners : []);
            setServicesList(Array.isArray(services) ? services : []);
            setProductsList(Array.isArray(products) ? products : []);
            setDropdownsLoaded(true);
        } catch (error) {
            console.error('Error loading service transaction filter dropdowns:', error);
            toast.error(t('admin.serviceTransactionsIndex.filterDropdownsFailed'));
        } finally {
            setDropdownsLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            merchant_id: '',
            partner_id: '',
            service_id: '',
            product_id: '',
            start_date: '',
            end_date: '',
        });
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleExport = async () => {
        const result = await Swal.fire({
            title: t('admin.serviceTransactionsIndex.exportTitle'),
            text: t('admin.serviceTransactionsIndex.exportText'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.serviceTransactionsIndex.exportConfirm'),
            cancelButtonText: t('admin.serviceTransactionsIndex.exportCancel'),
            confirmButtonColor: '#28a745',
        });
        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const allRows = [];
            let page = 1;
            let lastPage = 1;

            do {
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_TRANSACTIONS, {
                    params: { ...filters, page, per_page: 200 },
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                });
                const data = response.data?.data;
                const rows = data?.data || [];
                allRows.push(...rows);
                lastPage = data?.last_page || 1;
                page += 1;
            } while (page <= lastPage);

            const headers = ['id', 'status', 'merchant', 'partner', 'service', 'product', 'base_transaction', 'created_at'];
            const csvRows = [
                headers.join(','),
                ...allRows.map((r) => ([
                    r.id,
                    r.status || '',
                    `"${(r.merchant?.business_name || r.merchant?.name || r.merchant_id || '').toString().replace(/"/g, '""')}"`,
                    `"${(r.partner?.name || r.partner?.business_name || r.partner_id || '').toString().replace(/"/g, '""')}"`,
                    `"${(r.service?.service_name?.en || r.service?.service_name?.ar || r.service_id || '').toString().replace(/"/g, '""')}"`,
                    `"${(r.product?.name?.en || r.product?.name?.ar || r.product_id || '').toString().replace(/"/g, '""')}"`,
                    `"${(r.transaction?.transaction_id || r.transaction_id || '').toString().replace(/"/g, '""')}"`,
                    r.created_at || '',
                ]).join(',')),
            ];

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `service-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(t('admin.serviceTransactionsIndex.exported', { count: allRows.length }));
        } catch (error) {
            console.error('Export service transactions error:', error);
            toast.error(t('admin.serviceTransactionsIndex.exportFailed'));
        }
    };

    const merchantOptions = merchantsList.map((m) => ({
        value: m.id,
        label: m.business_name || m.name || String(m.id),
    }));
    const partnerOptions = partnersList.map((p) => ({
        value: p.id,
        label: p.business_name || p.name || String(p.id),
    }));
    const serviceOptions = servicesList.map((s) => ({
        value: s.id,
        label: ServiceModel.displayName(s) || s.text || String(s.id),
    }));
    const productOptions = productsList.map((p) => ({
        value: p.id,
        label: p.name_en || p.name_ar || p.name || p.text || String(p.id),
    }));

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

            {showFilters && (
                <div className="card bg-white mb-5">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.searchLabel')}</label>
                                <input type="text" className="form-control" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.statusLabel')}</label>
                                <select className="form-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                                    <option value="">{t('admin.serviceTransactionsIndex.statusAll')}</option>
                                    <option value="pending">{t('admin.serviceTransactionsIndex.statusPending')}</option>
                                    <option value="completed">{t('admin.serviceTransactionsIndex.statusCompleted')}</option>
                                    <option value="failed">{t('admin.serviceTransactionsIndex.statusFailed')}</option>
                                    <option value="skipped">{t('admin.serviceTransactionsIndex.statusSkipped')}</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.merchantLabel')}</label>
                                <SearchableDropdown
                                    placeholder={t('admin.serviceTransactionsIndex.merchantAll')}
                                    options={merchantOptions}
                                    selected={filters.merchant_id || null}
                                    onSelect={(option) => handleFilterChange('merchant_id', option?.value || '')}
                                    onClear={() => handleFilterChange('merchant_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.partnerLabel')}</label>
                                <SearchableDropdown
                                    placeholder={t('admin.serviceTransactionsIndex.partnerAll')}
                                    options={partnerOptions}
                                    selected={filters.partner_id || null}
                                    onSelect={(option) => handleFilterChange('partner_id', option?.value || '')}
                                    onClear={() => handleFilterChange('partner_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.serviceLabel')}</label>
                                <SearchableDropdown
                                    placeholder={t('admin.serviceTransactionsIndex.serviceAll')}
                                    options={serviceOptions}
                                    selected={filters.service_id || null}
                                    onSelect={(option) => handleFilterChange('service_id', option?.value || '')}
                                    onClear={() => handleFilterChange('service_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.productLabel')}</label>
                                <SearchableDropdown
                                    placeholder={t('admin.serviceTransactionsIndex.productAll')}
                                    options={productOptions}
                                    selected={filters.product_id || null}
                                    onSelect={(option) => handleFilterChange('product_id', option?.value || '')}
                                    onClear={() => handleFilterChange('product_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.fromDateLabel')}</label>
                                <input type="date" className="form-control" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">{t('admin.serviceTransactionsIndex.toDateLabel')}</label>
                                <input type="date" className="form-control" value={filters.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex gap-2">
                        <input
                            type="text"
                            className="form-control form-control-solid w-250px"
                            placeholder={t('admin.serviceTransactionsIndex.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                </div>
            <div className="card-body pt-0">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-7 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                <th>{t('admin.serviceTransactionsIndex.colCountry')}</th>
                                <th>{t('admin.serviceTransactionsIndex.colPartner')}</th>
                                <th>{t('admin.serviceTransactionsIndex.colMerchant')}</th>
                                <th>{t('admin.serviceTransactionsIndex.colTransactionId')}</th>
                                <th>{t('admin.serviceTransactionsIndex.colDate')}</th>
                                <th>{t('admin.serviceTransactionsIndex.colAmount')}</th>
                                <th>{t('admin.serviceTransactionsIndex.colStatus')}</th>
                                <th className="text-end">{t('admin.serviceTransactionsIndex.colAction')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(pagination.per_page)].map((_, index) => (
                                    <tr key={`skeleton-${index}`}>
                                        <td><div className="skeleton" style={{ width: 80, height: 24 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 130, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 120, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 120, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 150, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 160, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 80, height: 24 }}></div></td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <div className="skeleton" style={{ width: 100, height: 32 }}></div>
                                                <div className="skeleton" style={{ width: 130, height: 32 }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-8">{t('admin.serviceTransactionsIndex.noData')}</td></tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            {typeof item.country_name === 'object'
                                                ? (item.country_name.en || item.country_name.ar || 'N/A')
                                                : (item.country_name || 'N/A')}
                                        </td>
                                        <td>{item.partner?.name || item.partner?.business_name || item.partner_id || 'N/A'}</td>
                                        <td>{item.merchant?.business_name || item.merchant?.name || item.merchant_id || 'N/A'}</td>
                                        <td>{item.transaction?.transaction_id || item.transaction_id || 'N/A'}</td>
                                        <td>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</td>
                                        <td>
                                            {(item.transaction?.currency_symbol || '$')}
                                            {Number(item.transaction?.amount || 0).toFixed(2)}
                                        </td>
                                        <td><span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status || 'N/A'}</span></td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-icon btn-sm btn-light btn-active-light-primary"
                                                onClick={() => navigate(`/admin/service-transactions/${item.id}`)}
                                                title={t('admin.serviceTransactionsIndex.serviceDetails')}
                                                aria-label={t('admin.serviceTransactionsIndex.serviceDetails')}
                                            >
                                                <i className="ki-duotone ki-eye fs-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                </i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && items.length > 0 && (
                    <div className="row mt-5">
                        <div className="col-sm-12 col-md-5 d-flex align-items-center">
                            <label className="d-flex align-items-center">
                                <span className="me-2">{t('admin.serviceTransactionsIndex.show')}</span>
                                <select
                                    className="form-select form-select-sm"
                                    value={pagination.per_page}
                                    onChange={(e) => setPagination((p) => ({ ...p, per_page: parseInt(e.target.value, 10), current_page: 1 }))}
                                    style={{ width: '75px' }}
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span className="ms-2">{t('admin.serviceTransactionsIndex.entries')}</span>
                            </label>
                        </div>
                        <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-end">
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPagination((p) => ({ ...p, current_page: p.current_page - 1 }))}>{t('admin.common.previous')}</button>
                                </li>
                                <li className="page-item active"><button className="page-link">{pagination.current_page}</button></li>
                                <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPagination((p) => ({ ...p, current_page: p.current_page + 1 }))}>{t('admin.common.next')}</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default AdminServiceTransactionsIndex;

