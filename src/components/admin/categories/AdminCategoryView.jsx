import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getCategoryById } from '../../../services/adminCategoriesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminCategoryView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Category Details');
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/admin/sales/categories')}
            >
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back to List
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate]);

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
            toast.error('Failed to load category details');
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
                    <div className="text-muted">Category not found</div>
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
                        <h3 className="card-title">Category Information</h3>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Category ID</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">{category.id}</span>
                            </div>
                        </div>
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Name</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(category.name) || 'N/A'}</span>
                            </div>
                        </div>
                        {category.code && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Code</label>
                                <div className="col-lg-8">
                                    <span className="fw-bold fs-6 text-gray-800">{category.code}</span>
                                </div>
                            </div>
                        )}
                        {category.parent && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Parent Category</label>
                                <div className="col-lg-8">
                                    <span className="fw-bold fs-6 text-gray-800">{getTranslatedText(category.parent.name) || 'N/A'}</span>
                                </div>
                            </div>
                        )}
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Created At</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">
                                    {formatDateTime(category.created_at) || 'N/A'}
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
                            <h3 className="card-title">Sub-Categories</h3>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category.children.map((child) => (
                                            <tr key={child.id}>
                                                <td>{child.id}</td>
                                                <td>{getTranslatedText(child.name) || 'N/A'}</td>
                                                <td>{child.code || 'N/A'}</td>
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

