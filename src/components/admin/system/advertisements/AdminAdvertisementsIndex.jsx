import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { useCan } from '../../../../utils/permissions';
import { getAdvertisementsData, bulkDeleteAdvertisements } from '../../../../services/adminAdvertisementsService';
import AdvertisementTableRow from './AdvertisementTableRow';
import AdvertisementFiltersPanel from './AdvertisementFiltersPanel';
import BulkActionBar from '../../../common/BulkActionBar';

const AdminAdvertisementsIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const canCreateAdvertisement = useCan('pos.advertisements.create_advertisements');
    const [advertisements, setAdvertisements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
    const [filters, setFilters] = useState({ status: '', country_id: '', merchant_id: '', date_from: '', date_to: '' });

    useEffect(() => {
        setTitle(t('admin.pages.advertisementsManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button type="button" className="btn btn-sm btn-flex btn-secondary fw-bold" onClick={() => setShowFilters(!showFilters)}>
                    <i className="ki-duotone ki-filter fs-3"><span className="path1"></span><span className="path2"></span></i>
                    <span className="d-none d-md-inline ms-1">
                        {showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                    </span>
                </button>
                {canCreateAdvertisement && (
                    <Link to="/admin/system/advertisements/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3"><span className="path1"></span><span className="path2"></span></i>
                        <span className="d-none d-md-inline ms-1">{t('admin.settings.advertisements.add')}</span>
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t]);

    useEffect(() => { fetchAdvertisements(); }, [pagination.current_page]);
    useEffect(() => {
        const timer = setTimeout(() => pagination.current_page === 1 ? fetchAdvertisements() : setPagination(prev => ({ ...prev, current_page: 1 })), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const fetchAdvertisements = async () => {
        setLoading(true);
        try {
            const response = await getAdvertisementsData({ page: pagination.current_page, per_page: pagination.per_page, search: searchTerm, ...filters });
            if (response.success) {
                setAdvertisements(response.data.data || []);
                if (response.data.recordsTotal) {
                    setPagination(prev => ({ ...prev, total: response.data.recordsTotal, last_page: Math.ceil(response.data.recordsTotal / prev.per_page) }));
                }
            } else {
                toast.error(response.error || t('admin.settings.advertisements.fetchFailed'));
            }
        } catch (error) {
            toast.error(t('admin.settings.advertisements.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning(t('admin.settings.advertisements.selectToDelete'));
            return;
        }
        if (!window.confirm(t('admin.settings.advertisements.bulkDeleteConfirm', { count: selectedIds.length }))) return;
        const response = await bulkDeleteAdvertisements(selectedIds);
        if (response.success) {
            toast.success(t('admin.settings.advertisements.bulkDeleted'));
            setSelectedIds([]);
            fetchAdvertisements();
        } else {
            toast.error(response.error || t('admin.settings.advertisements.bulkDeleteFailed'));
        }
    };

    return (
        <>
                {showFilters && (
                    <AdvertisementFiltersPanel
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filters={filters}
                        onFiltersChange={setFilters}
                        onReset={() => { setSearchTerm(''); setFilters({ status: '', country_id: '', merchant_id: '', date_from: '', date_to: '' }); }}
                    />
                )}
                {selectedIds.length > 0 && (
                    <BulkActionBar
                        selectedCount={selectedIds.length}
                        onDelete={handleBulkDelete}
                        onClear={() => setSelectedIds([])}
                    />
                )}

                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <div className="d-flex align-items-center position-relative my-1">
                                <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5"><span className="path1"></span><span className="path2"></span></i>
                                <input
                                    type="text"
                                    className="form-control form-control-solid w-250px ps-13"
                                    placeholder={t('admin.settings.advertisements.searchToolbar')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card-body pt-0">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2"><div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                        <input className="form-check-input" type="checkbox" checked={selectedIds.length === advertisements.length && advertisements.length > 0} onChange={(e) => setSelectedIds(e.target.checked ? advertisements.map(a => a.id) : [])} />
                                    </div></th>
                                    <th>{t('admin.settings.advertisements.colImage')}</th>
                                    <th>{t('admin.settings.advertisements.colName')}</th>
                                    <th>{t('admin.settings.advertisements.colCountry')}</th>
                                    <th>{t('admin.settings.advertisements.colDates')}</th>
                                    <th>{t('admin.settings.advertisements.colStatus')}</th>
                                    <th className="text-end min-w-100px">{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="fw-semibold text-gray-600">
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-primary"><span className="visually-hidden">{t('admin.common.loading')}</span></div></td></tr>
                                ) : advertisements.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-5">{t('admin.settings.advertisements.noRows')}</td></tr>
                                ) : (
                                    advertisements.map(ad => (
                                        <AdvertisementTableRow
                                            key={ad.id}
                                            advertisement={ad}
                                            isSelected={selectedIds.includes(ad.id)}
                                            onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                                            onRefresh={fetchAdvertisements}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {!loading && pagination.last_page > 1 && (
                            <div className="row">
                                <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                    <div className="dataTables_length">
                                        {t('admin.systemRoles.showingPage', { current: pagination.current_page, last: pagination.last_page })}
                                    </div>
                                </div>
                                <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                    <div className="dataTables_paginate paging_simple_numbers">
                                        <ul className="pagination">
                                            <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                <button type="button" className="page-link" onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))} disabled={pagination.current_page === 1}><i className="previous"></i></button>
                                            </li>
                                            {[...Array(pagination.last_page)].map((_, idx) => (
                                                <li key={idx + 1} className={`paginate_button page-item ${pagination.current_page === idx + 1 ? 'active' : ''}`}>
                                                    <button type="button" className="page-link" onClick={() => setPagination(prev => ({ ...prev, current_page: idx + 1 }))}>{idx + 1}</button>
                                                </li>
                                            ))}
                                            <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                <button type="button" className="page-link" onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))} disabled={pagination.current_page === pagination.last_page}><i className="next"></i></button>
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

export default AdminAdvertisementsIndex;
