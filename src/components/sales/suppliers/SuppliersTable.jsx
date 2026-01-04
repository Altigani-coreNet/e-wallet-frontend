import React from 'react';
import SupplierTableRow from './SupplierTableRow';
import Pagination from '../../common/Pagination';

const SuppliersTable = ({
    suppliers,
    selectedIds,
    onSelectChange,
    onDelete,
    pagination,
    onPageChange,
    basePath,
    sortConfig,
    onSort,
    getSortIcon,
    isFetching
}) => {
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = suppliers.map(supplier => supplier.id);
            onSelectChange(allIds);
        } else {
            onSelectChange([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            onSelectChange([...selectedIds, id]);
        } else {
            onSelectChange(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    return (
        <>
            <div className="table-responsive" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                            <th className="w-10px pe-2">
                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={suppliers.length > 0 && selectedIds.length === suppliers.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <th 
                                className="min-w-200px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('name')}
                            >
                                <span className="d-flex align-items-center">
                                    Name {getSortIcon('name')}
                                </span>
                            </th>
                            <th 
                                className="min-w-150px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('email')}
                            >
                                <span className="d-flex align-items-center">
                                    Email {getSortIcon('email')}
                                </span>
                            </th>
                            <th 
                                className="min-w-125px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('phone')}
                            >
                                <span className="d-flex align-items-center">
                                    Phone {getSortIcon('phone')}
                                </span>
                            </th>
                            <th 
                                className="min-w-125px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('city')}
                            >
                                <span className="d-flex align-items-center">
                                    Location {getSortIcon('city')}
                                </span>
                            </th>
                            <th className="min-w-100px">Purchases</th>
                            <th className="text-end min-w-100px">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5">
                                    <div className="text-gray-600 fs-5">No suppliers found</div>
                                </td>
                            </tr>
                        ) : (
                            suppliers.map((supplier) => (
                                <SupplierTableRow
                                    key={supplier.id}
                                    supplier={supplier}
                                    onDelete={onDelete}
                                    basePath={basePath}
                                    selected={selectedIds.includes(supplier.id)}
                                    onSelectChange={handleSelectOne}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.last_page > 1 && (
                <div className="d-flex justify-content-between align-items-center pt-4">
                    <div className="text-muted">
                        Showing {suppliers.length} of {pagination.total} suppliers
                    </div>
                    <nav>
                        <ul className="pagination mb-0">
                            <li className={`page-item ${pagination.current_page === 1 || isFetching ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(Math.max(pagination.current_page - 1, 1))}
                                    disabled={pagination.current_page === 1 || isFetching}
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(Math.min(pagination.last_page, 10))].map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''} ${isFetching ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => onPageChange(pageNum)}
                                            disabled={isFetching}
                                        >
                                            {pageNum}
                                        </button>
                                    </li>
                                );
                            })}
                            {pagination.last_page > 10 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                            <li className={`page-item ${pagination.current_page === pagination.last_page || isFetching ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(Math.min(pagination.current_page + 1, pagination.last_page))}
                                    disabled={pagination.current_page === pagination.last_page || isFetching}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </>
    );
};

export default SuppliersTable;

