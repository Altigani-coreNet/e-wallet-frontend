import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Public payment success page matching the SoftPos blade view.
 */
const PaymentSuccess = () => {
    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '70vh' }}
        >
            <div className="card mt-10">
                <div className="card-body">
                    <div
                        className="modal-body pt-0 pb-15 px-5 px-xl-20"
                        style={{ maxWidth: '1200px' }}
                    >
                        {/* Heading */}
                        <div className="mb-13 text-center">
                            <h1 className="mb-3">CoreNet Banking Platforms</h1>
                            <div className="text-muted fw-bold fs-5">
                                If you need more info, please contact{' '}
                                <a href="#" className="link-success fw-bolder">
                                    Our Company
                                </a>
                                .
                            </div>
                        </div>

                        {/* Body */}
                        <div className="-body">
                            <div className="card-px text-center pt-15 pb-15">
                                <h2 className="fs-2x fw-bolder mb-0">You have successfully paid.</h2>
                            </div>
                            <div className="text-center pb-15 px-5 d-flex justify-content-center align-items-center">
                                <img
                                    src="/assets/media/illustrations/sketchy-1/7.png"
                                    alt="Payment success"
                                    className="mw-100 h-200px h-sm-325px"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="text-center">
                            <Link className="btn btn-primary" to="/login">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;


