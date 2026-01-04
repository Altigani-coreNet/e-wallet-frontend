import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts, deleteProduct, exportProducts, downloadProductTemplate, fetchCategoriesForSelect, fetchBrandsForSelect, fetchTagsForSelect, fetchTaxesForSelect, fetchWarehousesForSelect, productsKeys } from '../../../services/productsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { POS_API_BASE } from '../../../utils/constants';
import ProductImportModal from './ProductImportModal';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

export default function Products() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination state
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
    });
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });
    
    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category_id: '',
        brand_id: '',
        warehouse_id: '',
        tax_id: '',
        tag_id: '',
        status: '',
        date_from: '',
        date_to: '',
    });

    const setFilterValue = useCallback((key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);
    
    // Filter options (lazy-loaded, each with own state & search)
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesEnabled, setCategoriesEnabled] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [selectedCategoryOption, setSelectedCategoryOption] = useState(null);

    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [brandsEnabled, setBrandsEnabled] = useState(false);
    const [brandSearchTerm, setBrandSearchTerm] = useState('');
    const [selectedBrandOption, setSelectedBrandOption] = useState(null);

    const [tags, setTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [tagsEnabled, setTagsEnabled] = useState(false);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [selectedTagOption, setSelectedTagOption] = useState(null);

    const [taxes, setTaxes] = useState([]);
    const [loadingTaxes, setLoadingTaxes] = useState(false);
    const [taxesEnabled, setTaxesEnabled] = useState(false);
    const [taxSearchTerm, setTaxSearchTerm] = useState('');
    const [selectedTaxOption, setSelectedTaxOption] = useState(null);

    const [warehouses, setWarehouses] = useState([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [warehousesEnabled, setWarehousesEnabled] = useState(false);
    const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
    const [selectedWarehouseOption, setSelectedWarehouseOption] = useState(null);
    
    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Export loading state
    const [exporting, setExporting] = useState(false);

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    
    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Debounced filters
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Build query params for React Query
    const queryParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: debouncedSearchTerm || undefined,
        sort_by: sortConfig.column,
        sort_direction: sortConfig.direction,
        ...debouncedFilters
    }), [pagination.current_page, pagination.per_page, debouncedSearchTerm, sortConfig.column, sortConfig.direction, debouncedFilters]);

    // Use React Query to fetch products
    const { 
        data: productsResponse, 
        isLoading, 
        isFetching, 
        error: queryError,
        refetch 
    } = useProducts(queryParams, {
        keepPreviousData: true,
        onSuccess: () => {
            // Pagination is now handled in useEffect below to stay in sync with productsResponse
        },
        onError: (err) => {
            console.error('Error fetching products:', err);
            toast.error('Failed to load products');
        }
    });

    // Extract products from response
    const products = useMemo(() => {
        const productsData = productsResponse?.data?.products || [];
        return Array.isArray(productsData) ? productsData : [];
    }, [productsResponse]);

    // Update pagination from response (sync with productsResponse)
    useEffect(() => {
        if (productsResponse?.data?.pagination) {
            const paginationData = productsResponse.data.pagination;
            setPagination({
                current_page: parseInt(paginationData.current_page) || 1,
                per_page: parseInt(paginationData.per_page) || 10,
                total: parseInt(paginationData.total) || 0,
                last_page: parseInt(paginationData.last_page) || 1,
            });
        }
    }, [productsResponse]);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Products Management');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Products', path: '/sales/products' },
            { label: 'List Products', path: '/sales/products', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set toolbar actions (updates when showFilters changes)
    useEffect(() => {
        setActions(
            <div className="d-flex gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn btn-sm btn-light"
                >
                    <i className="ki-duotone ki-filter fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button 
                    onClick={handleExport} 
                    className="btn btn-sm btn-success"
                    disabled={exporting}
                >
                    {exporting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
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
                <button onClick={() => setShowImportModal(true)} className="btn btn-sm btn-warning">
                    <i className="ki-duotone ki-exit-down fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Import
                </button>
                <Link to="/sales/products/create" className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-plus fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    Add Product
                </Link>
            </div>
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFilters, exporting]);

    const resolveEntityLabel = useCallback((entity) => {
        if (!entity) return '';
        if (typeof entity.label === 'string' && entity.label.trim()) {
            return entity.label;
        }
        if (typeof entity.name === 'string') {
            return entity.name;
        }
        if (entity.name && typeof entity.name === 'object') {
            return (
                entity.name.en ||
                entity.name.ar ||
                Object.values(entity.name).find((value) => typeof value === 'string' && value.trim()) ||
                ''
            );
        }
        if (entity.title) return entity.title;
        if (entity.display_name) return entity.display_name;
        if (entity.code) return entity.code;
        return entity.id ? `#${entity.id}` : '';
    }, []);

    const loadCategories = useCallback(
        async (search = '') => {
            try {
                setLoadingCategories(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const res = await fetchCategoriesForSelect(params);
                // fetchCategoriesForSelect already returns the array directly
                const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
                setCategories(list);
            } catch (error) {
                console.error('Error loading categories:', error);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        },
        []
    );

    const loadBrands = useCallback(
        async (search = '') => {
            try {
                setLoadingBrands(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const res = await fetchBrandsForSelect(params);
                // fetchBrandsForSelect already returns the array directly
                const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
                setBrands(list);
            } catch (error) {
                console.error('Error loading brands:', error);
                setBrands([]);
            } finally {
                setLoadingBrands(false);
            }
        },
        []
    );

    const loadTags = useCallback(
        async (search = '') => {
            try {
                setLoadingTags(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const res = await fetchTagsForSelect(params);
                // fetchTagsForSelect already returns the array directly
                const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
                setTags(list);
            } catch (error) {
                console.error('Error loading tags:', error);
                setTags([]);
            } finally {
                setLoadingTags(false);
            }
        },
        []
    );

    const loadTaxes = useCallback(
        async (search = '') => {
            try {
                setLoadingTaxes(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const res = await fetchTaxesForSelect(params);
                // fetchTaxesForSelect already returns the array directly
                const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
                setTaxes(list);
            } catch (error) {
                console.error('Error loading taxes:', error);
                setTaxes([]);
            } finally {
                setLoadingTaxes(false);
            }
        },
        []
    );

    const loadWarehouses = useCallback(
        async (search = '') => {
            try {
                setLoadingWarehouses(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const res = await fetchWarehousesForSelect(params);
                // fetchWarehousesForSelect already returns the array directly
                const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
                setWarehouses(list);
            } catch (error) {
                console.error('Error loading warehouses:', error);
                setWarehouses([]);
            } finally {
                setLoadingWarehouses(false);
            }
        },
        []
    );

    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                value: category.id,
                label: resolveEntityLabel(category),
            })),
        [categories, resolveEntityLabel]
    );

    const brandOptions = useMemo(
        () =>
            brands.map((brand) => ({
                value: brand.id,
                label: resolveEntityLabel(brand),
            })),
        [brands, resolveEntityLabel]
    );

    const tagOptions = useMemo(
        () =>
            tags.map((tag) => ({
                value: tag.id,
                label: resolveEntityLabel(tag),
            })),
        [tags, resolveEntityLabel]
    );

    const taxOptions = useMemo(
        () =>
            taxes.map((tax) => {
                const baseLabel = resolveEntityLabel(tax);
                const label =
                    tax.rate !== undefined && tax.rate !== null
                        ? `${baseLabel} (${tax.rate}%)`
                        : baseLabel;
                return {
                    value: tax.id,
                    label,
                };
            }),
        [taxes, resolveEntityLabel]
    );

    const warehouseOptions = useMemo(
        () =>
            warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: resolveEntityLabel(warehouse),
            })),
        [warehouses, resolveEntityLabel]
    );

    useEffect(() => {
        // Use setTimeout to prevent setState during render
        const timer = setTimeout(() => {
            if (!filters.category_id) {
                setSelectedCategoryOption(null);
                return;
            }
            if (selectedCategoryOption && String(selectedCategoryOption.value) === String(filters.category_id)) {
                return;
            }
            const option = categoryOptions.find((item) => String(item.value) === String(filters.category_id));
            if (option) {
                setSelectedCategoryOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.category_id, categoryOptions, selectedCategoryOption]);

    useEffect(() => {
        // Use setTimeout to prevent setState during render
        const timer = setTimeout(() => {
            if (!filters.brand_id) {
                setSelectedBrandOption(null);
                return;
            }
            if (selectedBrandOption && String(selectedBrandOption.value) === String(filters.brand_id)) {
                return;
            }
            const option = brandOptions.find((item) => String(item.value) === String(filters.brand_id));
            if (option) {
                setSelectedBrandOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.brand_id, brandOptions, selectedBrandOption]);

    useEffect(() => {
        // Use setTimeout to prevent setState during render
        const timer = setTimeout(() => {
            if (!filters.tag_id) {
                setSelectedTagOption(null);
                return;
            }
            if (selectedTagOption && String(selectedTagOption.value) === String(filters.tag_id)) {
                return;
            }
            const option = tagOptions.find((item) => String(item.value) === String(filters.tag_id));
            if (option) {
                setSelectedTagOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.tag_id, tagOptions, selectedTagOption]);

    useEffect(() => {
        // Use setTimeout to prevent setState during render
        const timer = setTimeout(() => {
            if (!filters.tax_id) {
                setSelectedTaxOption(null);
                return;
            }
            if (selectedTaxOption && String(selectedTaxOption.value) === String(filters.tax_id)) {
                return;
            }
            const option = taxOptions.find((item) => String(item.value) === String(filters.tax_id));
            if (option) {
                setSelectedTaxOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.tax_id, taxOptions, selectedTaxOption]);

    useEffect(() => {
        // Use setTimeout to prevent setState during render
        const timer = setTimeout(() => {
            if (!filters.warehouse_id) {
                setSelectedWarehouseOption(null);
                return;
            }
            if (
                selectedWarehouseOption &&
                String(selectedWarehouseOption.value) === String(filters.warehouse_id)
            ) {
                return;
            }
            const option = warehouseOptions.find((item) => String(item.value) === String(filters.warehouse_id));
            if (option) {
                setSelectedWarehouseOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.warehouse_id, warehouseOptions, selectedWarehouseOption]);

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

    useEffect(() => {
        if (!categoriesEnabled) return;
        const handler = setTimeout(() => {
            loadCategories(categorySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [categoriesEnabled, categorySearchTerm, loadCategories]);

    useEffect(() => {
        if (!filters.category_id) return;
        if (categories.length > 0 || loadingCategories) return;
        setCategoriesEnabled(true);
        loadCategories('');
    }, [filters.category_id, categories.length, loadingCategories, loadCategories]);

    useEffect(() => {
        if (!brandsEnabled) return;
        const handler = setTimeout(() => {
            loadBrands(brandSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [brandsEnabled, brandSearchTerm, loadBrands]);

    useEffect(() => {
        if (!filters.brand_id) return;
        if (brands.length > 0 || loadingBrands) return;
        setBrandsEnabled(true);
        loadBrands('');
    }, [filters.brand_id, brands.length, loadingBrands, loadBrands]);

    useEffect(() => {
        if (!tagsEnabled) return;
        const handler = setTimeout(() => {
            loadTags(tagSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [tagsEnabled, tagSearchTerm, loadTags]);

    useEffect(() => {
        if (!filters.tag_id) return;
        if (tags.length > 0 || loadingTags) return;
        setTagsEnabled(true);
        loadTags('');
    }, [filters.tag_id, tags.length, loadingTags, loadTags]);

    useEffect(() => {
        if (!taxesEnabled) return;
        const handler = setTimeout(() => {
            loadTaxes(taxSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [taxesEnabled, taxSearchTerm, loadTaxes]);

    useEffect(() => {
        if (!filters.tax_id) return;
        if (taxes.length > 0 || loadingTaxes) return;
        setTaxesEnabled(true);
        loadTaxes('');
    }, [filters.tax_id, taxes.length, loadingTaxes, loadTaxes]);

    // Debounced search for categories
    useEffect(() => {
        if (!categoriesEnabled) return;
        const handler = setTimeout(() => {
            loadCategories(categorySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [categoriesEnabled, categorySearchTerm, loadCategories]);

    // Debounced search for brands
    useEffect(() => {
        if (!brandsEnabled) return;
        const handler = setTimeout(() => {
            loadBrands(brandSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [brandsEnabled, brandSearchTerm, loadBrands]);

    // Debounced search for tags
    useEffect(() => {
        if (!tagsEnabled) return;
        const handler = setTimeout(() => {
            loadTags(tagSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [tagsEnabled, tagSearchTerm, loadTags]);

    // Debounced search for taxes
    useEffect(() => {
        if (!taxesEnabled) return;
        const handler = setTimeout(() => {
            loadTaxes(taxSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [taxesEnabled, taxSearchTerm, loadTaxes]);

    // Debounced search for warehouses
    useEffect(() => {
        if (!warehousesEnabled) return;
        const handler = setTimeout(() => {
            loadWarehouses(warehouseSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [warehousesEnabled, warehouseSearchTerm, loadWarehouses]);

    useEffect(() => {
        if (!filters.warehouse_id) return;
        if (warehouses.length > 0 || loadingWarehouses) return;
        setWarehousesEnabled(true);
        loadWarehouses('');
    }, [filters.warehouse_id, warehouses.length, loadingWarehouses, loadWarehouses]);

    const resolveProductImageUrl = (product) => {
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

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await deleteProduct(productId);
            toast.success('Product deleted successfully!');
            // Invalidate and refetch products
            queryClient.invalidateQueries({ queryKey: productsKeys.list(queryParams) });
            refetch();
        } catch (err) {
            console.error('Error deleting product:', err);
            toast.error('Failed to delete product');
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    // Handle sort
    const handleSort = (column) => {
        const newDirection = 
            sortConfig.column === column && sortConfig.direction === 'asc' 
                ? 'desc' 
                : 'asc';
        
        setSortConfig({ column, direction: newDirection });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    // Handle per page change
    const handlePerPageChange = (newPerPage) => {
        setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    // Get sort icon for table headers
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
            <i className="ki-duotone ki-arrow-up fs-5 ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await exportProducts(filters);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Products exported successfully');
        } catch (err) {
            console.error('Error exporting products:', err);
            toast.error('Failed to export products');
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadProductTemplate();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Template downloaded successfully');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Failed to download template');
        }
    };

    const resetFilters = () => {
        setFilters({
            category_id: '',
            brand_id: '',
            warehouse_id: '',
            tax_id: '',
            tag_id: '',
            status: '',
            date_from: '',
            date_to: '',
        });
        setSearchTerm('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setCategorySearchTerm('');
        setBrandSearchTerm('');
        setTagSearchTerm('');
        setTaxSearchTerm('');
        setWarehouseSearchTerm('');
        setSelectedCategoryOption(null);
        setSelectedBrandOption(null);
        setSelectedTagOption(null);
        setSelectedTaxOption(null);
        setSelectedWarehouseOption(null);
        setCategoriesEnabled(false);
        setBrandsEnabled(false);
        setTagsEnabled(false);
        setTaxesEnabled(false);
        setWarehousesEnabled(false);
    };

    const handleImportComplete = () => {
        // Refresh products list after import
        queryClient.invalidateQueries({ queryKey: productsKeys.list(queryParams) });
        refetch();
    };

    // Memoized handlers for SearchableDropdown to prevent setState during render
    const handleCategorySelect = useCallback((option) => {
        setSelectedCategoryOption(option);
        setFilterValue('category_id', option?.value || '');
    }, [setFilterValue]);

    const handleCategoryClear = useCallback(() => {
        setSelectedCategoryOption(null);
        setFilterValue('category_id', '');
    }, [setFilterValue]);

    const handleBrandSelect = useCallback((option) => {
        setSelectedBrandOption(option);
        setFilterValue('brand_id', option?.value || '');
    }, [setFilterValue]);

    const handleBrandClear = useCallback(() => {
        setSelectedBrandOption(null);
        setFilterValue('brand_id', '');
    }, [setFilterValue]);

    const handleTagSelect = useCallback((option) => {
        setSelectedTagOption(option);
        setFilterValue('tag_id', option?.value || '');
    }, [setFilterValue]);

    const handleTagClear = useCallback(() => {
        setSelectedTagOption(null);
        setFilterValue('tag_id', '');
    }, [setFilterValue]);

    const handleTaxSelect = useCallback((option) => {
        setSelectedTaxOption(option);
        setFilterValue('tax_id', option?.value || '');
    }, [setFilterValue]);

    const handleTaxClear = useCallback(() => {
        setSelectedTaxOption(null);
        setFilterValue('tax_id', '');
    }, [setFilterValue]);

    const handleWarehouseSelect = useCallback((option) => {
        setSelectedWarehouseOption(option);
        setFilterValue('warehouse_id', option?.value || '');
    }, [setFilterValue]);

    const handleWarehouseClear = useCallback(() => {
        setSelectedWarehouseOption(null);
        setFilterValue('warehouse_id', '');
    }, [setFilterValue]);

    // Memoized handlers for onOpen and onSearchChange to prevent setState during render
    const handleCategoryOpen = useCallback(() => {
        setCategoriesEnabled(true);
        if (categories.length === 0 && !loadingCategories) {
            loadCategories(categorySearchTerm);
        }
    }, [categories.length, loadingCategories, categorySearchTerm, loadCategories]);

    const handleCategorySearchChange = useCallback((value) => {
        setCategorySearchTerm(value);
        setCategoriesEnabled(true);
    }, []);

    const handleBrandOpen = useCallback(() => {
        setBrandsEnabled(true);
        if (brands.length === 0 && !loadingBrands) {
            loadBrands(brandSearchTerm);
        }
    }, [brands.length, loadingBrands, brandSearchTerm, loadBrands]);

    const handleBrandSearchChange = useCallback((value) => {
        setBrandSearchTerm(value);
        setBrandsEnabled(true);
    }, []);

    const handleTagOpen = useCallback(() => {
        setTagsEnabled(true);
        if (tags.length === 0 && !loadingTags) {
            loadTags(tagSearchTerm);
        }
    }, [tags.length, loadingTags, tagSearchTerm, loadTags]);

    const handleTagSearchChange = useCallback((value) => {
        setTagSearchTerm(value);
        setTagsEnabled(true);
    }, []);

    const handleTaxOpen = useCallback(() => {
        setTaxesEnabled(true);
        if (taxes.length === 0 && !loadingTaxes) {
            loadTaxes(taxSearchTerm);
        }
    }, [taxes.length, loadingTaxes, taxSearchTerm, loadTaxes]);

    const handleTaxSearchChange = useCallback((value) => {
        setTaxSearchTerm(value);
        setTaxesEnabled(true);
    }, []);

    const handleWarehouseOpen = useCallback(() => {
        setWarehousesEnabled(true);
        if (warehouses.length === 0 && !loadingWarehouses) {
            loadWarehouses(warehouseSearchTerm);
        }
    }, [warehouses.length, loadingWarehouses, warehouseSearchTerm, loadWarehouses]);

    const handleWarehouseSearchChange = useCallback((value) => {
        setWarehouseSearchTerm(value);
        setWarehousesEnabled(true);
    }, []);

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'published':
            case 'active':
                return 'badge-light-success';
            case 'draft':
            case 'pending':
                return 'badge-light-warning';
            case 'scheduled':
                return 'badge-light-info';
            case 'inactive':
            case 'rejected':
                return 'badge-light-danger';
            default:
                return 'badge-light-secondary';
        }
    };

    return (
        <>
            {/* Main Card */}
            <div className="card">
                {/* Card Header */}
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex justify-content-between align-items-center w-100">
                        {/* Search */}
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-13"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Per Page Selector */}
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">Per Page:</label>
                            <select 
                                className="form-select form-select-sm" 
                                style={{width: '80px'}}
                                value={pagination.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Card Body */}
                <div className="card-body pt-0">
                    {/* Loading Bar - Shows on top of existing data when fetching */}
                    {isFetching && !isLoading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Error Alert */}
                    {queryError && (
                        <div className="alert alert-danger alert-dismissible mb-4">
                            <strong>Error:</strong> {queryError?.response?.data?.message || queryError?.message || 'Failed to load products'}
                            <button type="button" className="btn-close" onClick={() => queryClient.invalidateQueries({ queryKey: productsKeys.list(queryParams) })}></button>
                        </div>
                    )}
                    
                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="card bg-light mb-4">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <SearchableDropdown
                                            label="Category"
                                            placeholder="All Categories"
                                            options={categoryOptions}
                                            selected={selectedCategoryOption}
                                            onSelect={handleCategorySelect}
                                            onClear={handleCategoryClear}
                                            loading={loadingCategories}
                                            onOpen={handleCategoryOpen}
                                            onSearchChange={handleCategorySearchChange}
                                            searchPlaceholder="Search categories..."
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <SearchableDropdown
                                            label="Brand"
                                            placeholder="All Brands"
                                            options={brandOptions}
                                            selected={selectedBrandOption}
                                            onSelect={handleBrandSelect}
                                            onClear={handleBrandClear}
                                            loading={loadingBrands}
                                            onOpen={handleBrandOpen}
                                            onSearchChange={handleBrandSearchChange}
                                            searchPlaceholder="Search brands..."
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <SearchableDropdown
                                            label="Tag"
                                            placeholder="All Tags"
                                            options={tagOptions}
                                            selected={selectedTagOption}
                                            onSelect={handleTagSelect}
                                            onClear={handleTagClear}
                                            loading={loadingTags}
                                            onOpen={handleTagOpen}
                                            onSearchChange={handleTagSearchChange}
                                            searchPlaceholder="Search tags..."
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <SearchableDropdown
                                            label="Tax"
                                            placeholder="All Taxes"
                                            options={taxOptions}
                                            selected={selectedTaxOption}
                                            onSelect={handleTaxSelect}
                                            onClear={handleTaxClear}
                                            loading={loadingTaxes}
                                            onOpen={handleTaxOpen}
                                            onSearchChange={handleTaxSearchChange}
                                            searchPlaceholder="Search taxes..."
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <SearchableDropdown
                                            label="Warehouse"
                                            placeholder="All Warehouses"
                                            options={warehouseOptions}
                                            selected={selectedWarehouseOption}
                                            onSelect={handleWarehouseSelect}
                                            onClear={handleWarehouseClear}
                                            loading={loadingWarehouses}
                                            onOpen={handleWarehouseOpen}
                                            onSearchChange={handleWarehouseSearchChange}
                                            searchPlaceholder="Search warehouses..."
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Status</label>
                                        <select 
                                            className="form-select form-select-sm"
                                            value={filters.status}
                                            onChange={(e) => setFilterValue('status', e.target.value)}
                                        >
                                            <option value="">All Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Date From</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={filters.date_from}
                                                onChange={(e) => setFilterValue('date_from', e.target.value)}
                                            />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Date To</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={filters.date_to}
                                                onChange={(e) => setFilterValue('date_to', e.target.value)}
                                            />
                                    </div>
                                    <div className="col-12">
                                        <button onClick={resetFilters} className="btn btn-sm btn-secondary">
                                            <i className="ki-duotone ki-arrows-circle fs-3 me-1">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="table-responsive" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th style={{width: '80px'}}>Image</th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('name')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Name {getSortIcon('name')}
                                        </span>
                                    </th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('sku')}
                                    >
                                        <span className="d-flex align-items-center">
                                            SKU {getSortIcon('sku')}
                                        </span>
                                    </th>
                                    <th>Category</th>
                                    <th>Brand</th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('price')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Price {getSortIcon('price')}
                                        </span>
                                    </th>
                                    <th 
                                        style={{cursor: 'pointer'}}
                                        onClick={() => handleSort('stock')}
                                    >
                                        <span className="d-flex align-items-center">
                                            Stock {getSortIcon('stock')}
                                        </span>
                                    </th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && products.length === 0 ? (
                                    // Skeleton loading rows
                                    Array.from({ length: 10 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '50px', 
                                                        height: '50px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder mb-2" 
                                                    style={{
                                                        width: '60%', 
                                                        height: '16px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '40%', 
                                                        height: '12px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '50%', 
                                                        height: '20px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '45%', 
                                                        height: '16px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '45%', 
                                                        height: '16px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '40%', 
                                                        height: '16px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '30%', 
                                                        height: '20px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="placeholder" 
                                                    style={{
                                                        width: '40%', 
                                                        height: '20px', 
                                                        borderRadius: '4px',
                                                        backgroundColor: '#6c757d'
                                                    }}
                                                ></div>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <div 
                                                        className="placeholder" 
                                                        style={{
                                                            width: '32px', 
                                                            height: '28px', 
                                                            borderRadius: '4px',
                                                            backgroundColor: '#6c757d'
                                                        }}
                                                    ></div>
                                                    <div 
                                                        className="placeholder" 
                                                        style={{
                                                            width: '32px', 
                                                            height: '28px', 
                                                            borderRadius: '4px',
                                                            backgroundColor: '#6c757d'
                                                        }}
                                                    ></div>
                                                    <div 
                                                        className="placeholder" 
                                                        style={{
                                                            width: '32px', 
                                                            height: '28px', 
                                                            borderRadius: '4px',
                                                            backgroundColor: '#6c757d'
                                                        }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : products.length > 0 ? (
                                            products.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        {resolveProductImageUrl(product) ? (
                                                            <img 
                                                                src={resolveProductImageUrl(product)} 
                                                                alt={product.name} 
                                                                style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
                                                            />
                                                         ) : (
                                                             <div className="bg-light d-flex align-items-center justify-content-center" 
                                                                  style={{width: '50px', height: '50px', borderRadius: '4px'}}>
                                                                 <i className="ki-duotone ki-picture text-muted fs-2">
                                                                     <span className="path1"></span>
                                                                     <span className="path2"></span>
                                                                 </i>
                                                             </div>
                                                         )}
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-bold">{product.name?.en || product.name}</div>
                                                            {product.type && (
                                                                <small className="text-muted">{product.type}</small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-light-info">
                                                            {product.sku || '-'}
                                                        </span>
                                                    </td>
                                                    <td>{product.category?.name || '-'}</td>
                                                    <td>{product.brand?.name || '-'}</td>
                                                    <td>${product.price?.toFixed(2) || '0.00'}</td>
                                                    <td>
                                                        <span className={`badge ${product.stock > 0 ? 'badge-light-success' : 'badge-light-danger'}`}>
                                                            {product.stock || 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(product.status)}`}>
                                                            {product.status ? product.status.charAt(0).toUpperCase() + product.status.slice(1) : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <Link 
                                                            to={`/sales/products/${product.id}`}
                                                            className="btn btn-sm btn-light-primary me-2"
                                                            title="View Product"
                                                        >
                                                            <i className="ki-duotone ki-eye fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                            </i>
                                                        </Link>
                                                        <Link 
                                                            to={`/sales/products/${product.id}/edit`}
                                                            className="btn btn-sm btn-light me-2"
                                                            title="Edit Product"
                                                        >
                                                            <i className="ki-duotone ki-pencil fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                        </Link>
                                                        <button
                                                            className="btn btn-sm btn-light-danger"
                                                            onClick={() => handleDelete(product.id)}
                                                            title="Delete Product"
                                                        >
                                                            <i className="ki-duotone ki-trash fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                                <span className="path4"></span>
                                                                <span className="path5"></span>
                                                            </i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-10">
                                                    No products found
                                                </td>
                                            </tr>
                                        )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!isLoading && (
                        <div className="d-flex justify-content-between align-items-center pt-4">
                                <div className="text-muted">
                                    Showing {products.length} of {pagination.total || 0} products
                                    {pagination.last_page > 1 && ` (Page ${pagination.current_page} of ${pagination.last_page})`}
                                </div>
                                {pagination.last_page > 1 && (
                                    <nav>
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${pagination.current_page === 1 || isFetching ? 'disabled' : ''}`}>
                                                <button
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
                                                    <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''} ${isFetching ? 'disabled' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => handlePageChange(pageNum)}
                                                            disabled={isFetching}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                            {pagination.last_page > 10 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                            <li className={`page-item ${pagination.current_page === pagination.last_page || isFetching ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(Math.min(pagination.current_page + 1, pagination.last_page))}
                                                    disabled={pagination.current_page === pagination.last_page || isFetching}
                                                >
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                        </div>
                    )}
                </div>
            </div>

            {/* Import Modal */}
            <ProductImportModal 
                show={showImportModal}
                onHide={() => setShowImportModal(false)}
                onImportComplete={handleImportComplete}
            />
        </>
    );
}

