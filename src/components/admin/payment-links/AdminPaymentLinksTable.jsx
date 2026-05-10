import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminPaymentLinkTableRow from './AdminPaymentLinkTableRow';

const AdminPaymentLinksTable = ({
    paymentLinks,
    pagination,
    loading,
    error,
    onPageChange,
    onPerPageChange,
    referenceData = {},
}) => {
    const { t } = useTranslation();
    const { merchantsMap = {}, countriesMap = {} } = referenceData;

    useEffect(() => {
        if (paymentLinks.length > 0 && typeof window.KTMenu !== 'undefined') {
            setTimeout(() => {
                window.KTMenu.createInstances();
            }, 100);
        }
    }, [paymentLinks]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('admin.common.loading')}</span>
                </div>
            </div>
        );
    }

    if (error) {
        const message = error?.response?.data?.message || error.message || t('admin.paymentLinksIndex.loadFailed');
        return (
            <div className="alert alert-danger" role="alert">
                {message}
            </div>
        );
    }

    if (!paymentLinks || paymentLinks.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="text-gray-600">{t('admin.paymentLinksIndex.noLinksFound')}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th>{t('admin.paymentLinksIndex.id')}</th>
                            <th>{t('admin.paymentLinksIndex.uuid')}</th>
                            <th>{t('admin.paymentLinksIndex.merchant')}</th>
                            <th>{t('admin.paymentLinksIndex.country')}</th>
                            <th>{t('admin.paymentLinksIndex.customer')}</th>
                            <th>{t('admin.paymentLinksIndex.amount')}</th>
                            <th>{t('admin.paymentLinksIndex.status')}</th>
                            <th>{t('admin.paymentLinksIndex.createdAt')}</th>
                            <th>{t('admin.paymentLinksIndex.scheduledDate')}</th>
                            <th>{t('admin.paymentLinksIndex.expiredDate')}</th>
                            <th className="text-end min-w-100px">{t('admin.paymentLinksIndex.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {paymentLinks.map((paymentLink) => (
                            <AdminPaymentLinkTableRow
                                key={paymentLink.id}
                                paymentLink={paymentLink}
                                merchantsMap={merchantsMap}
                                countriesMap={countriesMap}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

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
                        {t('admin.paymentLinksIndex.showingResults', {
                            from: paymentLinks.length > 0 ? ((pagination.current_page - 1) * pagination.per_page) + 1 : 0,
                            to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                            total: pagination.total
                        })}
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

                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                const showPage =
                                    page === 1 ||
                                    page === pagination.last_page ||
                                    (page >= pagination.current_page - 1 && page <= pagination.current_page + 1);

                                if (!showPage) {
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

export default AdminPaymentLinksTable;

