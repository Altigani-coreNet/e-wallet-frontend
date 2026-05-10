import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PaymentLinkTableRow from './PaymentLinkTableRow';

const PaymentLinksTable = ({
    paymentLinks,
    selectedIds,
    setSelectedIds,
    pagination,
    onPageChange,
    onPerPageChange,
    onRefresh,
    onReschedule,
    onSend,
    loading,
    error
}) => {
    const { t } = useTranslation();
    const skeletonRows = Array.from({ length: 6 }, (_, i) => i);
    const pageFrom = paymentLinks.length > 0 ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
    const pageTo = Math.min(pagination.current_page * pagination.per_page, pagination.total);
    // Initialize KTMenu when payment links change
    useEffect(() => {
        if (paymentLinks.length > 0 && typeof window.KTMenu !== 'undefined') {
            // Small delay to ensure DOM is fully rendered
            setTimeout(() => {
                window.KTMenu.createInstances();
            }, 100);
        }
    }, [paymentLinks]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paymentLinks.map(link => link.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAllSelected = paymentLinks.length > 0 && selectedIds.length === paymentLinks.length;

    if (loading) {
        return (
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="w-10px pe-2"></th>
                            <th>{t('merchant.paymentLinks.table.id')}</th>
                            <th>{t('merchant.paymentLinks.table.uuid')}</th>
                            <th>{t('merchant.paymentLinks.table.customer')}</th>
                            <th>{t('merchant.paymentLinks.table.amount')}</th>
                            <th>{t('merchant.paymentLinks.table.currency')}</th>
                            <th>{t('merchant.paymentLinks.table.status')}</th>
                            <th>{t('merchant.paymentLinks.table.createdAt')}</th>
                            <th>{t('merchant.paymentLinks.table.scheduledDate')}</th>
                            <th className="text-end min-w-100px">{t('merchant.paymentLinks.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {skeletonRows.map((row) => (
                            <tr key={`skeleton-${row}`}>
                                <td><span className="placeholder col-8"></span></td>
                                <td><span className="placeholder col-7"></span></td>
                                <td><span className="placeholder col-10"></span></td>
                                <td>
                                    <div className="placeholder-glow d-grid gap-1">
                                        <span className="placeholder col-8"></span>
                                        <span className="placeholder col-6"></span>
                                    </div>
                                </td>
                                <td><span className="placeholder col-6"></span></td>
                                <td><span className="placeholder col-5"></span></td>
                                <td><span className="placeholder col-7"></span></td>
                                <td><span className="placeholder col-9"></span></td>
                                <td><span className="placeholder col-7"></span></td>
                                <td className="text-end"><span className="placeholder col-6"></span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    if (paymentLinks.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="text-gray-600">{t('merchant.paymentLinks.table.empty')}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="payment-links-table">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="w-10px pe-2">
                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>
                            <th>{t('merchant.paymentLinks.table.id')}</th>
                            <th>{t('merchant.paymentLinks.table.uuid')}</th>
                            <th>{t('merchant.paymentLinks.table.customer')}</th>
                            <th>{t('merchant.paymentLinks.table.amount')}</th>
                            <th>{t('merchant.paymentLinks.table.currency')}</th>
                            <th>{t('merchant.paymentLinks.table.status')}</th>
                            <th>{t('merchant.paymentLinks.table.createdAt')}</th>
                            <th>{t('merchant.paymentLinks.table.scheduledDate')}</th>
                            <th className="text-end min-w-100px">{t('merchant.paymentLinks.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {paymentLinks.map(paymentLink => (
                            <PaymentLinkTableRow
                                key={paymentLink.id}
                                paymentLink={paymentLink}
                                isSelected={selectedIds.includes(paymentLink.id)}
                                onSelect={handleSelectOne}
                                onRefresh={onRefresh}
                                onReschedule={onReschedule}
                                onSend={onSend}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="row mt-4">
                <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                    <div className="dataTables_length">
                        <label>
                            <select
                                className="form-select form-select-sm form-select-solid"
                                value={pagination.per_page}
                                onChange={(e) => onPerPageChange(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </label>
                    </div>
                    <div className="dataTables_info ms-3">
                        {t('merchant.common.showingEntries', { from: pageFrom, to: pageTo, total: pagination.total })}
                    </div>
                </div>
                <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                    <div className="dataTables_paginate paging_simple_numbers">
                        <ul className="pagination">
                            <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                >
                                    <i className="previous"></i>
                                </button>
                            </li>

                            {/* Page numbers */}
                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => {
                                // Show first page, last page, current page, and pages around current
                                const showPage = 
                                    page === 1 ||
                                    page === pagination.last_page ||
                                    (page >= pagination.current_page - 1 && page <= pagination.current_page + 1);

                                if (!showPage) {
                                    // Show ellipsis
                                    if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                                        return (
                                            <li key={page} className="paginate_button page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                }

                                return (
                                    <li
                                        key={page}
                                        className={`paginate_button page-item ${pagination.current_page === page ? 'active' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => onPageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    </li>
                                );
                            })}

                            <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                >
                                    <i className="next"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentLinksTable;

