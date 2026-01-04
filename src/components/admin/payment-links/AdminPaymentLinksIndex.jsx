import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import {
    exportAdminPaymentLinks,
    useAdminPaymentLinks,
    useAdminPaymentLinkStatistics,
} from '../../../services/adminPaymentLinksService';
import AdminPaymentLinksFilters from './AdminPaymentLinksFilters';
import AdminPaymentLinkStatistics from './AdminPaymentLinkStatistics';
import AdminPaymentLinksTable from './AdminPaymentLinksTable';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';

const initialFilters = {
    search: '',
    customer: '',
    from_date: '',
    to_date: '',
    merchant_id: '',
    country_id: '',
};

const AdminPaymentLinksIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const {
        merchantsMap,
        countriesMap,
        loading: refDataLoading,
    } = useAdminReferenceData();

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });

    const handleExport = useCallback(async () => {
        try {
            const params = {
                ...appliedFilters,
                page: pagination.current_page,
                per_page: pagination.per_page,
            };
            const response = await exportAdminPaymentLinks(params);
            const contentType = response?.headers?.['content-type'] || '';
            let blob = response?.data;

            if (contentType.includes('application/json')) {
                const text = await blob.text();
                const payload = JSON.parse(text);
                const message = payload?.message || 'No payment links to export.';
                toast.info(message);
                return;
            }

            if (!blob || typeof blob.size === 'number' && blob.size === 0) {
                toast.info('No payment links to export.');
                return;
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `admin_payment_links_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            toast.success('Payment links exported successfully');
        } catch (error) {
            console.error('Error exporting payment links:', error);
            toast.error('Failed to export payment links');
        }
    }, [appliedFilters, pagination.current_page, pagination.per_page]);

    useEffect(() => {
        setTitle('Payment Links');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters((prev) => !prev)}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                    className="btn btn-sm btn-flex btn-light-primary fw-bold"
                    onClick={handleExport}
                >
                    <i className="ki-duotone ki-file-down fs-6 text-primary me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Export
                </button>
            </div>
        );

        return () => {
            setActions(null);
        };
    }, [setTitle, setActions, showFilters, handleExport]);

    const listParams = useMemo(() => ({
        page: pagination.current_page,
        per_page: pagination.per_page,
        ...appliedFilters,
    }), [pagination.current_page, pagination.per_page, appliedFilters]);

    const {
        data: paymentLinksResponse,
        isLoading,
        isFetching,
        error: paymentLinksError,
    } = useAdminPaymentLinks(listParams, {
        keepPreviousData: true,
    });

    const {
        data: statisticsResponse,
        isLoading: statisticsLoading,
        error: statisticsError,
    } = useAdminPaymentLinkStatistics(appliedFilters, {
        keepPreviousData: true,
    });

    useEffect(() => {
        if (!paymentLinksResponse) return;

        if (paymentLinksResponse.success === false || paymentLinksResponse.status === false) {
            const message = paymentLinksResponse.message || paymentLinksResponse.error || paymentLinksResponse.data?.message || 'Failed to load payment links';
            toast.error(message);
            return;
        }

        const payload = paymentLinksResponse.data || paymentLinksResponse;

        const paginationData = payload?.pagination;
        if (paginationData) {
            setPagination((prev) => ({
                ...prev,
                ...paginationData,
            }));
        } else {
            const meta = {
                current_page: payload?.current_page,
                per_page: payload?.per_page,
                total: payload?.total,
                last_page: payload?.last_page,
            };
            setPagination((prev) => ({
                ...prev,
                current_page: meta.current_page ?? prev.current_page,
                per_page: meta.per_page ?? prev.per_page,
                total: meta.total ?? prev.total,
                last_page: meta.last_page ?? prev.last_page,
            }));
        }
    }, [paymentLinksResponse]);

    useEffect(() => {
        if (!paymentLinksError) return;
        const message = paymentLinksError?.response?.data?.message || paymentLinksError.message || 'Failed to load payment links';
        toast.error(message);
    }, [paymentLinksError]);

    useEffect(() => {
        if (!statisticsError) return;
        const message = statisticsError?.response?.data?.message || statisticsError.message || 'Failed to load payment link statistics';
        toast.error(message);
    }, [statisticsError]);

    const paymentLinks = useMemo(() => {
        if (!paymentLinksResponse) return [];
        if (paymentLinksResponse.success === false || paymentLinksResponse.status === false) return [];

        const payload = paymentLinksResponse.data || paymentLinksResponse;
        const container = payload?.data || payload?.items || payload?.records || payload;

        if (Array.isArray(container)) {
            return container;
        }

        return Array.isArray(payload?.data) ? payload.data : [];
    }, [paymentLinksResponse]);

    const statistics = useMemo(() => {
        if (!statisticsResponse) return null;
        if (statisticsResponse.success === false || statisticsResponse.status === false) return null;
        return statisticsResponse.data || statisticsResponse;
    }, [statisticsResponse]);

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters });
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.last_page) return;
        setPagination((prev) => ({ ...prev, current_page: page }));
    };

    const handlePerPageChange = (perPage) => {
        setPagination((prev) => ({
            ...prev,
            per_page: perPage,
            current_page: 1,
        }));
    };

    const filtersCard = showFilters ? (
        <AdminPaymentLinksFilters
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            onClose={() => setShowFilters(false)}
            merchantsMap={merchantsMap}
            countriesMap={countriesMap}
        />
    ) : null;

    return (
        <>
            {filtersCard}

            <AdminPaymentLinkStatistics
                statistics={statistics}
                loading={statisticsLoading}
            />

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <h3 className="card-label">Payment Links</h3>
                    </div>
                </div>
                <div className="card-body pt-0">
                    <AdminPaymentLinksTable
                        paymentLinks={paymentLinks}
                        pagination={pagination}
                        loading={isLoading || isFetching}
                        error={paymentLinksError}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        referenceData={{
                            merchantsMap,
                            countriesMap,
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default AdminPaymentLinksIndex;

