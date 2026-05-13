import React from 'react';
import { useTranslation } from 'react-i18next';

const TYPE_KEYS = ['trade_license_document', 'tax_certificate_document', 'company_logo_document', 'identity_document', 'other'];

const resolveAttachmentName = (attachment, t) => {
    if (!attachment) return t('admin.merchantsUI.document');
    if (attachment.url_type && TYPE_KEYS.includes(attachment.url_type)) {
        return t(`admin.merchantsUI.attachmentsTab.types.${attachment.url_type}`);
    }
    return attachment.url_type || attachment.title || t('admin.merchantsUI.document');
};

const buildAttachmentUrl = (attachment) => {
    if (!attachment) return '#';
    if (attachment.full_url) return attachment.full_url;
    if (attachment.url) {
        const base = import.meta.env.VITE_AUTH_SERVICE_URL || window.location.origin;
        return `${base}/${attachment.url}`.replace(/\\/g, '/');
    }
    if (attachment.path) {
        const base = import.meta.env.VITE_AUTH_SERVICE_URL || window.location.origin;
        return `${base}/${attachment.path}`.replace(/\\/g, '/');
    }
    return '#';
};

const MerchantAttachmentsTab = ({ attachments = [] }) => {
    const { t } = useTranslation();

    return (
        <div className="card">
            <div className="card-header border-0 align-items-center">
                <div className="card-title">
                    <h3 className="fw-bold mb-0">{t('admin.merchantsUI.attachmentsTab.title')}</h3>
                </div>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                <th className="min-w-200px">{t('admin.merchantsUI.attachmentsTab.colDocument')}</th>
                                <th className="min-w-150px">{t('admin.merchantsUI.colType')}</th>
                                <th className="min-w-180px">{t('admin.merchantsUI.attachmentsTab.colUploadedAt')}</th>
                                <th className="text-end min-w-120px">{t('admin.merchantsIndex.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody className="fw-semibold text-gray-600">
                            {attachments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-600">
                                        {t('admin.merchantsUI.attachmentsTab.noAttachments')}
                                    </td>
                                </tr>
                            ) : (
                                attachments.map((attachment) => (
                                    <tr key={attachment.id || attachment.url || attachment.path}>
                                        <td className="text-gray-700">
                                            {attachment.original_name || attachment.file_name || resolveAttachmentName(attachment, t)}
                                        </td>
                                        <td className="text-gray-700">{resolveAttachmentName(attachment, t)}</td>
                                        <td className="text-gray-700">
                                            {attachment.created_at ? new Date(attachment.created_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="text-end">
                                            <a
                                                href={buildAttachmentUrl(attachment)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-sm btn-light-primary"
                                            >
                                                {t('admin.common.view')}
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MerchantAttachmentsTab;
