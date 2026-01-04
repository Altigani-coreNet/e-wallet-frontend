"use strict";

// Class definition
var KTTopSellingMerchants = function () {
    // Private functions
    var initChart = function(chartId, labels, counts, amounts) {
        var element = document.getElementById(chartId);
        
        if (!element) {
            return;
        }

        var options = {
            series: [{
                name: 'Transactions',
                type: 'column',
                data: counts || [44, 55, 57, 56, 61, 58]
            }, {
                name: 'Amount ($)',
                type: 'line',
                data: amounts || [76, 85, 101, 98, 87, 105]
            }],
            chart: {
                height: 350,
                type: 'line',
                toolbar: {
                    show: false
                }
            },
            stroke: {
                width: [0, 4],
                curve: 'smooth'
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%'
                }
            },
            dataLabels: {
                enabled: false,
                enabledOnSeries: [1]
            },
            xaxis: {
                categories: labels || ['Merchant 1', 'Merchant 2', 'Merchant 3', 'Merchant 4', 'Merchant 5', 'Merchant 6'],
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                labels: {
                    style: {
                        colors: '#A1A5B7',
                        fontSize: '12px'
                    },
                    rotate: -45,
                    rotateAlways: false,
                    maxHeight: 120
                }
            },
            yaxis: [{
                title: {
                    text: 'Transaction Count',
                    style: {
                        color: '#3E97FF',
                    }
                },
                labels: {
                    style: {
                        colors: '#A1A5B7',
                        fontSize: '12px'
                    }
                }
            }, {
                opposite: true,
                title: {
                    text: 'Amount ($)',
                    style: {
                        color: '#50CD89',
                    }
                },
                labels: {
                    style: {
                        colors: '#A1A5B7',
                        fontSize: '12px'
                    },
                    formatter: function(val) {
                        return '$' + val.toFixed(2);
                    }
                }
            }],
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function(y, { seriesIndex }) {
                        if (seriesIndex === 0) {
                            return y.toFixed(0) + " transactions";
                        }
                        return "$" + y.toFixed(2);
                    }
                }
            },
            colors: ['#3E97FF', '#50CD89'],
            grid: {
                borderColor: '#E4E6EF',
                strokeDashArray: 4,
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'center'
            }
        };

        var chart = new ApexCharts(element, options);
        chart.render();
    }

    // Public methods
    return {
        init: function (chartId, labels, counts, amounts) {
            initChart(chartId, labels, counts, amounts);
        }
    }
}();

// On document ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the default chart if no custom data is provided
    KTTopSellingMerchants.init('kt_charts_widget_merchants');
});
