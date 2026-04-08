import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fetchServiceCategoryDetails } from '../../../services/serviceCategoriesService';
import LoadingSpinner from '../../../common/LoadingSpinner';
import { formatDateTime } from '../../../utils/helpers';

const AdminServiceCategoryView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Service Category Details');
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
                Back to List
            </button>
        );

        return () => setActions(null);
    }, [navigate, setActions, setTitle, category]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetchServiceCategoryDetails(id);
                if (response?.success) {
                    setCategory(response.data);
                }
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to load category details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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
            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Category Information</h3>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Name</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">{category.name_en || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Code</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">{category.code || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Type</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800 text-capitalize">
                                    {category.type === 'partner' ? 'Partner' : 'Service'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Parent Category</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">{category.parent?.name_en || 'Root Category'}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Status</label>
                            <div className="col-lg-8">
                                <span className={`badge badge-light-${category.is_active ? 'success' : 'danger'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Created At</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">{formatDateTime(category.created_at) || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Sub-Categories</h3>
                    </div>
                    <div className="card-body">
                        {!category.sub_categories || category.sub_categories.length === 0 ? (
                            <div className="text-muted">No sub-categories found.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th>Name</th>
                                            <th>Code</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category.sub_categories.map((child) => (
                                            <tr key={child.id}>
                                                <td>{child.name_en || 'N/A'}</td>
                                                <td>{child.code || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge badge-light-${child.is_active ? 'success' : 'danger'}`}>
                                                        {child.is_active ? 'Active' : 'Inactive'}
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
