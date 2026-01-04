// Custom JavaScript for POS Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Override chart categories for POS terminals
    if (typeof ApexCharts !== 'undefined') {
        // Update chart categories when charts are rendered
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('apexcharts-canvas')) {
                            // Find and update chart categories
                            const chartElement = node.closest('[id*="chart"]');
                            if (chartElement) {
                                const chartId = chartElement.id;
                                if (chartId.includes('widget_12')) {
                                    // Update the chart with POS-related categories
                                    updateChartCategories(chartElement);
                                }
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});

function updateChartCategories(chartElement) {
    // Wait for the chart to be fully rendered
    setTimeout(function() {
        const chart = ApexCharts.getChartByID(chartElement.id);
        if (chart) {
            // Update categories to be POS-related
            const newCategories = ["Retail", "Food", "Services", "Electronics", "Healthcare", "Automotive", "Finance"];
            chart.updateOptions({
                xaxis: {
                    categories: newCategories
                }
            });
        }
    }, 1000);
} 