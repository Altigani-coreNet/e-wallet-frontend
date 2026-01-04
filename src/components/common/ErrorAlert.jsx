import React from 'react';

const ErrorAlert = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="alert alert-danger d-flex align-items-center p-5 mb-10" role="alert">
            <i className="ki-duotone ki-shield-cross fs-2hx text-danger me-4">
                <span className="path1"></span>
                <span className="path2"></span>
                <span className="path3"></span>
            </i>

            <div className="d-flex flex-column flex-grow-1">
                <h4 className="mb-1 text-danger">Error</h4>
                <span>{typeof message === 'string' ? message : JSON.stringify(message)}</span>
            </div>

            {onClose && (
                <button
                    type="button"
                    className="btn-close"
                    onClick={onClose}
                    aria-label="Close"
                ></button>
            )}
        </div>
    );
};

export default ErrorAlert;

