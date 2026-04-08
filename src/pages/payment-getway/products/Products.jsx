import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../../../utils/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import SearchableDropdown from '../../../common/filters/SearchableDropdown';
import { getToken } from '../../../utils/api';
import { getPartnersSelect } from '../../../services/adminPartnersService';
import { formatDateTime } from '../../../utils/helpers';
import {
    fetchProducts,
    deleteProduct,
    bulkDeleteProducts,
    toggleProductStatus,
    exportGatewayProducts,
} from '../../../services/serviceProductsService';
import useCountryInfoByIds from '../../../hooks/useCountryInfoByIds';

const resolveServiceName = (service) => {
    if (!service) return 'N/A';
    if (service.service_name_en || service.service_name_ar) {
        return service.service_name_en || service.service_name_ar || 'N/A';
    }
    if (service.service_name && typeof service.service_name === 'object') {
        return service.service_name.en || service.service_name.ar || 'N/A';
    }
    return service.id || 'N/A';
};

const resolveProductName = (product) => {
    if (!product) return 'N/A';
    if (product.name_en || product.name_ar) return product.name_en || product.name_ar;
    if (product.name && typeof product.name === 'object') {
        return product.name.en || product.name.ar || 'N/A';
    }
    return 'N/A';
};

/** Server resolves copy from Accept-Language via description_text; fallback for older payloads. */
const resolveProductDescription = (product) => {
    if (!product) return '';
    if (product.description_text != null && String(product.description_text).trim() !== '') {
        return String(product.description_text).trim();
    }
    const lang =
        (typeof document !== 'undefined' && document.documentElement?.lang?.toLowerCase().startsWith('ar'))
            ? 'ar'
            : 'en';
    if (lang === 'ar' && product.description_ar) return String(product.description_ar);
    if (lang === 'en' && product.description_en) return String(product.description_en);
    return product.description_en || product.description_ar || '';
};

const pickProductCountryId = (product) =>
    product?.country_id ??
    product?.country?.id ??
    product?.service?.country_id ??
    product?.service?.country?.id ??
    null;

/** Prefer nested country from API; otherwise resolve by UUID via Auth countries index (see useCountryInfoByIds). */
const getProductCountryDisplay = (product, getCountryById, lookupLoading) => {
    const c = product?.country || product?.service?.country;
    if (c) {
        const n = c.name;
        let label = '';
        if (typeof n === 'string') label = n.trim();
        else if (n && typeof n === 'object') label = (n.en || n.ar || '').trim();
        if (label) {
            return { label, code: c.short_name || c.code || null };
        }
    }
    const cid = pickProductCountryId(product);
    if (!cid) {
        return { label: 'N/A', code: null };
    }
    const r = getCountryById(cid);
    if (r?.name) {
        return { label: r.name, code: r.code || r.short_name || null };
    }
    if (r && !r.name) {
        return { label: 'N/A', code: null };
    }
    if (lookupLoading) {
        return { label: '…', code: null };
    }
    return { label: 'N/A', code: null };
};

