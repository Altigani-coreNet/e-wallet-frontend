import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCountry, deleteCountry } from '../../../../services/adminCountriesService';

const AdminCountryView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [country, setCountry] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleDelete = useCallback(async () => {
        if (!window.confirm(t('admin.countryForm.deleteConfirm'))) {
            return;
        }

        try {
            const response = await deleteCountry(id);
            if (response.success) {
                toast.success(t('admin.countryForm.deleted'));
                navigate('/admin/system/countries');
            } else {
                toast.error(response.error || t('admin.countryForm.deleteFailed'));
            }
        } catch (error) {
            console.error('Error deleting country:', error);
            toast.error(t('admin.countryForm.deleteFailed'));
        }
    }, [id, navigate, t]);

    useEffect(() => {
        setTitle(t('admin.countryForm.viewTitle'));
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/countries/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.edit')}</span>
                </Link>
                <button onClick={handleDelete} className="btn btn-sm btn-danger">
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.delete')}</span>
                </button>
            </div>
        );
        fetchCountry();
        return () => setActions(null);
    }, [id, setTitle, setActions, t, i18n.language, handleDelete]);

    const fetchCountry = async () => {
        setLoading(true);
        try {
            const response = await getCountry(id);
            if (response.success) {
                setCountry(response.data.data);
            } else {
                toast.error(response.error || t('admin.countryForm.fetchFailed'));
            }
        } catch (error) {
            console.error('Error fetching country:', error);
            toast.error(t('admin.countryForm.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!country) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>{t('admin.countryForm.notFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.countryForm.infoCard')}</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.nameEn')}</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof country.name === 'object' ? country.name.en : country.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.nameAr')}</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof country.name === 'object' ? country.name.ar : country.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.shortName')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{country.short_name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.code')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{country.code || t('admin.common.na')}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.currencyCode')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{country.currency_code || t('admin.common.na')}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.common.status')}</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${country.status ? 'success' : 'danger'}`}>
                            {country.status ? t('admin.common.active') : t('admin.common.inactive')}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.common.createdAt')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(country.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCountryView;
