import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getCategoryById } from '../../../services/adminCategoriesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminCategoryView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle(t('admin.categoryView.title'));
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/admin/sales/categories')}
            >
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.categoryView.backToList')}
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate, t]);

    useEffect(() => {
        fetchCategory();
    }, [id]);

    const fetchCategory = async () => {
        try {
            setLoading(true);
            const response = await getCategoryById(id);
            if (response.success) {
                setCategory(response.data);
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            toast.error(t('admin.categoryView.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!category) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">{t('admin.categoryView.notFound')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="row g-5 g-xl-8">
            {/* Category Information */}
            <div className="col-xl-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.categoryView.infoCard')}</h3>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.categoryView.id')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">{category.id}</span>
                            </div>
                        </div>
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.categoryView.name')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(category.name, i18n.language) || t('admin.common.na')}</span>
                            </div>
                        </div>
                        {category.code && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('admin.categoryView.code')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bold fs-6 text-gray-800">{category.code}</span>
                                </div>
                            </div>
                        )}
                        {category.parent && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('admin.categoryView.parentCategory')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bold fs-6 text-gray-800">{getTranslatedText(category.parent.name, i18n.language) || t('admin.common.na')}</span>
                                </div>
                            </div>
                        )}
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.categoryView.createdAt')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">
                                    {formatDateTime(category.created_at, i18n.language) || t('admin.common.na')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Categories */}
            {category.children && category.children.length > 0 && (
                <div className="col-xl-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('admin.categoryView.subCategories')}</h3>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th>{t('admin.categoryView.subId')}</th>
                                            <th>{t('admin.categoryView.subName')}</th>
                                            <th>{t('admin.categoryView.subCode')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category.children.map((child) => (
                                            <tr key={child.id}>
                                                <td>{child.id}</td>
                                                <td>{getTranslatedText(child.name, i18n.language) || t('admin.common.na')}</td>
                                                <td>{child.code || t('admin.common.na')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoryView;

