import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminBranchView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle(t('admin.branchView.title'));
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/branches/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.branchView.editBranch')}
                </Link>
                <Link to="/admin/branches" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.branchView.back')}
                </Link>
            </div>
        );
        fetchBranchDetails();
        return () => setActions(null);
    }, [id, setTitle, setActions, t]);

    const fetchBranchDetails = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCH_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                setBranch(response.data.data.branch || response.data.data);
            }
        } catch (error) {
            toast.error(t('admin.branchView.fetchFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('admin.branchView.deleteConfirm'))) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.delete(ADMIN_ENDPOINTS.BRANCH_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.branchView.deleteSuccess'));
                navigate('/admin/branches');
            }
        } catch (error) {
            toast.error(t('admin.branchView.deleteFailed'));
            console.error(error);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm(t('admin.branchView.approveConfirm'))) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_APPROVE(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.branchView.approveSuccess'));
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error(t('admin.branchView.approveFailed'));
            console.error(error);
        }
    };

    const handleReject = async () => {
        const reason = window.prompt(t('admin.branchView.rejectPrompt'));
        if (!reason) return;

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_REJECT(id), {
                rejection_reason: reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.branchView.rejectSuccess'));
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error(t('admin.branchView.rejectFailed'));
            console.error(error);
        }
    };

    const handleSuspend = async () => {
        const reason = window.prompt(t('admin.branchView.suspendPrompt'));
        if (!reason) return;

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_SUSPEND(id), {
                suspension_reason: reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.branchView.suspendSuccess'));
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error(t('admin.branchView.suspendFailed'));
            console.error(error);
        }
    };

    const handleUnsuspend = async () => {
        if (!window.confirm(t('admin.branchView.unsuspendConfirm'))) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.BRANCH_UNSUSPEND(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.branchView.unsuspendSuccess'));
                fetchBranchDetails();
            }
        } catch (error) {
            toast.error(t('admin.branchView.unsuspendFailed'));
            console.error(error);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'badge-light-success';
            case 'pending': return 'badge-light-warning';
            case 'rejected': return 'badge-light-danger';
            case 'suspended': return 'badge-light-warning';
            default: return 'badge-light-secondary';
        }
    };

    const getCountryName = (country) => {
        if (!country) return t('admin.common.na');
        let name = country.name || country.text;
        if (typeof name === 'object' && name !== null) {
            return name[i18n.language] || name.en || name.ar || t('admin.common.na');
        }
        return name || t('admin.common.na');
    };

    const getCityName = (city) => {
        if (!city) return t('admin.common.na');
        let name = city.name || city.text;
        if (typeof name === 'object' && name !== null) {
            return name[i18n.language] || name.en || name.ar || t('admin.common.na');
        }
        return name || t('admin.common.na');
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <span className="spinner-border text-primary"></span>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p className="text-gray-600">{t('admin.branchView.notFound')}</p>
                    <Link to="/admin/branches" className="btn btn-primary">
                        {t('admin.branchView.backToBranches')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('admin.branchView.title')}: {branch.name}</h3>
                        <div className="card-toolbar d-flex gap-2">
                            {/* Action Buttons */}
                            {branch.status === 'pending' && (
                                <>
                                    <button onClick={handleApprove} className="btn btn-sm btn-success">
                                        <i className="ki-duotone ki-check fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.branchView.approve')}
                                    </button>
                                    <button onClick={handleReject} className="btn btn-sm btn-danger">
                                        <i className="ki-duotone ki-cross fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.branchView.reject')}
                                    </button>
                                </>
                            )}
                            {branch.status !== 'suspended' && branch.status !== 'pending' && (
                                <button onClick={handleSuspend} className="btn btn-sm btn-warning">
                                    <i className="ki-duotone ki-lock fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.branchView.suspend')}
                                </button>
                            )}
                            {branch.status === 'suspended' && (
                                <button onClick={handleUnsuspend} className="btn btn-sm btn-success">
                                    <i className="ki-duotone ki-lock-2 fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.branchView.unsuspend')}
                                </button>
                            )}
                            <Link to={`/admin/branches/${id}/edit`} className="btn btn-sm btn-primary">
                                <i className="ki-duotone ki-pencil fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('admin.branchView.edit')}
                            </Link>
                            <button onClick={handleDelete} className="btn btn-sm btn-danger">
                                <i className="ki-duotone ki-trash fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                    <span className="path4"></span>
                                    <span className="path5"></span>
                                </i>
                                {t('admin.branchView.delete')}
                            </button>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.branchName')}</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{branch.name}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.merchant')}</label>
                            <div className="col-lg-8">
                                {branch.merchant ? (
                                    <Link to={`/admin/merchants/${branch.merchant.id}`} className="text-primary text-hover-primary fw-semibold">
                                        {branch.merchant.business_name || branch.merchant.name}
                                    </Link>
                                ) : (
                                    <span className="text-gray-600">{t('admin.common.na')}</span>
                                )}
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.address')}</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{branch.address || t('admin.common.na')}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.country')}</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{getCountryName(branch.country)}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.city')}</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">{getCityName(branch.city)}</span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.status')}</label>
                            <div className="col-lg-8">
                                <span className={`badge ${getStatusBadgeClass(branch.status)}`}>
                                    {branch.status ? t(`admin.common.${branch.status.toLowerCase()}`) : t('admin.common.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.activeStatus')}</label>
                            <div className="col-lg-8">
                                {branch.is_active ? (
                                    <span className="badge badge-light-success">{t('admin.common.active')}</span>
                                ) : (
                                    <span className="badge badge-light-danger">{t('admin.common.inactive')}</span>
                                )}
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.createdAt')}</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">
                                    {new Date(branch.created_at).toLocaleString(i18n.language)}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('admin.branchView.updatedAt')}</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800 fs-6">
                                    {new Date(branch.updated_at).toLocaleString(i18n.language)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBranchView;


