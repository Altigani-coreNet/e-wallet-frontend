import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { useCan } from '../../../../utils/permissions';
import { getCitiesData, bulkDeleteCities } from '../../../../services/adminCitiesService';
import CityTableRow from './CityTableRow';
import CityFiltersPanel from './CityFiltersPanel';
import BulkActionBar from '../../../common/BulkActionBar';

const AdminCitiesIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const canCreateCity = useCan('pos.cities.create_cities');
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
    const [filters, setFilters] = useState({ status: '', merchant_id: '', country_id: '' });

    useEffect(() => {
        setTitle(t('admin.pages.citiesManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button className="btn btn-sm btn-flex btn-secondary fw-bold" onClick={() => setShowFilters(!showFilters)}>
                    <i className="ki-duotone ki-filter fs-3"><span className="path1"></span><span className="path2"></span></i>
                    <span className="d-none d-md-inline ms-1">{showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}</span>
                </button>
                {canCreateCity && (
                    <Link to="/admin/system/cities/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3"><span className="path1"></span><span className="path2"></span></i>
                        <span className="d-none d-md-inline ms-1">{t('admin.common.addCity')}</span>
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t, i18n.language]);

    useEffect(() => { fetchCities(); }, [pagination.current_page]);
    useEffect(() => {
        const timer = setTimeout(() => pagination.current_page === 1 ? fetchCities() : setPagination(prev => ({ ...prev, current_page: 1 })), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const response = await getCitiesData({ page: pagination.current_page, per_page: pagination.per_page, search: searchTerm, ...filters });
            if (response.success) {
                const responseData = response.data?.data || response.data;
                const dataArray = Array.isArray(responseData?.data) ? responseData.data :
                    Array.isArray(responseData) ? responseData : [];

                setCities(dataArray);

                const total = responseData?.recordsTotal || responseData?.total || dataArray.length;
                const lastPage = responseData?.last_page || Math.ceil(total / pagination.per_page);
                setPagination(prev => ({ ...prev, total, last_page: lastPage }));
            } else {
                toast.error(response.error || t('admin.citiesIndex.fetchFailed'));
            }
        } catch (error) {
            toast.error(t('admin.citiesIndex.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return toast.warning(t('admin.common.pleaseSelectToDelete'));
        if (!window.confirm(t('admin.citiesIndex.deleteConfirm', { count: selectedIds.length }))) return;
        const response = await bulkDeleteCities(selectedIds);
        response.success ? (toast.success(t('admin.citiesIndex.deleted')), setSelectedIds([]), fetchCities()) : toast.error(t('admin.citiesIndex.deleteFailed'));
    };

    return (
        <>
                {showFilters && <CityFiltersPanel searchTerm={searchTerm} onSearchChange={setSearchTerm} filters={filters} onFiltersChange={setFilters} onReset={() => { setSearchTerm(''); setFilters({ status: '', merchant_id: '', country_id: '' }); }} />}
                {selectedIds.length > 0 && <BulkActionBar selectedCount={selectedIds.length} onDelete={handleBulkDelete} onCancel={() => setSelectedIds([])} />}

                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <div className="d-flex align-items-center position-relative my-1">
                                <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5"><span className="path1"></span><span className="path2"></span></i>
                                <input type="text" className="form-control form-control-solid w-250px ps-13" placeholder={t('admin.citiesIndex.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="card-body pt-0">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2"><div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                        <input className="form-check-input" type="checkbox" checked={selectedIds.length === cities.length && cities.length > 0} onChange={(e) => setSelectedIds(e.target.checked ? cities.map(c => c.id) : [])} />
                                    </div></th>
                                    <th>{t('admin.table.nameEn')}</th>
                                    <th>{t('admin.table.nameAr')}</th>
                                    <th>{t('admin.table.country')}</th>
                                    <th>{t('admin.common.status')}</th>
                                    <th>{t('admin.common.createdAt')}</th>
                                    <th className="text-end min-w-100px">{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="fw-semibold text-gray-600">
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('admin.common.loading')}</span></div></td></tr>
                                ) : cities.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-5">{t('admin.common.noData')}</td></tr>
                                ) : (
                                    cities.map(city => <CityTableRow key={city.id} city={city} isSelected={selectedIds.includes(city.id)} onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onRefresh={fetchCities} />)
                                )}
                            </tbody>
                        </table>

                        {!loading && pagination.last_page > 1 && (
                            <div className="row">
                                <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                    <div className="dataTables_length">{t('admin.common.showingPage', { current: pagination.current_page, total: pagination.last_page })}</div>
                                </div>
                                <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                    <div className="dataTables_paginate paging_simple_numbers">
                                        <ul className="pagination">
                                            <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))} disabled={pagination.current_page === 1}><i className="previous"></i></button>
                                            </li>
                                            {[...Array(pagination.last_page)].map((_, idx) => (
                                                <li key={idx + 1} className={`paginate_button page-item ${pagination.current_page === idx + 1 ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => setPagination(prev => ({ ...prev, current_page: idx + 1 }))}>{idx + 1}</button>
                                                </li>
                                            ))}
                                            <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))} disabled={pagination.current_page === pagination.last_page}><i className="next"></i></button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </>
    );
};

export default AdminCitiesIndex;
