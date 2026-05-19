import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCountry, updateCountry } from '../../../../services/adminCountriesService';
import { getCurrenciesForSelect } from '../../../../services/adminCurrenciesService';

const AdminCountryEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
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
        setTitle(t('admin.countryForm.editTitle'));
        setActions(null);
        fetchCountry();
        fetchCurrencies();
    }, [id, setTitle, setActions, t, i18n.language]);

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

    const fetchCountry = async () => {
        try {
            const response = await getCountry(id);
            if (response.success) {
                const country = response.data.data;
                setFormData({
                    name: country.name || { en: '', ar: '' },
                    short_name: country.short_name || '',
                    code: country.code || '',
                    currency_id: country.currency_id || '',
                    status: country.status || false
                });
            }
        } catch (error) {
            console.error('Error fetching country:', error);
            toast.error(t('admin.countryForm.fetchFailed'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await updateCountry(id, formData);
            if (response.success) {
                toast.success(t('admin.countryForm.updateSuccess'));
                navigate('/admin/system/countries');
            } else {
                if (response.errors) setErrors(response.errors);
                toast.error(response.error || t('admin.countryForm.updateFailed'));
            }
        } catch (error) {
            console.error('Error updating country:', error);
            toast.error(t('admin.countryForm.updateFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.countryForm.editTitle')}</h3>
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
                            />
                            {errors.short_name && <div className="invalid-feedback">{errors.short_name[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">{t('admin.table.code')}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
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
                                className="form-select"
                                value={formData.status ? '1' : '0'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value === '1' })}
                            >
                                <option value="1">{t('admin.common.active')}</option>
                                <option value="0">{t('admin.common.inactive')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate('/admin/system/countries')}
                    >
                        {t('admin.common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t('admin.countryForm.updating') : t('admin.countryForm.updateCountry')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCountryEdit;
