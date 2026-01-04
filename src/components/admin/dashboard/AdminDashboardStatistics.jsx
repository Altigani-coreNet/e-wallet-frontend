import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardStatistics = ({ data, loading }) => {
    const stats = data?.statistics || {};

    useEffect(() => {
        console.log('AdminDashboardStatistics - Data:', { data, stats, loading });
    }, [data, stats, loading]);

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
                {/* Total Merchants */}
                <div className="col-xl-3 mb-xl-10">
                    <Link to="/admin/merchants" className="card card-flush h-xl-100 cursor-pointer hover-elevate-up" style={{ textDecoration: 'none' }}>
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Total Merchants</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Active merchants count</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {loading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {stats.totalMerchants || 0}
                                    </span>
                                )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Total Users */}
            <div className="col-xl-3 mb-xl-10">
                <Link to="/admin/users" className="card card-flush h-xl-100 bg-light-info cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Total Users</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Active users count</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {loading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {stats.totalUsers || 0}
                                    </span>
                                )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Total Terminals */}
            <div className="col-xl-3 mb-xl-10">
                <Link to="/admin/terminals" className="card card-flush h-xl-100 bg-light-warning cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Total Terminals</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">Active terminals count</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {loading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {stats.totalTerminals || 0}
                                    </span>
                                )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Total Transactions */}
            <div className="col-xl-3 mb-xl-10">
                <Link to="/admin/transactions" className="card card-flush h-xl-100 bg-light-primary cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">Total Transactions</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">All time transactions</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {loading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {stats.totalTransactions || 0}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {loading
                                ? <div className="skeleton mt-2" style={{ width: '45%', height: '16px' }}></div>
                                : `$${stats.totalAmount || '0.00'} total`}
                        </div>
                    </div>
                </Link>
            </div>
            
        </div>
        </>
    );
};

export default AdminDashboardStatistics;



