import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'lg' }) => {
    const spinnerClass = size === 'sm' ? 'spinner-border-sm' : '';
    
    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-10">
            <div className={`spinner-border text-primary ${spinnerClass}`} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            {message && (
                <p className="text-muted mt-3">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;

