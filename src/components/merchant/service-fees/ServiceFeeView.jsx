import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getServiceFee } from '../../../services/serviceFeesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useToolbar } from '../../../contexts/ToolbarContext';

const ServiceFeeView = () => {
    const { id } = useParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [serviceFee, setServiceFee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle('Service Fee Details');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Service Fees', path: '/merchant/service-fees' },
            { label: 'Service Fee Details', path: `/merchant/service-fees/${id}`, active: true }
        ]);
        
        setActions(null);
    }, [setTitle, setBreadcrumbs, setActions, id]);

    useEffect(() => {
        fetchServiceFee();
    }, [id]);

    const fetchServiceFee = async () => {
        setLoading(true);
        try {
            const response = await getServiceFee(id);
            console.log('Service Fee View Response:', response);
            
            if (response.success) {
                const feeData = response.data?.data || response.data;
                setServiceFee(feeData);
            } else {
                setError(response.error || 'Failed to fetch service fee');
            }
        } catch (err) {
            console.error('Error fetching service fee:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !serviceFee) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="alert alert-danger">
                        <strong>Error:</strong> {error || 'Service fee not found'}
                    </div>
                    <Link to="/merchant/service-fees" className="btn btn-primary">
                        Back to Service Fees
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Service Fee Information</h3>
                        </div>

                        <div className="card-body">
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Fee Name</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">{serviceFee.name}</span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Type</label>
                                <div className="col-lg-8">
                                    <span className="badge badge-light-primary">
                                        {serviceFee.type?.toUpperCase() || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Fee Amount</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-3 text-success">
                                        {formatCurrency(serviceFee.fees)}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Description</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">
                                        {serviceFee.description || 'No description available'}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Created At</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">
                                        {serviceFee.created_at ? new Date(serviceFee.created_at).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">Updated At</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">
                                        {serviceFee.updated_at ? new Date(serviceFee.updated_at).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer d-flex justify-content-end">
                            <Link to="/merchant/service-fees" className="btn btn-light">
                                Back to List
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default ServiceFeeView;