const Products = () => {
    const [searchParams] = useSearchParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        is_active: null,
        country_id: '',
        merchant_id: '',
        service_type: '',
        date_from: '',
        date_to: '',
    });

    const setFilterValue = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    }, []);

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const countryIdsForLookup = useMemo(
        () =>
            [
                ...new Set(
                    products
                        .map((p) => pickProductCountryId(p))
                        .filter((id) => id !== null && id !== undefined && id !== '')
                        .map(String)
                ),
            ],
        [products]
    );

    const { getCountryById, loading: countryLookupLoading } = useCountryInfoByIds(countryIdsForLookup);

    const [contentProviders, setContentProviders] = useState([]);
    const [loadingContentProviders, setLoadingContentProviders] = useState(false);
    const [contentProvidersEnabled, setContentProvidersEnabled] = useState(false);
    const [contentProviderSearchTerm, setContentProviderSearchTerm] = useState('');
    const [selectedContentProviderOption, setSelectedContentProviderOption] = useState(null);

    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [countriesEnabled, setCountriesEnabled] = useState(false);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [selectedCountryOption, setSelectedCountryOption] = useState(null);

    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Apply ?partner_id= from URL — maps to partner filter (API: partner_id / merchant_id on service)
    useEffect(() => {
        const pid = searchParams.get('partner_id');
        if (!pid) return;
        setFilters((prev) => {
            if (String(prev.merchant_id) === String(pid)) return prev;
            return { ...prev, merchant_id: pid };
        });
        setShowFilters(true);
    }, [searchParams]);

    useEffect(() => {
        setTitle('Service Product Management');
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Service Products', path: '/admin/service-products' },
        ]);
        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProductList = useCallback(async () => {
        setLoading(true);
        setIsFetching(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: debouncedSearchTerm || undefined,
                is_active: filters.is_active !== null ? filters.is_active : undefined,
                country_id: filters.country_id || undefined,
                /** Prefer partner_id for gateway products (matches ?partner_id= deep links) */
                partner_id: filters.merchant_id || undefined,
                service_type: filters.service_type || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            };
            Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

            const response = await fetchProducts(params);
            if (response.success) {
                setProducts(response.data || []);
                const meta = response.meta || {};
                setPagination((prev) => ({
                    ...prev,
                    current_page: meta.current_page || 1,
                    total: meta.total || 0,
                    last_page: meta.last_page || 1,
                }));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    }, [
        pagination.current_page,
        pagination.per_page,
        debouncedSearchTerm,
        filters.is_active,
        filters.country_id,
        filters.merchant_id,
        filters.service_type,
        filters.date_from,
        filters.date_to,
    ]);

    useEffect(() => {
        fetchProductList();
    }, [fetchProductList]);

    const loadContentProviders = useCallback(async (search = '', operatorId = null, countryId = null) => {
        try {
            setLoadingContentProviders(true);
            const params = { per_page: 50 };
            if (search) params.search = search;
            if (operatorId) params.operator_id = operatorId;
            if (countryId) params.country_id = countryId;
            const result = await getPartnersSelect(params);
            if (!result.success) {
                setContentProviders([]);
                return;
            }
            const body = result.data;
            if (body && (body.status === true || body.success === true)) {
                const list = Array.isArray(body.data) ? body.data : [];
                setContentProviders(
                    list.map((cp) => ({
                        value: cp.id,
                        label:
                            (typeof cp.name === 'string'
                                ? cp.name
                                : cp.name?.en || cp.name?.ar) ||
                            cp.text ||
                            cp.business_name ||
                            String(cp.id),
                        ...cp,
                    }))
                );
            } else {
                setContentProviders([]);
            }
        } catch (error) {
            console.error('Error loading content providers:', error);
            setContentProviders([]);
        } finally {
            setLoadingContentProviders(false);
        }
    }, []);

    const loadCountries = useCallback(async (search = '') => {
        try {
            setLoadingCountries(true);
            const token = getToken();
            const url = search
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(search)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.status) {
                const list = Array.isArray(response.data.data) ? response.data.data : [];
                setCountries(
                    list.map((country) => ({
                        value: country.id,
                        label: country.text || country.name?.en || country.name,
                        code: country.code || country.short_name || country.code_iso2,
                        ...country,
                    }))
                );
            } else {
                setCountries([]);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
            setCountries([]);
        } finally {
            setLoadingCountries(false);
        }
    }, []);

    const contentProviderOptions = useMemo(
        () => [
            { value: '', label: 'All Partners' },
            ...contentProviders.map((cp) => ({
                value: cp.value,
                label: cp.label,
            })),
        ],
        [contentProviders]
    );

    const countryOptions = useMemo(
        () => [
            { value: '', label: 'All Countries', code: null },
            ...countries.map((country) => ({
                value: country.value,
                label: country.label,
                code: country.code,
                ...country,
            })),
        ],
        [countries]
    );

    useEffect(() => {
        if (!contentProvidersEnabled) return;
        const handler = setTimeout(() => {
            loadContentProviders(contentProviderSearchTerm, null, filters.country_id || null);
        }, 300);
        return () => clearTimeout(handler);
    }, [contentProvidersEnabled, contentProviderSearchTerm, filters.country_id, loadContentProviders]);

    useEffect(() => {
        if (!countriesEnabled) return;
        const handler = setTimeout(() => {
            loadCountries(countrySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [countriesEnabled, countrySearchTerm, loadCountries]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const params = {
                search: debouncedSearchTerm || undefined,
                is_active: filters.is_active !== null ? filters.is_active : undefined,
                country_id: filters.country_id || undefined,
                partner_id: filters.merchant_id || undefined,
                service_type: filters.service_type || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            };
            Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

            const response = await exportGatewayProducts(params);
            if (response.success && response.data) {
                const data = response.data;
                const headers = Object.keys(data[0] || {});
                const csv = [
                    headers.join(','),
                    ...data.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('Products exported successfully');
            }
        } catch (error) {
            console.error('Error exporting products:', error);
            toast.error(error.response?.data?.message || 'Failed to export products');
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });
        if (!result.isConfirmed) return;
        try {
            const response = await deleteProduct(id);
            if (response.success) {
                toast.success('Product deleted successfully');
                fetchProductList();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select products to delete');
            return;
        }
        const result = await Swal.fire({
            title: 'Delete selected products?',
            text: `You are about to delete ${selectedIds.length} product(s).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
        });
        if (!result.isConfirmed) return;
        try {
            const response = await bulkDeleteProducts(selectedIds);
            if (response.success) {
                toast.success('Products deleted successfully');
                setSelectedIds([]);
                setSelectAll(false);
                fetchProductList();
            }
        } catch (error) {
            console.error('Error deleting products:', error);
            toast.error(error.response?.data?.message || 'Failed to delete products');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const response = await toggleProductStatus(id);
            if (response.success) {
                toast.success('Product status updated');
                fetchProductList();
            }
        } catch (error) {
            console.error('Error toggling product status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map((p) => p.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handlePageChange = (page) => {
        setPagination((prev) => ({ ...prev, current_page: page }));
    };

    const handlePerPageChange = (newPerPage) => {
        setPagination((prev) => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            is_active: null,
            country_id: '',
            merchant_id: '',
            service_type: '',
            date_from: '',
            date_to: '',
        });
        setSearchTerm('');
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        setCountrySearchTerm('');
        setOperatorSearchTerm('');
        setContentProviderSearchTerm('');
        setSelectedCountryOption(null);
        setSelectedOperatorOption(null);
        setSelectedContentProviderOption(null);
        setCountriesEnabled(false);
        setContentProvidersEnabled(false);
    };

    const handleCountrySelect = useCallback(
        (option) => {
            if (option && option.value === '') {
                setSelectedCountryOption(null);
                setFilterValue('country_id', '');
                setFilterValue('merchant_id', '');
                setSelectedContentProviderOption(null);
                setContentProviders([]);
            } else {
                setSelectedCountryOption(option);
                setFilterValue('country_id', option?.value || '');
                setFilterValue('merchant_id', '');
                setSelectedContentProviderOption(null);
                setContentProviders([]);
            }
        },
        [setFilterValue]
    );

    const handleCountryClear = useCallback(() => {
        setSelectedCountryOption(null);
        setFilterValue('country_id', '');
    }, [setFilterValue]);

    const handleCountryOpen = useCallback(() => {
        setCountriesEnabled(true);
        if (countries.length === 0 && !loadingCountries) {
            loadCountries(countrySearchTerm);
        }
    }, [countries.length, loadingCountries, countrySearchTerm, loadCountries]);

    const handleCountrySearchChange = useCallback((value) => {
        setCountrySearchTerm(value);
        setCountriesEnabled(true);
    }, []);

    const handleContentProviderSelect = useCallback(
        (option) => {
            if (option && option.value === '') {
                setSelectedContentProviderOption(null);
                setFilterValue('merchant_id', '');
            } else {
                setSelectedContentProviderOption(option);
                setFilterValue('merchant_id', option?.value || '');
            }
        },
        [setFilterValue]
    );

    const handleContentProviderClear = useCallback(() => {
        setSelectedContentProviderOption(null);
        setFilterValue('merchant_id', '');
    }, [setFilterValue]);

    const handleContentProviderOpen = useCallback(() => {
        setContentProvidersEnabled(true);
        if (contentProviders.length === 0 && !loadingContentProviders) {
            loadContentProviders(contentProviderSearchTerm, null, filters.country_id || null);
        }
    }, [
        contentProviders.length,
        loadingContentProviders,
        contentProviderSearchTerm,
        filters.country_id,
        loadContentProviders,
    ]);

    const handleContentProviderSearchChange = useCallback((value) => {
        setContentProviderSearchTerm(value);
        setContentProvidersEnabled(true);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!filters.country_id) {
                setSelectedCountryOption(null);
                return;
            }
            if (selectedCountryOption && String(selectedCountryOption.value) === String(filters.country_id)) {
                return;
            }
            const option = countryOptions.find((item) => String(item.value) === String(filters.country_id));
            if (option) setSelectedCountryOption(option);
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.country_id, countryOptions, selectedCountryOption]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!filters.merchant_id) {
                setSelectedContentProviderOption(null);
                return;
            }
            if (
                selectedContentProviderOption &&
                String(selectedContentProviderOption.value) === String(filters.merchant_id)
            ) {
                return;
            }
            const option = contentProviderOptions.find(
                (item) => String(item.value) === String(filters.merchant_id)
            );
            if (option) setSelectedContentProviderOption(option);
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.merchant_id, contentProviderOptions, selectedContentProviderOption]);

    useEffect(() => {
        if (!filters.country_id) return;
        if (countries.length > 0 || loadingCountries) return;
        setCountriesEnabled(true);
        loadCountries('');
    }, [filters.country_id, countries.length, loadingCountries, loadCountries]);

    useEffect(() => {
        if (!filters.merchant_id) return;
        if (contentProviders.length > 0 || loadingContentProviders) return;
        setContentProvidersEnabled(true);
        loadContentProviders('', null, filters.country_id || null);
    }, [
        filters.merchant_id,
        contentProviders.length,
        loadingContentProviders,
        filters.country_id,
        loadContentProviders,
    ]);

    useEffect(() => {
        setActions(
            <div className="d-flex gap-2">
                <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-filter fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button type="button" onClick={handleExport} className="btn btn-sm btn-success" disabled={exporting}>
                    {exporting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <i className="ki-duotone ki-exit-up fs-3 me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Export
                        </>
                    )}
                </button>
                {selectedIds.length > 0 && (
                    <button type="button" className="btn btn-sm btn-danger" onClick={handleBulkDelete}>
                        <i className="ki-duotone ki-trash fs-3 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        Delete Selected ({selectedIds.length})
                    </button>
                )}
                <Link to="/admin/service-products/create" className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-plus fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    Add Product
                </Link>
            </div>
        );
        return () => setActions(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFilters, exporting, selectedIds.length]);

    const partnerName = (product) => {
        const candidate =
            product?.partner ||
            product?.merchant ||
            product?.contentProvider ||
            product?.service?.partner ||
            product?.service?.merchant ||
            product?.service?.contentProvider ||
            null;

        if (!candidate) return 'N/A';

        const name =
            (typeof candidate.name === 'string' ? candidate.name : candidate.name?.en || candidate.name?.ar) ||
            candidate.business_name ||
            candidate.merchant_name ||
            candidate.partner_name ||
            candidate.text ||
            '';

        return String(name || '').trim() || 'N/A';
    };

    return (
        <>
            {showFilters && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-header border-0 pt-6 pb-4">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold fs-3 mb-1">Filter Products</span>
                            <span className="text-muted mt-1 fw-semibold fs-7">
                                Same filters as services: country, partner, dates, active state, service type
                            </span>
                        </h3>
                    </div>
                    <div className="card-body pt-0">
                        <div className="row g-4">
                            <div className="col-md-6 col-lg-3">
                                <SearchableDropdown
                                    label="Country"
                                    placeholder="All Countries"
                                    options={countryOptions}
                                    selected={selectedCountryOption}
                                    onSelect={handleCountrySelect}
                                    onClear={handleCountryClear}
                                    loading={loadingCountries}
                                    onOpen={handleCountryOpen}
                                    onSearchChange={handleCountrySearchChange}
                                    searchPlaceholder="Search countries..."
                                    renderSelected={(option) =>
                                        option ? (
                                            <div className="d-flex align-items-center">
                                                {option.code && (
                                                    <img
                                                        src={`/flags/${option.code?.toLowerCase()}.png`}
                                                        alt={option.label}
                                                        className="me-2"
                                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <span>{option.label}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted fw-semibold">All Countries</span>
                                        )
                                    }
                                    renderOption={(option) => {
                                        const isAllSelected = option.value === '' && !selectedCountryOption;
                                        return (
                                            <div className="d-flex align-items-center">
                                                {(isAllSelected ||
                                                    (selectedCountryOption &&
                                                        String(selectedCountryOption.value) === String(option.value))) && (
                                                    <i className="ki-duotone ki-check fs-5 text-primary me-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                )}
                                                {option.code && (
                                                    <img
                                                        src={`/flags/${option.code?.toLowerCase()}.png`}
                                                        alt={option.label}
                                                        className="me-3"
                                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <span className={isAllSelected ? 'fw-bold text-primary' : ''}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                            <div className="col-md-6 col-lg-3">
                                <SearchableDropdown
                                    label="Partner"
                                    placeholder="All Partners"
                                    options={contentProviderOptions}
                                    selected={selectedContentProviderOption}
                                    onSelect={handleContentProviderSelect}
                                    onClear={handleContentProviderClear}
                                    loading={loadingContentProviders}
                                    onOpen={handleContentProviderOpen}
                                    onSearchChange={handleContentProviderSearchChange}
                                    searchPlaceholder="Search partners..."
                                    renderOption={(option) => {
                                        const isAllSelected = option.value === '' && !selectedContentProviderOption;
                                        return (
                                            <div className="d-flex align-items-center">
                                                {(isAllSelected ||
                                                    (selectedContentProviderOption &&
                                                        String(selectedContentProviderOption.value) ===
                                                            String(option.value))) && (
                                                    <i className="ki-duotone ki-check fs-5 text-primary me-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                )}
                                                <span className={isAllSelected ? 'fw-bold text-primary' : ''}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                            <div className="col-md-6 col-lg-3">
                                <label className="form-label fw-bold">Service type</label>
                                <select
                                    className="form-select form-select-lg"
                                    value={filters.service_type}
                                    onChange={(e) => setFilterValue('service_type', e.target.value)}
                                >
                                    <option value="">All types</option>
                                    <option value="digital">Digital</option>
                                    <option value="ivr">IVR</option>
                                    <option value="sms">SMS</option>
                                </select>
                            </div>
                            <div className="col-md-6 col-lg-3">
                                <label className="form-label fw-bold">Active status</label>
                                <select
                                    className="form-select form-select-lg"
                                    value={filters.is_active === null ? '' : filters.is_active ? '1' : '0'}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setFilterValue('is_active', v === '' ? null : v === '1');
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="1">Active only</option>
                                    <option value="0">Inactive only</option>
                                </select>
                            </div>
                            <div className="col-md-6 col-lg-3">
                                <label className="form-label fw-bold">Date from</label>
                                <input
                                    type="date"
                                    className="form-control form-control-lg"
                                    value={filters.date_from}
                                    onChange={(e) => setFilterValue('date_from', e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 col-lg-3">
                                <label className="form-label fw-bold">Date to</label>
                                <input
                                    type="date"
                                    className="form-control form-control-lg"
                                    value={filters.date_to}
                                    onChange={(e) => setFilterValue('date_to', e.target.value)}
                                />
                            </div>
                            <div className="col-12">
                                <div className="separator separator-dashed my-4" />
                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" onClick={resetFilters} className="btn btn-light btn-lg">
                                        <i className="ki-duotone ki-arrows-circle fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Reset all filters
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(false)}
                                        className="btn btn-primary btn-lg"
                                    >
                                        <i className="ki-duotone ki-check fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Apply filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3 w-100">
                        <div
                            className="d-flex flex-column flex-sm-row flex-wrap align-items-stretch align-items-sm-center gap-2 flex-grow-1"
                            style={{ minWidth: 0 }}
                        >
                            <div className="flex-grow-1" style={{ minWidth: '200px', maxWidth: '420px' }}>
                                <label className="form-label mb-1 text-muted fs-7 text-uppercase">Search</label>
                                <div className="d-flex align-items-center position-relative" style={{ minWidth: '250px' }}>
                                    <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 1 }}>
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-solid ps-13"
                                        placeholder="Product name, URLs…"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoComplete="off"
                                        style={{ paddingLeft: '3rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex align-items-end gap-2 flex-shrink-0">
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 text-nowrap">Per page:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: '80px' }}
                                    value={pagination.per_page}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
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
                </div>

                <div className="card-body pt-0">
                    {isFetching && !loading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100" />
                            </div>
                        </div>
                    )}

                    <div
                        className="table-responsive"
                        style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}
                    >
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="min-w-90px">Image</th>
                                    <th className="min-w-150px">Country</th>
                                    <th className="min-w-125px">Partner</th>
                                    <th className="min-w-150px">Service</th>
                                    <th className="min-w-150px">Product name</th>
                                    <th className="min-w-200px">Description</th>
                                    <th className="min-w-80px text-center">Forms</th>
                                    <th className="min-w-100px">Status</th>
                                    <th className="min-w-140px text-nowrap">Created</th>
                                    <th className="text-end min-w-120px">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {loading && products.length === 0 ? (
                                    Array.from({ length: 10 }).map((_, index) => (
                                        <tr key={`sk-${index}`}>
                                            <td colSpan="11">
                                                <div
                                                    className="placeholder"
                                                    style={{
                                                        width: '100%',
                                                        height: '40px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d',
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : products.length > 0 ? (
                                    products.map((product) => {
                                        const { label: countryLabel, code } = getProductCountryDisplay(
                                            product,
                                            getCountryById,
                                            countryLookupLoading
                                        );
                                        return (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedIds.includes(product.id)}
                                                            onChange={() => handleSelectOne(product.id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="symbol symbol-40px">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={resolveProductName(product)}
                                                                className="rounded"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="symbol-label fs-7 fw-semibold text-primary bg-light-primary">
                                                                {resolveProductName(product).charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {code && (
                                                            <img
                                                                src={`/flags/${code.toLowerCase()}.png`}
                                                                alt=""
                                                                className="me-2"
                                                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <span className="text-gray-800">{countryLabel}</span>
                                                    </div>
                                                </td>
                                                <td>{partnerName(product)}</td>
                                                <td>
                                                    <div className="text-gray-800 text-hover-primary mb-1">
                                                        {resolveServiceName(product.service)}
                                                    </div>
                                                    {product.service?.id && (
                                                        <div className="text-muted fs-7 text-break">UUID: {product.service.id}</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="text-dark fw-bold fs-6">{resolveProductName(product)}</span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="text-gray-700 fs-7 d-inline-block text-truncate"
                                                        style={{ maxWidth: '280px' }}
                                                        title={resolveProductDescription(product) || undefined}
                                                    >
                                                        {resolveProductDescription(product) || '—'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge badge-light-primary fs-7">
                                                        {product.forms_count ?? 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="form-check form-switch form-check-custom form-check-solid d-flex justify-content-center">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={product.status === true || product.status === 1}
                                                            onChange={() => handleToggleStatus(product.id)}
                                                            style={{ cursor: 'pointer' }}
                                                            title={product.status ? 'Click to deactivate' : 'Click to activate'}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-gray-700 fs-7 text-nowrap">
                                                        {product.created_at ? formatDateTime(product.created_at) : '—'}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <Link
                                                        to={`/admin/service-products/${product.id}/edit`}
                                                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                                                        title="Edit"
                                                    >
                                                        <i className="ki-duotone ki-pencil fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                                                        onClick={() => handleDelete(product.id)}
                                                        title="Delete"
                                                    >
                                                        <i className="ki-duotone ki-trash fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                            <span className="path3"></span>
                                                            <span className="path4"></span>
                                                            <span className="path5"></span>
                                                        </i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="text-center py-5">
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && pagination.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center pt-4">
                            <div className="text-muted">
                                Showing {products.length} of {pagination.total || 0} products
                                {pagination.last_page > 1 &&
                                    ` (Page ${pagination.current_page} of ${pagination.last_page})`}
                            </div>
                            <nav>
                                <ul className="pagination mb-0">
                                    <li
                                        className={`page-item ${
                                            pagination.current_page === 1 || isFetching ? 'disabled' : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="page-link"
                                            onClick={() => handlePageChange(Math.max(pagination.current_page - 1, 1))}
                                            disabled={pagination.current_page === 1 || isFetching}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {[...Array(Math.min(pagination.last_page, 10))].map((_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${
                                                    pagination.current_page === pageNum ? 'active' : ''
                                                } ${isFetching ? 'disabled' : ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    disabled={isFetching}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    {pagination.last_page > 10 && (
                                        <li className="page-item disabled">
                                            <span className="page-link">...</span>
                                        </li>
                                    )}
                                    <li
                                        className={`page-item ${
                                            pagination.current_page === pagination.last_page || isFetching
                                                ? 'disabled'
                                                : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="page-link"
                                            onClick={() =>
                                                handlePageChange(
                                                    Math.min(pagination.current_page + 1, pagination.last_page)
                                                )
                                            }
                                            disabled={pagination.current_page === pagination.last_page || isFetching}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Products;
