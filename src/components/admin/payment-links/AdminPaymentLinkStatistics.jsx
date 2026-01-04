import React from 'react';

const AdminPaymentLinkStatistics = ({ statistics, loading }) => {
    if (loading) {
        return (
            <div className="row g-5 g-xl-8 mb-5">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="col-sm-6 col-md-4 text-center">
                        <div className="card bg-light hoverable card-xl-stretch mb-xl-8">
                            <div className="card-body">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-6"></span>
                                </div>
                                <div className="placeholder-glow mt-3">
                                    <span className="placeholder col-8"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!statistics) return null;

    const stats = [
        {
            label: 'Total Payment Links',
            value: statistics.total || 0,
            bgClass: 'bg-light-dark',
        },
        {
            label: 'Completed',
            value: statistics.completed || 0,
            bgClass: 'bg-light-success',
        },
        {
            label: 'Expired',
            value: statistics.expired || 0,
            bgClass: 'bg-light-warning',
        },
    ];

    return (
        <div className="row g-5 g-xl-8 mb-5">
            {stats.map((stat, index) => (
                <div key={index} className="col-sm-6 col-md-4 text-center">
                    <div className={`card ${stat.bgClass} hoverable card-xl-stretch mb-xl-8`}>
                        <div className="card-body">
                            <div className="text-black fw-bolder fs-2 mb-2 mt-5">
                                {stat.value}
                            </div>
                            <div className="fw-bold text-black">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminPaymentLinkStatistics;

