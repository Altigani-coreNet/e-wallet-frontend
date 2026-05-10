import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminPlanShow = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        setTitle(t('admin.planShow.planDetails'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`/admin/plans/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-notepad-edit fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.planShow.editPlan')}
                </Link>
                <Link to="/admin/plans" className="btn btn-sm btn-light-danger">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.planShow.back')}
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id, t]);

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
            toast.error(t('admin.planShow.failedToLoad'));
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
                                <span className="visually-hidden">{t('admin.common.loading')}</span>
                            </div>
                            <p className="mt-3">{t('admin.planShow.loadingDetails')}</p>
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
                            <p>{t('admin.planShow.notFound')}</p>
                            <Link to="/admin/plans" className="btn btn-primary">
                                {t('admin.planShow.backToPlans')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const posLimits = [
        { key: 'users', label: t('admin.planCreate.users') },
        { key: 'branches', label: t('admin.planCreate.branches') },
        { key: 'terminals', label: t('admin.dashboard.terminals') },
        { key: 'transactions', label: t('admin.dashboard.transactions') },
        { key: 'batches', label: t('admin.dashboard.batches') },
        { key: 'settlements', label: t('admin.dashboard.settlements') },
        { key: 'payment_links', label: t('admin.planCreate.paymentLinks') }
    ];

    const cashierLimits = [
        { key: 'categories', label: t('admin.planCreate.categories') },
        { key: 'products', label: t('admin.planCreate.products') },
        { key: 'customers', label: t('admin.planCreate.customers') },
        { key: 'suppliers', label: t('admin.planCreate.suppliers') },
        { key: 'purchases', label: t('admin.planCreate.purchases') },
        { key: 'sales', label: t('admin.planCreate.sales') }
    ];

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title">
                            <h2>{t('admin.planShow.planDetails')}</h2>
                        </div>
                    </div>

                    <div className="card-body p-9">
                        {/* Basic Information */}
                        <div className="row mb-10">
                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">{t('admin.planShow.planName')}</label>
                                <div className="fw-semibold fs-6">{plan.name || '-'}</div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">{t('admin.planShow.price')}</label>
                                <div className="fw-semibold fs-6">${parseFloat(plan.price || 0).toFixed(2)}</div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">{t('admin.planShow.planType')}</label>
                                <div className="fw-semibold fs-6">{plan.plan_type || '-'}</div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">{t('admin.planShow.status')}</label>
                                <div>
                                    {plan.status ? (
                                        <span className="badge badge-success">{t('admin.planShow.active')}</span>
                                    ) : (
                                        <span className="badge badge-danger">{t('admin.planShow.inactive')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6 mb-7">
                                <label className="form-label fw-bold text-muted">{t('admin.planShow.hasDiscount')}</label>
                                <div>
                                    {plan.has_discount ? (
                                        <span className="badge badge-info">{t('admin.planShow.yes')}</span>
                                    ) : (
                                        <span className="badge badge-secondary">{t('admin.planShow.no')}</span>
                                    )}
                                </div>
                            </div>

                            {plan.has_discount && plan.current_price && (
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold text-muted">{t('admin.planShow.discountedPrice')}</label>
                                    <div className="fw-semibold fs-6">${parseFloat(plan.current_price).toFixed(2)}</div>
                                </div>
                            )}

                            <div className="col-md-12 mb-7">
                                <label className="form-label fw-bold text-muted">{t('admin.planShow.description')}</label>
                                <div className="fw-semibold fs-6">{plan.description || '-'}</div>
                            </div>
                        </div>

                        <div className="separator separator-dashed my-10"></div>

                        {/* Plan Scopes */}
                        <div className="row mb-6">
                            <div className="col-12">
                                <h3 className="fs-6 fw-bold mb-4">{t('admin.planShow.planScopes')}</h3>
                                
                                {/* POS Module */}
                                <div className="card mb-5">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">{t('admin.planShow.posModule')}</h4>
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
                                                                <span className="badge badge-success">{t('admin.planShow.enabled')}</span>
                                                                <span className="fw-semibold">
                                                                    {scope.max_count ? t('admin.planShow.maxCount', { count: scope.max_count }) : t('admin.planShow.unlimited')}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="badge badge-secondary">{t('admin.planShow.disabled')}</span>
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
                                        <h4 className="card-title mb-0">{t('admin.planShow.cashierModule')}</h4>
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
                                                                <span className="badge badge-success">{t('admin.planShow.enabled')}</span>
                                                                <span className="fw-semibold">
                                                                    {scope.max_count ? t('admin.planShow.maxCount', { count: scope.max_count }) : t('admin.planShow.unlimited')}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="badge badge-secondary">{t('admin.planShow.disabled')}</span>
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
                                <h3 className="fs-6 fw-bold mb-4">{t('admin.planShow.planFeatures')}</h3>
                                {plan.features && plan.features.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                            <thead>
                                                <tr className="fw-bold text-muted">
                                                    <th className="min-w-150px">{t('admin.planShow.featureName')}</th>
                                                    <th className="min-w-100px">{t('admin.planShow.status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.features.map((feature, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-semibold">{feature.name}</td>
                                                        <td>
                                                            {feature.is_enabled ? (
                                                                <span className="badge badge-success">{t('admin.planShow.enabled')}</span>
                                                            ) : (
                                                                <span className="badge badge-secondary">{t('admin.planShow.disabled')}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">{t('admin.planShow.noFeatures')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card-footer text-end">
                        <Link to={`/admin/plans/${id}/edit`} className="btn btn-primary">
                            {t('admin.planShow.editPlan')}
                        </Link>
                        <Link to="/admin/plans" className="btn btn-light-danger ms-2">
                            {t('admin.planShow.backToPlans')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPlanShow;
