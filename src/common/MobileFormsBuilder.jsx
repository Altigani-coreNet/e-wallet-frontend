import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import IPhoneMockup from './IPhoneMockup';

const FB = 'admin.paymentGetway.formsBuilder';

const FIELD_TYPE_I18N_KEYS = {
    'Text Field': 'fieldTypeTextField',
    'Email Field': 'fieldTypeEmailField',
    'Number Field': 'fieldTypeNumberField',
    'Date Field': 'fieldTypeDateField',
    'Password Field': 'fieldTypePasswordField',
    'Radio Buttons': 'fieldTypeRadioButtons',
    Checkbox: 'fieldTypeCheckbox',
    Dropdown: 'fieldTypeDropdown',
    'Multiline Text Field': 'fieldTypeMultilineTextField',
};

const translateFieldType = (type, t) => {
    const key = FIELD_TYPE_I18N_KEYS[type];
    return key ? t(`${FB}.${key}`) : type;
};

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const getOptionIdentity = (option, index) => (option?.id ? `${option.id}` : `idx_${index}`);

export const FIELD_TYPES = [
    'Text Field',
    'Email Field',
    'Number Field',
    'Date Field',
    'Password Field',
    'Radio Buttons',
    'Checkbox',
    'Dropdown',
    'Multiline Text Field',
];

export const TYPES_WITH_OPTIONS = new Set(['Radio Buttons', 'Checkbox', 'Dropdown']);

const normalizeOptionValue = (value) => `${value ?? ''}`.trim().toLowerCase();

        const collectDuplicateOptionIds = (options = []) => {
    const duplicateIds = new Set();
    const seenValues = new Map();
    const seenLabels = new Map();

    options.forEach((opt, index) => {
        const optionId = opt?.id ? `${opt.id}` : `idx_${index}`;

        const valueKey = normalizeOptionValue(opt?.value);
        const labelKey = normalizeOptionValue(opt?.label_en);

        if (valueKey) {
            if (seenValues.has(valueKey)) {
                duplicateIds.add(optionId);
                duplicateIds.add(seenValues.get(valueKey));
            } else {
                seenValues.set(valueKey, optionId);
            }
        }

        if (labelKey) {
            if (seenLabels.has(labelKey)) {
                duplicateIds.add(optionId);
                duplicateIds.add(seenLabels.get(labelKey));
            } else {
                seenLabels.set(labelKey, optionId);
            }
        }
    });

    return duplicateIds;
};

const getFieldKey = (field) => (field.key && field.key.trim() ? field.key.trim() : `field_${field.id}`);
const getNormalizedFieldType = (type) => `${type || ''}`.trim().toLowerCase();
const isNumberFieldType = (type) => getNormalizedFieldType(type) === 'number field';
const isDateFieldType = (type) => getNormalizedFieldType(type) === 'date field';
const isTextCustomizationType = (type) => {
    const normalized = getNormalizedFieldType(type);
    return ['text field', 'email field', 'password field', 'multiline text field'].includes(normalized);
};
const getFieldCustomization = (field) =>
    field?.customization && typeof field.customization === 'object' ? field.customization : {};
const getFormTitle = (form, defaultTitle = '') =>
    form?.form_name?.en?.trim() || form?.title?.trim() || defaultTitle;

const previewScreenShellStyle = {
    flex: 1,
    minHeight: 0,
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
};

