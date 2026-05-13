import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useToolbar } from '../../contexts/ToolbarContext';
import AdminDashboardStatistics from './dashboard/AdminDashboardStatistics';
import AdminDashboardFilters from './dashboard/AdminDashboardFilters';
import SubscriptionWidget from './dashboard/SubscriptionWidget';
import {
    fetchAdminDashboardOverview,
    fetchAdminDashboardSubscriptions,
} from '../../services/adminDashboardService';

const createInitialFilters = () => ({
    datetime_from: '',
    datetime_to: '',
    limit: 10,
});

const AdminDashboard = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const queryClient = useQueryClient();

    const [filtersCollapsed, setFiltersCollapsed] = useState(() => (
        localStorage.getItem('adminDashboardFiltersCollapsed') === 'true'
    ));
    const [filters, setFilters] = useState(() => createInitialFilters());
    const [appliedFilters, setAppliedFilters] = useState(() => createInitialFilters());
    const dashboardContentRef = useRef(null);

    const filtersForData = useMemo(() => {
        const { limit, ...rest } = appliedFilters;
        return rest;
    }, [appliedFilters]);

    const overviewQuery = useQuery({
        queryKey: ['admin-dashboard-overview', filtersForData],
        queryFn: () => fetchAdminDashboardOverview(filtersForData),
        keepPreviousData: true,
        onError: (err) => {
            const message = err?.response?.data?.message || err?.message || t('admin.paymentGetway.failedLoadDashboardSummary');
            toast.error(message);
        },
    });

    const subscriptionsQuery = useQuery({
        queryKey: ['admin-dashboard-subscriptions', filtersForData],
        queryFn: () => fetchAdminDashboardSubscriptions(filtersForData),
        keepPreviousData: true,
        onError: (err) => {
            const message = err?.response?.data?.message || err?.message || t('admin.paymentGetway.failedLoadSubscriptionData');
            toast.error(message);
        },
    });

    const isOverviewLoading = overviewQuery.isLoading || overviewQuery.isFetching;
    const isSubscriptionsLoading = subscriptionsQuery.isLoading || subscriptionsQuery.isFetching;
    const queryStates = [overviewQuery, subscriptionsQuery];
    const isRefreshing = queryStates.some((query) => query.isFetching && !query.isLoading);

    useEffect(() => {
        setTitle(t('admin.paymentGetway.adminDashboardTitle'));
    }, [setTitle, t]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (appliedFilters.datetime_from) count++;
        if (appliedFilters.datetime_to) count++;
        return count;
    }, [appliedFilters.datetime_from, appliedFilters.datetime_to]);

    const toggleFilters = useCallback(() => {
        setFiltersCollapsed((prev) => {
            const newState = !prev;
            localStorage.setItem('adminDashboardFiltersCollapsed', newState.toString());
            return newState;
        });
    }, []);

    const handleFilterChange = useCallback((newFilters) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(() => ({ ...filters }));
    }, [filters]);

    const handleClearFilters = useCallback(() => {
        const resetFilters = createInitialFilters();
        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
    }, []);

    const handleRefresh = useCallback(async () => {
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard-overview'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard-subscriptions'] }),
            ]);
            toast.success(t('admin.paymentGetway.dashboardDataRefreshed'));
        } catch (err) {
            console.error('Refresh error:', err);
            toast.error(t('admin.paymentGetway.failedRefreshDashboardData'));
        }
    }, [queryClient, t]);

    useEffect(() => {
        setActions(
            <>
                <button
                    id="filters_button"
                    className={`btn btn-sm btn-flex fw-bold ${activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={toggleFilters}
                >
                    <i
                        className="ki-duotone ki-filter fs-6 me-1"
                        style={{
                            transform: filtersCollapsed ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                        }}
                    >
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {activeFilterCount > 0 ? t('admin.paymentGetway.filtersActive', { count: activeFilterCount }) : t('admin.paymentGetway.toggleFiltersToolbar')}
                </button>

                <button
                    className="btn btn-sm btn-light-primary"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title={t('admin.paymentGetway.refreshAllDashboardDataTitle')}
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {isRefreshing ? t('admin.paymentGetway.refreshing') : t('admin.paymentGetway.refresh')}
                </button>
            </>
        );

        return () => {
            setActions(null);
        };
    }, [
        activeFilterCount,
        filtersCollapsed,
        handleRefresh,
        isRefreshing,
        setActions,
        toggleFilters,
        t,
    ]);

    if (overviewQuery.isError && !overviewQuery.data) {
        return (
            <div className="alert alert-danger m-5" role="alert">
                <h4 className="alert-heading">{t('admin.paymentGetway.errorHeading')}</h4>
                <p>{overviewQuery.error?.response?.data?.message || overviewQuery.error?.message || t('admin.paymentGetway.failedLoadDashboardDataDot')}</p>
                <hr />
                <button className="btn btn-danger" onClick={() => overviewQuery.refetch()}>
                    {t('admin.paymentGetway.tryAgain')}
                </button>
            </div>
        );
    }

    return (
        <div ref={dashboardContentRef}>
            <AdminDashboardFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                isCollapsed={filtersCollapsed}
            />

            <AdminDashboardStatistics 
                data={overviewQuery.data}
                subscriptionData={subscriptionsQuery.data}
                loading={isOverviewLoading}
                subscriptionLoading={isSubscriptionsLoading}
            />

            <div className="row gy-5 g-xl-10">
                <div className="col-xl-12">
                    <SubscriptionWidget 
                        data={subscriptionsQuery.data}
                        loading={isSubscriptionsLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

