import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportProducts, useAdminProducts } from '../../../services/adminProductsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import useMerchantCountryLookup from '../../../hooks/useMerchantCountryLookup';
import ProductFiltersPanel from './ProductFiltersPanel';
import { getTranslatedText } from '../../../utils/helpers';
import { downloadCSV } from '../../../utils/export';
import { POS_API_BASE } from '../../../utils/constants';

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

const ensureAbsoluteUrl = (base, value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
        return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    }
    const normalizedBase = (base || '').replace(/\/+$/, '');
    const normalizedPath = trimmed.replace(/^\/+/, '');
    if (!normalizedBase) {
        return `/${normalizedPath}`;
    }
    return `${normalizedBase}/${normalizedPath}`;
};

const mediaFieldNames = [
    'images',
    'photos',
    'gallery',
    'gallery_urls',
    'media',
    'media_urls',
    'attachments',
    'product_images',
    'product_media',
];

const extractFromMediaEntry = (entry) => {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    if (typeof entry !== 'object') return null;

    const {
        url,
        src,
        path,
        download_url,
        original_url,
        thumb,
        thumbnail,
        preview_url,
        full_url,
        secure_url,
        file_url,
    } = entry;

    return (
        url ||
        src ||
        path ||
        download_url ||
        original_url ||
        thumb ||
        thumbnail ||
        preview_url ||
        full_url ||
        secure_url ||
        file_url ||
        null
    );
};