const ServiceFormPreview = ({ formData, label, subLabel }) => {
    const { t } = useTranslation();
    return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div
            className="d-flex align-items-center px-4 py-3 mb-4"
            style={{
                flexShrink: 0,
                background: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            }}
        >
            <div className="d-flex align-items-center gap-3">
                <i className="ki-duotone ki-arrow-left fs-3 text-dark">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <div>
                    <h3 className="mb-0 fs-5 fw-bold text-dark">{label || t(`${FB}.liveFormPreview`)}</h3>
                    {subLabel ? <div className="text-muted fs-8">{subLabel}</div> : null}
                </div>
            </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {formData.length > 0 ? (
                formData.map((field) => {
                    let options = [];
                    if (field.options_json) {
                        try {
                            options = JSON.parse(field.options_json);
                        } catch (error) {
                            options = [];
                        }
                    }

                    return (
                        <div className="form-group mb-4" key={field.id}>
                            <label className="form-label fw-bold">{field.label_en || t(`${FB}.defaultFieldLabel`)}</label>

                            {field.type === 'Text Field' && (
                                <input type="text" className="form-control" placeholder={field.label_en || ''} />
                            )}
                            {field.type === 'Email Field' && (
                                <input type="email" className="form-control" placeholder={field.label_en || ''} />
                            )}
                            {field.type === 'Number Field' && (
                                <input type="number" className="form-control" placeholder={field.label_en || ''} />
                            )}
                            {field.type === 'Date Field' && (
                                <input type="date" className="form-control" placeholder={field.label_en || ''} />
                            )}
                            {field.type === 'Password Field' && (
                                <input type="password" className="form-control" placeholder={field.label_en || ''} />
                            )}
                            {field.type === 'Radio Buttons' && (
                                <div className="mt-2">
                                    {options.map((opt, idx) => (
                                        <div className="form-check" key={`${opt.value || 'radio'}-${idx}`}>
                                            <input className="form-check-input" type="radio" id={`radio-${field.id}-${idx}`} name={`radio-${field.id}`} />
                                            <label className="form-check-label" htmlFor={`radio-${field.id}-${idx}`}>
                                                {opt.label_en || ''}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {field.type === 'Checkbox' && (
                                <div className="mt-2">
                                    {options.map((opt, idx) => (
                                        <div className="form-check" key={`${opt.value || 'checkbox'}-${idx}`}>
                                            <input className="form-check-input" type="checkbox" id={`checkbox-${field.id}-${idx}`} />
                                            <label className="form-check-label" htmlFor={`checkbox-${field.id}-${idx}`}>
                                                {opt.label_en || ''}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {field.type === 'Dropdown' && (
                                <select className="form-select">
                                    {options.map((opt, idx) => (
                                        <option value={opt.value || idx} key={`${opt.value || 'drop'}-${idx}`}>
                                            {opt.label_en || ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {field.type === 'Multiline Text Field' && (
                                <textarea className="form-control" rows="3" placeholder={field.label_en || ''}></textarea>
                            )}
                            {!FIELD_TYPES.includes(field.type) && (
                                <input type="text" className="form-control" placeholder={field.label_en || ''} />
                            )}
                        </div>
                    );
                })
            ) : (
                <p className="text-muted">{t(`${FB}.noFieldsPreview`)}</p>
            )}
        </div>

        <div
            style={{
                flexShrink: 0,
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                padding: '12px 16px',
                marginTop: 'auto',
            }}
        >
            <div className="d-flex gap-3">
                <button
                    type="button"
                    className="btn btn-light w-100"
                    style={{
                        borderRadius: '0px',
                        height: '44px',
                        fontWeight: 600,
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                    }}
                >
                    {t(`${FB}.cancel`)}
                </button>
                <button
                    type="button"
                    className="btn w-100"
                    style={{
                        borderRadius: '0px',
                        height: '44px',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: '#1976d2',
                        boxShadow: '0 6px 14px rgba(25, 118, 210, 0.25)',
                    }}
                >
                    {t(`${FB}.process`)}
                </button>
            </div>
        </div>
    </div>
    );
};

const InteractiveServiceFormPreview = ({ label, subLabel, formId, fields, values, errors, onChange, onCancel, onProcess, completed }) => {
    const { t } = useTranslation();
    const previewFields = (fields || []).map((field) => ({
        ...field,
        options_json: JSON.stringify(field.options || []),
    }));

    if (completed) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div
                    className="d-flex align-items-center px-4 py-3 mb-4"
                    style={{
                        flexShrink: 0,
                        background: '#ffffff',
                        borderBottom: '1px solid #e5e7eb',
                        borderRadius: '16px 16px 0 0',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                    }}
                >
                    <div className="d-flex align-items-center gap-3">
                        <i className="ki-duotone ki-arrow-left fs-3 text-dark">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <div>
                            <h3 className="mb-0 fs-5 fw-bold text-dark">{label || t(`${FB}.liveFormPreview`)}</h3>
                            {subLabel ? <div className="text-muted fs-8">{subLabel}</div> : null}
                        </div>
                    </div>
                </div>

                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center"
                    style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}
                >
                    <div
                        className="d-flex align-items-center justify-content-center mb-4"
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 999,
                            background: '#e8f5e9',
                            color: '#2e7d32',
                        }}
                    >
                        <i className="ki-duotone ki-check-circle fs-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </div>
                    <h4 className="fw-bold mb-2">{t(`${FB}.success`)}</h4>
                    <div className="text-muted mb-0">{t(`${FB}.successMessage`)}</div>
                </div>
                <div
                    style={{
                        flexShrink: 0,
                        background: '#ffffff',
                        borderTop: '1px solid #e5e7eb',
                        padding: '12px 16px',
                        marginTop: 'auto',
                    }}
                >
                    <button
                        type="button"
                        className="btn w-100"
                        style={{
                            borderRadius: '0px',
                            height: '44px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: '#1976d2',
                            boxShadow: '0 6px 14px rgba(25, 118, 210, 0.25)',
                        }}
                        onClick={onCancel}
                    >
                        {t(`${FB}.close`)}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div
                className="d-flex align-items-center px-4 py-3 mb-4"
                style={{
                    flexShrink: 0,
                    background: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                    borderRadius: '16px 16px 0 0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                }}
            >
                <div className="d-flex align-items-center gap-3">
                    <i className="ki-duotone ki-arrow-left fs-3 text-dark">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <div>
                        <h3 className="mb-0 fs-5 fw-bold text-dark">{label || t(`${FB}.liveFormPreview`)}</h3>
                        {subLabel ? <div className="text-muted fs-8">{subLabel}</div> : null}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {previewFields.length > 0 ? (
                    previewFields.map((field) => {
                        let options = [];
                        if (field.options_json) {
                            try {
                                options = JSON.parse(field.options_json);
                            } catch (error) {
                                options = [];
                            }
                        }

                        const fieldKey = getFieldKey(field);
                        const value = values[fieldKey] ?? '';
                        const hasError = Boolean(errors?.[fieldKey]);

                        return (
                            <div className="form-group mb-4" key={field.id}>
                                <label className="form-label fw-bold">{field.label_en || t(`${FB}.defaultFieldLabel`)}</label>

                                {field.type === 'Text Field' && (
                                    <input
                                        type="text"
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    />
                                )}
                                {field.type === 'Email Field' && (
                                    <input
                                        type="email"
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    />
                                )}
                                {field.type === 'Number Field' && (
                                    <input
                                        type="number"
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    />
                                )}
                                {field.type === 'Date Field' && (
                                    <input
                                        type="date"
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    />
                                )}
                                {field.type === 'Password Field' && (
                                    <input
                                        type="password"
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    />
                                )}
                                {field.type === 'Multiline Text Field' && (
                                    <textarea
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        rows="3"
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    ></textarea>
                                )}
                                {field.type === 'Dropdown' && (
                                    <select
                                        className={`form-select ${hasError ? 'is-invalid' : ''}`}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    >
                                        <option value="">{t(`${FB}.select`)}</option>
                                        {options.map((opt, idx) => (
                                            <option value={opt.value || `${idx}`} key={`${opt.value || 'opt'}-${idx}`}>
                                                {opt.label_en || ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {field.type === 'Radio Buttons' && (
                                    <div className="mt-2 p-2 rounded" style={hasError ? { border: '1px solid #dc3545' } : undefined}>
                                        {options.map((opt, idx) => {
                                            const optValue = opt.value || `${idx}`;
                                            return (
                                                <div className="form-check" key={`${optValue}-${idx}`}>
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        id={`radio-${field.id}-${idx}`}
                                                        name={`radio-${fieldKey}`}
                                                        value={optValue}
                                                        checked={value === optValue}
                                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`radio-${field.id}-${idx}`}>
                                                        {opt.label_en || ''}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {field.type === 'Checkbox' && (
                                    <div className="mt-2 p-2 rounded" style={hasError ? { border: '1px solid #dc3545' } : undefined}>
                                        {options.map((opt, idx) => {
                                            const optValue = opt.value || `${idx}`;
                                            const selected = Array.isArray(value) ? value : [];
                                            const checked = selected.includes(optValue);
                                            return (
                                                <div className="form-check" key={`${optValue}-${idx}`}>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`checkbox-${field.id}-${idx}`}
                                                        value={optValue}
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = new Set(selected);
                                                            if (e.target.checked) next.add(optValue);
                                                            else next.delete(optValue);
                                                            onChange(formId, fieldKey, Array.from(next));
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor={`checkbox-${field.id}-${idx}`}>
                                                        {opt.label_en || ''}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {!FIELD_TYPES.includes(field.type) && (
                                    <input
                                        type="text"
                                        className={`form-control ${hasError ? 'is-invalid' : ''}`}
                                        placeholder={field.label_en || ''}
                                        value={value}
                                        onChange={(e) => onChange(formId, fieldKey, e.target.value)}
                                    />
                                )}
                                {hasError && <div className="invalid-feedback d-block">{t(`${FB}.fieldRequired`)}</div>}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-muted">{t(`${FB}.noFieldsPreview`)}</p>
                )}
            </div>

            <div
                style={{
                    flexShrink: 0,
                    background: '#ffffff',
                    borderTop: '1px solid #e5e7eb',
                    padding: '12px 16px',
                    marginTop: 'auto',
                }}
            >
                <div className="d-flex gap-3">
                    <button
                        type="button"
                        className="btn btn-light w-100"
                        style={{
                            borderRadius: '0px',
                            height: '44px',
                            fontWeight: 600,
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                        }}
                        onClick={onCancel}
                    >
                        {t(`${FB}.cancel`)}
                    </button>
                    <button
                        type="button"
                        className="btn w-100"
                        style={{
                            borderRadius: '0px',
                            height: '44px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: '#1976d2',
                            boxShadow: '0 6px 14px rgba(25, 118, 210, 0.25)',
                        }}
                        onClick={onProcess}
                    >
                        {t(`${FB}.process`)}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ensureBaseForm = (existing) => {
    if (Array.isArray(existing) && existing.length > 0) return existing;
    return [
        {
            id: makeId(),
            title: 'Mobile Services Form',
            form_name: { en: 'Mobile Services Form', ar: '' },
            form_url: '',
            fields: [
                {
                    id: makeId(),
                    label_en: '',
                    label_ar: '',
                    key: '',
                    type: FIELD_TYPES[0],
                    options: [],
                    customization: {},
                    is_required: true,
                },
            ],
        },
    ];
};

const MobileFormsBuilder = ({ value, onChange, serviceLabel, hideGlobalActions = false }, ref) => {
    const { t } = useTranslation();
    const defaultFormTitle = t('admin.paymentGetway.mobileServicesForm');
    const [builderErrors, setBuilderErrors] = useState({});

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFormIndex, setPreviewFormIndex] = useState(0);
    const [previewValues, setPreviewValues] = useState({});
    const [previewErrors, setPreviewErrors] = useState({});
    const [previewCompleted, setPreviewCompleted] = useState(false);

    const forms = useMemo(() => ensureBaseForm(value), [value]);

    const setForms = (next) => {
        const base = ensureBaseForm(value);
        onChange(typeof next === 'function' ? next(base) : next);
    };

    const addMobileServiceForm = () => {
        const formNumber = forms.length + 1;
        const numberedTitle = t(`${FB}.mobileServicesFormNumbered`, { number: formNumber });
        setForms([
            ...forms,
            {
                id: makeId(),
                title: numberedTitle,
                form_name: { en: numberedTitle, ar: '' },
                form_url: '',
                fields: [
                    {
                        id: makeId(),
                        label_en: '',
                        label_ar: '',
                        key: '',
                        type: FIELD_TYPES[0],
                        options: [],
                            customization: {},
                            is_required: true,
                    },
                ],
            },
        ]);
    };

    const removeMobileServiceForm = (formId) => {
        if (forms.length <= 1) return;
        setForms(forms.filter((f) => f.id !== formId));
        setBuilderErrors((prev) => {
            const next = { ...prev };
            delete next[formId];
            return next;
        });
    };

    const updateMobileFormMeta = (formId, key, nextValue) => {
        setForms((prevForms) =>
            prevForms.map((f) => (f.id === formId ? { ...f, [key]: nextValue } : f))
        );
    };

    const addServiceField = (formId) => {
        setForms(
            forms.map((f) => {
                if (f.id !== formId) return f;
                return {
                    ...f,
                    fields: [
                        ...(f.fields || []),
                        {
                            id: makeId(),
                            label_en: '',
                            label_ar: '',
                            key: '',
                            type: FIELD_TYPES[0],
                            options: [],
                            customization: {},
                            is_required: true,
                        },
                    ],
                };
            })
        );
    };

    const removeServiceField = (formId, fieldId) => {
        setForms(
            forms.map((f) => {
                if (f.id !== formId) return f;
                const fields = (f.fields || []);
                if (fields.length <= 1) return f;
                return { ...f, fields: fields.filter((x) => x.id !== fieldId) };
            })
        );
        setBuilderErrors((prev) => {
            const next = { ...prev };
            if (next[formId]) {
                delete next[formId][fieldId];
            }
            return next;
        });
    };

    const updateServiceField = (formId, fieldId, key, nextValue) => {
        setForms(
            forms.map((f) => {
                if (f.id !== formId) return f;
                return {
                    ...f,
                    fields: (f.fields || []).map((field) => {
                        if (field.id !== fieldId) return field;
                        const base = { ...field, [key]: nextValue };
                        if (key === 'type' && !TYPES_WITH_OPTIONS.has(nextValue)) {
                            base.options = [];
                        }
                        if (key === 'type') {
                            const nextCustomization = { ...(base.customization || {}) };
                            if (isNumberFieldType(nextValue)) {
                                delete nextCustomization.regex;
                            } else if (isTextCustomizationType(nextValue) || isDateFieldType(nextValue)) {
                                // keep min/max for text/date; text uses length, date uses range
                            } else {
                                base.customization = {};
                                return base;
                            }
                            base.customization = nextCustomization;
                        }
                        return base;
                    }),
                };
            })
        );

        if (key === 'key') {
            const trimmed = `${nextValue || ''}`.trim();
            setBuilderErrors((prev) => {
                const next = { ...prev };
                const perForm = { ...(next[formId] || {}) };
                if (!trimmed) {
                    perForm[fieldId] = t(`${FB}.keyRequired`);
                } else {
                    delete perForm[fieldId];
                }
                next[formId] = perForm;
                return next;
            });
        }
    };

    const addOption = (formId, fieldId) => {
        setForms(
            forms.map((f) => {
                if (f.id !== formId) return f;
                return {
                    ...f,
                    fields: (f.fields || []).map((field) => {
                        if (field.id !== fieldId) return field;
                        return {
                            ...field,
                            options: [
                                ...(field.options || []),
                                { id: makeId(), label_en: '', label_ar: '', value: '' },
                            ],
                        };
                    }),
                };
            })
        );
    };

    const updateOption = (formId, fieldId, optionIdentity, key, nextValue) => {
        setForms(
            forms.map((f) => {
                if (f.id !== formId) return f;
                return {
                    ...f,
                    fields: (f.fields || []).map((field) => {
                        if (field.id !== fieldId) return field;
                        return {
                            ...field,
                            options: (field.options || []).map((opt, idx) =>
                                getOptionIdentity(opt, idx) === optionIdentity ? { ...opt, [key]: nextValue } : opt
                            ),
                        };
                    }),
                };
            })
        );
    };

    const removeOption = (formId, fieldId, optionIdentity) => {
        setForms(
            forms.map((f) => {
                if (f.id !== formId) return f;
                return {
                    ...f,
                    fields: (f.fields || []).map((field) => {
                        if (field.id !== fieldId) return field;
                        return {
                            ...field,
                            options: (field.options || []).filter(
                                (opt, idx) => getOptionIdentity(opt, idx) !== optionIdentity
                            ),
                        };
                    }),
                };
            })
        );
    };

    const openPreview = () => {
        setPreviewOpen(true);
        setPreviewFormIndex(0);
        setPreviewValues({});
        setPreviewErrors({});
        setPreviewCompleted(false);
    };

    const closePreview = () => setPreviewOpen(false);

    useImperativeHandle(ref, () => ({
        addForm: addMobileServiceForm,
        openPreview,
    }), [forms]);

    const handlePreviewChange = (formId, key, nextValue) => {
        setPreviewValues((prev) => ({
            ...prev,
            [formId]: { ...(prev[formId] || {}), [key]: nextValue },
        }));
        setPreviewErrors((prev) => {
            const next = { ...prev };
            if (next[formId]?.[key]) {
                const per = { ...(next[formId] || {}) };
                delete per[key];
                next[formId] = per;
            }
            return next;
        });
    };

    const validatePreviewForm = (form) => {
        const errors = {};
        const values = previewValues[form.id] || {};
        (form.fields || []).forEach((field) => {
            const fieldKey = getFieldKey(field);
            const value = values[fieldKey];
            const missing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
            if (missing) {
                errors[fieldKey] = true;
            }
        });
        return errors;
    };

    const handlePreviewProcess = () => {
        const current = forms[previewFormIndex];
        if (!current) return;
        const errors = validatePreviewForm(current);
        if (Object.keys(errors).length > 0) {
            setPreviewErrors((prev) => ({ ...prev, [current.id]: errors }));
            return;
        }
        if (previewFormIndex + 1 >= forms.length) {
            setPreviewCompleted(true);
            return;
        }
        setPreviewFormIndex((idx) => idx + 1);
    };

    return (
        <>
            {(forms || []).map((mobileForm) => {
                const previewFields = (mobileForm.fields || []).map((field) => ({
                    ...field,
                    options_json: JSON.stringify(field.options || []),
                }));

                return (
                    <div className="row justify-content-between p-1" key={mobileForm.id}>
                        <div className="card p-5 mt-4 col-md-7">
                            <div className="card-header d-flex justify-content-between align-items-center flex-nowrap gap-2">
                                <div className="card-title">
                                    <h3 className="card-label">{getFormTitle(mobileForm, defaultFormTitle)}</h3>
                                </div>
                                <div className="card-toolbar">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-success me-2"
                                        onClick={() => addServiceField(mobileForm.id)}
                                    >
                                        <i className="la la-plus"></i> {t(`${FB}.addField`)}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light-danger"
                                        onClick={() => removeMobileServiceForm(mobileForm.id)}
                                        disabled={(forms || []).length === 1}
                                    >
                                        <i className="la la-trash"></i> {t(`${FB}.removeForm`)}
                                    </button>
                                </div>
                            </div>
                            <div className="card-body p-3">
                                <div className="row mb-5">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">{t(`${FB}.formNameEnglish`)}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={mobileForm.form_name?.en ?? mobileForm.title ?? ''}
                                            onChange={(e) => {
                                                const nextEn = e.target.value;
                                                setForms((prevForms) =>
                                                    prevForms.map((f) =>
                                                        f.id === mobileForm.id
                                                            ? {
                                                                  ...f,
                                                                  title: nextEn,
                                                                  form_name: {
                                                                      en: nextEn,
                                                                      ar: f.form_name?.ar ?? '',
                                                                  },
                                                              }
                                                            : f
                                                    )
                                                );
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">{t(`${FB}.formNameArabic`)}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            dir="rtl"
                                            value={mobileForm.form_name?.ar ?? ''}
                                            onChange={(e) =>
                                                updateMobileFormMeta(mobileForm.id, 'form_name', {
                                                    en: mobileForm.form_name?.en ?? mobileForm.title ?? '',
                                                    ar: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">{t(`${FB}.formUrl`)}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={mobileForm.form_url || ''}
                                            onChange={(e) => updateMobileFormMeta(mobileForm.id, 'form_url', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {(mobileForm.fields || []).map((field) => (
                                    <div key={field.id} className="card p-4 mb-4">
                                        {(() => {
                                            const duplicateOptionIds = TYPES_WITH_OPTIONS.has(field.type)
                                                ? collectDuplicateOptionIds(field.options || [])
                                                : new Set();
                                            const hasDuplicateOptions = duplicateOptionIds.size > 0;
                                            const customization = getFieldCustomization(field);
                                            const customizationEnabled = Boolean(customization.enabled);
                                            const showTextCustomization = customizationEnabled && isTextCustomizationType(field.type);
                                            const showNumberCustomization = customizationEnabled && isNumberFieldType(field.type);
                                            const showDateCustomization = customizationEnabled && isDateFieldType(field.type);
                                            return (
                                        <div className="row">
                                            <div className="col-md-6 mb-4">
                                                <label className="form-label">{t(`${FB}.labelEnglish`)}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={field.label_en}
                                                    onChange={(e) => updateServiceField(mobileForm.id, field.id, 'label_en', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-4">
                                                <label className="form-label">{t(`${FB}.labelArabic`)}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={field.label_ar}
                                                    onChange={(e) => updateServiceField(mobileForm.id, field.id, 'label_ar', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-4">
                                                <label className="form-label">{t(`${FB}.key`)}</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${builderErrors?.[mobileForm.id]?.[field.id] ? 'is-invalid' : ''}`}
                                                    value={field.key}
                                                    onChange={(e) => updateServiceField(mobileForm.id, field.id, 'key', e.target.value)}
                                                />
                                                {builderErrors?.[mobileForm.id]?.[field.id] && (
                                                    <div className="invalid-feedback d-block">
                                                        {builderErrors[mobileForm.id][field.id]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-4">
                                                <label className="form-label">{t(`${FB}.type`)}</label>
                                                <select
                                                    className="form-select"
                                                    value={field.type}
                                                    onChange={(e) => updateServiceField(mobileForm.id, field.id, 'type', e.target.value)}
                                                >
                                                    {FIELD_TYPES.map((type) => (
                                                        <option key={type} value={type}>
                                                            {translateFieldType(type, t)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-4 d-flex align-items-end">
                                                <div className="form-check form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`required-${mobileForm.id}-${field.id}`}
                                                        checked={field.is_required !== false}
                                                        onChange={(e) => updateServiceField(mobileForm.id, field.id, 'is_required', e.target.checked)}
                                                    />
                                                    <label className="form-check-label fw-semibold" htmlFor={`required-${mobileForm.id}-${field.id}`}>
                                                        {t(`${FB}.requiredField`)}
                                                    </label>
                                                </div>
                                            </div>
                                            {(isTextCustomizationType(field.type) || isNumberFieldType(field.type) || isDateFieldType(field.type)) && (
                                                <div className="col-12 mb-4">
                                                    <div className="form-check form-check-custom form-check-solid">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`customization-enable-${mobileForm.id}-${field.id}`}
                                                            checked={customizationEnabled}
                                                            onChange={(e) => {
                                                                const enabled = e.target.checked;
                                                                const nextCustomization = enabled ? { ...(customization || {}), enabled: true } : {};
                                                                updateServiceField(mobileForm.id, field.id, 'customization', nextCustomization);
                                                            }}
                                                        />
                                                        <label className="form-check-label fw-semibold" htmlFor={`customization-enable-${mobileForm.id}-${field.id}`}>
                                                            {t(`${FB}.enableCustomization`)}
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                            {showTextCustomization && (
                                                <>
                                                    <div className="col-md-4 mb-4">
                                                        <label className="form-label">{t(`${FB}.min`)}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="0"
                                                            value={customization.min ?? ''}
                                                            placeholder={t(`${FB}.minLengthPlaceholder`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, min: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-md-4 mb-4">
                                                        <label className="form-label">{t(`${FB}.max`)}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="0"
                                                            value={customization.max ?? ''}
                                                            placeholder={t(`${FB}.maxLengthPlaceholder`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, max: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-md-4 mb-4">
                                                        <label className="form-label">{t(`${FB}.regex`)}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={customization.regex ?? ''}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, regex: e.target.value }
                                                                )
                                                            }
                                                            placeholder={t(`${FB}.regexPlaceholder`)}
                                                        />
                                                    </div>
                                                    <div className="col-12 mb-4">
                                                        <label className="form-label">{t(`${FB}.hint`)}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={customization.hint ?? ''}
                                                            placeholder={t(`${FB}.hintPlaceholderAccount`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, hint: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-12 mb-2">
                                                        <small className="text-muted">{t(`${FB}.textCustomizationHint`)}</small>
                                                    </div>
                                                </>
                                            )}
                                            {showNumberCustomization && (
                                                <>
                                                    <div className="col-md-6 mb-4">
                                                        <label className="form-label">{t(`${FB}.min`)}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={customization.min ?? ''}
                                                            placeholder={t(`${FB}.minValuePlaceholder`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, min: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-4">
                                                        <label className="form-label">{t(`${FB}.max`)}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={customization.max ?? ''}
                                                            placeholder={t(`${FB}.maxValuePlaceholder`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, max: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-12 mb-4">
                                                        <label className="form-label">{t(`${FB}.hint`)}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={customization.hint ?? ''}
                                                            placeholder={t(`${FB}.hintPlaceholderAmount`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, hint: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-12 mb-2">
                                                        <small className="text-muted">{t(`${FB}.numberCustomizationHint`)}</small>
                                                    </div>
                                                </>
                                            )}
                                            {showDateCustomization && (
                                                <>
                                                    <div className="col-md-6 mb-4">
                                                        <label className="form-label">{t(`${FB}.minDate`)}</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={customization.min ?? ''}
                                                            placeholder={t(`${FB}.earliestDatePlaceholder`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, min: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-4">
                                                        <label className="form-label">{t(`${FB}.maxDate`)}</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={customization.max ?? ''}
                                                            placeholder={t(`${FB}.latestDatePlaceholder`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, max: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-12 mb-4">
                                                        <label className="form-label">{t(`${FB}.hint`)}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={customization.hint ?? ''}
                                                            placeholder={t(`${FB}.hintPlaceholderDate`)}
                                                            onChange={(e) =>
                                                                updateServiceField(
                                                                    mobileForm.id,
                                                                    field.id,
                                                                    'customization',
                                                                    { ...customization, enabled: true, hint: e.target.value }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="col-12 mb-2">
                                                        <small className="text-muted">{t(`${FB}.dateCustomizationHint`)}</small>
                                                    </div>
                                                </>
                                            )}

                                            {TYPES_WITH_OPTIONS.has(field.type) && (
                                                <div className="col-12 mt-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h5 className="mb-0">Options</h5>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => addOption(mobileForm.id, field.id)}
                                                        >
                                                            Add Option
                                                        </button>
                                                    </div>
                                                    {(field.options || []).map((opt, optIndex) => {
                                                        const optionIdentity = getOptionIdentity(opt, optIndex);
                                                        return (
                                                        <div key={optionIdentity} className="row mb-2">
                                                            <div className="col-md-4">
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${duplicateOptionIds.has(optionIdentity) ? 'is-invalid' : ''}`}
                                                                    placeholder={t(`${FB}.optionLabelEn`)}
                                                                    value={opt.label_en}
                                                                    onChange={(e) => updateOption(mobileForm.id, field.id, optionIdentity, 'label_en', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-md-4">
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder={t(`${FB}.optionLabelAr`)}
                                                                    value={opt.label_ar}
                                                                    onChange={(e) => updateOption(mobileForm.id, field.id, optionIdentity, 'label_ar', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-md-3">
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${duplicateOptionIds.has(optionIdentity) ? 'is-invalid' : ''}`}
                                                                    placeholder={t(`${FB}.optionValue`)}
                                                                    value={opt.value}
                                                                    onChange={(e) => updateOption(mobileForm.id, field.id, optionIdentity, 'value', e.target.value)}
                                                                />
                                                                {duplicateOptionIds.has(optionIdentity) && (
                                                                    <div className="invalid-feedback d-block">
                                                                        {t(`${FB}.duplicateOptionError`)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="col-md-1">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => removeOption(mobileForm.id, field.id, optionIdentity)}
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                    {hasDuplicateOptions && (
                                                        <div className="text-warning fs-7 mt-2">
                                                            {t(`${FB}.duplicateOptionsWarning`)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="col-12 text-end mt-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-light-danger"
                                                    onClick={() => removeServiceField(mobileForm.id, field.id)}
                                                    disabled={(mobileForm.fields || []).length === 1}
                                                >
                                                    {t(`${FB}.removeField`)}
                                                </button>
                                            </div>
                                        </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-5 mt-4 row">
                            <div className="col-md-11 p-0" id={`preview-area-${mobileForm.id}`}>
                                <div className="d-flex justify-content-center">
                                    <IPhoneMockup screenWidth={300} frameColor="#000000">
                                        <div className="p-4 bg-white" style={previewScreenShellStyle}>
                                            <ServiceFormPreview
                                                formData={previewFields}
                                                label={serviceLabel || t(`${FB}.liveFormPreview`)}
                                                subLabel={mobileForm.form_name?.en?.trim() || mobileForm.title?.trim() || ''}
                                            />
                                        </div>
                                    </IPhoneMockup>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {!hideGlobalActions && (
                <div className="mt-5 d-flex justify-content-end flex-wrap gap-2">
                    <button type="button" className="btn btn-light-primary" onClick={addMobileServiceForm}>
                        <i className="la la-plus"></i> {t('admin.paymentGetway.addForm')}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={openPreview}>
                        <i className="ki-duotone ki-eye fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        {t('admin.paymentGetway.previewProcess')}
                    </button>
                </div>
            )}

            {previewOpen && (
                <div
                    className="modal fade show"
                    style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '980px' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t(`${FB}.previewMessage`)}</h5>
                                <button type="button" className="btn-close" onClick={closePreview}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-6">
                                    <div className="col-lg-6">
                                        <div className="alert alert-info">
                                            {t(`${FB}.previewProcessHint`)}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="fw-semibold">
                                                {t(`${FB}.step`, {
                                                    current: previewFormIndex + 1,
                                                    total: (forms || []).length,
                                                })}
                                            </div>
                                            <div className="text-muted">
                                                {getFormTitle(
                                                    (forms || [])[previewFormIndex],
                                                    defaultFormTitle
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-center">
                                            <IPhoneMockup screenWidth={320} frameColor="#000000">
                                                <div className="p-4 bg-white" style={previewScreenShellStyle}>
                                                    <InteractiveServiceFormPreview
                                                        label={serviceLabel || t(`${FB}.liveFormPreview`)}
                                                        subLabel={
                                                            (forms || [])[previewFormIndex]?.form_name?.en?.trim() ||
                                                            (forms || [])[previewFormIndex]?.title?.trim() ||
                                                            ''
                                                        }
                                                        formId={(forms || [])[previewFormIndex]?.id}
                                                        fields={(forms || [])[previewFormIndex]?.fields || []}
                                                        values={previewValues[(forms || [])[previewFormIndex]?.id] || {}}
                                                        errors={previewErrors[(forms || [])[previewFormIndex]?.id] || {}}
                                                        onChange={handlePreviewChange}
                                                        onCancel={closePreview}
                                                        onProcess={handlePreviewProcess}
                                                        completed={previewCompleted}
                                                    />
                                                </div>
                                            </IPhoneMockup>
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <div className="card-title">{t(`${FB}.enteredValues`)}</div>
                                            </div>
                                            <div className="card-body">
                                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                                    {JSON.stringify(previewValues, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={closePreview}>
                                    {t(`${FB}.close`)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default forwardRef(MobileFormsBuilder);

