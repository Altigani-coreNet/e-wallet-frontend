import React from 'react';

const PartnerViewSkeleton = () => (
    <>
        <style>{`
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s ease-in-out infinite;
                border-radius: 4px;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `}</style>

        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="card mb-5 mb-xl-10">
                    <div className="card-body pt-9 pb-0">
                        <div className="d-flex flex-wrap mb-6">
                            <div className="skeleton rounded me-7 mb-4" style={{ width: '160px', height: '160px' }} />
                            <div className="flex-grow-1">
                                <div className="skeleton mb-3" style={{ width: '280px', height: '32px' }} />
                                <div className="skeleton mb-2" style={{ width: '220px', height: '20px' }} />
                                <div className="d-flex flex-wrap gap-3 mt-6">
                                    <div className="skeleton" style={{ width: '125px', height: '72px' }} />
                                    <div className="skeleton" style={{ width: '125px', height: '72px' }} />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-4 mb-5">
                            <div className="skeleton" style={{ width: '90px', height: '24px' }} />
                            <div className="skeleton" style={{ width: '80px', height: '24px' }} />
                            <div className="skeleton" style={{ width: '100px', height: '24px' }} />
                        </div>
                    </div>
                </div>

                <div className="row g-5 g-xl-8">
                    <div className="col-xl-8">
                        <div className="card mb-5 mb-xl-10">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <div className="skeleton" style={{ width: '200px', height: '28px' }}></div>
                                </div>
                            </div>

                            <div className="card-body border-top p-9">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div key={index} className="row mb-7">
                                        <div className="col-lg-4">
                                            <div className="skeleton" style={{ width: '120px', height: '18px' }}></div>
                                        </div>
                                        <div className="col-lg-8">
                                            <div
                                                className="skeleton"
                                                style={{ width: index % 2 === 0 ? '200px' : '250px', height: '18px' }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-4">
                        <div className="card">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <div className="skeleton" style={{ width: '100px', height: '28px' }}></div>
                                </div>
                            </div>

                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-5">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="skeleton"
                                            style={{ width: '100%', height: '42px', borderRadius: '6px' }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
);

export default PartnerViewSkeleton;
