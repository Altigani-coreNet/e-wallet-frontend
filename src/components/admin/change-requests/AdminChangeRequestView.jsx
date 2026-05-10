import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getChangeRequestById, approveChangeRequest, rejectChangeRequest } from '../../../services/adminChangeRequestsService';
import Swal from 'sweetalert2';
import { AUTH_SERVICE_BASE } from '../../../utils/constants';

const statusBadgeClass = (status) => {
    switch (status) {
        case 'pending':
            return 'badge-light-warning';
        case 'approved':
            return 'badge-light-success';
        case 'rejected':
            return 'badge-light-danger';
        case 'suspended':
            return 'badge-light-secondary';
        default:
            return 'badge-light';
    }
};

const formatStatus = (status, t) => {
    if (!status) return t('admin.changeRequestView.unknown');
    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const formatDateTime = (value, t) => {
    if (!value) return t('admin.changeRequestView.na');
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
};

const renderActor = (actor, t) => {
    if (!actor) {
        return t('admin.changeRequestView.system');
    }
    return actor.name || actor.email || `#${actor.id}`;
};

const ATTACHMENT_FIELDS = new Set(['company_logo', 'tax_certification', 'trade_license', 'user_id_document']);

const isImageUrl = (url) => {
    if (!url) {
        return false;
    }
    const cleanUrl = url.split('?')[0].toLowerCase();
    return /\.(svg|png|jpe?g|gif|bmp|webp)$/i.test(cleanUrl);
};

const resolveAttachmentUrl = (value) => {
    if (!value) {
        return null;
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    let path = value;
    if (path.startsWith('/')) {
        return `${AUTH_SERVICE_BASE}${path}`;
    }
    if (path.startsWith('storage/') || path.startsWith('uploads/')) {
        return `${AUTH_SERVICE_BASE}/${path}`;
    }
    return `${AUTH_SERVICE_BASE}/storage/${path}`;
};

const AdminChangeRequestView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();

    const [changeRequest, setChangeRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [moderationNote, setModerationNote] = useState('');

    const getAttachmentUrlFor = useCallback((entry, key) => {
        if (!entry) {
            return null;
        }
        return entry[`${key}_url`] || resolveAttachmentUrl(entry[`${key}_raw`]);
    }, []);

    const getAttachmentFileName = useCallback((entry, key) => {
        if (!entry) {
            return null;
        }
        const raw = entry[`${key}_raw`];
        if (!raw) {
            return null;
        }
        const parts = raw.split(/[/\\]/);
        return parts[parts.length - 1] || null;
    }, []);

    const renderFieldValue = useCallback((entry, key) => {
        if (!entry) {
            return '—';
        }

        const isAttachment = entry.is_attachment || ATTACHMENT_FIELDS.has(entry.field);
        if (!isAttachment) {
            return entry[key] ?? '—';
        }

        const url = getAttachmentUrlFor(entry, key);
        if (!url) {
            return <span className="text-muted">{t('admin.changeRequestView.noFile')}</span>;
        }

        const fileName = getAttachmentFileName(entry, key) || 'attachment';
        if (isImageUrl(url)) {
            return (
                <a
                    href={url}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-inline-block border rounded overflow-hidden"
                    style={{ width: 100, height: 100 }}
                    title={fileName}
                >
                    <img
                        src={url}
                        alt={fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </a>
            );
        }

        return (
            <a
                href={url}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-light-primary"
            >
                {t('admin.changeRequestView.download', { fileName })}
            </a>
        );
    }, [getAttachmentFileName, getAttachmentUrlFor, t]);

    useEffect(() => {
        setTitle(t('admin.changeRequestView.changeRequestDetail'));
        return () => setActions(null);
    }, [setTitle, setActions, t]);

    const loadChangeRequest = useCallback(async () => {
        const response = await getChangeRequestById(id);
        const success = response?.status ?? response?.success ?? false;
        if (!success) {
            throw new Error(response?.message || t('admin.changeRequestView.failedToLoad'));
        }
        return response?.data ?? null;
    }, [id, t]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const data = await loadChangeRequest();
                if (!isMounted) return;
                setChangeRequest(data);
                setModerationNote(data?.moderation_note || '');
                if (data?.id) {
                    setTitle(t('admin.changeRequestView.changeRequest', { id: data.id }));
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading change request details:', error);
                    toast.error(error?.message || t('admin.changeRequestView.failedToLoad'));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [loadChangeRequest, setTitle, t]);

    const handleApprove = useCallback(async () => {
        if (!changeRequest || actionLoading) {
            return;
        }

        const result = await Swal.fire({
            title: t('admin.changeRequestView.approveConfirmTitle'),
            text: t('admin.changeRequestView.approveConfirmText'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.changeRequestView.approveConfirmButton'),
            cancelButtonText: t('admin.changeRequestView.cancel'),
            confirmButtonColor: '#50cd89',
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            setActionLoading(true);
            const response = await approveChangeRequest(changeRequest.id, {
                moderation_note: moderationNote || undefined,
            });
            const success = response?.status ?? response?.success ?? false;

            if (!success) {
                throw new Error(response?.message || t('admin.changeRequestView.approveFailed'));
            }

            const payload = response?.data ?? {};
            if (payload?.change_request) {
                setChangeRequest(payload.change_request);
                setModerationNote(payload.change_request.moderation_note || '');
            }

            toast.success(payload?.message || t('admin.changeRequestView.approveSuccess'));
        } catch (error) {
            console.error('Error approving change request:', error);
            toast.error(error?.message || t('admin.changeRequestView.approveFailed'));
        } finally {
            setActionLoading(false);
        }
    }, [actionLoading, changeRequest, moderationNote, t]);

    const handleReject = useCallback(async () => {
        if (!changeRequest || actionLoading) {
            return;
        }

        const result = await Swal.fire({
            title: t('admin.changeRequestView.rejectConfirmTitle'),
            input: 'textarea',
            inputLabel: t('admin.changeRequestView.rejectInputLabel'),
            inputPlaceholder: t('admin.changeRequestView.rejectInputPlaceholder'),
            inputValue: '',
            inputAttributes: {
                'aria-label': t('admin.changeRequestView.rejectInputLabel'),
            },
            showCancelButton: true,
            confirmButtonText: t('admin.changeRequestView.rejectConfirmButton'),
            cancelButtonText: t('admin.changeRequestView.cancel'),
            confirmButtonColor: '#f1416c',
            focusConfirm: false,
        });

        if (!result.isConfirmed) {
            return;
        }

        const note = (result.value || '').trim();

        try {
            setActionLoading(true);
            const response = await rejectChangeRequest(changeRequest.id, {
                moderation_note: note || undefined,
            });
            const success = response?.status ?? response?.success ?? false;

            if (!success) {
                throw new Error(response?.message || t('admin.changeRequestView.rejectFailed'));
            }

            const payload = response?.data ?? {};
            if (payload?.change_request) {
                setChangeRequest(payload.change_request);
                setModerationNote(payload.change_request.moderation_note || note);
            } else {
                setModerationNote(note);
            }

            toast.success(payload?.message || t('admin.changeRequestView.rejectSuccess'));
        } catch (error) {
            console.error('Error rejecting change request:', error);
            toast.error(error?.message || t('admin.changeRequestView.rejectFailed'));
        } finally {
            setActionLoading(false);
        }
    }, [actionLoading, changeRequest, t]);

    const toolbarActions = useMemo(() => {
        const items = [];

        items.push(
            <Link key="history" to="/admin/merchants/change-requests" className="btn btn-sm btn-light">
                {t('admin.changeRequestView.backToHistory')}
            </Link>
        );

        if (changeRequest) {
            const changeableLink =
                changeRequest.changeable_type === 'merchant'
                    ? `/admin/merchants/${changeRequest.changeable_id}`
                    : changeRequest.changeable_type === 'branch'
                        ? `/admin/branches/${changeRequest.changeable_id}`
                        : null;

            if (changeableLink) {
                items.push(
                    <Link key="subject" to={changeableLink} className="btn btn-sm btn-light-primary">
                        {t('admin.changeRequestView.viewSubject', { label: changeRequest.changeable_label || t('admin.changeRequestView.subject') })}
                    </Link>
                );
            }

            if (changeRequest.status === 'pending') {
                items.push(
                    <div key="moderation" className="btn-group">
                        <button
                            type="button"
                            className="btn btn-sm btn-light-success"
                            onClick={handleApprove}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : null}
                            {t('admin.changeRequestView.approve')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-light-danger"
                            onClick={handleReject}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : null}
                            {t('admin.changeRequestView.reject')}
                        </button>
                    </div>
                );
            }
        }

        return <div className="d-flex align-items-center gap-2">{items}</div>;
    }, [actionLoading, changeRequest, handleApprove, handleReject, t]);

    useEffect(() => {
        setActions(toolbarActions);
    }, [setActions, toolbarActions]);

    if (loading) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="placeholder-glow">
                        <div className="placeholder col-6 mb-3"></div>
                        <div className="placeholder col-12 mb-2"></div>
                        <div className="placeholder col-8"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!changeRequest) {
        return (
            <div className="card">
                <div className="card-body text-center py-20">
                    <h3 className="mb-3">{t('admin.changeRequestView.notFoundTitle')}</h3>
                    <Link to="/admin/merchants/change-requests" className="btn btn-light-primary">
                        {t('admin.changeRequestView.backToHistoryButton')}
                    </Link>
                </div>
            </div>
        );
    }

    const changeEntries = Object.entries(changeRequest.changes || {});
    const requestTypeBadge =
        changeRequest.request_type === 'Attachments' ? 'badge-light-info' : 'badge-light-primary';

    return (
        <>
            <div className="card mb-5">
                <div className="card-body">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4">
                        <div>
                            <h2 className="fw-bold mb-1">{t('admin.changeRequestView.changeRequest', { id: changeRequest.id })}</h2>
                            <div className="d-flex flex-wrap align-items-center gap-2">
                                <span className={`badge ${statusBadgeClass(changeRequest.status)}`}>
                                    {formatStatus(changeRequest.status, t)}
                                </span>
                                <span className="badge badge-light-info text-capitalize">
                                    {changeRequest.changeable_type || t('admin.changeRequestView.unknown')}
                                </span>
                                <span className={`badge ${requestTypeBadge}`}>
                                    {changeRequest.request_type || t('admin.changeRequestView.profile')}
                                </span>
                                {changeRequest.has_file && (
                                    <span className="badge badge-light-success">
                                        {t('admin.changeRequestView.includesAttachments')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-muted text-end">
                            <div>{t('admin.changeRequestView.created')} <strong>{formatDateTime(changeRequest.created_at, t)}</strong></div>
                            <div>{t('admin.changeRequestView.approved')} <strong>{formatDateTime(changeRequest.approved_at, t)}</strong></div>
                            <div>{t('admin.changeRequestView.rejected')} <strong>{formatDateTime(changeRequest.rejected_at, t)}</strong></div>
                        </div>
                    </div>

                    <div className="row g-5 mt-5">
                        <div className="col-lg-6">
                            <div className="border rounded p-4 h-100">
                                <h5 className="fw-bold mb-3">{t('admin.changeRequestView.subject')}</h5>
                                <div className="d-flex flex-column gap-3">
                                    <div>
                                        <span className="text-muted d-block">{t('admin.changeRequestView.type')}</span>
                                        <span className="fw-semibold text-capitalize">
                                            {changeRequest.changeable_label || t('admin.changeRequestView.unknown')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted d-block">{t('admin.changeRequestView.name')}</span>
                                        <span className="fw-semibold">
                                            {changeRequest.changeable_name || t('admin.changeRequestView.na')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted d-block">{t('admin.changeRequestView.reason')}</span>
                                        <span className="fw-semibold">
                                            {changeRequest.reason || t('admin.changeRequestView.noReasonProvided')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="border rounded p-4 h-100">
                                <h5 className="fw-bold mb-3">{t('admin.changeRequestView.reviewInformation')}</h5>
                                <div className="d-flex flex-column gap-3">
                                    <div>
                                        <span className="text-muted d-block">{t('admin.changeRequestView.requestedBy')}</span>
                                        <span className="fw-semibold">
                                            {renderActor(changeRequest.requester, t)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted d-block">{t('admin.changeRequestView.reviewedBy')}</span>
                                        <span className="fw-semibold">
                                            {renderActor(changeRequest.approver, t)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted d-block">{t('admin.changeRequestView.moderatorNote')}</span>
                                        <span className="fw-semibold">
                                            {changeRequest.moderation_note || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.changeRequestView.fieldComparison')}</h3>
                </div>
                <div className="card-body">
                    {changeEntries.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-row-bordered align-middle">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>{t('admin.changeRequestView.field')}</th>
                                        <th>{t('admin.changeRequestView.currentValue')}</th>
                                        <th>{t('admin.changeRequestView.requestedValue')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {changeEntries.map(([label, values]) => {
                                        const isAttachment = values.is_attachment || ATTACHMENT_FIELDS.has(values.field);
                                        return (
                                            <tr key={values.field || label}>
                                                <td className="fw-semibold">{label}</td>
                                                <td>{renderFieldValue(values, 'current')}</td>
                                                <td className={isAttachment ? '' : 'fw-semibold text-primary'}>
                                                    {renderFieldValue(values, 'requested')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-secondary mb-0">
                            {t('admin.changeRequestView.noDifferences')}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminChangeRequestView;


