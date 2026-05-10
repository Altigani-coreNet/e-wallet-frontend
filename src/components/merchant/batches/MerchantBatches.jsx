import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import BatchFilters from './BatchFilters';
import BatchStatistics from './BatchStatistics';
import BatchActions from './BatchActions';
import { useBatches, useBatchStatistics } from '../../../services/batchesService';
import useAuthStore from '../../../stores/authStore';
import { useToolbar } from '../../../contexts/ToolbarContext';

const MerchantBatches = ({ merchantId: propMerchantId }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    const [perPage, setPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Sort states
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        from_date: '',
        to_date: ''
    });
    
    const [showFilters, setShowFilters] = useState(false);

    // Use React Query hooks
    const { 
        data: batchesData, 
        isLoading: batchesLoading,
        refetch: refetchBatches
    } = useBatches(merchantId, currentPage, perPage, filters, sortBy, sortOrder);
    
    const { 
        data: statisticsData, 
        isLoading: statisticsLoading,
        refetch: refetchStatistics
    } = useBatchStatistics(merchantId);

    // Extracted data
    const batches = batchesData?.data || [];
    const totalRows = batchesData?.total || 0;
    const lastPage = batchesData?.last_page || 1;
    const statistics = statisticsData;

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        queryClient.invalidateQueries({ queryKey: ['batches'] });
        queryClient.invalidateQueries({ queryKey: ['batch-statistics'] });
        await refetchBatches();
        await refetchStatistics();
    }, [queryClient, refetchBatches, refetchStatistics]);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.batches'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.batches'), path: '/merchant/batches' },
            { label: t('merchant.breadcrumbs.batchesList'), path: '/merchant/batches', active: true }
        ]);
        
        setActions(
            <>
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
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
    }, [showFilters, batchesLoading, statisticsLoading, handleRefresh, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage) {
            setCurrentPage(page);
        }
    };

    // Handle rows per page change
    const handlePerRowsChange = (e) => {
        setPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Handle sort
    const handleSort = (column) => {
        if (sortBy === column) {
            // Toggle sort order if same column
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to ascending
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    // Get sort icon for column
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

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            from_date: '',
            to_date: ''
        });
        setCurrentPage(1);
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const statusColors = {
            'settled': 'success',
            'pending': 'warning',
            'failed': 'danger'
        };
        return statusColors[status?.toLowerCase()] || 'secondary';
    };

    // Generate pagination numbers
    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (lastPage <= maxVisible) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(lastPage);
            } else if (currentPage >= lastPage - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = lastPage - 3; i <= lastPage; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(lastPage);
            }
        }
        
        return pages;
    };

    const batchStatusLabel = (s) => {
        const m = { settled: 'statusSettled', pending: 'statusPending', failed: 'statusFailed' }[s?.toLowerCase()];
        return m ? t(`merchant.batches.${m}`) : (s ? s.charAt(0).toUpperCase() + s.slice(1) : t('merchant.common.na'));
    };

    const pageFrom = batches.length > 0 ? (currentPage - 1) * perPage + 1 : 0;
    const pageTo = Math.min(currentPage * perPage, totalRows);

    return (
        <>
            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }
                
                @keyframes skeleton-loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                
                .skeleton-text {
                    display: inline-block;
                }
                
                .skeleton-badge {
                    display: inline-block;
                }
                
                .skeleton-button {
                    display: inline-block;
                }
            `}</style>
            {/* Toolbar - Top */}
            {/* <div className="d-flex flex-wrap flex-stack mb-6">
                <h3 className="fw-bolder my-2">
                    Batches
                    <span className="fs-6 text-gray-400 fw-bold ms-1">({totalRows} total)</span>
                </h3>
            </div> */}

            {/* Filters */}
            {showFilters && (
                <BatchFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                />
            )}

            {/* Statistics - Separate loader */}
            {statisticsLoading ? (
                <div className="row g-5 g-xl-8 mb-5">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="col-sm-3">
                            <div className="card bg-light hoverable card-xl-stretch">
                                <div className="card-body text-center">
                                    <div className="skeleton" style={{width: '80px', height: '48px', margin: '0 auto 10px'}}></div>
                                    <div className="skeleton" style={{width: '140px', height: '18px', margin: '0 auto'}}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : statistics ? (
                <BatchStatistics statistics={statistics} />
            ) : null}

            {/* Table */}
            <div className="card">
                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-7 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('batch_number')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colBatchNumber')} {getSortIcon('batch_number')}
                                    </th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('status')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colStatus')} {getSortIcon('status')}
                                    </th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('total_amount')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colTotalAmount')} {getSortIcon('total_amount')}
                                    </th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('transaction_count')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colTransactionCount')} {getSortIcon('transaction_count')}
                                    </th>
                                    <th 
                                        className="text-dark cursor-pointer" 
                                        onClick={() => handleSort('created_at')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colCreatedTime')} {getSortIcon('created_at')}
                                    </th>
                                    <th className="text-end text-dark">{t('merchant.batches.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchesLoading ? (
                                    // Skeleton Loading Rows
                                    [...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton skeleton-text" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-badge" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '90px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '60px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '140px', height: '16px'}}></div></td>
                                            <td className="text-end"><div className="skeleton skeleton-button" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))
                                ) : batches.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-gray-500">
                                                <i className="ki-duotone ki-file fs-3x mb-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <p className="fw-bold">{t('merchant.batches.empty')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    batches.map((batch) => (
                                        <tr key={batch.id}>
                                            <td>{batch.batch_number || t('merchant.common.na')}</td>
                                            <td>
                                                <span className={`badge badge-light-${getStatusColor(batch.status)}`}>
                                                    {batchStatusLabel(batch.status)}
                                                </span>
                                            </td>
                                            <td>{batch.currency_symbol || '$'}{parseFloat(batch.total_amount || 0).toFixed(2)}</td>
                                            <td>{batch.transaction_count || 0}</td>
                                            <td>{batch.created_at || t('merchant.common.na')}</td>
                                            <td className="text-end">
                                                <BatchActions batch={batch} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!batchesLoading && batches.length > 0 && (
                        <div className="row mt-5">
                            <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                <div className="dataTables_length">
                                    <label className="d-flex align-items-center">
                                        <span className="me-2">{t('merchant.common.show')}</span>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={perPage}
                                            onChange={handlePerRowsChange}
                                            style={{ width: '75px' }}
                                        >
                                            <option value="10">10</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                        <span className="ms-2">{t('merchant.common.entries')}</span>
                                    </label>
                                </div>
                                <div className="ms-5">
                                    <span className="text-muted">
                                        {t('merchant.common.showingEntries', { from: pageFrom, to: pageTo, total: totalRows })}
                                    </span>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                <div className="dataTables_paginate">
                                    <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                {t('merchant.common.previous')}
                                            </button>
                                        </li>
                                        {getPaginationNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            ) : (
                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            )
                                        ))}
                                        <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === lastPage}
                                            >
                                                {t('merchant.common.next')}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MerchantBatches;

