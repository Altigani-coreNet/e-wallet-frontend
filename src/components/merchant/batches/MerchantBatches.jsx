import React from 'react';
import { useTranslation } from 'react-i18next';
import BatchFilters from './BatchFilters';
import BatchStatistics from './BatchStatistics';
import BatchActions from './BatchActions';
import { useMerchantBatches } from '../../../hooks/useMerchantBatches';
import useAuthStore from '../../../stores/authStore';
import { getBatchStatusColor } from '../../../utils/batchHelpers';

const SKELETON_STYLE = `
    .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
    }
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    .skeleton-text, .skeleton-badge, .skeleton-button { display: inline-block; }
`;

const MerchantBatches = ({ merchantId: propMerchantId }) => {
    const { t } = useTranslation();
    const { formatRecordCurrency } = useAuthStore();
    const {
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
    } = useMerchantBatches(propMerchantId);

    return (
        <>
            <style>{SKELETON_STYLE}</style>

            {showFilters && (
                <BatchFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                />
            )}

            {statisticsLoading ? (
                <div className="row g-5 g-xl-8 mb-5">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="col-sm-3">
                            <div className="card bg-light hoverable card-xl-stretch">
                                <div className="card-body text-center">
                                    <div className="skeleton" style={{ width: '80px', height: '48px', margin: '0 auto 10px' }} />
                                    <div className="skeleton" style={{ width: '140px', height: '18px', margin: '0 auto' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : statistics ? (
                <BatchStatistics statistics={statistics} />
            ) : null}

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
                                        className="min-w-100px text-center text-dark cursor-pointer"
                                        onClick={() => handleSort('status')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colStatus')} {getSortIcon('status')}
                                    </th>
                                    <th
                                        className="min-w-100px text-end text-dark cursor-pointer"
                                        onClick={() => handleSort('total_amount')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t('merchant.batches.colTotalAmount')} {getSortIcon('total_amount')}
                                    </th>
                                    <th
                                        className="min-w-100px text-end text-dark cursor-pointer"
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
                                    [...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }} /></td>
                                            <td className="text-center"><div className="skeleton skeleton-badge" style={{ width: '80px', height: '24px', borderRadius: '6px', margin: '0 auto' }} /></td>
                                            <td className="text-end"><div className="skeleton skeleton-text" style={{ width: '90px', height: '16px', marginLeft: 'auto' }} /></td>
                                            <td className="text-end"><div className="skeleton skeleton-text" style={{ width: '60px', height: '16px', marginLeft: 'auto' }} /></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '140px', height: '16px' }} /></td>
                                            <td className="text-end"><div className="skeleton skeleton-button" style={{ width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto' }} /></td>
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
                                            <td className="text-center">
                                                <span className={`badge badge-light-${getBatchStatusColor(batch.status)}`}>
                                                    {batchStatusLabel(batch.status)}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                {formatRecordCurrency(
                                                    batch.total_amount,
                                                    batch.toRecord ? batch.toRecord() : batch
                                                )}
                                            </td>
                                            <td className="text-end">{batch.transaction_count || 0}</td>
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
                                                type="button"
                                                className="page-link"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                {t('merchant.common.previous')}
                                            </button>
                                        </li>
                                        {paginationNumbers.map((page, index) =>
                                            page === '...' ? (
                                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            ) : (
                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                    <button
                                                        type="button"
                                                        className="page-link"
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            )
                                        )}
                                        <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                                            <button
                                                type="button"
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
