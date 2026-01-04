import React from 'react';
import { Link } from 'react-router-dom';

const CompletionStep = () => {
    return (
        <div className="w-600px">
            <div className="card-body text-center p-10">
                <div className="mb-5">
                    <i className="fas fa-check-circle text-success fs-3x"></i>
                </div>

                <p className="text-muted mb-5">
                    Your merchant registration has been submitted successfully. Our team will review your application
                    and contact you within 24-48 hours for approval.
                </p>

                <div className="notice d-flex bg-light-primary rounded border-primary border border-dashed p-6 mb-5">
                    <div className="d-flex flex-stack flex-grow-1">
                        <div className="fw-bold">
                            <h4 className="text-gray-900 fw-bolder">Welcome to Our Platform!</h4>
                            <div className="fs-6 text-gray-700">
                                You can start exploring our platform's features and interface right away!
                                While some advanced features require admin approval, you have full access to navigate
                                and discover our platform's capabilities. Once your account is approved, you'll receive
                                a confirmation email and can login with your registered email and password to access all features.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-column gap-3">
                    <Link to="/login" className="btn btn-primary">
                        Go to Login
                    </Link>
                    <Link to="/merchant/register" className="btn btn-light">
                        Register Another Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CompletionStep;

