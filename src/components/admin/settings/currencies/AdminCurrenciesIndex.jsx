import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { useCan } from '../../../../utils/permissions';
import { getCurrenciesData, bulkDeleteCurrencies } from '../../../../services/adminCurrenciesService';
import CurrencyTableRow from './CurrencyTableRow';
import CurrencyFiltersPanel from './CurrencyFiltersPanel';
import BulkActionBar from '../../../common/BulkActionBar';
import '../SkeletonLoader.css';

const getCurrencyCodeTranslations = (currency) => {
    const translations = currency?.currency_code_translations;
    if (translations && typeof translations === 'object') {
        return {
            en: translations.en || '',
            ar: translations.ar || ''
        };
    }

    const rawCode = currency?.currency_code;
    if (rawCode && typeof rawCode === 'object') {
        return {
            en: rawCode.en || '',
            ar: rawCode.ar || ''
        };
    }

    const fallback = rawCode || '';
    return { en: fallback, ar: fallback };
};

const getSymbolTranslations = (currency) => {
    const translations = currency?.symbol_translations;
    if (translations && typeof translations === 'object') {
        return {
            en: translations.en || '',
            ar: translations.ar || ''
        };
    }

    const rawSymbol = currency?.symbol;
    if (rawSymbol && typeof rawSymbol === 'object') {
        return {
            en: rawSymbol.en || '',
            ar: rawSymbol.ar || ''
        };
    }

    const fallback = rawSymbol || '';
    return { en: fallback, ar: fallback };
};

const AdminCurrenciesIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const canCreateCurrency = useCan('pos.currencies.create_currencies');
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(() => {
        const saved = localStorage.getItem('currenciesFiltersVisible');
        return saved === 'true';
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
    const [filters, setFilters] = useState({ date_from: '', date_to: '' });

    useEffect(() => {
        setTitle(t('admin.pages.currenciesManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button 
                    className="btn btn-sm btn-flex btn-secondary fw-bold" 
                    onClick={() => {
                        const newState = !showFilters;
                        setShowFilters(newState);
                        localStorage.setItem('currenciesFiltersVisible', newState);
                    }}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}</span>
                </button>
                {canCreateCurrency && (
                    <Link to="/admin/settings/currencies/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">{t('admin.common.add')} {t('admin.common.currency')}</span>
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t, i18n.language]);

    useEffect(() => { fetchCurrencies(); }, [pagination.current_page]);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.current_page === 1) {
                fetchCurrencies();
            } else {
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const fetchCurrencies = async () => {
        setLoading(true);
        try {
            const response = await getCurrenciesData({ 
                page: pagination.current_page, 
                per_page: pagination.per_page, 
                search: searchTerm, 
                ...filters 
            });
            if (response.success) {
                const responseData = response.data?.data || response.data;
                const dataArray = Array.isArray(responseData?.data) ? responseData.data : 
                                 Array.isArray(responseData) ? responseData : [];
                setCurrencies(dataArray);
                
                const total = responseData?.recordsTotal || responseData?.total || dataArray.length;
                if (total) {
                    setPagination(prev => ({ 
                        ...prev, 
                        total: total, 
                        last_page: Math.ceil(total / prev.per_page) 
                    }));
                }
            } else {
                toast.error(response.error || t('admin.settings.currencies.listFetchFailed'));
                setCurrencies([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error(t('admin.settings.currencies.listFetchFailed'));
            setCurrencies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning(t('admin.settings.currencies.selectToDelete'));
            return;
        }
        
        if (!window.confirm(t('admin.settings.currencies.bulkDeleteConfirm', { count: selectedIds.length }))) return;
        
        const response = await bulkDeleteCurrencies(selectedIds);
        if (response.success) {
            toast.success(t('admin.settings.currencies.bulkDeleted'));
            setSelectedIds([]);
            fetchCurrencies();
        } else {
            toast.error(response.error || t('admin.settings.currencies.bulkDeleteFailed'));
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({ date_from: '', date_to: '' });
    };

    return (
        <>
                {showFilters && (
                    <CurrencyFiltersPanel 
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
                                    placeholder={t('admin.settings.currencies.searchPlaceholder')}
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
                                                checked={selectedIds.length === currencies.length && currencies.length > 0}
                                                onChange={(e) => setSelectedIds(e.target.checked ? currencies.map(c => c.id) : [])}
                                            />
                                        </div>
                                    </th>
                                    <th>{t('admin.common.id')}</th>
                                    <th className="min-w-125px">{t('admin.table.country')}</th>
                                    <th className="min-w-125px">{t('admin.common.name')}</th>
                                    <th>{t('admin.common.symbolEn')}</th>
                                    <th>{t('admin.common.symbolAr')}</th>
                                    <th>{t('admin.common.currencyCodeEn')}</th>
                                    <th>{t('admin.common.currencyCodeAr')}</th>
                                    <th>{t('admin.common.createdAt')}</th>
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
                                                <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '150px' }}></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></td>
                                                <td><div className="skeleton skeleton-badge"></div></td>
                                                <td><div className="skeleton skeleton-badge"></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                                <td className="text-end"><div className="skeleton skeleton-actions"></div></td>
                                            </tr>
                                        ))}
                                    </>
                                ) : currencies.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-5">{t('admin.common.noData')}</td>
                                    </tr>
                                ) : (
                                    currencies.map(currency => (
                                        <CurrencyTableRow 
                                            key={currency.id}
                                            currency={currency}
                                            currencyCodeTranslations={getCurrencyCodeTranslations(currency)}
                                            symbolTranslations={getSymbolTranslations(currency)}
                                            isSelected={selectedIds.includes(currency.id)}
                                            onSelect={(id) => setSelectedIds(prev => 
                                                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                            )}
                                            onRefresh={fetchCurrencies}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {!loading && pagination.last_page > 1 && (
                            <div className="row">
                                <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                    <div className="dataTables_length">
                                        {t('admin.common.showingPage', { current: pagination.current_page, total: pagination.last_page })}
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
        </>
    );
};

export default AdminCurrenciesIndex;

