import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import IPhoneMockup from '../../../common/IPhoneMockup';
import ServiceModel from '../../../services/ServiceModel';

const DraggableItem = ({ id, children, className = '' }) => {
    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({ id });
    const { setNodeRef: setDroppableRef } = useDroppable({ id });

    const setCombinedRef = (node) => {
        setDraggableRef(node);
        setDroppableRef(node);
    };

    const dragStyle = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: isDragging
            ? 'none'
            : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
        willChange: 'transform',
    };

    return (
        <div
            ref={setCombinedRef}
            className={className}
            style={{ ...dragStyle, opacity: isDragging ? 0.72 : 1 }}
        >
            {children({ attributes, listeners, isDragging })}
        </div>
    );
};

const DraggableTableRow = ({ id, children }) => {
    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({ id });
    const { setNodeRef: setDroppableRef } = useDroppable({ id });

    const setCombinedRef = (node) => {
        setDraggableRef(node);
        setDroppableRef(node);
    };

    const dragStyle = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: isDragging
            ? 'none'
            : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
        willChange: 'transform',
    };

    return children({
        rowRef: setCombinedRef,
        style: { ...dragStyle, opacity: isDragging ? 0.72 : 1 },
        attributes,
        listeners,
    });
};

const getPreviewFieldKey = (field) => (field?.key && String(field.key).trim() ? String(field.key).trim() : `field_${field?.id || 'x'}`);
const getPreviewFormFields = (form) => {
    if (Array.isArray(form?.fields)) return form.fields;
    if (Array.isArray(form?.product_form_fields)) return form.product_form_fields;
    return [];
};
const getPreviewProductForms = (product) => {
    if (Array.isArray(product?.product_forms)) return product.product_forms;
    if (Array.isArray(product?.serviceForms)) return product.serviceForms;
    if (Array.isArray(product?.forms)) return product.forms;
    return [];
};
const getPreviewOptions = (field) => {
    if (Array.isArray(field?.options)) return field.options;
    if (!field?.options_json) return [];
    try {
        const parsed = typeof field.options_json === 'string' ? JSON.parse(field.options_json) : field.options_json;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};
const getPreviewFieldType = (field) => `${field?.form_type || field?.type || ''}`.trim().toLowerCase();
const isPreviewRequiredMissing = (field, value) => {
    if (!field?.is_required) return false;
    if (getPreviewFieldType(field) === 'checkbox') return !Array.isArray(value) || value.length === 0;
    return value === undefined || value === null || String(value).trim() === '';
};

const LivePreviewFormFields = ({ form, values, errors, onChange }) => {
    const { t } = useTranslation();
    const fields = getPreviewFormFields(form);
    if (!fields.length) {
        return <div className="text-muted fs-8">{t('admin.paymentGetway.homeCfgPreviewNoFormFields')}</div>;
    }

    return (
        <div>
            {fields.map((field, idx) => {
                const key = getPreviewFieldKey(field);
                const type = getPreviewFieldType(field);
                const options = getPreviewOptions(field);
                const value = values[key] ?? (type === 'checkbox' ? [] : '');
                const hasErr = Boolean(errors[key]);
                const label = field?.label || field?.label_en || field?.label_ar || t('admin.paymentGetway.homeCfgPreviewFieldFallback', { n: idx + 1 });
                const invalidClass = hasErr ? ' is-invalid' : '';

                return (
                    <div className="mb-3" key={`${key}-${idx}`}>
                        <label className="form-label fw-semibold mb-1" style={{ fontSize: 12 }}>
                            {label}
                            {field?.is_required ? <span className="text-danger ms-1">*</span> : null}
                        </label>

                        {['text field', 'text_field', 'text'].includes(type) && (
                            <input type="text" className={`form-control form-control-sm${invalidClass}`} value={value} onChange={(e) => onChange(key, e.target.value)} />
                        )}
                        {['email field', 'email'].includes(type) && (
                            <input type="email" className={`form-control form-control-sm${invalidClass}`} value={value} onChange={(e) => onChange(key, e.target.value)} />
                        )}
                        {['number field', 'number', 'amount_picker'].includes(type) && (
                            <input type="number" className={`form-control form-control-sm${invalidClass}`} value={value} onChange={(e) => onChange(key, e.target.value)} />
                        )}
                        {['date field', 'date', 'date_picker'].includes(type) && (
                            <input type="date" className={`form-control form-control-sm${invalidClass}`} value={value} onChange={(e) => onChange(key, e.target.value)} />
                        )}
                        {['password field', 'password'].includes(type) && (
                            <input type="password" className={`form-control form-control-sm${invalidClass}`} value={value} onChange={(e) => onChange(key, e.target.value)} />
                        )}
                        {['multiline text field', 'text_area', 'textarea'].includes(type) && (
                            <textarea className={`form-control form-control-sm${invalidClass}`} rows={3} value={value} onChange={(e) => onChange(key, e.target.value)} />
                        )}
                        {['dropdown', 'selection', 'telecom providers'].includes(type) && (
                            <select className={`form-select form-select-sm${invalidClass}`} value={value} onChange={(e) => onChange(key, e.target.value)}>
                                <option value="">{t('admin.paymentGetway.homeCfgSelectPlaceholder')}</option>
                                {options.map((opt, i) => {
                                    const optVal = opt?.value != null ? String(opt.value) : `${i}`;
                                    const optLabel = opt?.label || opt?.label_en || opt?.label_ar || optVal;
                                    return (
                                        <option key={`${key}-o-${i}`} value={optVal}>{optLabel}</option>
                                    );
                                })}
                            </select>
                        )}
                        {['radio buttons', 'radio'].includes(type) && (
                            <div className={`p-2 rounded border${hasErr ? ' border-danger' : ''}`}>
                                {options.map((opt, i) => {
                                    const optVal = opt?.value != null ? String(opt.value) : `${i}`;
                                    const optLabel = opt?.label || opt?.label_en || opt?.label_ar || optVal;
                                    return (
                                        <div className="form-check py-1" key={`${key}-r-${i}`}>
                                            <input className="form-check-input" type="radio" id={`${key}-r-${i}`} name={`r-${key}`} checked={value === optVal} onChange={() => onChange(key, optVal)} />
                                            <label className="form-check-label" htmlFor={`${key}-r-${i}`}>{optLabel}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {type === 'checkbox' && (
                            <div className={`p-2 rounded border${hasErr ? ' border-danger' : ''}`}>
                                {options.map((opt, i) => {
                                    const optVal = opt?.value != null ? String(opt.value) : `${i}`;
                                    const optLabel = opt?.label || opt?.label_en || opt?.label_ar || optVal;
                                    const selected = Array.isArray(value) ? value : [];
                                    return (
                                        <div className="form-check py-1" key={`${key}-c-${i}`}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`${key}-c-${i}`}
                                                checked={selected.includes(optVal)}
                                                onChange={(e) => {
                                                    const next = new Set(selected);
                                                    if (e.target.checked) next.add(optVal);
                                                    else next.delete(optVal);
                                                    onChange(key, Array.from(next));
                                                }}
                                            />
                                            <label className="form-check-label" htmlFor={`${key}-c-${i}`}>{optLabel}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {hasErr && <div className="invalid-feedback d-block fs-8">{t('admin.paymentGetway.homeCfgFieldRequired')}</div>}
                    </div>
                );
            })}
        </div>
    );
};

const HomeScreenServicesConfigPage = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();

    const translateItemType = useCallback(
        (type) => {
            const key = `${type || ''}`.toLowerCase();
            if (key === 'category') return t('admin.paymentGetway.homeCfgItemTypeCategory');
            if (key === 'service') return t('admin.paymentGetway.homeCfgItemTypeService');
            if (key === 'product') return t('admin.paymentGetway.homeCfgItemTypeProduct');
            return type ? String(type) : t('admin.common.unknown');
        },
        [t]
    );
    const [homeConfigItems, setHomeConfigItems] = useState([]);
    const [initialItems, setInitialItems] = useState([]);
    const [homeConfigSearch, setHomeConfigSearch] = useState('');
    const [homeConfigResults, setHomeConfigResults] = useState([]);
    const [homeConfigLoading, setHomeConfigLoading] = useState(false);
    const [homeConfigItemsLoading, setHomeConfigItemsLoading] = useState(true);
    const [homeConfigSaving, setHomeConfigSaving] = useState(false);
    const [viewMode, setViewMode] = useState('cards');
    const [searchType, setSearchType] = useState('all');
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [openActionMenuKey, setOpenActionMenuKey] = useState(null);
    const [selectedItemKeys, setSelectedItemKeys] = useState([]);
    const [showSetOrderModal, setShowSetOrderModal] = useState(false);
    const [setOrderTargetKey, setSetOrderTargetKey] = useState(null);
    const [setOrderPosition, setSetOrderPosition] = useState('');
    const [previewMode, setPreviewMode] = useState('home');
    const [previewPayload, setPreviewPayload] = useState({ quick_actions: [], items: [] });
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewStep, setPreviewStep] = useState('root');
    const [previewSelectedCategory, setPreviewSelectedCategory] = useState(null);
    const [previewSelectedService, setPreviewSelectedService] = useState(null);
    const [previewSelectedProduct, setPreviewSelectedProduct] = useState(null);
    const [previewProductForms, setPreviewProductForms] = useState([]);
    const [previewActiveFormIndex, setPreviewActiveFormIndex] = useState(0);
    const [previewFormValuesById, setPreviewFormValuesById] = useState({});
    const [previewFormErrors, setPreviewFormErrors] = useState({});
    const [previewFormCompleted, setPreviewFormCompleted] = useState(false);
    const [previewFormSubmitting, setPreviewFormSubmitting] = useState(false);
    const searchContainerRef = useRef(null);
    const mobileSearchContainerRef = useRef(null);
    const lastDragPairRef = useRef('');
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const renderSearchAndViewControls = (searchRef, isMobile = false) => (
        <div className="d-flex align-items-center flex-wrap gap-2 w-100">
            <div className="position-relative flex-grow-1" ref={searchRef}>
                <div
                    className="input-group"
                    style={{
                        minWidth: isMobile ? '100%' : '520px',
                        borderRadius: '999px',
                        overflow: 'hidden',
                    }}
                >
                    <span className="input-group-text bg-light border-0 px-4">
                        <i className="ki-duotone ki-magnifier fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </span>
                    <input
                        type="text"
                        className="form-control form-control-solid border-0 py-3"
                        placeholder={t('admin.paymentGetway.homeCfgSearchPlaceholder')}
                        value={homeConfigSearch}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        onChange={(e) => {
                            setHomeConfigSearch(e.target.value);
                            setIsSearchDropdownOpen(true);
                        }}
                    />
                    <select
                        className="form-select form-select-solid border-0"
                        value={searchType}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        onChange={(e) => {
                            setSearchType(e.target.value);
                            setIsSearchDropdownOpen(true);
                        }}
                        style={{ maxWidth: '130px' }}
                    >
                        <option value="all">{t('admin.common.all')}</option>
                        <option value="category">{t('admin.paymentGetway.homeCfgCategories')}</option>
                        <option value="service">{t('admin.paymentGetway.homeCfgServices')}</option>
                        <option value="product">{t('admin.paymentGetway.homeCfgProducts')}</option>
                    </select>
                </div>
                {isSearchDropdownOpen && (homeConfigLoading || homeConfigResults.length > 0) && (
                    <div
                        className="menu menu-sub menu-sub-dropdown menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-100 show"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            zIndex: 1000,
                            minWidth: isMobile ? '100%' : '520px',
                            maxHeight: '320px',
                            overflowY: 'auto',
                        }}
                    >
                        {homeConfigLoading ? (
                            <div className="menu-item px-4 py-3 text-muted">{t('admin.paymentGetway.homeCfgSearching')}</div>
                        ) : (
                            homeConfigResults.map((item) => {
                                const selected = homeConfigItems.some((entry) => homeConfigKey(entry) === homeConfigKey(item));
                                return (
                                    <div key={homeConfigKey(item)} className="menu-item px-2">
                                        <div className="menu-link d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="symbol symbol-40px">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.label} className="rounded" />
                                                    ) : (
                                                        <span className="symbol-label bg-light-success">
                                                            <i className="ki-duotone ki-abstract-26 fs-2 text-success">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="fw-semibold">{item.label}</span>
                                                    <span className="badge badge-light ms-2">{translateItemType(item.type)}</span>
                                                    {item.subtitle ? <div className="text-muted fs-8">{item.subtitle}</div> : null}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${selected ? 'btn-light-danger' : 'btn-light-primary'}`}
                                                onClick={() => (selected ? removeHomeConfigItem(item) : addHomeConfigItem(item))}
                                            >
                                                {selected ? t('admin.common.remove') : t('admin.common.add')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
            {[
                { id: 'cards', icon: 'ki-element-11', label: t('admin.paymentGetway.homeCfgCards') },
                { id: 'list', icon: 'ki-row-horizontal', label: t('admin.paymentGetway.homeCfgTable') },
                { id: 'preview', icon: 'ki-eye', label: t('admin.paymentGetway.homeCfgPreview') },
            ].map((mode) => (
                <button
                    key={mode.id}
                    type="button"
                    className={`btn btn-sm btn-icon ${viewMode === mode.id ? 'btn-primary' : 'btn-light-primary'}`}
                    onClick={() => setViewMode(mode.id)}
                    title={mode.label}
                    aria-label={mode.label}
                >
                    <i className={`ki-duotone ${mode.icon} fs-3`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                    </i>
                </button>
            ))}
        </div>
    );

    useEffect(() => {
        setTitle(t('admin.paymentGetway.homeCfgTitle'));
        setActions(<div className="d-none d-lg-flex w-100">{renderSearchAndViewControls(searchContainerRef)}</div>);
        return () => setActions(null);
    }, [
        setTitle,
        setActions,
        homeConfigSearch,
        searchType,
        viewMode,
        homeConfigLoading,
        homeConfigResults,
        homeConfigItems,
        isSearchDropdownOpen,
        t,
        translateItemType,
    ]);

    useEffect(() => {
        fetchHomeScreenConfig();
    }, []);

    useEffect(() => {
        if (viewMode !== 'preview') return;
        fetchPreviewPayload(previewMode);
    }, [previewMode, viewMode]);

    useEffect(() => {
        setPreviewStep('root');
        setPreviewSelectedCategory(null);
        setPreviewSelectedService(null);
        setPreviewSelectedProduct(null);
        setPreviewProductForms([]);
        setPreviewActiveFormIndex(0);
        setPreviewFormValuesById({});
        setPreviewFormErrors({});
        setPreviewFormCompleted(false);
        setPreviewFormSubmitting(false);
    }, [previewMode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchHomeConfigCandidates(homeConfigSearch);
        }, 350);

        return () => clearTimeout(timer);
    }, [homeConfigSearch, searchType]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideDesktopSearch = searchContainerRef.current && searchContainerRef.current.contains(event.target);
            const clickedInsideMobileSearch =
                mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(event.target);
            const clickedInsideSearch = clickedInsideDesktopSearch || clickedInsideMobileSearch;
            const clickedInsideActions = event.target.closest('.home-config-actions');
            if (!clickedInsideSearch) {
                setIsSearchDropdownOpen(false);
            }
            if (!clickedInsideActions) {
                setOpenActionMenuKey(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchHomeScreenConfig = async () => {
        setHomeConfigItemsLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICES_HOME_SCREEN_CONFIG, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const items = response?.data?.data?.items || [];
            setHomeConfigItems(items);
            setInitialItems(items);
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.homeCfgFailedLoad'));
        } finally {
            setHomeConfigItemsLoading(false);
        }
    };

    const fetchPreviewPayload = async (mode = 'home') => {
        setPreviewLoading(true);
        try {
            const token = getToken();
            const endpoint =
                mode === 'catalog'
                    ? ADMIN_ENDPOINTS.SERVICES_CATALOG_PREVIEW
                    : ADMIN_ENDPOINTS.SERVICES_HOME_PREVIEW;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response?.data?.data || {};
            setPreviewPayload({
                quick_actions: Array.isArray(data.quick_actions) ? data.quick_actions : [],
                items: Array.isArray(data.items) ? data.items : [],
            });
        } catch (error) {
            setPreviewPayload({ quick_actions: [], items: [] });
            toast.error(error.response?.data?.message || t('admin.paymentGetway.homeCfgFailedPreviewLoad'));
        } finally {
            setPreviewLoading(false);
        }
    };

    const searchHomeConfigCandidates = async (searchText) => {
        const normalized = (searchText || '').trim();
        if (!normalized) {
            setHomeConfigResults([]);
            return;
        }

        setHomeConfigLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICES_HOME_SCREEN_CONFIG_SEARCH, {
                params: { search: normalized, limit: 20 },
                headers: { Authorization: `Bearer ${token}` },
            });
            const items = response?.data?.data?.items || [];
            setHomeConfigResults(
                searchType === 'all' ? items : items.filter((item) => item.type === searchType)
            );
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.homeCfgFailedSearch'));
        } finally {
            setHomeConfigLoading(false);
        }
    };

    const homeConfigKey = (item) => `${item.type}:${item.id}`;

    const addHomeConfigItem = (item) => {
        setHomeConfigItems((prev) => {
            const exists = prev.some((entry) => homeConfigKey(entry) === homeConfigKey(item));
            if (exists) return prev;
            return [...prev, item];
        });
    };

    const removeHomeConfigItem = (item) => {
        const key = homeConfigKey(item);
        setHomeConfigItems((prev) => prev.filter((entry) => homeConfigKey(entry) !== key));
        setSelectedItemKeys((prev) => prev.filter((selectedKey) => selectedKey !== key));
    };

    const getRemovalInfoMessage = () =>
        t('admin.paymentGetway.homeCfgRemovedHint');

    const confirmAndRemoveHomeConfigItem = async (item) => {
        const label = item?.label || t('admin.paymentGetway.homeCfgThisItem');
        const result = await Swal.fire({
            title: t('admin.common.areYouSure'),
            text: t('admin.paymentGetway.homeCfgDeleteSingleConfirm', { label }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.homeCfgYesDeleteIt'),
            cancelButtonText: t('admin.common.cancel'),
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        removeHomeConfigItem(item);
        toast.info(getRemovalInfoMessage());
    };

    const getToggleEndpoint = (item) => {
        if (item.type === 'category') return ADMIN_ENDPOINTS.SERVICE_CATEGORY_TOGGLE_STATUS(item.id);
        if (item.type === 'service') return ADMIN_ENDPOINTS.SERVICE_TOGGLE_STATUS(item.id);
        if (item.type === 'product') return ADMIN_ENDPOINTS.PRODUCT_TOGGLE_STATUS(item.id);
        return null;
    };

    const handleEditItem = (item) => {
        if (item.type === 'service') {
            navigate(`/admin/services/${item.id}/edit`);
        } else if (item.type === 'product') {
            navigate(`/admin/service-products/${item.id}/edit`);
        } else {
            navigate(`/admin/service/category/${item.id}`);
        }
    };

    const handleShowItem = (item) => {
        if (item.type === 'service') {
            navigate(`/admin/services/${item.id}`);
        } else if (item.type === 'product') {
            navigate(`/admin/service-products/${item.id}/edit`);
        }
    };

    const handleToggleActive = async (item) => {
        const endpoint = getToggleEndpoint(item);
        if (!endpoint) return;

        try {
            const token = getToken();
            await axios.patch(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
            setHomeConfigItems((prev) =>
                prev.map((entry) =>
                    homeConfigKey(entry) === homeConfigKey(item)
                        ? { ...entry, is_active: !(entry.is_active ?? true) }
                        : entry
                )
            );
            toast.success(t('admin.paymentGetway.homeCfgStatusUpdated'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.homeCfgFailedStatusUpdate'));
        }
    };

    const handleRemoveFromHome = (item) => {
        confirmAndRemoveHomeConfigItem(item);
    };

    const handleSetQuickAction = (item) => {
        const selectedKey = homeConfigKey(item);
        setHomeConfigItems((prev) =>
            prev.map((entry) => ({
                ...entry,
                is_quick_action: homeConfigKey(entry) === selectedKey ? true : !!entry.is_quick_action,
            }))
        );
        setOpenActionMenuKey(null);
        toast.success(t('admin.paymentGetway.homeCfgAddedQuickActions'));
    };

    const handleRemoveFromQuickAction = (item) => {
        const selectedKey = homeConfigKey(item);
        setHomeConfigItems((prev) =>
            prev.map((entry) => ({
                ...entry,
                is_quick_action: homeConfigKey(entry) === selectedKey ? false : !!entry.is_quick_action,
            }))
        );
        setOpenActionMenuKey(null);
        toast.success(t('admin.paymentGetway.homeCfgRemovedQuickActions'));
    };

    const toggleSelectItem = (itemKey, checked) => {
        setSelectedItemKeys((prev) => {
            if (checked) {
                if (prev.includes(itemKey)) return prev;
                return [...prev, itemKey];
            }
            return prev.filter((key) => key !== itemKey);
        });
    };

    const toggleSelectAll = (checked) => {
        if (checked) {
            setSelectedItemKeys(homeConfigItems.map((item) => homeConfigKey(item)));
        } else {
            setSelectedItemKeys([]);
        }
    };

    const handleBulkRemove = async () => {
        if (selectedItemKeys.length === 0) return;
        const result = await Swal.fire({
            title: t('admin.common.areYouSure'),
            text: t('admin.paymentGetway.homeCfgDeleteBulkConfirm', { count: selectedItemKeys.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.homeCfgYesDeleteThem'),
            cancelButtonText: t('admin.common.cancel'),
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        setHomeConfigItems((prev) => prev.filter((item) => !selectedItemKeys.includes(homeConfigKey(item))));
        toast.info(getRemovalInfoMessage());
        setSelectedItemKeys([]);
    };

    const renderActionsDropdown = (item, menuScope = 'main') => {
        const actionMenuKey = `${menuScope}:${homeConfigKey(item)}`;
        const isOpen = openActionMenuKey === actionMenuKey;

        return (
        <div
            className="dropdown home-config-actions"
            style={{ position: 'relative', zIndex: isOpen ? 5000 : 'auto' }}
        >
            <button
                type="button"
                className="btn btn-sm btn-icon btn-bg-light btn-active-light-primary"
                aria-expanded={isOpen}
                title={t('admin.common.actions')}
                onClick={() =>
                    setOpenActionMenuKey((prev) => (prev === actionMenuKey ? null : actionMenuKey))
                }
            >
                <i className="ki-duotone ki-dots-square fs-2">
                    <span className="path1" />
                    <span className="path2" />
                    <span className="path3" />
                    <span className="path4" />
                </i>
            </button>
            <ul
                className={`dropdown-menu dropdown-menu-end ${isOpen ? 'show' : ''}`}
                style={{
                    zIndex: 6000,
                    position: 'absolute',
                    inset: 'auto 0 0 auto',
                    transform: 'translate(0, calc(100% + 4px))',
                    pointerEvents: 'auto',
                    minWidth: '170px',
                    padding: '0.25rem 0',
                    margin: 0,
                }}
            >
                <li>
                    {(item.type === 'service' || item.type === 'product') && (
                        <button type="button" className="dropdown-item py-2 px-3 fs-7" onClick={() => handleShowItem(item)}>
                            <i className="ki-duotone ki-eye fs-5 me-2">
                                <span className="path1" />
                                <span className="path2" />
                                <span className="path3" />
                            </i>
                            {t('admin.common.show')}
                        </button>
                    )}
                </li>
                <li>
                    {item.is_quick_action ? (
                        <button type="button" className="dropdown-item py-2 px-3 fs-7" onClick={() => handleRemoveFromQuickAction(item)}>
                            <i className="ki-duotone ki-cross-circle fs-5 me-2">
                                <span className="path1" />
                                <span className="path2" />
                            </i>
                            {t('admin.paymentGetway.homeCfgRemoveFromQuickActions')}
                        </button>
                    ) : (
                        <button type="button" className="dropdown-item py-2 px-3 fs-7" onClick={() => handleSetQuickAction(item)}>
                            <i className="ki-duotone ki-flash fs-5 me-2">
                                <span className="path1" />
                                <span className="path2" />
                                <span className="path3" />
                            </i>
                            {t('admin.paymentGetway.homeCfgSetAsQuickAction')}
                        </button>
                    )}
                </li>
                <li>
                    <hr className="dropdown-divider" />
                </li>
                <li>
                    <button type="button" className="dropdown-item py-2 px-3 fs-7" onClick={() => handleToggleActive(item)}>
                        <i className={`ki-duotone ${item.is_active ? 'ki-cross-circle' : 'ki-check-circle'} fs-5 me-2`}>
                            <span className="path1" />
                            <span className="path2" />
                        </i>
                        {item.is_active ? t('admin.common.deactivate') : t('admin.common.activate')}
                    </button>
                </li>
                <li>
                    <button type="button" className="dropdown-item py-2 px-3 fs-7" onClick={() => openSetOrderDialog(item)}>
                        <i className="ki-duotone ki-sort fs-5 me-2">
                            <span className="path1" />
                            <span className="path2" />
                            <span className="path3" />
                        </i>
                        {t('admin.paymentGetway.homeCfgSetOrder')}
                    </button>
                </li>
                <li>
                    <button type="button" className="dropdown-item py-2 px-3 fs-7" onClick={() => handleEditItem(item)}>
                        <i className="ki-duotone ki-pencil fs-5 me-2">
                            <span className="path1" />
                            <span className="path2" />
                        </i>
                        {t('admin.common.edit')}
                    </button>
                </li>
                <li>
                    <hr className="dropdown-divider" />
                </li>
                <li>
                    <button type="button" className="dropdown-item text-danger py-2 px-3 fs-7" onClick={() => handleRemoveFromHome(item)}>
                        <i className="ki-duotone ki-trash fs-5 me-2">
                            <span className="path1" />
                            <span className="path2" />
                            <span className="path3" />
                            <span className="path4" />
                            <span className="path5" />
                        </i>
                        {t('admin.paymentGetway.homeCfgRemoveFromHome')}
                    </button>
                </li>
            </ul>
        </div>
    );
    };

    const statusBadge = (isActive) => (
        <span className={`badge ${isActive ? 'badge-light-success' : 'badge-light-danger'}`}>
            {isActive ? t('admin.common.active') : t('admin.common.inactive')}
        </span>
    );

    const getItemOrder = (item) => {
        const index = homeConfigItems.findIndex((entry) => homeConfigKey(entry) === homeConfigKey(item));
        return index >= 0 ? index + 1 : '-';
    };

    const reorderItems = (activeKey, overKey) => {
        if (!activeKey || !overKey || activeKey === overKey) return;

        setHomeConfigItems((prev) => {
            const oldIndex = prev.findIndex((item) => homeConfigKey(item) === activeKey);
            const newIndex = prev.findIndex((item) => homeConfigKey(item) === overKey);
            if (oldIndex === -1 || newIndex === -1) return prev;

            const updated = [...prev];
            const [moved] = updated.splice(oldIndex, 1);
            updated.splice(newIndex, 0, moved);
            return updated;
        });
    };

    const moveItemToPosition = (itemKey, targetPosition) => {
        setHomeConfigItems((prev) => {
            const fromIndex = prev.findIndex((item) => homeConfigKey(item) === itemKey);
            if (fromIndex === -1) return prev;

            const maxPos = prev.length;
            const normalizedPosition = Math.max(1, Math.min(maxPos, Number(targetPosition) || 1));
            const toIndex = normalizedPosition - 1;
            if (toIndex === fromIndex) return prev;

            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!active?.id || !over?.id) return;
        reorderItems(String(active.id), String(over.id));
        lastDragPairRef.current = '';
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!active?.id || !over?.id) return;

        const activeKey = String(active.id);
        const overKey = String(over.id);
        if (activeKey === overKey) return;

        const pairKey = `${activeKey}->${overKey}`;
        if (lastDragPairRef.current === pairKey) return;

        reorderItems(activeKey, overKey);
        lastDragPairRef.current = pairKey;
    };

    const handleDragCancel = () => {
        lastDragPairRef.current = '';
    };

    const openSetOrderDialog = (item) => {
        const key = homeConfigKey(item);
        const currentIndex = homeConfigItems.findIndex((entry) => homeConfigKey(entry) === key);
        setSetOrderTargetKey(key);
        setSetOrderPosition(String(currentIndex >= 0 ? currentIndex + 1 : 1));
        setShowSetOrderModal(true);
        setOpenActionMenuKey(null);
    };

    const handleConfirmSetOrder = () => {
        if (!setOrderTargetKey) return;
        moveItemToPosition(setOrderTargetKey, setOrderPosition);
        setShowSetOrderModal(false);
        setSetOrderTargetKey(null);
        setSetOrderPosition('');
        toast.success(t('admin.paymentGetway.homeCfgOrderUpdated'));
    };

    const saveHomeScreenConfig = async () => {
        setHomeConfigSaving(true);
        try {
            const token = getToken();
            const payload = {
                items: homeConfigItems.map((item) => ({
                    id: item.id,
                    type: item.type,
                    is_quick_action: !!item.is_quick_action,
                })),
            };

            const response = await axios.put(ADMIN_ENDPOINTS.SERVICES_HOME_SCREEN_CONFIG, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const items = response?.data?.data?.items || [];
            setHomeConfigItems(items);
            setInitialItems(items);
            toast.success(t('admin.paymentGetway.homeCfgSaveSuccess'));
            fetchPreviewPayload(previewMode);
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.homeCfgSaveFailed'));
        } finally {
            setHomeConfigSaving(false);
        }
    };

    const cancelChanges = () => {
        setHomeConfigItems(initialItems);
        toast.info(t('admin.paymentGetway.homeCfgChangesCancelled'));
        fetchPreviewPayload(previewMode);
    };

    const getPreviewItemLabel = (item) =>
        item?.label ||
        item?.name_en ||
        ServiceModel.displayName(item) ||
        item?.name ||
        item?.id ||
        t('admin.paymentGetway.homeCfgItemLabelFallback');

    const getPreviewItemImage = (item) => item?.image || item?.category_image || item?.image_url || null;

    const getChildrenForCategory = (category) => Array.isArray(category?.services) ? category.services : [];
    const getChildrenForService = (service) => Array.isArray(service?.products) ? service.products : [];

    const openPreviewItem = (item) => {
        const type = `${item?.type || ''}`.toLowerCase();
        if (type === 'category') {
            setPreviewSelectedCategory(item);
            setPreviewSelectedService(null);
            setPreviewSelectedProduct(null);
            setPreviewStep('services');
            return;
        }
        if (type === 'service') {
            setPreviewSelectedService(item);
            setPreviewSelectedCategory(null);
            setPreviewSelectedProduct(null);
            setPreviewStep('products');
            return;
        }
        setPreviewSelectedProduct(item);
        setPreviewSelectedCategory(null);
        setPreviewSelectedService(null);
        const forms = getPreviewProductForms(item);
        setPreviewProductForms(forms);
        setPreviewActiveFormIndex(0);
        setPreviewFormValuesById({});
        setPreviewFormErrors({});
        setPreviewFormCompleted(false);
        setPreviewFormSubmitting(false);
        setPreviewStep('form');
    };

    const goPreviewBack = () => {
        if (previewStep === 'services' || previewStep === 'products' || previewStep === 'form') {
            setPreviewStep('root');
            setPreviewSelectedCategory(null);
            setPreviewSelectedService(null);
            setPreviewSelectedProduct(null);
            setPreviewProductForms([]);
            setPreviewActiveFormIndex(0);
            setPreviewFormValuesById({});
            setPreviewFormErrors({});
            setPreviewFormCompleted(false);
            setPreviewFormSubmitting(false);
        }
    };

    const activePreviewForm = previewProductForms[previewActiveFormIndex] || null;
    const activePreviewFormKey = activePreviewForm?.id != null ? String(activePreviewForm.id) : `form_${previewActiveFormIndex}`;
    const activePreviewFormValues = previewFormValuesById[activePreviewFormKey] || {};

    const handlePreviewFormFieldChange = (fieldKey, nextValue) => {
        setPreviewFormValuesById((prev) => ({
            ...prev,
            [activePreviewFormKey]: { ...(prev[activePreviewFormKey] || {}), [fieldKey]: nextValue },
        }));
        setPreviewFormErrors((prev) => {
            if (!prev[fieldKey]) return prev;
            const next = { ...prev };
            delete next[fieldKey];
            return next;
        });
    };

    const handlePreviewFormProcess = async () => {
        if (!activePreviewForm || previewFormSubmitting) return;
        const errors = {};
        getPreviewFormFields(activePreviewForm).forEach((field) => {
            const fieldKey = getPreviewFieldKey(field);
            const value = activePreviewFormValues[fieldKey];
            if (isPreviewRequiredMissing(field, value)) errors[fieldKey] = true;
        });
        if (Object.keys(errors).length > 0) {
            setPreviewFormErrors(errors);
            toast.error(t('admin.paymentGetway.homeCfgPreviewRequiredFields'));
            return;
        }
        setPreviewFormErrors({});

        const formUrl = `${activePreviewForm?.form_url || ''}`.trim();
        if (formUrl) {
            try {
                setPreviewFormSubmitting(true);
                await axios.post(formUrl, activePreviewFormValues);
            } catch (error) {
                toast.error(error.response?.data?.message || t('admin.paymentGetway.homeCfgFormSubmitFailed'));
                return;
            } finally {
                setPreviewFormSubmitting(false);
            }
        }

        const nextIndex = previewActiveFormIndex + 1;
        if (nextIndex < previewProductForms.length) {
            setPreviewActiveFormIndex(nextIndex);
            return;
        }
        setPreviewFormCompleted(true);
    };

    const renderPreviewItems = (items, clickable = false) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div className="text-muted fs-8">{t('admin.paymentGetway.homeCfgNoItemsFound')}</div>;
        }
        return (
            <div
                className="d-grid"
                style={{
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '10px',
                }}
            >
                {items.map((item, index) => (
                    <button
                        type="button"
                        key={`${item?.type || 'item'}-${item?.id || index}`}
                        className="btn p-2"
                        style={{
                            background: '#ffffff',
                            border: '1px solid #edf1f7',
                            borderRadius: '10px',
                            minHeight: 92,
                            cursor: clickable ? 'pointer' : 'default',
                        }}
                        onClick={clickable ? () => openPreviewItem(item) : undefined}
                    >
                        <div className="d-flex flex-column align-items-center justify-content-center text-center">
                            <div
                                className="d-flex align-items-center justify-content-center rounded mb-2"
                                style={{ width: 42, height: 42, background: '#f1f5f9', overflow: 'hidden' }}
                            >
                                {getPreviewItemImage(item) ? (
                                    <img
                                        src={getPreviewItemImage(item)}
                                        alt={getPreviewItemLabel(item)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span className="fw-bold text-primary fs-8">
                                        {String(getPreviewItemLabel(item)).charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div
                                className="fw-semibold text-gray-900 text-truncate"
                                style={{ fontSize: 10, maxWidth: '100%' }}
                                title={getPreviewItemLabel(item)}
                            >
                                {getPreviewItemLabel(item)}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const renderConfigCardContent = (item, dragProps = null, menuScope = 'main') => (
        <div className="card h-100" style={{ overflow: 'visible' }}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedItemKeys.includes(homeConfigKey(item))}
                                onChange={(e) => toggleSelectItem(homeConfigKey(item), e.target.checked)}
                            />
                        </div>
                        {!!item.is_quick_action && (
                            <span className="badge badge-light-warning">{t('admin.paymentGetway.homeCfgQuickActionBadge')}</span>
                        )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {dragProps && (
                            <button
                                type="button"
                                className="btn btn-light btn-active-light-primary btn-sm btn-icon"
                                title={t('admin.paymentGetway.homeCfgReorderAria')}
                                aria-label={t('admin.paymentGetway.homeCfgReorderAria')}
                                {...dragProps.listeners}
                                {...dragProps.attributes}
                            >
                                <i className="ki-duotone ki-arrow-mix fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </button>
                        )}
                        {renderActionsDropdown(item, menuScope)}
                    </div>
                </div>
                <div className="d-flex align-items-center mb-7">
                    <div className="symbol symbol-50px me-5">
                        {item.image ? (
                            <img src={item.image} alt={item.label} className="rounded" />
                        ) : (
                            <span className="symbol-label bg-light-success">
                                <i className="ki-duotone ki-abstract-26 fs-2x text-success">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </span>
                        )}
                    </div>
                    <div className="d-flex flex-column flex-grow-1">
                        <span className="text-gray-900 fs-6 fw-bold">{item.label}</span>
                        <span className="text-muted fw-bold">
                            {item.subtitle || t('admin.paymentGetway.homeCfgItemTypeSubtitle', { type: translateItemType(item.type) })}
                        </span>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-light-dark">#{getItemOrder(item)}</span>
                        <span className="badge badge-light-primary">{translateItemType(item.type)}</span>
                        {statusBadge(item.is_active ?? true)}
                    </div>
                    <button type="button" className="btn btn-sm btn-light-danger" onClick={() => confirmAndRemoveHomeConfigItem(item)}>
                        {t('admin.common.remove')}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSelectedItems = () => {
        const quickActionItems = homeConfigItems.filter((item) => !!item.is_quick_action);

        if (viewMode === 'preview') {
            return (
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                            <h3 className="card-title mb-0">{t('admin.paymentGetway.homeCfgMobilePreviewTitle')}</h3>
                            <div className="text-muted fs-7 mt-1">{t('admin.paymentGetway.homeCfgMobilePreviewSubtitle')}</div>
                        </div>
                        <div className="btn-group">
                            <button
                                type="button"
                                className={`btn btn-sm ${previewMode === 'home' ? 'btn-primary' : 'btn-light-primary'}`}
                                onClick={() => setPreviewMode('home')}
                            >
                                {t('admin.common.home')}
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${previewMode === 'catalog' ? 'btn-primary' : 'btn-light-primary'}`}
                                onClick={() => setPreviewMode('catalog')}
                            >
                                {t('admin.paymentGetway.homeCfgPreviewCatalogTab')}
                            </button>
                        </div>
                    </div>
                    <div className="card-body d-flex justify-content-center">
                        <IPhoneMockup screenWidth={320} frameColor="#111111">
                            <div className="p-3" style={{ background: '#f5f8fc', minHeight: 520 }}>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        {previewStep !== 'root' && (
                                            <button
                                                type="button"
                                                className="btn btn-icon btn-sm btn-light"
                                                onClick={goPreviewBack}
                                                title={t('admin.common.back')}
                                                aria-label={t('admin.common.back')}
                                            >
                                                <i className="ki-duotone ki-arrow-left fs-4">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </button>
                                        )}
                                        <div className="fw-bold" style={{ fontSize: 14 }}>
                                            {previewStep === 'root' &&
                                                (previewMode === 'home'
                                                    ? t('admin.paymentGetway.homeCfgPreviewHomeServicesTitle')
                                                    : t('admin.paymentGetway.homeCfgPreviewCatalogServicesTitle'))}
                                            {previewStep === 'services' && getPreviewItemLabel(previewSelectedCategory)}
                                            {previewStep === 'products' && getPreviewItemLabel(previewSelectedService)}
                                            {previewStep === 'form' && getPreviewItemLabel(previewSelectedProduct)}
                                        </div>
                                    </div>
                                    <span className="badge badge-light-primary">
                                        {previewStep === 'root' && (previewPayload?.items || []).length}
                                        {previewStep === 'services' && getChildrenForCategory(previewSelectedCategory).length}
                                        {previewStep === 'products' && getChildrenForService(previewSelectedService).length}
                                        {previewStep === 'form' && (previewProductForms.length || 1)}
                                    </span>
                                </div>
                                {previewLoading ? (
                                    <div className="text-center text-muted py-10 fs-7">{t('admin.paymentGetway.homeCfgPreviewLoading')}</div>
                                ) : (
                                    <>
                                        {previewStep === 'root' && (
                                            <>
                                                <div className="mb-3">
                                                    <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                                                        {t('admin.paymentGetway.homeCfgPreviewQuickActions')}
                                                    </div>
                                                    {renderPreviewItems(previewPayload?.quick_actions || [], true)}
                                                </div>
                                                <div>
                                                    <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                                                        {t('admin.paymentGetway.homeCfgPreviewItemsSection')}
                                                    </div>
                                                    {renderPreviewItems(previewPayload?.items || [], true)}
                                                </div>
                                            </>
                                        )}
                                        {previewStep === 'services' && (
                                            <div>
                                                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                                                    {t('admin.paymentGetway.homeCfgPreviewServicesSection')}
                                                </div>
                                                {renderPreviewItems(getChildrenForCategory(previewSelectedCategory), true)}
                                            </div>
                                        )}
                                        {previewStep === 'products' && (
                                            <div>
                                                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                                                    {t('admin.paymentGetway.homeCfgPreviewProductsSection')}
                                                </div>
                                                {renderPreviewItems(getChildrenForService(previewSelectedService), true)}
                                            </div>
                                        )}
                                        {previewStep === 'form' && (
                                            <div className="rounded p-3" style={{ background: '#fff', border: '1px solid #edf1f7' }}>
                                                {previewFormCompleted ? (
                                                    <div className="text-center py-5">
                                                        <div className="fw-bold text-success mb-2">{t('admin.paymentGetway.homeCfgPreviewSuccess')}</div>
                                                        <div className="text-muted fs-8">{t('admin.paymentGetway.homeCfgPreviewFormSubmitted')}</div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <div className="fw-semibold" style={{ fontSize: 12 }}>
                                                                {t('admin.paymentGetway.homeCfgPreviewFormProgress', {
                                                                    current: Math.min(previewActiveFormIndex + 1, Math.max(previewProductForms.length, 1)),
                                                                    total: Math.max(previewProductForms.length, 1),
                                                                })}
                                                            </div>
                                                            <span className="badge badge-light-info">
                                                                {t('admin.paymentGetway.homeCfgPreviewProductFormBadge')}
                                                            </span>
                                                        </div>
                                                        <LivePreviewFormFields
                                                            form={activePreviewForm}
                                                            values={activePreviewFormValues}
                                                            errors={previewFormErrors}
                                                            onChange={handlePreviewFormFieldChange}
                                                        />
                                                        <div className="d-flex justify-content-end mt-3">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                onClick={handlePreviewFormProcess}
                                                                disabled={previewFormSubmitting || !activePreviewForm}
                                                            >
                                                                {previewFormSubmitting
                                                                    ? t('admin.paymentGetway.processing')
                                                                    : previewActiveFormIndex + 1 < previewProductForms.length
                                                                        ? t('admin.common.next')
                                                                        : t('admin.paymentGetway.homeCfgProcess')}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </IPhoneMockup>
                    </div>
                </div>
            );
        }

        if (homeConfigItemsLoading) {
            if (viewMode === 'cards') {
                return (
                    <div className="row g-3" style={{ position: 'relative', zIndex: 1 }}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={`card-placeholder-${index}`} className="col-md-6 col-xl-4">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <div className="placeholder-glow mb-4">
                                            <span className="placeholder col-4"></span>
                                        </div>
                                        <div className="d-flex align-items-center mb-7">
                                            <div className="symbol symbol-50px me-5 placeholder-glow">
                                                <span className="placeholder col-12 h-50px rounded"></span>
                                            </div>
                                            <div className="flex-grow-1 placeholder-glow">
                                                <span className="placeholder col-8 d-block mb-2"></span>
                                                <span className="placeholder col-6 d-block"></span>
                                            </div>
                                        </div>
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-12"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            return (
                <div className="card">
                    <div className="card-body pt-0">
                        <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible', position: 'relative', zIndex: 1 }}>
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                        <th className="w-10px"></th>
                                        <th>{t('admin.paymentGetway.homeCfgColOrder')}</th>
                                        <th>{t('admin.paymentGetway.homeCfgColReorder')}</th>
                                        <th>{t('admin.paymentGetway.homeCfgColLabel')}</th>
                                        <th>{t('admin.paymentGetway.homeCfgColType')}</th>
                                        <th>{t('admin.common.status')}</th>
                                        <th>{t('admin.paymentGetway.homeCfgColSubtitle')}</th>
                                        <th className="text-end">{t('admin.paymentGetway.homeCfgColAction')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <tr key={`table-placeholder-${index}`}>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-12"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td><span className="placeholder col-10"></span></td>
                                            <td className="text-end"><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (homeConfigItems.length === 0) {
            return <div className="text-muted">{t('admin.paymentGetway.homeCfgNoItemsSelected')}</div>;
        }

        if (viewMode === 'cards') {
            return (
                <div>
                    {quickActionItems.length > 0 && (
                        <div className="mb-8">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h5 className="mb-0">{t('admin.paymentGetway.homeCfgPreviewQuickActions')}</h5>
                                <span className="badge badge-light-warning">{quickActionItems.length}</span>
                            </div>
                            <div className="row g-3">
                                {quickActionItems.map((item) => (
                                    <div key={`quick-${homeConfigKey(item)}`} className="col-md-6 col-xl-4">
                                        {renderConfigCardContent(item, null, 'quick')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h5 className="mb-0">{t('admin.paymentGetway.homeCfgPreviewItemsSection')}</h5>
                        <span className="badge badge-light-primary">{homeConfigItems.length}</span>
                    </div>
                    <div className="row g-3" style={{ position: 'relative', zIndex: 1 }}>
                        {homeConfigItems.map((item) => (
                            <DraggableItem key={homeConfigKey(item)} id={homeConfigKey(item)} className="col-md-6 col-xl-4">
                                {({ attributes, listeners }) => (
                                    renderConfigCardContent(item, { attributes, listeners }, 'main')
                                )}
                            </DraggableItem>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="card">
                <div className="card-body pt-0">
                    <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible', position: 'relative', zIndex: 1 }}>
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={homeConfigItems.length > 0 && selectedItemKeys.length === homeConfigItems.length}
                                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                            />
                                        </div>
                                    </th>
                                    <th>{t('admin.paymentGetway.homeCfgColOrder')}</th>
                                    <th>{t('admin.paymentGetway.homeCfgColReorder')}</th>
                                    <th>{t('admin.paymentGetway.homeCfgColLabel')}</th>
                                    <th>{t('admin.paymentGetway.homeCfgColType')}</th>
                                    <th>{t('admin.common.status')}</th>
                                    <th>{t('admin.paymentGetway.homeCfgColSubtitle')}</th>
                                    <th className="text-end">{t('admin.paymentGetway.homeCfgColAction')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeConfigItems.map((item) => (
                                    <DraggableTableRow key={homeConfigKey(item)} id={homeConfigKey(item)}>
                                        {({ rowRef, style, attributes, listeners }) => (
                                            <tr ref={rowRef} style={style}>
                                                <td>
                                                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedItemKeys.includes(homeConfigKey(item))}
                                                            onChange={(e) => toggleSelectItem(homeConfigKey(item), e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-dark">#{getItemOrder(item)}</span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-light btn-active-light-primary btn-sm btn-icon me-2"
                                                        title={t('admin.paymentGetway.homeCfgReorderAria')}
                                                        aria-label={t('admin.paymentGetway.homeCfgReorderAria')}
                                                        {...listeners}
                                                        {...attributes}
                                                    >
                                                        <i className="ki-duotone ki-arrow-mix fs-4">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="symbol symbol-40px me-3">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.label} className="rounded" />
                                                            ) : (
                                                                <span className="symbol-label bg-light-success">
                                                                    <i className="ki-duotone ki-abstract-26 fs-3 text-success">
                                                                        <span className="path1"></span>
                                                                        <span className="path2"></span>
                                                                    </i>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="fw-semibold text-gray-900">{item.label}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span>{translateItemType(item.type)}</span>
                                                    {!!item.is_quick_action && (
                                                        <span className="badge badge-light-warning ms-2">
                                                            {t('admin.paymentGetway.homeCfgQuickBadgeShort')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{statusBadge(item.is_active ?? true)}</td>
                                                <td>{item.subtitle || '-'}</td>
                                                <td className="text-end">
                                                    {renderActionsDropdown(item)}
                                                </td>
                                            </tr>
                                        )}
                                    </DraggableTableRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-5">
            <div className="d-flex d-lg-none mb-5">
                {renderSearchAndViewControls(mobileSearchContainerRef, true)}
            </div>
            <div className="pt-0">
                {selectedItemKeys.length > 0 && (
                    <div className="d-flex align-items-center justify-content-between border rounded p-3 mb-5">
                        <div className="fw-semibold">
                            {t('admin.paymentGetway.homeCfgSelectedCount', { count: selectedItemKeys.length })}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-light-primary"
                                onClick={() => toggleSelectAll(true)}
                                disabled={selectedItemKeys.length === homeConfigItems.length}
                            >
                                {t('admin.common.selectAll')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => toggleSelectAll(false)}
                                disabled={selectedItemKeys.length === 0}
                            >
                                {t('admin.common.deselectAll')}
                            </button>
                            <button type="button" className="btn btn-sm btn-light-danger" onClick={handleBulkRemove}>
                                {t('admin.paymentGetway.homeCfgBulkRemove')}
                            </button>
                        </div>
                    </div>
                )}
                <div>
                    {/* <label className="form-label">Selected items for home page</label> */}
                    {viewMode === 'preview' ? (
                        renderSelectedItems()
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                        >
                            {renderSelectedItems()}
                        </DndContext>
                    )}
                </div>
            </div>

            <div className="mt-5 pt-4 border-top">
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-light" onClick={cancelChanges} disabled={homeConfigSaving}>
                        {t('admin.common.cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={saveHomeScreenConfig}
                        disabled={homeConfigSaving}
                    >
                        {homeConfigSaving ? t('admin.common.saving') : t('admin.paymentGetway.homeCfgSaveConfiguration')}
                    </button>
                </div>
            </div>

            {showSetOrderModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('admin.paymentGetway.homeCfgSetOrderModalTitle')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowSetOrderModal(false);
                                        setSetOrderTargetKey(null);
                                        setSetOrderPosition('');
                                    }}
                                    aria-label={t('admin.common.close')}
                                />
                            </div>
                            <div className="modal-body">
                                <label className="form-label">
                                    {t('admin.paymentGetway.homeCfgSetOrderPositionLabel', { max: homeConfigItems.length })}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={homeConfigItems.length}
                                    className="form-control"
                                    value={setOrderPosition}
                                    onChange={(e) => setSetOrderPosition(e.target.value)}
                                    placeholder={t('admin.paymentGetway.homeCfgSetOrderPlaceholder')}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => {
                                        setShowSetOrderModal(false);
                                        setSetOrderTargetKey(null);
                                        setSetOrderPosition('');
                                    }}
                                >
                                    {t('admin.common.cancel')}
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleConfirmSetOrder}>
                                    {t('admin.common.apply')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeScreenServicesConfigPage;
