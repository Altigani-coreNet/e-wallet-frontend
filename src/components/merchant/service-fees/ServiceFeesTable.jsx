import React from 'react';
import { useTranslation } from 'react-i18next';
import ServiceFeeTableRow from './ServiceFeeTableRow';
import Pagination from '../../common/Pagination';

const ServiceFeesTable = ({ 
    serviceFees = [], 
    pagination = {},
    onPageChange,
    onPerPageChange 
}) => {
    const { t } = useTranslation();
    const safeFees = Array.isArray(serviceFees) ? serviceFees : [];

    return (
        <>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="service-fees-table">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="text-dark">{t('merchant.serviceFees.table.id')}</th>
                            <th className="min-w-200px text-dark">{t('merchant.serviceFees.table.name')}</th>
                            <th className="text-dark">{t('merchant.serviceFees.table.type')}</th>
                            <th className="text-dark">{t('merchant.serviceFees.table.fees')}</th>
                            <th className="text-dark">{t('merchant.serviceFees.table.description')}</th>
                            <th className="text-dark">{t('merchant.serviceFees.table.createdAt')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeFees.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-10">
                                    <div className="d-flex flex-column align-items-center">
                                        <i className="ki-duotone ki-file-deleted fs-3x text-gray-400 mb-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <span className="text-gray-600 fs-5">{t('merchant.serviceFees.emptyTitle')}</span>
                                        <span className="text-gray-400 fs-7 mt-2">{t('merchant.serviceFees.emptyHint')}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            safeFees.map((serviceFee) => (
                                <ServiceFeeTableRow
                                    key={serviceFee.id}
                                    serviceFee={serviceFee}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {safeFees.length > 0 && (
                <Pagination
                    currentPage={pagination.current_page || 1}
                    lastPage={pagination.last_page || 1}
                    perPage={pagination.per_page || 15}
                    total={pagination.total || 0}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                />
            )}
        </>
    );
};

export default ServiceFeesTable;