const resolveProductImage = (product) => {
    if (!product) return null;

    const aggregatedMedia = [];
    mediaFieldNames.forEach((field) => {
        const value = product[field];
        if (Array.isArray(value)) {
            aggregatedMedia.push(...value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            aggregatedMedia.push(value);
        }
    });

    const mediaCandidates = aggregatedMedia
        .map(extractFromMediaEntry)
        .filter((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);

    const directCandidates = [
        product.thumbnail_url,
        product.thumbnail,
        product.image_url,
        product.image,
        product.avatar_url,
        product.avatar,
        product.product_image_url,
        product.product_image,
        product.photo_url,
        product.photo,
        product.cover_url,
        product.cover,
        product.featured_image_url,
        product.featured_image,
        product.main_image_url,
        product.main_image,
        product.logo_url,
        product.logo,
        product.preview_image_url,
        product.preview_image,
        ...mediaCandidates,
    ];

    for (const candidate of directCandidates) {
        const absolute = ensureAbsoluteUrl(POS_API_BASE, candidate);
        if (absolute) {
            return absolute;
        }
    }

    return null;
};

const getNameInitial = (name) => {
    if (!name || typeof name !== 'string') {
        return 'P';
    }
    const trimmed = name.trim();
    if (!trimmed) return 'P';
    return trimmed.charAt(0).toUpperCase();
};

const ProductThumbnail = ({ product }) => {
    const [failed, setFailed] = useState(false);
    const productName = product?.product_name || product?.name || (product?.id ? `Product #${product.id}` : 'Product');

    const imageUrl = useMemo(() => {
        if (failed) return null;
        return resolveProductImage(product);
    }, [product, failed]);

    if (!imageUrl) {
        return (
            <div className="symbol symbol-60px">
                <div className="symbol-label bg-light text-muted fw-bold">
                    {getNameInitial(productName)}
                </div>
            </div>
        );
    }

    return (
        <div className="symbol symbol-60px">
            <div className="symbol-label p-0 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={productName}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onError={() => setFailed(true)}
                />
            </div>
        </div>
    );
};

const extractProductsFromPayload = (payload) => {
    if (!payload) return null;

    const sources = [
        payload?.data?.data,
        payload?.data?.items,
        payload?.data?.products,
        payload?.data?.results,
        payload?.items,
        payload?.products,
        payload?.results,
    ];

    for (const source of sources) {
        if (Array.isArray(source)) {
            return source;
        }
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return null;
};

const extractPaginationFromPayload = (payload, fallbackTotal = 0, previous = {}) => {
    const defaultPagination = {
        current_page: previous.current_page ?? 1,
        per_page: previous.per_page ?? 15,
        total: fallbackTotal ?? previous.total ?? 0,
        last_page: previous.last_page ?? 1,
    };

    const candidates = [
        payload?.data?.pagination,
        payload?.pagination,
        payload?.data?.meta,
        payload?.meta,
        (typeof payload?.data === 'object' && !Array.isArray(payload?.data)) ? payload.data : null,
        (typeof payload === 'object' && !Array.isArray(payload)) ? payload : null,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            continue;
        }

        const currentPage = candidate.current_page ?? candidate.page ?? candidate.page_number;
        const perPage = candidate.per_page ?? candidate.limit ?? candidate.page_size ?? candidate.perPage;
        const total = candidate.total ?? candidate.total_items ?? candidate.count ?? candidate.total_count ?? candidate.records_total;
        const lastPage = candidate.last_page ?? candidate.total_pages ?? candidate.page_count;

        if ([currentPage, perPage, total, lastPage].some((value) => value !== undefined)) {
            const resolvedPerPage = perPage ?? defaultPagination.per_page;
            const resolvedTotal = total ?? defaultPagination.total;
            const resolvedLastPage = lastPage ?? (resolvedPerPage ? Math.max(1, Math.ceil(resolvedTotal / resolvedPerPage)) : defaultPagination.last_page);

            return {
                current_page: currentPage ?? defaultPagination.current_page,
                per_page: resolvedPerPage,
                total: resolvedTotal,
                last_page: resolvedLastPage,
            };
        }
    }

    return defaultPagination;
};

const isSuccessfulProductsResponse = (payload) => {
    if (!payload) {
        return false;
    }

    if (payload.success === false || payload.status === false || payload.error) {
        return false;
    }

    if (payload.success === true || payload.status === true) {
        return true;
    }

    return Array.isArray(extractProductsFromPayload(payload));
};

const getPayloadMessage = (payload) => {
    if (!payload) return null;
    return payload.message || payload.error || payload?.data?.message || null;
};

const initialFilters = {
    search: '',
    merchant_id: '',
    country_id: '',
    date_from: '',
    date_to: '',
    status: '',
};

const AdminProductsIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const { merchantsMap, countriesMap, loading: refDataLoading } = useAdminReferenceData();

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
            const response = await exportProducts({ ...appliedFilters });
            const success = response?.success ?? response?.status;

            const exportPayload = response?.data;
            const exportRows = exportPayload?.data || [];
            if (success && exportRows.length > 0) {
                downloadCSV(exportRows, exportPayload?.filename || 'products_export.csv');
                toast.success(t('admin.paymentGetway.productsExportReady'));
            } else {
                toast.info(t('admin.paymentGetway.productsNoExportData'));
            }
        } catch (error) {
            console.error('Error exporting products:', error);
            toast.error(t('admin.paymentGetway.productsFailedExport'));
        }
    }, [appliedFilters, t]);

    useEffect(() => {
        setTitle(t('admin.paymentGetway.productsManagementTitle'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button className="btn btn-sm btn-flex btn-secondary fw-bold" onClick={() => setShowFilters(!showFilters)}>
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-1 ${showFilters ? '' : 'rotate-90'}`}><span className="path1"></span><span className="path2"></span></i>
                    {t('admin.paymentGetway.toggleFilters')}
                </button>
                <button className="btn btn-sm btn-flex btn-light-primary fw-bold" onClick={handleExport}>
                    <i className="ki-duotone ki-file-down fs-6 text-primary me-1"><span className="path1"></span><span className="path2"></span></i>
                    {t('admin.paymentGetway.export')}
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, handleExport, t]);

    const productParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...appliedFilters,
    }), [pagination.current_page, pagination.per_page, appliedFilters, sortConfig.column, sortConfig.direction]);

    const {
        data: productsData,
        isLoading,
        isFetching,
        error: productsError,
    } = useAdminProducts(productParams);

    useEffect(() => {
        if (!productsData || !isSuccessfulProductsResponse(productsData)) {
            return;
        }

        setPagination(prev => {
            const productsList = extractProductsFromPayload(productsData) ?? [];
            const paginationMeta = extractPaginationFromPayload(productsData, productsList.length, prev);
            const next = {
                ...prev,
                ...paginationMeta,
            };

            if (
                next.current_page === prev.current_page &&
                next.per_page === prev.per_page &&
                next.total === prev.total &&
                next.last_page === prev.last_page
            ) {
                return prev;
            }

            return next;
        });
    }, [productsData]);

    useEffect(() => {
        if (!productsData) return;
        if (!isSuccessfulProductsResponse(productsData)) {
            const message = getPayloadMessage(productsData) || t('admin.paymentGetway.productFailedLoad');
            toast.error(message);
        }
    }, [productsData, t]);

    useEffect(() => {
        if (!productsError) return;
        const message = productsError?.response?.data?.message || productsError.message || t('admin.paymentGetway.productFailedLoad');
        toast.error(message);
    }, [productsError, t]);

    const products = useMemo(() => {
        if (!productsData || !isSuccessfulProductsResponse(productsData)) return [];
        return extractProductsFromPayload(productsData) ?? [];
    }, [productsData]);

    const productShopIds = useMemo(() => {
        if (!products.length) return [];
        const ids = new Set();
        products.forEach((product) => {
            const shopId = product?.shop_id;
            if (shopId !== null && shopId !== undefined) {
                ids.add(shopId);
            }
        });
        return Array.from(ids);
    }, [products]);

    const merchantLookups = useMerchantCountryLookup(productShopIds);

    const isLookupLoading = merchantLookups.loading;
    const merchantPlaceholder = useMemo(() => <span className="placeholder col-6"></span>, []);
    const resolvedPagination = useMemo(() => {
        if (!productsData || !isSuccessfulProductsResponse(productsData)) {
            return pagination;
        }
        const productsList = extractProductsFromPayload(productsData) ?? [];
        return extractPaginationFromPayload(productsData, productsList.length, pagination);
    }, [productsData, pagination]);

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

    const handlePageChange = (page) => {
        const totalPages = Math.max(1, resolvedPagination.last_page || pagination.last_page || 1);
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
            return t('admin.paymentGetway.na');
        }

        const lookupRecord = merchantLookups.getMerchantRecord(shopId);
        if (lookupRecord?.name) {
            return lookupRecord.name;
        }

        if (isLookupLoading) {
            return merchantPlaceholder;
        }

        return merchantsMap[shopId] || `#${shopId}`;
    }, [isLookupLoading, merchantLookups, merchantPlaceholder, merchantsMap, t]);

    const renderCountry = useCallback((shopId) => {
        if (!shopId) {
            return t('admin.paymentGetway.na');
        }

        // Get country name from merchant lookup (merchant has country info)
        const remoteCountryName = merchantLookups.getCountryName(null, shopId);
        if (remoteCountryName) {
            return remoteCountryName;
        }

        if (refDataLoading || isLookupLoading) {
            return countryPlaceholder;
        }

        return t('admin.paymentGetway.na');
    }, [countryPlaceholder, isLookupLoading, merchantLookups, refDataLoading, t]);

    const filtersCard = showFilters ? (
        <ProductFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    if (isLoading && !productsData) {
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
                                    placeholder={t('admin.paymentGetway.productsQuickSearchPlaceholder')}
                                    value={filters.search}
                                    onChange={(e) => handleQuickSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="card-toolbar">
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 text-nowrap">{t('admin.paymentGetway.showLabel')}</label>
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
                                    <tr className="fw-bold text-muted text-end">
                                        <th className="min-w-70px">{t('admin.paymentGetway.productsImage')}</th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')} className="user-select-none">
                                            ID {getSortIcon('id')}
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('merchant_id')} className="user-select-none">
                                            {t('admin.paymentGetway.productsMerchant')} {getSortIcon('merchant_id')}
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')} className="user-select-none">
                                            {t('admin.paymentGetway.productsName')} {getSortIcon('name')}
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sku')} className="user-select-none">
                                            SKU {getSortIcon('sku')}
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category_id')} className="user-select-none">
                                            {t('admin.paymentGetway.productsCategory')} {getSortIcon('category_id')}
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('brand_id')} className="user-select-none">
                                            {t('admin.paymentGetway.productsBrand')} {getSortIcon('brand_id')}
                                        </th>
                                        <th>{t('admin.paymentGetway.viewCountryCol')}</th>
                                        <th className="text-end">{t('admin.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(9)].map((_, j) => (
                                                <td key={j}><span className="placeholder col-7"></span></td>
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
                                placeholder={t('admin.paymentGetway.productsQuickSearchPlaceholder')}
                                value={filters.search}
                                onChange={(e) => handleQuickSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">{t('admin.paymentGetway.showLabel')}</label>
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
                    {isFetching && !isLoading && (
                        <div className="alert alert-info py-3 mb-5 d-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm"></span>
                            <span>{t('admin.paymentGetway.productsRefreshing')}</span>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted text-end">
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')} className="user-select-none">
                                        ID {getSortIcon('id')}
                                    </th>
                                    <th className="min-w-70px">{t('admin.paymentGetway.productsImage')}</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('merchant_id')} className="user-select-none">
                                        {t('admin.paymentGetway.productsMerchant')} {getSortIcon('merchant_id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')} className="user-select-none">
                                        {t('admin.paymentGetway.productsName')} {getSortIcon('name')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sku')} className="user-select-none">
                                        SKU {getSortIcon('sku')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category_id')} className="user-select-none">
                                        {t('admin.paymentGetway.productsCategory')} {getSortIcon('category_id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('brand_id')} className="user-select-none">
                                        {t('admin.paymentGetway.productsBrand')} {getSortIcon('brand_id')}
                                    </th>
                                    <th>{t('admin.paymentGetway.viewCountryCol')}</th>
                                    <th className="text-end">{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? products.map((product) => (
                                    <tr key={product.id}>
                                        <td><span className="text-dark fw-bold">{product.id}</span></td>

                                        <td><ProductThumbnail product={product} /></td>
                                        <td>{renderMerchant(product?.shop_id)}</td>
                                        <td><span className="text-dark fw-bold fs-6">{product.product_name || product.name}</span></td>
                                        <td><span className="text-muted">{product.sku || product.code || t('admin.paymentGetway.na')}</span></td>
                                        <td><span className="text-muted">{getTranslatedText(product.category?.name) || t('admin.paymentGetway.na')}</span></td>
                                        <td><span className="text-muted">{getTranslatedText(product.brand?.name) || t('admin.paymentGetway.na')}</span></td>
                                        <td>{renderCountry(product?.shop_id)}</td>
                                        <td className="text-end">
                                            <Link to={`/admin/sales/products/${product.id}`} className="btn btn-sm btn-primary">{t('admin.common.show')}</Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="9" className="text-center py-5"><div className="text-muted">{t('admin.paymentGetway.productsNoProductsFound')}</div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {resolvedPagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap pt-5">
                            <div className="fs-6 fw-bold text-gray-700">
                                {(() => {
                                    const total = resolvedPagination.total ?? 0;
                                    const perPage = resolvedPagination.per_page ?? pagination.per_page ?? 15;
                                    const currentPage = pagination.current_page ?? 1;
                                    if (total === 0) {
                                        return t('admin.paymentGetway.productsShowingZero');
                                    }
                                    const start = ((currentPage - 1) * perPage) + 1;
                                    const end = Math.min(currentPage * perPage, total);
                                    return t('admin.paymentGetway.productsShowingRange', { start, end, total });
                                })()}
                            </div>
                            <ul className="pagination">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}>{t('admin.common.previous')}</button>
                                </li>
                                {buildPaginationRange(resolvedPagination.last_page, pagination.current_page, 1).map((page, index) => (
                                    typeof page === 'number' ? (
                                        <li key={`page-${page}`} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
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
                                <li className={`page-item ${pagination.current_page === resolvedPagination.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === resolvedPagination.last_page}>{t('admin.common.next')}</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminProductsIndex;
