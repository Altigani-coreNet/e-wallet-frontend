import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

const SubscriptionWidget = ({ data, loading }) => {
    const transactionsData = data?.subscriptionData || {};
    const stats = transactionsData.statistics || {};
    const chartData = transactionsData.chart || [];
    const partners = transactionsData.partners || transactionsData.contentProviders || [];
    const countries = transactionsData.countries || [];

    // Prepare chart data using ApexCharts format
    const chartOptions = useMemo(() => {
        const hasData = chartData && chartData.length > 0;
        const categories = hasData ? chartData.map(item => item.month || '') : [];
        const successTransactionsSeries = hasData ? chartData.map(item => item.successTransactions || 0) : [];
        const failedTransactionsSeries = hasData ? chartData.map(item => item.failedTransactions || 0) : [];
        
        return {
            series: [
                {
                    name: 'Success Transactions',
                    data: successTransactionsSeries,
                },
                {
                    name: 'Failed Transactions',
                    data: failedTransactionsSeries,
                }
            ],
            chart: {
                fontFamily: 'inherit',
                type: 'area',
                height: 300,
                toolbar: { show: false },
            },
            legend: {
                show: true,
                position: 'top',
                labels: {
                    colors: '#808080',
                    useSeriesColors: false,
                },
            },
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                show: true,
                width: 3,
                colors: ['#50cd89', '#f1416c'],
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    rotate: 0,
                    style: {
                        colors: '#808080',
                        fontSize: '12px',
                    },
                },
            },
            yaxis: {
                min: 0,
                labels: {
                    style: {
                        colors: '#808080',
                        fontSize: '12px',
                    },
                    formatter: function (val) {
                        return Math.floor(val);
                    },
                },
            },
            colors: ['#50cd89', '#f1416c'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            grid: {
                borderColor: '#e4e6ef',
                strokeDashArray: 4,
                yaxis: { lines: { show: true } },
            },
            tooltip: {
                style: {
                    fontSize: '12px',
                },
                y: {
                    formatter: function (val) {
                        return val ? val.toFixed(0) : '0';
                    },
                },
            },
        };
    }, [chartData]);

    return (
        <>
            <style>{`
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
                .provider-item {
                    transition: all 0.2s ease-in-out;
                }
                .provider-item:hover {
                    background-color: #f8f9fa;
                    transform: translateX(5px);
                }
            `}</style>

            {/* Charts and Provider List */}
            <div className="row gy-5 g-xl-10 mb-5">
                {/* Subscription Chart */}
                <div className="col-xl-8">
                    <div className="card card-flush h-xl-100">
                        <div className="card-header pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-gray-800">Transaction Trends</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">Last 12 months overview</span>
                            </h3>
                        </div>
                        <div className="card-body pt-6">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : chartData && chartData.length > 0 ? (
                                <div className="ms-n5 me-n3 min-h-auto w-100" style={{ height: '300px' }}>
                                    <Chart
                                        options={chartOptions}
                                        series={chartOptions.series}
                                        type="area"
                                        height={300}
                                    />
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                    <div className="text-muted">No chart data available</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Content Providers */}
                <div className="col-xl-4">
                    <div className="card card-flush h-xl-100">
                        <div className="card-header pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-gray-800">Top 10 Partners</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">By transaction count</span>
                            </h3>
                        </div>
                        <div className="card-body pt-3">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : partners && partners.length > 0 ? (
                                <div className="scroll-y mh-300px">
                                    {partners
                                        .filter(p => p.status === 'active')
                                        .sort((a, b) => (b.transactionCount ?? b.subscriberCount ?? 0) - (a.transactionCount ?? a.subscriberCount ?? 0))
                                        .slice(0, 10)
                                        .map((provider, index) => (
                                            <div key={provider.id} className="d-flex align-items-center mb-4 provider-item p-2 rounded">
                                                <div className="symbol symbol-40px me-3">
                                                    <div className="symbol-label bg-light-primary">
                                                        <span className="fw-bold text-primary">{index + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold text-gray-800 fs-6">{provider.name}</div>
                                                    <div className="text-gray-500 fs-7">
                                                        {(provider.transactionCount ?? provider.subscriberCount ?? 0).toLocaleString()} transactions
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold text-success fs-6">
                                                        ${provider.revenue?.toLocaleString() || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                    <div className="text-muted">No partners data available</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Countries by Subscriptions */}
            {countries && countries.length > 0 && (
                <div className="row gy-5 g-xl-10">
                    <div className="col-xl-12">
                        <div className="card card-flush">
                            <div className="card-header pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label fw-bold text-gray-800">Top Countries by Transactions</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Transaction distribution by country</span>
                                </h3>
                            </div>
                            <div className="card-body pt-3">
                                {loading ? (
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                            <thead>
                                                <tr className="fw-bold text-muted">
                                                    <th className="min-w-100px">Country</th>
                                                    <th className="min-w-120px text-end">Transactions</th>
                                                    <th className="min-w-120px text-end">Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {countries.map((country, index) => (
                                                    <tr key={country.id || index}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="d-flex justify-content-start flex-column">
                                                                    <span className="text-gray-800 fw-bold text-hover-primary mb-1 fs-6">
                                                                        {country.name || country.short_name || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-end">
                                                            <span className="text-gray-800 fw-bold fs-6">
                                                                {(country.transaction_count ?? country.subscription_count ?? 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <span className="text-success fw-bold fs-6">
                                                                ${country.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SubscriptionWidget;

