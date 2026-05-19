import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCity, deleteCity } from '../../../../services/adminCitiesService';

const AdminCityView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [city, setCity] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleDelete = useCallback(async () => {
        if (!window.confirm(t('admin.cityForm.deleteConfirm'))) {
            return;
        }

        try {
            const response = await deleteCity(id);
            if (response.success) {
                toast.success(t('admin.cityForm.deleted'));
                navigate('/admin/system/cities');
            } else {
                toast.error(response.error || t('admin.cityForm.deleteFailed'));
            }
        } catch (error) {
            console.error('Error deleting city:', error);
            toast.error(t('admin.cityForm.deleteFailed'));
        }
    }, [id, navigate, t]);

    useEffect(() => {
        setTitle(t('admin.cityForm.viewTitle'));
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/cities/${id}/edit`} className="btn btn-sm btn-primary">
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
        fetchCity();
        return () => setActions(null);
    }, [id, setTitle, setActions, t, i18n.language, handleDelete]);

    const fetchCity = async () => {
        setLoading(true);
        try {
            const response = await getCity(id);
            if (response.success) {
                setCity(response.data.data);
            } else {
                toast.error(response.error || t('admin.cityForm.fetchFailed'));
            }
        } catch (error) {
            console.error('Error fetching city:', error);
            toast.error(t('admin.cityForm.fetchFailed'));
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

    if (!city) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>{t('admin.cityForm.notFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.cityForm.infoCard')}</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.nameEn')}</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof city.name === 'object' ? city.name.en : city.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.nameAr')}</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof city.name === 'object' ? city.name.ar : city.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.table.country')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {city.country ? (typeof city.country.name === 'object' ? city.country.name.en : city.country.name) : t('admin.common.na')}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.common.status')}</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${city.status ? 'success' : 'danger'}`}>
                            {city.status ? t('admin.common.active') : t('admin.common.inactive')}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.common.createdAt')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(city.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCityView;
