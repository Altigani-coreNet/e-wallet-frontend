import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Public payment error page matching the SoftPos blade view.
 */
const PaymentError = () => {
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
                                <h2 className="fs-2x fw-bolder mb-0">There was an error in the payment.</h2>
                            </div>
                            <div className="text-center pb-15 px-5 d-flex justify-content-center align-items-center">
                                <div className="mw-100 h-200px h-sm-325px">
                                    {/* Inline SVG from blade for parity */}
                                    <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" width="300.7" height="300.81" viewBox="0 0 1022.7 785.81" aria-label="Payment error illustration">
                                        <defs>
                                            <linearGradient id="af83dc26-9572-4816-b7a1-1af4f72ff554-216" x1="678.2" y1="821.79" x2="678.2" y2="493.4" gradientTransform="translate(-20.24 29.65) rotate(-2.31)" gradientUnits="userSpaceOnUse">
                                                <stop offset="0" stopColor="gray" stopOpacity="0.25" />
                                                <stop offset="0.54" stopColor="gray" stopOpacity="0.12" />
                                                <stop offset="1" stopColor="gray" stopOpacity="0.1" />
                                            </linearGradient>
                                        </defs>
                                        <title>bug fixing</title>
                                        <ellipse cx="200.63" cy="200.88" rx="425" ry="33" fill="#e60b12" opacity="0.1" />
                                        <g opacity="0.1">
                                            <path d="M933.7,529.93c-2.54-7.71-12.84-11.26-23-7.92a24.76,24.76,0,0,0-4.23,1.83c-.65-.18-1.32-.34-2-.46a22.42,22.42,0,0,0,.63-6.79A24.6,24.6,0,0,0,916,495.12a24.63,24.63,0,0,0,10.86-21.47,23.76,23.76,0,0,0,8.23-9.32c4.9-9.7,2.87-20.6-4.54-24.35s-17.4,1.08-22.3,10.78a23.69,23.69,0,0,0-2.63,12.15,24.63,24.63,0,0,0-10.86,21.47,24.63,24.63,0,0,0-10.86,21.47A24.64,24.64,0,0,0,873,527.33a23.76,23.76,0,0,0-8.23,9.32,25.46,25.46,0,0,0-2.08,5.74,21.18,21.18,0,0,0-4.44-4.73,25.38,25.38,0,0,0-1-4.5c-3.34-10.17-12.3-16.37-20-13.83s-11.26,12.83-7.92,23a23.07,23.07,0,0,0,7.56,11.08,25.38,25.38,0,0,0,1,4.5c1.94,5.9,5.77,10.46,10.15,12.75a23.23,23.23,0,0,0-.83,3.9,25.29,25.29,0,0,0-7.54,14.91,25.27,25.27,0,0,0-7.54,14.92,24.63,24.63,0,0,0-5,6.81c-4.91,9.7-2.88,20.61,4.53,24.35s17.4-1.07,22.31-10.78a24.62,24.62,0,0,0,2.5-8.09,25.29,25.29,0,0,0,7.54-14.91,25.27,25.27,0,0,0,7.54-14.92A25.21,25.21,0,0,0,879,571.94,25.21,25.21,0,0,0,886.56,557a24.11,24.11,0,0,0,3.39-4,23.46,23.46,0,0,0,12.27-.77,24.76,24.76,0,0,0,4.23-1.83,23.2,23.2,0,0,0,13.42-.48C930,546.61,936.23,537.65,933.7,529.93Z" transform="translate(-88.65 -57.09)" fill="#3f3d56" />
                                        </g>
                                        <path d="M1067.88,293.07a72,72,0,0,0,8.72-4.83l-32.33-23.62,38,19.57a72.13,72.13,0,0,0,27-50.31l-64.58.66,64.72-10.82A72,72,0,1,0,966.83,242a72.09,72.09,0,0,0-13.26,8l33.75,46.93L946.8,255.85a72.08,72.08,0,0,0-20.17,65.61,72,72,0,1,0,101.05,51.1,72,72,0,0,0,40.2-79.49Z" transform="translate(-88.65 -57.09)" fill="#e60b12" />
                                        <circle cx="925.49" cy="102.72" r="10.69" fill="#e60b12" />
                                        <circle cx="987.93" cy="109.58" r="10.69" fill="#e60b12" />
                                        <circle cx="1012.01" cy="205.64" r="10.69" fill="#e60b12" />
                                        <circle cx="979.51" cy="253.61" r="10.69" fill="#e60b12" />
                                        <circle cx="935.11" cy="353.24" r="10.69" fill="#e60b12" />
                                        <circle cx="836.39" cy="240.4" r="10.69" fill="#e60b12" />
                                        <ellipse cx="615.63" cy="756.88" rx="115" ry="20" fill="#e60b12" opacity="0.1" />
                                        <path d="M556.71,624.08a15.4,15.4,0,0,0,12.13-5.89h0a16.06,16.06,0,0,0,1.2-1.76L561.57,615l9.15.06a15.42,15.42,0,0,0,.29-12.21l-12.27,6.36,11.32-8.32a15.42,15.42,0,1,0-25.47,17.26h0A15.4,15.4,0,0,0,556.71,624.08Z" transform="translate(-88.65 -57.09)" fill="#e60b12" />
                                    </svg>
                                </div>
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

export default PaymentError;


