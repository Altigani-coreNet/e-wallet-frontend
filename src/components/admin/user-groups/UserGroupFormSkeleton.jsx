import React from 'react';

const UserGroupFormSkeleton = () => {
    return (
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
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <div className="skeleton" style={{ width: '200px', height: '32px' }}></div>
                                    </div>
                                </div>

                                <div className="card-body p-9">
                                    <div className="row">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="col-md-6 mb-7">
                                                <div className="skeleton" style={{ width: '120px', height: '18px', marginBottom: '8px' }}></div>
                                                <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '6px' }}></div>
                                            </div>
                                        ))}
                                        
                                        {/* Users selection area */}
                                        <div className="col-md-12 mb-7">
                                            <div className="skeleton" style={{ width: '120px', height: '18px', marginBottom: '8px' }}></div>
                                            <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '6px' }}></div>
                                        </div>
                                    </div>

                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-end gap-3">
                                                <div className="skeleton" style={{ width: '100px', height: '42px', borderRadius: '6px' }}></div>
                                                <div className="skeleton" style={{ width: '160px', height: '42px', borderRadius: '6px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserGroupFormSkeleton;

