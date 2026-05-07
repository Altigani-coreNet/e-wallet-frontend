import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleAlert, RotateCcw, Home } from 'lucide-react';
import './PaymentError.css';

const PaymentError = () => {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const reason = params.get('reason') || 'The payment could not be completed. Please try again.';

    return (
        <div className="pe-page">
            <div className="pe-card">
                <div className="pe-header">
                    <div className="pe-error-icon">
                        <CircleAlert size={52} strokeWidth={2.5} />
                    </div>
                    <div className="pe-header-text">
                        <h1>Payment Failed</h1>
                        <h2>Something went wrong</h2>
                        <p>{reason}</p>
                    </div>
                </div>

                <div className="pe-line" />

                <div className="pe-content">
                    <div className="pe-note">
                        This can happen if the card is rejected, the payment link is expired, or the payment was interrupted.
                    </div>
                    <div className="pe-note pe-note-muted">
                        Please verify details and try again from the payment link page.
                    </div>
                </div>

                <div className="pe-actions">
                    <button className="pe-btn pe-btn-light" onClick={() => window.history.back()}>
                        <RotateCcw size={16} />
                        Try Again
                    </button>
                    <Link className="pe-btn pe-btn-primary" to="/">
                        <Home size={16} />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentError;


