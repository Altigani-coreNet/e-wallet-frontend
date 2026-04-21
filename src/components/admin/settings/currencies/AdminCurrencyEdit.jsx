import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCurrency, updateCurrency } from '../../../../services/adminCurrenciesService';

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

const AdminCurrencyEdit = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({ country: '', name: '', symbol_en: '', symbol_ar: '', currency_code_en: '', currency_code_ar: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Edit Currency');
        setActions(null);
        fetchCurrency();
    }, [setTitle, setActions, id]);

    const fetchCurrency = async () => {
        setFetching(true);
        const response = await getCurrency(id);
        setFetching(false);
        if (response.success) {
            const data = response.data.data || response.data;
            const codeTranslations = getCurrencyCodeTranslations(data);
            const symbolTranslations = getSymbolTranslations(data);
            setFormData({
                country: data.country || '',
                name: data.name || '',
                symbol_en: symbolTranslations.en,
                symbol_ar: symbolTranslations.ar,
                currency_code_en: codeTranslations.en,
                currency_code_ar: codeTranslations.ar
            });
        } else {
            toast.error(response.error || 'Failed to fetch currency');
            navigate('/admin/settings/currencies');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        const payload = {
            country: formData.country,
            name: formData.name,
            symbol: {
                en: formData.symbol_en,
                ar: formData.symbol_ar
            },
            currency_code: {
                en: formData.currency_code_en,
                ar: formData.currency_code_ar
            }
        };
        const response = await updateCurrency(id, payload);
        setLoading(false);
        if (response.success) {
            toast.success('Currency updated successfully');
            navigate('/admin/settings/currencies');
        } else {
            toast.error(response.error || 'Failed to update currency');
            if (response.errors) setErrors(response.errors);
        }
    };

    if (fetching) return <div className="post d-flex flex-column-fluid" id="kt_post"><div id="kt_content_container" className="container-fluid"><div className="card"><div className="card-body text-center py-20"><div className="spinner-border text-primary"></div></div></div></div></div>;

    return (
        <>
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Currency Information</h3></div>
                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="row mb-6">
                                <div className="col-lg-6">
                                    <label className="form-label required">Country</label>
                                    <input type="text" name="country" className={`form-control ${errors.country ? 'is-invalid' : ''}`} value={formData.country} onChange={handleChange} required />
                                    {errors.country && <div className="invalid-feedback">{errors.country[0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">Name</label>
                                    <input type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={handleChange} required />
                                    {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                                </div>
                            </div>
                            <div className="row mb-6">
                                <div className="col-lg-6">
                                    <label className="form-label required">Symbol (English)</label>
                                    <input type="text" name="symbol_en" className={`form-control ${errors['symbol.en'] ? 'is-invalid' : ''}`} value={formData.symbol_en} onChange={handleChange} required />
                                    {errors['symbol.en'] && <div className="invalid-feedback">{errors['symbol.en'][0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">Symbol (Arabic)</label>
                                    <input type="text" name="symbol_ar" className={`form-control ${errors['symbol.ar'] ? 'is-invalid' : ''}`} value={formData.symbol_ar} onChange={handleChange} required />
                                    {errors['symbol.ar'] && <div className="invalid-feedback">{errors['symbol.ar'][0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">Currency Code (English)</label>
                                    <input type="text" name="currency_code_en" className={`form-control ${errors['currency_code.en'] ? 'is-invalid' : ''}`} value={formData.currency_code_en} onChange={handleChange} required />
                                    {errors['currency_code.en'] && <div className="invalid-feedback">{errors['currency_code.en'][0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">Currency Code (Arabic)</label>
                                    <input type="text" name="currency_code_ar" className={`form-control ${errors['currency_code.ar'] ? 'is-invalid' : ''}`} value={formData.currency_code_ar} onChange={handleChange} required />
                                    {errors['currency_code.ar'] && <div className="invalid-feedback">{errors['currency_code.ar'][0]}</div>}
                                </div>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-end py-6 px-9">
                            <button type="button" className="btn btn-light btn-active-light-primary me-2" onClick={() => navigate('/admin/settings/currencies')}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Update Currency'}</button>
                        </div>
                    </form>
                </div>
        </>
    );
};

export default AdminCurrencyEdit;


