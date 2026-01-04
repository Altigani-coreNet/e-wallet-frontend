import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminUnit } from '../../../services/adminUnitsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminUnitView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    useEffect(() => {
        setTitle('Unit Details');
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/admin/sales/units')}
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
        data: unitResponse,
        isLoading,
        isFetching,
        error: unitError,
    } = useAdminUnit(id);

    const unit = useMemo(() => {
        if (!unitResponse || unitResponse.success === false) return unitResponse?.data || null;
        return unitResponse.data || unitResponse.unit || null;
    }, [unitResponse]);

    useEffect(() => {
        if (!unitResponse) return;
        if (unitResponse.success === false) {
            const message = unitResponse?.message || unitResponse?.error || unitResponse?.data?.message || 'Failed to load unit details';
            toast.error(message);
        }
    }, [unitResponse]);

    useEffect(() => {
        if (!unitError) return;
        const message = unitError?.response?.data?.message || unitError.message || 'Failed to load unit details';
        toast.error(message);
    }, [unitError]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!unit) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Unit not found</div>
                </div>
            </div>
        );
    }

    const renderAdditionalInfo = () => {
        const additionalEntries = Object.entries(unit)
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
                <h3 className="card-title">Unit Information</h3>
            </div>
            <div className="card-body">
                {isFetching && !isLoading && (
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                        <span className="spinner-border spinner-border-sm"></span>
                        <span>Refreshing unit details...</span>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Unit ID</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{unit.id}</span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(unit.name) || 'N/A'}</span>
                    </div>
                </div>
                {unit.slug && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Slug</label>
                        <div className="col-lg-8">
                            <span className="badge badge-light-primary fs-6">{unit.slug}</span>
                        </div>
                    </div>
                )}
                {unit.description && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Description</label>
                        <div className="col-lg-8">
                            <span className="fw-bold fs-6 text-gray-800">{getTranslatedText(unit.description) || 'N/A'}</span>
                        </div>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Country</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {unit.country?.name || unit.country_name || unit.country_id || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(unit.created_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(unit.updated_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                {renderAdditionalInfo()}
            </div>
        </div>
    );
};

export default AdminUnitView;


