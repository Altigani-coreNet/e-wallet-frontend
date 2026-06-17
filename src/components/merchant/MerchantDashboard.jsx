import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import DashboardFilters from './DashboardFilters';
import DashboardStatistics from './DashboardStatistics';
import DashboardCharts from './DashboardCharts';
import DashboardLatestTransactions from './DashboardLatestTransactions';
import { SOFTPOS_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import useAuthStore from '../../stores/authStore';
import { useToolbar } from '../../contexts/ToolbarContext';
import { useNavigate } from 'react-router-dom';
import { useDashboardStatistics, useDashboardCharts, useDashboardLatestTransactions } from '../../hooks/useDashboardQueries';

const MerchantDashboard = ({ merchantId: propMerchantId }) => {
    const { t, i18n } = useTranslation();
    const { user, merchant, profileLoading } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const navigate = useNavigate();
    const merchantStatus = merchant?.status ? String(merchant.status).toLowerCase() : null;
    const isMerchantApproved = merchantStatus === 'approved';
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    // Get API token
    const getApiToken = () => {
        return getToken();
    };

    // React Query client for manual refetch
    const queryClient = useQueryClient();
    
    // Filter states - MUST be declared FIRST before hooks that use it
    const [filters, setFilters] = useState({
        datetime_from: '',
        datetime_to: '',
        transaction_status: '',
        limit: 10
    });
    
    // State management
    const [activePeriod, setActivePeriod] = useState('hourly');
    const [filtersCollapsed, setFiltersCollapsed] = useState(
        localStorage.getItem('merchantDashboardFiltersCollapsed') === 'true'
    );
    // React Query hooks with 10-minute cache
    const statisticsQuery = useDashboardStatistics(filters, {
        enabled: !profileLoading && isMerchantApproved,
    });
    
    const chartsQuery = useDashboardCharts(filters, {
        enabled: !profileLoading && isMerchantApproved && statisticsQuery.isSuccess,
    });
    
    const latestTransactionsQuery = useDashboardLatestTransactions(filters, {
        enabled: !profileLoading && isMerchantApproved && chartsQuery.isSuccess,
    });
    
    // Extract data and loading states
    const statisticsData = statisticsQuery.data;
    const statisticsLoading = statisticsQuery.isLoading;
    const chartsDataRaw = chartsQuery.data;
    const chartsLoading = chartsQuery.isLoading;
    const latestTransactionsData = latestTransactionsQuery.data;
    const latestTransactionsLoading = latestTransactionsQuery.isLoading;
    
    // Process charts data for the active period
    const chartsData = useMemo(() => {
        if (!chartsDataRaw) return null;
        
        const transactionChartData = chartsDataRaw.transactionChartData || {};
        const periodData = transactionChartData[activePeriod] || 
                         transactionChartData.hourly || 
                         { labels: [], series: [] };
        
        return {
            ...chartsDataRaw,
            labels: periodData.labels || [],
            series: periodData.series || [],
        };
    }, [chartsDataRaw, activePeriod]);
    
    // Combined error state
    const error = statisticsQuery.error || chartsQuery.error || latestTransactionsQuery.error;

    useEffect(() => {
        if (profileLoading) {
            return;
        }

        if (!isMerchantApproved) {
            navigate('/merchant/profile', { replace: true });
        }
    }, [profileLoading, isMerchantApproved, navigate]);

    // Configure axios with token
    useEffect(() => {
        const token = getApiToken();
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    // Calculate active filter count as a value, not a function
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.datetime_from) count++;
        if (filters.datetime_to) count++;
        if (filters.transaction_status) count++;
        return count;
    }, [filters.datetime_from, filters.datetime_to, filters.transaction_status]);

    // Stable handler functions
    const toggleFilters = useCallback(() => {
        setFiltersCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('merchantDashboardFiltersCollapsed', newState.toString());
            return newState;
        });
    }, []);

    const handlePrintDashboard = useCallback(() => {
        window.print();
        toast.info(t('merchant.dashboard.printOpened'));
    }, [t]);

    const handleExportExcel = useCallback(async () => {
        try {
            const token = getApiToken();
            if (!token) {
                toast.error(t('merchant.dashboard.sessionExpired'));
                return;
            }

            // Get current filter values at execution time
            const currentFilters = filters;
            const params = {};
            if (currentFilters.datetime_from) params.datetime_from = currentFilters.datetime_from;
            if (currentFilters.datetime_to) params.datetime_to = currentFilters.datetime_to;
            if (currentFilters.transaction_status) params.transaction_status = currentFilters.transaction_status;
            
            // Use the main dashboard export endpoint (or combine all three if needed)
            const response = await axios.get(SOFTPOS_ENDPOINTS.DASHBOARD_EXPORT, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv, application/json',
                },
                responseType: 'blob'
            });

            // Create blob from response data
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(t('merchant.dashboard.exportSuccess'));
        } catch (err) {
            console.error('Export error:', err);
            const errorMsg = err.response?.data?.message || err.message || t('merchant.dashboard.exportFailed');
            
            // Check for specific error cases
            if (err.response?.status === 401) {
                toast.error(t('merchant.dashboard.sessionExpired'));
            } else if (err.response?.status === 403) {
                toast.error(t('merchant.dashboard.exportUnauthorized'));
            } else {
                toast.error(errorMsg);
            }
        }
    }, [filters, t]);

    // Handle refresh - refetch all queries (must be defined before useEffect that uses it)
    const handleRefresh = useCallback(() => {
        queryClient.refetchQueries({ 
            queryKey: ['dashboard'],
            exact: false 
        });
        toast.info(t('merchant.dashboard.refreshing'));
    }, [queryClient, t]);

    // Set toolbar title and actions - only update when filter count or collapsed state changes
    useEffect(() => {
        setTitle(t('merchant.dashboard.title'));
        setBreadcrumbs([]); // No breadcrumbs for main dashboard
        
        // Set toolbar actions
        setActions(
            <>
                {/* Refresh button – icon only on small screens, icon + text on large */}
                <button 
                    className="btn btn-sm btn-light btn-active-light-primary" 
                    onClick={handleRefresh}
                    title={t('merchant.common.refreshDashboardTitle')}
                    aria-label={t('merchant.common.refreshDashboardTitle')}
                    disabled={statisticsLoading || chartsLoading || latestTransactionsLoading}
                >
                    <i className={`ki-duotone ki-arrows-circle fs-6 me-0 me-lg-2 ${(statisticsLoading || chartsLoading || latestTransactionsLoading) ? 'spinning' : ''}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        {t('merchant.common.refresh')}
                    </span>
                </button>

                {/* Filters toggle – icon only on small screens, icon + text on large */}
                <button 
                    id="filters_button" 
                    className={`btn btn-sm btn-flex fw-bold ${activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={toggleFilters}
                    aria-label={activeFilterCount > 0 ? t('merchant.common.filtersActive', { count: activeFilterCount }) : t('merchant.common.toggleFilters')}
                >
                    <i
                        className="ki-duotone ki-filter fs-6 me-0 me-lg-1"
                        style={{ 
                            transform: filtersCollapsed ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }}
                    >
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        {activeFilterCount > 0 ? t('merchant.common.filtersActive', { count: activeFilterCount }) : t('merchant.common.toggleFilters')}
                    </span>
                </button>

                {/* Print button – icon only on small screens, icon + text on large */}
                <button 
                    className="btn btn-sm btn-primary" 
                    onClick={handlePrintDashboard}
                    aria-label={t('merchant.common.printDashboard')}
                >
                    <i className="ki-duotone ki-printer fs-6 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        {t('merchant.common.printDashboard')}
                    </span>
                </button>
                
                {/* Export button – icon only on small screens, icon + text on large */}
                <button 
                    className="btn btn-sm btn-success" 
                    onClick={handleExportExcel}
                    title={t('merchant.common.exportExcelTitle')}
                    aria-label={t('merchant.common.exportExcelTitle')}
                >
                    <i className="ki-duotone ki-file-down fs-6 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">
                        {t('merchant.common.exportExcel')}
                    </span>
                </button>
            </>
        );

        // Cleanup: Remove actions when component unmounts
        return () => {
            setActions(null);
        };
    }, [activeFilterCount, filtersCollapsed, toggleFilters, handlePrintDashboard, handleExportExcel, handleRefresh, statisticsLoading, chartsLoading, latestTransactionsLoading, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    const latestTransactions = Array.isArray(latestTransactionsData) ? latestTransactionsData : [];

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handle period change for charts
    const handlePeriodChange = useCallback((period) => {
        if (period !== activePeriod) {
            setActivePeriod(period);
            // chartsData will automatically update via useMemo when activePeriod changes
        }
    }, [activePeriod]);

    // Handle apply filters - queries will automatically refetch when filters change
    const handleApplyFilters = () => {
        // Queries will automatically refetch when filters change due to queryKey dependencies
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setFilters({
            datetime_from: '',
            datetime_to: '',
            transaction_status: '',
            limit: 10
        });
    };

    if (!isMerchantApproved && !profileLoading) {
        return null;
    }

    // Handle errors
    useEffect(() => {
        if (error) {
            const errorMsg = error.response?.data?.message || error.message || t('merchant.dashboard.loadError');
            if (error.response?.status === 401) {
                toast.error(t('merchant.dashboard.sessionExpired'));
            } else {
                toast.error(errorMsg);
            }
        }
    }, [error, t]);

    if (error && !statisticsData && !chartsData && !latestTransactionsData && !statisticsLoading && !chartsLoading && !latestTransactionsLoading) {
        return (
            <div className="alert alert-danger m-5" role="alert">
                <h4 className="alert-heading">{t('merchant.dashboard.errorHeading')}</h4>
                <p>{error.response?.data?.message || error.message || t('merchant.dashboard.loadError')}</p>
                <hr />
                <button className="btn btn-danger" onClick={handleRefresh}>
                    {t('merchant.dashboard.tryAgain')}
                </button>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
            `}</style>
            
            {/* Filters Section */}
            <DashboardFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                isCollapsed={filtersCollapsed}
            />

            {/* Statistics Cards */}
            <DashboardStatistics 
                data={statisticsData}
                loading={statisticsLoading || profileLoading}
            />

            {/* Transaction Charts */}
            <div className="row gy-5 gx-xl-10">
                <div className="col-xl-12 mb-5 mb-xl-10">
                    <DashboardCharts 
                        data={chartsData}
                        todayStats={chartsData?.todayStats}
                        hasRange={!!(filters.datetime_from || filters.datetime_to)}
                        loading={chartsLoading || !chartsData}
                        activePeriod={activePeriod}
                        onPeriodChange={handlePeriodChange}
                    />
                </div>
            </div>

            {/* Latest Transactions Table */}
            <div className="row gy-5 g-xl-10">
                <div className="col-xl-12">
                    <DashboardLatestTransactions 
                        transactions={latestTransactions}
                        limit={filters.limit}
                        onLimitChange={(newLimit) => handleFilterChange({ limit: newLimit })}
                        loading={latestTransactionsLoading}
                    />
                </div>
            </div>
        </>
    );
};

export default MerchantDashboard;

