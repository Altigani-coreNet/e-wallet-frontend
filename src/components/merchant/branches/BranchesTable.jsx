import React from 'react';
import BranchTableRow from './BranchTableRow';
import Pagination from '../../common/Pagination';

const BranchesTable = ({ 
    branches = [], 
    selectedIds = [], 
    onSelectChange, 
    onRefresh,
    pagination = {},
    onPageChange,
    onPerPageChange 
}) => {
    // Ensure branches is always an array
    const safeBranches = Array.isArray(branches) ? branches : [];
    const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = safeBranches.map(branch => branch.id);
            onSelectChange(allIds);
        } else {
            onSelectChange([]);
        }
    };

    const handleSelectOne = (id, isSelected) => {
        if (isSelected) {
            onSelectChange([...safeSelectedIds, id]);
        } else {
            onSelectChange(safeSelectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const allSelected = safeBranches.length > 0 && safeSelectedIds.length === safeBranches.length;

    return (
        <>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="branches_table">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="w-10px pe-2">
                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>
                            <th className="text-dark">ID</th>
                            <th className="min-w-125px text-dark">Name</th>
                            <th className="min-w-125px text-dark">Address</th>
                            <th className="text-dark">Status</th>
                            <th className="text-dark">Created At</th>
                            <th className="text-end text-dark">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeBranches.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-10">
                                    <div className="d-flex flex-column align-items-center">
                                        <i className="ki-duotone ki-file-deleted fs-3x text-gray-400 mb-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <span className="text-gray-600 fs-5">No branches found</span>
                                        <span className="text-gray-400 fs-7 mt-2">Try adjusting your filters or create a new branch</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            safeBranches.map((branch) => (
                                <BranchTableRow
                                    key={branch.id}
                                    branch={branch}
                                    isSelected={safeSelectedIds.includes(branch.id)}
                                    onSelect={handleSelectOne}
                                    onRefresh={onRefresh}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {safeBranches.length > 0 && (
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

export default BranchesTable;


