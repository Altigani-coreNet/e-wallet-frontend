import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleAlert, RotateCcw, Home } from 'lucide-react';
import './PaymentError.css';

const PaymentError = () => {
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason') || 'The payment could not be completed.';
    const amount = searchParams.get('amount') || '';
    const currency = searchParams.get('currency') || '';

    const formattedAmount =
        amount !== '' && !Number.isNaN(Number(amount))
            ? `${currency || 'USD'} ${Number(amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })}`
            : '';

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
                        <p>The payment could not be completed. Please try again.</p>
                    </div>
                </div>

                <div className="pe-line" />

                <div className="pe-content">
                    <div className="pe-note">
                        <strong>Details</strong>
                        <p className="pe-reason-text">{reason}</p>
                    </div>
                    {formattedAmount ? (
                        <div className="pe-details">
                            <div className="pe-detail-row">
                                <span>Attempted amount</span>
                                <strong>{formattedAmount}</strong>
                            </div>
                        </div>
                    ) : null}
                    <div className="pe-note pe-note-muted">
                        Please verify details and try again from the payment link page.
                    </div>
                </div>

                <div className="pe-actions">
                    <button type="button" className="pe-btn pe-btn-light" onClick={() => window.history.back()}>
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
