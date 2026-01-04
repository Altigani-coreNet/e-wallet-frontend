import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminTag } from '../../../services/adminTagsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminTagView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    useEffect(() => {
        setTitle('Tag Details');
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/admin/sales/tags')}
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
        data: tagResponse,
        isLoading,
        isFetching,
        error: tagError,
    } = useAdminTag(id);

    const tag = useMemo(() => {
        if (!tagResponse || tagResponse.success === false) return tagResponse?.data || null;
        return tagResponse.data || tagResponse.tag || null;
    }, [tagResponse]);

    useEffect(() => {
        if (!tagResponse) return;
        if (tagResponse.success === false) {
            const message = tagResponse?.message || tagResponse?.error || tagResponse?.data?.message || 'Failed to load tag details';
            toast.error(message);
        }
    }, [tagResponse]);

    useEffect(() => {
        if (!tagError) return;
        const message = tagError?.response?.data?.message || tagError.message || 'Failed to load tag details';
        toast.error(message);
    }, [tagError]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!tag) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Tag not found</div>
                </div>
            </div>
        );
    }

    const renderAdditionalInfo = () => {
        const additionalEntries = Object.entries(tag)
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
                <h3 className="card-title">Tag Information</h3>
            </div>
            <div className="card-body">
                {isFetching && !isLoading && (
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                        <span className="spinner-border spinner-border-sm"></span>
                        <span>Refreshing tag details...</span>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Tag ID</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{tag.id}</span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(tag.name) || 'N/A'}</span>
                    </div>
                </div>
                {tag.slug && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Slug</label>
                        <div className="col-lg-8">
                            <span className="badge badge-light-primary fs-6">{tag.slug}</span>
                        </div>
                    </div>
                )}
                {tag.description && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Description</label>
                        <div className="col-lg-8">
                            <span className="fw-bold fs-6 text-gray-800">{getTranslatedText(tag.description) || 'N/A'}</span>
                        </div>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Country</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {tag.country?.name || tag.country_name || tag.country_id || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(tag.created_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(tag.updated_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                {renderAdditionalInfo()}
            </div>
        </div>
    );
};

export default AdminTagView;


