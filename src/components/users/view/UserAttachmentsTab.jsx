import React from 'react';
import { useTranslation } from 'react-i18next';

const formatDateTime = (value, na) => {
    if (!value) return na;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const renderAttachmentIcon = (type) => {
    switch (type) {
        case 'image':
            return 'ki-image';
        case 'document':
            return 'ki-folder';
        default:
            return 'ki-file';
    }
};

const UserAttachmentsTab = ({ attachments = [] }) => {
    const { t } = useTranslation();
    const na = t('merchant.common.na');

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">{t('merchant.users.attachmentsTab.title')}</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">
                                {t('merchant.users.attachmentsTab.filesBadge', { count: attachments.length })}
                            </span>
                        </div>
                    </div>
                    <div className="card-body">
                        {attachments.length > 0 ? (
                            <div className="row g-6">
                                {attachments.map((attachment) => (
                                    <div className="col-md-6 col-lg-4" key={attachment.id}>
                                        <div className="card card-bordered h-100">
                                            <div className="card-body d-flex flex-column">
                                                <div className="d-flex align-items-center mb-5">
                                                    <div className="symbol symbol-45px me-4">
                                                        <span className="symbol-label bg-light-primary">
                                                            <i
                                                                className={`ki-duotone ${renderAttachmentIcon(attachment.type)} text-primary fs-2`}
                                                            >
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                        </span>
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <span className="text-gray-900 fw-bold fs-6">
                                                            {attachment.title || t('merchant.users.attachmentsTab.untitled')}
                                                        </span>
                                                        <span className="text-muted fs-7">
                                                            {attachment.type ? attachment.type.toUpperCase() : t('merchant.users.attachmentsTab.fileFallback')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {attachment.details && (
                                                    <p className="text-gray-600 fs-7 flex-grow-1">{attachment.details}</p>
                                                )}

                                                <div className="d-flex justify-content-between align-items-center mt-4">
                                                    <span className="text-muted fs-8">{formatDateTime(attachment.created_at, na)}</span>
                                                    {attachment.url && (
                                                        <a
                                                            className="btn btn-sm btn-light-primary"
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {t('merchant.users.attachmentsTab.view')}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <i className="ki-duotone ki-folder fs-3x text-gray-400 mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <h4 className="fw-bold text-gray-800 mb-3">{t('merchant.users.attachmentsTab.emptyTitle')}</h4>
                                <p className="text-gray-500 fs-6 mb-0">{t('merchant.users.attachmentsTab.emptyHint')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAttachmentsTab;
