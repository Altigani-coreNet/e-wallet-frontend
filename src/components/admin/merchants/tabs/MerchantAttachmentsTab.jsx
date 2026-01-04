import React from 'react';

const typeLabels = {
    trade_license_document: 'Trade License',
    tax_certificate_document: 'Tax Certificate',
    company_logo_document: 'Company Logo',
    identity_document: 'Identity Document',
    other: 'Other',
};

const resolveAttachmentName = (attachment) => {
    if (!attachment) return 'Document';
    return typeLabels[attachment.url_type] || attachment.url_type || attachment.title || 'Document';
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
    return (
        <div className="card">
            <div className="card-header border-0 align-items-center">
                <div className="card-title">
                    <h3 className="fw-bold mb-0">Attachments</h3>
                </div>
                {/* TODO: Add attachment filtering (by document type) when the UX is ready. */}
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                <th className="min-w-200px">Document</th>
                                <th className="min-w-150px">Type</th>
                                <th className="min-w-180px">Uploaded At</th>
                                <th className="text-end min-w-120px">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="fw-semibold text-gray-600">
                            {attachments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-600">
                                        No attachments found
                                    </td>
                                </tr>
                            ) : (
                                attachments.map((attachment) => (
                                    <tr key={attachment.id || attachment.url || attachment.path}>
                                        <td className="text-gray-700">
                                            {attachment.original_name || attachment.file_name || resolveAttachmentName(attachment)}
                                        </td>
                                        <td className="text-gray-700">{resolveAttachmentName(attachment)}</td>
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
                                                View
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


