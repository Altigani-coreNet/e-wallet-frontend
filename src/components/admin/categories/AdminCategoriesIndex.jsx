import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getCategories, exportCategories } from '../../../services/adminCategoriesService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import { fetchMerchantCountryInfo } from '../../../services/adminMerchantLookupService';
import { useTranslation } from 'react-i18next';
import CategoryFiltersPanel from './CategoryFiltersPanel';
import { getTranslatedText } from '../../../utils/helpers';
import { downloadCSV } from '../../../utils/export';

const buildPaginationRange = (totalPages, currentPage, delta = 1) => {
    const pages = [];
    const safeTotal = Math.max(1, totalPages || 1);
    const safeCurrent = Math.min(Math.max(currentPage || 1, 1), safeTotal);

    if (safeTotal <= 7) {
        for (let page = 1; page <= safeTotal; page += 1) {
            pages.push(page);
        }
        return pages;
    }

    const left = Math.max(2, safeCurrent - delta);
    const right = Math.min(safeTotal - 1, safeCurrent + delta);

    pages.push(1);

    if (left > 2) {
        pages.push('left-ellipsis');
    }

    for (let page = left; page <= right; page += 1) {
        pages.push(page);
    }

    if (right < safeTotal - 1) {
        pages.push('right-ellipsis');
    }

    pages.push(safeTotal);

    return pages;
};

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
};

const AdminCategoriesIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const { merchantsMap, countriesMap, loading: refDataLoading } = useAdminReferenceData();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });

    const handleExport = useCallback(async () => {
        try {
            const response = await exportCategories({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || [];
            if (success && exportRows.length > 0) {
                // Extract unique merchant IDs from export rows
                const merchantIds = new Set();
                exportRows.forEach((row) => {
                    const merchantId = row?.shop_id ?? row?.merchant_id ?? row?.merchantId;
                    if (merchantId !== null && merchantId !== undefined) {
                        merchantIds.add(merchantId);
                    }
                });

                // Fetch merchant and country info
                const merchantInfo = await fetchMerchantCountryInfo(Array.from(merchantIds));

                // Transform export rows to include merchant_name and country_name
                const transformedRows = exportRows.map((row) => {
                    const merchantId = row?.shop_id ?? row?.merchant_id ?? row?.merchantId;
                    const merchantIdStr = merchantId ? String(merchantId) : null;
                    
                    const merchantRecord = merchantIdStr ? merchantInfo[merchantIdStr] : null;
                    const merchantName = merchantRecord?.name || 'N/A';
                    const countryName = merchantRecord?.countryName || 'N/A';

                    return {
                        ...row,
                        merchant_name: merchantName,
                        country_name: countryName,
                    };
                });

                downloadCSV(transformedRows, exportPayload?.filename || 'categories_export.csv');
                toast.success(t('admin.categoriesIndex.categoriesExportReady'));
            } else {
                toast.info(t('admin.categoriesIndex.noCategoriesToExport'));
            }
        } catch (error) {
            console.error('Error exporting categories:', error);
            toast.error(t('admin.categoriesIndex.failedToExportCategories'));
        }
    }, [appliedFilters]);

    useEffect(() => {
        setTitle(t('admin.categoriesIndex.categoriesManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button className="btn btn-sm btn-flex btn-secondary fw-bold" onClick={() => setShowFilters(!showFilters)}>
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-1 ${showFilters ? '' : 'rotate-90'}`}><span className="path1"></span><span className="path2"></span></i>
                    {t('admin.categoriesIndex.toggleFilters')}
                </button>
                <button className="btn btn-sm btn-flex btn-light-primary fw-bold" onClick={handleExport}>
                    <i className="ki-duotone ki-file-down fs-6 text-primary me-1"><span className="path1"></span><span className="path2"></span></i>
                    {t('admin.categoriesIndex.export')}
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, handleExport]);

    useEffect(() => {
        fetchCategories();
    }, [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories({
                page: pagination.current_page,
                per_page: pagination.per_page,
                sort_by: sortConfig.column,
                sort_direction: sortConfig.direction,
                ...appliedFilters,
            });

            if (response.success && response.data) {
                setCategories(response.data.categories || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: response.data.current_page || prev.current_page,
                    per_page: response.data.per_page || prev.per_page,
                    total: response.data.total || 0,
                    last_page: response.data.last_page || 1,
                }));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error(t('admin.categoriesIndex.failedToLoadCategories'));
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleQuickSearch = (value) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setAppliedFilters(newFilters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSort = (column) => {
        setSortConfig(prev => {
            if (prev.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                column,
                direction: 'desc'
            };
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const getSortIcon = (column) => {
        if (sortConfig.column !== column) {
            return (
                <i className="ki-duotone ki-arrow-up-down fs-5 ms-1 text-muted">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-5 ms-1 text-primary">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1 text-primary">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    };

    const categoryShopIds = useMemo(() => {
        if (!categories.length) return [];
        const ids = new Set();
        categories.forEach((category) => {
            const shopId = category?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [categories]);

    const merchantLookups = useMerchantCountryLookup(categoryShopIds);
    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);
    const handlePageChange = (page) => {
        const totalPages = Math.max(1, pagination.last_page || 1);
        if (page >= 1 && page <= totalPages) {
            setPagination(prev => ({ ...prev, current_page: page }));
        }
    };

    const handlePerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(e.target.value),
            current_page: 1
        }));
    };

    const countryPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);

    const renderMerchant = useCallback((shopId) => {
        if (!shopId) {
            return 'N/A';
        }

        const lookupRecord = merchantLookups.getMerchantRecord(shopId);
        if (lookupRecord?.name) {
            return lookupRecord.name;
        }

        if (isLookupLoading) {
            return merchantPlaceholder;
        }

        return merchantsMap[shopId] || `#${shopId}`;
    }, [isLookupLoading, merchantLookups, merchantPlaceholder, merchantsMap]);

    const renderCountry = useCallback((shopId) => {
        if (!shopId) {
            return 'N/A';
        }

        const remoteCountryName = merchantLookups.getCountryName(null, shopId);
        if (remoteCountryName) {
            return remoteCountryName;
        }

        if (refDataLoading || isLookupLoading) {
            return countryPlaceholder;
        }

        return 'N/A';
    }, [countryPlaceholder, isLookupLoading, merchantLookups, refDataLoading]);

    const filtersCard = showFilters ? (
        <CategoryFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (loading) {
        return (
            <>
                {filtersCard}
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <div className="d-flex align-items-center position-relative">
                                <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 10 }}>
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <input
                                    type="text"
                                    className="form-control form-control-solid w-250px ps-12"
                                    placeholder={t('admin.categoriesIndex.quickSearchPlaceholder')}
                                    value={filters.search}
                                    onChange={(e) => handleQuickSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="card-toolbar">
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 text-nowrap">{t('admin.categoriesIndex.show')}</label>
                                <select 
                                    className="form-select form-select-sm" 
                                    value={pagination.per_page}
                                    onChange={handlePerPageChange}
                                    style={{ width: '75px' }}
                                >
                                    <option value="10">10</option>
                                    <option value="15">15</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                <div className="card-body py-4">
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th>{t('admin.categoriesIndex.id')}</th><th>{t('admin.categoriesIndex.merchant')}</th><th>{t('admin.categoriesIndex.name')}</th><th>{t('admin.categoriesIndex.code')}</th><th>{t('admin.categoriesIndex.parentCategory')}</th><th>{t('admin.categoriesIndex.country')}</th><th className="text-end">{t('admin.categoriesIndex.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {[0, 1, 2, 3, 4, 5, 6].map(index => (
                                            <td key={index}><span className="placeholder col-7"></span></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            </>
        );
    }

    return (
        <>
            {filtersCard}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 10 }}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-12"
                                placeholder={t('admin.categoriesIndex.quickSearchPlaceholder')}
                                value={filters.search}
                                onChange={(e) => handleQuickSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">{t('admin.categoriesIndex.show')}</label>
                            <select 
                                className="form-select form-select-sm" 
                                value={pagination.per_page}
                                onChange={handlePerPageChange}
                                style={{ width: '75px' }}
                            >
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="card-body py-4" style={{ position: 'relative' }}>
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')} className="user-select-none">
                                        {t('admin.categoriesIndex.id')} {getSortIcon('id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('merchant_id')} className="user-select-none">
                                        {t('admin.categoriesIndex.merchant')} {getSortIcon('merchant_id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')} className="user-select-none">
                                        {t('admin.categoriesIndex.name')} {getSortIcon('name')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('code')} className="user-select-none">
                                        {t('admin.categoriesIndex.code')} {getSortIcon('code')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('parent_id')} className="user-select-none">
                                        {t('admin.categoriesIndex.parentCategory')} {getSortIcon('parent_id')}
                                    </th>
                                    <th>{t('admin.categoriesIndex.country')}</th>
                                    <th className="text-end">{t('admin.categoriesIndex.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length > 0 ? categories.map((category) => (
                                    <tr key={category.id}>
                                        <td><span className="text-dark fw-bold">{category.id}</span></td>
                                        <td>{renderMerchant(category?.shop_id)}</td>
                                        <td><span className="text-dark fw-bold">{getTranslatedText(category.name) || 'N/A'}</span></td>
                                        <td><span className="text-muted">{category.code || 'N/A'}</span></td>
                                        <td><span className="text-muted">{getTranslatedText(category.parent?.name) || 'None'}</span></td>
                                        <td>{renderCountry(category?.shop_id)}</td>
                                        <td className="text-end">
                                            <Link to={`/admin/sales/categories/${category.id}`} className="btn btn-sm btn-light-primary">{t('admin.categoriesIndex.view')}</Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-5"><div className="text-muted">{t('admin.categoriesIndex.noCategoriesFound')}</div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap pt-5">
                            <div className="fs-6 fw-bold text-gray-700">
                                {(() => {
                                    const total = pagination.total ?? 0;
                                    const perPage = pagination.per_page ?? 15;
                                    const currentPage = pagination.current_page ?? 1;
                                    if (total === 0) {
                                        return t('admin.categoriesIndex.showingEntries', { start: 0, end: 0, total: 0 });
                                    }
                                    const start = ((currentPage - 1) * perPage) + 1;
                                    const end = Math.min(currentPage * perPage, total);
                                    return t('admin.categoriesIndex.showingEntries', { start: ((currentPage - 1) * perPage) + 1, end: Math.min(currentPage * perPage, total), total: total });
                                })()}
                            </div>
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}>{t('admin.categoriesIndex.previous')}</button>
                                </li>
                                {buildPaginationRange(pagination.last_page, pagination.current_page, 1).map((page, index) => (
                                    typeof page === 'number' ? (
                                        <li key={`category-page-${page}`} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => handlePageChange(page)}>
                                                {page}
                                            </button>
                                        </li>
                                    ) : (
                                        <li key={`${page}-${index}`} className="page-item disabled">
                                            <span className="page-link">...</span>
                                        </li>
                                    )
                                ))}
                                <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}>{t('admin.categoriesIndex.next')}</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminCategoriesIndex;
