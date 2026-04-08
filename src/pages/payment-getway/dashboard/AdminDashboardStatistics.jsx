import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardStatistics = ({ data, subscriptionData, loading, subscriptionLoading }) => {
    const stats = data?.statistics || {};
    const subStats = subscriptionData?.subscriptionData?.statistics || {};

    useEffect(() => {
        console.log('AdminDashboardStatistics - Data:', { data, stats, subscriptionData, subStats, loading, subscriptionLoading });
    }, [data, stats, subscriptionData, subStats, loading, subscriptionLoading]);

    return (
        <>
            <style>{`
                .hover-elevate-up {
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .hover-elevate-up:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
                }
                .skeleton {
                    position: relative;
                    overflow: hidden;
                    background: #f3f4f6;
                    border-radius: 8px;
                }
                .skeleton::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
                    animation: skeleton-loading 1.4s infinite;
                }
                @keyframes skeleton-loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            
            <div className="row gy-5 g-xl-10 mb-5">
                {/* Content Providers */}
                <div className="col-xl-3 mb-xl-10">
                    <Link to="/admin/partners" className="card card-flush h-xl-100 cursor-pointer hover-elevate-up" style={{ textDecoration: 'none' }}>
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Partners</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Total partners</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {subscriptionLoading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {subStats.partnerCount || 0}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {subscriptionLoading
                                ? <div className="skeleton mt-2" style={{ width: '50%', height: '16px' }}></div>
                                : <span className="badge badge-light-success">{subStats.activePartners || 0} active</span>}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Products */}
            <div className="col-xl-3 mb-xl-10">
                <Link to="/admin/services" className="card card-flush h-xl-100 bg-light-info cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Products</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Total products</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {loading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {stats.totalProducts || 0}
                                    </span>
                                )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Total Subscriptions */}
            <div className="col-xl-3 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-success cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Transactions</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Active transactions</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {subscriptionLoading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {subStats.activeTransactions?.toLocaleString() || 0}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {subscriptionLoading
                                ? <div className="skeleton mt-2" style={{ width: '50%', height: '16px' }}></div>
                                : (
                                    <span className="badge badge-light-success">
                                        +{subStats.newTransactionsThisMonth || 0} this month
                                    </span>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Revenue */}
            <div className="col-xl-3 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-primary cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Total Revenue</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">From product revenue</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {subscriptionLoading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        ${subStats.totalRevenue?.toLocaleString() || 0}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {subscriptionLoading
                                ? <div className="skeleton mt-2" style={{ width: '45%', height: '16px' }}></div>
                                : `$${subStats.monthlyRevenue?.toLocaleString() || 0} this month`}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        </>
    );
};

export default AdminDashboardStatistics;



