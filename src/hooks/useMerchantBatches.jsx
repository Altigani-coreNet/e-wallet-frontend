import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useBatches, useBatchStatistics } from '../services/batchesService';
import useAuthStore from '../stores/authStore';
import { useToolbar } from '../contexts/ToolbarContext';
import {
    DEFAULT_BATCH_FILTERS,
    getBatchStatusLabel,
    getPageRange,
    getPaginationNumbers,
} from '../utils/batchHelpers';

/**
 * Merchant batches page logic (state, queries, toolbar, handlers).
 */
export function useMerchantBatches(propMerchantId) {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const merchantId =
        propMerchantId || merchant?.id || user?.merchant_id;

    const [perPage, setPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filters, setFilters] = useState({ ...DEFAULT_BATCH_FILTERS });
    const [showFilters, setShowFilters] = useState(false);

    const {
        data: batchesData,
        isLoading: batchesLoading,
        refetch: refetchBatches,
    } = useBatches(merchantId, currentPage, perPage, filters, sortBy, sortOrder);

    const {
        data: statistics,
        isLoading: statisticsLoading,
        refetch: refetchStatistics,
    } = useBatchStatistics(merchantId);

    const batches = batchesData?.data || [];
    const totalRows = batchesData?.total || 0;
    const lastPage = batchesData?.last_page || 1;
    const paginationNumbers = getPaginationNumbers(currentPage, lastPage);
    const { from: pageFrom, to: pageTo } = getPageRange(
        currentPage,
        perPage,
        totalRows,
        batches.length
    );

    const handleRefresh = useCallback(async () => {
        queryClient.invalidateQueries({ queryKey: ['batches'] });
        queryClient.invalidateQueries({ queryKey: ['batch-statistics'] });
        await refetchBatches();
        await refetchStatistics();
    }, [queryClient, refetchBatches, refetchStatistics]);

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.batches'));

        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.batches'), path: '/merchant/batches' },
            {
                label: t('merchant.breadcrumbs.batchesList'),
                path: '/merchant/batches',
                active: true,
            },
        ]);

        setActions(
            <>
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters((v) => !v)}
                    type="button"
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.filter')}
                </button>

                <button
                    className="btn btn-sm btn-flex btn-light fw-bold"
                    onClick={handleRefresh}
                    disabled={batchesLoading || statisticsLoading}
                    type="button"
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.refresh')}
                </button>
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [
        showFilters,
        batchesLoading,
        statisticsLoading,
        handleRefresh,
        setTitle,
        setBreadcrumbs,
        setActions,
        t,
        i18n.language,
    ]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage) {
            setCurrentPage(page);
        }
    };

    const handlePerRowsChange = (e) => {
        setPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ ...DEFAULT_BATCH_FILTERS });
        setCurrentPage(1);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    const batchStatusLabel = (status) => getBatchStatusLabel(status, t);

    const getSortIcon = (column) => {
        if (sortBy !== column) {
            return (
                <i className="ki-duotone ki-arrows-up-down fs-7 text-muted ms-1">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            );
        }
        return sortOrder === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-7 text-primary ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-7 text-primary ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    };

    return {
        batches,
        batchesLoading,
        statistics,
        statisticsLoading,
        filters,
        showFilters,
        perPage,
        currentPage,
        lastPage,
        totalRows,
        pageFrom,
        pageTo,
        paginationNumbers,
        handlePageChange,
        handlePerRowsChange,
        handleFilterChange,
        clearFilters,
        handleSort,
        batchStatusLabel,
        getSortIcon,
    };
}
