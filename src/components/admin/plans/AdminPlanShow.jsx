import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminPlanShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        setTitle('Plan Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`/admin/plans/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-notepad-edit fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit Plan
                </Link>
                <Link to="/admin/plans" className="btn btn-sm btn-light-danger">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id]);

    useEffect(() => {
        fetchPlan();
    }, [id]);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.PLAN_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setPlan(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load plan details');
            console.error(error);
            navigate('/admin/plans');
        } finally {
            setLoading(false);
        }
    };

    const getScopeValue = (scopeType) => {
        if (!plan?.scopes || !Array.isArray(plan.scopes)) return null;
        const scope = plan.scopes.find(s => s.scope_type === scopeType);
        return scope;
    };

    const getModuleScopes = (module) => {
        if (!plan?.scopes || !Array.isArray(plan.scopes)) return [];
        return plan.scopes.filter(s => s.module === module);
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body text-center py-10">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading plan details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body text-center py-10">
                            <p>Plan not found</p>
                            <Link to="/admin/plans" className="btn btn-primary">
                                Back to Plans
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const posLimits = [
        { key: 'users', label: 'Users' },
        { key: 'branches', label: 'Branches' },
        { key: 'terminals', label: 'Terminals' },
        { key: 'transactions', label: 'Transactions' },
        { key: 'batches', label: 'Batches' },
        { key: 'settlements', label: 'Settlements' },
        { key: 'payment_links', label: 'Payment Links' }
    ];

    const cashierLimits = [
        { key: 'categories', label: 'Categories' },
        { key: 'products', label: 'Products' },
        { key: 'customers', label: 'Customers' },
        { key: 'suppliers', label: 'Suppliers' },
        { key: 'purchases', label: 'Purchases' },
        { key: 'sales', label: 'Sales' }
    ];

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title">
                            <h2>Plan Details</h2>
                        </div>
                    </div>

                    <div className="card-body p-9">
                        {/* Basic Information */}
                        <div className="row mb-10">
                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">Plan Name</label>
                                <div className="fw-semibold fs-6">{plan.name || '-'}</div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">Price</label>
                                <div className="fw-semibold fs-6">${parseFloat(plan.price || 0).toFixed(2)}</div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">Plan Type</label>
                                <div className="fw-semibold fs-6">{plan.plan_type || '-'}</div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">Status</label>
                                <div>
                                    {plan.status ? (
                                        <span className="badge badge-success">Active</span>
                                    ) : (
                                        <span className="badge badge-danger">Inactive</span>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">Has Discount</label>
                                <div>
                                    {plan.has_discount ? (
                                        <span className="badge badge-info">Yes</span>
                                    ) : (
                                        <span className="badge badge-secondary">No</span>
                                    )}
                                </div>
                            </div>

                            {plan.has_discount && plan.current_price && (
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold text-muted">Discounted Price</label>
                                    <div className="fw-semibold fs-6">${parseFloat(plan.current_price).toFixed(2)}</div>
                                </div>
                            )}

                            <div className="col-md-12 mb-7">
                                <label className="form-label fw-bold text-muted">Description</label>
                                <div className="fw-semibold fs-6">{plan.description || '-'}</div>
                            </div>
                        </div>

                        <div className="separator separator-dashed my-10"></div>

                        {/* Plan Scopes */}
                        <div className="row mb-6">
                            <div className="col-12">
                                <h3 className="fs-6 fw-bold mb-4">Plan Scopes</h3>
                                
                                {/* POS Module */}
                                <div className="card mb-5">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">POS Module</h4>
                                    </div>
                                    <div className="card-body">
                                        {posLimits.map(({ key, label }) => {
                                            const scope = getScopeValue(key);
                                            return (
                                                <div key={key} className="row mb-5 align-items-center">
                                                    <div className="col-md-3">
                                                        <label className="form-label fw-semibold">{label}</label>
                                                    </div>
                                                    <div className="col-md-9">
                                                        {scope && scope.is_enabled ? (
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="badge badge-success">Enabled</span>
                                                                <span className="fw-semibold">
                                                                    {scope.max_count ? `Max: ${scope.max_count}` : 'Unlimited'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="badge badge-secondary">Disabled</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Cashier Module */}
                                <div className="card mb-5">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">Cashier Module</h4>
                                    </div>
                                    <div className="card-body">
                                        {cashierLimits.map(({ key, label }) => {
                                            const scope = getScopeValue(key);
                                            return (
                                                <div key={key} className="row mb-5 align-items-center">
                                                    <div className="col-md-3">
                                                        <label className="form-label fw-semibold">{label}</label>
                                                    </div>
                                                    <div className="col-md-9">
                                                        {scope && scope.is_enabled ? (
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="badge badge-success">Enabled</span>
                                                                <span className="fw-semibold">
                                                                    {scope.max_count ? `Max: ${scope.max_count}` : 'Unlimited'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="badge badge-secondary">Disabled</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="separator separator-dashed my-10"></div>

                        {/* Plan Features */}
                        <div className="row mb-6">
                            <div className="col-12">
                                <h3 className="fs-6 fw-bold mb-4">Plan Features</h3>
                                {plan.features && plan.features.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                            <thead>
                                                <tr className="fw-bold text-muted">
                                                    <th className="min-w-150px">Feature Name</th>
                                                    <th className="min-w-100px">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.features.map((feature, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-semibold">{feature.name}</td>
                                                        <td>
                                                            {feature.is_enabled ? (
                                                                <span className="badge badge-success">Enabled</span>
                                                            ) : (
                                                                <span className="badge badge-secondary">Disabled</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">No features defined for this plan.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card-footer text-end">
                        <Link to={`/admin/plans/${id}/edit`} className="btn btn-primary">
                            Edit Plan
                        </Link>
                        <Link to="/admin/plans" className="btn btn-light-danger ms-2">
                            Back to Plans
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPlanShow;
