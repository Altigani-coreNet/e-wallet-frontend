import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_SERVICE_BASE } from '../../../utils/constants';
import IPhoneMockup from '../../../common/IPhoneMockup';
import { FIELD_TYPES } from '../../../common/MobileFormsBuilder';
import { resolveBackendAssetUrl } from '../../../utils/assetUrl';
import ServiceModel from '../../../services/ServiceModel';

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

const normalizeFieldType = (field) =>
    (field?.form_type || field?.type || '').toString().trim().toLowerCase();

const getFormFields = (form) => {
    if (Array.isArray(form?.fields)) return form.fields;
    if (Array.isArray(form?.product_form_fields)) return form.product_form_fields;
    return [];
};

const getProductForms = (product) => {
    if (Array.isArray(product?.product_forms)) return product.product_forms;
    if (Array.isArray(product?.serviceForms)) return product.serviceForms;
    if (Array.isArray(product?.forms)) return product.forms;
    return [];
};

const getFormActions = (form) => (Array.isArray(form?.actions) ? form.actions : []);

const hasTapToPayAction = (form) =>
    getFormActions(form).some((action) => {
        const type = String(action?.action_type || '').trim().toLowerCase();
        return type === 'tap_to_pay' || type === 'tab_to_pay';
    });

const getActionByName = (form, actionName) =>
    getFormActions(form).find(
        (action) => String(action?.action_name || '').trim().toLowerCase() === String(actionName || '').trim().toLowerCase()
    );

const getPrimaryAction = (form) => {
    const actions = getFormActions(form);
    return (
        actions.find((action) => String(action?.action_type || '').trim().toLowerCase() !== 'button') ||
        actions.find((action) => String(action?.action_name || '').trim().toLowerCase() !== 'cancel') ||
        null
    );
};

const isRequiredValueMissing = (field, value) => {
    if (normalizeFieldType(field) === 'checkbox') {
        return !Array.isArray(value) || value.length === 0;
    }
    return value === undefined || value === null || String(value).trim() === '';
};

const validateCatalogFormFields = (form, values) => {
    const errors = {};
    getFormFields(form).forEach((field) => {
        if (!field.is_required) return;
        const fieldKey = getFieldKey(field);
        const value = values[fieldKey];
        if (isRequiredValueMissing(field, value)) {
            errors[fieldKey] = true;
        }
    });
    return errors;
};

const isEmptyValue = (value) => value === undefined || value === null || String(value).trim() === '';

