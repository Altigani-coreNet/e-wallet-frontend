import React, { useState, useEffect } from 'react';
import { useToolbar } from '../../contexts/ToolbarContext';
import axios from 'axios';
import { POS_API_BASE } from '../../utils/constants';
import { getToken } from '../../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

const PlanLimitsTest = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limits, setLimits] = useState(null);

    useEffect(() => {
        setTitle('Plan Limits Test');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Plan Limits Test', active: true }
        ]);
        setActions(null);

        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions]);

    useEffect(() => {
        fetchPlanLimits();
    }, []);

    const fetchPlanLimits = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getToken();
            const response = await axios.get(`${POS_API_BASE}/v1/user/plan-limits`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                setLimits(response.data.data);
            } else {
                setError('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching plan limits:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch plan limits');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (resource) => {
        if (!resource.is_enabled) {
            return <span className="badge badge-light-danger">Disabled</span>;
        }
        if (resource.is_unlimited) {
            return <span className="badge badge-light-success">Unlimited</span>;
        }
        if (resource.can_create) {
            return <span className="badge badge-light-success">Can Create</span>;
        }
        return <span className="badge badge-light-warning">Limit Reached</span>;
    };

    const getProgressPercentage = (resource) => {
        if (resource.is_unlimited || !resource.limit) {
            return 0;
        }
        return Math.min((resource.count / resource.limit) * 100, 100);
    };

    const renderResourceCard = (name, resource) => {
        const progress = getProgressPercentage(resource);
        const progressColor = resource.can_create ? 'success' : 'warning';

        return (
            <div className="card mb-5" key={name}>
                <div className="card-header">
                    <div className="card-title">
                        <h3 className="text-capitalize">{name}</h3>
                    </div>
                    <div className="card-toolbar">
                        {getStatusBadge(resource)}
                    </div>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className="d-flex flex-column">
                                <span className="text-muted fs-7 mb-1">Current Count</span>
                                <span className="fs-2x fw-bold text-gray-800">{resource.count}</span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="d-flex flex-column">
                                <span className="text-muted fs-7 mb-1">Plan Limit</span>
                                <span className="fs-2x fw-bold text-gray-800">
                                    {resource.is_unlimited ? '∞ Unlimited' : (resource.limit ?? 'N/A')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {!resource.is_unlimited && resource.limit && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted fs-7">Usage Progress</span>
                                <span className="text-muted fs-7">{resource.count} / {resource.limit}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                                <div
                                    className={`progress-bar bg-${progressColor}`}
                                    role="progressbar"
                                    style={{ width: `${progress}%` }}
                                    aria-valuenow={progress}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="separator separator-dashed my-4"></div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="d-flex align-items-center mb-3">
                                <i className={`ki-duotone ki-${resource.is_enabled ? 'check-circle' : 'cross-circle'} fs-2 me-3 text-${resource.is_enabled ? 'success' : 'danger'}`}>
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <div>
                                    <span className="text-muted fs-7 d-block">Feature Enabled</span>
                                    <span className="fw-bold">{resource.is_enabled ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center mb-3">
                                <i className={`ki-duotone ki-${resource.is_unlimited ? 'check-circle' : 'cross-circle'} fs-2 me-3 text-${resource.is_unlimited ? 'success' : 'primary'}`}>
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <div>
                                    <span className="text-muted fs-7 d-block">Unlimited</span>
                                    <span className="fw-bold">{resource.is_unlimited ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center mb-3">
                                <i className={`ki-duotone ki-${resource.can_create ? 'check-circle' : 'cross-circle'} fs-2 me-3 text-${resource.can_create ? 'success' : 'warning'}`}>
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <div>
                                    <span className="text-muted fs-7 d-block">Can Create More</span>
                                    <span className="fw-bold">{resource.can_create ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center mb-3">
                                <i className="ki-duotone ki-information-5 fs-2 me-3 text-primary">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div>
                                    <span className="text-muted fs-7 d-block">Remaining</span>
                                    <span className="fw-bold">
                                        {resource.is_unlimited 
                                            ? '∞' 
                                            : resource.limit 
                                                ? Math.max(0, resource.limit - resource.count)
                                                : 'N/A'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <div className="card mb-5">
                    <div className="card-header">
                        <div className="card-title">
                            <h2>Plan Limits Test Page</h2>
                        </div>
                        <div className="card-toolbar">
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={fetchPlanLimits}
                                disabled={loading}
                            >
                                <i className="ki-duotone ki-arrows-circle fs-3 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
                        {loading && <LoadingSpinner />}
                        
                        {!loading && limits && (
                            <div>
                                {renderResourceCard('suppliers', limits.suppliers)}
                                {renderResourceCard('products', limits.products)}
                                {renderResourceCard('customers', limits.customers)}
                                {renderResourceCard('sales', limits.sales)}
                                {renderResourceCard('purchases', limits.purchases)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanLimitsTest;

