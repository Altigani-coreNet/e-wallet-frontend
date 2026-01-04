import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminBrand } from '../../../services/adminBrandsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminBrandView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    useEffect(() => {
        setTitle('Brand Details');
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/admin/sales/brands')}
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

    const {
        data: brandResponse,
        isLoading,
        isFetching,
        error: brandError,
    } = useAdminBrand(id);

    const brand = useMemo(() => {
        if (!brandResponse || brandResponse.success === false) return brandResponse?.data || null;
        return brandResponse.data || brandResponse.brand || null;
    }, [brandResponse]);

    useEffect(() => {
        if (!brandResponse) return;
        if (brandResponse.success === false) {
            const message = brandResponse?.message || brandResponse?.error || brandResponse?.data?.message || 'Failed to load brand details';
            toast.error(message);
        }
    }, [brandResponse]);

    useEffect(() => {
        if (!brandError) return;
        const message = brandError?.response?.data?.message || brandError.message || 'Failed to load brand details';
        toast.error(message);
    }, [brandError]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!brand) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Brand not found</div>
                </div>
            </div>
        );
    }

    const renderAdditionalInfo = () => {
        const additionalEntries = Object.entries(brand)
            .filter(([key]) => !['id', 'name', 'slug', 'description', 'country_id', 'created_at', 'updated_at'].includes(key));

        if (additionalEntries.length === 0) {
            return null;
        }

        return (
            <>
                <div className="separator separator-dashed my-7"></div>
                <h4 className="fw-bold mb-6">Additional Information</h4>
                {additionalEntries.map(([key, value]) => (
                    <div className="row mb-7" key={key}>
                        <label className="col-lg-4 fw-bold text-muted text-capitalize">{key.replace(/_/g, ' ')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bold fs-6 text-gray-800">{String(value ?? 'N/A')}</span>
                        </div>
                    </div>
                ))}
            </>
        );
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Brand Information</h3>
            </div>
            <div className="card-body">
                {isFetching && !isLoading && (
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                        <span className="spinner-border spinner-border-sm"></span>
                        <span>Refreshing brand details...</span>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Brand ID</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{brand.id}</span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(brand.name) || 'N/A'}</span>
                    </div>
                </div>
                {brand.slug && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Slug</label>
                        <div className="col-lg-8">
                            <span className="badge badge-light-primary fs-6">{brand.slug}</span>
                        </div>
                    </div>
                )}
                {brand.description && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Description</label>
                        <div className="col-lg-8">
                            <span className="fw-bold fs-6 text-gray-800">{getTranslatedText(brand.description) || 'N/A'}</span>
                        </div>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Country</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {brand.country?.name || brand.country_name || brand.country_id || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(brand.created_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(brand.updated_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                {renderAdditionalInfo()}
            </div>
        </div>
    );
};

export default AdminBrandView;


