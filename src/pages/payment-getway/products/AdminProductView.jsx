import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminProduct } from '../../../services/adminProductsService';
import { fetchProductServiceForms } from '../../../services/serviceProductsService';
import { getTranslatedText } from '../../../utils/helpers';
import { POS_API_BASE } from '../../../utils/constants';
import IPhoneMockup from '../../../common/IPhoneMockup';

const extractProductFromPayload = (payload) => {
    if (!payload) return null;

    const candidates = [
        payload?.data?.data,
        payload?.data?.product,
        payload?.product,
        (typeof payload?.data === 'object' && !Array.isArray(payload?.data)) ? payload.data : null,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            continue;
        }

        const hasDomainFields = ['id', 'product_name', 'name', 'sku', 'code'].some((key) => key in candidate);
        if (hasDomainFields) {
            return candidate;
        }
    }

    if (typeof payload === 'object' && !Array.isArray(payload)) {
        const hasDomainFields = ['id', 'product_name', 'name', 'sku', 'code'].some((key) => key in payload);
        const isMetaOnly = Object.keys(payload).length > 0 && Object.keys(payload).every((key) => (
            ['success', 'status', 'message', 'data', 'meta', 'pagination', 'errors', 'error'].includes(key)
        ));

        if (hasDomainFields && !isMetaOnly) {
            return payload;
        }
    }

    return null;
};

const isSuccessfulProductResponse = (payload) => {
    if (!payload) return false;
    if (payload.success === false || payload.status === false || payload.error) return false;
    if (payload.success === true || payload.status === true) return true;
    return !!extractProductFromPayload(payload);
};

const getPayloadMessage = (payload) => {
    if (!payload) return null;
    return payload.message || payload.error || payload?.data?.message || null;
};

const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
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

const normalizeName = (rawName) => {
    if (rawName && typeof rawName === 'object' && !Array.isArray(rawName)) {
        return {
            en: rawName.en || '',
            ar: rawName.ar || '',
        };
    }
    if (typeof rawName === 'string') {
        return { en: rawName, ar: '' };
    }
    return { en: '', ar: '' };
};

const DetailRow = ({ label, children }) => (
    <div className="row mb-5">
        <div className="col-lg-4"><span className="fw-bold text-gray-800">{label}</span></div>
        <div className="col-lg-8"><span className="text-gray-700">{children ?? 'N/A'}</span></div>
    </div>
);

const FormPreviewScreen = ({ form, label }) => {
    const fields = form?.fields || [];
    return (
        <div className="p-4 bg-white" style={{ height: '100%', overflowY: 'auto' }}>
            <div className="mb-4 pb-3 border-bottom">
                <div className="fw-bold fs-5 text-gray-900">{label || 'Live Form Preview'}</div>
                <div className="text-muted fs-7 mt-1">{form?.form_name || form?.title || 'Mobile Services Form'}</div>
            </div>
            {fields.length === 0 ? (
                <div className="text-muted">No fields in this form.</div>
            ) : (
                fields.map((field, idx) => (
                    <div key={field.id || idx} className="mb-4 pb-3 border-bottom border-gray-200">
                        <div className="mb-1"><span className="fw-bold text-gray-800">Label (EN)</span> <span className="text-gray-700">{field.label_en || '—'}</span></div>
                        <div className="mb-1"><span className="fw-bold text-gray-800">Label (AR)</span> <span className="text-gray-700">{field.label_ar || '—'}</span></div>
                        <div className="mb-1"><span className="fw-bold text-gray-800">Key</span> <span className="text-gray-700 font-monospace">{field.key || '—'}</span></div>
                        <div><span className="fw-bold text-gray-800">Type</span> <span className="text-gray-700">{field.type || '—'}</span></div>
                    </div>
                ))
            )}
            <div className="d-flex gap-2 mt-5 pt-2">
                <button type="button" className="btn btn-light w-100" disabled>Cancel</button>
                <button type="button" className="btn btn-primary w-100" disabled>Process</button>
            </div>
        </div>
    );
};

