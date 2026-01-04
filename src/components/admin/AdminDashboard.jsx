import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';
import { ADMIN_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import { useToolbar } from '../../contexts/ToolbarContext';
import AdminDashboardStatistics from './dashboard/AdminDashboardStatistics';
import AdminDashboardFilters from './dashboard/AdminDashboardFilters';
import DashboardCharts from '../merchant/DashboardCharts';
import AdminLatestTransactions from './dashboard/AdminLatestTransactions';
import TerminalStatusWidget from './dashboard/TerminalStatusWidget';
import {
    fetchAdminDashboardOverview,
    fetchAdminDashboardTerminalStatus,
    fetchAdminDashboardCharts,
    fetchAdminDashboardLatestTransactions,
} from '../../services/adminDashboardService';

const createInitialFilters = () => ({
    datetime_from: '',
    datetime_to: '',
    transaction_status: '',
    limit: 10,
});

const AdminDashboard = () => {
    const { setTitle, setActions } = useToolbar();
    const queryClient = useQueryClient();

    const [filtersCollapsed, setFiltersCollapsed] = useState(() => (
        localStorage.getItem('adminDashboardFiltersCollapsed') === 'true'
    ));
    const [filters, setFilters] = useState(() => createInitialFilters());
    const [appliedFilters, setAppliedFilters] = useState(() => createInitialFilters());
    const [exporting, setExporting] = useState(false);
    const [chartPeriod, setChartPeriod] = useState('daily');
    const [terminalDetails, setTerminalDetails] = useState({});
    const [terminalDetailsLoading, setTerminalDetailsLoading] = useState(false);
    const terminalFetchQueue = useRef(new Set());
    const dashboardContentRef = useRef(null);

    const filtersForData = useMemo(() => {
        const { limit, ...rest } = appliedFilters;
        return rest;
    }, [appliedFilters]);

    const transactionsLimit = appliedFilters.limit;

    const overviewQuery = useQuery({
        queryKey: ['admin-dashboard-overview', filtersForData],
        queryFn: () => fetchAdminDashboardOverview(filtersForData),
        keepPreviousData: true,
        onError: (err) => {
            const message = err?.response?.data?.message || err?.message || 'Failed to load dashboard summary.';
            toast.error(message);
        },
    });

    const terminalStatusQuery = useQuery({
        queryKey: ['admin-dashboard-terminal-status', filtersForData],
        queryFn: () => fetchAdminDashboardTerminalStatus(filtersForData),
        keepPreviousData: true,
        onError: (err) => {
            const message = err?.response?.data?.message || err?.message || 'Failed to load terminal status.';
            toast.error(message);
        },
    });

    const chartsQuery = useQuery({
        queryKey: ['admin-dashboard-charts', filtersForData, chartPeriod],
        queryFn: () => fetchAdminDashboardCharts({ ...filtersForData, period: chartPeriod }),
        keepPreviousData: true,
        onError: (err) => {
            const message = err?.response?.data?.message || err?.message || 'Failed to load dashboard charts.';
            toast.error(message);
        },
    });

    const latestTransactionsQuery = useQuery({
        queryKey: ['admin-dashboard-latest-transactions', appliedFilters],
        queryFn: () => fetchAdminDashboardLatestTransactions(appliedFilters),
        keepPreviousData: true,
        onError: (err) => {
            const message = err?.response?.data?.message || err?.message || 'Failed to load latest transactions.';
            toast.error(message);
        },
    });

    const isOverviewLoading = overviewQuery.isLoading || overviewQuery.isFetching;
    const isTerminalStatusLoading = terminalStatusQuery.isLoading || terminalStatusQuery.isFetching;
    const isChartsLoading = chartsQuery.isLoading || chartsQuery.isFetching;
    const isLatestTransactionsLoading =
        latestTransactionsQuery.isLoading ||
        latestTransactionsQuery.isFetching ||
        terminalDetailsLoading;
    const queryStates = [overviewQuery, terminalStatusQuery, chartsQuery, latestTransactionsQuery];
    const isRefreshing = queryStates.some((query) => query.isFetching && !query.isLoading);

    const hasAppliedRange = useMemo(
        () => Boolean(appliedFilters.datetime_from || appliedFilters.datetime_to),
        [appliedFilters.datetime_from, appliedFilters.datetime_to]
    );

    useEffect(() => {
        if (hasAppliedRange && chartPeriod !== 'daily') {
            setChartPeriod('daily');
        }
    }, [hasAppliedRange, chartPeriod]);

    useEffect(() => {
        setTitle('Admin Dashboard');
    }, [setTitle]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (appliedFilters.datetime_from) count++;
        if (appliedFilters.datetime_to) count++;
        if (appliedFilters.transaction_status) count++;
        return count;
    }, [
        appliedFilters.datetime_from,
        appliedFilters.datetime_to,
        appliedFilters.transaction_status,
    ]);

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
        setChartPeriod('daily');
    }, [filters]);

    const handleClearFilters = useCallback(() => {
        const resetFilters = createInitialFilters();
        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
        setChartPeriod('daily');
    }, []);

    const handleTransactionLimitChange = useCallback((newLimit) => {
        setAppliedFilters((prev) => ({ ...prev, limit: newLimit }));
    }, []);

    const resolveTerminalId = useCallback((transaction) => {
        if (!transaction) {
            return null;
        }
        return (
            transaction.terminal_id ??
            transaction.terminalId ??
            transaction.terminal_uuid ??
            transaction.terminal?.id ??
            transaction.terminal?.terminal_id ??
            null
        );
    }, []);

    useEffect(() => {
        const latestData = latestTransactionsQuery.data;
        if (!latestData) {
            return;
        }

        const combinedTransactions = [
            ...(latestData.sales || []),
            ...(latestData.refunds || []),
            ...(latestData.voids || []),
        ];

        if (!combinedTransactions.length) {
            return;
        }

        const uniqueTerminalIds = Array.from(
            new Set(
                combinedTransactions
                    .map(resolveTerminalId)
                    .filter(Boolean)
            )
        );

        if (!uniqueTerminalIds.length) {
            return;
        }

        const missingTerminalIds = uniqueTerminalIds.filter(
            (id) =>
                terminalDetails[id] === undefined &&
                !terminalFetchQueue.current.has(id)
        );

        if (!missingTerminalIds.length) {
            return;
        }

        const token = getToken();
        if (!token) {
            return;
        }

        missingTerminalIds.forEach((id) => terminalFetchQueue.current.add(id));
        let cancelled = false;
        setTerminalDetailsLoading(true);

        const fetchTerminalDetails = async () => {
            try {
                const results = await Promise.all(
                    missingTerminalIds.map(async (id) => {
                        try {
                            const response = await fetch(ADMIN_ENDPOINTS.TERMINAL_DETAILS(id), {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    Accept: 'application/json',
                                },
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to fetch terminal ${id}`);
                            }

                            const payload = await response.json();
                            return [id, payload.data || payload];
                        } catch (error) {
                            console.error('AdminDashboard terminal fetch error:', error);
                            return [id, null];
                        }
                    })
                );

                if (cancelled) {
                    return;
                }

                setTerminalDetails((prev) => {
                    const next = { ...prev };
                    results.forEach(([id, detail]) => {
                        if (detail) {
                            next[id] = detail;
                        } else if (!(id in next)) {
                            next[id] = null;
                        }
                    });
                    return next;
                });
            } finally {
                missingTerminalIds.forEach((id) => terminalFetchQueue.current.delete(id));
                if (!cancelled) {
                    setTerminalDetailsLoading(false);
                }
            }
        };

        fetchTerminalDetails();

        return () => {
            cancelled = true;
        };
    }, [latestTransactionsQuery.data, resolveTerminalId, terminalDetails]);

    const enrichedLatestTransactions = useMemo(() => {
        const latest = latestTransactionsQuery.data;
        if (!latest) {
            return {
                sales: [],
                refunds: [],
                voids: [],
            };
        }

        const enhance = (list = []) =>
            list.map((transaction) => {
                const terminalId = resolveTerminalId(transaction);
                const detail = terminalId ? terminalDetails[terminalId] : undefined;

                if (!detail) {
                    return transaction;
                }

                return {
                    ...transaction,
                    terminal: {
                        ...(transaction.terminal || {}),
                        ...detail,
                    },
                };
            });

        return {
            sales: enhance(latest.sales),
            refunds: enhance(latest.refunds),
            voids: enhance(latest.voids),
        };
    }, [latestTransactionsQuery.data, terminalDetails, resolveTerminalId]);

    const handleExportExcel = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            setExporting(true);

            const params = new URLSearchParams();
            if (appliedFilters.datetime_from) params.append('datetime_from', appliedFilters.datetime_from);
            if (appliedFilters.datetime_to) params.append('datetime_to', appliedFilters.datetime_to);
            if (appliedFilters.transaction_status) params.append('transaction_status', appliedFilters.transaction_status);
            if (appliedFilters.limit) params.append('limit', appliedFilters.limit.toString());

            const exportUrl = `${ADMIN_ENDPOINTS.DASHBOARD_EXPORT}?${params.toString()}`;

            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv, application/csv, */*',
                },
                credentials: 'include',
            });

            // Check content type first
            const contentType = response.headers.get('content-type') || '';
            
            if (!response.ok) {
                // Try to parse error message from response
                let errorMessage = 'Failed to export dashboard data';
                try {
                    if (contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } else {
                        errorMessage = response.statusText || errorMessage;
                    }
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Verify we got CSV, not JSON (shouldn't happen if response.ok, but check anyway)
            if (contentType.includes('application/json')) {
                // Backend returned JSON instead of CSV
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Export failed: Unexpected response format');
            }

            // Get the CSV blob
            const blob = await response.blob();
            
            // Get filename from Content-Disposition header or use default
            let filename = `admin_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Dashboard data exported successfully!');
        } catch (err) {
            console.error('Export error:', err);
            const errorMessage = err?.message || 'Failed to export dashboard data. Please try again.';
            toast.error(errorMessage);
        } finally {
            setExporting(false);
        }
    }, [appliedFilters]);

    const handlePrintDashboard = useCallback(async () => {
        try {
            if (!dashboardContentRef.current) {
                toast.error('Dashboard content not found');
                return;
            }

            toast.info('Generating PDF...');

            const element = dashboardContentRef.current;
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `admin_dashboard_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await html2pdf().set(opt).from(element).save();
            toast.success('Dashboard PDF generated successfully!');
        } catch (err) {
            console.error('Print error:', err);
            toast.error('Failed to generate PDF. Please try again.');
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard-overview'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard-terminal-status'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard-charts'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard-latest-transactions'] }),
            ]);
            toast.success('Dashboard data refreshed');
        } catch (err) {
            console.error('Refresh error:', err);
            toast.error('Failed to refresh dashboard data');
        }
    }, [queryClient]);

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
                    {activeFilterCount > 0 ? `Filters Active (${activeFilterCount})` : 'Toggle Filters'}
                </button>

                <button
                    className="btn btn-sm btn-light-primary"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Refresh all dashboard data"
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
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
                </button>
                
                <button
                    className="btn btn-sm btn-success"
                    onClick={handleExportExcel}
                    disabled={exporting}
                    title="Export dashboard data including charts, transactions, and statistics to Excel"
                >
                    <i className="ki-duotone ki-file-down fs-6 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {exporting ? 'Exporting...' : 'Export to Excel'}
                </button>
            </>
        );

        return () => {
            setActions(null);
        };
    }, [
        activeFilterCount,
        exporting,
        filtersCollapsed,
        handleExportExcel,
        handlePrintDashboard,
        handleRefresh,
        isRefreshing,
        setActions,
        toggleFilters,
    ]);

    if (overviewQuery.isError && !overviewQuery.data) {
        return (
            <div className="alert alert-danger m-5" role="alert">
                <h4 className="alert-heading">Error!</h4>
                <p>{overviewQuery.error?.response?.data?.message || overviewQuery.error?.message || 'Failed to load dashboard data.'}</p>
                <hr />
                <button className="btn btn-danger" onClick={() => overviewQuery.refetch()}>
                    Try Again
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
                loading={isOverviewLoading}
            />

            <div className="row gy-5 gx-xl-10">
                <div className="col-xl-8 mb-5 mb-xl-10">
                    <DashboardCharts 
                        data={chartsQuery.data?.chart}
                        todayStats={chartsQuery.data?.todayStats}
                        hasRange={hasAppliedRange}
                        loading={isChartsLoading}
                        activePeriod={chartPeriod}
                        onPeriodChange={setChartPeriod}
                    />
                </div>
                
                <div className="col-xl-4 mb-xl-10">
                    <TerminalStatusWidget
                        data={terminalStatusQuery.data}
                        loading={isTerminalStatusLoading}
                    />
                </div>
            </div>

            <div className="row gy-5 g-xl-10">
                <div className="col-xl-12">
                    <AdminLatestTransactions 
                        transactions={enrichedLatestTransactions}
                        limit={transactionsLimit}
                        onLimitChange={handleTransactionLimitChange}
                        loading={isLatestTransactionsLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

