import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_SERVICE_BASE } from '../../../utils/constants';
import { fetchProductsByService, fetchProductServiceForms } from '../../../services/serviceProductsService';
import ServiceProductModel from '../../../services/ServiceProductModel';
import IPhoneMockup from '../../../common/IPhoneMockup';
import { FIELD_TYPES } from '../../../common/MobileFormsBuilder';
import { resolveBackendAssetUrl } from '../../../utils/assetUrl';

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

const getFieldKey = (field) => (field.key && field.key.trim() ? field.key.trim() : `field_${field.id}`);

const getCatalogFormValuesKey = (form, formIndex) =>
    form?.id != null && String(form.id) !== '' ? String(form.id) : `form_${formIndex}`;

const isRequiredValueMissing = (field, value) => {
    if (field.type === 'Checkbox') {
        return !Array.isArray(value) || value.length === 0;
    }
    return value === undefined || value === null || String(value).trim() === '';
};

const validateCatalogFormFields = (form, values) => {
    const errors = {};
    (form?.fields || []).forEach((field) => {
        if (!field.is_required) return;
        const fieldKey = getFieldKey(field);
        const value = values[fieldKey];
        if (isRequiredValueMissing(field, value)) {
            errors[fieldKey] = true;
        }
    });
    return errors;
};

const getFieldOptions = (field) => {
    if (Array.isArray(field.options) && field.options.length) return field.options;
    if (field.options_json) {
        try {
            const parsed = typeof field.options_json === 'string' ? JSON.parse(field.options_json) : field.options_json;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const resolveServiceName = (service) => {
    if (service?.service_name_en || service?.service_name_ar) {
        return service.service_name_en || service.service_name_ar || service.id || 'N/A';
    }
    if (service?.service_name_text) return service.service_name_text;
    if (service?.service_name && typeof service.service_name === 'object') {
        return service.service_name.en || service.service_name.ar || service.id || 'N/A';
    }
    return service?.service_name || service?.id || 'N/A';
};

const getProductDisplayName = (product) =>
    product.name_en ||
    product.name_ar ||
    (typeof product.name === 'string' ? product.name : '') ||
    product.product_name ||
    'Product';

const phoneShellStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    height: '100%',
    background: 'linear-gradient(180deg, #e8ecf2 0%, #eef1f6 100%)',
};

const headerBarStyle = {
    flexShrink: 0,
    padding: '10px 12px',
    background: '#fff',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 1px 0 rgba(255,255,255,0.8)',
};

const scrollAreaStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '10px 12px 12px',
};

/** App-style grid: 3 tiles per row, square icons like home-screen apps */
const APP_ICON_PX = 48;

const appGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px 8px',
    width: '100%',
};

const appTileStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '8px 4px 10px',
    background: '#fff',
    border: 'none',
    borderRadius: 14,
    boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
    cursor: 'pointer',
    textAlign: 'center',
    minWidth: 0,
};

const appIconBoxStyle = {
    width: APP_ICON_PX,
    height: APP_ICON_PX,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#f5f8fa',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const appTileLabelStyle = {
    marginTop: 6,
    width: '100%',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.25,
    color: '#111827',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
};

const appTileMetaStyle = {
    marginTop: 2,
    fontSize: 9,
    color: '#9ca3af',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
};

const fieldInvalidClass = (hasErr) => (hasErr ? ' is-invalid' : '');

