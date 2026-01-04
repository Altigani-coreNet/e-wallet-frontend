import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../contexts/ToolbarContext';
import SalesChart from './SalesChart';
import { 
    useDashboardStatistics, 
    useLatestSales, 
    useLatestPurchases, 
    useSalesChart 
} from '../../services/salesDashboardService';
import { POS_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import axios from 'axios';
import useAuthStore from '../../stores/authStore';

export default function SalesDashboard() {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const navigate = useNavigate();
    const merchant = useAuthStore((state) => state.merchant);
    
    const [chartPeriod, setChartPeriod] = useState('daily');
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Use React Query hooks with caching
    const statisticsQuery = useDashboardStatistics(filters);
    const latestSalesQuery = useLatestSales(7, filters);
    const latestPurchasesQuery = useLatestPurchases(7, filters);
    const chartQuery = useSalesChart(chartPeriod, filters);

    // Extract data from queries
    const statistics = statisticsQuery.data || {
        total_sales: '0.00',
        total_purchases: '0.00',
        total_customers: 0,
        total_orders: 0
    };
    const latestSales = latestSalesQuery.data || [];
    const latestPurchases = latestPurchasesQuery.data || [];
    const chartData = chartQuery.data || null;

    // Combined loading state - only true if no cached data exists
    const loading = (statisticsQuery.isLoading || latestSalesQuery.isLoading || latestPurchasesQuery.isLoading) 
        && !statisticsQuery.data && !latestSalesQuery.data && !latestPurchasesQuery.data;
    const chartLoading = chartQuery.isLoading && !chartQuery.data;

    const getStatusBadge = (statusBadge) => {
        return statusBadge || 'badge-light-secondary';
    };

    /**
     * Get currency symbol from merchant or item, with fallback to default
     * @param {Object} item - Optional sale/purchase item that might have currency info
     * @returns {string} Currency symbol
     */
    const getCurrencySymbol = useCallback((item = null) => {
        // First, try to get currency from the item (sale/purchase) if provided
        if (item) {
            if (item.currency_symbol) return item.currency_symbol;
            if (item.currency_object?.symbol) return item.currency_object.symbol;
            if (item.currency_object?.currency_symbol) return item.currency_object.currency_symbol;
        }
        
        // Then, try to get currency from merchant
        if (merchant) {
            if (merchant.merchantCurrency?.symbol) return merchant.merchantCurrency.symbol;
            if (merchant.currency_object?.symbol) return merchant.currency_object.symbol;
            if (merchant.currency_symbol) return merchant.currency_symbol;
        }
        
        // Fallback to default
        return '$';
    }, [merchant]);

    /**
     * Format amount with currency symbol
     * @param {number|string} amount - The amount to format
     * @param {Object} item - Optional sale/purchase item for currency context
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} Formatted currency string
     */
    const formatCurrency = useCallback((amount, item = null, decimals = 2) => {
        const symbol = getCurrencySymbol(item);
        const value = typeof amount === 'number' ? amount : parseFloat(amount || 0);
        return `${symbol}${value.toFixed(decimals)}`;
    }, [getCurrencySymbol]);

    // Export dashboard data to CSV
    // Handle print dashboard - Generate PDF via API
    const handlePrintDashboard = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            // Build query parameters from current filters
            const params = new URLSearchParams();
            if (filters.date_from) {
                params.append('date_from', filters.date_from);
            }
            if (filters.date_to) {
                params.append('date_to', filters.date_to);
            }

            const url = `${POS_ENDPOINTS.DASHBOARD_SALES_PRINT}${params.toString() ? '?' + params.toString() : ''}`;
            
            // Show loading toast
            toast.info('Generating PDF...');

            // Fetch PDF from API
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                },
                responseType: 'blob'
            });

            // Create blob from response
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url_blob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_blob;
            link.download = `sales_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url_blob);
            
            toast.success('PDF downloaded successfully!');
        } catch (error) {
            console.error('Print error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to generate PDF';
            toast.error(errorMsg);
        }
    }, [filters]);

    const handleExport = useCallback(() => {
        try {
            // Prepare CSV data
            let csvContent = 'Sales Dashboard Export\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
            
            // Statistics Section
            csvContent += 'STATISTICS\n';
            csvContent += `Total Sales,${formatCurrency(statistics.total_sales)}\n`;
            csvContent += `Total Purchases,${formatCurrency(statistics.total_purchases)}\n`;
            csvContent += `Total Customers,${statistics.total_customers}\n`;
            csvContent += `Total Orders,${statistics.total_orders}\n\n`;
            
            // Latest Sales Section
            csvContent += 'LATEST SALES\n';
            csvContent += 'Order ID,Created Date,Customer,Total,Status\n';
            latestSales.forEach(sale => {
                const date = sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A';
                const customer = sale.customer?.name || 'Walk-in Customer';
                const total = sale.grand_total || '0.00';
                const status = sale.status_text || 'Unknown';
                csvContent += `${sale.reference_no || sale.id},${date},${customer},${formatCurrency(total, sale)},${status}\n`;
            });
            csvContent += '\n';
            
            // Latest Purchases Section
            csvContent += 'LATEST PURCHASES\n';
            csvContent += 'Purchase ID,Supplier,Date,Total,Status\n';
            latestPurchases.forEach(purchase => {
                const date = purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'N/A';
                const supplier = purchase.supplier?.name || 'N/A';
                const total = purchase.grand_total || '0.00';
                const status = purchase.status == 1 ? 'Active' : 'Inactive';
                csvContent += `${purchase.id},${supplier},${date},${formatCurrency(total, purchase)},${status}\n`;
            });
            
            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sales_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Dashboard data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export dashboard data');
        }
    }, [statistics, latestSales, latestPurchases, formatCurrency]);

    // Set toolbar configuration
    useEffect(() => {
        setTitle('Sales Dashboard');
        setBreadcrumbs([
            { text: 'Dashboard', href: '/merchant/dashboard' },
            { text: 'Sales Dashboard' }
        ]);
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Refresh Button */}
                <button 
                    onClick={() => {
                        statisticsQuery.refetch();
                        latestSalesQuery.refetch();
                        latestPurchasesQuery.refetch();
                        chartQuery.refetch();
                    }}
                    className="btn btn-sm btn-flex btn-light btn-active-primary fw-bold"
                    disabled={statisticsQuery.isFetching || latestSalesQuery.isFetching || latestPurchasesQuery.isFetching || chartQuery.isFetching}
                >
                    <i className="ki-duotone ki-arrows-circle fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Refresh
                </button>
                
                {/* Filter Button */}
                <button 
                    type="button"
                    className={`btn btn-sm btn-flex btn-primary fw-bold ${(filters.date_from || filters.date_to) ? '' : 'btn-light btn-active-primary'}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Filter
                    {(filters.date_from || filters.date_to) && (
                        <span className="badge badge-circle badge-white ms-2">!</span>
                    )}
                </button>
                
                {/* Print Button */}
                {/* <button 
                    className="btn btn-sm btn-primary"
                    onClick={handlePrintDashboard}
                >
                    <i className="ki-duotone ki-printer fs-6 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    Print Dashboard
                </button> */}
                
                {/* Export Button */}
                <button 
                    type="button"
                    className="btn btn-sm btn-flex btn-success fw-bold"
                    onClick={handleExport}
                    title="Export dashboard data including statistics, sales, and purchases to CSV"
                >
                    <i className="ki-duotone ki-exit-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Export
                </button>
            </div>
        );
    }, [setTitle, setBreadcrumbs, setActions, statisticsQuery.isFetching, latestSalesQuery.isFetching, latestPurchasesQuery.isFetching, chartQuery.isFetching, handleExport, handlePrintDashboard, filters.date_from, filters.date_to, showFilters]);

    // Skeleton Loader Component
    const SkeletonLoader = () => (
        <>
            {/* Toolbar Skeleton */}
            <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
                <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
                    <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                        <div className="placeholder-glow">
                            <span className="placeholder col-4 bg-secondary" style={{ height: '28px', borderRadius: '6px' }}></span>
                        </div>
                        <div className="placeholder-glow mt-2">
                            <span className="placeholder col-6 bg-secondary" style={{ height: '16px', borderRadius: '4px' }}></span>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <div className="placeholder-glow">
                            <span className="placeholder bg-secondary" style={{ width: '80px', height: '36px', borderRadius: '6px' }}></span>
                        </div>
                        <div className="placeholder-glow">
                            <span className="placeholder bg-secondary" style={{ width: '80px', height: '36px', borderRadius: '6px' }}></span>
                        </div>
                        <div className="placeholder-glow">
                            <span className="placeholder bg-secondary" style={{ width: '80px', height: '36px', borderRadius: '6px' }}></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div id="kt_app_content" className="app-content flex-column-fluid">
                <div id="kt_app_content_container" className="app-container container-xxl">
                    {/* Statistics Row Skeleton */}
                    <div className="row gx-5 gx-xl-10 mb-xl-10">
                        {/* Left Column */}
                        <div className="col-xl-6 mb-5 mb-xl-10">
                            <div className="row g-lg-5 g-xl-10">
                                {/* Sales Card Skeleton */}
                                <div className="col-md-6 col-xl-6 mb-5 mb-xl-10">
                                    <div className="card overflow-hidden h-md-50 mb-5 mb-xl-10 bg-light-primary">
                                        <div className="card-body d-flex justify-content-between flex-column px-9 pb-0">
                                            <div className="mb-4">
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-6 bg-secondary" style={{ height: '32px', borderRadius: '6px' }}></span>
                                                </div>
                                                <div className="placeholder-glow mt-2">
                                                    <span className="placeholder col-8 bg-secondary" style={{ height: '16px', borderRadius: '4px' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Card Skeleton */}
                                    <div className="card h-md-50">
                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex flex-stack">
                                                <div className="placeholder-glow flex-grow-1">
                                                    <span className="placeholder col-5 bg-secondary" style={{ height: '40px', borderRadius: '6px' }}></span>
                                                    <span className="placeholder col-7 bg-secondary mt-2 d-block" style={{ height: '16px', borderRadius: '4px' }}></span>
                                                </div>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder bg-secondary rounded-circle" style={{ width: '50px', height: '50px' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchases Card Skeleton */}
                                <div className="col-md-6 col-xl-6 mb-md-5 mb-xl-10">
                                    <div className="card overflow-hidden h-md-50 mb-5 mb-xl-10 bg-light-success">
                                        <div className="card-body d-flex justify-content-between flex-column px-9 pb-0">
                                            <div className="mb-4">
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-6 bg-secondary" style={{ height: '32px', borderRadius: '6px' }}></span>
                                                </div>
                                                <div className="placeholder-glow mt-2">
                                                    <span className="placeholder col-8 bg-secondary" style={{ height: '16px', borderRadius: '4px' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Orders Card Skeleton */}
                                    <div className="card h-md-50">
                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex flex-stack">
                                                <div className="placeholder-glow flex-grow-1">
                                                    <span className="placeholder col-5 bg-secondary" style={{ height: '40px', borderRadius: '6px' }}></span>
                                                    <span className="placeholder col-7 bg-secondary mt-2 d-block" style={{ height: '16px', borderRadius: '4px' }}></span>
                                                </div>
                                                <div className="placeholder-glow">
                                                    <span className="placeholder bg-secondary rounded-circle" style={{ width: '50px', height: '50px' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Skeleton */}
                        <div className="col-lg-12 col-xl-12 col-xxl-6 mb-5 mb-xl-0">
                            <div className="card card-flush h-md-100">
                                <div className="card-header pt-7">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-4 bg-secondary" style={{ height: '24px', borderRadius: '6px' }}></span>
                                        <span className="placeholder col-3 bg-secondary mt-2 d-block" style={{ height: '14px', borderRadius: '4px' }}></span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-12 bg-secondary" style={{ height: '200px', borderRadius: '8px' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                    {/* Tables Row Skeleton */}
                    <div className="row gy-5 g-xl-10">
                        {/* Sales Table Skeleton */}
                        <div className="col-xl-6 mb-xl-10">
                            <div className="card card-flush h-xl-100">
                                <div className="card-header pt-7">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-4 bg-secondary" style={{ height: '20px', borderRadius: '6px' }}></span>
                                        <span className="placeholder col-5 bg-secondary mt-2 d-block" style={{ height: '14px', borderRadius: '4px' }}></span>
                                    </div>
                                </div>
                                <div className="card-body pt-2">
                                    {[...Array(5)].map((_, idx) => (
                                        <div key={idx} className="d-flex align-items-center mb-4">
                                            <div className="placeholder-glow flex-grow-1">
                                                <span className="placeholder col-12 bg-secondary" style={{ height: '40px', borderRadius: '6px' }}></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Purchases Table Skeleton */}
                        <div className="col-xl-6 mb-5 mb-xl-10">
                            <div className="card card-flush h-xl-100">
                                <div className="card-header pt-7">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-4 bg-secondary" style={{ height: '20px', borderRadius: '6px' }}></span>
                                        <span className="placeholder col-5 bg-secondary mt-2 d-block" style={{ height: '14px', borderRadius: '4px' }}></span>
                                    </div>
                                </div>
                                <div className="card-body pt-2">
                                    {[...Array(5)].map((_, idx) => (
                                        <div key={idx} className="d-flex align-items-center mb-4">
                                            <div className="placeholder-glow flex-grow-1">
                                                <span className="placeholder col-12 bg-secondary" style={{ height: '40px', borderRadius: '6px' }}></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // Handle filter changes - auto-apply when changed
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        // Filters auto-apply - queries will automatically refetch when filters change
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setFilters({ date_from: '', date_to: '' });
    };

    return (
        <>
            {/* Filter Card */}
            {showFilters && (
                <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h3 className="fw-bold m-0">Filter Options</h3>
                        </div>
                        <div className="card-toolbar">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-light-primary" 
                                onClick={handleClearFilters}
                            >
                                <i className="ki-duotone ki-refresh fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        <div className="row g-4">
                            {/* Date From */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Date From</label>
                                <input 
                                    type="date"
                                    className="form-control" 
                                    value={filters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    placeholder="Select start date"
                                />
                            </div>
                            
                            {/* Date To */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Date To</label>
                                <input 
                                    type="date"
                                    className="form-control" 
                                    value={filters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    placeholder="Select end date"
                                    min={filters.date_from || undefined}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div id="kt_app_content" className="app-content flex-column-fluid">
                <div id="kt_app_content_container" className="app-container container-xxl">
                    {/* Show skeleton loader only on initial load (no cached data) - but keep filter card visible */}
                    {loading && !statisticsQuery.data && !latestSalesQuery.data && !latestPurchasesQuery.data ? (
                        <SkeletonLoader />
                    ) : (
                        <>
                    {/* Statistics Row */}
                    <div className="row gx-5 gx-xl-10 mb-xl-10">
                {/* Total Sales & Total Purchases Column */}
                <div className="col-xl-6 mb-5 mb-xl-10">
                    <div className="row g-lg-5 g-xl-10">
                        {/* Total Sales Card */}
                        <div className="col-md-6 col-xl-6 mb-5 mb-xl-10">
                            <div className="card overflow-hidden h-md-50 mb-5 mb-xl-10 bg-light-primary">
                                <div className="card-body d-flex justify-content-between flex-column px-0 pb-0">
                                    <div className="mb-4 px-9">
                                        <div className="d-flex align-items-center mb-2">
                                            <span className="fw-bold text-gray-800 me-2 ls-n2" style={{ fontSize: '24px' }}>
                                                {formatCurrency(statistics.total_sales)}
                                            </span>
                                        </div>
                                        <span className="fs-6 fw-semibold text-gray-500">Total Sales</span>
                                    </div>
                                    <div id="kt_card_widget_12_chart" className="min-h-auto" style={{ height: '125px' }}></div>
                                </div>
                                            </div>

                            {/* Customer Card */}
                            <div className="card h-md-50">
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex flex-stack mb-4">
                                        <div className="d-flex flex-column">
                                            <span className="fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2">
                                                {statistics.total_customers}
                                            </span>
                                            <span className="text-gray-500 pt-1 fw-semibold fs-6">Total Customers</span>
                                            </div>
                                        <div className="symbol symbol-50px">
                                            <span className="symbol-label bg-light-primary">
                                                <i className="ki-duotone ki-people fs-2x text-primary">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                </i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Total Purchases Card */}
                        <div className="col-md-6 col-xl-6 mb-md-5 mb-xl-10">
                            <div className="card overflow-hidden h-md-50 mb-5 mb-xl-10 bg-light-success">
                                <div className="card-body d-flex justify-content-between flex-column px-0 pb-0">
                                    <div className="mb-4 px-9">
                                        <div className="d-flex align-items-center mb-2">
                                            <span className="fw-bold text-gray-800 me-2 ls-n2" style={{ fontSize: '24px' }}>
                                                {formatCurrency(statistics.total_purchases)}
                                            </span>
                                        </div>
                                        <span className="fs-6 fw-semibold text-gray-500">Total Purchases</span>
                                    </div>
                                    <div id="kt_card_widget_13_chart" className="min-h-auto" style={{ height: '125px' }}></div>
                                </div>
                            </div>

                            {/* Orders Card */}
                            <div className="card h-md-50">
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex flex-stack mb-4">
                                        <div className="d-flex flex-column">
                                            <span className="fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2">
                                                {statistics.total_orders}
                                            </span>
                                            <span className="text-gray-500 pt-1 fw-semibold fs-6">Total Orders</span>
                                        </div>
                                        <div className="symbol symbol-50px">
                                            <span className="symbol-label bg-light-success">
                                                <i className="ki-duotone ki-basket fs-2x text-success">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                </i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales & Purchases Chart */}
                <div className="col-lg-12 col-xl-12 col-xxl-6 mb-5 mb-xl-0">
                    <SalesChart
                        data={chartData}
                        hasRange={false}
                        loading={chartLoading}
                        activePeriod={chartPeriod}
                        onPeriodChange={setChartPeriod}
                    />
                </div>
            </div>

            {/* Latest Sales & Purchases Tables */}
            <div className="row gy-5 g-xl-10">
                {/* Latest Sales Table */}
                <div className="col-xl-6 mb-xl-10">
                    <div className="card card-flush h-xl-100">
                        <div className="card-header pt-7">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-gray-800">Latest Sales</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">Recent sales activity</span>
                            </h3>
                            <div className="card-toolbar">
                                <button 
                                    onClick={() => navigate('/sales/sales-report/sales')} 
                                    className="btn btn-light btn-sm"
                                >
                                    View All
                                </button>
                            </div>
                        </div>
                        <div className="card-body pt-2">
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-3">
                                    <thead>
                                        <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                            <th className="min-w-100px">Order ID</th>
                                            <th className="text-end min-w-100px">Created</th>
                                            <th className="text-end min-w-125px">Customer</th>
                                            <th className="text-end min-w-100px">Total</th>
                                            <th className="text-end min-w-50px">Status</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-bold text-gray-600">
                                        {latestSales.length > 0 ? (
                                            latestSales.map((sale) => (
                                                <tr key={sale.id}>
                                                    <td>
                                                        <a href={`/sales/sales-report/${sale.id}`} className="text-gray-800 text-hover-primary">
                                                            {sale.reference_no}
                                                        </a>
                                                    </td>
                                                    <td className="text-end">
                                                        {new Date(sale.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="text-end">
                                                        <a href="#" className="text-gray-600 text-hover-primary">
                                                            {sale.customer?.name || 'Walk-in Customer'}
                                                        </a>
                                                    </td>
                                                    <td className="text-end">
                                                        {formatCurrency(sale.grand_total, sale)}
                                                    </td>
                                                    <td className="text-end">
                                                        <span className={`badge py-3 px-4 fs-7 ${getStatusBadge(sale.status_badge)}`}>
                                                            {sale.status_text}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <a href={`/sales/sales-report/${sale.id}`} className="btn btn-sm btn-icon btn-light btn-active-light-primary">
                                                            <i className="ki-duotone ki-eye fs-3 me-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                            </i>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5">
                                                    <div className="text-gray-500">No sales found</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest Purchases Table */}
                <div className="col-xl-6 mb-5 mb-xl-10">
                    <div className="card card-flush h-xl-100">
                        <div className="card-header pt-7">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-gray-900">Latest Purchases</span>
                                <span className="text-gray-500 mt-1 fw-semibold fs-6">Recent purchase transactions</span>
                            </h3>
                            <div className="card-toolbar">
                                <button 
                                    onClick={() => navigate('/sales/purchases')} 
                                    className="btn btn-light btn-sm"
                                >
                                    View All
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-3">
                                    <thead>
                                        <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                            <th className="min-w-100px">Purchase ID</th>
                                            <th className="min-w-150px">Supplier</th>
                                            <th className="text-end min-w-100px">Date</th>
                                            <th className="text-end min-w-100px">Total</th>
                                            <th className="text-end min-w-100px">Status</th>
                                            <th className="text-end min-w-50px">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-bold text-gray-600">
                                        {latestPurchases.length > 0 ? (
                                            latestPurchases.map((purchase) => (
                                                <tr key={purchase.id}>
                                                    <td>
                                                        <span className="text-gray-900 fw-bold">#{purchase.id}</span>
                                                    </td>
                                                    <td>
                                                        <span className="text-gray-900">{purchase.supplier?.name || 'N/A'}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        {new Date(purchase.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="text-gray-900 fw-bold">
                                                            {formatCurrency(purchase.grand_total, purchase)}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        {purchase.status == 1 ? (
                                                            <span className="badge py-3 px-4 fs-7 badge-light-success">Active</span>
                                                        ) : (
                                                            <span className="badge py-3 px-4 fs-7 badge-light-warning">Inactive</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <a href={`/purchases/${purchase.id}`} className="btn btn-sm btn-icon btn-light btn-active-light-primary">
                                                            <i className="ki-duotone ki-eye fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                            </i>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
                                                    <div className="text-muted">No recent purchases found</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

