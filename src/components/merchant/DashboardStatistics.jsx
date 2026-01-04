import React from 'react';

const DashboardStatistics = ({ data, loading }) => {
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num || 0);
    };

    const StatCard = ({ title, subtitle, value, bgColor, loading }) => (
        <div className="col-xl-4 mb-xl-10">
            <div className={`card card-flush h-xl-100 ${bgColor}`}>
                <div className="card-header pt-5">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold text-gray-800">{title}</span>
                        <span className="text-gray-500 mt-1 fw-semibold fs-6">{subtitle}</span>
                    </h3>
                </div>
                <div className="card-body pt-2">
                    <div className="mb-2">
                        {loading ? (
                            <div className="placeholder-glow">
                                <span className="placeholder bg-gray-300 col-8 mb-3" style={{ height: '38px', display: 'block' }}></span>
                                <span className="placeholder bg-gray-200 col-4" style={{ height: '18px', display: 'block' }}></span>
                            </div>
                        ) : (
                            <>
                                <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                    {formatNumber(value)}
                                </span>
                                <span className="fs-6 fw-semibold text-gray-500">
                                    {title.includes('Sale') ? 'Sales' : title.includes('Failed') ? 'Failed' : 'Transactions'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="row gy-5 g-xl-10 mb-5">
            <StatCard 
                title="All Transactions"
                subtitle="All time transactions"
                value={data?.totalTransactions}
                bgColor="bg-light-primary"
                loading={loading}
            />
            
            <StatCard 
                title="Sale Transactions"
                subtitle="Successful sales"
                value={data?.totalSaleTransactions}
                bgColor="bg-light-success"
                loading={loading}
            />
            
            <StatCard 
                title="Failed Transactions"
                subtitle="All time failed"
                value={data?.totalFailedTransactions}
                bgColor="bg-light-danger"
                loading={loading}
            />
        </div>
    );
};

export default DashboardStatistics;

