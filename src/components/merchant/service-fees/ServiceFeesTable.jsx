import React from 'react';
import ServiceFeeTableRow from './ServiceFeeTableRow';
import Pagination from '../../common/Pagination';

const ServiceFeesTable = ({ 
    serviceFees = [], 
    pagination = {},
    onPageChange,
    onPerPageChange 
}) => {
    const safeFees = Array.isArray(serviceFees) ? serviceFees : [];

    return (
        <>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="service-fees-table">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="text-dark">ID</th>
                            <th className="min-w-200px text-dark">Name</th>
                            <th className="text-dark">Type</th>
                            <th className="text-dark">Fees</th>
                            <th className="text-dark">Description</th>
                            <th className="text-dark">Created At</th>
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
                                        <span className="text-gray-600 fs-5">No service fees found</span>
                                        <span className="text-gray-400 fs-7 mt-2">Try adjusting your filters</span>
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

