import React from 'react';
import { useTranslation } from 'react-i18next';
import CustomerTableRow from './CustomerTableRow';

const CustomersTable = ({
    customers,
    selectedIds,
    onSelectChange,
    onDelete,
    pagination,
    onPageChange,
    basePath = '/merchant',
    sortConfig,
    onSort,
    getSortIcon,
    isFetching
}) => {
    const { t } = useTranslation();

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = customers.map(customer => customer.id);
            onSelectChange(allIds);
        } else {
            onSelectChange([]);
        }
    };

    const handleSelectRow = (id, checked) => {
        if (checked) {
            onSelectChange([...selectedIds, id]);
        } else {
            onSelectChange(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const isAllSelected = customers.length > 0 && selectedIds.length === customers.length;

    const generatePageNumbers = () => {
        const pages = [];
        const maxPages = pagination.last_page || pagination.lastPage || 1;
        const currentPage = pagination.current_page || pagination.currentPage || 1;
        
        let startPage = Math.max(1, currentPage - 3);
        let endPage = Math.min(maxPages, currentPage + 3);

        if (endPage - startPage < 6) {
            if (startPage === 1) {
                endPage = Math.min(maxPages, startPage + 6);
            } else if (endPage === maxPages) {
                startPage = Math.max(1, endPage - 6);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    const currentPage = pagination.current_page || pagination.currentPage || 1;
    const perPage = pagination.per_page || pagination.perPage || 15;
    const rangeStart = (currentPage - 1) * perPage + 1;
    const rangeEnd = Math.min(currentPage * perPage, pagination.total);

    return (
        <>
            <div className="table-responsive" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                    <thead>
                        <tr className="fw-bold text-muted">
                            <th className="w-25px">
                                <div className="form-check form-check-sm form-check-custom form-check-solid">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>
                            <th 
                                className="min-w-200px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('name')}
                            >
                                <span className="d-flex align-items-center">
                                    {t('customers.customer')} {getSortIcon('name')}
                                </span>
                            </th>
                            <th 
                                className="min-w-150px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('email')}
                            >
                                <span className="d-flex align-items-center">
                                    {t('common.email')} {getSortIcon('email')}
                                </span>
                            </th>
                            <th 
                                className="min-w-120px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('phone')}
                            >
                                <span className="d-flex align-items-center">
                                    {t('common.phone')} {getSortIcon('phone')}
                                </span>
                            </th>
                            <th className="min-w-150px">{t('customers.company')}</th>
                            <th className="min-w-100px">{t('customers.group')}</th>
                            <th className="min-w-100px">{t('customers.createdDate')}</th>
                            <th className="min-w-100px text-end">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-10">
                                    <div className="d-flex flex-column align-items-center">
                                        <i className="ki-duotone ki-file-deleted fs-3x text-gray-400 mb-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <span className="text-muted fs-5">{t('customers.noCustomersFound')}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <CustomerTableRow
                                    key={customer.id}
                                    customer={customer}
                                    isSelected={selectedIds.includes(customer.id)}
                                    onSelectChange={handleSelectRow}
                                    onDelete={onDelete}
                                    basePath={basePath}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {customers.length > 0 && pagination && (
                <div className="d-flex flex-stack flex-wrap pt-10">
                    <div className="fs-6 fw-semibold text-gray-700">
                        {t('common.showingFromToOfEntries', {
                            start: rangeStart,
                            end: rangeEnd,
                            total: pagination.total
                        })}
                    </div>

                    <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 || isFetching ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1 || isFetching}
                                aria-label={t('common.previous')}
                            >
                                <i className="ki-duotone ki-arrow-left fs-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </button>
                        </li>

                        {generatePageNumbers().map((page) => (
                            <li
                                key={page}
                                className={`page-item ${currentPage === page ? 'active' : ''} ${isFetching ? 'disabled' : ''}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(page)}
                                    disabled={isFetching}
                                >
                                    {page}
                                </button>
                            </li>
                        ))}

                        <li className={`page-item ${currentPage === (pagination.last_page || pagination.lastPage) || isFetching ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => onPageChange(Math.min(currentPage + 1, (pagination.last_page || pagination.lastPage)))}
                                disabled={currentPage === (pagination.last_page || pagination.lastPage) || isFetching}
                                aria-label={t('common.next')}
                            >
                                <i className="ki-duotone ki-arrow-right fs-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </>
    );
};

export default CustomersTable;