const validateByRules = (value, rules = {}, messages = {}) => {
    const required = Boolean(rules?.required);
    if (required && isEmptyValue(value)) {
        return messages?.required || 'This field is required.';
    }
    if (isEmptyValue(value)) return null;

    const stringValue = String(value);
    const numericValue = Number(value);
    const hasNumber = Number.isFinite(numericValue);

    if (rules?.numeric && !hasNumber) {
        return messages?.numeric || 'Please enter a valid number.';
    }
    if (rules?.min !== undefined && rules?.min !== null) {
        const min = Number(rules.min);
        if (Number.isFinite(min)) {
            if (rules?.numeric) {
                if (!hasNumber || numericValue < min) return messages?.min || `Value should be at least ${min}.`;
            } else if (stringValue.length < min) {
                return messages?.min || `Value should be at least ${min} characters.`;
            }
        }
    }
    if (rules?.max !== undefined && rules?.max !== null) {
        const max = Number(rules.max);
        if (Number.isFinite(max)) {
            if (rules?.numeric) {
                if (!hasNumber || numericValue > max) return messages?.max || `Value should be at most ${max}.`;
            } else if (stringValue.length > max) {
                return messages?.max || `Value should be at most ${max} characters.`;
            }
        }
    }
    if (rules?.max_length !== undefined && rules?.max_length !== null) {
        const maxLength = Number(rules.max_length);
        if (Number.isFinite(maxLength) && stringValue.length > maxLength) {
            return messages?.max_length || `Value should be at most ${maxLength} characters.`;
        }
    }
    if (rules?.regex) {
        try {
            const pattern = new RegExp(String(rules.regex));
            if (!pattern.test(stringValue)) {
                return messages?.regex || 'Invalid format.';
            }
        } catch {
            // Ignore invalid backend pattern.
        }
    }

    return null;
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

const getProductDisplayName = (product) =>
    product.name_en ||
    product.name_ar ||
    (typeof product.name === 'string' ? product.name : '') ||
    product.product_name ||
    'Product';

const getFormDisplayName = (form) => {
    if (!form) return '';
    if (form.form_name && typeof form.form_name === 'object') {
        return form.form_name.en || form.form_name.ar || '';
    }
    return typeof form.form_name === 'string' ? form.form_name : '';
};

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
const prettifyFieldName = (name = '') =>
    String(name)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

/** Interactive mobile form — same behavior idea as MobileFormsBuilder preview (real controls, no debug JSON). */
function LiveCatalogFormFields({ form, onFieldChange, values, errors = {} }) {
    const fields = getFormFields(form);

    const renderField = (field) => {
        const options = getFieldOptions(field);
        const fieldKey = getFieldKey(field);
        const fieldType = normalizeFieldType(field);
        const value = values[fieldKey] ?? (fieldType === 'checkbox' ? [] : '');
        const hasErr = Boolean(errors[fieldKey]);
        const errorText = typeof errors[fieldKey] === 'string' ? errors[fieldKey] : 'This field is required.';

        const label = field.label || field.label_en || field.label_ar || 'Field';

        return (
            <div className="mb-3" key={field.id || fieldKey}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                    {label}
                    {field.is_required ? <span className="text-danger ms-1">*</span> : null}
                </label>

                {(fieldType === 'text field' || fieldType === 'text_field' || fieldType === 'text') && (
                    <input
                        type="text"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {(fieldType === 'email field' || fieldType === 'email') && (
                    <input
                        type="email"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {(fieldType === 'number field' || fieldType === 'number' || fieldType === 'amount_picker') && (
                    <input
                        type="number"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                    />
                )}
                {(fieldType === 'password field' || fieldType === 'password') && (
                    <input
                        type="password"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder="••••••••"
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {(fieldType === 'multiline text field' || fieldType === 'text_area' || fieldType === 'textarea') && (
                    <textarea
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        rows={3}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                    />
                )}
                {(fieldType === 'dropdown' || fieldType === 'telecom providers' || fieldType === 'selection') && (
                    <select
                        className={`form-select form-select-sm${fieldInvalidClass(hasErr)}`}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                    >
                        <option value="">Select</option>
                        {options.map((opt, idx) => (
                            <option value={opt.value != null ? String(opt.value) : `${idx}`} key={`${fieldKey}-opt-${idx}`}>
                                {opt.label || opt.label_en || opt.label_ar || opt.value || ''}
                            </option>
                        ))}
                    </select>
                )}
                {(fieldType === 'radio buttons' || fieldType === 'radio') && (
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
                                        {opt.label || opt.label_en || opt.label_ar || optValue}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}
                {fieldType === 'checkbox' && (
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
                                        {opt.label || opt.label_en || opt.label_ar || optValue}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!FIELD_TYPES.includes(field.type) &&
                    !['text field', 'text_field', 'text', 'email field', 'email', 'number field', 'number', 'amount_picker', 'password field', 'password', 'multiline text field', 'text_area', 'textarea', 'dropdown', 'telecom providers', 'selection', 'radio buttons', 'radio', 'checkbox'].includes(fieldType) && (
                    <input
                        type="text"
                        className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                        placeholder={label}
                        value={value}
                        onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                        autoComplete="off"
                    />
                )}
                {hasErr ? <div className="invalid-feedback d-block fs-8">{errorText}</div> : null}
            </div>
        );
    };

    return <div>{fields.map((f) => renderField(f))}</div>;
}

function LiveRoleFields({ roleMap = {}, onFieldChange, values, errors = {} }) {
    const roleEntries = Object.entries(roleMap);
    if (!roleEntries.length) return null;

    return (
        <div>
            {roleEntries.map(([fieldName, roleConfig]) => {
                const rules = roleConfig?.rules || {};
                const label = prettifyFieldName(fieldName);
                const value = values[fieldName] ?? '';
                const hasErr = Boolean(errors[fieldName]);
                const errorText = typeof errors[fieldName] === 'string' ? errors[fieldName] : 'Invalid value.';
                const isNumeric = Boolean(rules?.numeric);
                return (
                    <div className="mb-3" key={fieldName}>
                        <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                            {label}
                            {rules?.required ? <span className="text-danger ms-1">*</span> : null}
                        </label>
                        <input
                            type={isNumeric ? 'number' : 'text'}
                            className={`form-control form-control-sm${fieldInvalidClass(hasErr)}`}
                            placeholder={label}
                            value={value}
                            onChange={(e) => onFieldChange(fieldName, e.target.value)}
                            min={rules?.min ?? undefined}
                            max={rules?.max ?? undefined}
                            autoComplete="off"
                        />
                        {hasErr ? <div className="invalid-feedback d-block fs-8">{errorText}</div> : null}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Full catalog flow inside one phone: services app list → products → live interactive form (no side panel, no debug JSON).
 */
const ServicesCatalogPreviewModal = ({ show, onHide, listQueryParams = {} }) => {
    const { t } = useTranslation();
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
    const [dynamicFormStateByKey, setDynamicFormStateByKey] = useState({});
    const [processingForm, setProcessingForm] = useState(false);

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
        setDynamicFormStateByKey({});
        setProcessingForm(false);
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
            partner_id: listQueryParams.partner_id || undefined,
            category_id: listQueryParams.category_id || undefined,
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
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICES_CATALOG, { params: buildServiceParams() });
            if (response.data?.success || response.data?.status) {
                const catalogServices = response.data?.data?.services || response.data?.services || [];
                setPreviewServices(Array.isArray(catalogServices) ? catalogServices : []);
            } else {
                setPreviewServices([]);
                toast.error(response.data?.message || t('admin.paymentGetway.svcShowFailedLoad'));
            }
        } catch (error) {
            console.error(error);
            setPreviewServices([]);
            toast.error(error.response?.data?.message || t('admin.paymentGetway.svcShowFailedLoad'));
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

    const activeFormKey = useMemo(
        () => getCatalogFormValuesKey(activeForm, activeFormIndex),
        [activeForm, activeFormIndex]
    );

    const activeDynamicFormState = dynamicFormStateByKey[activeFormKey] || {};
    const cancelAction = useMemo(() => getActionByName(activeForm, 'cancel'), [activeForm]);
    const primaryAction = useMemo(() => getPrimaryAction(activeForm), [activeForm]);

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

    const handleTapToPayAction = useCallback(() => {
        // Placeholder hook for future tap-to-pay logic.
        setFormSubmitCompleted(true);
    }, []);

    const handleFormProcess = useCallback(async () => {
        if (!activeForm || processingForm) return;
        if (hasTapToPayAction(activeForm)) {
            handleTapToPayAction();
            return;
        }
        const fk = getCatalogFormValuesKey(activeForm, activeFormIndex);
        const values = formValuesByFormId[fk] || {};
        const errors = validateCatalogFormFields(activeForm, values);
        const roleMap = dynamicFormStateByKey[fk]?.fieldRoles || {};
        Object.entries(roleMap).forEach(([fieldName, roleConfig]) => {
            const backendError = validateByRules(values[fieldName], roleConfig?.rules, roleConfig?.messages);
            if (backendError) {
                errors[fieldName] = backendError;
            }
        });
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            toast.error(t('admin.paymentGetway.svcWizardPleaseFillRequired'));
            return;
        }
        setFieldErrors({});
        const formUrl = activeForm?.form_url?.trim();
        if (!formUrl) {
            const nextIndex = activeFormIndex + 1;
            const nextForm = nextIndex < forms.length ? forms[nextIndex] : null;
            const nextHasUrl = Boolean(nextForm?.form_url?.trim());
            if (nextForm && nextHasUrl) {
                setActiveFormIndex(nextIndex);
                toast.success(t('admin.paymentGetway.catalogSavedContinue'));
                return;
            }
            setFormSubmitCompleted(true);
            toast.success(t('admin.paymentGetway.cpImportFormSubmittedSuccess'));
            return;
        }

        setProcessingForm(true);
        setDynamicFormStateByKey((prev) => ({
            ...prev,
            [fk]: {
                ...(prev[fk] || {}),
                loading: true,
                fetchError: '',
            },
        }));
        try {
            const response = await axios.post(formUrl, values);
            const payload = response?.data || {};
            const data = payload?.data || {};
            const filedRoles = Array.isArray(data?.filed_roles) ? data.filed_roles : [];
            const nextRoleMap = filedRoles.reduce((acc, role) => {
                const fieldName = role?.field_name ? String(role.field_name).trim() : '';
                if (!fieldName) return acc;
                acc[fieldName] = {
                    rules: role?.rules || {},
                    messages: role?.messages || {},
                };
                return acc;
            }, {});

            setDynamicFormStateByKey((prev) => ({
                ...prev,
                [fk]: {
                    loading: false,
                    fetchError: '',
                    screenId: payload?.screen_id || '',
                    widgets: Array.isArray(data?.widgets) ? data.widgets : [],
                    fieldRoles: nextRoleMap,
                    responsePayload: payload,
                },
            }));

            // Backend-driven flow: same form submits and next screen widgets/roles are rendered.
            if (!filedRoles.length && (!Array.isArray(data?.widgets) || data.widgets.length === 0)) {
                setFormSubmitCompleted(true);
            }
        } catch (error) {
            setDynamicFormStateByKey((prev) => ({
                ...prev,
                [fk]: {
                    ...(prev[fk] || {}),
                    loading: false,
                    fetchError: error.response?.data?.message || t('admin.paymentGetway.catalogFailedProcessForm'),
                },
            }));
            toast.error(error.response?.data?.message || t('admin.paymentGetway.catalogFailedProcessForm'));
        } finally {
            setProcessingForm(false);
        }
    }, [activeForm, activeFormIndex, forms, formValuesByFormId, dynamicFormStateByKey, processingForm, handleTapToPayAction]);

    const handleFormDone = useCallback(() => {
        setFormSubmitCompleted(false);
        setFieldErrors({});
        setFormValuesByFormId({});
        setProcessingForm(false);
        setStep('products');
        setSelectedProduct(null);
        setForms([]);
        setActiveFormIndex(0);
    }, []);

    const handlePickService = (service) => {
        setSelectedService(service);
        setStep('products');
        setLoadingProducts(false);
        setProducts(Array.isArray(service?.products) ? service.products : []);
    };

    const handlePickProduct = (product) => {
        setSelectedProduct(product);
        setStep('form');
        setActiveFormIndex(0);
        setFormValuesByFormId({});
        setFieldErrors({});
        setFormSubmitCompleted(false);
        setDynamicFormStateByKey({});
        setProcessingForm(false);
        setLoadingForms(false);
        setForms(getProductForms(product));
    };

    const handleBack = () => {
        if (step === 'form') {
            setFormSubmitCompleted(false);
            setFieldErrors({});
            setFormValuesByFormId({});
            setDynamicFormStateByKey({});
            setProcessingForm(false);
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
            ? t('admin.paymentGetway.svcWizardServices')
            : step === 'products'
              ? ServiceModel.displayName(selectedService)
              : getProductDisplayName(selectedProduct);

    const formHasCatalogFields =
        step === 'form' &&
        !loadingForms &&
        activeForm &&
        getFormFields(activeForm).length > 0;

    const formHasDynamicRoleFields =
        step === 'form' &&
        !loadingForms &&
        activeForm &&
        Object.keys(activeDynamicFormState?.fieldRoles || {}).length > 0;

    const hasDynamicWidgets = Array.isArray(activeDynamicFormState?.widgets) && activeDynamicFormState.widgets.length > 0;
    const useDynamicScreen = Boolean(activeDynamicFormState?.screenId) || formHasDynamicRoleFields || hasDynamicWidgets;

    const showFormChrome = formHasCatalogFields || formHasDynamicRoleFields || formSubmitCompleted;

    const renderPhoneBody = () => {
        if (step === 'services') {
            if (loadingServices) {
                return (
                    <div className="d-flex flex-column align-items-center justify-content-center py-15 px-4" style={{ minHeight: 280 }}>
                        <span className="spinner-border text-primary mb-3" role="status" />
                        <span className="text-muted fs-7">{t('admin.paymentGetway.cpLoading')}</span>
                    </div>
                );
            }
            if (previewServices.length === 0) {
                return (
                    <div className="text-center text-muted fs-7 py-15 px-4">
                        {t('admin.paymentGetway.catalogNoServicesMatchFilters')}
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
                                        {(ServiceModel.displayName(service) || '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div style={appTileLabelStyle}>{ServiceModel.displayName(service)}</div>
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
                        <span className="text-muted fs-7">{t('admin.paymentGetway.catalogLoadingProducts')}</span>
                    </div>
                );
            }
            if (products.length === 0) {
                return <div className="text-center text-muted fs-7 py-15 px-4">{t('admin.paymentGetway.catalogNoProductsForService')}</div>;
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
                    <span className="text-muted fs-7">{t('admin.paymentGetway.catalogLoadingForm')}</span>
                </div>
            );
        }
        if (!activeForm || (!getFormFields(activeForm).length && !Object.keys(activeDynamicFormState?.fieldRoles || {}).length)) {
            return (
                <div className="text-center text-muted fs-7 py-15 px-4">
                    {forms.length === 0 ? t('admin.paymentGetway.catalogNoFormsForProduct') : t('admin.paymentGetway.catalogFormNoFieldsYet')}
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
                        {t('admin.paymentGetway.cpImportSubmitted')}
                    </div>
                    <div className="text-muted fs-7 mb-0">{t('admin.paymentGetway.catalogAnswersSentSuccessfully')}</div>
                </div>
            );
        }
        if ((!formHasCatalogFields && !formHasDynamicRoleFields) || !activeForm) return null;
        return (
            <>
                {activeDynamicFormState?.loading ? (
                    <div className="alert alert-info py-2 mb-3">{t('admin.paymentGetway.catalogLoadingFormConfiguration')}</div>
                ) : null}
                {activeDynamicFormState?.fetchError ? (
                    <div className="alert alert-warning py-2 mb-3">{activeDynamicFormState.fetchError}</div>
                ) : null}
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
                                {getFormDisplayName(f) || t('admin.paymentGetway.catalogFormWithIndex', { index: idx + 1 })}
                            </button>
                        ))}
                    </div>
                ) : null}
                {Array.isArray(activeDynamicFormState?.widgets) &&
                    activeDynamicFormState.widgets.map((widget, idx) => {
                        if (widget?.type === 'billing_header_card') {
                            const content = widget?.content || {};
                            return (
                                <div key={`w-${idx}`} className="rounded-3 p-3 mb-3" style={{ background: '#0d6efd', color: '#fff' }}>
                                    <div className="small opacity-75">{content?.title || ''}</div>
                                    <div className="fw-bold fs-3">{content?.value || ''}</div>
                                    <div className="small">
                                        {[content?.currency, content?.subtitle].filter(Boolean).join(' - ')}
                                    </div>
                                    {content?.status_tag ? <div className="badge bg-light text-dark mt-2">{content.status_tag}</div> : null}
                                </div>
                            );
                        }
                        if (widget?.type === 'card_table') {
                            const content = widget?.content || {};
                            const rows = Array.isArray(content?.rows) ? content.rows : [];
                            return (
                                <div
                                    key={`w-${idx}`}
                                    className="bg-white rounded-3 p-3 mb-3 shadow-sm"
                                    style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                                >
                                    {content?.title ? (
                                        <div className="fw-semibold text-gray-900 mb-2" style={{ fontSize: 13 }}>
                                            {content.title}
                                        </div>
                                    ) : null}
                                    {rows.length > 0 ? (
                                        <div className="d-flex flex-column gap-2">
                                            {rows.map((row, rowIdx) => (
                                                <div
                                                    key={`w-${idx}-r-${rowIdx}`}
                                                    className="d-flex align-items-start justify-content-between gap-3"
                                                    style={{ fontSize: 12, lineHeight: 1.35 }}
                                                >
                                                    <div className="text-muted" style={{ minWidth: 90 }}>
                                                        {row?.field || '-'}
                                                    </div>
                                                    <div className="text-end text-gray-900 fw-medium" style={{ wordBreak: 'break-word' }}>
                                                        {[row?.value, row?.currency].filter(Boolean).join(' ')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-muted" style={{ fontSize: 12 }}>
                                            {t('admin.paymentGetway.catalogNoDetailsAvailable')}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        if (widget?.type === 'info_banner') {
                            return (
                                <div key={`w-${idx}`} className="alert alert-warning py-2 mb-3">
                                    {widget?.content?.text || ''}
                                </div>
                            );
                        }
                        return null;
                    })}

                <div className="bg-white rounded-3 p-3 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="text-muted fs-8 mb-2 text-uppercase" style={{ letterSpacing: 0.4 }}>
                        {activeDynamicFormState?.screenId || getFormDisplayName(activeForm) || t('admin.paymentGetway.catalogServiceForm')}
                    </div>
                    {formHasCatalogFields && !useDynamicScreen ? (
                        <LiveCatalogFormFields
                            form={activeForm}
                            values={currentFormValues}
                            errors={fieldErrors}
                            onFieldChange={handleFieldChange}
                        />
                    ) : null}
                    {formHasDynamicRoleFields ? (
                        <LiveRoleFields
                            roleMap={activeDynamicFormState?.fieldRoles || {}}
                            values={currentFormValues}
                            errors={fieldErrors}
                            onFieldChange={handleFieldChange}
                        />
                    ) : null}
                </div>
            </>
        );
    };

    return (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-bottom-0 pb-0">
                        <h5 className="modal-title">{t('admin.paymentGetway.catalogPreviewTitle')}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label={t('admin.common.close')} />
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
                                            aria-label={t('admin.common.back')}
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
                                            {step === 'services' && t('admin.paymentGetway.catalogChooseService')}
                                            {step === 'products' && t('admin.paymentGetway.catalogChooseProduct')}
                                            {step === 'form' && (formSubmitCompleted ? t('admin.paymentGetway.cpImportSubmitted') : t('admin.paymentGetway.catalogFillSubmit'))}
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
                                                    {t('admin.common.done')}
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
                                                <button type="button" className="btn btn-light btn-sm flex-grow-1" onClick={handleBack} disabled={processingForm}>
                                                    {cancelAction?.action_label || t('admin.common.cancel')}
                                                </button>
                                                <button type="submit" className="btn btn-primary btn-sm flex-grow-1" disabled={processingForm}>
                                                    {processingForm ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                                            {t('admin.paymentGetway.processing')}
                                                        </>
                                                    ) : (
                                                        primaryAction?.action_label || t('admin.common.process')
                                                    )}
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
