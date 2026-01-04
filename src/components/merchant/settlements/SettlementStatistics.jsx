import React from 'react';

const SettlementStatistics = ({ statistics }) => {
    if (!statistics) return null;

    const stats = [
        {
            label: 'Total Settlements',
            value: statistics.total || 0,
            bgClass: 'bg-light-dark'
        },
        {
            label: 'Settled',
            value: statistics.settled || 0,
            bgClass: 'bg-light-success'
        },
        {
            label: 'Pending',
            value: statistics.pending || 0,
            bgClass: 'bg-light-warning'
        },
        {
            label: 'Failed',
            value: statistics.failed || 0,
            bgClass: 'bg-light-danger'
        }
    ];

    return (
        <div className="row g-5 g-xl-8 mb-5">
            {stats.map((stat, index) => (
                <div key={index} className="col-sm-3 text-center">
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

export default SettlementStatistics;

