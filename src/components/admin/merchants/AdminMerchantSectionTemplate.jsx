import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import useAdminMerchantFullDetails from '../../../hooks/useAdminMerchantFullDetails';
import MerchantProfileHeader from './MerchantProfileHeader';
import MerchantRejectModal from './MerchantRejectModal';

const AdminMerchantSectionTemplate = ({
    title,
    activeTab = 'overview',
    renderContent,
}) => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const resolvedTitle = title ?? t('admin.merchantsUI.sectionTemplate.defaultTitle');

    const [isActionSubmitting, setIsActionSubmitting] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    const {
        data,
        loading,
        refetch,
    } = useAdminMerchantFullDetails(id);

    const merchant = data?.merchant ?? null;
    const statistics = data?.statistics ?? {};
    const profileCompletion = data?.profile_completion ?? {};
    const pendingChangeRequests = data?.pending_change_requests ?? 0;

    useEffect(() => {
        setTitle(resolvedTitle);
        setActions(
            <Link to="/admin/merchants" className="btn btn-sm btn-light">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.merchantsUI.back')}
            </Link>
        );

        return () => setActions(null);
    }, [setTitle, setActions, resolvedTitle, t]);

    const handleApprove = async () => {
        if (!id || !window.confirm(t('admin.merchantsUI.sectionTemplate.approveConfirm'))) return;
        try {
            setIsActionSubmitting(true);
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_APPROVE(id),
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data?.success || response.data?.status) {
                toast.success(t('admin.merchantsUI.sectionTemplate.approveSuccess'));
                refetch();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.merchantsUI.sectionTemplate.approveFailed'));
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleRejectConfirm = async ({ rejection_reason, invalid_fields, missing_attachments }) => {
        if (!id) return;
        try {
            setRejectSubmitting(true);
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_REJECT(id),
                {
                    rejection_reason,
                    invalid_fields,
                    missing_attachments,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data?.success || response.data?.status) {
                toast.success(t('admin.merchantsUI.sectionTemplate.rejectSuccess'));
                setRejectModalOpen(false);
                refetch();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.merchantsUI.sectionTemplate.rejectFailed'));
        } finally {
            setRejectSubmitting(false);
        }
    };

    const handleSuspend = async () => {
        if (!id) return;

        const reason = window.prompt(t('admin.merchantsUI.sectionTemplate.suspendPrompt'));
        if (!reason || reason.trim().length < 10) {
            toast.error(t('admin.merchantsUI.sectionTemplate.suspendValidation'));
            return;
        }

        try {
            setIsActionSubmitting(true);
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_SUSPEND(id),
                { suspension_reason: reason.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data?.success || response.data?.status) {
                toast.success(t('admin.merchantsUI.sectionTemplate.suspendSuccess'));
                refetch();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.merchantsUI.sectionTemplate.suspendFailed'));
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleUnsuspend = async () => {
        if (!id || !window.confirm(t('admin.merchantsUI.sectionTemplate.unsuspendConfirm'))) return;

        try {
            setIsActionSubmitting(true);
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_UNSUSPEND(id),
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data?.success || response.data?.status) {
                toast.success(t('admin.merchantsUI.sectionTemplate.unsuspendSuccess'));
                refetch();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.merchantsUI.sectionTemplate.unsuspendFailed'));
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !window.confirm(t('admin.merchantsUI.sectionTemplate.deleteConfirm'))) return;

        try {
            setIsActionSubmitting(true);
            const token = getToken();
            await axios.delete(ADMIN_ENDPOINTS.MERCHANT_DETAILS(id), {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(t('admin.merchantsUI.sectionTemplate.deleteSuccess'));
            navigate('/admin/merchants');
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.merchantsUI.sectionTemplate.deleteFailed'));
        } finally {
            setIsActionSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 280 }}>
                        <span className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></span>
                    </div>
                </div>
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="card">
                <div className="card-body text-center py-20">
                    <h3 className="fw-bold mb-3">{t('admin.merchantsUI.notFound')}</h3>
                    <Link to="/admin/merchants" className="btn btn-primary">
                        {t('admin.merchantsUI.backToMerchants')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <MerchantProfileHeader
                    merchant={merchant}
                    statistics={statistics}
                    profileCompletion={profileCompletion}
                    pendingChangeRequests={pendingChangeRequests}
                    basePath={`/admin/merchants/${merchant.id}`}
                    activeTab={activeTab}
                    onApprove={handleApprove}
                    onReject={() => setRejectModalOpen(true)}
                    onSuspend={handleSuspend}
                    onUnsuspend={handleUnsuspend}
                    onDelete={handleDelete}
                    disableActions={isActionSubmitting}
                />

                {renderContent?.({
                    merchant,
                    statistics,
                    profileCompletion,
                    pendingChangeRequests,
                    latestLogs: merchant.latest_logs ?? merchant.logs ?? [],
                    logCount: merchant.logs_counts ?? 0,
                    basePath: `/admin/merchants/${merchant.id}`,
                    refetchMerchant: refetch,
                })}
            </div>

            <MerchantRejectModal
                isOpen={rejectModalOpen}
                merchant={merchant}
                onClose={() => (!rejectSubmitting ? setRejectModalOpen(false) : null)}
                onConfirm={handleRejectConfirm}
                isSubmitting={rejectSubmitting}
            />
        </div>
    );
};

export default AdminMerchantSectionTemplate;


