import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fetchProductDetails, updateProduct, fetchProductServiceForms, mapProductFormsToApiPayload } from '../../../services/serviceProductsService';
import axios from 'axios';
import { ADMIN_ENDPOINTS, POS_API_BASE } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import SearchableDropdown from '../../../common/filters/SearchableDropdown';
import MobileFormsBuilder from '../../../common/MobileFormsBuilder';

const normalizeNameTranslations = (nameValue, fallbackEn = '', fallbackAr = '') => {
    if (nameValue && typeof nameValue === 'object' && !Array.isArray(nameValue)) {
        return {
            en: nameValue.en ?? fallbackEn ?? '',
            ar: nameValue.ar ?? fallbackAr ?? '',
        };
    }

    if (typeof nameValue === 'string') {
        return { en: nameValue, ar: fallbackAr ?? '' };
    }

    return { en: fallbackEn ?? '', ar: fallbackAr ?? '' };
};

const normalizeFormNameTranslations = (nameValue, fallbackEn = '', fallbackAr = '') => {
    if (nameValue && typeof nameValue === 'object' && !Array.isArray(nameValue)) {
        return {
            en: nameValue.en ?? fallbackEn ?? '',
            ar: nameValue.ar ?? fallbackAr ?? '',
        };
    }

    if (typeof nameValue === 'string') {
        return { en: nameValue || fallbackEn || '', ar: fallbackAr || '' };
    }

    return { en: fallbackEn ?? '', ar: fallbackAr ?? '' };
};

const ensureAbsoluteUrl = (base, value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    }
    const normalizedBase = (base || '').replace(/\/+$/, '');
    const normalizedPath = trimmed.replace(/^\/+/, '');
    return normalizedBase ? `${normalizedBase}/${normalizedPath}` : `/${normalizedPath}`;
};

