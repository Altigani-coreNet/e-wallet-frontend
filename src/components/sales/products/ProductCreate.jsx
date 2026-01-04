import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    createProduct,
    fetchCategoriesForSelect,
    fetchBrandsForSelect,
    fetchTagsForSelect,
    fetchTaxesForSelect,
    fetchWarehousesForSelect,
    fetchUnitsForSelect
} from '../../../services/productsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ProductForm from './ProductForm';
import PlanUpgradeModal from '../../users/PlanUpgradeModal';

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

export default function ProductCreate() {
    const { setTitle, setBreadcrumbs } = useToolbar();
    const navigate = useNavigate();
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
    const [submitting, setSubmitting] = useState(false);
    const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);

    useEffect(() => {
        setTitle('Add Product');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Products', path: '/sales/products' },
            { label: 'Add Product', path: '/sales/products/create', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

    const loadCategories = useCallback(
        async (search = '') => {
            if (categoriesLoading) return;
            if (!search && categoriesLoaded) return;
            try {
                setCategoriesLoading(true);
                const params = { per_page: 5 };
                if (search) params.search = search;
                const list = await fetchCategoriesForSelect(params);
                setCategories((prev) => mergeById(prev, Array.isArray(list) ? list : []));
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
                setBrands((prev) => mergeById(prev, Array.isArray(list) ? list : []));
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
                setTags((prev) => mergeById(prev, Array.isArray(list) ? list : []));
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
                setTaxes((prev) => mergeById(prev, Array.isArray(list) ? list : []));
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
                setWarehouses((prev) => mergeById(prev, Array.isArray(list) ? list : []));
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
        const loadUnits = async () => {
            try {
                setUnitsLoading(true);
                const response = await fetchUnitsForSelect();
                const list = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                        ? response
                        : [];
                setUnits(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error('Error loading units:', error);
                toast.error('Failed to load units');
            } finally {
                setUnitsLoading(false);
            }
        };

        loadUnits();
    }, []);

    const handleCancel = () => {
        navigate('/sales/products');
    };

    const formSelectOptions = useMemo(
        () => ({
            ...DEFAULT_SELECT_OPTIONS,
            categories,
            brands,
            tags,
            taxes,
            warehouses,
            units
        }),
        [categories, brands, tags, taxes, warehouses, units]
    );

    const handleSubmit = async ({ formData }) => {
        setSubmitting(true);
        try {
            const response = await createProduct(formData);

            if (response.success) {
                toast.success('Product created successfully!');
                navigate('/sales/products');
            } else {
                // Check for plan limit errors (406 status or specific error codes)
                const statusCode = response.statusCode;
                const errorCode = response.errorCode;
                const errorMessage = response.error || '';

                const isPlanLimitError = statusCode === 406 || 
                                        errorCode === 'PLAN_PRODUCTS_LIMIT_REACHED' || 
                                        errorCode === 'PLAN_PRODUCTS_NOT_ENABLED' ||
                                        errorMessage.toLowerCase().includes('limit reached') ||
                                        errorMessage.toLowerCase().includes('not enabled') ||
                                        errorMessage.toLowerCase().includes('plan limit');

                if (isPlanLimitError) {
                    // Show plan upgrade modal instead of error toast
                    setShowPlanUpgradeModal(true);
                } else {
                    // Show error toast for other errors
                    toast.error(errorMessage || 'Failed to create product');
                }
            }
        } catch (error) {
            console.error('Error creating product', error);
            
            // Check if it's a plan limit error from the catch block
            const errorResponse = error.response?.data;
            const statusCode = error.response?.status;
            const errorCode = errorResponse?.data?.code || errorResponse?.code || errorResponse?.errorCode;
            const errorMessage = errorResponse?.message || error.message || '';
            
            const isPlanLimitError = statusCode === 406 || 
                                    errorCode === 'PLAN_PRODUCTS_LIMIT_REACHED' || 
                                    errorCode === 'PLAN_PRODUCTS_NOT_ENABLED' ||
                                    errorMessage.toLowerCase().includes('limit reached') ||
                                    errorMessage.toLowerCase().includes('not enabled') ||
                                    errorMessage.toLowerCase().includes('plan limit');
            
            if (isPlanLimitError) {
                // Show plan upgrade modal instead of error toast
                setShowPlanUpgradeModal(true);
            } else {
                // Show error toast for other errors
                toast.error(errorMessage || 'Failed to create product');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <ProductForm
                mode="create"
                selectOptions={formSelectOptions}
                loadingOptions={unitsLoading}
                submitting={submitting}
                submitLabel="Save Product"
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
            />
            <PlanUpgradeModal
                show={showPlanUpgradeModal}
                onHide={() => setShowPlanUpgradeModal(false)}
                resourceType="products"
            />
        </>
    );
}
