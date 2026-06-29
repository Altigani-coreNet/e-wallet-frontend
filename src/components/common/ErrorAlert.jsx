import React from 'react';

const ErrorAlert = ({ message, error, onClose, onRetry }) => {
    const resolvedMessage = message ?? error;

    if (!resolvedMessage) return null;

    const displayMessage =
        typeof resolvedMessage === 'string'
            ? resolvedMessage
            : resolvedMessage?.message || JSON.stringify(resolvedMessage);

    return (
        <div className="alert alert-danger d-flex align-items-center p-5 mb-10" role="alert">
            <i className="ki-duotone ki-shield-cross fs-2hx text-danger me-4">
                <span className="path1"></span>
                <span className="path2"></span>
                <span className="path3"></span>
            </i>

            <div className="d-flex flex-column flex-grow-1">
                <h4 className="mb-1 text-danger">Error</h4>
                <span>{displayMessage}</span>
            </div>

            <div className="d-flex align-items-center gap-2 ms-3">
                {onRetry ? (
                    <button type="button" className="btn btn-sm btn-light-danger" onClick={onRetry}>
                        Retry
                    </button>
                ) : null}
                {onClose ? (
                    <button
                        type="button"
                        className="btn-close"
                        onClick={onClose}
                        aria-label="Close"
                    ></button>
                ) : null}
            </div>
        </div>
    );
};

export default ErrorAlert;

