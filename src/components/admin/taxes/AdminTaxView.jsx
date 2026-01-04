import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminTax } from '../../../services/adminTaxesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminTaxView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    useEffect(() => {
        setTitle('Tax Details');
        setActions(
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/admin/sales/taxes')}
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
        data: taxResponse,
        isLoading,
        isFetching,
        error: taxError,
    } = useAdminTax(id);

    const tax = useMemo(() => {
        if (!taxResponse || taxResponse.success === false) return null;
        return taxResponse.data || null;
    }, [taxResponse]);

    useEffect(() => {
        if (!taxResponse) return;
        if (taxResponse.success === false) {
            const message = taxResponse?.message || taxResponse?.error || taxResponse?.data?.message || 'Failed to load tax details';
            toast.error(message);
        }
    }, [taxResponse]);

    useEffect(() => {
        if (!taxError) return;
        const message = taxError?.response?.data?.message || taxError.message || 'Failed to load tax details';
        toast.error(message);
    }, [taxError]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!tax) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Tax not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Tax Information</h3>
            </div>
            <div className="card-body">
                {isFetching && !isLoading && (
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                        <span className="spinner-border spinner-border-sm"></span>
                        <span>Refreshing tax details...</span>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Tax ID</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{tax.id}</span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(tax.name) || 'N/A'}</span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Rate</label>
                    <div className="col-lg-8">
                        <span className="badge badge-light-primary fs-6">{tax.rate}%</span>
                    </div>
                </div>
                {tax.type && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Type</label>
                        <div className="col-lg-8">
                            <span className="fw-bold fs-6 text-gray-800">{tax.type}</span>
                        </div>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(tax.created_at) || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {formatDateTime(tax.updated_at) || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTaxView;

