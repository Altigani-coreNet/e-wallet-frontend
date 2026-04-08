import React from 'react';

const PartnerAttachmentsTab = ({ attachments = [], loading, resolveAssetUrl, onDeleteAttachment }) => (
    <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">Attachments</h3>
            </div>
        </div>
        <div className="card-body border-top p-9">
            {loading ? (
                <div className="text-muted">Loading attachments...</div>
            ) : attachments.length === 0 ? (
                <div className="text-muted">No attachments found.</div>
            ) : (
                attachments.map((file, idx) => (
                    <div key={idx} className="d-flex justify-content-between border-bottom py-3">
                        <span className="text-gray-800">{file.name || file.url_type || 'Attachment'}</span>
                        <div className="d-flex gap-2">
                            {file.url && (
                                <a
                                    href={resolveAssetUrl(file.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-light-primary"
                                >
                                    View
                                </a>
                            )}
                            <button
                                type="button"
                                className="btn btn-sm btn-light-danger"
                                onClick={() => onDeleteAttachment?.(file)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

export default PartnerAttachmentsTab;
