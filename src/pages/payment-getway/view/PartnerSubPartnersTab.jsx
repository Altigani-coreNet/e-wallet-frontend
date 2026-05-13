import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
    getSubPartners,
    approvePartner,
    rejectPartner,
    suspendPartner,
    unsuspendPartner,
    deletePartner,
} from '../../../services/adminPartnersService';
import axios from '../../../utils/axiosConfig';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import ContentProviderTableRow from '../ContentProviderTableRow';
import ContentProviderRejectModal from '../ContentProviderRejectModal';
import useCountryInfoByIds from '../../../hooks/useCountryInfoByIds';
import { useCan } from '../../../utils/permissions';
import { getToken } from '../../../utils/api';

const PLACEHOLDER_ROWS = 6;

const subPartnersTabPlaceholderColumns = ['viewCountryCol', 'viewPartnerCol', 'viewCategoryCol', 'viewCreatedCol', 'status', 'actions'];

const PartnerSubPartnersTab = ({ parentId, parentName }) => {
    const { t } = useTranslation();
    const canCreatePartner = useCan('pos.merchants.create_merchants');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingPartner, setRejectingPartner] = useState(null);
    const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

    const countryIds = useMemo(
        () =>
            rows
                .map((r) => r?.country_id ?? r?.country?.id)
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id)),
        [rows]
    );
    const { loading: countryLookupLoading, getCountryById, hasPendingRequest } = useCountryInfoByIds(countryIds);

    const fetchRows = useCallback(async () => {
        if (!parentId) return;
        setLoading(true);
        try {
            const result = await getSubPartners(parentId, {
                page: pagination.current_page,
                per_page: pagination.per_page,
            });
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData.success || responseData.status;
            if (isSuccess) {
                const payload = responseData.data;
                setRows(payload?.data ?? []);
                setPagination({
                    current_page: payload.current_page,
                    per_page: payload.per_page,
                    total: payload.total,
                    last_page: payload.last_page,
                });
            }
        } catch (e) {
            toast.error(t('admin.paymentGetway.viewFailedLoadSubPartners'));
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [parentId, pagination.current_page, pagination.per_page]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const handleApprove = async (subId) => {
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.viewApproveSubPartnerTitle'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.viewApprove'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-light' },
            buttonsStyling: false,
        });
        if (!confirmation.isConfirmed) return;
        try {
            const result = await approvePartner(subId);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            if (result.data.success || result.data.status) {
                toast.success(t('admin.paymentGetway.viewSubPartnerApproved'));
                fetchRows();
            }
        } catch (e) {
            toast.error(t('admin.paymentGetway.viewFailedApprove'));
        }
    };

    const handleReject = (partner) => {
        setRejectingPartner(partner);
        setRejectModalOpen(true);
    };

    const handleRejectConfirm = async ({ contentProviderId, rejection_reason, invalid_fields }) => {
        try {
            setIsRejectSubmitting(true);
            const result = await rejectPartner(contentProviderId, { rejection_reason, invalid_fields });
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            if (result.data.success || result.data.status) {
                toast.success(t('admin.paymentGetway.viewSubPartnerRejected'));
                setRejectModalOpen(false);
                setRejectingPartner(null);
                fetchRows();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || t('admin.paymentGetway.viewFailedReject'));
        } finally {
            setIsRejectSubmitting(false);
        }
    };

    const handleSuspend = async (partner) => {
        const suspensionPrompt = await Swal.fire({
            title: t('admin.paymentGetway.viewSuspendSubPartnerTitle'),
            input: 'textarea',
            showCancelButton: true,
            confirmButtonText: t('admin.common.suspend'),
            preConfirm: (value) => {
                const t = value?.trim();
                if (!t || t.length < 10) {
                    Swal.showValidationMessage(t('admin.paymentGetway.viewSuspendReasonMin'));
                    return;
                }
                return t;
            },
        });
        if (!suspensionPrompt.isConfirmed || !suspensionPrompt.value) return;
        try {
            const result = await suspendPartner(partner.id, { suspension_reason: suspensionPrompt.value });
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            if (result.data.success || result.data.status) {
                toast.success(t('admin.paymentGetway.viewSubPartnerSuspended'));
                fetchRows();
            }
        } catch {
            toast.error(t('admin.paymentGetway.viewFailedSuspend'));
        }
    };

    const handleUnsuspend = async (subId) => {
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.viewUnsuspendTitle'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.viewUnsuspend'),
        });
        if (!confirmation.isConfirmed) return;
        try {
            const result = await unsuspendPartner(subId);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            if (result.data.success || result.data.status) {
                toast.success(t('admin.paymentGetway.viewSubPartnerUnsuspended'));
                fetchRows();
            }
        } catch {
            toast.error(t('admin.paymentGetway.viewFailedUnsuspend'));
        }
    };

    const handleDelete = async (subId) => {
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.viewDeleteSubPartnerTitle'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.common.delete'),
        });
        if (!confirmation.isConfirmed) return;
        try {
            const result = await deletePartner(subId);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            if (result.data.success || result.data.status) {
                toast.success(t('admin.paymentGetway.viewDeleted'));
                fetchRows();
            }
        } catch {
            toast.error(t('admin.paymentGetway.viewFailedDelete'));
        }
    };

    const renderPlaceholderTable = useMemo(() => {
        return (
            <div className="table-responsive">
                <table className="table table-sm table-row-dashed align-middle fs-7 gy-3">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bold fs-8 text-uppercase gs-0">
                            {subPartnersTabPlaceholderColumns.map((column) => (
                                <th key={column} className="text-dark">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-7" style={{ height: '12px' }} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="placeholder-glow">
                        {Array.from({ length: PLACEHOLDER_ROWS }).map((_, index) => (
                            <tr key={`sub-tab-skel-${index}`}>
                                <td>
                                    <span className="placeholder col-8" style={{ height: '14px' }} />
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="placeholder rounded-circle" style={{ width: '40px', height: '40px' }} />
                                        <div className="d-flex flex-column gap-2 flex-grow-1">
                                            <span className="placeholder col-10" style={{ height: '14px' }} />
                                            <span className="placeholder col-7" style={{ height: '12px' }} />
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="placeholder col-7" style={{ height: '14px' }} />
                                </td>
                                <td>
                                    <span className="placeholder col-9" style={{ height: '14px' }} />
                                </td>
                                <td>
                                    <span className="placeholder col-6" style={{ height: '22px' }} />
                                </td>
                                <td className="text-end">
                                    <div className="d-flex justify-content-end gap-2">
                                        <span className="placeholder rounded" style={{ width: '72px', height: '28px' }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }, []);

    const handleResetPassword = async (partner) => {
        if (!partner.user_id && !partner.user?.id) {
            toast.error(t('admin.paymentGetway.viewNoUserLinked'));
            return;
        }
        const userId = partner.user_id || partner.user?.id;
        try {
            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.USER_SEND_RESET_PASSWORD(userId), {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success || response.data.status) {
                toast.success(response.data.data?.message || t('admin.paymentGetway.viewResetLinkSent'));
            } else {
                toast.error(response.data.message || t('admin.paymentGetway.cpImportFailed'));
            }
        } catch (e) {
            toast.error(e.response?.data?.message || t('admin.paymentGetway.cpImportFailed'));
        }
    };

    return (
        <div className="card">
            <div className="card-header border-0 pt-6">
                <div className="card-title flex-column align-items-start">
                    <h3 className="fw-bolder fs-4">{t('admin.paymentGetway.viewSubPartnersTitle')}</h3>
                    <span className="text-muted fs-8">
                        {t('admin.paymentGetway.viewSubPartnersUnder', { parent: parentName || t('admin.paymentGetway.cpParent') })}
                    </span>
                </div>
                <div className="card-toolbar">
                    {canCreatePartner && (
                        <Link
                            to={`/admin/partners/${parentId}/sub-partners/create`}
                            className="btn btn-sm btn-primary"
                        >
                            <i className="ki-duotone ki-plus fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <span className="d-none d-md-inline ms-1">{t('admin.paymentGetway.viewAddSubPartner')}</span>
                        </Link>
                    )}
                </div>
            </div>
            <div className="card-body pt-0">
                {loading ? (
                    renderPlaceholderTable
                ) : (
                <div className="table-responsive">
                    <table className="table table-sm table-row-dashed align-middle fs-7 gy-3">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-8 text-uppercase gs-0">
                                <th className="text-dark" style={{ minWidth: '88px', maxWidth: '110px' }}>{t('admin.paymentGetway.viewCountryCol')}</th>
                                <th className="text-dark" style={{ minWidth: '160px', maxWidth: '240px' }}>{t('admin.paymentGetway.viewPartnerCol')}</th>
                                <th className="text-dark" style={{ minWidth: '72px', maxWidth: '100px' }}>{t('admin.paymentGetway.viewCategoryCol')}</th>
                                <th className="text-dark" style={{ minWidth: '78px', maxWidth: '92px' }}>{t('admin.paymentGetway.viewCreatedCol')}</th>
                                <th className="text-dark" style={{ minWidth: '72px' }}>{t('admin.paymentGetway.status')}</th>
                                <th className="text-end text-dark" style={{ minWidth: '96px' }}>{t('admin.common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 fw-semibold">
                            {rows.map((cp) => {
                                const countryId = cp?.country_id ?? cp?.country?.id;
                                const record = getCountryById(countryId);
                                const rowLookupLoading = countryLookupLoading && hasPendingRequest(countryId);
                                return (
                                    <ContentProviderTableRow
                                        key={cp.id}
                                        contentProvider={cp}
                                        isSelected={false}
                                        onSelect={() => {}}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onSuspend={handleSuspend}
                                        onUnsuspend={handleUnsuspend}
                                        onDelete={handleDelete}
                                        onResetPassword={handleResetPassword}
                                        lookupCountryName={record?.name}
                                        lookupCountryCode={record?.code || record?.short_name}
                                        lookupLoading={rowLookupLoading}
                                        variant="compact"
                                        hideCheckbox
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                )}

                {!loading && rows.length === 0 && (
                    <div className="text-center py-10 text-gray-600">
                        {t('admin.paymentGetway.viewNoSubPartners')} {canCreatePartner && (
                            <Link to={`/admin/partners/${parentId}/sub-partners/create`} className="fw-bold">
                                {t('admin.paymentGetway.viewAddOne')}
                            </Link>
                        )}
                    </div>
                )}

                {!loading && rows.length > 0 && (
                    <div className="d-flex flex-stack flex-wrap pt-6">
                        <div className="fs-6 fw-semibold text-gray-700">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total}
                        </div>
                        <ul className="pagination">
                            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                <button
                                    type="button"
                                    className="page-link"
                                    disabled={pagination.current_page === 1}
                                    onClick={() =>
                                        setPagination((p) => ({ ...p, current_page: p.current_page - 1 }))
                                    }
                                >
                                    {t('admin.common.previous')}
                                </button>
                            </li>
                            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                <button
                                    type="button"
                                    className="page-link"
                                    disabled={pagination.current_page === pagination.last_page}
                                    onClick={() =>
                                        setPagination((p) => ({ ...p, current_page: p.current_page + 1 }))
                                    }
                                >
                                    {t('admin.common.next')}
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            <ContentProviderRejectModal
                isOpen={rejectModalOpen}
                contentProvider={rejectingPartner}
                onClose={() => {
                    if (isRejectSubmitting) return;
                    setRejectModalOpen(false);
                    setRejectingPartner(null);
                }}
                onConfirm={handleRejectConfirm}
                isSubmitting={isRejectSubmitting}
            />
        </div>
    );
};

export default PartnerSubPartnersTab;
