import React from 'react';
import PurchaseTableRow from './PurchaseTableRow';
import Pagination from '../../common/Pagination';

const PurchasesTable = ({
    purchases,
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
            const allIds = purchases.map(purchase => purchase.id);
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
                                        checked={purchases.length > 0 && selectedIds.length === purchases.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <th 
                                className="min-w-100px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('id')}
                            >
                                <span className="d-flex align-items-center">
                                    ID {getSortIcon('id')}
                                </span>
                            </th>
                            <th 
                                className="min-w-125px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('date')}
                            >
                                <span className="d-flex align-items-center">
                                    Date {getSortIcon('date')}
                                </span>
                            </th>
                            <th 
                                className="min-w-150px"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('reference_no')}
                            >
                                <span className="d-flex align-items-center">
                                    Reference {getSortIcon('reference_no')}
                                </span>
                            </th>
                            <th className="min-w-150px">Supplier</th>
                            <th 
                                className="min-w-125px text-end"
                                style={{cursor: 'pointer'}}
                                onClick={() => onSort('total')}
                            >
                                <span className="d-flex align-items-center justify-content-end">
                                    Grand Total {getSortIcon('total')}
                                </span>
                            </th>
                            <th className="min-w-125px text-end">Paid</th>
                            <th className="min-w-125px text-end">Due</th>
                            <th className="min-w-125px">Payment Status</th>
                            <th className="text-end min-w-100px">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {purchases.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="text-center py-5">
                                    <div className="text-gray-600 fs-5">No purchases found</div>
                                </td>
                            </tr>
                        ) : (
                            purchases.map((purchase) => (
                                <PurchaseTableRow
                                    key={purchase.id}
                                    purchase={purchase}
                                    onDelete={onDelete}
                                    basePath={basePath}
                                    selected={selectedIds.includes(purchase.id)}
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
                        Showing {purchases.length} of {pagination.total} purchases
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

export default PurchasesTable;

