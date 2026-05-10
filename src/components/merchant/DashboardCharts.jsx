import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Chart from 'react-apexcharts';

const EXPECTED_SERIES = ['Approved', 'Voided', 'Refunded'];

const createEmptyChart = (period, t) => {
    if (period === 'weekly') {
        const labels = Array.from({ length: 7 }, (_, idx) =>
            t('merchant.dashboard.chartDay', { n: idx + 1 })
        );
        return {
            labels,
            series: EXPECTED_SERIES.map((name) => ({
                name,
                data: Array(labels.length).fill(0),
            })),
        };
    }

    if (period === 'monthly') {
        const labels = Array.from({ length: 12 }, (_, idx) =>
            t('merchant.dashboard.chartMonth', { n: idx + 1 })
        );
        return {
            labels,
            series: EXPECTED_SERIES.map((name) => ({
                name,
                data: Array(labels.length).fill(0),
            })),
        };
    }

    if (period === 'daily') {
        const labels = Array.from({ length: 30 }, (_, idx) =>
            t('merchant.dashboard.chartDay', { n: idx + 1 })
        );
        return {
            labels,
            series: EXPECTED_SERIES.map((name) => ({
                name,
                data: Array(labels.length).fill(0),
            })),
        };
    }

    const labels = Array.from({ length: 24 }, (_, idx) =>
        `${idx.toString().padStart(2, '0')}:00`
    );

    return {
        labels,
        series: EXPECTED_SERIES.map((name) => ({
            name,
            data: Array(labels.length).fill(0),
        })),
    };
};

