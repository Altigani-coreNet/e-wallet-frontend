import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getServiceFeesData, bulkDeleteServiceFees } from '../../../../services/adminServiceFeesService';
import ServiceFeeTableRow from './ServiceFeeTableRow';
import ServiceFeeFiltersPanel from './ServiceFeeFiltersPanel';
import ServiceFeeImportModal from './ServiceFeeImportModal';
import BulkActionBar from '../../../common/BulkActionBar';
import '../SkeletonLoader.css';

const AdminServiceFeesIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [serviceFees, setServiceFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(() => {
        const saved = localStorage.getItem('serviceFeesFiltersVisible');
        return saved === 'true';
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
    const [filters, setFilters] = useState({ type: '', date_from: '', date_to: '' });

    useEffect(() => {
        setTitle(t('admin.pages.serviceFeesManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button 
                    className="btn btn-sm btn-flex btn-secondary fw-bold" 
                    onClick={() => {
                        const newState = !showFilters;
                        setShowFilters(newState);
                        localStorage.setItem('serviceFeesFiltersVisible', newState);
                    }}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">
                        {showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                    </span>
                </button>
                <button 
                    type="button" 
                    className="btn btn-sm fw-bold btn-success"
                    onClick={() => setShowImportModal(true)}
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.settings.serviceFees.import')}</span>
                </button>
                <Link to="/admin/settings/service-fees/create" className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.settings.serviceFees.add')}</span>
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t]);

    useEffect(() => { 
        fetchServiceFees(); 
    }, [pagination.current_page]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.current_page === 1) {
                fetchServiceFees();
            } else {
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const fetchServiceFees = async () => {
        setLoading(true);
        try {
            const response = await getServiceFeesData({ 
                page: pagination.current_page, 
                per_page: pagination.per_page, 
                search: searchTerm, 
                ...filters 
            });
            if (response.success) {
                const responseData = response.data?.data || response.data;
                const dataArray = Array.isArray(responseData?.data) ? responseData.data : 
                                 Array.isArray(responseData) ? responseData : [];
                setServiceFees(dataArray);
                
                const total = responseData?.recordsTotal || responseData?.total || dataArray.length;
                if (total) {
                    setPagination(prev => ({ 
                        ...prev, 
                        total: total, 
                        last_page: Math.ceil(total / prev.per_page) 
                    }));
                }
            } else {
                toast.error(response.error || t('admin.settings.serviceFees.fetchFailed'));
                setServiceFees([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error(t('admin.settings.serviceFees.fetchFailed'));
            setServiceFees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning(t('admin.settings.serviceFees.selectToDelete'));
            return;
        }
        
        if (!window.confirm(t('admin.settings.serviceFees.bulkDeleteConfirm', { count: selectedIds.length }))) return;
        
        const response = await bulkDeleteServiceFees(selectedIds);
        if (response.success) {
            toast.success(t('admin.settings.serviceFees.bulkDeleted'));
            setSelectedIds([]);
            fetchServiceFees();
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.bulkDeleteFailed'));
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({ type: '', date_from: '', date_to: '' });
    };

    return (
        <>
                {showFilters && (
                    <ServiceFeeFiltersPanel 
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filters={filters}
                        onFiltersChange={setFilters}
                        onReset={handleResetFilters}
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
                                <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <input 
                                    type="text" 
                                    className="form-control form-control-solid w-250px ps-13" 
                                    placeholder={t('admin.settings.serviceFees.searchToolbar')}
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
                                    <th className="w-10px pe-2">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox"
                                                checked={selectedIds.length === serviceFees.length && serviceFees.length > 0}
                                                onChange={(e) => setSelectedIds(e.target.checked ? serviceFees.map(s => s.id) : [])}
                                            />
                                        </div>
                                    </th>
                                    <th>{t('admin.settings.serviceFees.colId')}</th>
                                    <th className="min-w-200px">{t('admin.settings.serviceFees.colName')}</th>
                                    <th>{t('admin.settings.serviceFees.colType')}</th>
                                    <th>{t('admin.settings.serviceFees.colFees')}</th>
                                    <th>{t('admin.settings.serviceFees.colCreatedAt')}</th>
                                    <th className="text-end min-w-100px">{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="fw-semibold text-gray-600">
                                {loading ? (
                                    <>
                                        {[...Array(5)].map((_, idx) => (
                                            <tr key={idx}>
                                                <td><div className="skeleton skeleton-checkbox"></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '150px' }}></div></td>
                                                <td><div className="skeleton skeleton-badge"></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                                <td className="text-end"><div className="skeleton skeleton-actions"></div></td>
                                            </tr>
                                        ))}
                                    </>
                                ) : serviceFees.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5">{t('admin.settings.serviceFees.noRows')}</td>
                                    </tr>
                                ) : (
                                    serviceFees.map(serviceFee => (
                                        <ServiceFeeTableRow 
                                            key={serviceFee.id}
                                            serviceFee={serviceFee}
                                            isSelected={selectedIds.includes(serviceFee.id)}
                                            onSelect={(id) => setSelectedIds(prev => 
                                                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                            )}
                                            onRefresh={fetchServiceFees}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {!loading && pagination.last_page > 1 && (
                            <div className="row">
                                <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                    <div className="dataTables_length">
                                        {t('admin.settings.serviceFees.showingPage', {
                                            current: pagination.current_page,
                                            last: pagination.last_page,
                                        })}
                                    </div>
                                </div>
                                <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                    <div className="dataTables_paginate paging_simple_numbers">
                                        <ul className="pagination">
                                            <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                                    disabled={pagination.current_page === 1}
                                                >
                                                    <i className="previous"></i>
                                                </button>
                                            </li>
                                            {[...Array(pagination.last_page)].map((_, idx) => (
                                                <li 
                                                    key={idx + 1} 
                                                    className={`paginate_button page-item ${pagination.current_page === idx + 1 ? 'active' : ''}`}
                                                >
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => setPagination(prev => ({ ...prev, current_page: idx + 1 }))}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                </li>
                                            ))}
                                            <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
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
            
            <ServiceFeeImportModal 
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={fetchServiceFees}
            />
        </>
    );
};

export default AdminServiceFeesIndex;
