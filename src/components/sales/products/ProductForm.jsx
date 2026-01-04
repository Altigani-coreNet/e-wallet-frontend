import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import ProductSearchSelect from '../purchases/ProductSearchSelect';
import { fetchProductDetails } from '../../../services/productsService';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

const STATUS_BADGE_CLASSES = {
    published: 'bg-success',
    draft: 'bg-warning',
    scheduled: 'bg-info',
    inactive: 'bg-danger'
};

const DEFAULT_FORM_VALUES = {
    product_name: '',
    description: '',
    sku: '',
    barcode: '',
    product_type: 'Standard',
    product_status: 'draft',
    scheduled_date: '',
    base_price: '',
    sale_price: '',
    discount_type: '1',
    discount_percentage: 10,
    discounted_value: '',
    tax_type: 'inclusive',
    tax_id: '',
    quantity: '',
    warehouse_id: '',
    warehouse_quantity: '',
    brand_id: '',
    unit_id: '',
    categories: [],
    tags: [],
    is_featured: false,
    is_variant: false,
    is_batch: false,
    serial_imei_number: false,
    avatar: null,
    product_images: []
};

const normalizeIdArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            if (item === null || item === undefined) {
                return '';
            }
            if (typeof item === 'object') {
                return String(item.id ?? item.value ?? '');
            }
            return String(item);
        })
        .filter(Boolean);
};

