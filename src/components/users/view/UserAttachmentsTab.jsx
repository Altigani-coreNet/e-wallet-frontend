import React from 'react';

const formatDateTime = (value) => {
    if (!value) return 'N/A';
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
    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Attachments</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">{attachments.length} files</span>
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
                                                                className={`ki-duotone ${renderAttachmentIcon(
                                                                    attachment.type
                                                                )} text-primary fs-2`}
                                                            >
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                        </span>
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <span className="text-gray-900 fw-bold fs-6">
                                                            {attachment.title || 'Untitled Attachment'}
                                                        </span>
                                                        <span className="text-muted fs-7">
                                                            {attachment.type ? attachment.type.toUpperCase() : 'FILE'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {attachment.details && (
                                                    <p className="text-gray-600 fs-7 flex-grow-1">{attachment.details}</p>
                                                )}

                                                <div className="d-flex justify-content-between align-items-center mt-4">
                                                    <span className="text-muted fs-8">
                                                        {formatDateTime(attachment.created_at)}
                                                    </span>
                                                    {attachment.url && (
                                                        <a
                                                            className="btn btn-sm btn-light-primary"
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            View
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
                                <h4 className="fw-bold text-gray-800 mb-3">No Attachments Found</h4>
                                <p className="text-gray-500 fs-6 mb-0">
                                    Upload user documents or images to keep related records in one place.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAttachmentsTab;

