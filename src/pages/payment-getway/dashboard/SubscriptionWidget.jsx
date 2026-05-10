import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';

const SubscriptionWidget = ({ data, loading }) => {
    const { t } = useTranslation();
    const transactionsData = data?.subscriptionData || data || {};
    const chartDataRaw = transactionsData.chart || transactionsData.charts || transactionsData.transactionChart || [];
    const partnersRaw =
        transactionsData.partners ||
        transactionsData.contentProviders ||
        transactionsData.topPartners ||
        transactionsData.top_partners ||
        [];
    const countriesRaw =
        transactionsData.countries ||
        transactionsData.topCountries ||
        transactionsData.top_countries ||
        [];

    const monthsFallback = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const chartData = useMemo(() => {
        if (Array.isArray(chartDataRaw) && chartDataRaw.length > 0) {
            return chartDataRaw;
        }

        return monthsFallback.map((month) => ({
            month,
            successTransactions: 0,
            failedTransactions: 0,
        }));
    }, [chartDataRaw]);

    const partners = useMemo(
        () => (Array.isArray(partnersRaw) ? partnersRaw : []),
        [partnersRaw]
    );

    const countries = useMemo(
        () => (Array.isArray(countriesRaw) ? countriesRaw : []),
        [countriesRaw]
    );

    const pickCount = (item, keys) => {
        for (const key of keys) {
            const value = item?.[key];
            if (value !== undefined && value !== null) {
                const num = Number(value);
                return Number.isFinite(num) ? num : 0;
            }
        }
        return 0;
    };

    const isPartnerRowShown = (p) => {
        if (!p?.status) return true;
        const s = String(p.status).toLowerCase();
        const hidden = ['suspended', 'rejected', 'deleted'];
        return !hidden.includes(s);
    };

    // Prepare chart data using ApexCharts format
    const chartOptions = useMemo(() => {
        const categories = chartData.map((item, index) => item.month || item.label || monthsFallback[index] || '');
        const successTransactionsSeries = chartData.map((item) =>
            pickCount(item, ['successTransactions', 'success_transactions', 'success', 'approvedTransactions', 'approved_transactions'])
        );
        const failedTransactionsSeries = chartData.map((item) =>
            pickCount(item, ['failedTransactions', 'failed_transactions', 'failed', 'declinedTransactions', 'declined_transactions'])
        );
        
        return {
            series: [
                {
                    name: t('admin.dashboard.successTransactions'),
                    data: successTransactionsSeries,
                },
                {
                    name: t('admin.dashboard.failedTransactions'),
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
                                <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.transactionTrends')}</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.last12MonthsOverview')}</span>
                            </h3>
                        </div>
                        <div className="card-body pt-6">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="ms-n5 me-n3 min-h-auto w-100" style={{ height: '300px' }}>
                                    <Chart
                                        options={chartOptions}
                                        series={chartOptions.series}
                                        type="area"
                                        height={300}
                                    />
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
                                <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.top10Partners')}</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.byTransactionCount')}</span>
                            </h3>
                        </div>
                        <div className="card-body pt-3">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                                    </div>
                                </div>
                            ) : partners && partners.length > 0 ? (
                                <div className="scroll-y mh-300px">
                                    {partners
                                        .filter(isPartnerRowShown)
                                        .sort((a, b) => (
                                            pickCount(b, ['transactionCount', 'transaction_count', 'total_transactions', 'subscriberCount', 'subscription_count']) -
                                            pickCount(a, ['transactionCount', 'transaction_count', 'total_transactions', 'subscriberCount', 'subscription_count'])
                                        ))
                                        .slice(0, 10)
                                        .map((provider, index) => (
                                            <div key={provider.id || provider.partner_id || index} className="d-flex align-items-center mb-4 provider-item p-2 rounded">
                                                <div className="symbol symbol-40px me-3">
                                                    <div className="symbol-label bg-light-primary">
                                                        <span className="fw-bold text-primary">{index + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold text-gray-800 fs-6">
                                                        {provider.name || provider.partner_name || provider.title || `${t('admin.dashboard.partners')} ${index + 1}`}
                                                    </div>
                                                    <div className="text-gray-500 fs-7">
                                                        {t('admin.dashboard.transactionsCountLabel', { count: pickCount(provider, ['transactionCount', 'transaction_count', 'total_transactions', 'subscriberCount', 'subscription_count']).toLocaleString() })}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold text-success fs-6">
                                                        ${pickCount(provider, ['revenue', 'total_revenue', 'amount']).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                    <div className="text-muted">{t('admin.dashboard.noPartnersData')}</div>
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
                                    <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.topCountriesByTransactions')}</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.transactionDistributionByCountry')}</span>
                                </h3>
                            </div>
                            <div className="card-body pt-3">
                                {loading ? (
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">{t('admin.common.loading')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                            <thead>
                                                <tr className="fw-bold text-muted">
                                                    <th className="min-w-100px">{t('admin.dashboard.country')}</th>
                                                    <th className="min-w-120px text-end">{t('admin.dashboard.transactions')}</th>
                                                    <th className="min-w-120px text-end">{t('admin.dashboard.revenue')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {countries.map((country, index) => (
                                                    <tr key={country.id || country.country_id || index}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="d-flex justify-content-start flex-column">
                                                                    <span className="text-gray-800 fw-bold text-hover-primary mb-1 fs-6">
                                                                        {country.name || country.country_name || country.short_name || country.code || t('admin.dashboard.unknown')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-end">
                                                            <span className="text-gray-800 fw-bold fs-6">
                                                                {pickCount(country, ['transaction_count', 'transactions', 'subscription_count', 'count']).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <span className="text-success fw-bold fs-6">
                                                                ${pickCount(country, ['revenue', 'total_revenue', 'amount']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

