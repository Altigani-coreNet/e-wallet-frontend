import React from 'react';
import { useTranslation } from 'react-i18next';

const PartnerAttachmentsTab = ({ attachments = [], loading, resolveAssetUrl, onDeleteAttachment }) => {
    const { t } = useTranslation();
    return (
        <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">{t('admin.paymentGetway.viewAttachmentsTitle')}</h3>
            </div>
        </div>
        <div className="card-body border-top p-9">
            {loading ? (
                <div className="text-muted">{t('admin.paymentGetway.viewLoadingAttachments')}</div>
            ) : attachments.length === 0 ? (
                <div className="text-muted">{t('admin.paymentGetway.viewNoAttachmentsFound')}</div>
            ) : (
                attachments.map((file, idx) => (
                    <div key={idx} className="d-flex justify-content-between border-bottom py-3">
                        <span className="text-gray-800">{file.name || file.url_type || t('admin.paymentGetway.viewAttachmentFallback')}</span>
                        <div className="d-flex gap-2">
                            {file.url && (
                                <a
                                    href={resolveAssetUrl(file.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-light-primary"
                                >
                                    {t('admin.common.view')}
                                </a>
                            )}
                            <button
                                type="button"
                                className="btn btn-sm btn-light-danger"
                                onClick={() => onDeleteAttachment?.(file)}
                            >
                                {t('admin.common.delete')}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
        </div>
    );
};

export default PartnerAttachmentsTab;