const DashboardCharts = ({ data, todayStats, hasRange, loading, activePeriod, onPeriodChange }) => {
    const { t, i18n } = useTranslation();

    const translateSeriesName = useCallback((name) => {
        const n = String(name || '').toLowerCase();
        if (n === 'approved') return t('merchant.dashboard.seriesApproved');
        if (n === 'voided') return t('merchant.dashboard.seriesVoided');
        if (n === 'refunded') return t('merchant.dashboard.seriesRefunded');
        return name;
    }, [t]);

    const normalizedChart = useMemo(() => {
        const baseChart =
            data && Array.isArray(data.labels) && data.labels.length > 0
                ? {
                    labels: data.labels,
                    series: Array.isArray(data.series) ? data.series : [],
                }
                : createEmptyChart(activePeriod, t);

        const labelCount = baseChart.labels.length;
        const seriesAccumulator = EXPECTED_SERIES.reduce((acc, seriesName) => {
            acc[seriesName] = Array(labelCount).fill(0);
            return acc;
        }, {});

        baseChart.series.forEach((serie) => {
            if (!serie || !Array.isArray(serie.data)) {
                return;
            }

            const match = EXPECTED_SERIES.find(
                (expected) => expected.toLowerCase() === String(serie.name || '').toLowerCase()
            );

            if (!match) {
                return;
            }

            serie.data.forEach((value, index) => {
                if (index >= labelCount) {
                    return;
                }

                const numericValue = typeof value === 'number' ? value : Number(value) || 0;
                seriesAccumulator[match][index] = numericValue;
            });
        });

        return {
            labels: baseChart.labels,
            series: EXPECTED_SERIES.map((name) => ({
                name,
                data: seriesAccumulator[name],
            })),
        };
    }, [data, activePeriod, t, i18n.language]);

    const chartOptions = useMemo(() => {
        if (!normalizedChart || !normalizedChart.labels.length) {
            return null;
        }

        const displaySeries = normalizedChart.series.map((serie) => ({
            ...serie,
            name: translateSeriesName(serie.name),
        }));

        return {
            series: displaySeries,
            chart: {
                fontFamily: 'inherit',
                type: 'line',
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
                colors: ['#009ef7', '#f1416c', '#ffc700'],
            },
            xaxis: {
                categories: normalizedChart.labels,
                axisBorder: { show: false },
                axisTicks: { show: false },
                tickAmount: Math.min(8, normalizedChart.labels.length),
                labels: {
                    rotate: 0,
                    style: {
                        colors: '#808080',
                        fontSize: '12px',
                    },
                },
                crosshairs: {
                    position: 'front',
                    stroke: {
                        color: ['#009ef7', '#f1416c', '#ffc700'],
                        width: 1,
                        dashArray: 3,
                    },
                },
            },
            yaxis: {
                min: 0,
                tickAmount: 6,
                labels: {
                    style: {
                        colors: '#808080',
                        fontSize: '12px',
                    },
                    formatter: function (val) {
                        const maxValue = Math.max(
                            ...normalizedChart.series.flatMap((serie) => serie.data)
                        );

                        if (maxValue <= 10) {
                            return Math.round(val);
                        }

                        return Math.floor(val);
                    },
                },
            },
            colors: ['#009ef7', '#f1416c', '#ffc700'],
            grid: {
                borderColor: '#e4e6ef',
                strokeDashArray: 4,
                yaxis: { lines: { show: true } },
            },
            markers: {
                strokeColors: ['#009ef7', '#f1416c', '#ffc700'],
                strokeWidth: 3,
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
    }, [normalizedChart, translateSeriesName]);

    const isEmptyDataset = useMemo(() => {
        return normalizedChart.series.every((serie) =>
            serie.data.every((value) => Number(value) === 0)
        );
    }, [normalizedChart]);

    const handlePeriodChange = (period) => {
        if (onPeriodChange && period !== activePeriod) {
            onPeriodChange(period);
        }
    };

    const todayLine = useMemo(() => {
        if (!todayStats) {
            return t('merchant.dashboard.chartsLoading');
        }
        const count = new Intl.NumberFormat(i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US').format(todayStats.count || 0);
        const amount = new Intl.NumberFormat(i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US').format(todayStats.amount || 0);
        return t('merchant.dashboard.chartsToday', { count, amount });
    }, [todayStats, t, i18n.language]);

    if (loading) {
        return (
            <div className="card card-flush h-xl-100">
                <div className="card-body pt-5" style={{ overflow: 'hidden' }}>
                    <div className="d-flex align-items-center justify-content-between mb-5">
                        <div className="skeleton skeleton-line" style={{ width: '45%', height: '24px' }}></div>
                        <div className="skeleton skeleton-chip" style={{ width: '20%', height: '18px' }}></div>
                    </div>
                    <div className="skeleton skeleton-chart w-100"></div>
                </div>
                <style>{`
                    .skeleton {
                        position: relative;
                        overflow: hidden;
                        background: #f3f4f6;
                    }
                    .skeleton::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        transform: translateX(-100%);
                        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
                        animation: skeleton-loading 1.4s infinite;
                    }
                    .skeleton-chart {
                        height: 260px;
                        border-radius: 12px;
                    }
                    @keyframes skeleton-loading {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="card card-flush h-xl-100">
            <div className="card-header pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-900">
                        {t('merchant.dashboard.chartsTitle')}
                    </span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-6">
                        {todayLine}
                    </span>
                </h3>
                
                <div className="card-toolbar">
                    {hasRange ? (
                        <span className="badge badge-light-primary">{t('merchant.dashboard.customRange')}</span>
                    ) : (
                        <ul className="nav" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link btn btn-sm btn-color-muted btn-active btn-active-light fw-bold px-4 me-1 ${activePeriod === 'hourly' ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange('hourly')}
                                    type="button"
                                >
                                    {t('merchant.dashboard.hourly')}
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link btn btn-sm btn-color-muted btn-active btn-active-light fw-bold px-4 me-1 ${activePeriod === 'daily' ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange('daily')}
                                    type="button"
                                >
                                    {t('merchant.dashboard.daily')}
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link btn btn-sm btn-color-muted btn-active btn-active-light fw-bold px-4 me-1 ${activePeriod === 'weekly' ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange('weekly')}
                                    type="button"
                                >
                                    {t('merchant.dashboard.weekly')}
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link btn btn-sm btn-color-muted btn-active btn-active-light fw-bold px-4 me-1 ${activePeriod === 'monthly' ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange('monthly')}
                                    type="button"
                                >
                                    {t('merchant.dashboard.monthly')}
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
            
            <div className="card-body pb-0 pt-4">
                <div className="ms-n5 me-n3 min-h-auto w-100" style={{ height: '300px' }}>
                    {chartOptions ? (
                        <Chart
                            options={chartOptions}
                            series={chartOptions.series}
                            type="line"
                            height={300}
                        />
                    ) : (
                        <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                            <p className="text-muted mb-0">{t('merchant.dashboard.chartRenderError')}</p>
                        </div>
                    )}
                </div>
                {isEmptyDataset && (
                    <div className="text-center mt-2">
                        <small className="text-muted">{t('merchant.dashboard.noChartData')}</small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardCharts;
