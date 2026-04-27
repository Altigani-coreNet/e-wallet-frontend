import React, { useEffect } from 'react';

const Overview = ({ user, merchant, merchantCompletion, logs, onEditClick }) => {
    useEffect(() => {
        console.log('=== Overview Component Props ===');
        console.log('User:', user);
        console.log('Merchant:', merchant);
        console.log('Merchant Completion:', merchantCompletion);
        console.log('Logs:', logs);
        console.log('===============================');
    }, [user, merchant, merchantCompletion, logs]);

    const handleEditClick = (e) => {
        e.preventDefault();
        if (onEditClick) {
            // Determine which edit mode based on merchant status
            if (merchant?.status === 'rejected') {
                onEditClick('edit-rejected');
            } else {
                onEditClick('edit');
            }
        }
    };

    return (
        <div className="row">
            {/* Merchant Basic Information */}
            <div className="col-lg-12">
                <div className="card mb-5 mb-xl-10" id="kt_merchant_basic_details">
                    <div className="card-header cursor-pointer">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Basic Information</h3>
                        </div>
                        <div className="card-toolbar">
                            <button 
                                onClick={handleEditClick}
                                className="btn btn-sm btn-primary"
                            >
                                <i className="ki-duotone ki-pencil fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Edit
                            </button>
                        </div>
                    </div>
                    
                    <div className="card-body p-9">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Business Name</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.name || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Owner Name</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.owner_name || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant Email</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.email || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant Phone</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.phone || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Business Type</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.business_type || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant Code</label>
                            <div className="col-lg-8">
                                <span className="badge badge-light-primary fs-6">
                                    {merchant?.merchant_code || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant Address</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.address || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant Status</label>
                            <div className="col-lg-8">
                                <span className={`badge badge-light-${
                                    merchant?.status === 'approved' ? 'success' : 
                                    merchant?.status === 'rejected' ? 'danger' : 
                                    'warning'
                                }`}>
                                    {merchant?.status || 'pending'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Created Date</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.created_at ? new Date(merchant.created_at).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Account Details & Events */}
            {user && (
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card mb-5 mb-xl-10" id="kt_merchant_user_details">
                            <div className="card-header cursor-pointer">
                                <div className="card-title m-0">
                                    <h3 className="fw-bolder m-0">Associated User Account</h3>
                                </div>
                            </div>
                            
                            <div className="card-body p-9">
                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">Full Name</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.name || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">Username</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.user_name || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">User Email</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.email || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">User Phone</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.phone || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">User Status</label>
                                    <div className="col-lg-8">
                                        <span className={`badge badge-light-${user.is_approved ? 'success' : 'danger'}`}>
                                            {user.is_approved ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">User Created</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: '2-digit', 
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Events Timeline */}
                    <div className="col-md-4">
                        <div className="card card-xl-stretch mb-xl-10">
                            <div className="card-header align-items-center border-0 mt-4">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="fw-bolder mb-2 text-dark">Events</span>
                                    <span className="text-muted fw-bold fs-7">
                                        {logs?.length || 0} recent activities
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="card-body pt-5">
                                <div className="timeline-label">
                                    <style>{`
                                        .timeline-label:before {
                                            left: 101px;
                                        }
                                    `}</style>
                                    
                                    {logs && logs.length > 0 ? (
                                        logs.map((event, index) => (
                                            <div key={index} className="timeline-item">
                                                <div className="timeline-label fw-bolder text-gray-800 fs-6" style={{ width: '100px' }}>
                                                    {event.time || 'N/A'}
                                                </div>
                                                
                                                <div className="timeline-badge">
                                                    <i className={`fa fa-genderless text-${event.label || 'primary'} fs-1`}></i>
                                                </div>
                                                
                                                <div className="fw-normal timeline-content text-muted ps-3">
                                                    {event.text || 'Activity logged'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            No recent events
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No User Alert */}
            {!user && (
                <div className="col-lg-12">
                    <div className="card mb-5 mb-xl-10">
                        <div className="card-body p-9">
                            <div className="alert alert-warning d-flex align-items-center p-5">
                                <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-warning">No User Account Associated</h4>
                                    <span>This merchant does not have an associated user account.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;

