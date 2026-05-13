import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fetchServiceCategoryDetails } from '../../../services/serviceCategoriesService';
import LoadingSpinner from '../../../common/LoadingSpinner';
import { formatDateTime } from '../../../utils/helpers';

const AdminServiceCategoryView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle(t('admin.paymentGetway.catViewTitle'));
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() =>
                    navigate(`/admin/service/category/type/${category?.type === 'partner' ? 'partner' : 'service'}`)
                }
            >
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.paymentGetway.catViewBackToList')}
            </button>
        );

        return () => setActions(null);
    }, [navigate, setActions, setTitle, category, t]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetchServiceCategoryDetails(id);
                if (response?.success) {
                    setCategory(response.data);
                }
            } catch (error) {
                toast.error(error?.response?.data?.message || t('admin.paymentGetway.catViewLoadFailed'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, t]);

    const displayName = (row) => {
        if (!row) return t('admin.common.na');
        if (i18n.dir() === 'rtl') {
            return row.name_ar || row.name_en || row.name || t('admin.common.na');
        }
        return row.name_en || row.name_ar || row.name || t('admin.common.na');
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!category) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">{t('admin.paymentGetway.catViewNotFound')}</div>
                </div>
            </div>
        );
    }

    const typeLabel =
        category.type === 'partner'
            ? t('admin.paymentGetway.catViewTypePartner')
            : t('admin.paymentGetway.catViewTypeService');

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.paymentGetway.catViewSectionInfo')}</h3>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.paymentGetway.catViewLabelName')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800" dir="auto">
                                    {displayName(category)}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.paymentGetway.catViewLabelCode')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">{category.code || t('admin.common.na')}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.paymentGetway.catViewLabelType')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800 text-capitalize">{typeLabel}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.paymentGetway.catViewLabelParent')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800" dir="auto">
                                    {category.parent ? displayName(category.parent) : t('admin.paymentGetway.catViewRootCategory')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.paymentGetway.status')}</label>
                            <div className="col-lg-8">
                                <span className={`badge badge-light-${category.is_active ? 'success' : 'danger'}`}>
                                    {category.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.paymentGetway.catViewLabelCreatedAt')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">
                                    {formatDateTime(category.created_at) || t('admin.common.na')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.paymentGetway.catViewSectionSubCategories')}</h3>
                    </div>
                    <div className="card-body">
                        {!category.sub_categories || category.sub_categories.length === 0 ? (
                            <div className="text-muted">{t('admin.paymentGetway.catViewNoSubCategories')}</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th>{t('admin.paymentGetway.catViewSubColName')}</th>
                                            <th>{t('admin.paymentGetway.catViewSubColCode')}</th>
                                            <th>{t('admin.paymentGetway.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category.sub_categories.map((child) => (
                                            <tr key={child.id}>
                                                <td dir="auto">{displayName(child)}</td>
                                                <td>{child.code || t('admin.common.na')}</td>
                                                <td>
                                                    <span className={`badge badge-light-${child.is_active ? 'success' : 'danger'}`}>
                                                        {child.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminServiceCategoryView;
