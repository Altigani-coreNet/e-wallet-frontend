import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    fetchProductDetails,
    updateProduct,
    fetchCategoriesForSelect,
    fetchBrandsForSelect,
    fetchTagsForSelect,
    fetchTaxesForSelect,
    fetchWarehousesForSelect,
    fetchUnitsForSelect
} from '../../../services/productsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ProductForm from './ProductForm';

const DEFAULT_SELECT_OPTIONS = {
    productStatuses: ['published', 'draft', 'scheduled', 'inactive'],
    productTypes: ['Standard', 'Combo', 'Digital'],
    taxTypes: ['inclusive', 'exclusive'],
    categories: [],
    tags: [],
    brands: [],
    units: [],
    taxes: [],
    warehouses: []
};

const DEFAULT_DISCOUNT_PERCENTAGE = 10;

const mergeById = (current = [], incoming = []) => {
    const map = new Map();
    current.forEach((item) => {
        if (item?.id !== undefined) {
            map.set(String(item.id), item);
        }
    });
    incoming.forEach((item) => {
        if (item?.id !== undefined) {
            map.set(String(item.id), item);
        }
    });
    return Array.from(map.values());
};

const normalizeOptionEntity = (entity) => {
    if (!entity) return null;
    if (typeof entity === 'object') {
        const id =
            entity.id ??
            entity.value ??
            entity.category_id ??
            entity.tag_id ??
            entity.brand_id ??
            entity.tax_id ??
            entity.warehouse_id;
        if (id === undefined || id === null) return null;
        const name =
            entity.name ??
            entity.label ??
            entity.title ??
            entity.text ??
            entity.slug ??
            (Array.isArray(entity.translations)
                ? entity.translations.find((translation) => translation?.name)?.name
                : null);
        return {
            id,
            name: name ?? `#${id}`,
            ...entity
        };
    }

    return {
        id: entity,
        name: String(entity)
    };
};

const normalizeOptionArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => normalizeOptionEntity(item))
        .filter((item) => item !== null && item.id !== undefined);
};

const normalizeOption = (item) => normalizeOptionArray([item])[0] ?? null;

const extractIdsFromArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => {
            if (item === null || item === undefined) return '';
            if (typeof item === 'object') {
                return String(item.id ?? item.value ?? '');
            }
            return String(item);
        })
        .filter(Boolean);
};

const extractGalleryUrls = (product) => {
    if (!product) return [];
    if (Array.isArray(product.gallery_urls)) return product.gallery_urls;
    if (Array.isArray(product.images)) {
        return product.images
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    return item.url ?? item.path ?? item.src ?? item.image ?? '';
                }
                return '';
            })
            .filter(Boolean);
    }
    if (Array.isArray(product.gallery)) {
        return product.gallery
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    return item.url ?? item.path ?? item.src ?? '';
                }
                return '';
            })
            .filter(Boolean);
    }
    if (Array.isArray(product.media)) {
        return product.media
            .map((item) => item?.url ?? item?.path ?? '')
            .filter(Boolean);
    }
    return [];
};

const normalizeCompositeItems = (product) => {
    if (!product?.composite_items) return undefined;
    return product.composite_items.map((item) => ({
        ...item,
        product_id: item.product_id ?? item.id ?? '',
        product_name: item.product_name ?? item.name ?? item.text ?? '',
        product_code: item.product_code ?? item.code ?? item.sku ?? ''
    }));
};