const AdminProductView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    useEffect(() => {
        setTitle('Show Product');
        setActions(
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/products')}>
                <i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i>
                Back to List
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate]);

    const {
        data: productResponse,
        isLoading,
        isFetching,
        error: productError,
    } = useAdminProduct(id);
    const [forms, setForms] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [loadingForms, setLoadingForms] = useState(false);
    const [activeFormIndex, setActiveFormIndex] = useState(0);

    const product = useMemo(() => {
        if (!productResponse || !isSuccessfulProductResponse(productResponse)) return null;
        return extractProductFromPayload(productResponse);
    }, [productResponse]);

    useEffect(() => {
        if (!productResponse) return;
        if (!isSuccessfulProductResponse(productResponse)) {
            const message = getPayloadMessage(productResponse) || 'Failed to load product details';
            toast.error(message);
        }
    }, [productResponse]);

    useEffect(() => {
        if (!productError) return;
        const message = productError?.response?.data?.message || productError.message || 'Failed to load product details';
        toast.error(message);
    }, [productError]);

    useEffect(() => {
        const loadForms = async () => {
            if (!id) return;
            setLoadingForms(true);
            try {
                const response = await fetchProductServiceForms(id);
                if (response?.success) {
                    setForms(response.data || []);
                } else {
                    setForms([]);
                }
            } catch (error) {
                setForms([]);
            } finally {
                setLoadingForms(false);
            }
        };
        loadForms();
    }, [id]);

    if (isLoading) {
        return (
            <div className="row g-5">
                <div className="col-md-9">
                    <div className="card">
                        <div className="card-header"><span className="placeholder col-4"></span></div>
                        <div className="card-body">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div key={idx} className="row mb-7">
                                    <div className="col-lg-4"><span className="placeholder col-8"></span></div>
                                    <div className="col-lg-8"><span className="placeholder col-10"></span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card card-flush">
                        <div className="card-header"><span className="placeholder col-8"></span></div>
                        <div className="card-body text-center">
                            <span className="placeholder d-inline-block" style={{ width: 150, height: 150, borderRadius: 8 }}></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (!product) return <div className="card"><div className="card-body text-center py-10"><div className="text-muted">Product not found</div></div></div>;

    const showRefreshing = isFetching && !isLoading;
    const productName = normalizeName(product.name);
    const nameEn = productName.en || product.name_en || product.product_name || '';
    const nameAr = productName.ar || product.name_ar || '';
    const imageUrl = ensureAbsoluteUrl(POS_API_BASE, product.image_url || product.image);

    return (
        <div className="row g-5">
            <div className="col-md-9">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">Show Product</h3>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setActiveFormIndex(0);
                                setPreviewOpen(true);
                            }}
                            disabled={loadingForms}
                        >
                            <i className="ki-duotone ki-eye fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            Preview
                        </button>
                    </div>
                    <div className="card-body">
                        {showRefreshing && (
                            <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                                <span className="spinner-border spinner-border-sm"></span>
                                <span>Refreshing product details...</span>
                            </div>
                        )}
                        <DetailRow label="Product ID">{product.id}</DetailRow>
                        <DetailRow label="Product Name (English)">{nameEn}</DetailRow>
                        <DetailRow label="Product Name (Arabic)">{nameAr}</DetailRow>
                        {(product.sku || product.code) && <DetailRow label="SKU / Code">{product.sku || product.code}</DetailRow>}
                        {product.barcode && <DetailRow label="Barcode">{product.barcode}</DetailRow>}
                        <DetailRow label="Type ID">{product.type_id}</DetailRow>
                        <DetailRow label="Service Sub Category ID">{product.service_sub_category_id}</DetailRow>
                        <DetailRow label="Service UUID (FK)">{product.service_id}</DetailRow>
                        <DetailRow label="Service record id">{product?.service?.id || '—'}</DetailRow>
                        <DetailRow label="Status">
                            <span className={`badge badge-${product.status ? 'success' : 'danger'}`}>
                                {product.status ? 'Active' : 'Inactive'}
                            </span>
                        </DetailRow>
                        <DetailRow label="Created At">{formatDateTime(product.created_at)}</DetailRow>
                        {product.updated_at && <DetailRow label="Updated At">{formatDateTime(product.updated_at)}</DetailRow>}
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
                        <div className="text-center mb-10">
                            <div className="image-input image-input-outline" style={{ display: 'inline-block' }}>
                                <div
                                    className="image-input-wrapper w-150px h-150px"
                                    style={{
                                        backgroundImage: `url('${imageUrl || '/assets/media/avatars/300-1.jpg'}')`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '8px',
                                        margin: '0 auto',
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div className="text-muted fs-7">Product image preview</div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Additional Information</h3>
                    </div>
                    <div className="card-body">
                        <DetailRow label="Category">{getTranslatedText(product?.category?.name)}</DetailRow>
                        <DetailRow label="Brand">{getTranslatedText(product?.brand?.name)}</DetailRow>
                        <DetailRow label="Unit">{getTranslatedText(product?.unit?.name)}</DetailRow>
                        <DetailRow label="Tax">{product?.tax ? `${getTranslatedText(product.tax.name) || '—'} (${product.tax.rate ?? '0'}%)` : '—'}</DetailRow>
                        {(product.base_price != null || product.sale_price != null) && (
                            <DetailRow label="Prices">
                                {`Base: ${product.base_price ?? '—'} | Sale: ${product.sale_price ?? '—'}`}
                            </DetailRow>
                        )}
                        {product.quantity !== undefined && product.quantity !== null && (
                            <DetailRow label="Stock quantity">{String(product.quantity)}</DetailRow>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h3 className="card-title mb-0">Service forms</h3>
                        {forms.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-sm btn-light-primary"
                                onClick={() => {
                                    setActiveFormIndex(0);
                                    setPreviewOpen(true);
                                }}
                                disabled={loadingForms}
                            >
                                <i className="ki-duotone ki-eye fs-3"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                                Preview in mockup
                            </button>
                        )}
                    </div>
                    <div className="card-body">
                        {loadingForms ? (
                            <div className="text-muted py-4">Loading forms…</div>
                        ) : forms.length === 0 ? (
                            <div className="text-muted">No service forms for this product.</div>
                        ) : (
                            forms.map((form, formIdx) => (
                                <div className="card border mb-5" key={form.id || formIdx}>
                                    <div className="card-header bg-light py-4">
                                        <span className="fw-bold text-gray-800">{form.form_name || `Form ${formIdx + 1}`}</span>
                                        {form.id != null && <span className="text-muted ms-2">(id: {form.id})</span>}
                                    </div>
                                    <div className="card-body">
                                        <DetailRow label="Form name">{form.form_name || '—'}</DetailRow>
                                        <DetailRow label="Form URL">{form.form_url || '—'}</DetailRow>
                                        <div className="fw-bold text-gray-800 mb-3 mt-2">Fields</div>
                                        {(form.fields || []).length === 0 ? (
                                            <div className="text-muted">No fields.</div>
                                        ) : (
                                            (form.fields || []).map((field, fIdx) => (
                                                <div className="card border border-gray-200 mb-4" key={field.id || fIdx}>
                                                    <div className="card-body py-4">
                                                        <div className="mb-2"><span className="fw-bold">Label (English)</span>{' '}<span className="text-gray-700">{field.label_en || '—'}</span></div>
                                                        <div className="mb-2"><span className="fw-bold">Label (Arabic)</span>{' '}<span className="text-gray-700">{field.label_ar || '—'}</span></div>
                                                        <div className="mb-2"><span className="fw-bold">Key</span>{' '}<span className="text-gray-700 font-monospace">{field.key || '—'}</span></div>
                                                        <div className="mb-2"><span className="fw-bold">Type</span>{' '}<span className="text-gray-700">{field.type || '—'}</span></div>
                                                        {field.sort_order != null && (
                                                            <div className="mb-2"><span className="fw-bold">Sort order</span>{' '}<span className="text-gray-700">{String(field.sort_order)}</span></div>
                                                        )}
                                                        {field.is_required !== undefined && (
                                                            <div className="mb-2"><span className="fw-bold">Required</span>{' '}<span className="text-gray-700">{field.is_required ? 'Yes' : 'No'}</span></div>
                                                        )}
                                                        {field.status !== undefined && (
                                                            <div className="mb-2"><span className="fw-bold">Field status</span>{' '}<span className="text-gray-700">{field.status ? 'Active' : 'Inactive'}</span></div>
                                                        )}
                                                        {Array.isArray(field.options) && field.options.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="fw-bold mb-2">Options</div>
                                                                <ul className="mb-0 ps-4">
                                                                    {field.options.map((opt, oIdx) => (
                                                                        <li key={opt.id || oIdx} className="text-gray-700 mb-1">
                                                                            <span className="fw-bold">EN</span> {opt.label_en || '—'} ·{' '}
                                                                            <span className="fw-bold">AR</span> {opt.label_ar || '—'} ·{' '}
                                                                            <span className="fw-bold">Value</span> <span className="font-monospace">{opt.value ?? '—'}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {previewOpen && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '900px' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Forms Preview</h5>
                                <button type="button" className="btn-close" onClick={() => setPreviewOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                {loadingForms ? (
                                    <div className="text-center py-5">Loading forms...</div>
                                ) : forms.length === 0 ? (
                                    <div className="text-muted">No forms available for this product.</div>
                                ) : (
                                    <div className="row g-6">
                                        <div className="col-lg-6">
                                            <div className="d-flex justify-content-center">
                                                <IPhoneMockup screenWidth={320} frameColor="#000000">
                                                    <FormPreviewScreen
                                                        form={forms[activeFormIndex]}
                                                        label={nameEn || nameAr || 'Live Form Preview'}
                                                    />
                                                </IPhoneMockup>
                                            </div>
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="fw-semibold mb-3">Service Forms</div>
                                            <div className="list-group">
                                                {forms.map((form, idx) => (
                                                    <button
                                                        key={form.id || idx}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action ${idx === activeFormIndex ? 'active' : ''}`}
                                                        onClick={() => setActiveFormIndex(idx)}
                                                    >
                                                        {form.form_name || `Form ${idx + 1}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setPreviewOpen(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProductView;