/** Interactive mobile form — same behavior idea as MobileFormsBuilder preview (real controls, no debug JSON). */
function LiveCatalogFormFields({ form, onFieldChange, values, errors = {} }) {
    const fields = form?.fields || [];

    const renderField = (field) => {
        const options = getFieldOptions(field);
        const fieldKey = getFieldKey(field);
        const value = values[fieldKey] ?? (field.type === 'Checkbox' ? [] : '');
        const hasErr = Boolean(errors[fieldKey]);

        const label = field.label_en || field.label_ar || 'Field';

        return (
            <div className="mb-3" key={field.id || fieldKey}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                    {label}
                    {field.is_required ? <span className="text-danger ms-1">*</span> : null}
                </label>

                {field.type === 'Text Field' && (
                    <input
                        type="text"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {field.type === 'Email Field' && (
                    <input
                        type="email"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {field.type === 'Number Field' && (
                    <input
                        type="number"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                    />
                )}
                {field.type === 'Password Field' && (
                    <input
                        type="password"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder="••••••••"
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {field.type === 'Multiline Text Field' && (
                    <textarea
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        rows={3}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                    />
                )}
                {(field.type === 'Dropdown' || field.type === 'Telecom Providers') && (
                    <select
                        className={`form-select form-select-sm${fieldInvalidClass(hasErr)}`}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                    >
                        <option value="">Select</option>
                        {options.map((opt, idx) => (
                            <option value={opt.value != null ? String(opt.value) : `${idx}`} key={`${fieldKey}-opt-${idx}`}>
                                {opt.label_en || opt.label_ar || opt.value || ''}
                            </option>
                        ))}
                    </select>
                )}
                {field.type === 'Radio Buttons' && (
                    <div
                        className={`mt-1 p-2 rounded bg-white border${hasErr ? ' border-danger' : ' border-gray-200'}`}
                    >
                        {options.map((opt, idx) => {
                            const optValue = opt.value != null ? String(opt.value) : `${idx}`;
                            return (
                                <div className="form-check py-1" key={`${fieldKey}-r-${idx}`}>
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id={`cat-${fieldKey}-${idx}`}
                                        name={`cat-radio-${fieldKey}`}
                                        checked={value === optValue}
                                        onChange={() => onFieldChange(fieldKey, optValue)}
                                    />
                                    <label className="form-check-label" htmlFor={`cat-${fieldKey}-${idx}`} style={{ fontSize: 13 }}>
                                        {opt.label_en || opt.label_ar || optValue}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}
                {field.type === 'Checkbox' && (
                    <div
                        className={`mt-1 p-2 rounded bg-white border${hasErr ? ' border-danger' : ' border-gray-200'}`}
                    >
                        {options.map((opt, idx) => {
                            const optValue = opt.value != null ? String(opt.value) : `${idx}`;
                            const selected = Array.isArray(value) ? value : [];
                            const checked = selected.includes(optValue);
                            return (
                                <div className="form-check py-1" key={`${fieldKey}-c-${idx}`}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`cat-chk-${fieldKey}-${idx}`}
                                        checked={checked}
                                        onChange={(e) => {
                                            const next = new Set(selected);
                                            if (e.target.checked) next.add(optValue);
                                            else next.delete(optValue);
                                            onFieldChange(fieldKey, Array.from(next));
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor={`cat-chk-${fieldKey}-${idx}`} style={{ fontSize: 13 }}>
                                        {opt.label_en || opt.label_ar || optValue}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!FIELD_TYPES.includes(field.type) && (
                    <input
                        type="text"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {hasErr ? <div className="invalid-feedback d-block fs-8">This field is required.</div> : null}
            </div>
        );
    };

    return <div>{fields.map((f) => renderField(f))}</div>;
}

/**
 * Full catalog flow inside one phone: services app list → products → live interactive form (no side panel, no debug JSON).
 */
const ServicesCatalogPreviewModal = ({ show, onHide, listQueryParams = {} }) => {
    const [step, setStep] = useState('services');
    const [previewServices, setPreviewServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [forms, setForms] = useState([]);
    const [loadingForms, setLoadingForms] = useState(false);
    const [activeFormIndex, setActiveFormIndex] = useState(0);
    /** Per form id — keeps answers when switching between multiple service forms */
    const [formValuesByFormId, setFormValuesByFormId] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [formSubmitCompleted, setFormSubmitCompleted] = useState(false);

    const resetLocalState = useCallback(() => {
        setStep('services');
        setSelectedService(null);
        setSelectedProduct(null);
        setProducts([]);
        setPreviewServices([]);
        setForms([]);
        setActiveFormIndex(0);
        setFormValuesByFormId({});
        setFieldErrors({});
        setFormSubmitCompleted(false);
    }, []);

    const buildServiceParams = useCallback(() => {
        const params = {
            page: 1,
            per_page: 200,
            search: listQueryParams.search || undefined,
            status: listQueryParams.status || undefined,
            is_active: listQueryParams.is_active !== null && listQueryParams.is_active !== undefined
                ? listQueryParams.is_active
                : undefined,
            country_id: listQueryParams.country_id || undefined,
            merchant_id: listQueryParams.merchant_id || undefined,
            service_type: listQueryParams.service_type || undefined,
            date_from: listQueryParams.date_from || undefined,
            date_to: listQueryParams.date_to || undefined,
        };
        Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);
        return params;
    }, [listQueryParams]);

    const loadServicesForPreview = useCallback(async () => {
        setLoadingServices(true);
        try {
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICES, { params: buildServiceParams() });
            if (response.data.success) {
                setPreviewServices(response.data.data || []);
            } else {
                setPreviewServices([]);
                toast.error(response.data?.message || 'Failed to load services');
            }
        } catch (error) {
            console.error(error);
            setPreviewServices([]);
            toast.error(error.response?.data?.message || 'Failed to load services');
        } finally {
            setLoadingServices(false);
        }
    }, [buildServiceParams]);

    useEffect(() => {
        if (!show) {
            resetLocalState();
        }
    }, [show, resetLocalState]);

    useEffect(() => {
        if (!show) return;
        loadServicesForPreview();
    }, [show, loadServicesForPreview]);

    const activeForm = useMemo(() => forms[activeFormIndex] || null, [forms, activeFormIndex]);

    const currentFormValues = useMemo(() => {
        const fk = getCatalogFormValuesKey(activeForm, activeFormIndex);
        return formValuesByFormId[fk] || {};
    }, [formValuesByFormId, activeForm, activeFormIndex]);

    const handleFieldChange = useCallback(
        (key, val) => {
            const fk = getCatalogFormValuesKey(activeForm, activeFormIndex);
            setFormValuesByFormId((prev) => ({
                ...prev,
                [fk]: { ...(prev[fk] || {}), [key]: val },
            }));
            setFieldErrors((prev) => {
                if (!prev[key]) return prev;
                const next = { ...prev };
                delete next[key];
                return next;
            });
        },
        [activeForm, activeFormIndex]
    );

    const handleFormProcess = useCallback(() => {
        if (!activeForm) return;
        const fk = getCatalogFormValuesKey(activeForm, activeFormIndex);
        const values = formValuesByFormId[fk] || {};
        const errors = validateCatalogFormFields(activeForm, values);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            toast.error('Please fill in all required fields.');
            return;
        }
        setFieldErrors({});

        if (activeFormIndex + 1 < forms.length) {
            setActiveFormIndex((i) => i + 1);
            toast.success('Saved. Continue with the next section.');
            return;
        }

        setFormSubmitCompleted(true);
        toast.success('Form submitted successfully.');
    }, [activeForm, activeFormIndex, forms.length, formValuesByFormId]);

    const handleFormDone = useCallback(() => {
        setFormSubmitCompleted(false);
        setFieldErrors({});
        setFormValuesByFormId({});
        setStep('products');
        setSelectedProduct(null);
        setForms([]);
        setActiveFormIndex(0);
    }, []);

    const handlePickService = async (service) => {
        setSelectedService(service);
        setStep('products');
        setLoadingProducts(true);
        setProducts([]);
        try {
            const response = await fetchProductsByService(service.id, { per_page: 200 });
            if (response.success) {
                const productsData = response.data?.data || response.data || [];
                setProducts(
                    ServiceProductModel.fromApiResponseArray(Array.isArray(productsData) ? productsData : [])
                );
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to load products');
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handlePickProduct = async (product) => {
        setSelectedProduct(product);
        setStep('form');
        setActiveFormIndex(0);
        setFormValuesByFormId({});
        setFieldErrors({});
        setFormSubmitCompleted(false);
        setLoadingForms(true);
        setForms([]);
        try {
            const res = await fetchProductServiceForms(product.id);
            if (res?.success) {
                setForms(res.data || []);
            } else {
                setForms([]);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to load forms');
            setForms([]);
        } finally {
            setLoadingForms(false);
        }
    };

    const handleBack = () => {
        if (step === 'form') {
            setFormSubmitCompleted(false);
            setFieldErrors({});
            setFormValuesByFormId({});
            setStep('products');
            setSelectedProduct(null);
            setForms([]);
            setActiveFormIndex(0);
        } else if (step === 'products') {
            setStep('services');
            setSelectedService(null);
            setProducts([]);
        }
    };

    if (!show) return null;

    const headerTitle =
        step === 'services'
            ? 'Services'
            : step === 'products'
              ? resolveServiceName(selectedService)
              : getProductDisplayName(selectedProduct);

    const formHasFields =
        step === 'form' &&
        !loadingForms &&
        activeForm &&
        Array.isArray(activeForm.fields) &&
        activeForm.fields.length > 0;

    const showFormChrome = formHasFields || formSubmitCompleted;

    const renderPhoneBody = () => {
        if (step === 'services') {
            if (loadingServices) {
                return (
                    <div className="d-flex flex-column align-items-center justify-content-center py-15 px-4" style={{ minHeight: 280 }}>
                        <span className="spinner-border text-primary mb-3" role="status" />
                        <span className="text-muted fs-7">Loading…</span>
                    </div>
                );
            }
            if (previewServices.length === 0) {
                return (
                    <div className="text-center text-muted fs-7 py-15 px-4">
                        No services match your filters.
                    </div>
                );
            }
            return (
                <div style={appGridStyle}>
                    {previewServices.map((service) => (
                        <button
                            type="button"
                            key={service.id}
                            style={appTileStyle}
                            onClick={() => handlePickService(service)}
                        >
                            <div style={appIconBoxStyle}>
                                {resolveBackendAssetUrl(AUTH_SERVICE_BASE, service.image_url || service.image) ? (
                                    <img
                                        src={resolveBackendAssetUrl(AUTH_SERVICE_BASE, service.image_url || service.image)}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="fw-bold text-primary bg-light-primary w-100 h-100 d-flex align-items-center justify-content-center"
                                        style={{ fontSize: 16 }}
                                    >
                                        {resolveServiceName(service).charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div style={appTileLabelStyle}>{resolveServiceName(service)}</div>
                            {/* {service.service_id ? (
                                <div style={appTileMetaStyle} title={service.service_id}>
                                    {service.service_id}
                                </div>
                            ) : null} */}
                        </button>
                    ))}
                </div>
            );
        }

        if (step === 'products') {
            if (loadingProducts) {
                return (
                    <div className="d-flex flex-column align-items-center justify-content-center py-15 px-4" style={{ minHeight: 280 }}>
                        <span className="spinner-border text-primary mb-3" role="status" />
                        <span className="text-muted fs-7">Loading products…</span>
                    </div>
                );
            }
            if (products.length === 0) {
                return <div className="text-center text-muted fs-7 py-15 px-4">No products for this service.</div>;
            }
            return (
                <div style={appGridStyle}>
                    {products.map((product) => {
                        const img = ensureAbsoluteUrl(AUTH_SERVICE_BASE, product.image_url || product.image);
                        return (
                            <button
                                type="button"
                                key={product.id}
                                style={appTileStyle}
                                onClick={() => handlePickProduct(product)}
                            >
                                <div style={appIconBoxStyle}>
                                    {img ? (
                                        <img
                                            src={img}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span
                                            className="fw-bold text-success bg-light-success w-100 h-100 d-flex align-items-center justify-content-center"
                                            style={{ fontSize: 16 }}
                                        >
                                            {getProductDisplayName(product).charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div style={appTileLabelStyle}>{getProductDisplayName(product)}</div>
                                {/* <div style={appTileMetaStyle} title={String(product.id)}>
                                    #{product.id}
                                </div> */}
                            </button>
                        );
                    })}
                </div>
            );
        }

        // form step — loading / empty (scrollable area only; sticky footer added in layout when fields exist)
        if (loadingForms) {
            return (
                <div className="d-flex flex-column align-items-center justify-content-center py-15 px-4" style={{ minHeight: 280 }}>
                    <span className="spinner-border text-primary mb-3" role="status" />
                    <span className="text-muted fs-7">Loading form…</span>
                </div>
            );
        }
        if (!activeForm || (activeForm.fields || []).length === 0) {
            return (
                <div className="text-center text-muted fs-7 py-15 px-4">
                    {forms.length === 0 ? 'No forms for this product.' : 'This form has no fields yet.'}
                </div>
            );
        }

        return null;
    };

    const renderFormScrollContent = () => {
        if (formSubmitCompleted) {
            return (
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center px-3 py-10"
                    style={{ minHeight: 200 }}
                >
                    <div
                        className="d-flex align-items-center justify-content-center mb-3"
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                        }}
                    >
                        <i className="ki-duotone ki-check-circle fs-1">
                            <span className="path1" />
                            <span className="path2" />
                        </i>
                    </div>
                    <div className="fw-bold text-gray-900 mb-1" style={{ fontSize: 16 }}>
                        Submitted
                    </div>
                    <div className="text-muted fs-7 mb-0">Your answers were sent successfully.</div>
                </div>
            );
        }
        if (!formHasFields || !activeForm) return null;
        return (
            <>
                {forms.length > 1 ? (
                    <div
                        className="d-flex gap-2 mb-3 pb-1"
                        style={{ overflowX: 'auto', flexShrink: 0, margin: '0 -4px' }}
                    >
                        {forms.map((f, idx) => (
                            <button
                                key={f.id || idx}
                                type="button"
                                onClick={() => {
                                    setActiveFormIndex(idx);
                                    setFieldErrors({});
                                }}
                                className="btn btn-sm"
                                style={{
                                    borderRadius: 20,
                                    whiteSpace: 'nowrap',
                                    flex: '0 0 auto',
                                    ...(idx === activeFormIndex
                                        ? { background: '#1976d2', color: '#fff', borderColor: '#1976d2' }
                                        : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }),
                                }}
                            >
                                {f.form_name || `Form ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="bg-white rounded-3 p-3 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="text-muted fs-8 mb-2 text-uppercase" style={{ letterSpacing: 0.4 }}>
                        {activeForm.form_name || 'Service form'}
                    </div>
                    <LiveCatalogFormFields
                        form={activeForm}
                        values={currentFormValues}
                        errors={fieldErrors}
                        onFieldChange={handleFieldChange}
                    />
                </div>
            </>
        );
    };

    return (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-bottom-0 pb-0">
                        <h5 className="modal-title">Catalog preview</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close" />
                    </div>
                    <div className="modal-body pt-2 pb-5 d-flex justify-content-center">
                        <IPhoneMockup screenWidth={340} frameColor="#141414">
                            <div style={phoneShellStyle}>
                                <div style={headerBarStyle}>
                                    {step !== 'services' && (
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-sm btn-light"
                                            onClick={handleBack}
                                            aria-label="Back"
                                        >
                                            <i className="ki-duotone ki-arrow-left fs-2">
                                                <span className="path1" />
                                                <span className="path2" />
                                            </i>
                                        </button>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 15,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {headerTitle}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>
                                            {step === 'services' && 'Choose a service'}
                                            {step === 'products' && 'Choose a product'}
                                            {step === 'form' && (formSubmitCompleted ? 'Submitted' : 'Fill & submit')}
                                        </div>
                                    </div>
                                </div>
                                {showFormChrome ? (
                                    formSubmitCompleted ? (
                                        <>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minHeight: 0,
                                                    overflowY: 'auto',
                                                    WebkitOverflowScrolling: 'touch',
                                                    padding: '10px 12px 0',
                                                }}
                                            >
                                                {renderFormScrollContent()}
                                            </div>
                                            <div
                                                style={{
                                                    flexShrink: 0,
                                                    padding: '12px',
                                                    background: '#fff',
                                                    borderTop: '1px solid #e5e7eb',
                                                    boxShadow: '0 -4px 12px rgba(15,23,42,0.06)',
                                                }}
                                            >
                                                <button type="button" className="btn btn-primary btn-sm w-100" onClick={handleFormDone}>
                                                    Done
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <form
                                            className="d-flex flex-column flex-grow-1"
                                            style={{ flex: 1, minHeight: 0 }}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleFormProcess();
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minHeight: 0,
                                                    overflowY: 'auto',
                                                    WebkitOverflowScrolling: 'touch',
                                                    padding: '10px 12px 0',
                                                }}
                                            >
                                                {renderFormScrollContent()}
                                            </div>
                                            <div
                                                className="d-flex gap-2"
                                                style={{
                                                    flexShrink: 0,
                                                    padding: '12px',
                                                    background: '#fff',
                                                    borderTop: '1px solid #e5e7eb',
                                                    boxShadow: '0 -4px 12px rgba(15,23,42,0.06)',
                                                }}
                                            >
                                                <button type="button" className="btn btn-light btn-sm flex-grow-1" onClick={handleBack}>
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary btn-sm flex-grow-1">
                                                    Process
                                                </button>
                                            </div>
                                        </form>
                                    )
                                ) : (
                                    <div style={scrollAreaStyle}>{renderPhoneBody()}</div>
                                )}
                            </div>
                        </IPhoneMockup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServicesCatalogPreviewModal;
