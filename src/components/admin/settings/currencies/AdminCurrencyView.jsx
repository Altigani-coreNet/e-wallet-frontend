import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCurrency } from '../../../../services/adminCurrenciesService';

const getCurrencyCodeTranslations = (currency) => {
    const translations = currency?.currency_code_translations;
    if (translations && typeof translations === 'object') {
        return {
            en: translations.en || '',
            ar: translations.ar || ''
        };
    }

    const rawCode = currency?.currency_code;
    if (rawCode && typeof rawCode === 'object') {
        return {
            en: rawCode.en || '',
            ar: rawCode.ar || ''
        };
    }

    const fallback = rawCode || '';
    return { en: fallback, ar: fallback };
};

const getSymbolTranslations = (currency) => {
    const translations = currency?.symbol_translations;
    if (translations && typeof translations === 'object') {
        return {
            en: translations.en || '',
            ar: translations.ar || ''
        };
    }

    const rawSymbol = currency?.symbol;
    if (rawSymbol && typeof rawSymbol === 'object') {
        return {
            en: rawSymbol.en || '',
            ar: rawSymbol.ar || ''
        };
    }

    const fallback = rawSymbol || '';
    return { en: fallback, ar: fallback };
};

const AdminCurrencyView = () => {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState(null);

    const fetchCurrency = useCallback(async () => {
        setLoading(true);
        const response = await getCurrency(id);
        setLoading(false);
        if (response.success) {
            setCurrency(response.data.data || response.data);
        } else {
            toast.error(response.error || t('admin.settings.currencies.fetchFailed'));
            navigate('/admin/settings/currencies');
        }
    }, [id, navigate, t]);

    useEffect(() => {
        setTitle(t('admin.settings.currencies.viewTitle'));
        setActions(
            <Link to={`/admin/settings/currencies/${id}/edit`} className="btn btn-sm btn-primary">
                <i className="ki-duotone ki-pencil fs-3"><span className="path1"></span><span className="path2"></span></i>
                <span className="d-none d-md-inline ms-1">{t('admin.common.edit')}</span>
            </Link>
        );
        return () => setActions(null);
    }, [id, setTitle, setActions, t]);

    useEffect(() => {
        fetchCurrency();
    }, [fetchCurrency]);

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <div className="card">
                        <div className="card-body text-center py-20">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{t('admin.common.loading')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currency) return null;

    const currencyCodeTranslations = getCurrencyCodeTranslations(currency);
    const symbolTranslations = getSymbolTranslations(currency);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.settings.currencies.cardDetails')}</h3>
                    <div className="card-toolbar">
                        <button type="button" className="btn btn-sm btn-light" onClick={() => navigate('/admin/settings/currencies')}>
                            {t('admin.settings.backToList')}
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelId')}</label><div className="col-lg-8"><span className="fw-bolder fs-6 text-dark">{currency.id}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelCountry')}</label><div className="col-lg-8 fv-row"><span className="fw-bold fs-6">{currency.country}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelName')}</label><div className="col-lg-8"><span className="fw-bold fs-6">{currency.name}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelSymbolEn')}</label><div className="col-lg-8"><span className="fw-bolder fs-6 text-dark">{symbolTranslations.en || '-'}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelSymbolAr')}</label><div className="col-lg-8"><span className="fw-bolder fs-6 text-dark">{symbolTranslations.ar || '-'}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelCodeEn')}</label><div className="col-lg-8"><span className="badge badge-light-info">{currencyCodeTranslations.en || '-'}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelCodeAr')}</label><div className="col-lg-8"><span className="badge badge-light-primary">{currencyCodeTranslations.ar || '-'}</span></div></div>
                    <div className="row mb-7"><label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelCreatedAt')}</label><div className="col-lg-8"><span className="fw-bold fs-6">{new Date(currency.created_at).toLocaleString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></div>
                    {currency.updated_at && (
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.settings.currencies.labelLastUpdated')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6">{new Date(currency.updated_at).toLocaleString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminCurrencyView;