const createEmptyCompositeItem = () => ({
    uid: `ci-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    product_id: '',
    product_name: '',
    product_code: '',
    purchase_cost: '',
    qty: 1,
    subtotal: 0,
    loading: false
});

const resolveOptionLabel = (entity) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
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
    if (entity.id !== undefined && entity.id !== null) return `#${entity.id}`;
    return '';
};

const prepareInitialState = (initialValues = {}) => {
    const base = { ...DEFAULT_FORM_VALUES };

    const sanitized = {
        ...base,
        product_name: initialValues.product_name ?? initialValues.name?.en ?? initialValues.name ?? base.product_name,
        description: initialValues.description ?? initialValues.description?.en ?? base.description,
        sku: initialValues.sku ?? base.sku,
        barcode: initialValues.barcode ?? base.barcode,
        product_type: initialValues.product_type ?? initialValues.type ?? base.product_type,
        product_status: initialValues.product_status ?? initialValues.status ?? base.product_status,
        scheduled_date: initialValues.scheduled_date ?? initialValues.publish_at ?? '',
        base_price: initialValues.base_price ?? initialValues.price ?? base.base_price,
        sale_price: initialValues.sale_price ?? base.sale_price,
        discount_type: String(initialValues.discount_type ?? base.discount_type),
        discount_percentage: Number(
            initialValues.discount_percentage ??
                initialValues.discount ??
                base.discount_percentage
        ),
        discounted_value:
            initialValues.dicsounted_value ??
            initialValues.discounted_value ??
            base.discounted_value,
        tax_type: initialValues.tax_type ?? base.tax_type,
        tax_id: initialValues.tax_id ? String(initialValues.tax_id) : base.tax_id,
        quantity: initialValues.quantity ?? initialValues.stock ?? base.quantity,
        warehouse_id: initialValues.warehouse_id
            ? String(initialValues.warehouse_id)
            : base.warehouse_id,
        warehouse_quantity:
            initialValues.warehouse_quantity ?? initialValues.in_warehouse ?? base.warehouse_quantity,
        brand_id: initialValues.brand_id ? String(initialValues.brand_id) : base.brand_id,
        unit_id: initialValues.unit_id ? String(initialValues.unit_id) : base.unit_id,
        categories: normalizeIdArray(initialValues.categories ?? initialValues.category_ids),
        tags: normalizeIdArray(initialValues.tags ?? initialValues.tag_ids),
        is_featured: Boolean(initialValues.is_featured),
        is_variant: Boolean(initialValues.is_variant),
        is_batch: Boolean(initialValues.is_batch),
        serial_imei_number: Boolean(initialValues.serial_imei_number)
    };

    const existingAvatarUrl =
        initialValues.avatarUrl ??
        initialValues.thumbnail_url ??
        initialValues.image_url ??
        '';

    const existingGallery =
        Array.isArray(initialValues.gallery_urls ?? initialValues.gallery)
            ? (initialValues.gallery_urls ?? initialValues.gallery)
            : [];

    const compositeItemsSource = Array.isArray(initialValues.composite_items)
        ? initialValues.composite_items
        : [];

    const compositeItems =
        compositeItemsSource.length > 0
            ? compositeItemsSource.map((item, index) => {
                  const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
                  const purchaseCost =
                      Number(
                          item.purchase_cost ??
                              item.netUnitCost ??
                              item.base_price ??
                              item.cost ??
                              0
                      ) || 0;
                  return {
                      uid: item.uid ?? item.id ?? `ci-${Date.now()}-${index}`,
                      product_id: String(item.product_id ?? item.id ?? ''),
                      product_name:
                          item.product_name ?? item.name?.en ?? item.name ?? item.text ?? '',
                      product_code: item.product_code ?? item.code ?? item.sku ?? '',
                      purchase_cost: purchaseCost,
                      qty,
                      subtotal: Number(
                          item.subtotal ??
                              (Number.isFinite(qty * purchaseCost) ? qty * purchaseCost : 0)
                      ),
                      loading: false
                  };
              })
            : [createEmptyCompositeItem()];

    return {
        formValues: sanitized,
        compositeItems,
        existingAvatarUrl,
        existingGallery
    };
};

const ProductForm = ({
    mode = 'create',
    initialValues = null,
    selectOptions = {},
    loadingOptions = false,
    submitting = false,
    submitLabel = 'Save Product',
    onSubmit,
    onCancel,
    onLoadCategories,
    onLoadBrands,
    onLoadTags,
    onLoadTaxes,
    onLoadWarehouses,
    categoryLoading = false,
    brandLoading = false,
    tagLoading = false,
    taxLoading = false,
    warehouseLoading = false,
    unitLoading = false,
    validationErrors: externalValidationErrors = {}
}) => {
    const prepared = useMemo(() => prepareInitialState(initialValues || {}), [initialValues]);

    const [formValues, setFormValues] = useState(prepared.formValues);
    const [compositeItems, setCompositeItems] = useState(prepared.compositeItems);
    const [existingAvatarUrl, setExistingAvatarUrl] = useState(prepared.existingAvatarUrl);
    const [existingGallery, setExistingGallery] = useState(prepared.existingGallery);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Merge external validation errors (from API) with internal state
    const allValidationErrors = useMemo(() => {
        return { ...validationErrors, ...externalValidationErrors };
    }, [validationErrors, externalValidationErrors]);
    
    // Helper function to get error message for a field
    const getFieldError = useCallback((fieldName) => {
        const error = allValidationErrors[fieldName];
        if (!error) return null;
        if (Array.isArray(error)) return error[0];
        return String(error);
    }, [allValidationErrors]);

    useEffect(() => {
        setFormValues(prepared.formValues);
        setCompositeItems(prepared.compositeItems);
        setExistingAvatarUrl(prepared.existingAvatarUrl);
        setExistingGallery(prepared.existingGallery);
    }, [prepared]);

    const callAsync = useCallback((fn) => {
        if (typeof fn === 'function') {
            Promise.resolve().then(fn);
        }
    }, []);

    const toggleCategoryDropdown = () => {
        setIsCategoryDropdownOpen((prev) => {
            const next = !prev;
            if (next) {
                setCategorySearchInput('');
                callAsync(() => onLoadCategories?.());
            }
            return next;
        });
    };

    const toggleTagDropdown = () => {
        setIsTagDropdownOpen((prev) => {
            const next = !prev;
            if (next) {
                setTagSearchInput('');
                callAsync(() => onLoadTags?.());
            }
            return next;
        });
    };

    const updateFormValue = useCallback((field, value) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: value
        }));
        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            setValidationErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    }, []);

    const handleTextChange = useCallback(
        (field) => (event) => {
            updateFormValue(field, event.target.value);
        },
        [updateFormValue]
    );

    const handleCheckboxChange = useCallback(
        (field) => (event) => {
            updateFormValue(field, event.target.checked);
        },
        [updateFormValue]
    );

    const handleSelectChange = useCallback(
        (field) => (event) => {
            updateFormValue(field, event.target.value);
        },
        [updateFormValue]
    );

    const handleStatusChange = useCallback(
        (event) => {
            const value = event.target.value;
            updateFormValue('product_status', value);
            if (value !== 'scheduled' && formValues.scheduled_date) {
                updateFormValue('scheduled_date', '');
            }
        },
        [formValues.scheduled_date, updateFormValue]
    );

    const handleDiscountTypeChange = useCallback(
        (event) => {
            const value = event.target.value;
            updateFormValue('discount_type', value);
        },
        [updateFormValue]
    );

    const handleDiscountPercentageChange = useCallback(
        (event) => {
            const value = Number(event.target.value) || 0;
            updateFormValue('discount_percentage', value);
        },
        [updateFormValue]
    );

    const handleDiscountedValueChange = useCallback(
        (event) => {
            updateFormValue('discounted_value', event.target.value);
        },
        [updateFormValue]
    );

    const handleCategoryToggle = (value) => {
        const normalizedValue = String(value);
        const current = selectedCategoryValues;
        const exists = current.includes(normalizedValue);

        if (exists) {
            updateFormValue(
                'categories',
                current.filter((item) => item !== normalizedValue)
            );
            setCategoryFallback((prev) => {
                if (!prev[normalizedValue]) return prev;
                const next = { ...prev };
                delete next[normalizedValue];
                return next;
            });
        } else {
            const option =
                categoryOptionMap.get(normalizedValue) ||
                categoryOptions.find((item) => String(item.value) === normalizedValue);
            if (option) {
                setCategoryFallback((prev) => ({
                    ...prev,
                    [normalizedValue]: option
                }));
            }
            updateFormValue('categories', [...current, normalizedValue]);
        }
    };

    const handleCategoryRemove = (value) => {
        const normalizedValue = String(value);
        updateFormValue(
            'categories',
            selectedCategoryValues.filter((item) => item !== normalizedValue)
        );
        setCategoryFallback((prev) => {
            if (!prev[normalizedValue]) return prev;
            const next = { ...prev };
            delete next[normalizedValue];
            return next;
        });
    };

    const handleTagToggle = (value) => {
        const normalizedValue = String(value);
        const current = selectedTagValues;
        const exists = current.includes(normalizedValue);

        if (exists) {
            updateFormValue(
                'tags',
                current.filter((item) => item !== normalizedValue)
            );
            setTagFallback((prev) => {
                if (!prev[normalizedValue]) return prev;
                const next = { ...prev };
                delete next[normalizedValue];
                return next;
            });
        } else {
            const option =
                tagOptionMap.get(normalizedValue) ||
                tagOptions.find((item) => String(item.value) === normalizedValue);
            if (option) {
                setTagFallback((prev) => ({
                    ...prev,
                    [normalizedValue]: option
                }));
            }
            updateFormValue('tags', [...current, normalizedValue]);
        }
    };

    const handleTagRemove = (value) => {
        const normalizedValue = String(value);
        updateFormValue(
            'tags',
            selectedTagValues.filter((item) => item !== normalizedValue)
        );
        setTagFallback((prev) => {
            if (!prev[normalizedValue]) return prev;
            const next = { ...prev };
            delete next[normalizedValue];
            return next;
        });
    };

    useEffect(() => {
        if (formValues.avatar instanceof File) {
            const objectUrl = URL.createObjectURL(formValues.avatar);
            setAvatarPreview(objectUrl);
            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        }
        setAvatarPreview(null);
        return undefined;
    }, [formValues.avatar]);

    useEffect(() => {
        if (!formValues.product_images || formValues.product_images.length === 0) {
            setGalleryPreviews([]);
            return undefined;
        }
        const previews = formValues.product_images.map((file) => ({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            url: URL.createObjectURL(file)
        }));
        setGalleryPreviews(previews);
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [formValues.product_images]);

    const computedCompositeTotal = useMemo(() => {
        return compositeItems.reduce((total, item) => {
            const qty = Number(item.qty) || 0;
            const cost = Number(item.purchase_cost) || 0;
            return total + qty * cost;
        }, 0);
    }, [compositeItems]);

    const statusBadgeClass =
        STATUS_BADGE_CLASSES[formValues.product_status] ?? STATUS_BADGE_CLASSES.published;

    const isSubmitDisabled =
        submitting ||
        loadingOptions ||
        brandLoading ||
        unitLoading ||
        taxLoading ||
        warehouseLoading;

    const optionLists = {
        productStatuses:
            Array.isArray(selectOptions.productStatuses) && selectOptions.productStatuses.length > 0
                ? selectOptions.productStatuses
                : ['published', 'draft', 'scheduled', 'inactive'],
        productTypes:
            Array.isArray(selectOptions.productTypes) && selectOptions.productTypes.length > 0
                ? selectOptions.productTypes
                : ['Standard', 'Combo', 'Digital'],
        taxTypes:
            Array.isArray(selectOptions.taxTypes) && selectOptions.taxTypes.length > 0
                ? selectOptions.taxTypes
                : ['inclusive', 'exclusive'],
        categories: selectOptions.categories ?? [],
        tags: selectOptions.tags ?? [],
        brands: selectOptions.brands ?? [],
        units: selectOptions.units ?? [],
        taxes: selectOptions.taxes ?? [],
        warehouses: selectOptions.warehouses ?? [],
        comboProducts: selectOptions.comboProducts ?? []
    };

    const categoryDropdownRef = useRef(null);
    const tagDropdownRef = useRef(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const [categorySearchInput, setCategorySearchInput] = useState('');
    const [tagSearchInput, setTagSearchInput] = useState('');
    const [categoryFallback, setCategoryFallback] = useState({});
    const [tagFallback, setTagFallback] = useState({});
    const [brandFallback, setBrandFallback] = useState({});
    const [taxFallback, setTaxFallback] = useState({});
    const [warehouseFallback, setWarehouseFallback] = useState({});

    const brandOptions = useMemo(
        () =>
            (optionLists.brands ?? []).map((brand) => ({
                value: String(brand.id),
                label: resolveOptionLabel(brand),
                raw: brand
            })),
        [optionLists.brands]
    );

    const unitOptions = useMemo(
        () =>
            (optionLists.units ?? []).map((unit) => ({
                value: String(unit.id),
                label: resolveOptionLabel(unit),
                raw: unit
            })),
        [optionLists.units]
    );

    const taxOptions = useMemo(
        () =>
            (optionLists.taxes ?? []).map((tax) => {
                const baseLabel = resolveOptionLabel(tax);
                const label =
                    tax.rate !== undefined && tax.rate !== null
                        ? `${baseLabel} (${tax.rate}%)`
                        : baseLabel;
                return {
                    value: String(tax.id),
                    label,
                    raw: tax
                };
            }),
        [optionLists.taxes]
    );

    const warehouseOptions = useMemo(
        () =>
            (optionLists.warehouses ?? []).map((warehouse) => ({
                value: String(warehouse.id),
                label: resolveOptionLabel(warehouse),
                raw: warehouse
            })),
        [optionLists.warehouses]
    );

    const categoryOptions = useMemo(
        () =>
            (optionLists.categories ?? []).map((category) => ({
                value: String(category.id),
                label: resolveOptionLabel(category),
                raw: category
            })),
        [optionLists.categories]
    );

    const tagOptions = useMemo(
        () =>
            (optionLists.tags ?? []).map((tag) => ({
                value: String(tag.id),
                label: resolveOptionLabel(tag),
                raw: tag
            })),
        [optionLists.tags]
    );

    const selectedBrandOption = useMemo(() => {
        if (!formValues.brand_id) return null;
        const key = String(formValues.brand_id);
        return (
            brandOptions.find((option) => String(option.value) === key) ||
            brandFallback[key] ||
            null
        );
    }, [brandOptions, brandFallback, formValues.brand_id]);

    const selectedUnitOption = useMemo(
        () => unitOptions.find((option) => String(option.value) === String(formValues.unit_id)) || null,
        [unitOptions, formValues.unit_id]
    );

    const selectedTaxOption = useMemo(() => {
        if (!formValues.tax_id) return null;
        const key = String(formValues.tax_id);
        return (
            taxOptions.find((option) => String(option.value) === key) ||
            taxFallback[key] ||
            null
        );
    }, [taxOptions, taxFallback, formValues.tax_id]);

    const selectedWarehouseOption = useMemo(() => {
        if (!formValues.warehouse_id) return null;
        const key = String(formValues.warehouse_id);
        return (
            warehouseOptions.find((option) => String(option.value) === key) ||
            warehouseFallback[key] ||
            null
        );
    }, [warehouseOptions, warehouseFallback, formValues.warehouse_id]);

    const selectedCategoryValues = useMemo(
        () => (Array.isArray(formValues.categories) ? formValues.categories.map((value) => String(value)) : []),
        [formValues.categories]
    );

    const categoryOptionMap = useMemo(() => {
        const map = new Map(categoryOptions.map((option) => [String(option.value), option]));
        Object.entries(categoryFallback).forEach(([key, option]) => {
            if (!map.has(key)) {
                map.set(key, option);
            }
        });
        return map;
    }, [categoryOptions, categoryFallback]);

    const selectedCategoryOptions = useMemo(
        () =>
            selectedCategoryValues.map(
                (value) => categoryOptionMap.get(value) ?? { value, label: value }
            ),
        [categoryOptionMap, selectedCategoryValues]
    );

    const selectedTagValues = useMemo(
        () => (Array.isArray(formValues.tags) ? formValues.tags.map((value) => String(value)) : []),
        [formValues.tags]
    );

    const tagOptionMap = useMemo(() => {
        const map = new Map(tagOptions.map((option) => [String(option.value), option]));
        Object.entries(tagFallback).forEach(([key, option]) => {
            if (!map.has(key)) {
                map.set(key, option);
            }
        });
        return map;
    }, [tagOptions, tagFallback]);

    const selectedTagOptions = useMemo(
        () =>
            selectedTagValues.map((value) => tagOptionMap.get(value) ?? { value, label: value }),
        [tagOptionMap, selectedTagValues]
    );

    useEffect(() => {
        if (selectedCategoryValues.length && categoryOptions.length === 0) {
            onLoadCategories?.();
        }
    }, [selectedCategoryValues, categoryOptions.length, onLoadCategories]);

    useEffect(() => {
        if (!selectedCategoryValues.length || !categoryOptions.length) return;
        setCategoryFallback((prev) => {
            let changed = false;
            const next = { ...prev };
            selectedCategoryValues.forEach((value) => {
                const option = categoryOptions.find(
                    (item) => String(item.value) === String(value)
                );
                if (option && (!next[value] || next[value].label !== option.label)) {
                    next[value] = option;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [categoryOptions, selectedCategoryValues]);

    useEffect(() => {
        if (selectedTagValues.length && tagOptions.length === 0) {
            onLoadTags?.();
        }
    }, [selectedTagValues, tagOptions.length, onLoadTags]);

    useEffect(() => {
        if (!selectedTagValues.length || !tagOptions.length) return;
        setTagFallback((prev) => {
            let changed = false;
            const next = { ...prev };
            selectedTagValues.forEach((value) => {
                const option = tagOptions.find((item) => String(item.value) === String(value));
                if (option && (!next[value] || next[value].label !== option.label)) {
                    next[value] = option;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [tagOptions, selectedTagValues]);

    useEffect(() => {
        if (formValues.brand_id && brandOptions.length === 0) {
            callAsync(() => onLoadBrands?.());
        }
    }, [formValues.brand_id, brandOptions.length, onLoadBrands, callAsync]);

    useEffect(() => {
        if (formValues.tax_id && taxOptions.length === 0) {
            callAsync(() => onLoadTaxes?.());
        }
    }, [formValues.tax_id, taxOptions.length, onLoadTaxes, callAsync]);

    useEffect(() => {
        if (formValues.warehouse_id && warehouseOptions.length === 0) {
            callAsync(() => onLoadWarehouses?.());
        }
    }, [formValues.warehouse_id, warehouseOptions.length, onLoadWarehouses, callAsync]);

    useEffect(() => {
        if (!formValues.brand_id) return;
        const option = brandOptions.find((item) => String(item.value) === String(formValues.brand_id));
        if (option) {
            setBrandFallback((prev) => ({
                ...prev,
                [String(option.value)]: option
            }));
        }
    }, [brandOptions, formValues.brand_id]);

    useEffect(() => {
        if (!formValues.tax_id) return;
        const option = taxOptions.find((item) => String(item.value) === String(formValues.tax_id));
        if (option) {
            setTaxFallback((prev) => ({
                ...prev,
                [String(option.value)]: option
            }));
        }
    }, [taxOptions, formValues.tax_id]);

    useEffect(() => {
        if (!formValues.warehouse_id) return;
        const option = warehouseOptions.find(
            (item) => String(item.value) === String(formValues.warehouse_id)
        );
        if (option) {
            setWarehouseFallback((prev) => ({
                ...prev,
                [String(option.value)]: option
            }));
        }
    }, [warehouseOptions, formValues.warehouse_id]);

    const handleBrandOpen = useCallback(
        () => callAsync(() => onLoadBrands?.()),
        [callAsync, onLoadBrands]
    );

    const handleTaxOpen = useCallback(
        () => callAsync(() => onLoadTaxes?.()),
        [callAsync, onLoadTaxes]
    );

    const handleWarehouseOpen = useCallback(
        () => callAsync(() => onLoadWarehouses?.()),
        [callAsync, onLoadWarehouses]
    );

    const handleBrandSelect = useCallback(
        (option) => {
            if (option?.value !== undefined && option?.value !== null) {
                setBrandFallback((prev) => ({
                    ...prev,
                    [String(option.value)]: option
                }));
            }
            updateFormValue('brand_id', option?.value || '');
        },
        [updateFormValue]
    );

    const handleBrandClear = useCallback(() => {
        const currentId = formValues.brand_id;
        setBrandFallback((prev) => {
            if (!currentId) return prev;
            const next = { ...prev };
            delete next[String(currentId)];
            return next;
        });
        updateFormValue('brand_id', '');
    }, [formValues.brand_id, updateFormValue]);

    const handleTaxSelect = useCallback(
        (option) => {
            if (option?.value !== undefined && option?.value !== null) {
                setTaxFallback((prev) => ({
                    ...prev,
                    [String(option.value)]: option
                }));
            }
            updateFormValue('tax_id', option?.value || '');
        },
        [updateFormValue]
    );

    const handleTaxClear = useCallback(() => {
        const currentId = formValues.tax_id;
        setTaxFallback((prev) => {
            if (!currentId) return prev;
            const next = { ...prev };
            delete next[String(currentId)];
            return next;
        });
        updateFormValue('tax_id', '');
    }, [formValues.tax_id, updateFormValue]);

    const handleWarehouseSelect = useCallback(
        (option) => {
            if (option?.value !== undefined && option?.value !== null) {
                setWarehouseFallback((prev) => ({
                    ...prev,
                    [String(option.value)]: option
                }));
            }
            updateFormValue('warehouse_id', option?.value || '');
        },
        [updateFormValue]
    );

    const handleWarehouseClear = useCallback(() => {
        const currentId = formValues.warehouse_id;
        setWarehouseFallback((prev) => {
            if (!currentId) return prev;
            const next = { ...prev };
            delete next[String(currentId)];
            return next;
        });
        updateFormValue('warehouse_id', '');
    }, [formValues.warehouse_id, updateFormValue]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
                setIsTagDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        updateFormValue('avatar', file ?? null);
    };

    const handleGalleryChange = (event) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) {
            return;
        }
        setFormValues((prev) => ({
            ...prev,
            product_images: [...prev.product_images, ...files]
        }));
    };

    const handleRemoveGalleryFile = (previewId) => {
        setFormValues((prev) => ({
            ...prev,
            product_images: prev.product_images.filter(
                (file) => `${file.name}-${file.size}-${file.lastModified}` !== previewId
            )
        }));
    };

    const addCompositeItem = () => {
        setCompositeItems((prev) => [...prev, createEmptyCompositeItem()]);
    };

    const removeCompositeItem = (uid) => {
        setCompositeItems((prev) => {
            if (prev.length === 1) {
                return [createEmptyCompositeItem()];
            }
            return prev.filter((item) => item.uid !== uid);
        });
    };

    const updateCompositeItem = (uid, updates) => {
        setCompositeItems((prev) =>
            prev.map((item) => {
                if (item.uid !== uid) {
                    return item;
                }
                const nextItem = { ...item, ...updates };
                const qty = Number(nextItem.qty) || 0;
                const cost = Number(nextItem.purchase_cost) || 0;
                return {
                    ...nextItem,
                    subtotal: Number((qty * cost).toFixed(2))
                };
            })
        );
    };

    const handleCompositeProductSelection = async (uid, productOption) => {
        if (!productOption) {
            updateCompositeItem(uid, {
                product_id: '',
                product_name: '',
                product_code: '',
                purchase_cost: '',
                qty: 1
            });
            return;
        }

        updateCompositeItem(uid, {
            product_id: String(productOption.id),
            product_name: productOption.text ?? '',
            loading: true
        });

        try {
            const response = await fetchProductDetails(productOption.id);
            const data = response?.data?.data ?? response?.data ?? response ?? {};
            const sku = data.sku ?? data.code ?? data.product_code ?? '';
            const purchaseCost =
                Number(data.purchase_cost ?? data.net_unit_cost ?? data.base_price ?? data.price ?? 0) ||
                0;

            updateCompositeItem(uid, {
                product_code: sku,
                purchase_cost: purchaseCost,
                qty: 1,
                loading: false
            });
        } catch (error) {
            console.error('Failed to load product details', error);
            toast.error('Failed to load product details for composite item');
            updateCompositeItem(uid, { loading: false });
        }
    };

    const buildFormData = () => {
        const formData = new FormData();
        const basePriceToSubmit =
            formValues.product_type === 'Combo'
                ? Number(computedCompositeTotal.toFixed(2))
                : formValues.base_price;

        // Required fields - always append with proper values
        // Ensure values are not empty strings for required fields
        formData.append('product_name', String(formValues.product_name || '').trim());
        formData.append('description', String(formValues.description || '').trim());
        formData.append('sku', String(formValues.sku || '').trim());
        formData.append('barcode', String(formValues.barcode || '').trim());
        formData.append('product_type', String(formValues.product_type || 'Standard'));
        formData.append('product_status', String(formValues.product_status || 'draft'));
        
        // Numeric fields - ensure they are valid numbers
        const basePrice = basePriceToSubmit ? Number(basePriceToSubmit) : 0;
        formData.append('base_price', String(basePrice));
        
        const salePrice = formValues.sale_price ? Number(formValues.sale_price) : 0;
        formData.append('sale_price', String(salePrice));
        
        const quantity = formValues.quantity ? Number(formValues.quantity) : 0;
        formData.append('quantity', String(quantity));
        
        // Integer fields - required, must be valid integers
        // Always append these required fields - if empty, validation will catch it
        const brandId = formValues.brand_id ? String(formValues.brand_id).trim() : '';
        formData.append('brand_id', brandId);
        
        const unitId = formValues.unit_id ? String(formValues.unit_id).trim() : '';
        formData.append('unit_id', unitId);

        if (formValues.product_status === 'scheduled' && formValues.scheduled_date) {
            formData.append('scheduled_date', formValues.scheduled_date);
        }

        formData.append('discount_type', String(formValues.discount_type || '1'));

        if (formValues.discount_type === '2') {
            formData.append('discount_percentage', String(formValues.discount_percentage || 0));
        } else if (formValues.discount_type === '3') {
            formData.append('dicsounted_value', String(formValues.discounted_value || ''));
        }

        formData.append('tax_type', String(formValues.tax_type || 'inclusive'));
        if (formValues.tax_id) {
            formData.append('tax_id', String(formValues.tax_id));
        }

        if (formValues.warehouse_id) {
            formData.append('warehouse_id', String(formValues.warehouse_id));
        }

        if (formValues.warehouse_quantity) {
            formData.append('warehouse_quantity', String(formValues.warehouse_quantity));
        }

        // Categories - required field, must have at least one valid category ID
        const categoriesArray = Array.isArray(formValues.categories) ? formValues.categories : [];
        const validCategories = categoriesArray.filter((catId) => catId && String(catId).trim() !== '');
        if (validCategories.length > 0) {
            validCategories.forEach((categoryId) => {
                formData.append('categories[]', String(categoryId).trim());
            });
        } else {
            // Categories is required, but if empty, we still need to send something
            // This should not happen if form validation is working, but handle gracefully
            console.warn('No categories selected - this may cause validation error');
        }

        // Tags - optional field
        const tagsArray = Array.isArray(formValues.tags) ? formValues.tags : [];
        tagsArray.forEach((tagId) => {
            if (tagId) {
                formData.append('tags[]', String(tagId));
            }
        });

        formData.append('is_featured', formValues.is_featured ? '1' : '0');
        formData.append('is_variant', formValues.is_variant ? '1' : '0');
        formData.append('is_batch', formValues.is_batch ? '1' : '0');
        formData.append('serial_imei_number', formValues.serial_imei_number ? '1' : '0');

        if (formValues.avatar instanceof File) {
            formData.append('avatar', formValues.avatar);
        }

        formValues.product_images.forEach((file, index) => {
            formData.append(`product_images[${index}]`, file);
        });

        if (formValues.product_type === 'Combo') {
            compositeItems.forEach((item, index) => {
                formData.append(`composite_items[${index}][product_id]`, String(item.product_id || ''));
                formData.append(`composite_items[${index}][product_code]`, String(item.product_code || ''));
                formData.append(`composite_items[${index}][qty]`, String(item.qty || ''));
                formData.append(
                    `composite_items[${index}][netUnitCost]`,
                    String(item.purchase_cost || '')
                );
                formData.append(`composite_items[${index}][subtotal]`, String(item.subtotal || ''));
            });
        }

        return formData;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!onSubmit) {
            return;
        }

        const formData = buildFormData();
        onSubmit({
            formData,
            values: {
                ...formValues,
                base_price:
                    formValues.product_type === 'Combo'
                        ? Number(computedCompositeTotal.toFixed(2))
                        : formValues.base_price,
                composite_items: compositeItems
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-lg-row gap-7 gap-lg-10">
            <div className="d-flex flex-column gap-7 gap-lg-10 w-100 w-lg-300px mb-7 me-lg-10">
                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Thumbnail</h2>
                        </div>
                    </div>
                    <div className="card-body text-center pt-0">
                        <div className="image-input image-input-empty mb-3" style={{ position: 'relative' }}>
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Product thumbnail preview"
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        margin: '0 auto'
                                    }}
                                />
                            ) : existingAvatarUrl ? (
                                <img
                                    src={existingAvatarUrl}
                                    alt="Current product thumbnail"
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        margin: '0 auto'
                                    }}
                                />
                            ) : (
                                <div
                                    className="bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '150px', height: '150px', borderRadius: '8px', margin: '0 auto' }}
                                >
                                    <i className="ki-duotone ki-picture text-muted fs-3x">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                        <div className="text-muted fs-7 mt-2">
                            Set the product thumbnail image. Only *.png, *.jpg and *.jpeg image files are accepted.
                        </div>
                    </div>
                </div>

                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Product Template</h2>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <label className="form-label">Product Type</label>
                        <select
                            className="form-select mb-2"
                            value={formValues.product_type}
                            onChange={handleSelectChange('product_type')}
                        >
                            {optionLists.productTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type === 'Combo' ? 'Composite Product' : `${type} Product`}
                                </option>
                            ))}
                        </select>
                        <div className="text-muted fs-7">
                            Select the type of product to determine its behavior and features.
                        </div>
                    </div>
                </div>

                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Status</h2>
                        </div>
                        <div className="card-toolbar">
                            <div className={`rounded-circle w-15px h-15px ${statusBadgeClass}`}></div>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <select
                            className={`form-select ${getFieldError('product_status') ? 'is-invalid' : ''}`}
                            value={formValues.product_status}
                            onChange={handleStatusChange}
                        >
                            {optionLists.productStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        {getFieldError('product_status') && (
                            <div className="invalid-feedback d-block">
                                {getFieldError('product_status')}
                            </div>
                        )}
                        <div className="text-muted fs-7 mt-2">Set the product status.</div>
                        {formValues.product_status === 'scheduled' && (
                            <div className="mt-3">
                                <label className="form-label">Scheduled Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formValues.scheduled_date ?? ''}
                                    onChange={handleTextChange('scheduled_date')}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Product Details</h2>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="mb-5">
                            <label className="form-label">Categories *</label>
                            <div className="position-relative" ref={categoryDropdownRef}>
                                <div
                                    className={`form-control d-flex flex-wrap align-items-center gap-2 p-3 ${getFieldError('categories') ? 'is-invalid border-danger' : ''}`}
                                    onClick={toggleCategoryDropdown}
                                    style={{ minHeight: '50px', cursor: 'pointer' }}
                                >
                                    {selectedCategoryOptions.length > 0 ? (
                                        selectedCategoryOptions.map((category) => (
                                            <span
                                                key={category.value}
                                                className="badge badge-light-primary d-flex align-items-center fs-7 py-2 px-3"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleCategoryRemove(category.value);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span className="me-2">{category.label}</span>
                                                <i className="ki-duotone ki-cross fs-6">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-muted">Select categories...</span>
                                    )}
                                </div>
                                <div
                                    className="position-absolute end-0 top-50 translate-middle-y pe-5"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <i
                                        className={`ki-duotone ki-down fs-2 text-muted ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                                        style={{ transition: 'transform 0.3s ease' }}
                                    >
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                                {isCategoryDropdownOpen && (
                                    <div
                                        className="position-absolute w-100 bg-white border border-gray-300 rounded shadow-lg"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1050,
                                            maxHeight: '320px',
                                            marginTop: '4px'
                                        }}
                                    >
                                        <div className="p-3 border-bottom">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search categories..."
                                                value={categorySearchInput}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setCategorySearchInput(value);
                                                    callAsync(() => onLoadCategories?.(value));
                                                }}
                                                onClick={(event) => event.stopPropagation()}
                                                autoFocus
                                            />
                                        </div>
                                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                            {categoryLoading && categoryOptions.length === 0 ? (
                                                <div className="p-3 text-center text-muted">Loading categories...</div>
                                            ) : categoryOptions.length > 0 ? (
                                                categoryOptions.map((category) => {
                                                    const isSelected = selectedCategoryValues.includes(category.value);
                                                    return (
                                                        <div
                                                            key={category.value}
                                                            className={`d-flex align-items-center p-3 cursor-pointer ${
                                                                isSelected ? 'bg-light-primary' : ''
                                                            }`}
                                                            style={{ transition: 'background-color 0.2s ease' }}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleCategoryToggle(category.value);
                                                            }}
                                                        >
                                                            <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleCategoryToggle(category.value)}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                />
                                                            </div>
                                                            <span className={`fw-semibold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                                                                {category.label}
                                                            </span>
                                                            {isSelected && (
                                                                <i className="ki-duotone ki-check fs-3 text-primary ms-auto">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-3 text-center text-muted">No categories found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {getFieldError('categories') && (
                                <div className="invalid-feedback d-block">
                                    {getFieldError('categories')}
                                </div>
                            )}
                            <div className="text-muted fs-7 mt-1">Click to select one or more categories.</div>
                        </div>

                        <div className="mb-5">
                            <label className="form-label">Tags</label>
                            <div className="position-relative" ref={tagDropdownRef}>
                                <div
                                    className="form-control d-flex flex-wrap align-items-center gap-2 p-3"
                                    onClick={toggleTagDropdown}
                                    style={{ minHeight: '50px', cursor: 'pointer' }}
                                >
                                    {selectedTagOptions.length > 0 ? (
                                        selectedTagOptions.map((tag) => (
                                            <span
                                                key={tag.value}
                                                className="badge badge-light-secondary d-flex align-items-center fs-7 py-2 px-3"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleTagRemove(tag.value);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span className="me-2">{tag.label}</span>
                                                <i className="ki-duotone ki-cross fs-6">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-muted">Select tags...</span>
                                    )}
                                </div>
                                <div
                                    className="position-absolute end-0 top-50 translate-middle-y pe-5"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <i
                                        className={`ki-duotone ki-down fs-2 text-muted ${isTagDropdownOpen ? 'rotate-180' : ''}`}
                                        style={{ transition: 'transform 0.3s ease' }}
                                    >
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                                {isTagDropdownOpen && (
                                    <div
                                        className="position-absolute w-100 bg-white border border-gray-300 rounded shadow-lg"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1050,
                                            maxHeight: '320px',
                                            marginTop: '4px'
                                        }}
                                    >
                                        <div className="p-3 border-bottom">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search tags..."
                                                value={tagSearchInput}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setTagSearchInput(value);
                                                    callAsync(() => onLoadTags?.(value));
                                                }}
                                                onClick={(event) => event.stopPropagation()}
                                                autoFocus
                                            />
                                        </div>
                                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                            {tagLoading && tagOptions.length === 0 ? (
                                                <div className="p-3 text-center text-muted">Loading tags...</div>
                                            ) : tagOptions.length > 0 ? (
                                                tagOptions.map((tag) => {
                                                    const isSelected = selectedTagValues.includes(tag.value);
                                                    return (
                                                        <div
                                                            key={tag.value}
                                                            className={`d-flex align-items-center p-3 cursor-pointer ${
                                                                isSelected ? 'bg-light-primary' : ''
                                                            }`}
                                                            style={{ transition: 'background-color 0.2s ease' }}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleTagToggle(tag.value);
                                                            }}
                                                        >
                                                            <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleTagToggle(tag.value)}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                />
                                                            </div>
                                                            <span className={`fw-semibold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                                                                {tag.label}
                                                            </span>
                                                            {isSelected && (
                                                                <i className="ki-duotone ki-check fs-3 text-primary ms-auto">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-3 text-center text-muted">No tags found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-5">
                            <SearchableDropdown
                                label="Brand *"
                                placeholder="Select Brand"
                                options={brandOptions}
                                selected={selectedBrandOption}
                                onSelect={handleBrandSelect}
                                onClear={handleBrandClear}
                                required
                                loading={brandLoading}
                                onOpen={handleBrandOpen}
                                onSearchChange={(value) => callAsync(() => onLoadBrands?.(value))}
                                className={`w-100 ${getFieldError('brand_id') ? 'is-invalid' : ''}`}
                                error={getFieldError('brand_id')}
                            />
                            {getFieldError('brand_id') && (
                                <div className="invalid-feedback d-block">
                                    {getFieldError('brand_id')}
                                </div>
                            )}
                        </div>

                        <div>
                            <SearchableDropdown
                                label="Product Unit *"
                                placeholder="Select Unit"
                                options={unitOptions}
                                selected={selectedUnitOption}
                                onSelect={(option) => updateFormValue('unit_id', option?.value || '')}
                                onClear={() => updateFormValue('unit_id', '')}
                                required
                                loading={unitLoading}
                                className={`w-100 ${getFieldError('unit_id') ? 'is-invalid' : ''}`}
                                error={getFieldError('unit_id')}
                            />
                            {getFieldError('unit_id') && (
                                <div className="invalid-feedback d-block">
                                    {getFieldError('unit_id')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>General</h2>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="mb-10">
                            <label className="form-label required">Product Name</label>
                            <input
                                type="text"
                                className={`form-control ${getFieldError('product_name') ? 'is-invalid' : ''}`}
                                value={formValues.product_name}
                                onChange={handleTextChange('product_name')}
                                placeholder="Product name"
                                required
                            />
                            {getFieldError('product_name') && (
                                <div className="invalid-feedback d-block">
                                    {getFieldError('product_name')}
                                </div>
                            )}
                            <div className="text-muted fs-7 mt-1">
                                A product name is required and recommended to be unique.
                            </div>
                        </div>

                        <div className="mb-10">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                rows="5"
                                value={formValues.description}
                                onChange={handleTextChange('description')}
                                placeholder="Type your product description here..."
                            ></textarea>
                            <div className="text-muted fs-7 mt-1">
                                Set a description to the product for better visibility.
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formValues.is_featured}
                                        onChange={handleCheckboxChange('is_featured')}
                                    />
                                    <label className="form-check-label">Featured Product</label>
                                </div>
                                <div className="text-muted fs-7 small">
                                    Mark this product as featured.
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formValues.is_variant}
                                        onChange={handleCheckboxChange('is_variant')}
                                    />
                                    <label className="form-check-label">Variant Product</label>
                                </div>
                                <div className="text-muted fs-7 small">
                                    Mark this product as variant with different options.
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formValues.is_batch}
                                        onChange={handleCheckboxChange('is_batch')}
                                    />
                                    <label className="form-check-label">Batch Product</label>
                                </div>
                                <div className="text-muted fs-7 small">
                                    Mark this product as a batch product for tracking.
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formValues.serial_imei_number}
                                        onChange={handleCheckboxChange('serial_imei_number')}
                                    />
                                    <label className="form-check-label">Serial/IMEI</label>
                                </div>
                                <div className="text-muted fs-7 small">
                                    Requires serial or IMEI number tracking.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Media</h2>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <label className="form-label">Product Gallery</label>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryChange}
                        />
                        <div className="text-muted fs-7 mt-2">
                            Set the product media gallery. You can upload up to 10 files.
                        </div>

                        {(galleryPreviews.length > 0 || existingGallery.length > 0) && (
                            <div className="mt-3 d-flex flex-wrap gap-2">
                                {existingGallery.map((url, index) => (
                                    <div key={`existing-${index}`} className="position-relative">
                                        <img
                                            src={url}
                                            alt={`Existing gallery ${index}`}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                ))}
                                {galleryPreviews.map((preview) => (
                                    <div key={preview.id} className="position-relative">
                                        <img
                                            src={preview.url}
                                            alt="Preview"
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-sm btn-light-danger position-absolute top-0 end-0"
                                            onClick={() => handleRemoveGalleryFile(preview.id)}
                                            aria-label="Remove image"
                                        >
                                            <i className="ki-duotone ki-cross fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Pricing</h2>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="row">
                            <div className="col-md-6 mb-5">
                                <label className="form-label required">Base Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`form-control ${getFieldError('base_price') ? 'is-invalid' : ''}`}
                                    value={
                                        formValues.product_type === 'Combo'
                                            ? Number(computedCompositeTotal.toFixed(2))
                                            : formValues.base_price
                                    }
                                    onChange={handleTextChange('base_price')}
                                    placeholder="0.00"
                                    required
                                    readOnly={formValues.product_type === 'Combo'}
                                />
                                {getFieldError('base_price') && (
                                    <div className="invalid-feedback d-block">
                                        {getFieldError('base_price')}
                                    </div>
                                )}
                                {formValues.product_type === 'Combo' ? (
                                    <div className="text-muted fs-7 mt-1">
                                        Base price is automatically calculated from composite items.
                                    </div>
                                ) : (
                                    <div className="text-muted fs-7 mt-1">
                                        Set the product base price.
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6 mb-5">
                                <label className="form-label required">Sale Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`form-control ${getFieldError('sale_price') ? 'is-invalid' : ''}`}
                                    value={formValues.sale_price}
                                    onChange={handleTextChange('sale_price')}
                                    placeholder="0.00"
                                    required
                                />
                                {getFieldError('sale_price') && (
                                    <div className="invalid-feedback d-block">
                                        {getFieldError('sale_price')}
                                    </div>
                                )}
                                <div className="text-muted fs-7 mt-1">
                                    Set the product sale price.
                                </div>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="form-label d-block">Discount Type</label>
                            <div className="row row-cols-1 row-cols-md-3 g-3" data-kt-buttons="true">
                                <div className="col">
                                    <label className="btn btn-outline btn-outline-dashed btn-active-light-primary d-flex text-start p-4">
                                        <span className="form-check form-check-custom form-check-solid form-check-sm align-items-start mt-1">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="discount_type"
                                                value="1"
                                                checked={formValues.discount_type === '1'}
                                                onChange={handleDiscountTypeChange}
                                            />
                                        </span>
                                        <span className="ms-5">
                                            <span className="fs-5 fw-bold text-gray-800 d-block">No Discount</span>
                                        </span>
                                    </label>
                                </div>
                                <div className="col">
                                    <label className="btn btn-outline btn-outline-dashed btn-active-light-primary d-flex text-start p-4">
                                        <span className="form-check form-check-custom form-check-solid form-check-sm align-items-start mt-1">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="discount_type"
                                                value="2"
                                                checked={formValues.discount_type === '2'}
                                                onChange={handleDiscountTypeChange}
                                            />
                                        </span>
                                        <span className="ms-5">
                                            <span className="fs-5 fw-bold text-gray-800 d-block">Percentage</span>
                                        </span>
                                    </label>
                                </div>
                                <div className="col">
                                    <label className="btn btn-outline btn-outline-dashed btn-active-light-primary d-flex text-start p-4">
                                        <span className="form-check form-check-custom form-check-solid form-check-sm align-items-start mt-1">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="discount_type"
                                                value="3"
                                                checked={formValues.discount_type === '3'}
                                                onChange={handleDiscountTypeChange}
                                            />
                                        </span>
                                        <span className="ms-5">
                                            <span className="fs-5 fw-bold text-gray-800 d-block">Fixed Price</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {formValues.discount_type === '2' && (
                            <div className="mb-5">
                                <label className="form-label">Set Discount Percentage</label>
                                <div className="d-flex flex-column text-center mb-3">
                                    <div className="d-flex align-items-start justify-content-center mb-4">
                                        <span className="fw-bold fs-1" id="discount-percentage-value">
                                            {formValues.discount_percentage}
                                        </span>
                                        <span className="fw-bold fs-4 mt-1 ms-2">%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={formValues.discount_percentage}
                                        onChange={handleDiscountPercentageChange}
                                        className="form-range"
                                    />
                                </div>
                                <div className="text-muted fs-7">
                                    Set the percentage discount to apply to the base price.
                                </div>
                            </div>
                        )}

                        {formValues.discount_type === '3' && (
                            <div className="mb-5">
                                <label className="form-label">Fixed Discounted Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={formValues.discounted_value}
                                    onChange={handleDiscountedValueChange}
                                    placeholder="Discounted price"
                                />
                                <div className="text-muted fs-7">
                                    Set the fixed discounted price for the product.
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-md-6 mb-5">
                                <label className="form-label required">Tax Type</label>
                                <select
                                    className="form-select"
                                    value={formValues.tax_type}
                                    onChange={handleSelectChange('tax_type')}
                                >
                                    {optionLists.taxTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-5">
                                <SearchableDropdown
                                    label="Tax"
                                    placeholder="Select Tax"
                                    options={taxOptions}
                                    selected={selectedTaxOption}
                                    onSelect={handleTaxSelect}
                                    onClear={handleTaxClear}
                                    loading={taxLoading}
                                    onOpen={handleTaxOpen}
                                    onSearchChange={(value) => callAsync(() => onLoadTaxes?.(value))}
                                    className="w-100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card card-flush py-4">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Inventory</h2>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <div className="row">
                            <div className="col-md-4 mb-5">
                                <label className="form-label required">SKU</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('sku') ? 'is-invalid' : ''}`}
                                    value={formValues.sku}
                                    onChange={handleTextChange('sku')}
                                    placeholder="SKU number"
                                    required
                                />
                                {getFieldError('sku') && (
                                    <div className="invalid-feedback d-block">
                                        {getFieldError('sku')}
                                    </div>
                                )}
                                <div className="text-muted fs-7 mt-1">
                                    Enter the product SKU.
                                </div>
                            </div>
                            <div className="col-md-4 mb-5">
                                <label className="form-label">Barcode</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formValues.barcode}
                                    onChange={handleTextChange('barcode')}
                                    placeholder="Barcode number"
                                />
                                <div className="text-muted fs-7 mt-1">
                                    Enter the product barcode (optional).
                                </div>
                            </div>
                            <div className="col-md-4 mb-5">
                                <label className="form-label required">Quantity</label>
                                <input
                                    type="number"
                                    className={`form-control ${getFieldError('quantity') ? 'is-invalid' : ''}`}
                                    value={formValues.quantity}
                                    onChange={handleTextChange('quantity')}
                                    placeholder="0"
                                    required
                                />
                                {getFieldError('quantity') && (
                                    <div className="invalid-feedback d-block">
                                        {getFieldError('quantity')}
                                    </div>
                                )}
                                <div className="text-muted fs-7 mt-1">
                                    Enter product quantity.
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-5">
                                <SearchableDropdown
                                    label="Warehouse"
                                    placeholder="Select Warehouse"
                                    options={warehouseOptions}
                                    selected={selectedWarehouseOption}
                                onSelect={handleWarehouseSelect}
                                onClear={handleWarehouseClear}
                                    loading={warehouseLoading}
                                    onOpen={handleWarehouseOpen}
                                    onSearchChange={(value) => callAsync(() => onLoadWarehouses?.(value))}
                                    className="w-100"
                                />
                            </div>
                            <div className="col-md-6 mb-5">
                                <label className="form-label">Warehouse Quantity</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formValues.warehouse_quantity}
                                    onChange={handleTextChange('warehouse_quantity')}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {formValues.product_type === 'Combo' && (
                    <div className="card card-flush py-4">
                        <div className="card-header">
                            <div className="card-title">
                                <h2>Composite Products</h2>
                            </div>
                            <div className="card-toolbar">
                                <span className="badge badge-light-info">Auto pricing enabled</span>
                            </div>
                        </div>
                        <div className="card-body pt-0">
                            <div className="alert alert-info">
                                <strong>Note:</strong> Composite product base price is calculated automatically from the
                                selected products.
                            </div>

                            <div className="mb-5">
                                {compositeItems.map((item) => (
                                    <div key={item.uid} className="composite-item-row mb-5">
                                        <div className="row g-3 align-items-end">
                                            <div className="col-md-3">
                                                <label className="form-label">Product</label>
                                                <ProductSearchSelect
                                                    value={item.product_id}
                                                    initialLabel={item.product_name}
                                                    onChange={(productId) => {
                                                        if (!productId) {
                                                            handleCompositeProductSelection(item.uid, null);
                                                        }
                                                    }}
                                                    onProductSelected={(product) =>
                                                        handleCompositeProductSelection(item.uid, product)
                                                    }
                                                    className="form-control-sm"
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Code</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={item.product_code}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control"
                                                    value={item.qty}
                                                    onChange={(event) =>
                                                        updateCompositeItem(item.uid, {
                                                            qty: Number(event.target.value) || 1
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Purchase Cost</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={item.purchase_cost}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Subtotal</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={Number(item.subtotal).toFixed(2)}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-md-1 d-flex justify-content-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-light-danger"
                                                    onClick={() => removeCompositeItem(item.uid)}
                                                    disabled={compositeItems.length === 1}
                                                >
                                                    <i className="ki-duotone ki-trash fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                        <span className="path5"></span>
                                                    </i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                                <button
                                    type="button"
                                    className="btn btn-light-primary"
                                    onClick={addCompositeItem}
                                >
                                    <i className="ki-duotone ki-plus fs-3 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Add Composite Item
                                </button>
                                <div className="fw-bold">
                                    Total Purchase Cost:{' '}
                                    <span className="text-primary">
                                        {Number(computedCompositeTotal).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-end gap-3">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitDisabled}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-3 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {submitLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ProductForm;

