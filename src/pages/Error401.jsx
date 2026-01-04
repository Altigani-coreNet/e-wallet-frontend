import React from 'react';
import { Link } from 'react-router-dom';

const Error401 = () => {
    return (
        <div className="d-flex flex-column flex-root">
            <div
                className="d-flex flex-column flex-center flex-column-fluid p-10 bgi-size-cover bgi-position-center bgi-no-repeat"
                style={{ backgroundImage: "url('/assets/media/auth/bg1.jpg')" }}
            >
                <div className="d-flex flex-column flex-center text-center p-10 w-100">
                    <div className="card card-flush w-lg-650px py-5">
                        <div className="card-body py-15 py-lg-20">
                            <h1 className="fw-bolder fs-2hx text-gray-900 mb-4">Unauthorized</h1>
                            <div className="fw-semibold fs-6 text-gray-500 mb-7">
                                You don’t have permission to access this page.
                            </div>
                            <div className="mb-11">
                                <img
                                    src="/assets/401.png"
                                    className="mw-100 mh-300px"
                                    alt="Unauthorized"
                                />
                                {/* <img
                                    src="/assets/401.png"
                                    className="mw-100 mh-300px"
                                    alt="Unauthorized"
                                /> */}
                            </div>
                            <div className="mb-0 d-flex justify-content-center gap-3">
                                <Link to="/login" className="btn btn-sm btn-primary">Sign In</Link>
                                <Link to="/merchant/dashboard" className="btn btn-sm btn-light">Return Home</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Error401;


