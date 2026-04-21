import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import SearchableDropdown from '../../../common/filters/SearchableDropdown';

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
        setTitle('Service Transactions');
        setActions(
            <div className="d-flex gap-2">
                <button className="btn btn-sm btn-light" onClick={() => setShowFilters((v) => !v)}>
                    <i className="ki-duotone ki-filter fs-3 me-1"><span className="path1"></span><span className="path2"></span></i>
                    {showFilters ? 'Hide Filters' : 'Filter'}
                </button>
                <button className="btn btn-sm btn-light-danger" onClick={clearFilters}>
                    <i className="ki-duotone ki-filter-remove fs-3 me-1"><span className="path1"></span><span className="path2"></span></i>
                    Clear Filters
                </button>
                <button className="btn btn-sm btn-success" onClick={handleExport}>
                    <i className="ki-duotone ki-file-down fs-3 me-1"><span className="path1"></span><span className="path2"></span></i>
                    Export
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, filters]);

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
            toast.error('Failed to load service transactions');
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
            toast.error('Failed to load filter dropdowns');
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
            title: 'Export Service Transactions',
            text: 'Export with current filters?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Export',
            cancelButtonText: 'Cancel',
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
            toast.success(`Exported ${allRows.length} service transactions`);
        } catch (error) {
            console.error('Export service transactions error:', error);
            toast.error('Failed to export service transactions');
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
        label: s.service_name_en || s.service_name_ar || s.service_name || s.text || String(s.id),
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
                                <label className="form-label">Search</label>
                                <input type="text" className="form-control" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                                    <option value="">All</option>
                                    <option value="pending">pending</option>
                                    <option value="completed">completed</option>
                                    <option value="failed">failed</option>
                                    <option value="skipped">skipped</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Merchant</label>
                                <SearchableDropdown
                                    placeholder="All Merchants"
                                    options={merchantOptions}
                                    selected={filters.merchant_id || null}
                                    onSelect={(option) => handleFilterChange('merchant_id', option?.value || '')}
                                    onClear={() => handleFilterChange('merchant_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Partner</label>
                                <SearchableDropdown
                                    placeholder="All Partners"
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
                                <label className="form-label">Service</label>
                                <SearchableDropdown
                                    placeholder="All Services"
                                    options={serviceOptions}
                                    selected={filters.service_id || null}
                                    onSelect={(option) => handleFilterChange('service_id', option?.value || '')}
                                    onClear={() => handleFilterChange('service_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Product</label>
                                <SearchableDropdown
                                    placeholder="All Products"
                                    options={productOptions}
                                    selected={filters.product_id || null}
                                    onSelect={(option) => handleFilterChange('product_id', option?.value || '')}
                                    onClear={() => handleFilterChange('product_id', '')}
                                    loading={dropdownsLoading}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">From Date</label>
                                <input type="date" className="form-control" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">To Date</label>
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
                            placeholder="Quick search..."
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
                                <th>Country</th>
                                <th>Partner</th>
                                <th>Merchant</th>
                                <th>Transaction ID</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th className="text-end">Action</th>
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
                                <tr><td colSpan="8" className="text-center py-8">No service transactions found</td></tr>
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
                {!loading && items.length > 0 && (
                    <div className="row mt-5">
                        <div className="col-sm-12 col-md-5 d-flex align-items-center">
                            <label className="d-flex align-items-center">
                                <span className="me-2">Show</span>
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
                                <span className="ms-2">entries</span>
                            </label>
                        </div>
                        <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-end">
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPagination((p) => ({ ...p, current_page: p.current_page - 1 }))}>Previous</button>
                                </li>
                                <li className="page-item active"><button className="page-link">{pagination.current_page}</button></li>
                                <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPagination((p) => ({ ...p, current_page: p.current_page + 1 }))}>Next</button>
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

