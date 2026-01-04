import React from 'react';
import { Link } from 'react-router-dom';

const Error500 = () => {
    return (
        <div className="d-flex flex-column flex-root">
            <div
                className="d-flex flex-column flex-center flex-column-fluid p-10 bgi-size-cover bgi-position-center bgi-no-repeat"
                style={{ backgroundImage: "url('/assets/media/auth/bg7.jpg')" }}
            >
                <div className="d-flex flex-column flex-center text-center p-10 w-100">
                    <div className="card card-flush w-lg-650px py-5">
                        <div className="card-body py-15 py-lg-20">
                            <h1 className="fw-bolder fs-2qx text-gray-900 mb-4">System Error</h1>
                            <div className="fw-semibold fs-6 text-gray-500 mb-7">
                                Something went wrong! Please try again later.
                            </div>
                            <div className="mb-11">
                                <img
                                    src="/assets/media/auth/500-error.png"
                                    className="mw-100 mh-300px theme-light-show"
                                    alt="Error"
                                />
                                <img
                                    src="/assets/media/auth/500-error-dark.png"
                                    className="mw-100 mh-300px theme-dark-show"
                                    alt="Error"
                                />
                            </div>
                            <div className="mb-0 d-flex justify-content-center gap-3">
                                <button className="btn btn-sm btn-light" onClick={() => window.location.reload()}>
                                    Reload
                                </button>
                                <Link to="/merchant/dashboard" className="btn btn-sm btn-primary">
                                    Return Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Error500;


