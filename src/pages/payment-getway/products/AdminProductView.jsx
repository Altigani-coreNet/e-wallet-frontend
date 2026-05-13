import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const formatDateTime = (value, fallback) => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
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

const getFormDisplayName = (form, locale = 'en') => {
    if (!form) return '';
    if (form.form_name && typeof form.form_name === 'object') {
        return form.form_name[locale] || form.form_name.en || form.form_name.ar || '';
    }
    if (typeof form.form_name === 'string') return form.form_name;
    return '';
};

const DetailRow = ({ label, children, fallback = 'N/A' }) => (
    <div className="row mb-5">
        <div className="col-lg-4"><span className="fw-bold text-gray-800">{label}</span></div>
        <div className="col-lg-8"><span className="text-gray-700">{children ?? fallback}</span></div>
    </div>
);

const FormPreviewScreen = ({ form, label, t }) => {
    const fields = form?.fields || [];
    return (
        <div className="p-4 bg-white" style={{ height: '100%', overflowY: 'auto' }}>
            <div className="mb-4 pb-3 border-bottom">
                <div className="fw-bold fs-5 text-gray-900">{label || t('admin.paymentGetway.liveFormPreview')}</div>
                <div className="text-muted fs-7 mt-1">{getFormDisplayName(form) || form?.title || t('admin.paymentGetway.mobileServicesForm')}</div>
            </div>
            {fields.length === 0 ? (
                <div className="text-muted">{t('admin.paymentGetway.productsNoFieldsInForm')}</div>
            ) : (
                fields.map((field, idx) => (
                    <div key={field.id || idx} className="mb-4 pb-3 border-bottom border-gray-200">
                        <div className="mb-1"><span className="fw-bold text-gray-800">{t('admin.paymentGetway.productsLabelEn')}</span> <span className="text-gray-700">{field.label_en || t('admin.paymentGetway.dash')}</span></div>
                        <div className="mb-1"><span className="fw-bold text-gray-800">{t('admin.paymentGetway.productsLabelAr')}</span> <span className="text-gray-700">{field.label_ar || t('admin.paymentGetway.dash')}</span></div>
                        <div className="mb-1"><span className="fw-bold text-gray-800">{t('admin.paymentGetway.productsKey')}</span> <span className="text-gray-700 font-monospace">{field.key || t('admin.paymentGetway.dash')}</span></div>
                        <div><span className="fw-bold text-gray-800">{t('admin.paymentGetway.productsType')}</span> <span className="text-gray-700">{field.type || t('admin.paymentGetway.dash')}</span></div>
                    </div>
                ))
            )}
            <div className="d-flex gap-2 mt-5 pt-2">
                <button type="button" className="btn btn-light w-100" disabled>{t('admin.common.cancel')}</button>
                <button type="button" className="btn btn-primary w-100" disabled>{t('admin.common.process')}</button>
            </div>
        </div>
    );
};

const AdminProductView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    useEffect(() => {
        setTitle(t('admin.paymentGetway.productShowTitle'));
        setActions(
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/products')}>
                <i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i>
                {t('admin.paymentGetway.backToList')}
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate, t]);

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
            const message = getPayloadMessage(productResponse) || t('admin.paymentGetway.productFailedLoadDetails');
            toast.error(message);
        }
    }, [productResponse, t]);

    useEffect(() => {
        if (!productError) return;
        const message = productError?.response?.data?.message || productError.message || t('admin.paymentGetway.productFailedLoadDetails');
        toast.error(message);
    }, [productError, t]);

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
    if (!product) return <div className="card"><div className="card-body text-center py-10"><div className="text-muted">{t('admin.paymentGetway.productNotFound')}</div></div></div>;

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
                        <h3 className="card-title mb-0">{t('admin.paymentGetway.productShowTitle')}</h3>
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
                            {t('admin.paymentGetway.homeCfgPreview')}
                        </button>
                    </div>
                    <div className="card-body">
                        {showRefreshing && (
                            <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                                <span className="spinner-border spinner-border-sm"></span>
                                <span>{t('admin.paymentGetway.productRefreshingDetails')}</span>
                            </div>
                        )}
                        <DetailRow label={t('admin.paymentGetway.productsId')}>{product.id}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productNameEnglish')}>{nameEn}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productNameArabic')}>{nameAr}</DetailRow>
                        {(product.sku || product.code) && <DetailRow label={t('admin.paymentGetway.productsSkuCode')}>{product.sku || product.code}</DetailRow>}
                        {product.barcode && <DetailRow label={t('admin.paymentGetway.productsBarcode')}>{product.barcode}</DetailRow>}
                        <DetailRow label={t('admin.paymentGetway.productsTypeId')}>{product.type_id}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productServiceSubCategory')}>{product.service_sub_category_id}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productsServiceUuidFk')}>{product.service_id}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productsServiceRecordId')}>{product?.service?.id || t('admin.paymentGetway.dash')}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.status')}>
                            <span className={`badge badge-${product.status ? 'success' : 'danger'}`}>
                                {product.status ? t('admin.common.active') : t('admin.common.inactive')}
                            </span>
                        </DetailRow>
                        <DetailRow label={t('admin.paymentGetway.viewCreatedCol')}>{formatDateTime(product.created_at, t('admin.paymentGetway.na'))}</DetailRow>
                        {product.updated_at && <DetailRow label={t('admin.paymentGetway.viewLastUpdated')}>{formatDateTime(product.updated_at, t('admin.paymentGetway.na'))}</DetailRow>}
                    </div>
                </div>
            </div>

            <div className="col-md-3">
                <div className="card card-flush">
                    <div className="card-header">
                        <div className="card-title">
                            <h3>{t('admin.paymentGetway.productImage')}</h3>
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
                        <div className="text-muted fs-7">{t('admin.paymentGetway.productImagePreview')}</div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.paymentGetway.productsAdditionalInformation')}</h3>
                    </div>
                    <div className="card-body">
                        <DetailRow label={t('admin.paymentGetway.productsCategory')}>{getTranslatedText(product?.category?.name)}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productsBrand')}>{getTranslatedText(product?.brand?.name)}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productsUnit')}>{getTranslatedText(product?.unit?.name)}</DetailRow>
                        <DetailRow label={t('admin.paymentGetway.productsTax')}>{product?.tax ? `${getTranslatedText(product.tax.name) || t('admin.paymentGetway.dash')} (${product.tax.rate ?? '0'}%)` : t('admin.paymentGetway.dash')}</DetailRow>
                        {(product.base_price != null || product.sale_price != null) && (
                            <DetailRow label={t('admin.paymentGetway.productsPrices')}>
                                {`${t('admin.paymentGetway.productsBase')}: ${product.base_price ?? t('admin.paymentGetway.dash')} | ${t('admin.paymentGetway.productsSale')}: ${product.sale_price ?? t('admin.paymentGetway.dash')}`}
                            </DetailRow>
                        )}
                        {product.quantity !== undefined && product.quantity !== null && (
                            <DetailRow label={t('admin.paymentGetway.productsStockQuantity')}>{String(product.quantity)}</DetailRow>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h3 className="card-title mb-0">{t('admin.paymentGetway.productsServiceForms')}</h3>
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
                                {t('admin.paymentGetway.productsPreviewInMockup')}
                            </button>
                        )}
                    </div>
                    <div className="card-body">
                        {loadingForms ? (
                            <div className="text-muted py-4">{t('admin.paymentGetway.productsLoadingForms')}</div>
                        ) : forms.length === 0 ? (
                            <div className="text-muted">{t('admin.paymentGetway.productsNoServiceForms')}</div>
                        ) : (
                            forms.map((form, formIdx) => (
                                <div className="card border mb-5" key={form.id || formIdx}>
                                    <div className="card-header bg-light py-4">
                                        <span className="fw-bold text-gray-800">{getFormDisplayName(form) || `Form ${formIdx + 1}`}</span>
                                        {form.id != null && <span className="text-muted ms-2">(id: {form.id})</span>}
                                    </div>
                                    <div className="card-body">
                                        <DetailRow label={t('admin.paymentGetway.productsFormNameEn')}>{getFormDisplayName(form, 'en') || t('admin.paymentGetway.dash')}</DetailRow>
                                        <DetailRow label={t('admin.paymentGetway.productsFormNameAr')}>{getFormDisplayName(form, 'ar') || t('admin.paymentGetway.dash')}</DetailRow>
                                        <DetailRow label={t('admin.paymentGetway.productsFormUrl')}>{form.form_url || t('admin.paymentGetway.dash')}</DetailRow>
                                        <div className="fw-bold text-gray-800 mb-3 mt-2">{t('admin.paymentGetway.productsFields')}</div>
                                        {(form.fields || []).length === 0 ? (
                                            <div className="text-muted">{t('admin.paymentGetway.productsNoFields')}</div>
                                        ) : (
                                            (form.fields || []).map((field, fIdx) => (
                                                <div className="card border border-gray-200 mb-4" key={field.id || fIdx}>
                                                    <div className="card-body py-4">
                                                        <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsLabelEnglish')}</span>{' '}<span className="text-gray-700">{field.label_en || t('admin.paymentGetway.dash')}</span></div>
                                                        <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsLabelArabic')}</span>{' '}<span className="text-gray-700">{field.label_ar || t('admin.paymentGetway.dash')}</span></div>
                                                        <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsKey')}</span>{' '}<span className="text-gray-700 font-monospace">{field.key || t('admin.paymentGetway.dash')}</span></div>
                                                        <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsType')}</span>{' '}<span className="text-gray-700">{field.type || t('admin.paymentGetway.dash')}</span></div>
                                                        {field.sort_order != null && (
                                                            <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsSortOrder')}</span>{' '}<span className="text-gray-700">{String(field.sort_order)}</span></div>
                                                        )}
                                                        {field.is_required !== undefined && (
                                                            <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsRequired')}</span>{' '}<span className="text-gray-700">{field.is_required ? t('admin.paymentGetway.productsYes') : t('admin.paymentGetway.productsNo')}</span></div>
                                                        )}
                                                        {field.status !== undefined && (
                                                            <div className="mb-2"><span className="fw-bold">{t('admin.paymentGetway.productsFieldStatus')}</span>{' '}<span className="text-gray-700">{field.status ? t('admin.common.active') : t('admin.common.inactive')}</span></div>
                                                        )}
                                                        {Array.isArray(field.options) && field.options.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="fw-bold mb-2">{t('admin.paymentGetway.productsOptions')}</div>
                                                                <ul className="mb-0 ps-4">
                                                                    {field.options.map((opt, oIdx) => (
                                                                        <li key={opt.id || oIdx} className="text-gray-700 mb-1">
                                                                            <span className="fw-bold">EN</span> {opt.label_en || t('admin.paymentGetway.dash')} ·{' '}
                                                                            <span className="fw-bold">AR</span> {opt.label_ar || t('admin.paymentGetway.dash')} ·{' '}
                                                                            <span className="fw-bold">{t('admin.paymentGetway.productsValue')}</span> <span className="font-monospace">{opt.value ?? t('admin.paymentGetway.dash')}</span>
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
                                <h5 className="modal-title">{t('admin.paymentGetway.productsFormsPreview')}</h5>
                                <button type="button" className="btn-close" onClick={() => setPreviewOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                {loadingForms ? (
                                    <div className="text-center py-5">{t('admin.paymentGetway.productsLoadingForms')}</div>
                                ) : forms.length === 0 ? (
                                    <div className="text-muted">{t('admin.paymentGetway.productsNoFormsAvailable')}</div>
                                ) : (
                                    <div className="row g-6">
                                        <div className="col-lg-6">
                                            <div className="d-flex justify-content-center">
                                                <IPhoneMockup screenWidth={320} frameColor="#000000">
                                                    <FormPreviewScreen
                                                        form={forms[activeFormIndex]}
                                                        label={nameEn || nameAr || t('admin.paymentGetway.liveFormPreview')}
                                                        t={t}
                                                    />
                                                </IPhoneMockup>
                                            </div>
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="fw-semibold mb-3">{t('admin.paymentGetway.productsServiceForms')}</div>
                                            <div className="list-group">
                                                {forms.map((form, idx) => (
                                                    <button
                                                        key={form.id || idx}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action ${idx === activeFormIndex ? 'active' : ''}`}
                                                        onClick={() => setActiveFormIndex(idx)}
                                                    >
                                                        {getFormDisplayName(form) || t('admin.paymentGetway.catalogFormWithIndex', { index: idx + 1 })}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setPreviewOpen(false)}>
                                    {t('admin.common.close')}
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