const makeLocalOptionId = () => `opt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const normalizeFieldOptions = (options = []) =>
    (Array.isArray(options) ? options : []).map((option, index) => ({
        ...option,
        id: option?.id ? `${option.id}` : makeLocalOptionId(),
        _idx: index,
    }));

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [service, setService] = useState(null);
    
    const [formData, setFormData] = useState({
        service_id: "",
        service_sub_category_id: "",
        name: { en: "", ar: "" },
        description: { en: "", ar: "" },
        service_url: "",
        notify_url: "",
        prepay_url: "",
        image: null,
        status: true,
    });

    const [imagePreview, setImagePreview] = useState(null);

    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [subCategorySearchTerm, setSubCategorySearchTerm] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const [productForms, setProductForms] = useState([]);
    const mobileFormsBuilderRef = useRef(null);

    useEffect(() => {
        setTitle('Edit Product');
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Service Products', path: '/admin/service-products' },
            { label: 'Edit Product', path: `/admin/service-products/${id}/edit`, active: true },
        ]);
        loadProduct();
    }, [id, setTitle, setBreadcrumbs]);


    const loadProduct = async () => {
        setLoading(true);
        try {
            const response = await fetchProductDetails(id);
            if (response.success) {
                // The API returns { success: true, data: {...} }
                // fetchProductDetails returns response.data, so response is already { success: true, data: {...} }
                const product = response.data || response;
                setService(product.service || null);
                setFormData({
                    service_id: product.service_id || "",
                    service_sub_category_id: product.service_sub_category_id || "",
                    name: normalizeNameTranslations(product.name, product.name_en || "", product.name_ar || ""),
                    description: normalizeNameTranslations(
                        product.description,
                        product.description_en || "",
                        product.description_ar || ""
                    ),
                    service_url: product.service_url || "",
                    notify_url: product.notify_url || "",
                    prepay_url: product.prepay_url || "",
                    image: null,
                    status: product.status !== undefined ? !!product.status : true,
                });

                setImagePreview(ensureAbsoluteUrl(POS_API_BASE, product.image_url || product.image) || null);
                if (product.service_sub_category_id) {
                    setSelectedSubCategory({ value: product.service_sub_category_id, label: product.service_sub_category_id });
                }
                if ((product.service?.category_id) || (product.category_id)) {
                    loadSubCategories('', product.service?.category_id || product.category_id);
                }
                
                // Store service for display
                if (product.service) {
                    setService(product.service);
                }

                try {
                    const formsResp = await fetchProductServiceForms(id);
                    if (formsResp?.success) {
                        const list = formsResp.data || [];
                        setProductForms(list.map((f) => ({
                            id: `${f.id}`,
                            title: f.form_name_en || f.form_name?.en || f.form_name || 'Mobile Services Form',
                            form_name: normalizeFormNameTranslations(
                                f.form_name,
                                f.form_name_en || f.form_name?.en || f.form_name || 'Mobile Services Form',
                                f.form_name_ar || f.form_name?.ar || ''
                            ),
                            form_url: f.form_url || '',
                            fields: (f.fields || []).map((field) => ({
                                id: `${field.id}`,
                                label_en: field.label_en || '',
                                label_ar: field.label_ar || '',
                                key: field.key || '',
                                type: field.type || 'Text Field',
                                options: normalizeFieldOptions(field.options),
                                customization: (() => {
                                    const incoming = field.customization || field.customization_json || {};
                                    const hasMin = incoming?.min !== null && incoming?.min !== undefined && incoming?.min !== '';
                                    const hasMax = incoming?.max !== null && incoming?.max !== undefined && incoming?.max !== '';
                                    const hasMinLength = incoming?.min_length !== null && incoming?.min_length !== undefined && incoming?.min_length !== '';
                                    const hasMaxLength = incoming?.max_length !== null && incoming?.max_length !== undefined && incoming?.max_length !== '';
                                    const hasRegex = incoming?.regex !== null && incoming?.regex !== undefined && `${incoming.regex}`.trim() !== '';
                                    const hasHint = incoming?.hint !== null && incoming?.hint !== undefined && `${incoming.hint}`.trim() !== '';
                                    return {
                                        ...incoming,
                                        min: incoming?.min ?? incoming?.min_length ?? null,
                                        max: incoming?.max ?? incoming?.max_length ?? null,
                                        enabled: Boolean(incoming?.enabled || hasMin || hasMax || hasMinLength || hasMaxLength || hasRegex || hasHint),
                                    };
                                })(),
                                is_required: field.is_required !== false,
                            })),
                        })));
                    }
                } catch (e) {
                    // ignore load forms errors
                }
            } else {
                toast.error(response.error || 'Failed to load product');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            toast.error(error.response?.data?.message || 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const loadSubCategories = async (searchTerm = '', categoryId = null) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }
        try {
            setLoadingSubCategories(true);
            const params = { category_id: categoryId, limit: 100 };
            if (searchTerm) params.search = searchTerm;
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORIES_SELECT, {
                params,
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (response.data?.success || response.data?.status) {
                const list = response.data?.data || [];
                const mapped = list.map(item => ({ value: item.id, label: item.name_en || item.name || item.text || item.id, ...item }));
                setSubCategories(mapped);
                setSelectedSubCategory((prev) => {
                    if (!prev?.value) return prev;
                    const match = mapped.find((s) => s.value === prev.value);
                    return match || prev;
                });
            } else {
                setSubCategories([]);
            }
        } catch (error) {
            setSubCategories([]);
        } finally {
            setLoadingSubCategories(false);
        }
    };

    const handleSubCategorySearchChange = (value) => {
        setSubCategorySearchTerm(value);
        loadSubCategories(value, service?.category_id || null);
    };

    const handleSubCategoryOpen = () => {
        if (subCategories.length === 0) loadSubCategories('', service?.category_id || null);
    };

    const handleSubCategorySelect = (option) => {
        const selected = (subCategories || []).find((s) => s.value === option.value) || option;
        setSelectedSubCategory(selected);
        setFormData((prev) => ({ ...prev, service_sub_category_id: option.value }));
    };

    const handleSubCategoryClear = () => {
        setSelectedSubCategory(null);
        setFormData((prev) => ({ ...prev, service_sub_category_id: '' }));
    };

    const serviceLabel = useMemo(() => (
        (typeof formData?.name?.en === 'string' ? formData.name.en.trim() : '') ||
        (typeof formData?.name?.ar === 'string' ? formData.name.ar.trim() : '') ||
        'Live Form Preview'
    ), [formData?.name?.en, formData?.name?.ar]);

    /** Service detail URL uses the service UUID (`services.id`), same as Service Show. */
    const serviceRouteId = service?.id || formData.service_id;

    const goBackToServiceShow = () => {
        if (serviceRouteId) {
            navigate(`/admin/services/${serviceRouteId}`);
        } else {
            navigate(-1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitting(true);
        try {
            const result = await updateProduct(id, {
                ...formData,
                forms: mapProductFormsToApiPayload(productForms),
            });
            if (result.success) {
                toast.success('Product updated successfully');
                if (serviceRouteId) {
                    navigate(`/admin/services/${serviceRouteId}`, { replace: true });
                } else {
                    navigate(-1);
                }
            } else {
                toast.error(result.error || 'Failed to update product');
            }
        } catch (error) {
            toast.error('Failed to update product');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="row g-5">
                <div className="col-md-9">
                    <div className="card">
                        <div className="card-header placeholder-glow">
                            <span className="placeholder col-4 rounded" />
                        </div>
                        <div className="card-body">
                            <p className="text-muted mb-4">Loading product…</p>
                            <div className="row g-4">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={idx} className="col-md-6">
                                        <div className="placeholder-glow mb-2">
                                            <span className="placeholder col-5 rounded" />
                                        </div>
                                        <span className="placeholder col-12 rounded d-block" style={{ height: 38 }} />
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex justify-content-center mt-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading…</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card card-flush">
                        <div className="card-header placeholder-glow">
                            <span className="placeholder col-8 rounded" />
                        </div>
                        <div className="card-body text-center">
                            <span className="placeholder d-inline-block rounded" style={{ width: 150, height: 150 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-5">
                <div className="col-md-9">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Edit Product</h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Product Name (English)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData?.name?.en || ''}
                                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                        placeholder="Enter product name (EN)"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Product Name (Arabic)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData?.name?.ar || ''}
                                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                                        placeholder="Enter product name (AR)"
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Description (English)</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData?.description?.en || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: { ...formData.description, en: e.target.value },
                                            })
                                        }
                                        placeholder="Short description (English)"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Description (Arabic)</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData?.description?.ar || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: { ...formData.description, ar: e.target.value },
                                            })
                                        }
                                        dir="rtl"
                                        placeholder="وصف المنتج بالعربية"
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-semibold">Service Sub Category</label>
                                    <SearchableDropdown
                                        options={subCategories}
                                        selected={selectedSubCategory ? { value: selectedSubCategory.value, label: selectedSubCategory.label } : null}
                                        onSearchChange={handleSubCategorySearchChange}
                                        onSelect={handleSubCategorySelect}
                                        onClear={handleSubCategoryClear}
                                        onOpen={handleSubCategoryOpen}
                                        loading={loadingSubCategories}
                                        placeholder={loadingSubCategories ? 'Loading sub-categories…' : 'Select sub category'}
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Status</label>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={!!formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                        />
                                        <label className="form-check-label">
                                            {formData.status ? 'Active' : 'Inactive'}
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Service UUID</label>
                                    <input
                                        type="text"
                                        className="form-control text-break"
                                        value={service?.id || ''}
                                        readOnly
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        placeholder="—"
                                    />
                                    <small className="text-muted">Linked service primary key (read-only)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card card-flush">
                        <div className="card-header">
                            <div className="card-title">
                                <h3>Product Image</h3>
                            </div>
                        </div>
                        <div className="card-body text-center pt-0">
                            <div className="text-center mb-10" style={{ position: 'relative' }}>
                                <div className="image-input image-input-outline" style={{ position: 'relative', display: 'inline-block' }}>
                                    <div
                                        className="image-input-wrapper w-150px h-150px"
                                        style={{
                                            backgroundImage: `url('${imagePreview || '/assets/media/avatars/300-1.jpg'}')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '8px',
                                            margin: '0 auto',
                                            position: 'relative'
                                        }}
                                    ></div>
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        id="product-image-upload-edit"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setFormData((prev) => ({ ...prev, image: file }));
                                            if (file) {
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="product-image-upload-edit"
                                        className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow"
                                        style={{ position: 'absolute', bottom: 0, right: 'calc(50% - 17.5px)', cursor: 'pointer' }}
                                    >
                                        <i className="ki-duotone ki-pencil fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </label>
                                </div>
                            </div>
                            <div className="text-muted fs-7">Upload product image</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 mt-5">
                    <MobileFormsBuilder
                        ref={mobileFormsBuilderRef}
                        value={productForms}
                        onChange={setProductForms}
                        serviceLabel={serviceLabel}
                        hideGlobalActions
                    />
                </div>

                <div className="col-12">
                    <div className="d-flex justify-content-end flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-light-primary"
                            onClick={() => mobileFormsBuilderRef.current?.addForm?.()}
                        >
                            <i className="la la-plus"></i> Add Form
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => mobileFormsBuilderRef.current?.openPreview?.()}
                        >
                            <i className="ki-duotone ki-eye fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            Preview the Process
                        </button>
                        <button type="button" className="btn btn-light" onClick={goBackToServiceShow}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Product'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default ProductEdit;