export default function ProductEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();

    const [loadingProduct, setLoadingProduct] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false);

    const [brands, setBrands] = useState([]);
    const [brandsLoading, setBrandsLoading] = useState(false);
    const [brandsLoaded, setBrandsLoaded] = useState(false);

    const [tags, setTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsLoaded, setTagsLoaded] = useState(false);

    const [taxes, setTaxes] = useState([]);
    const [taxesLoading, setTaxesLoading] = useState(false);
    const [taxesLoaded, setTaxesLoaded] = useState(false);

    const [warehouses, setWarehouses] = useState([]);
    const [warehousesLoading, setWarehousesLoading] = useState(false);
    const [warehousesLoaded, setWarehousesLoaded] = useState(false);

    const [units, setUnits] = useState([]);
    const [unitsLoading, setUnitsLoading] = useState(false);

    useEffect(() => {
        setTitle('Edit Product');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Products', path: '/sales/products' },
            { label: 'Edit Product', path: `/sales/products/${id}/edit`, active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [id, setBreadcrumbs, setTitle]);

    useEffect(() => {
        let isMounted = true;
        const loadUnits = async () => {
            try {
                setUnitsLoading(true);
                const response = await fetchUnitsForSelect();
                const list = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                        ? response
                        : normalizeOptionArray(response);
                if (!isMounted) return;
                setUnits(Array.isArray(list) ? list : []);
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading units:', error);
                    toast.error('Failed to load units');
                }
            } finally {
                if (isMounted) {
                    setUnitsLoading(false);
                }
            }
        };

        loadUnits();

        return () => {
            isMounted = false;
        };
    }, []);

    const loadCategories = useCallback(
        async (search = '') => {
            if (categoriesLoading) return;
            if (!search && categoriesLoaded) return;
            try {
                setCategoriesLoading(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const list = await fetchCategoriesForSelect(params);
                setCategories((prev) =>
                    mergeById(prev, Array.isArray(list) ? list : normalizeOptionArray(list))
                );
                if (!search) {
                    setCategoriesLoaded(true);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                toast.error('Failed to load categories');
            } finally {
                setCategoriesLoading(false);
            }
        },
        [categoriesLoading, categoriesLoaded]
    );

    const loadBrands = useCallback(
        async (search = '') => {
            if (brandsLoading) return;
            if (!search && brandsLoaded) return;
            try {
                setBrandsLoading(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const list = await fetchBrandsForSelect(params);
                setBrands((prev) =>
                    mergeById(prev, Array.isArray(list) ? list : normalizeOptionArray(list))
                );
                if (!search) {
                    setBrandsLoaded(true);
                }
            } catch (error) {
                console.error('Error loading brands:', error);
                toast.error('Failed to load brands');
            } finally {
                setBrandsLoading(false);
            }
        },
        [brandsLoading, brandsLoaded]
    );

    const loadTags = useCallback(
        async (search = '') => {
            if (tagsLoading) return;
            if (!search && tagsLoaded) return;
            try {
                setTagsLoading(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const list = await fetchTagsForSelect(params);
                setTags((prev) =>
                    mergeById(prev, Array.isArray(list) ? list : normalizeOptionArray(list))
                );
                if (!search) {
                    setTagsLoaded(true);
                }
            } catch (error) {
                console.error('Error loading tags:', error);
                toast.error('Failed to load tags');
            } finally {
                setTagsLoading(false);
            }
        },
        [tagsLoading, tagsLoaded]
    );

    const loadTaxes = useCallback(
        async (search = '') => {
            if (taxesLoading) return;
            if (!search && taxesLoaded) return;
            try {
                setTaxesLoading(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const list = await fetchTaxesForSelect(params);
                setTaxes((prev) =>
                    mergeById(prev, Array.isArray(list) ? list : normalizeOptionArray(list))
                );
                if (!search) {
                    setTaxesLoaded(true);
                }
            } catch (error) {
                console.error('Error loading taxes:', error);
                toast.error('Failed to load taxes');
            } finally {
                setTaxesLoading(false);
            }
        },
        [taxesLoading, taxesLoaded]
    );

    const loadWarehouses = useCallback(
        async (search = '') => {
            if (warehousesLoading) return;
            if (!search && warehousesLoaded) return;
            try {
                setWarehousesLoading(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const list = await fetchWarehousesForSelect(params);
                setWarehouses((prev) =>
                    mergeById(prev, Array.isArray(list) ? list : normalizeOptionArray(list))
                );
                if (!search) {
                    setWarehousesLoaded(true);
                }
            } catch (error) {
                console.error('Error loading warehouses:', error);
                toast.error('Failed to load warehouses');
            } finally {
                setWarehousesLoading(false);
            }
        },
        [warehousesLoading, warehousesLoaded]
    );

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoadingProduct(true);
                const response = await fetchProductDetails(id);
                // Handle nested response structure: response.data.product
                const product = response?.data?.product ?? response?.data?.data ?? response?.data ?? response ?? {};

                // Normalize discount_type: "none" -> "1", "percentage" -> "2", "fixed" -> "3"
                const normalizeDiscountType = (discountType) => {
                    if (!discountType || discountType === 'none' || discountType === '1') return '1';
                    if (discountType === 'percentage' || discountType === '2') return '2';
                    if (discountType === 'fixed' || discountType === '3') return '3';
                    return String(discountType);
                };

                // Normalize product_type: "standard" -> "Standard"
                const normalizeProductType = (type) => {
                    if (!type) return 'Standard';
                    const typeStr = String(type).toLowerCase();
                    if (typeStr === 'standard') return 'Standard';
                    if (typeStr === 'combo') return 'Combo';
                    if (typeStr === 'digital') return 'Digital';
                    return String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase();
                };

                const normalizedProduct = {
                    ...product,
                    product_name:
                        product.product_name ??
                        product.name?.en ??
                        product.name?.ar ??
                        product.name ??
                        '',
                    description:
                        product.description ??
                        product.description?.en ??
                        product.description?.ar ??
                        '',
                    sku: product.sku ?? product.code ?? product.product_code ?? '',
                    barcode: product.barcode ?? product.barcode_number ?? '',
                    product_status: product.product_status ?? product.status ?? 'draft',
                    product_type: normalizeProductType(product.product_type ?? product.type),
                    scheduled_date: product.scheduled_date ?? product.publish_at ?? '',
                    base_price: product.base_price ?? product.price ?? product.cost ?? '',
                    sale_price: product.sale_price ?? product.price ?? '',
                    discount_type: normalizeDiscountType(product.discount_type),
                    discount_percentage:
                        product.discount_percentage ?? product.discount ?? DEFAULT_DISCOUNT_PERCENTAGE,
                    discounted_value: product.dicsounted_value ?? product.discounted_value ?? '',
                    tax_type: product.tax_type ?? 'inclusive',
                    tax_id: product.tax_id ? String(product.tax_id) : '',
                    quantity: product.quantity ?? product.qty ?? product.stock ?? '',
                    warehouse_id: product.warehouse_id ? String(product.warehouse_id) : '',
                    warehouse_quantity: product.warehouse_quantity ?? product.in_warehouse ?? '',
                    brand_id: product.brand_id ? String(product.brand_id) : '',
                    unit_id: product.unit_id ? String(product.unit_id) : '',
                    categories: extractIdsFromArray(product.categories ?? product.category_ids ?? []),
                    tags: extractIdsFromArray(product.tags ?? product.tag_ids ?? []),
                    is_featured: Boolean(product.is_featured),
                    is_variant: Boolean(product.is_variant),
                    is_batch: Boolean(product.is_batch),
                    serial_imei_number: Boolean(product.serial_imei_number ?? product.is_serial),
                    avatarUrl:
                        product.thumbnail ??
                        product.thumbnail_url ??
                        product.product_image ??
                        product.image_url ??
                        product.avatar ??
                        '',
                    gallery_urls: extractGalleryUrls(product),
                    composite_items: normalizeCompositeItems(product)
                };

                // Extract and add categories to options
                const categoriesFromProduct = normalizeOptionArray(
                    product.categories ?? product.category ?? product.category_list
                );
                if (categoriesFromProduct.length) {
                    setCategories((prev) => mergeById(prev, categoriesFromProduct));
                }

                // Extract and add tags to options
                const tagsFromProduct = normalizeOptionArray(
                    product.tags ?? product.tag_list ?? product.product_tags
                );
                if (tagsFromProduct.length) {
                    setTags((prev) => mergeById(prev, tagsFromProduct));
                }

                // Extract and add brand to options (use full object if available)
                const brandFromProduct = normalizeOption(
                    product.brand ?? product.brand_data ?? product.brand_info ?? product.brand_detail
                );
                if (brandFromProduct) {
                    setBrands((prev) => mergeById(prev, [brandFromProduct]));
                }

                // Extract and add tax to options (use tax_details or tax object if available)
                const taxFromProduct = normalizeOption(
                    product.tax_details ?? product.tax ?? product.tax_data ?? product.tax_info ?? product.tax_detail
                );
                if (taxFromProduct) {
                    setTaxes((prev) => mergeById(prev, [taxFromProduct]));
                }

                // Extract and add warehouses to options (handle both single object and array)
                if (Array.isArray(product.warehouses) && product.warehouses.length > 0) {
                    const warehousesFromProduct = normalizeOptionArray(product.warehouses);
                    if (warehousesFromProduct.length) {
                        setWarehouses((prev) => mergeById(prev, warehousesFromProduct));
                    }
                } else {
                    const warehouseFromProduct = normalizeOption(
                        product.warehouse ??
                            product.warehouse_data ??
                            product.warehouse_info ??
                            product.stock_location
                    );
                    if (warehouseFromProduct) {
                        setWarehouses((prev) => mergeById(prev, [warehouseFromProduct]));
                    }
                }

                // Extract and add unit to options (use full object if available)
                const unitFromProduct = normalizeOption(
                    product.unit ?? product.unit_data ?? product.unit_info ?? product.measurement_unit
                );
                if (unitFromProduct) {
                    setUnits((prev) => mergeById(prev, [unitFromProduct]));
                }

                setInitialValues(normalizedProduct);
            } catch (error) {
                console.error('Error loading product details', error);
                toast.error('Failed to load product details');
                navigate('/sales/products');
            } finally {
                setLoadingProduct(false);
            }
        };

        loadProduct();
    }, [id, navigate]);

    const formSelectOptions = useMemo(
        () => ({
            ...DEFAULT_SELECT_OPTIONS,
            categories,
            tags,
            brands,
            units,
            taxes,
            warehouses
        }),
        [categories, tags, brands, units, taxes, warehouses]
    );

    const handleCancel = () => {
        navigate('/sales/products');
    };

    const handleSubmit = async ({ formData }) => {
        setSubmitting(true);
        setValidationErrors({}); // Clear previous errors
        try {
            const response = await updateProduct(id, formData);
            const payload = response?.data ?? response;

            if (payload?.success === false) {
                toast.error(payload?.message || 'Failed to update product');
                return;
            }

            toast.success('Product updated successfully!');
            navigate('/sales/products');
        } catch (error) {
            console.error('Error updating product', error);
            
            // Handle 422 validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const errors = error.response.data.errors;
                setValidationErrors(errors);
                
                // Show general error message
                const errorMessage = error.response?.data?.message || 'Please fix the validation errors';
                toast.error(errorMessage);
            } else {
                toast.error(error.response?.data?.message || 'Failed to update product');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const shouldShowLoader = useMemo(
        () => loadingProduct || !initialValues,
        [loadingProduct, initialValues]
    );

    if (shouldShowLoader) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading product...</span>
                </div>
            </div>
        );
    }

    return (
        <ProductForm
            mode="edit"
            initialValues={initialValues}
            selectOptions={formSelectOptions}
            loadingOptions={unitsLoading}
            submitting={submitting}
            submitLabel="Update Product"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onLoadCategories={loadCategories}
            onLoadBrands={loadBrands}
            onLoadTags={loadTags}
            onLoadTaxes={loadTaxes}
            onLoadWarehouses={loadWarehouses}
            categoryLoading={categoriesLoading}
            brandLoading={brandsLoading}
            tagLoading={tagsLoading}
            taxLoading={taxesLoading}
            warehouseLoading={warehousesLoading}
            unitLoading={unitsLoading}
            validationErrors={validationErrors}
        />
    );
}