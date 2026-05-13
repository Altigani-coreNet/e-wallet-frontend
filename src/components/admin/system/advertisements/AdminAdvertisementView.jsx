import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getAdvertisement, deleteAdvertisement } from '../../../../services/adminAdvertisementsService';
import { advertisementAssetUrl } from '../../../../utils/advertisementFormUtils';

const AdminAdvertisementView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [advertisement, setAdvertisement] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAdvertisement = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAdvertisement(id);
            if (response.success) {
                setAdvertisement(response.data.data);
            } else {
                toast.error(response.error || t('admin.settings.advertisements.loadFailed'));
            }
        } catch (error) {
            console.error('Error fetching advertisement:', error);
            toast.error(t('admin.settings.advertisements.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    const handleDelete = useCallback(async () => {
        if (!window.confirm(t('admin.settings.advertisements.deleteViewConfirm'))) {
            return;
        }

        try {
            const response = await deleteAdvertisement(id);
            if (response.success) {
                toast.success(t('admin.settings.advertisements.deletedView'));
                navigate('/admin/system/advertisements');
            } else {
                toast.error(response.error || t('admin.settings.advertisements.deleteViewFailed'));
            }
        } catch (error) {
            console.error('Error deleting advertisement:', error);
            toast.error(t('admin.settings.advertisements.deleteViewFailed'));
        }
    }, [id, navigate, t]);

    useEffect(() => {
        setTitle(t('admin.settings.advertisements.viewTitle'));
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/advertisements/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.edit')}</span>
                </Link>
                <button type="button" onClick={handleDelete} className="btn btn-sm btn-danger">
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
        return () => setActions(null);
    }, [id, setTitle, setActions, t, handleDelete]);

    useEffect(() => {
        fetchAdvertisement();
    }, [fetchAdvertisement]);

    const countryName = () => {
        if (!advertisement?.country) return t('admin.common.na');
        const n = advertisement.country.name;
        if (typeof n === 'object' && n !== null) {
            return i18n.dir() === 'rtl' ? (n.ar || n.en || '') : (n.en || n.ar || '');
        }
        return n || t('admin.common.na');
    };

    const statusActive = advertisement?.status === 'active';

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

    if (!advertisement) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>{t('admin.settings.advertisements.notFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.settings.advertisements.sectionInfo')}</h3>
            </div>

            <div className="card-body">
                {advertisement.image && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-semibold text-muted">{t('admin.settings.advertisements.labelImage')}</label>
                        <div className="col-lg-8">
                            <img src={advertisementAssetUrl(advertisement.image)} alt={advertisement.name} className="img-thumbnail" style={{maxWidth: '400px'}} />
                        </div>
                    </div>
                )}

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.settings.advertisements.labelName')}</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">{advertisement.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.settings.advertisements.labelCountry')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800" dir="auto">{countryName()}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.settings.advertisements.labelStatus')}</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${statusActive ? 'success' : 'danger'}`}>
                            {statusActive ? t('admin.common.active') : t('admin.common.inactive')}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.settings.advertisements.labelStartDate')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{advertisement.start_date || t('admin.common.na')}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.settings.advertisements.labelEndDate')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{advertisement.end_date || t('admin.common.na')}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">{t('admin.systemRoles.colCreatedAt')}</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(advertisement.created_at).toLocaleString(i18n.language)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAdvertisementView;
