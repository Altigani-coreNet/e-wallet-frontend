import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { createCountry } from '../../../../services/adminCountriesService';
import { getCurrenciesForSelect } from '../../../../services/adminCurrenciesService';

const AdminCountryCreate = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: { en: '', ar: '' },
        short_name: '',
        code: '',
        currency_id: '',
        status: true
    });
    const [errors, setErrors] = useState({});
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => {
        setTitle(t('admin.countryForm.createTitle'));
        setActions(null);
        fetchCurrencies();
    }, [setTitle, setActions, t, i18n.language]);

    const fetchCurrencies = async () => {
        try {
            const response = await getCurrenciesForSelect();
            if (!response.success) {
                toast.error(response.error || t('admin.countryForm.loadCurrenciesFailed'));
                return;
            }

            const payload = response.data?.data ?? response.data;
            const options = Array.isArray(payload) ? payload : [];
            setCurrencies(options);
        } catch (error) {
            console.error('Error fetching currencies:', error);
            toast.error(t('admin.countryForm.loadCurrenciesFailed'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await createCountry(formData);
            if (response.success) {
                toast.success(t('admin.countryForm.createSuccess'));
                navigate('/admin/system/countries');
            } else {
                if (response.errors) setErrors(response.errors);
                toast.error(response.error || t('admin.countryForm.createFailed'));
            }
        } catch (error) {
            console.error('Error creating country:', error);
            toast.error(t('admin.countryForm.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.countryForm.createHeading')}</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 mb-5">
                            <label className="form-label required">{t('admin.table.nameEn')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors['name.en'] ? 'is-invalid' : ''}`}
                                value={formData.name.en}
                                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                placeholder={t('admin.countryForm.nameEnPlaceholder')}
                            />
                            {errors['name.en'] && <div className="invalid-feedback">{errors['name.en'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">{t('admin.table.nameAr')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors['name.ar'] ? 'is-invalid' : ''}`}
                                value={formData.name.ar}
                                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                                placeholder={t('admin.countryForm.nameArPlaceholder')}
                                dir="rtl"
                            />
                            {errors['name.ar'] && <div className="invalid-feedback">{errors['name.ar'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">{t('admin.table.shortName')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.short_name ? 'is-invalid' : ''}`}
                                value={formData.short_name}
                                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                                placeholder={t('admin.countryForm.shortNamePlaceholder')}
                            />
                            {errors.short_name && <div className="invalid-feedback">{errors.short_name[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">{t('admin.table.code')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder={t('admin.countryForm.codePlaceholder')}
                            />
                            {errors.code && <div className="invalid-feedback">{errors.code[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">{t('admin.common.currency')}</label>
                            <select
                                className={`form-select ${errors.currency_id ? 'is-invalid' : ''}`}
                                value={formData.currency_id}
                                onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                            >
                                <option value="">{t('admin.countryForm.selectCurrency')}</option>
                                {currencies.map((currency) => (
                                    <option key={currency.id} value={currency.id}>
                                        {currency.text || currency.currency_code || currency.name || currency.id}
                                    </option>
                                ))}
                            </select>
                            {errors.currency_id && <div className="invalid-feedback">{errors.currency_id[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">{t('admin.common.status')}</label>
                            <select
                                className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                value={formData.status ? '1' : '0'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value === '1' })}
                            >
                                <option value="1">{t('admin.common.active')}</option>
                                <option value="0">{t('admin.common.inactive')}</option>
                            </select>
                            {errors.status && <div className="invalid-feedback">{errors.status[0]}</div>}
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate('/admin/system/countries')}
                        disabled={loading}
                    >
                        {t('admin.common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t('admin.countryForm.creating') : t('admin.countryForm.createCountry')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCountryCreate;
