import React from 'react';
import { Link } from 'react-router-dom';

const Error404 = () => {
    return (
        <div className="d-flex flex-column flex-root">
            <div
                className=" d-flex flex-column flex-center flex-column-fluid p-10 bgi-size-cover bgi-position-center bgi-no-repeat "
                style={{ backgroundImage: "url('/assets/media/auth/bg1.jpg')" }}
            >
                <div className="d-flex flex-column flex-center text-center p-10 w-100">
                    <div className="card card-flush w-lg-650px py-5">
                        <div className="card-body py-15 py-lg-20">
                            <h1 className="fw-bolder fs-2hx text-gray-900 mb-4">Oops!</h1>
                            <div className="fw-semibold fs-6 text-gray-500 mb-7">We can't find that page.</div>
                            <div className="mb-3">
                                <img src="/assets/media/auth/404-error.png" className="mw-100 mh-300px" alt="Not found" />
                                <img src="/assets/media/auth/404-error-dark.png" className="mw-100 mh-300px" alt="Not found" />
                            </div>
                            <div className="mb-0 d-flex justify-content-center">
                                <Link to="/merchant/dashboard" className="btn btn-sm btn-primary">Return Home</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Error404;


