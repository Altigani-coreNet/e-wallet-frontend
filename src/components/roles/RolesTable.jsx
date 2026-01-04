import React from 'react';
import RoleTableRow from './RoleTableRow';
import Pagination from '../common/Pagination';

const RolesTable = ({ 
    roles = [], // Default to empty array
    sortConfig, 
    onSort, 
    onDelete, 
    pagination,
    onPageChange,
    typeParam,
    basePath = '/sales',
}) => {
    const getSortIcon = (column) => {
        if (sortConfig.column !== column) {
            return (
                <i className="ki-duotone ki-arrow-up-down fs-5 ms-1 text-muted">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            );
        }

        return sortConfig.direction === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-5 ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
        );
    };

    // Ensure roles is an array
    const rolesArray = Array.isArray(roles) ? roles : [];

    if (rolesArray.length === 0) {
        return (
            <div className="text-center py-10">
                <i className="ki-duotone ki-file-deleted fs-3x text-muted mb-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <p className="text-muted fs-4">No roles found</p>
            </div>
        );
    }

    return (
        <>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="kt_roles_table">
                    <thead>
                        <tr className="text-start text-dark fw-bold fs-7 text-uppercase gs-0">
                            <th 
                                className="min-w-125px cursor-pointer"
                                onClick={() => onSort('id')}
                            >
                                <span className="d-flex align-items-center">
                                    ID {getSortIcon('id')}
                                </span>
                            </th>
                            <th 
                                className="min-w-125px cursor-pointer"
                                onClick={() => onSort('name')}
                            >
                                <span className="d-flex align-items-center">
                                    Name {getSortIcon('name')}
                                </span>
                            </th>
                            <th 
                                className="min-w-125px cursor-pointer"
                                onClick={() => onSort('permissions_count')}
                            >
                                <span className="d-flex align-items-center">
                                    Permissions {getSortIcon('permissions_count')}
                                </span>
                            </th>
                            <th 
                                className="min-w-125px cursor-pointer"
                                onClick={() => onSort('created_at')}
                            >
                                <span className="d-flex align-items-center">
                                    Created At {getSortIcon('created_at')}
                                </span>
                            </th>
                            <th className="text-end min-w-100px">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="fw-semibold text-gray-600">
                        {rolesArray.map((role) => (
                            <RoleTableRow
                                key={role.id}
                                role={role}
                                onDelete={onDelete}
                                typeParam={typeParam}
                                basePath={basePath}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    lastPage={pagination.lastPage}
                    total={pagination.total}
                    perPage={pagination.perPage}
                    onPageChange={onPageChange}
                />
            )}
        </>
    );
};

export default RolesTable;

